import ExpoModulesCore
import Foundation
import ImageIO
import PhotosUI
import UIKit
import UniformTypeIdentifiers

/// Errors cross the bridge as one closed code each, with a fixed reason: never a path, a file name or a system message
/// (NX-39-R50). JavaScript reads `code`: "photo_pick_failed" or "photo_reencode_failed".
final class ScribePhotoException: Exception, @unchecked Sendable {
  private let codeValue: String

  init(_ code: String) {
    self.codeValue = code
    super.init()
  }

  override var code: String { codeValue }
  override var reason: String { codeValue }

  static var pick: ScribePhotoException { ScribePhotoException("photo_pick_failed") }
  static var reencode: ScribePhotoException { ScribePhotoException("photo_reencode_failed") }
}

/// A refusal inside a helper both functions share; each function's catch turns it into its own closed code.
private struct Refused: Error {}

/// NS-01 (photo with a letter): the two native steps behind a picture, and nothing else.
///
/// pickOne: Apple's system photo picker, PHPickerViewController, made with PHPickerConfiguration() and no photo
/// library. It runs out of process, so the app makes no permission request and reads only the one picture the parent
/// chose (NS-01-R2, R22). One picker at a time; a picker UIKit never shows answers as a failure after 2 s. The picked
/// file is copied into Caches/ImagePicker, under the plain name JavaScript gives, before the provider's handler
/// returns. A Live Photo gives its still image; an iCloud-only picture downloads through the item provider. Cancel
/// resolves null.
///
/// reencodeUpright: reads ONE picked file in Caches/ImagePicker, refuses a container type outside the allowlist or a
/// canvas over the pixel cap before decoding, turns the pixels upright (the Exif turn is baked in) and writes a JPEG
/// into Caches/ScribePhoto, under the plain name JavaScript gives. No source property is copied, so no Exif, XMP, IPTC,
/// MPF, GPS or embedded thumbnail can follow. JavaScript checks the result again (strip.ts) before anything is stored.
///
/// Paths from JavaScript are not trusted: each must be a plain file name directly inside its Caches folder, worked out
/// here, and a folder is never removed or written over (review N-B1). No network, no location, no permission request,
/// no logging. DEVICE ONLY: this file cannot run in Node; the tests read it as source text (test/photos-device.test.ts).
public class ScribePhotoModule: Module {
  /// The longest side kept, in pixels. A phone photo is about 4000; this bounds the output and never enlarges.
  private static let longestSide = 4096
  private static let quality = 0.9
  /// The largest canvas decoded, read from the file's own properties before any decode: well above a 48 MP still.
  private static let maxPixels = 150_000_000
  /// The container types a picked still may be. Anything else (PDF, TIFF, RAW, GIF and the rest) is refused unread. A
  /// HEIF container may hold another codec, which ImageIO still decodes; that is accepted.
  private static let allowedTypes: Set<String> = [UTType.jpeg.identifier, UTType.heic.identifier, UTType.heif.identifier, UTType.png.identifier]
  /// How long UIKit gets to show the picker before it counts as refused (scribe-store's StoreSheet, security review L9).
  private static let presentTimeout: TimeInterval = 2.0

  public func definition() -> ModuleDefinition {
    Name("ScribePhoto")

    /// The destination file uri once the picked picture is copied there, or null when the parent cancelled.
    AsyncFunction("pickOne") { (destination: String) async throws -> String? in
      do {
        let out = try ScribePhotoModule.fileIn("ImagePicker", destination)
        guard let provider = try await self.presentPicker() else { return nil }
        try await ScribePhotoModule.copyPicked(from: provider, to: out)
        return destination
      } catch {
        throw ScribePhotoException.pick
      }
    }

    /// The destination file uri once an upright, metadata-free JPEG is written there.
    AsyncFunction("reencodeUpright") { (source: String, destination: String) throws -> String in
      do {
        try ScribePhotoModule.reencode(source, to: destination)
        return destination
      } catch {
        throw ScribePhotoException.reencode
      }
    }
  }

  // MARK: - paths

  /// `uri` as a file with a plain name directly inside `<Caches>/<folder>`, which is worked out here and created if
  /// needed. Dot segments are resolved and links followed before comparing; anything else throws.
  private static func fileIn(_ folder: String, _ uri: String) throws -> URL {
    let fm = FileManager.default
    let caches = try fm.url(for: .cachesDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
    let home = caches.appendingPathComponent(folder, isDirectory: true)
    try fm.createDirectory(at: home, withIntermediateDirectories: true)
    guard let url = URL(string: uri), url.isFileURL else { throw Refused() }
    let file = url.standardizedFileURL
    guard file.lastPathComponent.range(of: "^[0-9A-Za-z-]{1,64}\\.[0-9A-Za-z]{1,8}$", options: .regularExpression) != nil,
          file.deletingLastPathComponent().resolvingSymlinksInPath().path == home.resolvingSymlinksInPath().path else {
      throw Refused()
    }
    return file
  }

  /// Makes room for a new file at `out`: nothing there is fine and a regular file there is removed; a folder or a link
  /// refuses. A folder is never removed.
  private static func clear(_ out: URL) throws {
    let fm = FileManager.default
    guard let attributes = try? fm.attributesOfItem(atPath: out.path) else { return }
    guard attributes[.type] as? FileAttributeType == .typeRegular else { throw Refused() }
    try fm.removeItem(at: out)
  }

  /// Removes `out` only if it is a regular file (a partial copy, a failed JPEG). Never a folder.
  private static func removeIfFile(_ out: URL) {
    let fm = FileManager.default
    if (try? fm.attributesOfItem(atPath: out.path)[.type] as? FileAttributeType) == .typeRegular { try? fm.removeItem(at: out) }
  }

  // MARK: - pickOne

  @MainActor
  private func presentPicker() async throws -> NSItemProvider? {
    // One picker at a time, as scribe-store's StoreSheet: a second call is refused at once and presents nothing.
    guard PickerSession.current == nil else { throw ScribePhotoException.pick }
    // A presenter on its way out, or already showing something, would refuse the picker and never call back.
    guard let presenter = appContext?.utilities?.currentViewController(),
          !presenter.isBeingDismissed, presenter.presentedViewController == nil,
          presenter.viewIfLoaded?.window != nil else {
      throw ScribePhotoException.pick
    }
    var configuration = PHPickerConfiguration()
    configuration.filter = .images
    configuration.selectionLimit = 1
    configuration.preferredAssetRepresentationMode = .current
    let picker = PHPickerViewController(configuration: configuration)
    return try await withCheckedThrowingContinuation { continuation in
      // The body runs synchronously on the caller's actor (main); say so for older toolchains.
      MainActor.assumeIsolated {
        let session = PickerSession(continuation)
        picker.delegate = session
        picker.presentationController?.delegate = session
        presenter.present(picker, animated: true) {
          session.shown = true
        }
        // Never stuck: if UIKit refuses the presentation, no delegate call ever comes, so a watchdog checks that the
        // picker really appeared and otherwise answers with the closed code, which frees the session for the next tap.
        Task { @MainActor [weak session, weak picker] in
          try? await Task.sleep(nanoseconds: UInt64(ScribePhotoModule.presentTimeout * 1_000_000_000))
          guard let session, PickerSession.current === session, !session.shown, picker?.presentingViewController == nil else { return }
          session.refuse()
        }
      }
    }
  }

  /// Copies the picked still to `out`. The file the provider hands over exists only until its handler returns.
  private static func copyPicked(from provider: NSItemProvider, to out: URL) async throws {
    guard provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) else { throw ScribePhotoException.pick }
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      _ = provider.loadFileRepresentation(forTypeIdentifier: UTType.image.identifier) { url, error in
        do {
          guard let url, error == nil else { throw ScribePhotoException.pick }
          try ScribePhotoModule.clear(out)
          try FileManager.default.copyItem(at: url, to: out)
          continuation.resume()
        } catch {
          // A partial original, location and all, never stays (NS-01-R17).
          ScribePhotoModule.removeIfFile(out)
          continuation.resume(throwing: ScribePhotoException.pick)
        }
      }
    }
  }

  // MARK: - reencodeUpright

  private static func reencode(_ sourceUri: String, to destinationUri: String) throws {
    let url = try fileIn("ImagePicker", sourceUri)
    let out = try fileIn("ScribePhoto", destinationUri)
    try autoreleasepool {
      let noCache = [kCGImageSourceShouldCache: false] as CFDictionary
      guard let source = CGImageSourceCreateWithURL(url as CFURL, noCache),
            CGImageSourceGetStatus(source) == .statusComplete,
            let type = CGImageSourceGetType(source).map({ $0 as String }), allowedTypes.contains(type) else {
        throw ScribePhotoException.reencode
      }
      // The picture the parent saw: the primary image of a HEIF container, 0 for every other format.
      let index = CGImageSourceGetPrimaryImageIndex(source)
      guard index < CGImageSourceGetCount(source), CGImageSourceGetStatusAtIndex(source, index) == .statusComplete else {
        throw ScribePhotoException.reencode
      }
      // Read from the source only to size the decode: its width and height, nothing else.
      let props = CGImageSourceCopyPropertiesAtIndex(source, index, noCache) as? [CFString: Any]
      let width = (props?[kCGImagePropertyPixelWidth] as? Int) ?? 0
      let height = (props?[kCGImagePropertyPixelHeight] as? Int) ?? 0
      let (pixels, overflow) = width.multipliedReportingOverflow(by: height)
      guard width > 0, height > 0, !overflow, pixels <= maxPixels else { throw ScribePhotoException.reencode }

      // A thumbnail request is how ImageIO applies the orientation (WithTransform) and ignores any embedded thumbnail
      // (FromImageAlways). Sized to the picture itself, capped, so nothing is made bigger.
      let decode: [CFString: Any] = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceCreateThumbnailWithTransform: true,
        kCGImageSourceShouldCache: false,
        kCGImageSourceThumbnailMaxPixelSize: min(max(width, height), longestSide),
      ]
      guard let image = CGImageSourceCreateThumbnailAtIndex(source, index, decode as CFDictionary) else {
        throw ScribePhotoException.reencode
      }

      try clear(out)
      guard let dest = CGImageDestinationCreateWithURL(out as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
        throw ScribePhotoException.reencode
      }
      // Only the pixels and the colour space go in. No source properties are passed, so no metadata can follow.
      let write: [CFString: Any] = [
        kCGImageDestinationLossyCompressionQuality: quality,
        kCGImageMetadataShouldExcludeGPS: true,
        kCGImageMetadataShouldExcludeXMP: true,
      ]
      CGImageDestinationAddImage(dest, image, write as CFDictionary)
      guard CGImageDestinationFinalize(dest) else {
        removeIfFile(out)
        throw ScribePhotoException.reencode
      }
    }
  }
}

/// One presentation of the picker. It is held as `current` (the picker keeps its delegates weakly) until it answers,
/// exactly once: a pick, a Cancel, a swipe that dismisses the sheet, or the watchdog. While it is `current` no other
/// picker is presented. Both delegate protocols are main-actor, and so is this class.
@MainActor
private final class PickerSession: NSObject, PHPickerViewControllerDelegate, UIAdaptivePresentationControllerDelegate {
  static var current: PickerSession?

  private var continuation: CheckedContinuation<NSItemProvider?, Error>?
  var shown = false

  init(_ continuation: CheckedContinuation<NSItemProvider?, Error>) {
    self.continuation = continuation
    super.init()
    PickerSession.current = self
  }

  func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
    picker.dismiss(animated: true)
    finish(.success(results.first?.itemProvider))
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    finish(.success(nil))
  }

  /// UIKit never showed the picker: the call fails with its closed code.
  func refuse() {
    finish(.failure(ScribePhotoException.pick))
  }

  private func finish(_ result: Result<NSItemProvider?, Error>) {
    guard let continuation else { return }
    self.continuation = nil
    if PickerSession.current === self { PickerSession.current = nil }
    continuation.resume(with: result)
  }
}

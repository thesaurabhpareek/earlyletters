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

/// NS-01 (photo with a letter): the two native steps behind a picture, and nothing else.
///
/// pickOne: Apple's system photo picker, PHPickerViewController, made with PHPickerConfiguration() and no photo
/// library. It runs out of process, so the app needs no photo library or camera permission, asks nothing, and reads
/// only the one picture the parent chose (NS-01-R2, R22). The picked file is copied to the destination JavaScript
/// gives (inside Caches/ImagePicker) before the provider's handler returns. A Live Photo gives its still image; an
/// iCloud-only picture downloads through the item provider. Cancel resolves null.
///
/// reencodeUpright: reads ONE picked file, refuses a format outside the allowlist or a canvas over the pixel cap
/// before decoding, turns the pixels upright (the Exif turn is baked in) and writes a JPEG to the destination
/// JavaScript gives (inside Caches/ScribePhoto). No source property is copied, so no Exif, XMP, IPTC, MPF, GPS or
/// embedded thumbnail can follow. JavaScript checks the result again (strip.ts) before anything is stored.
///
/// No network, no location, no permission request, no logging. DEVICE ONLY: this file cannot run in Node; the tests
/// read it as source text (test/photos-device.test.ts).
public class ScribePhotoModule: Module {
  /// The longest side kept, in pixels. A phone photo is about 4000; this bounds the output and never enlarges.
  private static let longestSide = 4096
  private static let quality = 0.9
  /// The largest canvas decoded, read from the file's own properties before any decode: well above a 48 MP still.
  private static let maxPixels = 150_000_000
  /// The formats a picked still may be. Anything else (PDF, TIFF, RAW, GIF and the rest) is refused unread.
  private static let allowedTypes: Set<String> = [UTType.jpeg.identifier, UTType.heic.identifier, UTType.heif.identifier, UTType.png.identifier]

  public func definition() -> ModuleDefinition {
    Name("ScribePhoto")

    /// The destination file uri once the picked picture is copied there, or null when the parent cancelled.
    AsyncFunction("pickOne") { (destination: String) async throws -> String? in
      do {
        guard let out = URL(string: destination), out.isFileURL else { throw ScribePhotoException.pick }
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

  // MARK: - pickOne

  @MainActor
  private func presentPicker() async throws -> NSItemProvider? {
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
    return await withCheckedContinuation { continuation in
      // The body runs synchronously on the caller's actor (main); say so for older toolchains.
      MainActor.assumeIsolated {
        let session = PickerSession(continuation)
        picker.delegate = session
        picker.presentationController?.delegate = session
        presenter.present(picker, animated: true)
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
          let fm = FileManager.default
          try fm.createDirectory(at: out.deletingLastPathComponent(), withIntermediateDirectories: true)
          if fm.fileExists(atPath: out.path) { try fm.removeItem(at: out) }
          try fm.copyItem(at: url, to: out)
          continuation.resume()
        } catch {
          continuation.resume(throwing: ScribePhotoException.pick)
        }
      }
    }
  }

  // MARK: - reencodeUpright

  private static func reencode(_ sourceUri: String, to destinationUri: String) throws {
    guard let url = URL(string: sourceUri), url.isFileURL, let out = URL(string: destinationUri), out.isFileURL else {
      throw ScribePhotoException.reencode
    }
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
    guard width > 0, height > 0, width * height <= maxPixels else { throw ScribePhotoException.reencode }

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

    let fm = FileManager.default
    try fm.createDirectory(at: out.deletingLastPathComponent(), withIntermediateDirectories: true)
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
      try? fm.removeItem(at: out)
      throw ScribePhotoException.reencode
    }
  }
}

/// One presentation of the picker. It keeps itself alive until it has answered, and answers exactly once: a pick, a
/// Cancel, or a swipe that dismisses the sheet. Not actor-annotated, like expo-image-picker 57's own PHPicker delegate.
private final class PickerSession: NSObject, PHPickerViewControllerDelegate, UIAdaptivePresentationControllerDelegate {
  private var continuation: CheckedContinuation<NSItemProvider?, Never>?
  private var keepAlive: PickerSession?

  init(_ continuation: CheckedContinuation<NSItemProvider?, Never>) {
    self.continuation = continuation
    super.init()
    keepAlive = self
  }

  func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
    picker.dismiss(animated: true)
    finish(results.first?.itemProvider)
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    finish(nil)
  }

  private func finish(_ provider: NSItemProvider?) {
    continuation?.resume(returning: provider)
    continuation = nil
    keepAlive = nil
  }
}

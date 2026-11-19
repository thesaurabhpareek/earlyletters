import ExpoModulesCore
import Foundation
import ImageIO
import UniformTypeIdentifiers

/// NS-01 / NX-39-R8 / security review C8: the native step that makes the kept copy of a picture.
///
/// It reads ONE file the app already holds (the picker's temporary copy), turns the pixels upright (the Exif turn is
/// baked in, so the orientation tag is not needed after), and writes a JPEG with no Exif, XMP, IPTC, MPF, GPS or
/// embedded thumbnail. It is ImageIO only: no network, no permission, no Photos library, no camera, no location API.
/// The JS side then checks the result again (strip.ts) before anything is stored. Errors cross as one closed code;
/// no path or file name is ever put in a message.
///
/// DEVICE ONLY: this file cannot run in Node. It is listed for security-architect review in the PR (10 fixtures on a phone).
internal final class PhotoReencodeException: Exception {
  override var reason: String { "photo_reencode_failed" }
}

public class ScribePhotoModule: Module {
  /// The longest side kept, in pixels. A phone photo is about 4000; this bounds memory, never enlarges.
  private static let longestSide = 4096
  private static let quality = 0.9

  public func definition() -> ModuleDefinition {
    Name("ScribePhoto")

    /// file:// uri of an upright, metadata-free JPEG in Caches/ScribePhoto; the caller reads it and deletes it.
    AsyncFunction("reencodeUpright") { (uri: String) throws -> String in
      guard let url = URL(string: uri), url.isFileURL else { throw PhotoReencodeException() }
      guard let source = CGImageSourceCreateWithURL(url as CFURL, nil), CGImageSourceGetCount(source) > 0 else {
        throw PhotoReencodeException()
      }
      let props = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]
      let width = (props?[kCGImagePropertyPixelWidth] as? Int) ?? 0
      let height = (props?[kCGImagePropertyPixelHeight] as? Int) ?? 0
      let longest = max(width, height)
      guard longest > 0 else { throw PhotoReencodeException() }

      // A thumbnail request is how ImageIO applies the orientation (WithTransform) and ignores any embedded thumbnail
      // (FromImageAlways). Sized to the picture itself, capped, so nothing is made bigger.
      let decode: [CFString: Any] = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceCreateThumbnailWithTransform: true,
        kCGImageSourceShouldCacheImmediately: true,
        kCGImageSourceThumbnailMaxPixelSize: min(longest, ScribePhotoModule.longestSide),
      ]
      guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, decode as CFDictionary) else {
        throw PhotoReencodeException()
      }

      let fm = FileManager.default
      let caches = try fm.url(for: .cachesDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
      let folder = caches.appendingPathComponent("ScribePhoto", isDirectory: true)
      try fm.createDirectory(at: folder, withIntermediateDirectories: true)
      let out = folder.appendingPathComponent(UUID().uuidString + ".jpg")

      guard let dest = CGImageDestinationCreateWithURL(out as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
        throw PhotoReencodeException()
      }
      // Only the pixels and the colour space go in. No source properties are copied, so no metadata can follow.
      let write: [CFString: Any] = [
        kCGImageDestinationLossyCompressionQuality: ScribePhotoModule.quality,
        kCGImageMetadataShouldExcludeGPS: true,
        kCGImageMetadataShouldExcludeXMP: true,
      ]
      CGImageDestinationAddImage(dest, image, write as CFDictionary)
      guard CGImageDestinationFinalize(dest) else {
        try? fm.removeItem(at: out)
        throw PhotoReencodeException()
      }
      return out.absoluteString
    }
  }
}

import ExpoModulesCore
import Foundation

/// ADR 0001: Whisper model files live in Application Support with iCloud
/// backup excluded (they are large and re-downloadable; iOS Data Storage
/// Guidelines). Recordings are NOT excluded: they stay in the device backup
/// (docs/DECISIONS.md D-033, TDD 01 OQ-5).
public class ScribeFilesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ScribeFiles")

    /// file:// URI of Application Support/models/, created if missing and
    /// marked excluded from backup. Throws if either step fails.
    Function("modelsDirectory") { () throws -> String in
      let fm = FileManager.default
      let support = try fm.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
      var models = support.appendingPathComponent("models", isDirectory: true)
      try fm.createDirectory(at: models, withIntermediateDirectories: true)
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try models.setResourceValues(values)
      return models.absoluteString
    }

    /// Whether a file or directory is excluded from iCloud and computer backups.
    Function("isExcludedFromBackup") { (uri: String) throws -> Bool in
      guard let url = URL(string: uri) else { return false }
      return try url.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup ?? false
    }

    /// Marks one file excluded from backup (a downloaded model file, for example).
    Function("setExcludedFromBackup") { (uri: String, excluded: Bool) throws in
      guard var url = URL(string: uri) else { return }
      var values = URLResourceValues()
      values.isExcludedFromBackup = excluded
      try url.setResourceValues(values)
    }
  }
}

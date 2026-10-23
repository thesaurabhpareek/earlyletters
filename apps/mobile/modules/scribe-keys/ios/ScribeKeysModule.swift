import CryptoKit
import ExpoModulesCore
import Foundation
import Security

/// Errors carry a stable code and a fixed message: never a key, an id or a path (LEGAL-REQ-014).
final class ScribeKeysException: Exception, @unchecked Sendable {
  private let codeValue: String
  private let message: String

  init(_ code: String, _ message: String) {
    self.codeValue = code
    self.message = message
    super.init()
  }

  override var code: String { codeValue }
  override var reason: String { message }
}

/// This install's X25519 key pair for one account, and the random id registered with it.
/// This device only, never synced. The private key is the item's raw 32 bytes (kSecValueData);
/// the id is in kSecAttrGeneric, so no JSON or base64 copy of the key is ever made.
private struct DeviceItem {
  var id: String
  var sk: Data
}

/// Encrypted recording backup (WP-F08-B2; ADR 0024). Long-lived secrets stay here:
/// book keys never leave this module except sealed (HPKE to the escrow key) and
/// the device private key never leaves it at all. JavaScript gets wrapped keys,
/// public keys and the per-recording file keys it encrypts segments with.
///
/// - Book keys: kSecClassGenericPassword, kSecAttrSynchronizable true,
///   kSecAttrAccessibleWhenUnlocked (iCloud Keychain carries them to the person's
///   other devices; readable only while the phone is unlocked, because every
///   backup step runs in the foreground). One item per version,
///   account `<profile_id>:<child_id>:v<n>`, value the key's 32 raw bytes: iCloud
///   resolves conflicts per item, so a sync can never drop one version while
///   writing another, and creating a version is a single atomic add.
/// - Device keys: one per (install, account), service `scribe.backup.device`,
///   account `<profile_id>`, kSecAttrSynchronizable false,
///   kSecAttrAccessibleWhenUnlockedThisDeviceOnly (never in a backup, never on
///   another phone, F08-REQ-027). The server ties a device id to one account, so a
///   second account on this phone gets its own pair.
/// - `deleteBookKeys` deletes synchronizable items, which removes them from every
///   device on that Apple Account (iCloud Keychain). Only "delete the backup"
///   (WP-F08-B5d) may call it, and it must say so.
/// - Items use the app's default access group. A later Keychain sharing group (a
///   widget or an extension) must keep the app's own group first in
///   `keychain-access-groups`, or the app stops finding these items.
/// - HPKE base mode, DHKEM(X25519, HKDF-SHA256), HKDF-SHA256, AES-256-GCM
///   (RFC 9180), iOS 17 and later. `isSupported` is false before that.
public class ScribeKeysModule: Module {
  private static let deviceService = "scribe.backup.device"
  /// Read-modify-write of an item must not interleave; async functions may run concurrently.
  private static let lock = NSLock()

  /// One purpose per key (review A note 3 on #150): the file-key wrap and the key check each use a
  /// subkey of the book key, HKDF-SHA256 with no salt and one of these labels as info. The same
  /// strings are BOOK_SUBKEY_INFO in lib/backup/contract.ts. Fixed from the first stored key.
  private static let fileKeyWrapInfo = "scribe/backup/v1/subkey/file-key-wrap"
  private static let keyCheckInfo = "scribe/backup/v1/subkey/key-check"

  private static func subkey(_ key: SymmetricKey, _ info: String) -> SymmetricKey {
    HKDF<SHA256>.deriveKey(inputKeyMaterial: key, info: Data(info.utf8), outputByteCount: 32)
  }

  @available(iOS 17.0, *)
  private static func suite() -> HPKE.Ciphersuite {
    HPKE.Ciphersuite(kem: .Curve25519_HKDF_SHA256, kdf: .HKDF_SHA256, aead: .AES_GCM_256)
  }

  public func definition() -> ModuleDefinition {
    Name("ScribeKeys")

    Function("isSupported") { () -> Bool in
      if #available(iOS 17.0, *) { return true }
      return false
    }

    /// file:// URI of Application Support/backup-tmp/: excluded from device backup,
    /// complete-until-first-user-authentication protection (F08-REQ-013, F08-REQ-082).
    Function("backupTmpDirectory") { () throws -> String in
      let fm = FileManager.default
      let support = try fm.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
      var dir = support.appendingPathComponent("backup-tmp", isDirectory: true)
      try fm.createDirectory(
        at: dir,
        withIntermediateDirectories: true,
        attributes: [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication]
      )
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try dir.setResourceValues(values)
      return dir.absoluteString
    }

    // ── Device key ─────────────────────────────────────────────────────────

    AsyncFunction("deviceKey") { (profileId: String) throws -> [String: Any]? in
      let account = try Self.profileAccount(profileId)
      Self.lock.lock()
      defer { Self.lock.unlock() }
      guard var item = try Self.readDevice(account) else { return nil }
      defer { item.sk.resetBytes(in: 0..<item.sk.count) }
      return ["deviceId": item.id, "publicKey": try Self.devicePrivateKey(item).publicKey.rawRepresentation]
    }

    AsyncFunction("createDeviceKey") { (profileId: String) throws -> [String: Any] in
      let account = try Self.profileAccount(profileId)
      Self.lock.lock()
      defer { Self.lock.unlock() }
      if var item = try Self.readDevice(account) {
        defer { item.sk.resetBytes(in: 0..<item.sk.count) }
        return ["deviceId": item.id, "publicKey": try Self.devicePrivateKey(item).publicKey.rawRepresentation]
      }
      let key = Curve25519.KeyAgreement.PrivateKey()
      let id = UUID().uuidString.lowercased()
      var raw = key.rawRepresentation
      defer { raw.resetBytes(in: 0..<raw.count) }
      try Self.addDevice(account: account, id: id, sk: raw)
      return ["deviceId": id, "publicKey": key.publicKey.rawRepresentation]
    }

    AsyncFunction("deleteDeviceKey") { (profileId: String) throws in
      let account = try Self.profileAccount(profileId)
      Self.lock.lock()
      defer { Self.lock.unlock() }
      try Self.delete(service: Self.deviceService, account: account, synchronizable: false)
    }

    // ── Book keys ──────────────────────────────────────────────────────────

    AsyncFunction("bookKeyVersions") { (service: String, account: String) throws -> [Int] in
      Self.lock.lock()
      defer { Self.lock.unlock() }
      return try Self.bookVersions(service, account)
    }

    AsyncFunction("createBookKey") { (service: String, account: String, version: Int) throws in
      guard version >= 1 else { throw ScribeKeysException("ERR_SCRIBE_KEYS_INPUT", "Bad key version") }
      Self.lock.lock()
      defer { Self.lock.unlock() }
      let key = SymmetricKey(size: .bits256)
      // A plain add: never replaces a version that is already here (or that iCloud brought meanwhile).
      try key.withUnsafeBytes { raw in
        try Self.add(service: service, account: Self.versioned(account, version), data: Data(raw), synchronizable: true)
      }
    }

    AsyncFunction("deleteBookKeys") { (service: String, account: String) throws in
      Self.lock.lock()
      defer { Self.lock.unlock() }
      for version in try Self.bookVersions(service, account) {
        try Self.delete(service: service, account: Self.versioned(account, version), synchronizable: true)
      }
    }

    /// HMAC-SHA256 under the book key's key-check subkey, first 16 bytes: proves which key a server row escrowed.
    AsyncFunction("bookKeyCheck") { (service: String, account: String, version: Int, label: Data) throws -> Data in
      let key = try Self.lockedBookKey(service, account, version)
      return Data(HMAC<SHA256>.authenticationCode(for: label, using: Self.subkey(key, Self.keyCheckInfo))).prefix(16)
    }

    /// AES-256-GCM of a 32-byte file key: nonce (12) || ciphertext (32) || tag (16).
    AsyncFunction("wrapFileKey") { (service: String, account: String, version: Int, fileKey: Data, aad: Data) throws -> Data in
      guard fileKey.count == 32 else { throw ScribeKeysException("ERR_SCRIBE_KEYS_INPUT", "A file key is 32 bytes") }
      let key = Self.subkey(try Self.lockedBookKey(service, account, version), Self.fileKeyWrapInfo)
      guard let combined = try AES.GCM.seal(fileKey, using: key, nonce: AES.GCM.Nonce(), authenticating: aad).combined else {
        throw ScribeKeysException("ERR_SCRIBE_KEYS_SEAL", "The key could not be wrapped")
      }
      return combined
    }

    AsyncFunction("unwrapFileKey") { (service: String, account: String, version: Int, wrapped: Data, aad: Data) throws -> Data in
      let key = Self.subkey(try Self.lockedBookKey(service, account, version), Self.fileKeyWrapInfo)
      do {
        let opened = try AES.GCM.open(try AES.GCM.SealedBox(combined: wrapped), using: key, authenticating: aad)
        guard opened.count == 32 else { throw ScribeKeysException("ERR_SCRIBE_KEYS_OPEN", "The key did not open") }
        return opened
      } catch {
        throw ScribeKeysException("ERR_SCRIBE_KEYS_OPEN", "The key did not open")
      }
    }

    /// Seals the book key to a recipient public key (the escrow key): enc (32) and ct (48).
    AsyncFunction("sealBookKey") {
      (service: String, account: String, version: Int, recipient: Data, info: Data, aad: Data) throws -> [String: Any] in
      guard #available(iOS 17.0, *) else { throw ScribeKeysException("ERR_SCRIBE_KEYS_UNSUPPORTED", "Needs iOS 17") }
      let key = try Self.lockedBookKey(service, account, version)
      let publicKey: Curve25519.KeyAgreement.PublicKey
      do {
        publicKey = try Curve25519.KeyAgreement.PublicKey(rawRepresentation: recipient)
      } catch {
        throw ScribeKeysException("ERR_SCRIBE_KEYS_INPUT", "Bad recipient key")
      }
      var sender = try HPKE.Sender(recipientKey: publicKey, ciphersuite: Self.suite(), info: info)
      // Sealed straight from the key's own buffer: no second plain copy of the book key.
      let ct = try key.withUnsafeBytes { raw in try sender.seal(raw, authenticating: aad) }
      return ["enc": sender.encapsulatedKey, "ct": ct]
    }

    /// Opens a book key the escrow function sealed to this device, and stores it under `version`.
    /// With `expectedCheck` (the server row's key check), the opened key is checked against it
    /// before anything is written: a key that fails is never stored, so a bad release can never
    /// replace a good key here or, through iCloud Keychain, on the person's other devices.
    /// JavaScript calls this only for a version this phone lacks or cannot trust.
    AsyncFunction("openBookKey") {
      (service: String, account: String, profileId: String, version: Int, enc: Data, ct: Data, info: Data, aad: Data, checkLabel: Data, expectedCheck: Data?) throws in
      guard #available(iOS 17.0, *) else { throw ScribeKeysException("ERR_SCRIBE_KEYS_UNSUPPORTED", "Needs iOS 17") }
      guard version >= 1 else { throw ScribeKeysException("ERR_SCRIBE_KEYS_INPUT", "Bad key version") }
      let deviceAccount = try Self.profileAccount(profileId)
      // The book key's account starts with the same profile: a release is only ever stored for its own account.
      guard account.hasPrefix("\(deviceAccount):") else { throw ScribeKeysException("ERR_SCRIBE_KEYS_INPUT", "Bad key account") }
      Self.lock.lock()
      defer { Self.lock.unlock() }
      guard var device = try Self.readDevice(deviceAccount) else {
        throw ScribeKeysException("ERR_SCRIBE_KEYS_NO_DEVICE", "This phone has no device key")
      }
      defer { device.sk.resetBytes(in: 0..<device.sk.count) }
      let privateKey = try Self.devicePrivateKey(device)
      var bookKey: Data
      do {
        var recipient = try HPKE.Recipient(privateKey: privateKey, ciphersuite: Self.suite(), info: info, encapsulatedKey: enc)
        bookKey = try recipient.open(ct, authenticating: aad)
      } catch {
        throw ScribeKeysException("ERR_SCRIBE_KEYS_OPEN", "The key did not open")
      }
      // Best effort: Swift may hold other copies, but this one does not outlive the call.
      defer { bookKey.resetBytes(in: 0..<bookKey.count) }
      guard bookKey.count == 32 else { throw ScribeKeysException("ERR_SCRIBE_KEYS_OPEN", "The key did not open") }
      if let expected = expectedCheck {
        let check = Data(HMAC<SHA256>.authenticationCode(for: checkLabel, using: Self.subkey(SymmetricKey(data: bookKey), Self.keyCheckInfo)).prefix(16))
        guard Self.constantTimeEqual(check, expected) else {
          throw ScribeKeysException("ERR_SCRIBE_KEYS_CHECK", "The key is not the one the server recorded")
        }
      }
      try Self.write(service: service, account: Self.versioned(account, version), data: bookKey, synchronizable: true)
    }

    // ── Segments ───────────────────────────────────────────────────────────

    /// AES-256-GCM of one segment with the caller's nonce: ciphertext || tag (16).
    AsyncFunction("aesGcmSeal") { (key: Data, nonce: Data, plaintext: Data, aad: Data) throws -> Data in
      guard key.count == 32, nonce.count == 12 else { throw ScribeKeysException("ERR_SCRIBE_KEYS_INPUT", "Bad key or nonce") }
      let box = try AES.GCM.seal(plaintext, using: SymmetricKey(data: key), nonce: AES.GCM.Nonce(data: nonce), authenticating: aad)
      return box.ciphertext + box.tag
    }

    AsyncFunction("aesGcmOpen") { (key: Data, nonce: Data, sealed: Data, aad: Data) throws -> Data in
      guard key.count == 32, nonce.count == 12, sealed.count >= 16 else {
        throw ScribeKeysException("ERR_SCRIBE_KEYS_INPUT", "Bad key, nonce or segment")
      }
      do {
        let box = try AES.GCM.SealedBox(
          nonce: AES.GCM.Nonce(data: nonce),
          ciphertext: sealed.prefix(sealed.count - 16),
          tag: sealed.suffix(16)
        )
        return try AES.GCM.open(box, using: SymmetricKey(data: key), authenticating: aad)
      } catch {
        throw ScribeKeysException("ERR_SCRIBE_KEYS_OPEN", "The segment did not open")
      }
    }
  }

  // ── Keychain ───────────────────────────────────────────────────────────

  private static func query(service: String, account: String, synchronizable: Bool) -> [String: Any] {
    [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: account,
      kSecAttrSynchronizable as String: synchronizable ? kCFBooleanTrue as Any : kCFBooleanFalse as Any,
    ]
  }

  private static func read(service: String, account: String, synchronizable: Bool) throws -> Data? {
    var q = query(service: service, account: account, synchronizable: synchronizable)
    q[kSecReturnData as String] = true
    q[kSecMatchLimit as String] = kSecMatchLimitOne
    var out: CFTypeRef?
    let status = SecItemCopyMatching(q as CFDictionary, &out)
    if status == errSecItemNotFound { return nil }
    guard status == errSecSuccess, let data = out as? Data else {
      throw ScribeKeysException("ERR_SCRIBE_KEYS_KEYCHAIN", "Keychain read failed (\(status))")
    }
    return data
  }

  /// The strictest class the foreground-only code allows: readable only while the phone is unlocked.
  private static func attributes(data: Data, synchronizable: Bool) -> [String: Any] {
    [
      kSecValueData as String: data,
      kSecAttrAccessible as String: synchronizable ? kSecAttrAccessibleWhenUnlocked : kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
    ]
  }

  /// Update, or add when missing.
  private static func write(service: String, account: String, data: Data, synchronizable: Bool) throws {
    let q = query(service: service, account: account, synchronizable: synchronizable)
    let attrs = attributes(data: data, synchronizable: synchronizable)
    var status = SecItemUpdate(q as CFDictionary, attrs as CFDictionary)
    if status == errSecItemNotFound {
      var add = q
      for (k, v) in attrs { add[k] = v }
      status = SecItemAdd(add as CFDictionary, nil)
    }
    guard status == errSecSuccess else {
      throw ScribeKeysException("ERR_SCRIBE_KEYS_KEYCHAIN", "Keychain write failed (\(status))")
    }
  }

  /// Add only: `ERR_SCRIBE_KEYS_EXISTS` when the item is already there.
  private static func add(service: String, account: String, data: Data, synchronizable: Bool) throws {
    var add = query(service: service, account: account, synchronizable: synchronizable)
    for (k, v) in attributes(data: data, synchronizable: synchronizable) { add[k] = v }
    let status = SecItemAdd(add as CFDictionary, nil)
    if status == errSecDuplicateItem {
      throw ScribeKeysException("ERR_SCRIBE_KEYS_EXISTS", "That key version already exists")
    }
    guard status == errSecSuccess else {
      throw ScribeKeysException("ERR_SCRIBE_KEYS_KEYCHAIN", "Keychain write failed (\(status))")
    }
  }

  private static func delete(service: String, account: String, synchronizable: Bool) throws {
    let status = SecItemDelete(query(service: service, account: account, synchronizable: synchronizable) as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else {
      throw ScribeKeysException("ERR_SCRIBE_KEYS_KEYCHAIN", "Keychain delete failed (\(status))")
    }
  }

  /// The Keychain account of one version: `<profile_id>:<child_id>:v<n>`.
  private static func versioned(_ account: String, _ version: Int) -> String {
    "\(account):v\(version)"
  }

  /// Versions present for one (profile, child): every synchronizable item of the service whose account is `<account>:v<n>`.
  private static func bookVersions(_ service: String, _ account: String) throws -> [Int] {
    var q = query(service: service, account: account, synchronizable: true)
    q.removeValue(forKey: kSecAttrAccount as String)
    q[kSecReturnAttributes as String] = true
    q[kSecMatchLimit as String] = kSecMatchLimitAll
    var out: CFTypeRef?
    let status = SecItemCopyMatching(q as CFDictionary, &out)
    if status == errSecItemNotFound { return [] }
    guard status == errSecSuccess, let items = out as? [[String: Any]] else {
      throw ScribeKeysException("ERR_SCRIBE_KEYS_KEYCHAIN", "Keychain read failed (\(status))")
    }
    let prefix = "\(account):v"
    return items
      .compactMap { $0[kSecAttrAccount as String] as? String }
      .filter { $0.hasPrefix(prefix) }
      .compactMap { Int($0.dropFirst(prefix.count)) }
      .filter { $0 >= 1 }
      .sorted()
  }

  private static func lockedBookKey(_ service: String, _ account: String, _ version: Int) throws -> SymmetricKey {
    lock.lock()
    defer { lock.unlock() }
    guard version >= 1, var raw = try read(service: service, account: versioned(account, version), synchronizable: true) else {
      throw ScribeKeysException("ERR_SCRIBE_KEYS_NO_KEY", "No book key of that version on this phone")
    }
    // SymmetricKey keeps its own copy; this one is cleared (best effort).
    defer { raw.resetBytes(in: 0..<raw.count) }
    guard raw.count == 32 else { throw ScribeKeysException("ERR_SCRIBE_KEYS_NO_KEY", "No book key of that version on this phone") }
    return SymmetricKey(data: raw)
  }

  private static func constantTimeEqual(_ a: Data, _ b: Data) -> Bool {
    guard a.count == b.count else { return false }
    var d: UInt8 = 0
    for (x, y) in zip(a, b) { d |= x ^ y }
    return d == 0
  }

  /// The device item's account: the profile id, a lowercase UUID (nothing else is ever accepted).
  private static func profileAccount(_ profileId: String) throws -> String {
    let p = profileId.lowercased()
    guard UUID(uuidString: p) != nil else { throw ScribeKeysException("ERR_SCRIBE_KEYS_INPUT", "Bad profile id") }
    return p
  }

  private static func readDevice(_ account: String) throws -> DeviceItem? {
    var q = query(service: deviceService, account: account, synchronizable: false)
    q[kSecReturnData as String] = true
    q[kSecReturnAttributes as String] = true
    q[kSecMatchLimit as String] = kSecMatchLimitOne
    var out: CFTypeRef?
    let status = SecItemCopyMatching(q as CFDictionary, &out)
    if status == errSecItemNotFound { return nil }
    guard status == errSecSuccess, let found = out as? [String: Any] else {
      throw ScribeKeysException("ERR_SCRIBE_KEYS_KEYCHAIN", "Keychain read failed (\(status))")
    }
    guard let sk = found[kSecValueData as String] as? Data, sk.count == 32,
          let generic = found[kSecAttrGeneric as String] as? Data,
          let id = String(data: generic, encoding: .utf8), UUID(uuidString: id) != nil else {
      throw ScribeKeysException("ERR_SCRIBE_KEYS_ITEM", "The device key item could not be read")
    }
    return DeviceItem(id: id, sk: sk)
  }

  /// Add only, so two calls can never leave two different keys behind one id.
  private static func addDevice(account: String, id: String, sk: Data) throws {
    var add = query(service: deviceService, account: account, synchronizable: false)
    for (k, v) in attributes(data: sk, synchronizable: false) { add[k] = v }
    add[kSecAttrGeneric as String] = Data(id.utf8)
    let status = SecItemAdd(add as CFDictionary, nil)
    guard status == errSecSuccess else {
      throw ScribeKeysException("ERR_SCRIBE_KEYS_KEYCHAIN", "Keychain write failed (\(status))")
    }
  }

  private static func devicePrivateKey(_ item: DeviceItem) throws -> Curve25519.KeyAgreement.PrivateKey {
    do {
      return try Curve25519.KeyAgreement.PrivateKey(rawRepresentation: item.sk)
    } catch {
      throw ScribeKeysException("ERR_SCRIBE_KEYS_ITEM", "The device key item could not be read")
    }
  }
}

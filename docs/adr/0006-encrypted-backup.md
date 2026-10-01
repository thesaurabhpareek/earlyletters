# ADR 0006: Encrypted backup — per-child family key in iCloud Keychain, server escrow on by default, Vault mode opt-in

Status: Accepted. Date: 2026-10-01.

## Context
Audio backup must be encrypted on the device. Parents are non-technical and will lose passwords. Family members (grandparents) must be able to play shared letters. True end-to-end encryption and easy recovery conflict.

## Building blocks (verified)
- iCloud Keychain sync: `kSecAttrSynchronizable = true` syncs items to the user's other devices; since iOS 14 it syncs cryptographic keys; incompatible with `...ThisDeviceOnly` accessibility [S43].
- expo-secure-store does **not** expose iCloud sync; items stay device-local [S42]. Requires a small custom Expo module (or a library supporting synchronizable items, Unverified) to set `kSecAttrSynchronizable`.
- AES-256-GCM in RN: react-native-quick-crypto (MIT, JSI/Nitro, Expo prebuild, AES-GCM supported) [S44].

## Decision
Key hierarchy:
1. **Child Content Key (CCK)**, random 256-bit, one per child. Each audio file gets a random file key; the file key is wrapped with the CCK and stored next to the blob row.
2. CCK stored on device in the Keychain as a **synchronizable** item (iCloud Keychain), so a new iPhone on the same Apple ID gets it automatically.
3. **Sharing with family:** each member device generates an X25519 key pair (private in Keychain); the CCK is wrapped to each approved member's public key and stored in `child_key_grants`. Revoking = rotate CCK for new files (old files stay readable by those who had them; stated honestly in the UI).
4. **Recovery:**
   - **Standard (default):** CCK also wrapped by a server key held in a Supabase Edge Function secret (escrow). Recovery after magic-link sign-in on a new device without iCloud Keychain. The service could technically decrypt; the privacy policy says so plainly.
   - **Vault mode (opt-in):** no escrow; a printable Recovery Kit (24-word / QR) is the only fallback. If lost with all devices, the backups are unreadable — the app requires the parent to confirm this.
5. Text entries are not end-to-end encrypted in v1 (needed server-side for family sharing, search, book and web reader); they are protected by RLS and Supabase encryption at rest (Unverified detail).

## Consequences
Default mode trades pure E2EE for "you will not lose your child's voice". Vault mode gives true E2EE to those who want it. Requires one small native module (synchronizable Keychain item) — the only custom native code in v1.

## Alternatives rejected
Server-managed keys only (simpler, but no E2EE option). Pure E2EE only (unacceptable loss risk for the core user). Password-derived keys (people forget passwords).

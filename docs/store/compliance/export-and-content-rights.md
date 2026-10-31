# Export compliance and content rights

## 1. Export compliance (encryption)

### 1.1 What the code does today

- `apps/mobile/app.config.ts` does **not** set `ios.infoPlist.ITSAppUsesNonExemptEncryption`. Without it, App Store Connect asks the export question on every build. Set it explicitly once the answer is settled (OPEN-15). This pack cannot edit that file.
- Profile A (local-only): the app makes no network calls and implements no cryptography of its own. `expo-crypto` is used for random bytes to build ids (`store.ts` line 157) and a SHA-256 digest of a recording (`capture/recorder.ts` line 63). A hash is an integrity check, not encryption of data; counsel can confirm. The OS provides everything else (file protection, TLS if it were used).
- Profile B (as designed): HTTPS to Supabase, PostHog, Sentry and the model host, which is the OS network stack. ADR 0006 and D-032 add application-level encryption of recordings: a random per-file key (AES-256-GCM), wrapped by a server-held key (Standard mode) before upload, with Vault mode and per-child keys later. That is cryptography the app performs itself, beyond what Apple treats as exempt.

### 1.2 Answers for App Store Connect

| Question | Profile A | Profile B |
|---|---|---|
| Does your app use encryption? | Yes in the narrow sense that iOS provides it, but only the OS's standard encryption | Yes |
| `ITSAppUsesNonExemptEncryption` | **false**. Add to `infoPlist` | **true** only if the in-app recording encryption ships; otherwise false (OPEN-15) |
| Is the encryption exempt (only HTTPS/OS-standard, or authentication, or similar)? | Yes, exempt | No for application-level file encryption. Typically classified as mass-market under the US export rules, which usually means an annual self-classification report to the US Bureau of Industry and Security rather than a licence. Unverified here; counsel confirms |
| Does the app qualify for any exemption in Supplement 3 to Part 740? | Not needed | Counsel to confirm |
| France: encryption declaration | Not applicable: distribution is United States only at launch (D-013) | Same while US-only. If other storefronts are added, French and other local rules need re-checking |
| Documentation upload | Not needed | Possibly the self-classification report or a CCATS; counsel decides (OPEN-15) |

Open-source crypto: React Native and Expo link platform crypto and OpenSSL-derived code in places. That is already covered by the same answers; no extra step unless a crypto library is added directly (ADR 0006 names `react-native-quick-crypto` as an option, which would make the "uses its own encryption" answer certain).

### 1.3 Google Play

Play has no export-compliance question. The US export rules apply the same way to the Android build. If an annual self-classification report is needed for iOS (Profile B), it covers both.

## 2. Content rights

### 2.1 Apple: "Does your app contain, show or access third-party content?"

**No** for both profiles.

- All letters, recordings, names and settings are the user's own and stay with the user (Profile A: on the device; Profile B: in their private book).
- The 104 conversation prompts (`packages/content/src/prompts.ts`) and all copy are written for this product (`packages/content`), under the voice rules in `CLAUDE.md`.
- No news, music, video, books or syndicated content. No web view or feed.
- The photographs in `apps/mobile/assets/photos` (Unsplash License and CC0, checked 2026-10-01 in `LICENSES.md`) are **not referenced by any source file** in `apps/mobile/src`, so they are not bundled by Metro. If a screen starts using them, keep `LICENSES.md` current; the Unsplash License allows this use, and none shows a child or a face.
- Scaffold images (`expo-logo.png`, `react-logo*.png`, `tutorial-web.png`, `logo-glow.png`, scaffold app icon) are Expo template assets. The icon and splash are still the scaffold (`app.config.ts` TODO). Replace the icon before submission; ship no Expo or React logo as product art.

### 2.2 Third-party software and fonts (notices)

| Item | Licence | Shipped in the app? | Notice duty |
|---|---|---|---|
| React Native, Expo SDK modules, React, Reanimated, expo-router and the other listed dependencies | MIT / Apache-2.0 mostly | Yes | Licence text should be available to users (OPEN-16). There is no licences screen in Settings today |
| whisper.rn | MIT (`node_modules/whisper.rn/package.json`) | Yes (native module) | Same |
| Whisper model files (`ggml-large-v3-turbo-q5_0.bin`, fallback `ggml-small-q5_1.bin`) | MIT (OpenAI Whisper weights; conversions come from the ggml project) | Downloaded on first use in the design; not downloaded in the current build | Include notice if distributed; confirm the model host's terms (D-046, OPEN-12) |
| Fonts Literata and Mukta | SIL Open Font License 1.1 | **Not bundled yet** (`assets/fonts/README.md`; the font map is empty, so the app falls back to system fonts) | Ship `OFL-<Family>.txt` beside each font file when added |
| `phosphor-react-native` icons | MIT | Yes | Notice as above |

Recommendation for the founder: add an "Open-source licences" row under Settings, About that lists these packages, or confirm a build-time licence report is acceptable (OPEN-16). Not an Apple or Google block by itself, but it is a licence obligation.

### 2.3 Trademarks and names

- The name "Early Letters" is not trademark-cleared (`packages/brand/index.ts`: "Not yet trademark-cleared"). Apple does not check this at submission, but a later takedown request would hit the store listing. The Project's IP memos (`ip/L3-trademark-secrets-contracts.md`) were not readable here (OPEN-28).
- The store name "Early Letters: Memory Book" is 26 characters, subtitle "Baby memory book in your voice" is 30, inside the 30 limits (`packages/brand`).
- Copyright line: `docs/store/listing/listing.json` has a placeholder for the publisher's legal name. It is entered only in App Store Connect, never in code (D-004).
- Do not name other platforms in iOS metadata (Guideline 2.3.10); store copy refers to "your Apple Account" only.

### 2.4 Content a user can add (UGC)

Letters a person writes are theirs. Terms of Service (draft, `docs/legal/terms-of-service.md`) is where the licence the user grants to operate the service and the rule that we never read, rewrite or use letters to train models should live; the published Terms and Privacy Policy for the app are not live (OPEN-02), so the store submission cannot yet point to them.

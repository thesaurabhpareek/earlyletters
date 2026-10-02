# Early Letters

A baby memory book you fill by talking. Exactly as you said it.

Parents and close family speak or type notes and letters to a child. The app transcribes on the phone, fixes only what the microphone or grammar got wrong, keeps the original recording, and files everything into a memory book by the child's month of age.

Internal codename: `scribe`. Start with [CLAUDE.md](CLAUDE.md) for structure, commands and rules.

## Status (October 1, 2026)

| Area | State |
|---|---|
| Faithful-edit engine (`packages/core`) | Built, 38 tests passing |
| Content: in-app copy, 104 prompts, App Store, website, book (`packages/content`) | Written, 16 rule checks passing |
| Database schema and access rules (`supabase`) | Written, 36 checks passing locally; not yet applied (needs a Supabase project) |
| Design language, tokens, component library choice (`docs/design`, `packages/design-tokens`) | Done |
| Architecture and decision records (`docs`) | Done |
| Speech-model experiment kit (`experiments`) | Ready; ran end to end on sample audio. Waiting on your recordings |
| iOS app screens (`apps/mobile`) | Not started (Expo template only) |

## Founder to-dos (only you can do these)
1. Create a private GitHub repo and install the Claude GitHub App on it.
2. Create a Supabase project for this product.
3. Form an LLC, get a D-U-N-S number, enroll in the Apple Developer Program as an organization.
4. Trademark screen for "Early Letters" (USPTO classes 9, 16, 42), then an attorney.
5. Buy earlyletters.com, earlyletters.app and earlyletters.co (registrable when checked Sept 30, 2026; availability can change).

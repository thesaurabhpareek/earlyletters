# Future backlog 06: co-parent sharing, sign-in and sync (v1.1)

Owner: mobile product engineering (coparent-coming-soon branch). Status: Draft 1, 3 Oct 2026, for the coordinator to merge and the founder to rank. Scope: what v1.0 deliberately leaves out after the founder decision of 3 Oct 2026, and what must be true to turn it on.

Sibling files: `01-capture-voice-languages.md` (pm-1), `02-family-circle.md` (pm-2: wider circle, FAM-01 to FAM-17), `03-book-keepsakes.md` (pm-3), `04-growth-monetisation.md` (pm-4), `05-trust-platform-insights.md` (pm-5). This file does not re-score their items; FAM-03 (shared voice) and FAM-17 (family notifications) stay with pm-2.

Changelog: Draft 1, 2026-10-03: first version, items CP-01 to CP-03, the switch and its acceptance criteria.

---

## 0. How to read this

Tags follow the repo convention:
- **[F]** Fact: checked in this repo on 3 Oct 2026; the path is named.
- **[Founder]** Stated by the founder in the task of 3 Oct 2026; not independently verified here.
- **[A]** Assumption. **[Rec]** Recommendation. **[Q]** Open question, with who answers it.

Size: S under 1 engineer-week; M 1 to 3; L 3 to 6. Horizon "Now" means v1.1.

---

## 1. The decision and what v1.0 does instead

| # | Fact | Source |
|---|---|---|
| 1 | v1.0 ships on this phone only, to keep running cost at $0. Co-parent sharing moves to v1.1. | [Founder] 3 Oct 2026 |
| 2 | Co-parent sync is the only reason v1.0 needed a server, so sign-in and sync are off in v1.0 too. The app works fully without an account. | [Founder] 3 Oct 2026 |
| 3 | One build-time switch, `EXPO_PUBLIC_SERVER_FEATURES` (`on` only; anything else is off), read in `apps/mobile/src/lib/capabilities.ts`. Every `eas.json` profile and `.env.development` set `off`. | [F] `apps/mobile/src/lib/capabilities.ts`, `apps/mobile/eas.json`, `apps/mobile/test/capabilities.test.ts` |
| 4 | With the switch off: no Supabase client is ever constructed (`getSupabaseOrNull()` returns null), `startSync()` returns at once, remote documents never fall back to the Supabase URL, the `(auth)` routes redirect home, Settings shows no Account or Delete account rows, Privacy hides the sync consent row, deep links keep no sign-in or invite token. | [F] `lib/supabase/client.ts`, `lib/sync/index.ts`, `lib/remote/base.logic.ts`, `app/(auth)/_layout.tsx`, `app/settings/index.tsx`, `app/settings/privacy.tsx`, `lib/family/entry.logic.ts` |
| 5 | Every co-parent entry point (Family tab, `/invite`, `/invite/new`, invite links, Settings > a child's book > "Write this book together", first run "I was invited") shows one "coming soon" presentation. "Tell me when it's here" stores a day in the local setting `family.coParentNotify`; nothing is sent. | [F] `components/family/coparent-soon.tsx`, `lib/family/coming-soon.logic.ts`, `test/coparent-soon.test.ts` |
| 6 | Remote config cannot turn server features on (BRIEF decision 16). Its only lever is `flags.familyTeaser` (`coming_soon` or `quiet`), which can quiet the teaser copy. | [F] `packages/api/src/remote-config.ts`, `packages/api/test/remote-config.test.ts` |
| 7 | All sign-in, consent, invite and sync screens and modules stay in the code base, compiled and type-checked, behind the switch. | [F] `app/(auth)/*`, `app/invite/*`, `app/settings/account.tsx`, `app/settings/delete-account.tsx`, `lib/auth`, `lib/sync`, `lib/family` |
| 8 | There is no "delete everything on this phone" screen today, so v1.0 hides Delete account instead of renaming it. Deleting the app removes the local book; Export is the way to keep a copy. | [F] no such path under `apps/mobile/src`; [Q] founder: is an in-app "Delete everything on this phone" wanted for v1.0? |

**Paid trigger.** The day real letters go to a server, Supabase moves to Pro, from $25 a month [Founder]. Free-tier projects also have no daily backups, which the deletion spec assumes (`docs/legal/DELETION_AND_EXPORT_SPEC.md` cites Supabase Pro 7-day backups) [F]. So the switch is turned on only together with the Pro plan, never on Free with real families.

---

## 2. Items

### CP-01 Co-parent sharing (write one book together)
- **What ships.** A parent invites the other parent from the Family tab; the invitee joins from their own phone; both write to and read the same book; private letters stay private; the Family tab shows members and open invites (the v1.0 code in `app/(tabs)/family.tsx` `FamilyShared`, `app/invite/index.tsx`, `app/invite/new.tsx`). Co-parent only, as BRIEF decision 5.
- **Why.** v1.0 ends the circle at one author per phone. Two-parent books are the first widening of the circle (`02-family-circle.md` section 1) and the base for FAM-03, FAM-01 and FAM-17.
- **Dependencies.**
  - Sync engine choice **D-023** (outbox push and cursor pull on expo-sqlite and Supabase, Decided) and its device test (`docs/DECISIONS.md` D-023).
  - **Auth setup** (CP-02): Apple, Google and email magic link configured on the production project (`docs/ops/AUTH_SETUP.md`).
  - **Purge worker** scheduled and healthy (`docs/ops/README.md`, `supabase/functions/purge-worker/`, `supabase/cron/purge-worker.sql`), because accounts and deletions exist from the first upload.
  - **invite-redeem Edge Function**: today redeeming is the SQL function `accept_child_invite` called over PostgREST (`app/invite/index.tsx`, `lib/family/invites.ts`); the plan names an Edge Function for redeem with rate limits and request ids (BRIEF decision 17). Not built yet [F: no such folder under `supabase/functions/`].
  - **Vault secrets**: the pg_cron, pg_net and Vault pattern for scheduled functions, and the function secrets (`docs/ops/README.md`, `docs/ops/SECURITY.md`).
  - Universal links: the website serves the AASA file for `/i/*` and `/auth/callback` (`docs/ops/AUTH_SETUP.md` section 5).
  - Legal: Privacy Policy, privacy label and claims registry say that letters in a shared book are stored on our server (the claims registry VOICE.md "Proof before words" requires).
- **Size.** M (the code exists; the work is set-up, device testing and legal copy) [A]. **Horizon.** Now (v1.1).

### CP-02 Sign-in (Apple, Google, email magic link)
- **What ships.** The sign-in sheet, consent sheets and Settings > Account, exactly as in code today (BRIEF decision 4; passkeys after sign-in). Offered at the first invite, from Settings, and once after the first letter (`app/review.tsx`). Delete account returns to Settings with it (Apple 5.1.1(v)).
- **Dependencies.** Production Supabase project on Pro; Apple and Google client ids in the build env; Resend for magic-link email (`packages/emails`); `forceReauthEpoch` in remote config ready.
- **Size.** S to M [A]. **Horizon.** Now (v1.1), shipped together with CP-01 (sign-in exists only so two parents can share).

### CP-03 Sync (letters on the server, both phones up to date)
- **What ships.** `startSync()` at boot after a signed-in, consented session (D-023), Settings > Privacy sync consent row, the remote documents may fall back to the Supabase URL when no CDN is set.
- **Dependencies.** D-023 device spike; `npm run test:db` access matrix green on the production schema; kill switch `sync` tested end to end within 5 minutes (LEGAL-REQ-040).
- **Size.** M [A]. **Horizon.** Now (v1.1), with CP-01.

---

## 3. Acceptance criteria to flip the switch on

Turn `EXPO_PUBLIC_SERVER_FEATURES` to `on` in an `eas.json` profile only when every line below is true. Start with `preview` (dogfood families), then `production`.

1. **Plan.** Supabase is on Pro (paid from that day), with daily backups confirmed in the dashboard.
2. **Auth.** Sign in with Apple, Google and email magic link each work on a release build on a real iPhone, including a cold start from the magic link and from an invite link (universal links and AASA live).
3. **Sync.** Two real iPhones on two accounts share one book: a letter written on each appears on the other after foreground and pull to refresh; a private letter never appears on the other phone; airplane mode then reconnect loses nothing (D-023 device test).
4. **Invites.** Create, share, cancel, share again and redeem work; an expired, used or cancelled link shows its calm message; redeem goes through the invite-redeem Edge Function with rate limits and request ids; the token never appears in logs (A-NFR-012).
5. **Deletion.** Delete account schedules, cancels and completes; the purge worker runs on schedule with Vault secrets and the runbook's "Healthy looks like" is true (`docs/ops/runbooks/purge-failing.md`).
6. **Kill switches.** `sync` and `invites` stop the features within 5 minutes on an open app, and the app keeps working locally (LEGAL-REQ-040).
7. **Tests.** `npm test`, `npm run test:db` and `npm run test:functions` pass; `apps/mobile/test/capabilities.test.ts` is updated so the flipped profile expects `on` and every other profile still expects `off`.
8. **Legal and copy.** Privacy Policy, privacy label and the claims registry (VOICE.md "Proof before words") updated and counsel-approved for server-stored letters; the coming-soon copy (`familyCopy.soon`) is no longer shown; App Review notes explain sign-in and sharing.
9. **The "tell me" promise.** On first launch of the build with sharing on, a person whose phone has `family.coParentNotify` set sees one quiet, dismissible note on the Family tab that writing together is here (no push, no count), and the setting is then cleared. Without this, the v1.0 button would have promised something nobody keeps.
10. **Remote config.** `flags.familyTeaser` has no effect in the new build (the shared Family tab replaces the teaser).

---

## 4. Open questions

- [Q founder] In-app "Delete everything on this phone" for v1.0 (section 1, fact 8), or is deleting the app enough?
- [Q founder] Where remote documents are hosted for v1.0. With the switch off they are fetched only from `EXPO_PUBLIC_DOCS_BASE_URL` (a CDN, for example Cloudflare R2, ADR 0016). If it is not set, the app runs on bundled defaults and cannot fetch language packs for the six non-English languages (`lib/remote/base.logic.ts`, `lib/language/packs.ts`). Speech models come from Hugging Face directly and are not affected (`lib/models/catalog.ts`).
- [Q founder] Keep the Sign in with Apple entitlement and associated domains in the v1.0 build (harmless and avoids re-provisioning), or drop them until v1.1? They are unchanged today (`apps/mobile/app.config.ts`).

# 02f Schema reference: triggers, storage buckets and storage rules

Status: draft for the council, 20 Nov 2026. Author: `data-architect`. Evidence: develop `4d33978f` (cited code and migration paths unchanged at `12c55d66`); 31 migrations loaded in the test harness and read from `pg_trigger`, `storage.buckets`, `pg_policies` [V]. Part of 02 (legend in 02a).

## Triggers (49 on 15 tables, plus `on_auth_user_created` on `auth.users`)

The triggers are where the constitution lives in the database: `raw_transcript` immutable (`entries_guard`), append-only evidence (`*_guard`, `*_no_truncate`), pseudonymisation at account deletion (`profiles_pseudonymise_*`), the consent gate on content writes (`*_consent_gate`). `on_auth_user_created` (after insert on `auth.users`, function `handle_new_user`, `20260930000000:35-36`) creates the profile row and is outside the list below because it sits in the `auth` schema. Test pointers are in 02e under the function name. The counts here reproduce with the recipe in 02e.

| Table | Trigger | When | Function | Enforces |
|---|---|---|---|---|
| audio_blobs | audio_blobs_after_change | after insert/delete/update | audio_blobs_after_change | trigger: ledger and usage on backup row change |
| audio_blobs | audio_blobs_touch | before update | audio_blobs_touch | trigger: set updated_at |
| audit_events | audit_events_guard | before delete/update | audit_events_guard | trigger: append-only guard |
| audit_events | audit_events_no_truncate | before truncate | audit_events_no_truncate | trigger: block truncate |
| ops.audit_log | audit_log_guard | before delete/update | ops.audit_log_guard | trigger: append-only guard |
| ops.audit_log | audit_log_no_truncate | before truncate | ops.audit_log_no_truncate | trigger: block truncate |
| child_member_prefs | child_member_prefs_consent_gate | before insert/update | client_content_gate | trigger: consent gate on content writes |
| child_member_prefs | child_member_prefs_touch | before update | touch_updated_at | trigger: set updated_at |
| child_members | child_members_audit | after delete | child_members_audit | trigger: audit membership changes |
| child_members | child_members_drop_held | after delete | child_members_drop_held | trigger: drop held drafts on leaving |
| child_members | child_members_guard | before delete | child_members_guard | trigger: membership rules |
| child_members | child_members_revoke_invites | after delete | child_members_revoke_invites | trigger: revoke invites of a leaver |
| children | children_consent_gate | before update | client_content_gate | trigger: consent gate on content writes |
| children | children_guard | before update | children_guard | trigger: book column rules |
| children | children_touch | before update | touch_updated_at | trigger: set updated_at |
| deletion_requests | deletion_requests_backup_cancel | after insert/update of status | deletion_requests_backup_cancel | trigger: cancel restores on deletion |
| dictionary_terms | dictionary_terms_consent_gate | before insert/update | client_content_gate | trigger: consent gate on content writes |
| dictionary_terms | dictionary_terms_touch | before update | touch_updated_at | trigger: set updated_at |
| entries | entries_audit | after update | entries_audit | trigger: audit letter changes |
| entries | entries_backup_forget | after delete | entries_backup_forget | trigger: drop backups of an erased letter |
| entries | entries_drop_held | after insert | entries_drop_held | trigger: drop held draft when kept |
| entries | entries_family_rules | before insert/update | entries_family_rules | trigger: family letter rules and tuple |
| entries | entries_guard | before update | entries_guard_immutable | trigger: raw_transcript and ids immutable |
| entries | entries_insert_guard | before insert | entries_before_insert | trigger: insert rules |
| entries | entries_language_guard | before update | entries_language_guard | trigger: language code rules |
| entries | entries_not_purged | before insert | entries_not_purged | trigger: refuse a purged letter id |
| entries | entries_note_erasure | after delete | entries_note_erasure | trigger: note erasure for other phones |
| entries | entries_sync_xid | before insert/update | entries_set_sync_xid | trigger: stamp sync cursor |
| entries | entries_touch | before update | touch_updated_at | trigger: set updated_at |
| entries | entries_unshared | before insert/update | entries_unshared | trigger: unshare rules |
| entries | entries_version | after update | entries_record_version | trigger: keep earlier text |
| escrow_unwraps | escrow_unwraps_guard | before delete/update | escrow_unwraps_guard | trigger: append-only guard |
| escrow_unwraps | escrow_unwraps_no_truncate | before truncate | escrow_unwraps_no_truncate | trigger: block truncate |
| held_drafts | held_drafts_consent_gate | before insert/update | client_content_gate | trigger: consent gate on content writes |
| held_drafts | held_drafts_gone_on_delete | after delete | held_drafts_note_gone | trigger: write gone marker and ledger |
| held_drafts | held_drafts_gone_on_insert | after insert | held_drafts_note_gone | trigger: write gone marker and ledger |
| held_drafts | held_drafts_guard | before insert | held_drafts_guard | trigger: held draft rules |
| held_drafts | held_drafts_stamp | before insert/update | held_drafts_stamp | trigger: stamp versions |
| policy_acceptances | policy_acceptances_guard | before delete/update | policy_acceptances_guard | trigger: append-only guard |
| policy_acceptances | policy_acceptances_no_truncate | before truncate | policy_acceptances_no_truncate | trigger: block truncate |
| policy_acceptances | policy_acceptances_sheet_fields | before insert | policy_acceptances_sheet_fields | trigger: sheet acts carry hash and locale |
| policy_versions | policy_versions_guard | before insert/update | policy_versions_guard | trigger: published versions are fixed |
| profiles | profiles_guard | before update | profiles_guard | trigger: profile column rules |
| profiles | profiles_pseudonymise_acceptances | before delete | policy_acceptances_pseudonymise | trigger: pseudonymise on profile delete |
| profiles | profiles_pseudonymise_escrow_unwraps | before delete | profiles_pseudonymise_escrow_unwraps | trigger: pseudonymise the unwrap log |
| profiles | profiles_pseudonymise_subscription_consents | before delete | subscription_consents_pseudonymise | trigger: pseudonymise on profile delete |
| profiles | profiles_touch | before update | touch_updated_at | trigger: set updated_at |
| subscription_consents | subscription_consents_guard | before delete/update | subscription_consents_guard | trigger: append-only guard |
| subscription_consents | subscription_consents_no_truncate | before truncate | subscription_consents_no_truncate | trigger: block truncate |

## Storage buckets

Three buckets are created by migrations [V: `storage.buckets` after all 31 files]. Four more ids are named in code and in the deletion list but no migration creates them (Gap G-10). All buckets are private; none is public.

| Bucket | Created at | Limit and types | Path | L | Read | Write | Retention and deletion | Tests |
|---|---|---|---|---|---|---|---|---|
| entry-photos | `20260930000000:289-292` | 10 MiB; jpeg, heic, png | `{child_id}/{author_id}/{entry_id}.{ext}` | L4 (path L3) | author, and members who may read the letter (`can_read_entry_photo`, `entry_photos_read`) | author insert and update, with member, live book, consent and not-purged checks (`20261028000000:88-99`); author delete | with the letter: `purge_due` queues the exact path; book purge queues the prefix; account purge queues `{child}/{author}/`. Queue drained by the purge worker | access_matrix, data_governance, former_member_purge, purge_batching |
| entry-audio | `20261023000000:677-680` | 20 MiB; octet-stream | `{child}/{author}/{entry}.m4a.enc` | L4 (ciphertext) | owner only, never switched off (`backup_object_readable`) | owner, exact pending path only, while backup is on and consented (`backup_object_writable`) | per 02d `audio_blobs`; delete enqueues the exact path (`audio_blobs_after_change`) | access_matrix, audio_backup, audio_backup_purge, former_member_purge |
| ops-ledger | `20261004200000:611` | none set | `purges/YYYY-MM-DD.jsonl`, `escrow/YYYY-MM-DD.run-<stamp>.jsonl` | L3 | service role only; no storage policy | service role only | 60 days; never purged by account or book deletion (`buckets.ts` scope system) | ops_deletion_worker; worker tests |
| child-photos | not created | n/a | `{child_id}/{uuid}.{ext}` | L4 | n/a | n/a | referenced by `ops_storage_residue`, `purge_book_keep_authors` (`20261023010000:143`) and `children.photo_path`; the worker skips a bucket that does not exist | none (nothing to test) |
| inbox, avatars, exports | not created | n/a | see `DATA_CLASSIFICATION.md` 4.4 | L4, L3, L4 | n/a | n/a | planned (v1.1, P1) | none |

## Storage policies on storage.objects (9)

| Policy | Command | Rule in one line |
|---|---|---|
| entry_photos_no_anonymous | all | restrictive: anonymous sessions cannot touch entry-photos |
| entry_photos_read | select | own folder, or `can_read_entry_photo(name)` |
| entry_photos_author_insert | insert | own folder, depth 2, member, live book, consent, not an erased letter id |
| entry_photos_author_update | update | USING: own folder; WITH CHECK: the new row passes every insert check (a rename or upsert goes through update) |
| entry_photos_author_delete | delete | own folder |
| entry_audio_no_anonymous | all | restrictive |
| entry_audio_owner_read | select | `backup_object_readable(name)` |
| entry_audio_owner_insert | insert | `backup_object_writable(name)` |
| entry_audio_owner_update | update | `backup_object_writable(name)` |

## Gaps found in this file

- G-9 `entry_photos_author_insert` and `_update` are still live. The locked cards say a picture never leaves the phone (NS-01-R61); `data-and-sync.md` S1 plans to drop both and add a trigger. Until it ships and is applied, a modified client can put a picture in `entry-photos` under its own folder. Nothing in the shipped app does this (the sync push never names `photo_path`, `20261016000000:1091-1135`, as cited in `data-and-sync.md` CK8). Planned migration S1, founder `approve-migration`.
- G-10 `child-photos` is named in `ops_storage_residue`, the purge steps and `children.photo_path`, but the bucket does not exist in any migration. `DATA_CLASSIFICATION.md` 4.4 lists it as "v1.0, private".
- Object names carry person and book ids (L3) and appear in Supabase Storage platform logs; the typed logger (01b) covers our code only, not the vendor's logs.

## Questions for the council

- Q-f1 (CISO, CPO) Ship S1 (close the photo write path) before any build with `EXPO_PUBLIC_PHOTOS` on in production? Default: yes, as `data-and-sync.md` S1 and NS-01-R61 say; it needs the founder's `approve-migration`.
- Q-f2 (CDO) Create `child-photos` now or remove its references? Default: neither; keep the references (the worker skips a missing bucket) and decide with the child-photo card.

### Council answers (20 Nov 2026)

Source: `DECISIONS-20nov.md` (PR #1013, head `e7d9bf15`) and the CDO and CISO return (`cdo-ciso.md`, working file, "CDO return"). Gates and numbered gaps: 01a section 8.

- Q-f1: RULED (C4), and the timing is firmer than the default: S1 ships before the first outside family (GF) and together with photo slices #835 to #840, not only before `EXPO_PUBLIC_PHOTOS` goes on, because the write path exists in every build, flag or not. Applying it is the founder's step (`approve-migration`). B3 ("not built") is not yet true while the two policies are live [V: `20261028000000:88-99`]. Gap G-9.
- S1 must be tested on a database built from all files and on the A2 path: on a project that holds only files 1 and 2 the live policies are the original, weaker ones. Whether Supabase allows a trigger on the `storage` schema is [U]; confirm before writing it (CDO return). Delete stays (own folder); a removed member can still delete objects in their own folder; low harm, recorded.
- Q-f2: AGREE neither. Correct `DATA_CLASSIFICATION.md` 4.4 (it says "v1.0, private" for a bucket no migration creates; founder merge) and add a test that the purge worker skips a missing bucket (G-10).

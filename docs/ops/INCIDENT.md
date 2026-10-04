# Incident response

Owner: founder. Written 3 Oct 2026. One page on purpose. Detail lives in [RUNBOOKS.md](RUNBOOKS.md) and [SECRETS.md](SECRETS.md); legal duties in `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ-037 to -040).

## Who decides

- **The founder is the incident lead** for every incident: declares it, sets the severity, decides every live change and approves every message to users.
- Agents may help investigate and draft (timelines, queries, message drafts). Agents never flip switches, rotate secrets, run SQL against a live project or message users.
- Counsel decides whether a legal notification is owed, to whom and by when (LEGAL-REQ-039 says the plan uses the shortest applicable clock). Contact counsel at the start of any SEV1, not at the end.

## Severity

| Level | Meaning | Examples | Response |
|---|---|---|---|
| SEV1 | Someone's letters, recordings, photos or child details may have been seen by someone who should not see them, or may be lost; or a secret that bypasses access rules is exposed | An RLS or RPC flaw that crosses families; a secret key exposed; a bad purge or restore; a console account taken over | Drop everything. Contain first. Counsel the same day. |
| SEV2 | A core shared feature is broken for many people, with no exposure | Sign-in failing; sync failing; invites broken; a pack manifest rejected for everyone; a low-privilege secret exposed | Same day. |
| SEV3 | Degraded or limited | One person's sync stuck; a slow endpoint; a cosmetic server-driven content error | Next working day. |

When unsure, pick the higher level; lowering it later is free. Recording, reading and export work offline, so most server incidents never stop a parent from saving a letter. Protect that.

## First 30 minutes

1. **Declare.** Open a private incident note (never a public issue or pull request): time, who noticed, what is known, severity. Keep a timestamped log from here.
2. **Stop the harm.** Use the smallest switch that works:
   - Remote config and kill switches (D-035, brief decision 16): `sync_enabled`, `invites_enabled`, `min_supported_build`, and the LEGAL-REQ-040 switches (revoke all sessions, pause signed-URL issuance, disable the AI gateway when it exists). Edge Functions read switches with a 60 s cache; clients pick them up on their next refresh and otherwise keep working from their last good copy. Target effect: within 5 minutes (LEGAL-REQ-040).
   - A switch may only turn something off or reduce what is sent. Never use remote config to start collecting data, change the paywall or enable anything App Review has not seen.
   - A leaked secret: rotate at the source now (RB-4). Rotation, not history rewriting, is the fix.
   - A bad migration: fix forward or neutralise (RB-3); do not restore a backup without reading RB-3 first, because a restore can bring back data people deleted.
   - Sign everyone out: rotate the JWT signing key and revoke the previous key immediately ([SECRETS.md](SECRETS.md)).
3. **Preserve evidence.** Note request ids, time windows and affected ids. Never copy letter text, transcripts, audio or child names into the note, a chat or a ticket (CLAUDE.md privacy rules).
4. **Scope.** Which systems, which time window, which families (ids and counts only). LEGAL-REQ-039 requires an affected-user list within one hour once its runbook exists.
5. **Decide on communication** (below). For SEV1, call counsel.

Kill switches and the remote config table are planned (D-035, ROADMAP M4 and M9), not built. Until they exist, the containment tools are secret rotation, signing-key revocation, Edge Function undeploy and an expedited app update.

## Talking to families

Privacy and trust are paramount and conveyed calmly (brief decision 11). Content rules apply to every word (CLAUDE.md).

- **Tell people who are affected, promptly, and only what is true.** Never say "your data is safe" until it is verified.
- **Calm, plain and specific.** What happened, what it means for their letters, what we have done, what they can do (if anything). Short sentences. No jargon.
- **No fear, no blame, no minimising.** Do not dramatise and do not hide. Do not over-explain.
- **Never include letter text, a child's name or recordings** in any message, subject line or status page.
- **Channels:** email from the `earlyletters.com` domain (transactional template, LEGAL-REQ-039 holding statement and individual notice), an in-app announcement block (server-delivered, brief decision 16), and the website if many people are affected.
- **Follow up** when it is resolved, in the same channel.

## After the incident

Within 5 working days of resolution, the founder writes a blameless review, kept private:

- timeline; impact (counts, data categories, duration); how it was detected and how long that took;
- what contained it; root cause and contributing causes;
- what we change, each with an owner and a backlog item (BL-...);
- whether the runbooks, this page, [SECRETS.md](SECRETS.md) or the alerting (LEGAL-REQ-038) need an update; update them in the same week;
- legal notifications sent, if any, with dates (from counsel).

Drill once a quarter on staging: flip each kill switch, rotate one secret, restore a backup (RB-3) and time it.

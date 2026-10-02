# Policy Versioning and Consent Records

> **AI-drafted for counsel review. Not legal advice.** Drafted 2 Oct 2026. This file defines process and data structures; counsel decides whether any particular change is material. Statements marked **Unverified** were not checked against an opened source.

Owner: founder. Approver for every published legal text: counsel. Implements register rows CR-011, CR-019, CR-050, CR-004 and engineering requirements LEGAL-REQ-001, -006, -009, -049 (see `compliance-register.md`, `ENGINEERING_REQUIREMENTS.md`).

---

## 1. Documents under version control

Every text a user is asked to accept, or is told about as a binding statement, is a versioned document. Each has a stable key used in URLs, code and the database.

| Key | Document | Kind | Who sees it | Needs an affirmative act? |
|---|---|---|---|---|
| `terms` | Terms of Service | Agreement | Account holders | Yes, sign-in-wrap at account creation (PRD A-REQ-034) |
| `privacy` | Privacy Policy | Notice | Everyone | Acknowledged with `terms` |
| `health-privacy` | Consumer Health Data Privacy Policy (Washington MHMDA; separate document by law, register CR-031) | Notice | Everyone | Linked from website homepage and app |
| `sensitive-data` | Sensitive data consent text ("Letters may include health and other sensitive details about you and your child...") | Consent | Account holders | Yes, separate button (register CR-020, CR-031) |
| `ai-processing` | Third-party AI consent (server transcription, edit pass) naming providers and purposes | Consent | Account holders; web contributors if ever offered | Yes, explicit (Apple 5.1.2(i)) |
| `analytics` | Usage analytics and crash reporting consent | Consent | Everyone on the app | Yes (Apple 5.1.1(ii)) |
| `auto-renewal-terms` | Plus subscription and automatic-renewal terms shown on the paywall | Agreement | Purchasers | Yes, purchase is the act (California ARL) |
| `contributor-notice` | Web contribution page notice and terms for invitees without accounts | Agreement + notice | Web contributors | Yes, "Send" with notice adjacent |
| `backup-recovery` | Standard (escrow) versus Vault mode disclosure | Acknowledgment | Users turning on backup | Yes, acknowledge (ADR 0006) |
| `subprocessors` | List of service providers and processors | Notice | Public | No |
| `pledge` | Shutdown and portability pledge (PRD C s.7 item; COMPETITIVE_RESEARCH s.7 item 6) | Commitment | Public | No |
| `accessibility` | Accessibility statement | Notice | Public | No |
| `legal-process` | Law-enforcement and legal-process guidelines | Notice | Public | No |

Drafts live in `docs/legal/` (other agents own `terms`, `privacy` and the deletion spec). **Published** text lives in `packages/content/legal/<key>/<version>.md`, because `packages/content` is the single home of every word the product says (CLAUDE.md). Published files are immutable.

---

## 2. Version numbers (semver)

Format `MAJOR.MINOR.PATCH`, starting at `1.0.0` for the first public version. Each document has its own sequence.

### 2.1 Major: material change

A change is **major** if a reasonable user would want to know before it applies to them. Major always triggers notice (s.5), and for documents that need an affirmative act, **re-consent** (s.6). Major includes any of:

1. Collecting a new category of personal data, or collecting existing data in a new way (for example, audio leaving the device for a purpose it did not before).
2. Using data for a new purpose, especially anything touching previously collected data (FTC retroactive-change theory, register CR-011). Example: any model training on letters or recordings, which we commit never to do.
3. Sharing with a new **category** of recipient, or any sale or "sharing" (CCPA sense).
4. Longer retention, or a narrower deletion or export right.
5. Weaker security or encryption model (for example, changing escrow defaults).
6. Changes to fees, renewal, trial or cancellation terms (`auto-renewal-terms`), or to the free scope promised in the keep-and-leave rule (PRD C s.4.1).
7. Changes to dispute resolution, arbitration, governing law, liability caps or the user's licence to their own content.
8. Changes to who can see what (family visibility rules, PRD B F9).
9. Anything counsel classifies as material.

### 2.2 Minor: non-material, substantive

- Clarifies existing practice without changing it.
- Adds rights or protections (for example, a new state's rights section).
- Adds a new optional feature that carries its own separate consent.
- Replaces a vendor with another in the same category with equal or better protection (also update `subprocessors`).
- Notice only via the changelog and an optional in-app "What changed" link. No re-consent.

### 2.3 Patch: editorial

Typos, formatting, broken links, contact details formatting, translation fixes that do not change meaning. No notice. Still archived and hashed.

### 2.4 Rules

- **When in doubt, it is major.** The classification and its one-paragraph rationale are written in the changelog and approved by counsel.
- A version number is never reused, even for an unpublished draft that leaked.
- Translations (en-US, en-IN, Hindi later) share the version of the English source. A translation-only fix is a patch on that locale file; the English file is unchanged and the manifest records per-locale hashes.
- Consent texts (`sensitive-data`, `ai-processing`, `analytics`) are versioned like any other document. Changing a consent's scope is major and needs fresh consent; the old consent does not cover the new scope.

---

## 3. Effective dates

Each version carries three timestamps (UTC, shown to users in their local date):

| Field | Meaning |
|---|---|
| `published_at` | Text is public at its permanent URL. |
| `new_users_from` | From this moment new sign-ups accept this version. Normally equals `published_at`. |
| `effective_at` | Moment it binds existing users. For major changes at least **30 days** after `published_at` unless counsel approves a shorter period because the change is legally required or purely protective. Minor and patch: equal to `published_at`. |

During the gap between `published_at` and `effective_at`, existing users remain on their accepted version. The app and server must handle two current versions at once (old for existing users, new for new users).

---

## 4. Where documents are published

Domain comes from `packages/brand` (`brand.company.domain`; currently a placeholder, PRD A Q3).

| URL | Content | Rules |
|---|---|---|
| `https://<domain>/legal` | Index of all documents with current version and effective date | |
| `https://<domain>/legal/<key>` | Current effective version for existing users | Shows "Version X.Y.Z, effective <date>" at the top, plus a banner if a newer version is published but not yet effective, linking to it and to the changes page |
| `https://<domain>/legal/<key>/<version>` | Permanent, immutable copy of that version | Never edited or removed. `noindex` not required. |
| `https://<domain>/legal/<key>/changes` | Changelog for that document | Plain-language summaries first |
| `https://<domain>/legal/<key>/<version>.md` | Raw source with frontmatter | For audit and archive |
| `https://<domain>/delete-account` | Account and data deletion request page (Google Play requirement, register CR-091) | |
| `https://<domain>/privacy-choices` | How to exercise rights and withdraw consents | |

In-app links always open the **versioned** URL that applies to that user (or the version being offered), never the floating `/legal/<key>`, so the user reads exactly what they accept. The App Store and Play metadata privacy URLs use the floating URL.

Archiving: on every publish, the CI job also requests an Internet Archive snapshot of the new versioned URL (best effort; independent evidence of publication date).

---

## 5. Notice of changes

| Class | Account holders | Web contributors (no email) | Public |
|---|---|---|---|
| Major | Email (transactional) on `published_at` with the plain-language summary, the effective date and links to the new version and the changes page; in-app card from `published_at` until accepted or `effective_at`; re-consent sheet at `effective_at` for documents that need acceptance (s.6) | Notice banner on the return-link page at next visit; acceptance on next "Send" | Banner on `/legal/<key>` |
| Minor | Changelog; optional "What changed" link in Settings > Legal | None | Changelog |
| Patch | None | None | Changelog entry (one line) |

Rules:
- **30 days' notice** for major changes to existing users, as above. Price changes to subscriptions also follow the ARL window of 7 to 30 days before the change (register CR-050) and the store's own price-consent flows; the `auto-renewal-terms` version changes in the same release.
- Notice emails are transactional and go to every account holder with an email, including Apple private relay addresses. They are sent even if marketing email is off. Delivery is logged (template id, version, time), never content.
- **Continued use is never treated as consent** to a change that expands use or sharing of data already collected; those need an affirmative act (CR-011).
- Notice never interrupts recording, saving or reading. Cards are calm, follow VOICE.md, and contain no urgency language.
- If a change is also an Apple "significant change" for Texas purposes (register CR-004), engineering also triggers the Significant Change API flow. While we refuse under-18 users this mostly reduces to a no-op, but the hook exists.
- Store disclosures (Apple privacy labels, Play Data safety) are updated in the same release that ships the change, never after (LEGAL-REQ-042).

---

## 6. Re-consent behaviour

At or after `effective_at`, for a document that needs an affirmative act (`terms`, consents, `auto-renewal-terms` for renewals governed by new terms, `contributor-notice`):

1. On next foreground with network, the app shows a sheet: summary of what changed (from the changelog), link to the full version, **Agree**, and **Not now**.
2. **Agree** writes an `accept` row (s.7).
3. **Not now** writes a `decline` row. Consequences, by design and pending counsel: everything on the phone keeps working (record, review, read, play, export; PRD C keep-and-leave rule); server features that depend on the changed document pause (sync, family, backup) and Settings explains how to export, delete the account, or agree later. Nothing is deleted because someone declined.
4. **Export and delete are never gated** behind accepting new terms.
5. A changed consent (`ai-processing`, `sensitive-data`, `analytics`) that the user does not re-grant is treated as withdrawn for the new scope; the feature falls back (for example, AI routes to on-device only).

---

## 7. How the app records consent

### 7.1 Principles

- Append-only history. A user's current state is the latest row per document.
- Server time is authoritative (`accepted_at`); device time is kept separately for offline acts.
- Record what was shown: document version plus a hash of the exact rendered text for short in-app consent texts.
- Minimal: no IP address, no user agent string, no free text. App version, platform and locale are enough to reconstruct the screen from the evidence archive (s.8). Counsel may decide IP is needed for enforceability; if so, store a truncated IP and disclose it.
- Retention: rows survive account deletion in pseudonymised form for the limitation period (proposed 3 years after the account ends, which also satisfies the ARL record rule of 3 years or 1 year after termination, whichever is longer [compliance-register L7]). Counsel to confirm against MHMDA deletion rules (register s.6 Q7). Disclosed in the Privacy Policy.

### 7.2 SQL (proposed new migration; never edit applied migrations)

File name suggestion: `supabase/migrations/2026100XXXXXXX_policy_versioning.sql`. Written in the style of the existing migrations (security-definer functions, `(select auth.uid())`, revoke from `anon`). Smoke-tested on 2 Oct 2026 in PGlite on top of the two applied migrations, with the same auth stubs as `supabase/tests/rls.test.mjs`: applies cleanly; a new user needs `terms`; users cannot read others' rows; direct inserts and updates are refused; a major version with under 30 days' notice is refused; a later major version voids an older consent; accepting a superseded version is refused; deleting a profile pseudonymises its rows; `anon` cannot record and `authenticated` cannot call `has_active_consent`. Port these checks into `supabase/tests/rls.test.mjs` when the migration is added. Not tested on hosted Supabase.

```sql
-- ─── Legal documents and versions ───────────────────────────────────────
create table public.policy_documents (
  key text primary key check (key ~ '^[a-z][a-z0-9-]{1,40}$'),
  title text not null check (char_length(title) <= 120),
  needs_affirmative_act boolean not null
);

create table public.policy_versions (
  document text not null references public.policy_documents(key),
  version text not null check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  major int generated always as (split_part(version, '.', 1)::int) stored,
  minor int generated always as (split_part(version, '.', 2)::int) stored,
  patch int generated always as (split_part(version, '.', 3)::int) stored,
  change_class text not null check (change_class in ('initial', 'major', 'minor', 'patch')),
  requires_reconsent boolean not null,
  published_at timestamptz not null,
  new_users_from timestamptz not null,
  effective_at timestamptz not null,
  content_sha256 bytea not null,          -- sha256 of the published English markdown
  url text not null,                      -- permanent versioned URL
  summary text not null check (char_length(summary) <= 600),  -- plain-language change line
  primary key (document, version),
  check (new_users_from >= published_at),
  check (effective_at >= published_at)
);

-- Versions are immutable; a major change to a document that needs an affirmative act
-- must require re-consent; major changes need 30 days' notice unless counsel approves.
-- (A trigger, because check constraints cannot query policy_documents.)
create or replace function public.policy_versions_guard()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
declare v_affirm boolean;
begin
  if tg_op = 'UPDATE' then
    raise exception 'policy_versions rows are immutable; publish a new version';
  end if;
  select needs_affirmative_act into v_affirm from policy_documents where key = new.document;
  if new.change_class = 'major' and v_affirm and not new.requires_reconsent then
    raise exception 'major change to % must require re-consent', new.document;
  end if;
  if new.change_class = 'major' and new.effective_at < new.published_at + interval '30 days'
     and current_setting('app.allow_short_notice', true) is distinct from 'on' then
    raise exception 'major change needs 30 days notice unless counsel approves short notice';
  end if;
  return new;
end;
$$;

create trigger policy_versions_guard before insert or update on public.policy_versions
  for each row execute function public.policy_versions_guard();
```

```sql
-- ─── Acceptances (append-only) ──────────────────────────────────────────
create table public.policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  subject_hash bytea,                     -- set when the profile is deleted (pseudonymised retention)
  document text not null,
  version text not null,
  action text not null check (action in ('accept', 'decline', 'withdraw', 'acknowledge')),
  method text not null check (method in (
    'signin_sheet',          -- sign-in-wrap on the account sheet (PRD A F3/F4)
    'reconsent_sheet',       -- s.6
    'consent_sheet',         -- feature consents: ai-processing, sensitive-data, analytics, backup-recovery
    'settings_toggle',       -- grant or withdraw from Settings > Privacy
    'paywall_purchase',      -- auto-renewal-terms shown and purchase confirmed
    'web_contributor_page',  -- "Send" on the web contribution page
    'web_account_page',      -- browser flows (deletion page, privacy choices)
    'support_assisted'       -- recorded by support on a verified request, e.g. withdrawal by email
  )),
  surface text not null check (surface ~ '^[a-z0-9_.]{1,64}$'),  -- screen or component id, e.g. 'auth.sheet'
  accepted_at timestamptz not null default now(),                 -- server time, authoritative
  client_recorded_at timestamptz,                                  -- device time of the tap (offline queue)
  app_version text not null check (char_length(app_version) <= 32),
  platform text not null check (platform in ('ios', 'android', 'web')),
  locale text check (locale ~ '^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$'),
  rendered_sha256 bytea,                  -- hash of the exact consent text rendered, when short-form
  context jsonb not null default '{}'::jsonb,  -- enums and ids only, e.g. {"product":"el_plus_annual_2999","trial":true}
  foreign key (document, version) references public.policy_versions(document, version),
  check (profile_id is not null or subject_hash is not null),
  check (pg_column_size(context) <= 512)
);

create index policy_acceptances_profile_idx on public.policy_acceptances (profile_id, document, accepted_at desc);
create index policy_acceptances_doc_version_idx on public.policy_acceptances (document, version);

comment on table public.policy_acceptances is
  'Append-only record of acceptance, decline, withdrawal and acknowledgment of versioned legal texts. No IP, no user agent, no free text.';

-- Rows are immutable except the pseudonymisation step on account deletion.
create or replace function public.policy_acceptances_guard()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('app.retention_purge', true) is distinct from 'on' then
      raise exception 'policy_acceptances rows are append-only';
    end if;
    return old;
  end if;
  -- UPDATE: only allow profile_id -> null together with subject_hash being set.
  if new.profile_id is null and old.profile_id is not null and new.subject_hash is not null
     and (new.id, new.document, new.version, new.action, new.method, new.surface, new.accepted_at,
          new.client_recorded_at, new.app_version, new.platform, new.locale, new.rendered_sha256, new.context)
         is not distinct from
         (old.id, old.document, old.version, old.action, old.method, old.surface, old.accepted_at,
          old.client_recorded_at, old.app_version, old.platform, old.locale, old.rendered_sha256, old.context) then
    return new;
  end if;
  raise exception 'policy_acceptances rows are append-only';
end;
$$;

create trigger policy_acceptances_guard before update or delete on public.policy_acceptances
  for each row execute function public.policy_acceptances_guard();

-- Pseudonymise before the profile row disappears. The pepper lives in Supabase Vault
-- (mechanism Unverified; any server-only secret works) so hashes cannot be reversed by
-- guessing UUIDs from a leaked dump alone.
create or replace function public.policy_acceptances_pseudonymise()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  update policy_acceptances
     set subject_hash = sha256(convert_to(old.id::text || coalesce(current_setting('app.consent_pepper', true), ''), 'UTF8')),
         profile_id = null
   where profile_id = old.id;
  return old;
end;
$$;

create trigger profiles_pseudonymise_acceptances before delete on public.profiles
  for each row execute function public.policy_acceptances_pseudonymise();

-- ─── Recording an act (the only write path for clients) ─────────────────
create or replace function public.record_policy_act(
  p_document text,
  p_version text,
  p_action text,
  p_method text,
  p_surface text,
  p_app_version text,
  p_platform text,
  p_locale text default null,
  p_client_recorded_at timestamptz default null,
  p_rendered_sha256 bytea default null,
  p_context jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_ver policy_versions%rowtype; v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_method = 'support_assisted' then raise exception 'support-assisted acts are recorded by the service role'; end if;
  select * into v_ver from policy_versions where document = p_document and version = p_version;
  if not found then raise exception 'unknown document version'; end if;
  if v_ver.new_users_from > now() then raise exception 'version not yet published'; end if;
  -- Accepting a superseded version is refused so stale clients cannot pin old terms.
  if p_action = 'accept' and exists (
       select 1 from policy_versions n
        where n.document = p_document and n.new_users_from <= now()
          and (n.major, n.minor, n.patch) > (v_ver.major, v_ver.minor, v_ver.patch)
          and n.requires_reconsent) then
    raise exception 'a newer version requires acceptance';
  end if;
  if p_client_recorded_at is not null and p_client_recorded_at > now() + interval '5 minutes' then
    p_client_recorded_at := null;  -- device clock in the future; keep server time only
  end if;
  insert into policy_acceptances (profile_id, document, version, action, method, surface,
                                  client_recorded_at, app_version, platform, locale, rendered_sha256, context)
  values (auth.uid(), p_document, p_version, p_action, p_method, p_surface,
          p_client_recorded_at, p_app_version, p_platform, p_locale, p_rendered_sha256, coalesce(p_context, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

-- ─── Current state for the signed-in user ───────────────────────────────
create or replace view public.my_policy_state with (security_invoker = true) as
select distinct on (a.document)
       a.document, a.version, a.action, a.accepted_at
  from public.policy_acceptances a
 where a.profile_id = (select auth.uid())
 order by a.document, a.accepted_at desc;

-- Documents the caller must act on now (re-consent or never accepted).
create or replace function public.policy_actions_needed()
returns table (document text, version text, effective_at timestamptz, summary text)
language sql stable security definer set search_path = public, pg_catalog as $$
  with cur as (
    select distinct on (v.document) v.*
      from policy_versions v join policy_documents d on d.key = v.document
     where d.needs_affirmative_act and v.effective_at <= now()
     order by v.document, v.major desc, v.minor desc, v.patch desc
  ), mine as (
    select distinct on (a.document) a.document, a.version, a.action
      from policy_acceptances a
     where a.profile_id = auth.uid() and a.action in ('accept', 'decline', 'withdraw')
     order by a.document, a.accepted_at desc
  )
  select c.document, c.version, c.effective_at, c.summary
    from cur c left join mine m on m.document = c.document
    left join policy_versions mv on mv.document = m.document and mv.version = m.version
   where c.document in ('terms', 'contributor-notice')   -- consents are offered, not demanded
     and (m.document is null or m.action <> 'accept' or (c.requires_reconsent and mv.major < c.major));
$$;

-- Server-side consent check for Edge Functions (AI gateway, analytics relay).
create or replace function public.has_active_consent(p_profile uuid, p_document text)
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
  select coalesce((
    select a.action = 'accept'
      from policy_acceptances a
      join policy_versions v on v.document = a.document and v.version = a.version
     where a.profile_id = p_profile and a.document = p_document
       and not exists (                       -- a later major version with new scope voids old consent
         select 1 from policy_versions n
          where n.document = a.document and n.effective_at <= now()
            and n.requires_reconsent and n.major > v.major)
     order by a.accepted_at desc
     limit 1), false);
$$;

-- ─── Access rules ───────────────────────────────────────────────────────
alter table public.policy_documents enable row level security;
alter table public.policy_versions enable row level security;
alter table public.policy_acceptances enable row level security;

create policy policy_documents_read on public.policy_documents for select to anon, authenticated using (true);
create policy policy_versions_read on public.policy_versions for select to anon, authenticated using (true);
create policy policy_acceptances_own_read on public.policy_acceptances for select to authenticated
  using (profile_id = (select auth.uid()));
-- No insert/update/delete policies: writes go through record_policy_act (clients)
-- or the service role (publishing, support-assisted, retention purge).

revoke execute on function public.policy_versions_guard() from public, anon, authenticated;
revoke execute on function public.policy_acceptances_guard() from public, anon, authenticated;
revoke execute on function public.policy_acceptances_pseudonymise() from public, anon, authenticated;
revoke execute on function public.has_active_consent(uuid, text) from public, anon, authenticated;  -- service role only
revoke execute on function public.record_policy_act(text, text, text, text, text, text, text, text, timestamptz, bytea, jsonb) from public, anon;
grant execute on function public.record_policy_act(text, text, text, text, text, text, text, text, timestamptz, bytea, jsonb) to authenticated;
revoke execute on function public.policy_actions_needed() from public, anon;
grant execute on function public.policy_actions_needed() to authenticated;
```

Notes for the technical design agents:
- Web contributors use an anonymous Supabase session (PRD B F6); `auth.uid()` exists, so `record_policy_act` works for them with `method = 'web_contributor_page'`. Whether anonymous users get `authenticated` role claims is **Unverified**; confirm when building B-REQ-008.
- Acts made before an account exists (only `analytics` can be, because Terms are accepted at sign-in) are stored locally with `client_recorded_at` and uploaded by `record_policy_act` right after sign-in, in the same transaction as data re-ownership (PRD A-REQ-015).
- PowerSync: sync `my_policy_state` rows to the device so consent checks work offline; the server-side check (`has_active_consent`) is still authoritative for anything leaving the device.
- Retention purge: a scheduled service-role job with `set local app.retention_purge = 'on'` deletes pseudonymised rows older than the retention period (proposed 3 years after `subject_hash` was set; requires a `pseudonymised_at` column if counsel confirms; add it in the same migration).
- `entries`, `child_members` and other tables are unchanged by this migration.

### 7.3 What each surface records

| Surface | Document(s) | Action | Method | `context` |
|---|---|---|---|---|
| Sign-in sheet (PRD A F3/F4) | `terms` (+ `privacy` acknowledge) | accept | `signin_sheet` | `{"auth":"apple|google|email"}` |
| Age confirmation (LEGAL-REQ-002) | recorded as part of `terms` acceptance | n/a | n/a | `{"age_attested":true,"age_signal":"declared_range|none"}` (no birth date) |
| Sensitive-data consent | `sensitive-data` | accept / decline | `consent_sheet` | `{}` |
| AI consent sheet (ARCH s.8) | `ai-processing` | accept / decline / withdraw | `consent_sheet` / `settings_toggle` | `{"scope":["transcribe","edit_pass"]}` |
| Analytics consent | `analytics` | accept / decline / withdraw | `consent_sheet` / `settings_toggle` | `{"crash":true,"usage":true}` |
| Plus paywall | `auto-renewal-terms` | accept | `paywall_purchase` | `{"product":"el_plus_annual_2999","intro_offer":"trial_2m","storefront":"USA"}` |
| Backup on | `backup-recovery` | acknowledge | `consent_sheet` | `{"mode":"standard|vault"}` |
| Web contribution "Send" | `contributor-notice` | accept | `web_contributor_page` | `{"age_attested":true}` |
| Re-consent sheet | changed document | accept / decline | `reconsent_sheet` | `{}` |

---

## 8. Changelog format and evidence archive

Each document has `packages/content/legal/<key>/CHANGELOG.md`, newest first:

```markdown
## 2.0.0 (major) - published 2026-11-02, new users 2026-11-02, effective 2026-12-03

Summary shown to users (max 600 characters, plain words, passes content rules):
We now offer cloud transcription for Hindi-English letters, only if you turn it on. Nothing changes unless you choose it.

Changes:
- s.4 "Who helps us run Early Letters": adds a transcription provider category.
- s.6 "Your choices": adds how to turn cloud transcription off.

Why: new optional feature (ARCH Phase 1.x Hinglish model).
Classification: major, because a new category of recipient receives audio (s.2.1 item 3).
Re-consent: required for ai-processing; terms unchanged.
Notice: email + in-app card sent 2026-11-02; template notice.policy_change v2.0.0.
Approved by: <counsel name>, 2026-10-30.
Hashes: en-US sha256 <...>; en-IN sha256 <...>.
```

Evidence archive, kept in the repo and backed up:
- `docs/legal/evidence/<key>/<version>/` with: the approved PDF render, counsel approval note, screenshots of every surface that shows or links the document (per platform, light and dark, largest Dynamic Type), the notice email template as sent.
- Screenshots are of fictional data only (the "Asha" family, CLAUDE.md).

---

## 9. Release and CI controls

1. `packages/content/legal/manifest.json` lists `{key, version, published_at, new_users_from, effective_at, sha256 per locale, url}`. Generated by `npm run legal:publish`, never hand-edited.
2. CI fails if: a published version file's hash differs from the manifest (immutability); a manifest version has no matching row in a migration (`policy_versions` insert); an in-app link to a legal document is not a versioned URL; a consent surface renders text whose hash is not in the manifest.
3. Publishing a version is a pull request containing: the new markdown, the changelog entry, the manifest change, a migration inserting the `policy_versions` row, updated store-disclosure exports if data practices changed (LEGAL-REQ-042), and counsel approval in the PR description.
4. The app bundles the manifest at build time for offline display, and checks `policy_actions_needed()` on foreground with network so a new version can take effect without an app release.

---

## 10. Review cadence

| Cadence | What | Who |
|---|---|---|
| Every release | Data-map diff (new SDK, endpoint, field, processor, feature that touches personal data) triggers a classification decision for `privacy`, `health-privacy`, `subprocessors` and store disclosures | Eng lead + founder |
| Quarterly | Compliance register status review; state-law tracker; claims registry versus shipped copy | Founder + counsel |
| Every 12 months at least | Full review and re-publish of `privacy` (CCPA requires updating the privacy policy at least once every 12 months where CCPA applies; Unverified, statute not opened) and of every other document, even if only the review date changes (patch) | Counsel |
| Triggered | New jurisdiction or storefront; new law effective date (for example California age-assurance, 1 Jan 2027); incident; regulator inquiry; App Review or Play policy change; any user-facing claim change | Founder + counsel |

Roles: **Owner** (founder) keeps the register and calendar; **Approver** (counsel) classifies and approves; **Publisher** (engineering) runs the publish PR and verifies URLs, hashes and in-app surfaces.

---

## Sources

- `compliance-register.md` sources [L7] (California ARL record retention and notice windows), [L13] (Apple 5.1.1, 5.1.2(i)), [L14]/[L15] (Texas significant change), [L16] (Google Play deletion web link), [L19] (Connecticut). Opened 2 Oct 2026; see that file for URLs.
- Repo: PRD A (A-REQ-015, A-REQ-034), PRD B (F6, F9), PRD C (s.4.1, s.7), ARCHITECTURE s.8, ADR 0006, core migration conventions.
- Unverified: CCPA annual privacy-policy update duty; Supabase Vault usage for the pepper; anonymous-session role claims in Supabase; behaviour on hosted Supabase (PGlite smoke test only).

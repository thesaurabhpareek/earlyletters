# Runbook: the founder cannot act

One page for the days the founder is ill, away or has lost his devices. Owner: `ops`; counsel reads it before any second person holds anything. Written 24 Nov 2026 for BL-2102 (FR-BKO-18). Source of truth: `docs/product/prd/functions/back-office.md` FR-BKO-18 and its matrix (section 4). Nothing here changes a promise to a family, and it adds no time to one.

## The second person

Second person: **not named.** The founder names one trusted person here, by role and relationship only (no name, email or phone number in the repo); until he does, the default below holds. Naming the person is the founder's step, outside BL-2102.

Before that person holds anything that can reach production or the `hello@` mailbox, the Privacy Policy sentence "Today only the founder has that access" (section 3) changes and counsel has read the new one (Q-BKO-3). Until then, the person holds nothing in the list below, and `docs/ops/ACCESS.md` lists only the founder under "Who holds production access today" (`packages/content/test/access-page.test.ts` holds the two together).

## What the second person would hold

- A sealed recovery kit: the password manager's emergency kit and the console recovery codes (`docs/ops/ACCESS.md`, Consoles; `docs/ops/SECURITY.md` section 3), opened only if the founder cannot act.
- A one-page "pause and tell people" card: this page, printed.

## What they could do, and only this

1. Read this card.
2. Publish a pause using the cold-backup signing key (`docs/ops/SECRETS.md`, `EL_SIGNING_KEY` primary and cold backup; `scripts/packs/publish.ts`). A switch hides a feature; none can stop a family's export (`packages/api/src/kill-switches.ts` header, LEGAL-REQ-040). The step-by-step pause runbook is FR-OPS-01 and is not written yet; until it is, this step cannot be run by anyone but the founder.
3. Send one holding message from `hello@` saying the service is paused and exports still work. Its words are not written yet; `content` writes them and they are approved before anyone holds the kit. Nothing else goes from `hello@`.

## What they never do

- Read the mailbox for requests, or open a letter, a request or a report (FR-POL-12). Data requests wait for the founder.
- Run a step from `data-requests-by-email.md`, sign in to the Supabase dashboard, or open the request log.
- Give anyone else the kit, or keep a copy of anything in it.

## Default while no one is named

No second person. What the founder does in advance instead:

- A pre-written holding line for the website, ready to publish (words from `content`, approved; not written yet).
- The pause staged on staging, so publishing it to production is one step for the founder.
- The risk accepted in writing: while the founder cannot act, the 45-day clocks of open data requests keep running, and a request can pass day 45 with no extension notice. The weekly card (`data-requests-by-email.md` section 11) shows how close each one is; run it before planned time away and send any extension notice that will fall due while away.

## Open, outside BL-2102

- The founder names the second person (or confirms the default) and records the acceptance of the risk above.
- Counsel reads the changed policy sentence before the kit is handed over (Q-BKO-3).
- FR-OPS-01 (the pause runbook) and the two holding texts.

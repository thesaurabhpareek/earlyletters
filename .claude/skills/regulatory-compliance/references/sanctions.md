# Sanctions and embargoed places

Engineering notes, not legal advice. Confirm with counsel before changing what we block.

## What OFAC asks of a business like ours
OFAC FAQ 445 (ofac.treasury.gov/faqs/445, read 31 Oct 2026): US persons must avoid unauthorized dealings with people on the SDN List and with comprehensively sanctioned jurisdictions. OFAC recommends "a tailored, risk-based compliance program", which may include list screening, and says no single program fits every business. OFAC publishes its lists free, in formats suitable for automated screening.

## Our risk, in plain terms
- We sell nothing directly. Subscriptions go through Apple's in-app purchase on the US storefront only (D-006 to D-014, "US-only").
- The exposure is the free service: a person in an embargoed place creating an account (v1.1), or a relative abroad using the web contribution page (later, D-055, which superseded D-002).
- The Terms already ask every user to confirm they are not in an embargoed place and not on a US restricted-party list (Terms 2.4).

## What we do (ruled by Karma, CR-22, pending one founder decision)
1. **Block places, not people.** At v1.1, Crimea, Donetsk and Luhansk are covered only by the Terms confirmation (country data cannot single them out). A `before user created` auth hook and the web contribution page (when it ships, D-055) check the request's country against `ops.restricted_jurisdictions` and refuse with a neutral, accessible message that does not dead-end (it says where to read more).
2. **No name screening.** Screening names would make us collect legal names we otherwise never need, which works against data minimisation and our privacy promises. With no payments through us and a US-only storefront, the Terms attestation plus the place block is a proportionate risk-based program in our engineering reading. Revisit if we ever take payments directly, ship outside the US storefront, or counsel says otherwise.
3. **Log counts, not people.** A blocked request writes one increment to `ops.compliance_check_counts` (day, check, outcome, jurisdiction code). The IP is used in memory to find the country and is never stored.
4. **Fail open when there is no answer.** No geo data, no IP, an unknown country, a lock during a geo load, or an internal error lets the sign-up through and counts `geo_unknown` or `error`. Blocking every sign-up because a file is late would be an outage, not a control. Data older than 45 days is still used, counted as `geo_stale`, and flagged in `ops_compliance_report`; there is no alert yet (not yet: ops alert).

## Jurisdictions (status checked 31 Oct 2026)
| Code | Place | Program | Our status | Notes |
|---|---|---|---|---|
| KP | North Korea | Comprehensive | block | |
| IR | Iran | Comprehensive | block (default) | GL D-2 authorizes fee-based or no-cost internet communication services, excluding the Government of Iran and blocked persons. Open founder and counsel question. |
| CU | Cuba | Comprehensive | block (default) | 31 CFR 515.578 authorizes certain internet communication services (OFAC FAQ 1175). Same open question. |
| UA-43, UA-40 | Crimea, Sevastopol | Comprehensive (regional) | block where region data allows | Country-level IP data cannot resolve these. The auth hook cannot block them; the web page can, using the platform's region header. |
| UA-14, UA-09 | Donetsk, Luhansk (covered regions) | Comprehensive (regional) | as above | as above |
| SY | Syria | Countrywide sanctions terminated (EO 14312, 30 Jun 2025; 31 CFR 542 removed Aug 2025) | not blocked | List-based sanctions on specific people remain. |

The open question: blocking Iran and Cuba would shut out overseas grandparents once the web contribution page ships (D-055), and the general licenses may make the block unnecessary. Until counsel confirms, the default fails closed (block). This costs nothing today: accounts ship in v1.1 and the web page later.

## Data sources (open, free, licence checked)
| Source | Use | Licence | Checked |
|---|---|---|---|
| OFAC Sanctions List Service | Not used today (no name screening). Watch for program changes. | US government work | 31 Oct 2026 |
| Federal Register API | Regulatory watch: new or changed sanctions rules | US government work | 31 Oct 2026 |
| DB-IP "IP to Country Lite" | IP to country in the auth hook | CC BY 4.0: attribution to DB-IP.com required (link on pages that use the results); monthly updates; CSV and MMDB | 31 Oct 2026 |
| OpenSanctions | Not used | CC BY-NC 4.0; commercial use needs a paid licence | 31 Oct 2026 |

## Open for counsel
- Terms 2.4 also names "terrorist supporting" countries. Today that list (Cuba, North Korea, Iran) matches our block list (checked-facts, 31 Oct 2026). Allowing Iran or Cuba would contradict Terms 2.4, so it needs a Terms change too (founder).
- Iran GL D-2 excludes the Government of Iran and blocked persons, so allowing Iran would reopen whether we must screen names.
- Whether a refused sign-up's `block` count survives GoTrue's transaction is unverified (APPLY.md File 27, step 4).

## Known limits (say these out loud)
- VPNs get around any IP block. OFAC expects reasonable effort, and the Terms attestation covers the rest.
- IP geolocation is wrong for some addresses. A blocked person can write to support; support never asks for their location.

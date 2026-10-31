# Sanctions and embargoed places

Engineering notes, not legal advice. Confirm with counsel before changing what we block.

## What OFAC asks of a business like ours
OFAC FAQ 445 (ofac.treasury.gov/faqs/445, read 31 Oct 2026): US persons must avoid unauthorized dealings with people on the SDN List and with comprehensively sanctioned jurisdictions. OFAC recommends "a tailored, risk-based compliance program", which may include list screening, and says no single program fits every business. OFAC publishes its lists free, in formats suitable for automated screening.

## Our risk, in plain terms
- We sell nothing directly. Subscriptions go through Apple's in-app purchase on the US storefront only (D-013, D-083: US only at launch).
- The exposure is the free service: a person in a blocked country creating an account (sign-in: alpha build 2 now, the public in a 1.0.x, D-121), or a relative abroad using the web contribution page (later, D-055, which superseded D-002).
- The Terms already ask every user to confirm they are not in an embargoed place and not on a US restricted-party list (Terms 2.4).

## What we do (CR-26; the country list is founder decision D-131)
1. **Block places, not people.** At sign-up, Crimea, Donetsk and Luhansk are covered only by the Terms confirmation (country data cannot single them out). A `before user created` auth hook and the web contribution page (when it ships, D-055) check the request's country against `ops.restricted_jurisdictions` and refuse with a neutral, accessible message that does not dead-end (it says where to read more).
2. **No name screening, as a default pending the founder and counsel.** Screening names would make us collect legal names we otherwise never need, which works against data minimisation and our privacy promises. With no payments through us and a US-only storefront, Karma's and the CCO's engineering reading is that the Terms attestation plus the country block is proportionate. But accepting that residual risk is the founder's call with counsel (CCO skill section 5), so it is listed under "Open for counsel" below. Revisit if we take payments directly, ship outside the US storefront, or counsel says otherwise.
3. **Log counts, not people.** A blocked request writes one increment to `ops.compliance_check_counts` (day, check, outcome, jurisdiction code). The IP is used in memory to find the country and is never stored.
4. **Fail open when there is no answer.** No geo data, no IP, an unknown country, a lock during a geo load, or an internal error lets the sign-up through and counts `geo_unknown` or `error`. Blocking every sign-up because a file is late would be an outage, not a control. Data older than 45 days is still used, counted as `geo_stale`, and flagged in `ops_compliance_report`; there is no alert yet (not yet: ops alert).

## Jurisdictions (founder decision D-131, 31 Oct 2026; sources read by the CCO the same day)
| Code | Place | Legal hook | Status | Notes |
|---|---|---|---|---|
| KP | North Korea | OFAC 31 CFR 510; EAR E:1 | block | |
| IR | Iran | OFAC 31 CFR 560; EAR 746.7, E:1 | block | Blocked regardless of GL D-2 (founder). |
| CU | Cuba | OFAC 31 CFR 515; EAR 746.1, E:2 | block | Blocked regardless of 31 CFR 515.578 (founder). |
| SY | Syria | EAR 746.9; still in E:1 | block | The OFAC countrywide program ended in 2025, but export rules remain. Comes off only after BIS removes Syria from E:1 and amends 746.9. |
| RU | Russia | EAR 746.8; EO 14071 | block | Lean to block: License Exception CCD (740.19) may apply but needs end-user screening we do not do. |
| BY | Belarus | EAR 746.8 | block | As Russia. |
| UA-43, UA-40 | Crimea, Sevastopol | EAR 746.6(a)(1); OFAC Ukraine-/Russia-related | block where region data allows | Web page only; at sign-up, the Terms confirmation. |
| UA-14, UA-09 | Donetsk, Luhansk | EAR 746.6(a)(2); EO 14065 | as above | Whole oblasts, which blocks more than required. |
| VE, MM, AF, SD | Venezuela, Burma, Afghanistan, Sudan | list-based only | not blocked | Sanctions name people and entities, not the country. |

## Data sources (open, free, licence checked)
| Source | Use | Licence | Checked |
|---|---|---|---|
| OFAC Sanctions List Service | Not used today (no name screening). Watch for program changes. | US government work | 31 Oct 2026 |
| Federal Register API | Regulatory watch: new or changed sanctions rules | US government work | 31 Oct 2026 |
| DB-IP "IP to Country Lite" | IP to country in the auth hook | CC BY 4.0: attribution to DB-IP.com required (link on pages that use the results); monthly updates; CSV and MMDB | 31 Oct 2026 |
| OpenSanctions | Not used | CC BY-NC 4.0; commercial use needs a paid licence | 31 Oct 2026 |

## Open for counsel
- Name screening (item 2 above): whether the attestation plus the country block is enough. Founder decision with counsel; the default is no screening.
- D-131's counsel list: whether the app is subject to the EAR at all (734.7 "published"), CCD for Russia and Belarus, the 5D992.c self-classification and any 740.17 reporting, whether sign-up blocking is enough when US-storefront downloads are not gated, Kherson and Zaporizhzhia.
- Terms 2.4 names "terrorist supporting" countries (Cuba, North Korea, Iran today); our list blocks all of them, so the Terms and the list agree.
- Whether a refused sign-up's `block` count survives GoTrue's transaction is unverified (APPLY.md File 27, step 4).

## Known limits (say these out loud)
- VPNs get around any IP block. OFAC expects reasonable effort, and the Terms attestation covers the rest.
- IP geolocation is wrong for some addresses. A blocked person can write to support; support never asks for their location.

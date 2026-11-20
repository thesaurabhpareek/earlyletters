# 04. Events and festivals in the USA: calendar, rules and content briefs

Status: PROPOSED (lifecycle playbook, part 4 of 5) | 20 Nov 2026 | Owner: `content` | Data file: [data/events-usa.csv](data/events-usa.csv) | Siblings: [README.md](README.md), [01-experience-content-map.md](01-experience-content-map.md), [02-email-lifecycle.md](02-email-lifecycle.md), [03-in-app-and-reminder-logic.md](03-in-app-and-reminder-logic.md), [05-backlog-proposed.md](05-backlog-proposed.md).

Written by `content`, a Claude role. Not a lawyer and not a cultural or religious authority. Docs and data only: no string here is live, no key exists in code, no date has been entered in the app. Every legal reading says "counsel must confirm". Every cultural reading says "a member of that community must read this". Nothing here overrides a ruling; where it disagrees with one it says so and asks.

Fictional family Asha only. Nothing here names or pictures a real family.

---

## 0. What this file says

1. **Most of the calendar already exists as a locked design.** `docs/product/prd/functions/days-library.md` (DAY) holds 72 days with rules, sources and 2026 to 2030 dates. Cards NS-46 and NS-47 in `docs/product/prd/21-days-cultural-photos-home.md` rule how a parent ticks them, when they fire and what a lock screen may show. `functions/cultural-background-data.md` (CUL) rules what we may keep. Part 3 ([03-in-app-and-reminder-logic.md](03-in-app-and-reminder-logic.md), section 11) is the logic and asks this part for the rows. This file does not redo any of that. It adds what was missing: a way to compute or read every date for ten years, heritage months, a regional layer, an options shape for background, content briefs per observance, a never-say list, and the cultural and counsel reading list. Section 2 is the table of what exists.
2. **The data file has 115 rows.** 81 are library days or library-eligible days, 14 are excluded on the DAY rule and listed so the exclusions can be audited, 9 are candidates I could not source, and 11 are rows that are not dates or that wait (a powwow, a milestone, regional days deferred by Q-FD-17, a duplicate, a typed-day pointer). Dates for 2027 and 2028 sit in `next_2027` and `next_2028` only where I verified them this session. Dates carried from DAY sit apart in `carried_2027` and `carried_2028` and were not re-read. The file also carries the fields part 3 section 11.1 asks for (`layer`, `precision`, `begins_at_sunset`, `authority`, `tone`, `public_title_ok`) and a release `drop`.
3. **"Logic based on the religion and region a customer gives" meets a ruling.** Q-FD-5 (accepted, CL-013) and NS-47-R2 keep the tradition and the country as a browse filter held in memory until the sheet closes. Only ticked days are stored. So there is no stored religion or region the app can reason from later, and part 3 section 11.4 says the same. What "based on" can mean today: (a) the order of the Browse list while the parent is picking, and afterwards the days already ticked (NS-46-R20); (b) the days the parent ticked. Section 7.2 spells out what that rules out. If the founder wants persistent background-driven logic, that is a new ruling and a counsel question (CUL-Q6). I recommend against it.
4. **"Region" has no source in the product.** The only region logic in the repo is the sign-up country check (the "region hook", File 28, NS-40-R9, E47, E72). It exists to refuse some countries, stores nothing on the phone and never asks where a person is. It must not feed events. The regional layer here works only through a place the parent picks in Browse, forgotten when the sheet closes. By default no regional row ships in the first drop (Q-FD-16, Q-FD-17). Section 6.
5. **Dates I could not verify and will not guess:** Nowruz 2027 and 2028 (I computed 21 Mar 2027 and 20 Mar 2028 from the equinox and a published rule, but I have no official Iranian calendar), Holi 2027 and 2028 (the page I could read has no data), the Baha'i holy days after 2026, Vesak 2028, and Vaisakhi after 2027. They are blank or carried and marked.
6. **Two proposals that need a ruling before words are written:** per-day landing lines (`days.landing.<id>.<n>`, which part 3's PC-3 can index by year), and a heritage-month layer and a regional layer, which DAY's six layers do not have. Section 13.
7. **Email and push:** every row's email key is "none" (E75: transactional only at 1.0) and every push key is "parked" (E79). I reserve names so a later ruling does not rename anything. I write no words for either.

---

## 1. What I read, and what I did not

Source ids (S1 and so on) are used in the data file and in every table. Status codes: **V** verified from the cited source this session; **VC** the rule is verified and I computed the date with a script; **C** carried from DAY, source named there, not re-read; **U** UNVERIFIED, no source read, no date written.

### 1.1 Repo files read this session

Branch base: `9e47574` (develop at 20 Nov, after the playbook parts 1 to 3 and 5 merged in #1035). The task named `e68541d`; the shallow clone has only the current head, so I branched from it.

`CLAUDE.md`; `docs/product/prd/functions/days-library.md` (sections 0 to 6 and the FR rows by header), `functions/cultural-background-data.md` (sections 0 to 3.7), `functions/notification-catalogue.md` (headings and the NS-48 scope line); `docs/product/prd/21-days-cultural-photos-home.md` (the five-card map, the rulings table, founder items, NS-46 sections 1 to 7, NS-47 sections 3 to 12 and 16); `18-errata-after-lock.md` (E43 to E59, E69 to E73, E75, E79, E82); `packages/content/VOICE.md`, `BRAND.md` (glossary), `test/rules.test.ts` (the fear and AI patterns); `packages/content/src/features/reminders.en.ts`; `packs/text-rules/en.json` header; `apps/mobile/src/lib/reminders/planner.ts` (header and kinds); `docs/agents/COORDINATION.md` section 10; and from this folder `README.md` and `03-in-app-and-reminder-logic.md` sections 6.4, 11, 12 and 14, plus grep of `01`, `02` and `05` for event content.

### 1.2 Outside sources read this session (20 Nov 2026)

| Id | Source | What it gave |
|---|---|---|
| S1 | U.S. Office of Personnel Management, federal holidays, opm.gov/policy-data-oversight/pay-leave/federal-holidays | Federal holiday dates 2026 to 2028 with weekend observance notes; "Washington's Birthday" is the statutory name (5 U.S.C. 6103(a)) |
| S3 | 36 U.S.C. 109 (Cornell LII) | "The third Sunday in June is Father's Day." |
| S4 | 36 U.S.C. 125 (Cornell LII) | National Grandparents Day is the first Sunday in September after Labor Day |
| S5 | Joint Resolution No. 13, 38 Stat. 770 (govinfo), 1914 | "the second Sunday in May shall hereafter be designated and known as Mother's Day" |
| S6 | U.S. Naval Observatory seasons service, aa.usno.navy.mil/api/seasons (2027 and 2028, tz=0) | Equinox and solstice instants in UTC |
| S7 | U.S. Naval Observatory, "Date of Easter", aa.usno.navy.mil/faq/easter | Definition of Easter, the Gregorian integer algorithm, the Orthodox (Julian) difference. No 2027 or 2028 date is printed there |
| S8 | Hebcal Diaspora feeds for 2027 and 2028 (hebcal.com) and the Chanukah 2027 page | Jewish holiday dates; Chanukah 2027 begins at sundown Fri 24 Dec 2027 |
| S9 | Hong Kong Observatory Gregorian-Lunar conversion tables 2027 and 2028 (hko.gov.hk text files) | Lunar New Year, Lantern, Dragon Boat, Mid-Autumn, Qingming. The table prints no authority line |
| S10 | Gulf News, "When is Ramadan 2027?" | Expected start 8 Feb 2027 and Eid al-Fitr 10 Mar 2027, pending sighting. It does not name the Umm al-Qura calendar |
| S11 | timeanddate.com US pages for Eid al-Adha, Eid al-Fitr, Ash Wednesday, Cesar Chavez Day | US-list Islamic dates (marked tentative, one-day variation, begin at sundown); Ash Wednesday 10 Feb 2027 and 1 Mar 2028; Cesar Chavez Day 31 Mar and the states that keep it. The 2027 and 2028 year pages and the Holi, Diwali (US) and Orthodox Easter pages failed to load |
| S12 | timeanddate.com India pages for Diwali, Vaisakhi, Holi | Diwali 29 Oct 2027 and 17 Oct 2028 (gazetted), regions can differ; Vaisakhi "around April 13 or 14", no 2027 or 2028 date; the Holi page had no 2027 or 2028 data |
| S13 | Drik Panchang, Diwali page | Lakshmi Puja 29 Oct 2027 and 17 Oct 2028; shows both purnimanta and amanta month names |
| S14 | Library of Congress heritage sites: blackhistorymonth.gov, womenshistorymonth.gov, asianpacificheritage.gov, jewishheritagemonth.gov, nativeamericanheritagemonth.gov | The month of each observance; each site is hosted by the Library of Congress with six or seven partner institutions; none states how the observance began |
| S15 | Library of Congress legal research guide, National Hispanic Heritage Month | Pub. L. 90-498 (1968 week), Pub. L. 100-402 (1988 month, "31-day period beginning September 15 and ending on October 15"); why the 15th |
| S16 | NIST, Daylight Saving Time | Second Sunday in March to first Sunday in November (Energy Policy Act of 2005); Hawaii, Arizona (not the Navajo Nation) and four territories do not observe it |
| S17 | State of Hawaii DHRD, "2027 Hawaii State Holidays" (cites HRS 8-1; marked "subject to change") | Kuhio Day 26 Mar, Good Friday 26 Mar, Kamehameha Day 11 Jun, Statehood Day 20 Aug in 2027 |
| S18 | officeholidays.com, Mardi Gras in Louisiana (secondary) | Legal state holiday in Louisiana; Alabama only in Baldwin and Mobile Counties; 9 Feb 2027 |
| S19 | National Park Service, cherry blossom bloom watch | Peak bloom is when 70 percent of Yoshino blossoms are open; it has fallen between March 15 and April 18; forecast about 10 days ahead at most |
| S20 | Smithsonian Folklife, American Indian Powwows | A powwow is any ceremonial gathering with traditional music and dances; held through the year; some American Indians feel they have been harmed by commercialisation and non-Native spectatorship |
| S21 | Smithsonian Insider, five facts about Dia de los Muertos | 1 and 2 Nov; tied to All Saints and All Souls; 1 Nov often used for children who have died |
| S22 | Britannica, Bon | Bon honours ancestors; 13 to 15 July in most places, August in some; Buddhist roots, not exclusively Buddhist |
| S23 | Smithsonian National Museum of American History, Three Kings Day | 6 Jan, Epiphany; Spanish-speaking countries, many Latin American countries, Louisiana Carnival |
| S24 | Britannica Kids, quinceanera | Described as a girl's 15th birthday; religious and social; practice and timing vary |
| S25 | Wikipedia, Umm al-Qura calendar (secondary) | A calculated Hijri calendar used in Saudi Arabia for administrative purposes; its month-start rule changed in AH 1423 |
| S26 | Religion Unplugged, "How Muslims determine when Ramadan begins" (secondary) | In the US "multiple methods are used": local sighting, common horizon, astronomical calculation, following Saudi Arabia |
| S27 | "A concise review of the Iranian calendar" (arXiv astro-ph/0409620) | The year begins at Tehran true midnight nearest the equinox; an equinox before noon makes that day the first day |
| S28 | Official Kwanzaa website | Described as an African American and Pan-African holiday and a cultural tradition; no dates on the page read |
| S29 | `days-library.md` (this repo) | Carried dates and rules, each with the source its author named. I did not re-read those sources |

### 1.3 What I did not read or could not verify

- **Primary religious bodies.** No Sikh (SGPC), Jain, Baha'i World Centre, Central Hilal Sighting Committee, Fiqh Council, Hindu panchang authority or Orthodox church source was read. Every row from those traditions is C or U.
- **Licences.** I did not read the terms of Hebcal, timeanddate, Drik Panchang, Hong Kong Observatory or the Naval Observatory. FR-DAY-23 and NS-46-R23 already make counsel confirm before a copied table ships.
- **An official Iranian calendar** for Nowruz, **an official Chinese calendar standard** (HKO prints no authority), **Korean and Vietnamese** lunar new year dates.
- **Holi, Navratri, Vesak and Baha'i holy days for 2027 and 2028** from a primary source.
- **Any US state statute** other than Hawaii's published list. Cesar Chavez Day and Mardi Gras states come from commercial listing pages (S11, S18).
- **Prevalence of anything.** I did not size communities. Nothing is ordered by size or popularity.
- **Real families.** No user research. Every "who observes" is a description from the sources named, not a count and not a statement about any family.
- I ran no test, device or app, and did not run the rules test (no install). I checked the proposed lines by eye against the fear, AI and rewrite patterns in `rules.test.ts` and the wording rules in NS-46-R17.

---

## 2. What already exists, then what this file adds

| Layer | What is there (read this session) | What this file adds |
|---|---|---|
| **`packs/`** | Only `packs/text-rules/` (speech-edit rule packs for `en`, `ar`, `es`, `fr`, `hi`, `pt`, `zh`: `kind: "text-rules"`, `schema`, `version`, `engine`, a review record per language) and `tools/zh-data.mjs`. These are downloaded on demand. **There is no days, events or calendar pack and no pack `kind` for one.** | A recommendation on which date tables are data and where they live (section 4). No pack is created |
| **`packages/content/src`** | `features/reminders.en.ts` (`reminderCopy`: neutral evening, month and birthday lines, priming lines, settings labels); `strings.en.ts`; `prompts.ts` (111 prompts, not date-based); `helplines.ts` (the one existing "table with a due date" pattern: `helplinesDueOn`, a test that fails when a reading passes 90 days). **No `days`, `culture` or `ntc` key family exists and `index.ts` exports none** | The key family and naming (section 8.1), briefs per observance (section 8) |
| **`apps/mobile` planner** | `lib/reminders/planner.ts` plans three kinds: `evening`, `monthAge`, `birthday` (`PlannedKind`). Birthday and month at 09:00, 92 days ahead. No `libraryDay` or `typedDay` kind is built | Nothing in code. Logic inputs for part 3 (section 9) |
| **DAY** (`days-library.md`) | 72 days in six layers, a rule or a dated table per year 2026 to 2030, an authority per row, `precision`, `tone`, `publicTitleOk`, the exclusion list, the wording rules 5.2, the clash table 4.8 | Extends it: heritage months, regional rows, ten-year computing, 2027 and 2028 dates re-read where I could, sensitivity and offered-when per row |
| **NS-46 and NS-47** | Ticked day recurs; one note a day; neutral lock-screen title and body; day-name switch separate and default off; store is L4, phone only, cleared at sign-out and Erase; ask once after the first kept letter; Not now is final for Home | Applies them to the new rows. Asks for rulings where a new row needs one (section 13) |
| **Playbook part 3** | Section 11: how a day is chosen, what selects a variant, what happens when a parent turns an observance off; section 12: the region and background rules in one place; PC-2 (one home for day words), PC-3 (line by year) | Supplies the calendar and briefs part 3 asks for in 11.1; fits PC-2 and PC-3 |
| **Errata** | E45 (neutral lock body has no `{child}`), E57 (paused family gets no day notes), E73 (days file adopted only at the claim step), E75 (no marketing email at 1.0), E79 (no remote push at 1.0), E82 (no age on a names-off lock screen) | Cited by id wherever a row depends on them |
| **Not in the repo at all** | A heritage-month layer, a regional or state layer, a place picker, per-day landing lines, a ten-year date plan, a never-say list per community, a cultural-review list | Sections 5, 6, 8, 11, 12 |

### 2.1 Where this file departs from DAY, on purpose

| Topic | DAY | This file | Why |
|---|---|---|---|
| Order of traditions | 4.4 groups follow Pew 2020 sizes | Alphabetical everywhere | NS-47-R20 and the founder's "do not rank faiths": a UI list is never ordered by size. DAY's order was an authoring order |
| Lock-screen samples | 5.4 names some days in the title | Not repeated | Superseded by NS-47-R12, R13, E45 and Q-FD-18 (`publicTitleOk` is a hand list) |
| Next-year line | 3.6 says "arrives with the next update" | Not repeated | NS-46-R15: no promise of an update |
| "Which date" | Offered for Eid, Diwali, Vesak | Same, nothing more | NS-46-R14 |

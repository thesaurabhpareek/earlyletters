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

---

## 3. The rules this file is bound by

Only the rules that change what a row may be or say. Each is already ruled; I cite, I do not restate the reasoning.

| Rule | Where | What it means for an event row |
|---|---|---|
| Nothing is ticked for the parent. A day is scheduled only after the parent's own tap | NS-46-R2, direction 3.1 | No "we added Diwali for you" and no preselected row, in any group |
| A ticked day is one note a day in the existing budget. Order: typed day, birthday, library day, month, evening | NS-46-R7, R30, DL-2 | An event never beats a birthday. Two ticked days on one date become one note |
| 09:00 local, clamped to the parent's window, never time-sensitive | NS-46-R10, Q-FD-19 | No row carries its own time. Islamic, Jewish and Baha'i days send on the morning of the daytime date |
| Lock screen: one neutral title and one neutral body per tone for every layer; only an allowlist (seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day) may use its own name as the title; the day's name shows only behind its own switch, default off, forced off with App lock; no title or body holds a day name and a child name | NS-47-R12, R13, R38, Q-FD-18, E45; part 3 section 6.4 | The local reminder key of every non-allowlisted row is the shared neutral pair. No per-row lock-screen words exist for religious or cultural days |
| No age, month count or child name on a lock screen with names off | E82, NS-13-R24 | No event reminder says how old {child} is |
| A day note opens an ordinary prompt; no day key reaches `entries.prompt_key` or any synced field | NS-47-R5 | The "moment" ideas in section 8 are lines the days module shows above the prompt. They are never prompts in the catalogue and never saved with a letter |
| The store is L4, on the phone, never exported, synced, logged or analysed; sign-out and Erase clear it; adopted only at the claim step by the same person | NS-47-R1, R4 to R10, R15 to R17, E73 | Region and background cannot be kept as fields. Section 7 |
| Wording: name only; no "your" before a day; no relationship word; no greeting; no "celebrate"; no "gather", "together", "around the table"; no digit outside a date; no count or comparison; no question mark in a quiet line; no exclamation mark | NS-46-R17, DAY 5.2, N-5 | The never-say codes N1 to N11 in section 8.4 |
| Quiet tone for Memorial Day, Veterans Day, Good Friday, Yom Kippur and any national day naming a war or a lost life | NS-46-R16, Q-FD-3, Q-FD-24 | One fixed line, no prompt block |
| No tradition or country attached to the child, a book or a letter | NS-47-R3 | No letter, book page or print line is captioned with a day name unless the parent types it |
| One library file identical for every phone; a refresh is a whole-library fetch with no query that depends on ticks | NS-46-R48 | A downloadable date table is allowed only if fetched this way |
| Only the days module reads the store | NS-47-R11 | Event logic cannot be read by the prompt picker, email, Find, analytics or support |
| Email: transactional only at 1.0. Push: none at 1.0 | E75, E79; part 3 L-04 | Email and push keys are reserved names with no words |
| Marketing never names a faith, a day of a tradition, an ethnicity or a country as an audience; no seasonal or religious campaign; no holiday imagery with children | NS-46-R47, Q-FD-28 | None of these rows may appear on a store page, site page, email or ad |
| Nothing ships for a tradition without a recorded reviewer from that tradition, and no public line says "all" | Q-FD-9, NS-46-R23, CL-017 | Section 12 is a gate, not a courtesy |

---

## 4. How each kind of date is computed or read

For every row: can the phone compute it, or must a named table supply it? Rule dates are computed and tested against a sourced oracle (NS-46-R12). Everything else is a dated table with an `authority`, a country or community, and `precision` (DAY 3.1).

| Kind | Examples | How to get the next ten years | Data pack? | Notes and risk |
|---|---|---|---|---|
| **Fixed** | Jul 4, Dec 25, Feb 14, Jun 19, Mar 31 | The rule is the date | No. Code | None |
| **nth or last weekday** | Thanksgiving, Mother's Day, Labor Day, DST | Compute. Oracle: the OPM schedule (S1) and the statutes (S3 to S5, S16) | No. Code | I computed 2027 and 2028 and every federal date matches OPM (S1). Federal "observed" days (a Friday or Monday) are a pay rule, not the date; the library uses the calendar date (DAY 4.1) |
| **Relative to Easter** | Ash Wednesday (46 days before), Mardi Gras (47), Palm Sunday, Good Friday, Pentecost (49 after) | Compute from Easter | No. Code | 2027 and 2028 match S11 (Ash Wednesday) and S18 (Mardi Gras 2027) |
| **Western Easter** | Easter Sunday | Gregorian computus; S7 prints the integer algorithm. First Sunday after the ecclesiastical full moon on or after 21 March; never before 22 Mar or after 25 Apr | No. Code | Table in 4.1 |
| **Orthodox Easter** | Easter on the Julian tables | Julian computus plus the 13-day Gregorian difference this century (my script; S7 describes the Julian tables) | No. Code | S7: many Orthodox churches use the Julian tables and some use a modified calendar, so practice varies. Offer it as its own day, never as "the other Easter" |
| **Astronomical** | Equinoxes and solstices; Nowruz and Naw-Ruz are tied to the March equinox | Store the UTC instant from the USNO service (S6) for each shipped year; the phone converts to its own local date | No, if the instants are bundled for the shipped years | The local date can differ by zone (DAY 3.4). The Southern hemisphere shows the other season name, never inferred (NS-46-R11) |
| **Calculated lunisolar, Hebrew** | Rosh Hashanah, Yom Kippur, Hanukkah, Passover, Purim | The Hebrew calendar is calculated, not sighted. Options: (a) implement the published arithmetic in code and use Hebcal (S8) as the test oracle; (b) bundle a Hebcal-derived table. Hebcal feeds for 2027 and 2028 were read; other years were not asked | No if (a). A table if (b) | Holidays begin at sundown the evening before; the library sends the morning of the daytime date. Hebcal Diaspora dates; the Israel schedule differs for some days and was not read. Licence unread: prefer (a) |
| **Chinese lunisolar** | Lunar New Year, Lantern, Dragon Boat, Mid-Autumn, Qingming | Read from the Hong Kong Observatory tables (S9), one per year; 2027 and 2028 read. Whether HKO publishes ten years ahead I did not check | **Yes, a dated table** per year, `authority` HKO (China Standard Time) | HKO prints no authority line on the file. Korean (Seollal, Chuseok) and Vietnamese (Tet) dates are not always the same day and were not reconciled. Offer "which date" only where a list differs |
| **Islamic lunar** | Ramadan, Eid al-Fitr, Eid al-Adha, Islamic New Year, Mawlid | Do not promise ten years. Ship the next two years as `precision: about` from a named list and re-read each year. A month begins by crescent sighting or by calculation, and US Muslims use several methods (S26): local sighting, a common horizon, astronomical calculation, or following Saudi Arabia. Umm al-Qura is a calculated Saudi calendar for administrative use (S25) and is not a sighting | **Yes, a dated table**, `authority` and country per row; a parent can move the date for a year or for always | Highest wrong-date risk. Lists read differ by a day (Eid al-Adha 2027: 17 May on the US list, 16 May on the Saudi list). Days begin at sundown the evening before. Never "the" date; always "around" |
| **Hindu lunisolar** | Diwali, Holi, Navratri, Dussehra, Janmashtami, Ganesh Chaturthi, Raksha Bandhan, Maha Shivaratri, Ugadi, Rama Navami | Read from a panchang. Drik Panchang (S13) and the India gazette list (S12) agree for Diwali 2027 and 2028. Regional calendars differ: purnimanta and amanta name the month differently, and timeanddate notes regions can differ in the date (S12) | **Yes, a dated table** per year and per `authority` | One festival can differ by region and by a day when a tithi spans two dates. Not computable from a simple rule. Ship two years |
| **Solar community days** | Makar Sankranti, Vaisakhi, Songkran, Pongal, Onam | Fixed or near-fixed solar rules. Vaisakhi is "around April 13 or 14" (S12); Songkran is fixed 13 to 15 Apr | A small table | Observed days vary. Q-FD-17 defers regional sub-community days |
| **Sikh lunar** | Guru Nanak Gurpurab | Table | **Yes** | SGPC and Nanakshahi sources not read. Years beyond 2027 are n/r in DAY |
| **Jain and Buddhist national lists** | Mahavir Jayanti, Vesak, Makha Bucha, Asalha Bucha | Table per national list | **Yes** | The Buddha's birthday had four different dates in 2026 by country (DAY 4.4). Ask which; never choose |
| **Baha'i** | Naw-Ruz, Ridvan, the holy days | Baha'i World Centre calendar; days run sunset to sunset (DAY 4.4) | **Yes**, one page per year | 2026 was the only year read. Blocked until read |
| **Persian equinox rule** | Nowruz | Compute with the rule in S27 and the USNO instant, then check against an official Iranian calendar (not read) | A table once verified | 2027: the equinox is five minutes before Tehran midnight, so the answer sits on an edge. Computed only, UNVERIFIED |
| **Month ranges** | Heritage months | A fixed month, or the statutory range (Hispanic Heritage Month is Sep 15 to Oct 15 by Pub. L. 100-402, S15) | No. Code | A month row fires once, on its first day |
| **Community events** | Powwows, parades, street festivals, cherry blossom peak bloom | No rule. Peak bloom is weather, forecast about 10 days out (S19); powwows are held by communities through the year (S20) | No | Not a library day. Never a reminder. The parent can add a typed day |
| **Milestones with no date** | Quinceanera, baptism, naming, a first haircut | None | No | Not a library day (DAY 6). A typed day or a prompt the parent picks |

**Does any of this need a downloadable pack?** Only the tables that can change after an app ships: Islamic days (dates move from "tentative" to announced), and the Hindu, Sikh, Jain, Buddhist and Baha'i tables whose later years are not yet published. The default stays what DAY 3.6 and NS-46-R48 say: bundled with the app, refreshed by an app update, one file identical for every phone. A pack would be a new `kind` beside `text-rules`, with its own review record, and a fetch with no query that varies by tick. That is Karma's and `mobile`'s call (Q-EV-9). Nothing here needs it for 1.0.

### 4.1 Easter, Orthodox Easter and Mardi Gras, 2027 to 2036 (oracle candidates)

Computed by me with the Gregorian and Julian integer algorithms (S7 describes both families). 2027 and 2028 agree with independent sources read (S11: Ash Wednesday 10 Feb 2027 and 1 Mar 2028; S18: Mardi Gras 9 Feb 2027). The later years are my computation only and are not an independent oracle: NS-46-R12 needs a sourced oracle table with a read-on date before a test may rely on them.

| Year | Mardi Gras | Ash Wednesday | Western Easter | Orthodox Easter (Julian) | Pentecost |
|---|---|---|---|---|---|
| 2027 | 2027-02-09 | 2027-02-10 | 2027-03-28 | 2027-05-02 | 2027-05-16 |
| 2028 | 2028-02-29 | 2028-03-01 | 2028-04-16 | 2028-04-16 | 2028-06-04 |
| 2029 | 2029-02-13 | 2029-02-14 | 2029-04-01 | 2029-04-08 | 2029-05-20 |
| 2030 | 2030-03-05 | 2030-03-06 | 2030-04-21 | 2030-04-28 | 2030-06-09 |
| 2031 | 2031-02-25 | 2031-02-26 | 2031-04-13 | 2031-04-13 | 2031-06-01 |
| 2032 | 2032-02-10 | 2032-02-11 | 2032-03-28 | 2032-05-02 | 2032-05-16 |
| 2033 | 2033-03-01 | 2033-03-02 | 2033-04-17 | 2033-04-24 | 2033-06-05 |
| 2034 | 2034-02-21 | 2034-02-22 | 2034-04-09 | 2034-04-09 | 2034-05-28 |
| 2035 | 2035-02-06 | 2035-02-07 | 2035-03-25 | 2035-04-29 | 2035-05-13 |
| 2036 | 2036-02-26 | 2036-02-27 | 2036-04-13 | 2036-04-20 | 2036-06-01 |

---

## 5. The calendar

One row per observance. The full set, with keys, tone, sensitivity notes and `library_status`, is [data/events-usa.csv](data/events-usa.csv). These tables are generated from it so the two cannot drift. Groups under C are alphabetical by tradition name. Nothing is ranked.

How to read the tables:

- **Src**: source ids from section 1.2. **St**: V, VC, C or U (section 1).
- **2027, 2028**: verified dates only. `[C] date` was carried from DAY and not re-read; `x [C: y]` means this session's date and DAY's differ or DAY adds a variant. A dash means no date I will write. Season rows are UTC instants: the phone shows its own local date.
- **Sens**: low, medium or high. Low: the name of a public civic or seasonal day. Medium: heritage and cultural days, family days (family make-up), regional days. High: any day of a religious tradition, any day that touches mourning, a contested name, a minority or persecuted identity, Native ceremonial life, or a child-centred milestone.
- **Offered**: `always` listed in Browse for any parent, never ticked for them; `background_picked` shown first after the parent picks that tradition, and listed under Browse all on request, never suggested; `region_picked` shown first after the parent picks a place; `ticked_day` only the parent's own typed day; `not_offered*` not in the library (excluded, deferred or not yet read). Every row is scheduled only after a tick (section 7.3).
- `library_status` in the CSV: `yes` in the library or library-eligible after review; `excluded` out under DAY section 6; `candidate` named or commonly asked and not yet sourced; `deferred` waits for a ruling (Q-FD-16, Q-FD-17); `not_a_library_day` a community event or a milestone; `duplicate`; `typed_day_pointer`.
- `layer` in the CSV uses part 3's six layers (seasonal, family, civic, tradition, culture, national) and adds two proposed ones: `heritage_month` and `regional`. `drop` follows part 3 section 11.1: seasonal, family and civic days are Drop B; everything else is Drop C, each tradition only after a recorded reviewer.

### A1. Civic days

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `new_years_day` | New Year's Day | All US families | fixed: Jan 1 | 2027-01-01 | 2028-01-01 | S1 | V | low | always |
| `mlk_day` | Martin Luther King Jr. Day | All US families (federal holiday) | nth_weekday: 3rd Monday in January | 2027-01-18 | 2028-01-17 | S1 | V | medium | always |
| `presidents_day` | Presidents' Day | All US families | nth_weekday: 3rd Monday in February (statutory name Washington's Birthday) | 2027-02-15 | 2028-02-21 | S1 | V | low | always |
| `memorial_day` | Memorial Day | All US families | last_weekday: Last Monday in May | 2027-05-31 | 2028-05-29 | S1 | V | medium | always |
| `juneteenth` | Juneteenth | All US families (federal holiday) | fixed: Jun 19 (Juneteenth National Independence Day) | 2027-06-19 | 2028-06-19 | S1 | V | medium | always |
| `independence_day` | Independence Day | All US families | fixed: Jul 4 | 2027-07-04 | 2028-07-04 | S1 | V | low | always |
| `labor_day` | Labor Day | All US families | nth_weekday: 1st Monday in September | 2027-09-06 | 2028-09-04 | S1 | V | low | always |
| `veterans_day` | Veterans Day | All US families | fixed: Nov 11 | 2027-11-11 | 2028-11-11 | S1 | V | medium | always |
| `thanksgiving` | Thanksgiving | All US families | nth_weekday: 4th Thursday in November | 2027-11-25 | 2028-11-23 | S1 | V | medium | always |
| `christmas_day_civic` | Christmas Day (federal holiday) | See christmas_day (religious row); one library day | fixed: Dec 25 | 2027-12-25 | 2028-12-25 | S1 | V | high | not_offered |
| `columbus_day` | Columbus Day / Indigenous Peoples' Day | Contested name | nth_weekday: 2nd Monday in October (statute name Columbus Day) | 2027-10-11 | 2028-10-09 | S1 | V | high | not_offered |

### A2. Family and parent days

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `mothers_day` | Mother's Day | All US families | nth_weekday: 2nd Sunday in May | 2027-05-09 | 2028-05-14 | S5 | VC | medium | always |
| `fathers_day` | Father's Day | All US families | nth_weekday: 3rd Sunday in June | 2027-06-20 | 2028-06-18 | S3 | VC | medium | always |
| `grandparents_day` | Grandparents' Day | All US families | nth_weekday: First Sunday after Labor Day | 2027-09-12 | 2028-09-10 | S4 | VC | medium | always |
| `siblings_day` | Siblings Day | All US families | fixed: Apr 10 | [C] 2027-04-10 | [C] 2028-04-10 | S29 | C | medium | always |
| `valentines_day` | Valentine's Day | All US families | fixed: Feb 14 | [C] 2027-02-14 | [C] 2028-02-14 | S29 | C | medium | always |

### A3. Seasonal and daylight

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `spring_start` | First day of spring (March equinox) | Northern hemisphere; the Southern hemisphere name is autumn | astronomical: UTC instant of the March equinox; the phone shows its own local date | 2027-03-20T20:25Z | 2028-03-20T02:17Z | S6 | V | low | always |
| `summer_start` | First day of summer (June solstice) | Northern hemisphere; the Southern hemisphere name is winter | astronomical: UTC instant of the June solstice | 2027-06-21T14:11Z | 2028-06-20T20:02Z | S6 | V | low | always |
| `fall_start` | First day of fall (September equinox) | Northern hemisphere; the Southern hemisphere name is spring | astronomical: UTC instant of the September equinox | 2027-09-23T06:02Z | 2028-09-22T11:45Z | S6 | V | low | always |
| `winter_start` | First day of winter (December solstice) | Northern hemisphere; the Southern hemisphere name is summer | astronomical: UTC instant of the December solstice | 2027-12-22T02:42Z | 2028-12-21T08:19Z | S6 | V | low | always |
| `meteorological_seasons` | Meteorological season starts (1 Mar, 1 Jun, 1 Sep, 1 Dec) | All | fixed: First day of Mar, Jun, Sep, Dec | - | - | S29 | C | low | always |
| `halloween` | Halloween | Many US families | fixed: Oct 31 | [C] 2027-10-31 | [C] 2028-10-31 | S29 | C | medium | always |
| `new_years_eve` | New Year's Eve | All US families | fixed: Dec 31 | [C] 2027-12-31 | [C] 2028-12-31 | S29 | C | low | always |
| `dst_start` | Daylight saving time begins | Most US states; not Hawaii, most of Arizona, or four territories | nth_weekday: 2nd Sunday in March, 2:00 a.m. | 2027-03-14 | 2028-03-12 | S16 | VC | low | not_offered |
| `dst_end` | Daylight saving time ends | Most US states; not Hawaii, most of Arizona, or four territories | nth_weekday: 1st Sunday in November, 2:00 a.m. | 2027-11-07 | 2028-11-05 | S16 | VC | low | not_offered |
| `first_day_of_school` | First day of school | Families with a child at school; not at 0 to 5 for most | milestone: Set by each school district; no national date | - | - | none read | U | low | not_offered |

### B. Heritage months (a new layer, proposed)

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `black_history_month` | Black History Month | US national observance | month_range: All of February | 2027-02-01 to 2027-02-28 | 2028-02-01 to 2028-02-29 | S14 | V | medium | always |
| `womens_history_month` | Women's History Month | US national observance | month_range: All of March | 2027-03-01 to 2027-03-31 | 2028-03-01 to 2028-03-31 | S14 | V | medium | always |
| `arab_american_heritage_month` | Arab American Heritage Month | US national observance (as commonly listed) | month_range: April | - | - | none read | U | medium | not_offered_until_read |
| `jewish_american_heritage_month` | Jewish American Heritage Month | US national observance | month_range: All of May | 2027-05-01 to 2027-05-31 | 2028-05-01 to 2028-05-31 | S14 | V | high | always |
| `aanhpi_heritage_month` | Asian American, Native Hawaiian and Pacific Islander Heritage Month | US national observance; many communities | month_range: All of May (the host site is titled Asian / Pacific American Heritage Month) | 2027-05-01 to 2027-05-31 | 2028-05-01 to 2028-05-31 | S14 | V | medium | always |
| `caribbean_american_heritage_month` | National Caribbean-American Heritage Month | US national observance (as commonly listed) | month_range: June | - | - | none read | U | medium | not_offered_until_read |
| `hispanic_heritage_month` | National Hispanic Heritage Month | US national observance; Latino and Hispanic communities | month_range: Sep 15 to Oct 15 (31 days) | 2027-09-15 to 2027-10-15 | 2028-09-15 to 2028-10-15 | S15 | V | medium | always |
| `native_american_heritage_month` | National American Indian Heritage Month | US national observance; Native American, Alaska Native and Native Hawaiian communities | month_range: All of November | 2027-11-01 to 2027-11-30 | 2028-11-01 to 2028-11-30 | S14 | V | high | always |
| `pride_month` | Pride Month | LGBTQ+ communities | month_range: June | - | - | none read | U | high | not_offered_until_read |

### C1. Baha'i

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `naw_ruz_bahai` | Naw-Ruz (Baha'i New Year) | Baha'is | astronomical: Vernal equinox, Tehran reckoning; day begins at sunset before | - | - | S29 | C | high | background_picked |
| `ridvan` | Ridvan (first day) | Baha'is | solar_community: First day of Ridvan, Baha'i calendar (Apr 21 in 2026) | - | - | S29 | C | high | background_picked |

### C2. Buddhist

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `vesak` | Vesak / Buddha's Birthday (several calendars) | Buddhists; dates differ by national tradition | lunisolar: Full moon of Vesakha (Theravada lists); Korean list differs | [C] 2027-05-20 (Singapore, Thai and India lists); 2027-05-13 (Korean list) | [C] 2028-05-02 (Korean list) | S29 | C | high | background_picked |
| `makha_bucha` | Makha Bucha | Buddhists (Thai and some Southeast Asian traditions) | lunisolar: Full moon of the third lunar month | [C] 2027-02-21 | - | S29 | C | high | background_picked |
| `asalha_bucha` | Asalha Bucha | Buddhists (Thai and some Southeast Asian traditions) | lunisolar: Full moon of the eighth lunar month | [C] 2027-07-18 | - | S29 | C | high | background_picked |
| `songkran` | Songkran (Thai New Year) | Thai communities; Buddhist and cultural | fixed: Apr 13 to 15; library uses Apr 13 | [C] 2027-04-13 | [C] 2028-04-13 | S29 | C | medium | background_picked |
| `bodhi_day` | Bodhi Day | Buddhists (Mahayana, Zen) | fixed: Dec 8 (as commonly kept in Japan) | - | - | none read | U | high | not_offered_until_read |
| `obon` | Obon (Bon) | Japanese and Japanese American families; Buddhist in origin, not only Buddhist | fixed: Jul 13 to 15 in most places; Aug 13 to 15 in some regions | - | - | S22 | V | high | not_offered |
| `ullambana` | Ullambana / Hungry Ghost Festival | Buddhist and Chinese folk traditions | lunisolar: Seventh lunar month (Chinese lists); Obon is the Japanese form | - | - | S22 | V | high | not_offered |

### C3. Christian

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `epiphany_three_kings` | Epiphany / Three Kings Day | Christians (Western calendar); Latino and Hispanic communities (Dia de Reyes); the start of Carnival in Louisiana | fixed: Jan 6 | 2027-01-06 | 2028-01-06 | S23 | V | high | background_picked |
| `ash_wednesday` | Ash Wednesday | Christians (Western calendar) | relative_to_easter: 46 days before Western Easter Sunday | 2027-02-10 | 2028-03-01 | S11 | V | high | background_picked |
| `palm_sunday` | Palm Sunday | Christians (Western calendar) | relative_to_easter: Sunday before Easter | 2027-03-21 | 2028-04-09 | S7 | VC | high | background_picked |
| `good_friday` | Good Friday | Christians (Western calendar) | relative_to_easter: Friday before Easter | 2027-03-26 | 2028-04-14 | S7 | VC | high | background_picked |
| `easter_western` | Easter Sunday (Western) | Christians (Western calendar: Catholic and Protestant churches) | computus: First Sunday after the first ecclesiastical full moon on or after 21 March (Gregorian tables) | 2027-03-28 | 2028-04-16 | S7 | V | high | background_picked |
| `pentecost` | Pentecost | Christians (Western calendar) | relative_to_easter: 49 days after Easter Sunday | 2027-05-16 | 2028-06-04 | S29 | VC | high | background_picked |
| `all_saints_souls` | All Saints and All Souls (Nov 1 and 2) | Christians (Western calendar); linked to Dia de los Muertos | fixed: Nov 1, Nov 2 | - | - | S21 | V | high | not_offered |
| `christmas_day` | Christmas Day | Christians (Western calendar); also kept as a family or cultural day by some who are not Christian | fixed: Dec 25 | 2027-12-25 | 2028-12-25 | S1 | V | high | background_picked |
| `christmas_orthodox` | Christmas (Julian calendar churches) | Orthodox Christians on the Julian calendar | fixed: Jan 7 (Gregorian date of Dec 25 Julian) | [C] 2027-01-07 | [C] 2028-01-07 | S29 | C | high | background_picked |
| `easter_orthodox` | Easter (Orthodox, Julian computus) | Orthodox Christians on the Julian tables | computus: Julian ecclesiastical tables; civil date 13 days later in this century | 2027-05-02 | 2028-04-16 | S7 | VC | high | background_picked |
| `las_posadas` | Las Posadas | Mexican and Latin American Catholic communities | fixed: Dec 16 to Dec 24 (as commonly listed) | - | - | none read | U | high | not_offered_until_read |

### C4. Hindu

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `makar_sankranti` | Makar Sankranti | Hindus; also kept as a harvest day in several regions | solar_community: Sun enters Capricorn; usually Jan 14 or 15 | [C] 2027-01-14 | [C] 2028-01-15 | S29 | C | high | background_picked |
| `pongal` | Pongal | Tamil communities (Hindu and others); regional | solar_community: Tamil month of Thai begins; around Jan 14 to 15 | [C] 2027-01-15 | [C] 2028-01-15 | S29 | C | high | not_offered_first_drop |
| `maha_shivaratri` | Maha Shivaratri | Hindus | lunisolar: Night of the new moon fortnight in Phalguna or Magha (panchang) | [C] 2027-03-06 | [C] 2028-02-23 | S29 | C | high | background_picked |
| `holi` | Holi | Hindus; also kept as a spring day by others in South Asian communities | lunisolar: Full moon day of Phalguna; panchang | [C] 2027-03-22 | [C] 2028-03-11 | S29 | C | high | background_picked |
| `ugadi` | Ugadi / Gudi Padwa | Hindus in Karnataka, Andhra Pradesh, Telangana, Maharashtra and the diaspora | lunisolar: First day of Chaitra (panchang) | [C] 2027-04-07 | [C] 2028-03-27 | S29 | C | high | background_picked |
| `rama_navami` | Rama Navami | Hindus | lunisolar: 9th day of Chaitra bright fortnight | [C] 2027-04-15 | [C] 2028-04-03 | S29 | C | high | background_picked |
| `raksha_bandhan` | Raksha Bandhan | Hindus; also kept as a sibling day in some families | lunisolar: Full moon of Shravana | [C] 2027-08-17 | [C] 2028-08-05 | S29 | C | high | background_picked |
| `janmashtami` | Janmashtami | Hindus | lunisolar: 8th day of Krishna paksha in Bhadrapada or Shravana (by calendar) | [C] 2027-08-25 | [C] 2028-08-13 | S29 | C | high | background_picked |
| `ganesh_chaturthi` | Ganesh Chaturthi | Hindus; strong in Maharashtra and the diaspora | lunisolar: 4th day of Bhadrapada bright fortnight | [C] 2027-09-04 | [C] 2028-08-23 | S29 | C | high | background_picked |
| `onam` | Onam | Malayali communities; regional | solar_community: Malayalam month of Chingam, Thiruvonam star | [C] 2027-09-12 | [C] 2028-09-01 | S29 | C | high | not_offered_first_drop |
| `navratri` | Navratri (first day) | Hindus | lunisolar: 1st day of Ashwin bright fortnight (nine nights) | [C] 2027-09-30 | [C] 2028-09-19 | S29 | C | high | background_picked |
| `dussehra` | Dussehra / Vijayadashami | Hindus | lunisolar: 10th day after Navratri begins | [C] 2027-10-09 | [C] 2028-09-27 | S29 | C | high | background_picked |
| `diwali` | Diwali | Hindus, Sikhs (Bandi Chhor Divas), Jains and some Buddhists; also a cultural day for many South Asian families | lunisolar: New moon (amavasya) of Kartik or Ashwin by calendar; Lakshmi Puja day | 2027-10-29 [C: 2027-10-28 (US-facing list)] | 2028-10-17 | S12; S13 | V | high | background_picked |
| `karva_chauth` | Karva Chauth | Some Hindu and Sikh women in North India | lunisolar: 4th day after full moon of Kartik | - | - | none read | U | high | not_offered_until_read |

### C5. Jain and Sikh

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `mahavir_jayanti` | Mahavir Jayanti | Jains | lunisolar: 13th day of Chaitra bright fortnight | [C] 2027-04-19 | [C] 2028-04-07 | S29 | C | high | background_picked |
| `vaisakhi` | Vaisakhi | Sikhs; also Punjabi Hindus and others (harvest and solar new year) | solar_community: Solar; around Apr 13 or 14 (Nanakshahi solar calendar) | [C] 2027-04-14 | - | S12 | V | high | background_picked |
| `gurpurab_nanak` | Guru Nanak Gurpurab | Sikhs | lunisolar: Full moon of Kartik | [C] 2027-11-14 | - | S29 | C | high | background_picked |

### C6. Jewish

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `tu_bishvat` | Tu BiShvat | Jews | calculated_calendar: 15 Shevat | [C] 2027-01-23 | [C] 2028-02-12 | S29 | C | high | background_picked |
| `purim` | Purim | Jews | calculated_calendar: 14 Adar (Adar II in a leap year) | 2027-03-23 | 2028-03-12 | S8 | V | high | background_picked |
| `passover` | Passover (first day) | Jews | calculated_calendar: 15 Nisan; Diaspora keeps eight days | 2027-04-22 | 2028-04-11 | S8 | V | high | background_picked |
| `shavuot` | Shavuot (first day) | Jews | calculated_calendar: 6 Sivan | 2027-06-11 | 2028-05-31 | S8 | V | high | background_picked |
| `rosh_hashanah` | Rosh Hashanah | Jews | calculated_calendar: 1 Tishrei (Hebrew calendar, calculated) | 2027-10-02 | 2028-09-21 | S8 | V | high | background_picked |
| `yom_kippur` | Yom Kippur | Jews | calculated_calendar: 10 Tishrei | 2027-10-11 | 2028-09-30 | S8 | V | high | background_picked |
| `sukkot` | Sukkot (first day) | Jews | calculated_calendar: 15 Tishrei | 2027-10-16 | 2028-10-05 | S8 | V | high | background_picked |
| `simchat_torah` | Simchat Torah (Diaspora) | Jews | calculated_calendar: 23 Tishrei (Diaspora) | 2027-10-24 | 2028-10-13 | S8 | V | high | background_picked |
| `hanukkah` | Hanukkah (first candle) | Jews | calculated_calendar: 25 Kislev; first candle is lit at nightfall of the date shown | 2027-12-24 | 2028-12-12 | S8 | V | high | background_picked |
| `tisha_bav` | Tisha B'Av | Jews | calculated_calendar: 9 Av | - | - | S29 | C | high | not_offered |
| `yom_hashoah` | Yom HaShoah and genocide remembrance days | Many communities | calculated_calendar: Varies | - | - | none read | U | high | not_offered |

### C7. Muslim

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `ramadan_start` | Ramadan begins | Muslims | lunar_sighting: 1st of Ramadan; start depends on crescent sighting or calculation | 2027-02-08 (expected) | [C] 2028-01-28 | S10; S26 | V | high | background_picked |
| `eid_al_fitr` | Eid al-Fitr | Muslims | lunar_sighting: 1st of Shawwal; ends Ramadan; sighting or calculation | 2027-03-10 (tentative) | 2028-02-27 (tentative) | S11; S10 | V | high | background_picked |
| `eid_al_adha` | Eid al-Adha | Muslims | lunar_sighting: 10th of Dhu al-Hijjah; sighting or calculation | 2027-05-17 (tentative; US list) [C: 2027-05-16 (Saudi list)] | 2028-05-05 (tentative; US list) [C: 2028-05-05 (Saudi list)] | S11 | V | high | background_picked |
| `islamic_new_year` | Islamic New Year (1 Muharram) | Muslims | lunar_sighting: 1st of Muharram | [C] 2027-06-06 | [C] 2028-05-25 | S29 | C | high | background_picked |
| `mawlid` | Mawlid (Prophet's birthday) | Many Muslims; not kept by all | lunar_sighting: 12 Rabi al-awwal (Sunni lists); 17 Rabi al-awwal (Iran's list) | [C] 2027-08-15 (India list); 2027-08-20 (Iran list) | [C] 2028-08-09 (Iran list) | S29 | C | high | background_picked |
| `ashura` | Ashura | Muslims | lunar_sighting: 10 Muharram | - | - | S29 | C | high | not_offered |
| `lailat_al_qadr` | Lailat al-Qadr and the days of Ramadan | Muslims | lunar_sighting: One of the last nights of Ramadan | - | - | S29 | C | high | not_offered |

### C8. Parsi (Zoroastrian)

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `parsi_new_year` | Parsi New Year (Navroz) | Parsi Zoroastrians; calendars differ (Shahenshahi, Kadmi, Fasli) | solar_community: Per calendar; India list Aug 15 | [C] 2027-08-15 | - | S29 | C | high | not_offered_first_drop |

### D. Culture-led days (offered without a faith question, Q-FD-1)

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `kwanzaa` | Kwanzaa (first day) | African American and Pan-African communities; cultural, not religious | fixed: Dec 26 to Jan 1; first day Dec 26 | [C] 2027-12-26 | [C] 2028-12-26 | S28; S29 | C | medium | always |
| `lunar_new_year` | Lunar New Year | Chinese, Vietnamese (Tet), Korean (Seollal) and other East and Southeast Asian communities; not a religion | lunisolar: First day of the first lunar month; Hong Kong Observatory table (China Standard Time) | 2027-02-06 | 2028-01-26 | S9 | V | medium | always |
| `lantern_festival` | Lantern Festival | Chinese and some Southeast Asian communities | lunisolar: 15th day of the first lunar month | 2027-02-20 | 2028-02-09 | S9 | V | medium | background_picked |
| `dragon_boat` | Dragon Boat Festival | Chinese communities | lunisolar: 5th day of the 5th lunar month | 2027-06-09 | 2028-05-28 | S9 | V | medium | background_picked |
| `mid_autumn_chuseok` | Mid-Autumn Festival / Chuseok | Chinese, Vietnamese and Korean communities | lunisolar: 15th day of the 8th lunar month | 2027-09-15 | 2028-10-03 | S9 | V | medium | always |
| `nowruz` | Nowruz (Persian New Year) | Persian, Kurdish, Afghan, Central Asian and other communities; Baha'is and Zoroastrians; culture-led | astronomical: Vernal equinox; year begins at the midnight nearest the equinox by Tehran time (that day if the equinox is before noon in Tehran, else the next) | - | - | S6; S27 | VC | medium | always |
| `yalda` | Yalda Night | Persian and related communities | astronomical: Longest night, December solstice eve | - | - | none read | U | medium | not_offered_until_read |
| `qingming` | Qingming (Tomb Sweeping Day) | Chinese communities | solar_term: Solar term 'Bright and Clear' (Apr 5 in 2027 on the HKO table) | 2027-04-05 | - | S9 | V | high | not_offered |
| `shichi_go_san` | Shichi-go-san | Japanese and Japanese American families; child-centred | fixed: Nov 15 (age 3, 5, 7) | - | - | none read | U | high | not_offered_until_read |

### E. Latino and Native communities; family milestone

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `dia_de_los_muertos` | Dia de los Muertos | Mexican, Mexican American and other Latin American communities | fixed: Nov 1 and Nov 2 | - | - | S21 | V | high | not_offered |
| `cinco_de_mayo` | Cinco de Mayo | Mexican American communities (a US observance more than a Mexican national day) | fixed: May 5 | - | - | S29 | C | medium | not_offered |
| `mexican_independence` | Mexican Independence Day (Sep 16) | Mexican and Mexican American families | fixed: Sep 16 | [C] 2027-09-16 | [C] 2028-09-16 | S15; S29 | C | medium | not_offered_first_drop |
| `quinceanera` | Quinceanera | Latino and Hispanic families; the source describes a girl's 15th birthday; practice varies and it is not for every family | milestone: No date: the family's own day at about age 15 | - | - | S24 | V | high | ticked_day |
| `powwow` | Powwows | Native American communities; intertribal and tribal events | community_event: No fixed date: held throughout the year, organised by communities | - | - | S20 | V | high | not_offered |

### F. Regional (proposed layer)

| Id | Name | Who observes it | Rule | 2027 | 2028 | Src | St | Sens | Offered |
|---|---|---|---|---|---|---|---|---|---|
| `mardi_gras` | Mardi Gras (Fat Tuesday) | Louisiana (legal state holiday); Mobile and Baldwin Counties, Alabama | relative_to_easter: Day before Ash Wednesday (47 days before Western Easter) | 2027-02-09 | 2028-02-29 | S18 | V | medium | region_picked |
| `cesar_chavez_day` | Cesar Chavez Day | California (state holiday); Colorado and Texas (optional); parts of several other states | fixed: Mar 31 | 2027-03-31 | 2028-03-31 | S11 | V | medium | region_picked |
| `kuhio_day` | Prince Jonah Kuhio Kalanianaole Day | Hawaii (state holiday) | fixed: Mar 26 | 2027-03-26 | 2028-03-26 | S17 | V | medium | region_picked |
| `kamehameha_day` | King Kamehameha I Day | Hawaii (state holiday) | fixed: Jun 11 | 2027-06-11 | 2028-06-11 | S17 | V | medium | region_picked |
| `hawaii_statehood_day` | Statehood Day (Hawaii) | Hawaii (state holiday) | nth_weekday: 3rd Friday in August (2027: Aug 20) | 2027-08-20 | - | S17 | VC | medium | region_picked |
| `lei_day` | Lei Day | Hawaii | fixed: May 1 | - | - | none read | U | medium | not_offered_until_read |
| `patriots_day` | Patriots' Day | Maine and Massachusetts | nth_weekday: 3rd Monday in April | - | - | none read | U | low | not_offered |
| `cherry_blossom` | Cherry blossom season (Washington, D.C.) | Washington, D.C. area; National Cherry Blossom Festival | community_event: No fixed date: peak bloom is when 70 percent of Yoshino blossoms are open; it has fallen between March 15 and April 18; forecast only about 10 days ahead | - | - | S19 | V | low | not_offered |
| `diwali_state` | Diwali as a state-recognised day | States that recognise Diwali (list carried from days-library) | lunisolar: Same as diwali | - | - | S29 | C | high | not_offered |
| `metro_festivals` | Metro and local festivals (parades, fairs, street festivals) | Cities and counties | community_event: No fixed rule; set by organisers each year | - | - | none read | U | medium | not_offered |

### 5.1 Where dates differ by community, by sighting or by calendar

Every row below must carry `precision: about` and a parent-owned override (NS-46-R14). None of this may reach a lock screen.

| Observance | Why it differs | Read from |
|---|---|---|
| Ramadan, Eid al-Fitr, Eid al-Adha, Islamic New Year, Mawlid | Start by crescent sighting or calculation; US Muslims use local sighting, a common horizon, astronomical calculation, or follow Saudi Arabia (S26). Lists read differ by a day (Eid al-Adha 2027: 17 May on the US list, 16 May on the Saudi list). Days begin at sundown the evening before | S10, S11, S26, S29 |
| Diwali | Lunar; a tithi can span two dates; regional calendars (amanta, purnimanta) name the month differently and the date can differ by region. 2027: 29 Oct on two Indian sources, 28 Oct on a US-facing list (DAY) | S12, S13, S29 |
| Vesak and Buddha's birthday | Four different dates in 2026 by national tradition; the Korean list differs again in 2027 and 2028 | S29 |
| Lunar New Year, Mid-Autumn, Chuseok | The HKO table (China Standard Time) is the source read; Korean and Vietnamese dates can differ and were not reconciled | S9, S29 |
| Orthodox Easter and Christmas | Julian tables or a modified calendar; some Orthodox churches keep 25 Dec; Coptic, Ethiopian and Armenian practice not read | S7, S29 |
| Nowruz | Tehran-midnight rule; the equinox instant sits five minutes before midnight in 2027; many communities, many local practices | S6, S27 |
| Jewish days | Calculated, not sighted; Diaspora and Israel schedules differ for some days; Hebcal Diaspora shown | S8 |
| Vaisakhi | Solar, around 13 or 14 April; the Nanakshahi and Bikrami calendars were not read | S12 |
| Thanksgiving, Mother's Day, Father's Day | US dates; other countries keep other days (DAY 4.1, 4.2) | S1, S3, S5 |

### 5.2 The 2027 and 2028 date clashes

From the verified and carried dates in the file (a script over the CSV, single-date rows plus month starts). Two ticked days on one date become one reminder (NS-46-R8); the landing names both.

| Date | Rows |
|---|---|
| 26 Mar 2027 | Good Friday and Prince Jonah Kuhio Kalanianaole Day (also Hawaii's state Good Friday, S17) |
| 1 May 2027 and 1 May 2028 | Jewish American Heritage Month and Asian American, Native Hawaiian and Pacific Islander Heritage Month (both start) |
| 16 May 2027 | Pentecost and Eid al-Adha on the Saudi list (17 May on the US list, so no clash there) |
| 11 Jun 2027 | King Kamehameha I Day and Shavuot |
| 15 Sep 2027 | Hispanic Heritage Month starts and Mid-Autumn Festival |
| 1 Mar 2028 | Women's History Month starts and Ash Wednesday |
| 16 Apr 2028 | Western Easter and Orthodox Easter (the same day: one note, two names) |

Not clashes but worth a test: Hanukkah's first candle on 24 Dec 2027, the eve of Christmas; Juneteenth on a Saturday in 2027 (federal day off Fri 18 Jun, S1); Veterans Day on a Saturday in 2028 (day off Fri 10 Nov, S1). The library uses the calendar date in all three.

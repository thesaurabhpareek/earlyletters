# 04. Events and festivals in the USA: calendar, rules and content briefs

Status: PROPOSED (lifecycle playbook, part 4 of 5) | 20 Nov 2026 | Owner: `content` | Data file: [data/events-usa.csv](data/events-usa.csv) | Siblings: [README.md](README.md), [01-experience-content-map.md](01-experience-content-map.md), [02-email-lifecycle.md](02-email-lifecycle.md), [03-in-app-and-reminder-logic.md](03-in-app-and-reminder-logic.md), [05-backlog-proposed.md](05-backlog-proposed.md).

Written by `content`. Not a lawyer and not a cultural or religious authority. Docs and data only: no string here is live, no key exists in code, no date has been entered in the app. Every legal reading says "counsel must confirm". Every cultural reading says "a member of that community must read this". Nothing here overrides a ruling; where it disagrees with one it says so and asks.

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
- **Rule descriptions that are not dates.** Wording such as "1 Tishrei", "10th of Dhu al-Hijjah", "full moon of Kartik" or "13th day of Chaitra" in the `rule_text` column is general knowledge of each calendar, not a source I read. Only the dates and the rules named with a source id are sourced. A cultural read must confirm each rule description.
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

---

## 6. The regional layer

### 6.1 What this layer is for

Some days belong to a place: a state holiday, a regional season, a festival a city holds. A parent in Hawaii may want King Kamehameha I Day; a parent in Louisiana may want Mardi Gras; a parent anywhere may want neither. The layer exists so those days can be found and ticked. It never exists so the app can learn where a family lives.

### 6.2 How a region could be known: every candidate, and the verdict

| Candidate source | Verdict | Why |
|---|---|---|
| **A place the parent picks in Browse**, held in memory until the sheet closes, only ticked days stored | The only allowed source. **New**: NS-47 has traditions and, later, countries, but no place picker. Needs a ruling (Q-EV-2) | Same pattern as NS-47-R2. Only the tick is stored; a tick of a Hawaii day is L4 like every tick (NS-47-R1) |
| **Typed free text** (a city or a ZIP) | No | Finer than any day needs; a postal code is more identifying than a state; it invites a lookup |
| **The sign-up region hook** (File 28, NS-40-R9, E47, E72) | **No. Never reuse.** | It is a country lookup at sign-up to refuse some countries. It stores nothing on the phone and "never asks where the person is" (NS-40-R9). It fails open and stays off until counsel answers (E47, E72). Using it for events would repurpose a compliance check and put a location signal in the days module. Part 3 section 12 rule 4 says the same |
| **Device locale, storefront, time zone, language** | No. Never prefill | NS-47-R20: "device locale, the storefront and the time zone never prefill either list". The time zone only shows the right local date of an astronomical day (NS-46-R11) |
| **Location services, IP, Wi-Fi, a map** | No. No permission is requested | The direction rules out location services (DAY 3.4; NS-46 "Not in scope: location") |
| **The child's birth place, hospital, a place in a photo** | No | Not a field the days module may read (NS-47-R11); NS-49-R10 reads no place from a picture |
| **A ticked regional day** (Mardi Gras ticked) | Yes, as a tick only | The tick is the record. The app never says "we see you are in Louisiana" and never adds a second regional day because of it |
| **The language the parent speaks or records in** | No | It is a proxy for ethnicity (`data-policy.md:46`, quoted in CUL section 0) |

### 6.3 The shape of a place list, if the founder rules yes

- One flat alphabetical list: the 50 states, the District of Columbia and the territories. Equal weight, no map, no "near you", no default, nothing selected. The only list of territories I read is NIST's note that American Samoa, Guam, Puerto Rico and the U.S. Virgin Islands do not observe daylight saving time (S16); the full list of territories to offer is UNVERIFIED.
- Several places may be chosen (a family can have ties to more than one).
- "Not now" is a complete answer and writes nothing, as in NS-47.
- No tribal nation, reservation or region name is offered as a place. A tribal nation is not a state; a family adds its own day in its own words. The app never asks about tribal affiliation.
- No census region (Northeast, South and so on). I read no source for them and they flatten differences inside a region.
- Metros: none. Metro and local festivals are community events with their own organisers, their dates change every year, and the library holds no list of them.

### 6.4 Rows tied to a place (layer `regional`)

| Row | Place | Rule | Verified this session | Offered | Note |
|---|---|---|---|---|---|
| `mardi_gras` | Louisiana (legal state holiday); Mobile and Baldwin Counties in Alabama (S18) | 47 days before Western Easter | 9 Feb 2027 (S18); 29 Feb 2028 computed | region_picked | Not a faith question; also the eve of Lent for some families. No beads or party imagery |
| `cesar_chavez_day` | California (state holiday); Colorado and Texas (optional); parts of several other states (S11) | Mar 31 | Yes | region_picked | Name only. Not shown because of a name or a language |
| `kuhio_day`, `kamehameha_day`, `hawaii_statehood_day` | Hawaii (state holidays, S17) | Mar 26; Jun 11; 3rd Friday in Aug (2027: 20 Aug) | 2027 read; 2028 by the fixed-date rule only | region_picked | Hawaiian names carry diacritics. Cultural read before any spelling is chosen |
| `lei_day` | Hawaii | May 1 | No: U | not offered until read | Named in a search result only |
| `patriots_day` | Maine, Massachusetts | 3rd Monday in April | No: U | excluded | State-only (DAY 6) |
| `cherry_blossom` | Washington, D.C. | None: weather. Peak bloom has fallen between 15 Mar and 18 Apr; forecast about 10 days out (S19) | Yes (the rule is "no rule") | not offered | Not schedulable a year ahead, so no reminder. A typed day |
| `powwow` | Anywhere; held by communities | None (S20) | Yes (the rule is "no rule") | not offered | Community events with their own hosts; see 11.3 |
| `metro_festivals` | Cities | None | n/a | not offered | Never listed |
| `diwali_state` | CA and PA legal holiday; CT and NC observance (carried from DAY) | Same as `diwali` | C | not offered | A state's recognition never makes the app suggest Diwali to a family in that state |
| School start | Districts | Set by each district | None read | typed day only | No national date and no source read. Never from a school calendar, never from a place |

### 6.5 When the region is unknown (the default, and the most common case)

1. Nothing regional is shown first. Browse shows the national groups; the "Places" group is the last group, alphabetical by place, each row with its place on a second line.
2. No Home line, slip or reminder mentions a place. The ask slip never mentions one.
3. A regional day can still be ticked by name from Browse all. The tick is the only record.
4. An unknown region is not a missing field and never becomes a prompt. There is no "tell us where you live" screen, no count of days not shown, no "complete your places".
5. Default for the first drop: no regional rows ship (Q-FD-17 defers regional and sub-community days until a tradition review exists). Regional rows join with the first drop that has a recorded reviewer for each (Q-FD-9).

### 6.6 What a place may never do

- Suggest a tradition, a language, an ethnicity or a heritage month. Hawaii does not suggest Kamehameha Day and also never suggests a tradition; Texas does not suggest Cesar Chavez Day.
- Be inferred from a tradition or a country, or the reverse.
- Appear in a key, an analytics property, a log, a URL, a notification identifier or a support link. `FORBIDDEN_KEY` already rejects the stems `region`, `place` and `location` (NS-47-R34).
- Order anything by "what is popular near you".

### 6.7 The seasons and the clock

- Hemisphere is the only place-like setting in the first release, and it is not a place: a segmented control, nothing selected by default, never inferred from the time zone or locale (NS-46-R26). It decides whether "First day of spring" shows the March or the September equinox.
- Daylight saving needs no data for reminders: the 09:00 reminder follows the phone's own clock (S16). Hawaii, most of Arizona and four territories do not observe it, which changes nothing here. The two rows are excluded from the library (DAY 6) and are in the file only so the exclusion is auditable.

---

## 7. The religion and background layer

### 7.1 The principle, checked against what is ruled

The founder's wording ("only if the parent chooses to say so, off by default, never inferred, never implied for the child, removable, no marketing use, phone-only") is checked below against the cards. "Ruled" means a row in a locked or errata-ruled card. None of it is built yet.

| Principle | Ruled where | Verified | Gap |
|---|---|---|---|
| Only if the parent chooses | NS-47-R19 (one ask, a later sitting, Not now is final for Home, retires after two unanswered showings R31); NS-47-R18 (nothing in first run); NS-47-R30 (optional pattern, decline of the same weight) | Yes | None |
| Off by default | Nothing is ticked or preselected: NS-46-R2, NS-47-R30; `preTicked` false in every row | Yes | None |
| Never inferred | NS-47-R20: device locale, storefront and time zone never prefill; a country does not suggest a tradition or the reverse | Yes | This file adds: not from a name, a language, a place, a child's data or a prior tick (7.5) |
| Never implied for the child | NS-47-R3: no value on a child, book, letter or share; no "your child is" | Yes | This file adds: no day name is captioned onto a letter, a book page or a print (section 11) |
| Removable | NS-47-R21 (untick one, Clear all); R15 (sign-out clears); R16 (Erase); R17 (Delete account) | Yes | None |
| No marketing use | NS-46-R47, Q-FD-28, E75 (no marketing email at 1.0), NS-47-R9 (no analytics) | Yes | The same rule applies to every row in this file |
| Phone only | NS-47-R1, R4, R6, R7, R10, R11; E73 (adopted only at the claim step by the same person) | **Ruled, not built, and not yet true of the words.** The call-out may say "The days you choose stay on this phone" only while R4 and R6 hold (NS-47-R22). Whether the store stays out of the iPhone backup is a device-transfer test (R6). Counsel has not answered CUL-Q6 (does a special-category rule reach data that never leaves the phone) | The flag stays off until counsel answers (Q-FD "COUNSEL" row). No public line yet |
| Stored as a field? | CUL-Q2, Q-FD-5, CL-013: **no**, only ticked days | Yes | See 7.2 |

### 7.2 What "based on religion" can and cannot mean

Because only ticked days are stored (Q-FD-5), the app holds no religion and no region at any time after the sheet closes. So the logic can use exactly two things:

1. **The order of the Browse list.** While the parent is picking, the traditions they pick show first. Afterwards the order follows the days already ticked (NS-46-R20; part 3 section 11.4).
2. **The days the parent ticked.** The scheduler resolves each ticked id to its next date, every year, from the table.

Everything else is ruled out by design. The app cannot: add a new observance to a family's list because they chose a tradition earlier; suggest next year's days from this year's ticks; show "days coming up for you" on Home; say anything on a lock screen or in an email that depends on a tradition; or draw a library "gap" (NS-46-R19). If the founder wants any of these it is a new ruling and a counsel question, and it changes the label answer (NS-47-R23). My recommendation: do not.

### 7.3 Two gates: what is listed, and what is scheduled

| Gate | What it decides | Who opens it |
|---|---|---|
| **1. Visibility** (`offered_when`) | Whether a row appears in Browse, and where | Row data plus what the parent picks in the sheet |
| **2. Schedule** | Whether anything is ever sent | Only the parent's tick (NS-46-R2) |

| `offered_when` | Gate 1 behaviour | Examples |
|---|---|---|
| `always` | Listed in Browse for any parent, in its group, alphabetical. Never first because of any signal | Seasons, civic days, family days, heritage months, culture-led days (Lunar New Year, Kwanzaa, Mid-Autumn and Chuseok) |
| `background_picked` | Listed first after the parent picks that tradition in the sheet. Also listed under "Browse all" if the parent opens it, since a household can tick across traditions (DAY 3.8). Never suggested on Home or by a note | Religious days |
| `region_picked` | Listed first after the parent picks that place. Also in the "Places" group of Browse all | State holidays |
| `ticked_day` | Never listed. The parent's own typed day | Quinceanera, a naming day, a baptism |
| `not_offered*` | Not in the library. A family adds its own typed day | Excluded days, candidates not yet read, deferred rows |

A neutral library day is always the fallback: if nothing is picked the parent sees the national groups and nothing else, and can still add any day by hand. The app never shows a guess.

Culture-led days (`always`) follow Q-FD-1: Lunar New Year, Mid-Autumn and Chuseok, Kwanzaa and Nowruz (once its date is read) are offered without a question. Counsel and the cultural reads in section 12 may move any of them to `background_picked`.

### 7.4 The options list: shape, not final words

All items alphabetical, equal weight, multi-select, nothing selected. The question's words, the headings and every item are for `content` to finish after the cultural reads, which decide each name.

| Group in Browse | Items (alphabetical; names are working labels) |
|---|---|
| Seasons | First day of spring, summer, fall, winter; the hemisphere control |
| Family | Father's Day, Grandparents' Day, Mother's Day, Siblings Day, Valentine's Day |
| National days | Independence Day, Juneteenth, Labor Day, Martin Luther King Jr. Day, Memorial Day, New Year's Day, Presidents' Day, Thanksgiving, Veterans Day |
| Heritage months (proposed layer) | Black History Month, Hispanic Heritage Month, Jewish American Heritage Month, Native American Heritage Month, Women's History Month, and the AANHPI month (name per the cultural read) |
| Cultural days | Dragon Boat Festival, Kwanzaa, Lantern Festival, Lunar New Year, Mid-Autumn Festival or Chuseok (Nowruz when read) |
| Traditions (the picker) | Baha'i; Buddhist; Christian, Orthodox calendars; Christian, Western calendar; Hindu; Jain; Jewish; Muslim; Parsi (Zoroastrian); Sikh; **Another tradition** (the parent adds a day and a date in their own words); **Not now** |
| Places (only after a ruling) | Alphabetical list of states and DC (6.3) |

Shapes the founder asked for, and where they land:

- **"Prefer not to say"** is not a stored value. It is the same as "Not now" (NS-47 Not in scope). The button is "Not now".
- **"None" or no faith:** the parent ticks nothing in Traditions. Seasons, family, national and cultural days need no question. There is no "I have no religion" row, because a negative answer is still an answer about a belief.
- **"We mark some days without a faith":** this is the default path. Cultural, seasonal, civic and family days are in Browse for everyone, and a tradition's day can be ticked from Browse all without picking the tradition.
- **Several traditions, and interfaith households:** several may be picked and ticks work across them (DAY 3.8). The picker never asks which is "main" and never orders them.
- **Heritage and ethnicity** are not options and not a question anywhere. A heritage month is a national observance a parent may tick, not a statement about the family.
- No row says "Eastern", "other", "minority" or "ethnic". There is no "Indigenous" or "Native" tradition option: ceremonial life belongs to each nation, and the only offer is the national heritage month (11.3).

### 7.5 Never inferred: the full list

The app never infers a tradition, a heritage, a place or a language of the parent or the child from any of: the parent's name, the child's name or birth date, the email address or its domain, the language of a recording, the language of the app, the device locale, the storefront, the time zone, the sign-up country check, a tick in another group, a day typed in Add a day (that text is the parent's words and is never classified, NS-46-R19), a photo, a place in a photo, or a purchase. A test over the days module's inputs should fail on any new reader (NS-47-R11).

### 7.6 Door lines for the picker (CR-47, COORDINATION section 10)

This repeats NS-47 section 12 for the picker and adds only what this file introduces (the place group and the cultural-days group).

- **Shown:** the call-out first in reading order, static, never collapsed (NS-47-R29), by key `culture.callout`; the short form under the question on the ask slip. The allowed claim is "The days you choose stay on this phone." (NS-47-R22). Not allowed: "never", "nobody can tell", "private", "invisible", "we never store your religion". The place group, if it ships, adds a header key `culture.picker.place.header` and no other words about place.
- **Records:** nothing on our servers. On the phone, the ticked days and `culture.asked` (no tradition, no place). No `record_policy_act` row (NS-47 Door lines). If counsel's answer to CUL-Q6 is yes, this line changes.
- **Never:** a pre-ticked day; a second ask after Not now; a tradition, place or country on the child; any of them in analytics, logs, crash reports, URLs, notification identifiers, the Save a copy file, a backup, support mail, links or email; an inference from a name, locale, place or language; "Prefer not to say" stored as a value.
- **Decline and withdraw:** Not now is a full answer of equal weight; the app is unchanged; Days stays one tap away in Me; untick, Clear all, sign-out, Erase and Delete account clear it; export and deletion still work.

---

## 8. Content briefs per observance

These are briefs and PROPOSED words, not finished copy. `content` finishes every string under VOICE.md after the cultural reads in section 12; the founder approves words that are a promise to a user. Every proposed line is ASCII, at most two short sentences, has no exclamation mark, no digit, no greeting, no "your" before a day name and no claim about {child}. I checked them by eye against the fear, AI and rewrite patterns in `rules.test.ts` and NS-46-R17. The rules test itself was not run.

### 8.1 How a brief is built: the five keys

| Key | Naming | What it holds | Rule |
|---|---|---|---|
| Name | `days.name.<id>` | The day's name as families use it. No greeting, no "your", no digit outside a name from the allowlist | NS-46-R17 |
| In-app line | `days.landing.<id>.<n>` (PROPOSED; n = 1, 2 here, 4 when DL-5 is met). Fallback if product keeps one shared line: `days.landing.bright`, `days.landing.quiet`, `days.landing.month` | The one line shown with the name above the ordinary prompt, on an unlocked phone: after the tap, and on the Home day slip. Part 3's PC-3 picks it with `(year - 2026 + dayOrdinal) mod n`, so n years show n different lines | NS-46-R13, NS-50-R3; PC-2 keeps every day word under `days.*`. Per-day keys need a ruling (Q-EV-3) |
| Local reminder | Title `days.lock.title.neutral`, body `days.lock.body.neutral` (quiet days: `days.lock.body.quiet`). Allowlisted days (seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day): the title is `days.name.<id>` | Shared and neutral for every layer; no per-day words, no child, no age, no tradition (E45, E82, NS-47-R12). If the parent turned the day-name switch on, the name is the title | The neutral words belong to NS-47 and parts 1 and 3 (01 section 12.8 proposes "Something for the book today" and "A day you chose to mark. A few words, if you like."). This file adds none |
| Email | none (E75) | Transactional mail only at 1.0. No event email exists; [02-email-lifecycle.md](02-email-lifecycle.md) should schedule none | E75; part 3 L-04 |
| Push | `days.push.<id>` reserved, parked | No APNs key, token table or entitlement in 1.0. A day reminder can never be a server push, by design (part 3 section 13.1) | E79 |

### 8.2 Proposed lines

The name is rendered from `days.name.<id>`, then the line: "{day}. {line}". A moving day adds ", around today" after the name (`days.picker.around`).

| Code | PROPOSED words | Tone | Where it fits |
|---|---|---|---|
| L1 | Anything you would like {child} to hear about today? | bright | The baseline (DAY 5.3). Any day |
| L2 | Is there something about today you would like {child} to know? | bright | Days that carry a meaning the app must not describe |
| L3 | Say the name of this day the way you say it, for {child}. | bright | Days named in a language other than English. Fits the multilingual rule: the words stay in the language spoken |
| L4 | What does today look like? | bright | Seasons and ordinary civic days |
| L5 | What do you notice today? A line is plenty. | bright | Any day; sensory and light |
| L6 | The book is open if you want it. | quiet | The only line of a quiet day (`days.landing.quiet`) |
| L7 | A few words for {child} today, if you like. | bright | Heritage months, sent on the first day only (`days.landing.month`) |
| L12 | What is the first thing you would like {child} to hear this year? | bright | New Year's Day only |
| L13 | What would you like {child} to hear as the year turns? | bright | New Year's Eve only |
| L14 | Who is someone you would like {child} to know about? | bright | Family days and Siblings Day; names no relationship |

### 8.3 Moment types: what the parent is invited to say

A moment is an idea for what a parent might say to {child}. It is never a claim about {child}, never a count and never a question the parent could fail.

| Code | The moment | Why it is safe |
|---|---|---|
| M1 | **Sensory now.** One thing seen, heard or smelled today | Needs no belief, no presence, no practice |
| M2 | **Name it.** The day's name, said the way the family says it, in the language the parent speaks | Honours the multilingual rule: the parent's words stay in their language |
| M3 | **A hope for {child}.** One thing the parent would like {child} to hear about this day, one day | Love and time, never an ending |
| M4 | **Ordinary detail.** What the day looked like where the parent is | Fits a day the family marks in no special way |
| M5 | **A person.** Someone who matters, named in the parent's words | Never presumes who. Family days only |
| M6 | **Quiet.** Nothing is asked | Quiet days only |

**Age fit.** The day line carries no age and never says what {child} can do (E82; NS-47-R5). Age fit belongs to the ordinary prompt shown below the line, which the catalogue already picks by the age the Book shows (Q-NTC-9). A brief that needed age would break E82, so none does. From the first week to five, M1, M2 and M4 work at every age, and M3 and M5 do too because the parent is the speaker.

### 8.4 Global never-say codes

Every row obeys N1 to N11. The last column of each brief lists only what is extra for that row.

| Code | Never |
|---|---|
| N1 | A greeting: Happy, Merry, Blessed, Mubarak, Shalom, Namaste, Gong xi, Feliz, or any other |
| N2 | An explanation, history or meaning of the day; a "festival of" phrase; the word "celebrate" (the picker's verb is "mark"); what the day is "for" or "about" |
| N3 | A presence or practice: gather, together, around the table, family time, who was there, food, prayer, fasting, gifts, decorations, costumes, travel |
| N4 | A count, comparison or look-back: another, again, first, last year, "this year's", a streak, a gap |
| N5 | A gendered word for {child} (he, she, son, daughter, boy, girl), or any claim that {child} keeps, follows or belongs to a tradition or a heritage |
| N6 | A label on the parent or home: "your religion", "your faith", "your tradition", "your culture", "your heritage", "your community"; a tradition, a country or a place in a lock-screen string |
| N7 | A question mark or the word "remember" on a quiet line |
| N8 | An exclamation mark, emoji, em or en dash, curly quote, ellipsis character, or a digit outside a date |
| N9 | Any hint that the app wrote, suggested the meaning of, improved or shaped the words. The app invites; the words are the parent's |
| N10 | Use on any marketing surface (store, site, email, social, ad, press) |
| N11 | Certainty about a moving date. In the app: "around". On the lock screen: nothing about the date |

### 8.5 Briefs by group

Lines are "1 / 2" codes from 8.2: the first two lines to write for `days.landing.<id>.1` and `.2`; DL-5's third and fourth are for the writing round. Only rows with `library_status` `yes` are briefed here; excluded and candidate rows are in 8.6.

**A1. Civic days**

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `new_years_day` | M1 or M3: what the first morning of the year sounded like | L12 / L4 | Resolutions, "fresh start", "new you", a look back at the year |
| `mlk_day` | M2 or M3 in the parent's own words | L2 / L1 | Quoting or paraphrasing Dr. King; describing the man, the movement or what the day "teaches"; "dream" lines |
| `presidents_day` | M4: an ordinary day, often a day off | L4 / L5 | Naming any president, party or office; politics |
| `memorial_day` | M6 | L6 | "Remember", "honor", "sacrifice", "fallen", "heroes"; a question; a flag image. Quiet tone |
| `juneteenth` | M2 or M3 | L2 / L3 | Explaining the history; "freedom day" lines; "celebrate"; implying the family's descent or identity |
| `independence_day` | M1 or M4: what today looks like | L4 / L5 | Patriotic claims; assuming fireworks, flags or a barbecue |
| `labor_day` | M4 | L4 / L5 | "Work", "rest you earned", assuming employment |
| `veterans_day` | M6 | L6 | "Thank you for your service"; assuming the parent or a relative served. Quiet tone |
| `thanksgiving` | M1 or M3 | L1 / L5 | "Gather", "table", "turkey", "grateful" as an instruction; "first Thanksgiving"; assuming the family keeps the day |

**A2. Family and parent days** (the parent may be bereaved, single, one of two fathers or two mothers, a grandparent raising {child}, or in a home that does not keep the day)

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `mothers_day` | M5 or M3 | L1 / L14 | "Your mother", "mom", "mum", "your wife"; assuming the parent is a mother or has one; "thank" lines |
| `fathers_day` | M5 or M3 | L1 / L14 | "Your father", "dad", "your husband"; assuming the parent is a father or has one |
| `grandparents_day` | M5 | L1 / L14 | "Your grandparents"; assuming any are living or near; Nani, Dada or Grandma as a default (the family's own word is the parent's) |
| `siblings_day` | M5 | L1 / L14 | Assuming {child} has a sibling; "big brother" or "big sister" |
| `valentines_day` | M3 or M1 | L1 / L5 | A partner, romance, "your love", gifts |

**A3. Seasonal**

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `spring_start`, `summer_start`, `fall_start`, `winter_start` | M1 or M4: light, weather, what is outside | L4 / L5 | "New beginnings", "rebirth", "the year ends", "dark and cold"; a season name that does not match the hemisphere control; a date or hour |
| `meteorological_seasons` | M1 or M4 | L4 / L5 | As above. The second choice in the picker, not a duplicate card |
| `halloween` | M1 or M4 | L4 / L5 | Costumes, candy, "scary", "spooky"; assuming the family keeps it; child-directed imagery in any marketing |
| `new_years_eve` | M3 | L13 / L5 | "Ending", "last", "farewell", "countdown", resolutions |

**B. Heritage months** (proposed layer; fire on the first day only; one reminder per month; never a series)

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `black_history_month` | M2 or M3 | L7 / L2 | A list of people or facts; quotes; "celebrate"; asking about the family's background |
| `womens_history_month` | M3 | L7 / L2 | Gendering {child}; "girl power"; a list of people |
| `jewish_american_heritage_month` | M3 | L7 / L2 | Pairing with persecution or the Holocaust; "your Jewish family"; any religious practice |
| `aanhpi_heritage_month` | M2 or M3 | L7 / L2 | Treating many communities as one; food, dress or flags; "model minority" language; guessing which community |
| `hispanic_heritage_month` | M2 or M3 | L7 / L3 | "Your Hispanic heritage"; choosing between "Hispanic" and "Latino" for the family (both are used; the cultural read decides the key's one name) |
| `native_american_heritage_month` | M2 or M3 | L7 / L2 | "Ancestors", "spirit", mascots, feathers, "land" lines; any link to Thanksgiving copy; ceremonial content of any nation |

**C1. Baha'i** (blocked until the 2027 dates are read from the Baha'i World Centre)

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `naw_ruz_bahai`, `ridvan` | M2 | L3 / L1 | "The Baha'i Faith teaches"; any explanation of the Faith or a holy day; a greeting |

**C2. Buddhist** (dates differ by national list; the picker asks which)

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `vesak` | M2 or M1 | L3 / L1 | "Enlightenment" or "the Buddha's birth" claims; assuming a vegetarian family; ranking the national dates |
| `makha_bucha`, `asalha_bucha` | M2 | L3 / L1 | Explaining the event; assuming Thai or any one tradition |
| `songkran` | M2 or M1 | L4 / L3 | Water-fight imagery; assuming the family is Thai or Buddhist |

**C3. Christian**

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `epiphany_three_kings` | M2 | L3 / L1 | Gift-giving claims; "Dia de Reyes" unless the cultural read says so |
| `ash_wednesday` | M2 | L3 / L1 | Ashes, Lent, "give up", "repent", fasting |
| `palm_sunday` | M2 | L3 / L1 | Describing the day |
| `good_friday` | M6 | L6 | "Crucifixion", "suffering", "remember"; a question. Quiet tone |
| `easter_western` | M1 or M3 | L1 / L5 | "He is risen", bunnies, eggs; "Happy"; ranking against Orthodox Easter |
| `pentecost` | M2 | L3 / L1 | Describing the day |
| `christmas_day` | M1 or M3 | L1 / L5 | "Merry", Santa, trees, gifts, "the birth of" lines; assuming the family is Christian; making it a public title |
| `christmas_orthodox` | M2 | L3 / L1 | "Old Christmas", "late Christmas", "the other Christmas"; assuming a church |
| `easter_orthodox` | M1 or M2 | L1 / L3 | "The other Easter", "late Easter"; ranking churches |

**C4. Hindu** (dates are lunisolar and regional; the picker asks which when lists differ)

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `makar_sankranti` | M2 or M4 | L4 / L3 | Kites, sesame, any practice |
| `maha_shivaratri` | M2 | L3 / L1 | Fast, vigil, any practice |
| `holi` | M2 or M1 | L3 / L4 | "Festival of colours", colour imagery, "play"; any practice |
| `ugadi` | M2 | L3 / L1 | Assuming a region; any practice |
| `rama_navami` | M2 | L3 / L1 | Describing the day |
| `raksha_bandhan` | M2 or M5 | L1 / L3 | A brother, a sister, a thread; any presumption of siblings |
| `janmashtami` | M2 | L3 / L1 | Describing the day |
| `ganesh_chaturthi` | M2 | L3 / L1 | Describing the day |
| `navratri` | M2 | L3 / L1 | "Nine nights of dance" or any practice |
| `dussehra` | M2 | L3 / L1 | "Good over evil" or any meaning |
| `diwali` | M1 or M2 | L1 / L5 | "Festival of lights", lamps, sweets, rangoli, "Happy Diwali"; tying it to one faith; assuming a region. One day, not five |

**C5. Jain and Sikh**

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `mahavir_jayanti` | M2 | L3 / L1 | Describing the day |
| `vaisakhi` | M2 or M4 | L3 / L1 | A spelling (Vaisakhi or Baisakhi) chosen without the cultural read; harvest or religious meaning claims |
| `gurpurab_nanak` | M2 | L3 / L1 | Describing the day; explaining "Guru" |

**C6. Jewish** (begin at sundown the evening before; calculated, so no "around")

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `tu_bishvat` | M2 or M1 | L3 / L5 | Describing the day |
| `purim` | M2 | L3 / L1 | Costumes, the story |
| `passover` | M2 | L3 / L1 | Seder, matzah, "freedom" claims; offering later days |
| `shavuot` | M2 | L3 / L1 | Describing the day |
| `rosh_hashanah` | M2 or M3 | L3 / L1 | "Shana Tova"; apples and honey; judgement or repentance language |
| `yom_kippur` | M6 | L6 | "Atone", "fast", "forgive"; a question. Quiet tone |
| `sukkot` | M2 | L3 / L1 | Booths, harvest claims |
| `simchat_torah` | M2 | L3 / L1 | Describing the day; assuming the Diaspora schedule for an Israeli family (a difference I did not read) |
| `hanukkah` | M1 or M2 | L1 / L5 | "The Jewish Christmas", "eight nights", gelt, menorah, gifts; the evening candle (the app sends in the morning) |

**C7. Muslim** (dates are announced late and differ by method; always "around"; one "which date" choice at most)

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `ramadan_start` | M2 | L3 / L1 | Fasting, hunger, children, prayer, "holy month" explained; "Ramadan Mubarak" |
| `eid_al_fitr` | M1 or M2 | L1 / L3 | "Eid Mubarak"; "end of fasting"; presents |
| `eid_al_adha` | M2 | L3 / L1 | Sacrifice, pilgrimage; "Eid Mubarak" |
| `islamic_new_year` | M2 | L3 / L1 | Describing the day |
| `mawlid` | M2 | L3 / L1 | Offering it as expected: many Muslims do not keep it (DAY 4.4); describing the day |

**D. Culture-led days**

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `kwanzaa` | M2 or M3 | L3 / L1 | The seven principles, one per day; a series of seven reminders; "Happy Kwanzaa"; assuming African American identity |
| `lunar_new_year` | M2 or M1 | L1 / L3 | "Year of the (animal)", red envelopes, dumplings, "Gong xi fa cai"; assuming Chinese; naming one community when many keep it |
| `lantern_festival` | M2 or M5 | L3 / L5 | Describing the day |
| `dragon_boat` | M2 | L3 / L5 | Describing the day; food |
| `mid_autumn_chuseok` | M2 or M1 | L3 / L1 | Mooncakes, moon-gazing, any practice; choosing for the parent between the Chinese, Korean and Vietnamese date |

**F. Regional (if and when a place list ships)**

| Id | Moment | Lines | Never, in addition |
|---|---|---|---|
| `mardi_gras` | M1 or M4 | L4 / L5 | Beads, parades, party, "Carnival" as a claim; assuming New Orleans; any faith meaning |
| `cesar_chavez_day` | M2 or M3 | L2 / L3 | Describing his life or the labour movement; assuming Latino or farmworker families |
| `kuhio_day`, `kamehameha_day`, `hawaii_statehood_day` | M2 | L3 / L2 | Describing the person or the history; assuming a Native Hawaiian family; dropping diacritics without the cultural read |

### 8.6 Not briefed, and why

| Row or group | Status | Why no words |
|---|---|---|
| `columbus_day`, `dst_start`, `dst_end`, `all_saints_souls`, `ashura`, `lailat_al_qadr`, `tisha_bav`, `yom_hashoah`, `obon`, `ullambana`, `qingming`, `dia_de_los_muertos`, `cinco_de_mayo`, `patriots_day` | excluded | DAY section 6: mourning, a contested name, commercial or state-only. A family adds its own typed day. NS-46-R18 fails the build if one is in the library |
| `arab_american_heritage_month`, `caribbean_american_heritage_month`, `pride_month`, `bodhi_day`, `las_posadas`, `karva_chauth`, `yalda`, `shichi_go_san`, `lei_day` | candidate | No source read this session. Each needs a source and a cultural read before it is a row. `pride_month` and `karva_chauth` may never be offered: section 12 |
| `pongal`, `onam`, `parsi_new_year`, `mexican_independence` | deferred | Q-FD-17 (regional and sub-community days) and Q-FD-16 (no country list in the first drop) |
| `nowruz` | blocked | The date is computed and unverified (section 4). No words until an official calendar is read |
| `naw_ruz_bahai`, `ridvan` | blocked | 2027 dates not read; the briefs above are held |
| `quinceanera` | milestone | No date. A typed day. See 8.7 |
| `powwow`, `cherry_blossom`, `metro_festivals`, `diwali_state` | not a library day | Community events, weather, a state's recognition; see 6.4 and 11.3 |
| `christmas_day_civic`, `first_day_of_school` | duplicate, typed-day pointer | One library id for Christmas; school start is the parent's own date |

### 8.7 Family milestones that are not dates

Quinceanera is described by the source as a girl's 15th birthday, religious and social, with practice that varies and families who skip it (S24). It is far from a child of 0 to 5. The same holds for a baptism, a naming day, a Bar or Bat Mitzvah, a first communion, a first haircut and an aqiqah. None is a library day (DAY 6). The only supported ways to mark one are (a) the parent's own typed day (NS-18) and (b) a plain prompt the parent opens by hand. The app never offers one because of a heritage, a place, a name or a tick; never gives a milestone an age; and never gives {child} a gender through one.

---

## 9. Logic inputs for part 3

Part 3 ([03-in-app-and-reminder-logic.md](03-in-app-and-reminder-logic.md), section 11) owns the logic. This section lists only what the data in this file gives it, and the rules a calendar adds that part 3 may not have seen.

### 9.1 CSV columns and the day record

| Part 3 section 11.1 field | CSV column | Note |
|---|---|---|
| `id` | `id` | Stable, never reused |
| `layer` | `layer` | seasonal, family, civic, tradition, culture, as in DAY. Two proposed additions: `heritage_month`, `regional`. `community_event` rows are not library days |
| `nameKey` | `key_name` | `days.name.<id>` |
| rule or table | `date_rule_type`, `rule_text`, `next_2027`, `next_2028`, `carried_2027`, `carried_2028` | `n/r` is a blank cell. Only the 2027 and 2028 columns are filled here; DAY holds 2026 to 2030 for carried rows |
| `authority` | `authority`, `source` | One authority per row; where two lists differ the second list is in `carried_*` or `date_note` and becomes its own table row in code |
| `precision` | `precision` | `about` for lunar, lunisolar, solar-community and Nowruz rows; `exact` otherwise; `none` for non-dates |
| `beginsAtSunset` | `begins_at_sunset` | Jewish, Islamic and Baha'i days |
| `tone` | `tone` | `quiet` for Memorial Day, Veterans Day, Good Friday, Yom Kippur |
| `publicTitleOk` | `public_title_ok` | Hand-listed: four season starts, the meteorological starts, New Year's Day, Independence Day, Labor Day, Thanksgiving (Q-FD-18). A test lists each |
| `preTicked` | not a column | Always false in code |
| `years` | derived | The years with a value in `next_*` or `carried_*` |
| (new) | `offered_when`, `sensitivity`, `drop`, `library_status` | Gate 1 behaviour, copy care, release drop, and whether the row is a library day |

### 9.2 What a calendar adds to the chooser

| Id | Rule | Why |
|---|---|---|
| E-1 | A heritage month is one library day on its first day. It does not repeat inside the month and is never a series. Where its first day is also another ticked day's date, the two merge into one note naming both (NS-46-R8) | 1 May 2027 and 2028 and 15 Sep 2027 are real cases (5.2) |
| E-2 | Where a tradition has two or more authorities for one festival, the parent's choice (a question about a date, never about belief) selects the row. Without one, the first listed row is used, shown "around", and movable (part 3 section 11.4) | NS-46-R14 |
| E-3 | `begins_at_sunset` rows send on the morning of the daytime date the list gives. Never by sunset. Hanukkah's first candle date is the morning of that date, before the candle | DAY 3.5; NS-46-R10 |
| E-4 | Western and Orthodox Easter on the same date (16 Apr 2028; 13 Apr 2031 and 9 Apr 2034 by my computation) are two ticked days on one date: one note, two names | NS-46-R8 |
| E-5 | A row without a date for the coming year plans nothing and shows the calm line only on the Days page (NS-46-R15). Islamic and Hindu tables should ship two years, so this line is the common case in year three | Section 4 |
| E-6 | A `quiet` row on a date with a bright row makes the note quiet (part 3 section 6.3 rule 4) | NS-46-R16 |
| E-7 | `blocked` and `candidate` rows are not in the bundled table, so no tick can exist for them (NS-46-R43 drops an id that is gone, silently) | Section 8.6 |
| E-8 | No row has an hour. The clock is the parent's phone and 09:00 (NS-46-R10) | Q-FD-19 |
| E-9 | A regional row, if shipped, is an ordinary library day. Its place is a label in Browse and nothing else; the planner never reads a place | 6.4 |
| E-10 | The same date, a federal "observed" Friday or Monday, and the calendar date: the library uses the calendar date always | S1; DAY 4.1 |

### 9.3 Data tests this file would ask for

Titles only; part 3 holds the harness (PB-08) and PB-10 holds the oracle test.

1. Every CSV row has all columns and is ASCII.
2. `offered_when` is one of the allowed values, and no `tradition` row is `always`.
3. `public_title_ok` is `yes` only for the hand-listed ids.
4. No `library_status` `excluded` or `candidate` id appears in the bundled library.
5. No `yes` row has `source` `none read`.
6. Every `next_*` value equals the rule's computed date for the rule rows, against the OPM schedule and Hebcal feed as oracles (S1, S8), with the read-on date committed.
7. A date in `carried_*` is never copied to `next_*` without a re-read.
8. A key in `key_in_app` that is not in `packages/content/src` fails the drift test (NS-48-R28) once the family exists.
9. No row `key_email` or `key_push` is anything but "none" or "parked".
10. No marketing file (`store.en.ts`, `site.en.ts`, `packages/emails`) contains a `days.name.*` key or a faith day name outside a written allowlist (NS-46-R47).

---

## 10. Where event messages live, and where they never do

| Surface | Event content | Source |
|---|---|---|
| Local reminder, 09:00 on a ticked day | One neutral title and body; an allowlisted day may use its name | NS-47-R12, R13 |
| Home day slip (rank 2b), by any route | The day's name and one line (`days.landing.*`); quiet days replace the prompt block | NS-46-R13, NS-50, Q-FD-24 |
| Days page, Browse, Day detail, the ask slip | Names, dates ("around" where it moves), the call-out | NS-46, NS-47 |
| Me, Reminders | One line that chosen days still send a reminder and where to stop it | NS-46-R35 |
| A passive seasonal or festival line for a parent who ticked nothing | **None.** Nothing is shown for a day the parent did not tick | NS-46-R2; part 3 section 11.2 |
| Email | **None.** No event, festival or heritage email, and none on a day | E75; NS-46-R47; part 3 L-04 |
| Push | **None** in 1.0, and never for a day, because the server cannot know which days are ticked | E79; part 3 section 13.1 |
| Store listing, website, social, ads, press | **None.** No tradition, day name, greeting or holiday image | NS-46-R47, Q-FD-28 |
| A letter, a book page, the printed book | **None added by the app.** A letter written on a ticked day carries no day name unless the parent types it | NS-47-R3, R5 |
| Analytics, logs, crash reports | **None.** No day, tradition or place | NS-47-R8, R9, R34 |

---

## 11. What it must never say

### 11.1 Everywhere

The codes N1 to N11 in 8.4 apply to every row, in the app and anywhere else a day word could appear.

### 11.2 Words that trip the rules test or its spirit

| Word or idea | Why |
|---|---|
| "dead", "die", "death", "passed away" | The fear pattern in `rules.test.ts` matches them. A name such as "Day of the Dead" would need an allowlist and is excluded today (8.6) |
| "celebrate", "gather", "together", "around the table" | NS-46-R17: a family may only mark a day, and presence is never assumed |
| "magic", "smart", "perfect", "generate", "enhance" | The AI pattern in `rules.test.ts` |
| A digit outside a date | NS-46-R17. A festival name with a number needs the names allowlist |
| "your religion", "your faith", "your tradition", "your culture", "your heritage" | NS-46-R38; N6 |
| "last year", "again", "another", "first" | NS-46-R22; N4 |

### 11.3 Cautions by community: what the app must not presume

These are not facts about any community. They are limits on what the app may assume, and every one needs the cultural read in section 12 before it is final.

| Group | The app must not |
|---|---|
| African American and Black communities | Assume Juneteenth, Kwanzaa or Black History Month is "for" any family; explain or summarise a history; use a name or a surname as a signal |
| Native American, Alaska Native and Native Hawaiian communities | Offer ceremonial days of any nation or any powwow date; suggest attending, photographing or posting about a powwow (S20 records that some Native people feel powwows have been harmed by spectatorship); pair the heritage month with Thanksgiving; offer a tribal affiliation option; use mascots, feathers or "spirit" language; drop diacritics in Hawaiian names without a read |
| Latino and Hispanic communities | Treat "Hispanic" and "Latino" as one label for every family; assume Catholic practice; offer Quinceanera, Dia de los Muertos, Las Posadas or Dia de Reyes as a default; infer origin from a name or a language |
| Asian American, Native Hawaiian and Pacific Islander communities | Treat many communities as one; infer from a name; pick one national date for a shared festival; use food, dress or animal-sign copy |
| Arab American and Muslim communities | Treat Arab and Muslim as one; assume a sighting or calculation method; use "Mubarak"; mention fasting, sacrifice or children in a day line; name Ashura, Lailat al-Qadr or the days within Ramadan |
| Jewish communities | Treat heritage as religion; mention persecution or the Holocaust next to any day; say "Jewish Christmas"; assume the Diaspora schedule is every family's; send an evening note for a day that begins at sundown |
| Christian communities | Assume Christmas or Easter is kept; rank Western against Orthodox or call one "the other"; assume a church from a name |
| Hindu, Sikh, Jain and Buddhist communities | Treat South Asian as one; pick a regional date for the family; tag Diwali to one faith; use "festival of lights" or "colours"; choose among national Buddha's birthday dates |
| Baha'i, Zoroastrian and Persian communities | Say Nowruz is only Persian; assume the Tehran-midnight rule; name a belief |
| People of no faith, or of a faith that keeps no holidays, and interfaith households | Ask; imply a gap; order the list; assume Halloween, Christmas or birthdays are kept |
| Families that are bereaved, single, adoptive, foster, grandparent-led, same-sex, or without a partner | Assume who holds the phone on Mother's Day, Father's Day, Grandparents' Day, Siblings Day or Valentine's Day (DAY 5.2) |
| Veteran, military and bereaved-by-service families | Use "thank you for your service", "sacrifice", "heroes" or "remember" on Memorial Day or Veterans Day |
| LGBTQ+ families | Offer Pride Month by inference from a family's make-up. Not offered at all until it has its own read and a founder ruling |

---

## 12. Counsel and cultural review: who should read this before any word ships

Nothing here is a reviewer record. NS-46-R23 and Q-FD-9 need one recorded per tradition, by a pseudonymous id, the tradition id, a date and "read"; the person's name stays out of the repository. PB-04 recruits them.

### 12.1 Counsel

| Id | Question | Source |
|---|---|---|
| C-1 | Whether a special-category rule (GDPR Article 9, US state sensitive-data laws) reaches a list of days that never leaves the phone | CUL-Q6; NS-47 section 17 |
| C-2 | The consent line before the first tick, and whether a day reminder is "advertising" under the Apple licence (Attachment 1 section 2.2) | NS-46-R35 |
| C-3 | App Review 4.5.4 for a local note, and 5.1.1 for an optional question about days | CUL-Q11; FR-CUL-14; CUL-Q8 (UNVERIFIED) |
| C-4 | Licences for every copied table: Hebcal, timeanddate, Drik Panchang, Hong Kong Observatory, USNO, Library of Congress sites. Prefer computing rule dates | FR-DAY-23; NS-46-R23 |
| C-5 | The claim "The days you choose stay on this phone", the iPhone backup, and the device-transfer test | NS-47-R6, R22 |
| C-6 | **New:** a place picker as a new item of sensitive data, and whether a ticked state holiday is location data | Section 6; Q-EV-2 |
| C-7 | **New:** heritage-month rows (a national observance that names an ethnic group) and the "Browse all" visibility of tradition days under platform content rules (1.1.1) | Section 5; Q-EV-4 |
| C-8 | The age rating re-read for NS-46 | K6 |
| C-9 | Whether naming a faith day on a lock screen behind the day-name switch needs a second plain line | Q-DAY-6 |
| C-10 | Marketing: confirm the "no tradition, no greeting, no holiday imagery" rule covers paid targeting and press | NS-46-R47 |

### 12.2 Cultural reads (a member of each community; for each: names, dates by community, never-say list, quiet or bright tone, whether it should be offered at all)

| Read | Covers (rows) | Specific questions |
|---|---|---|
| African American and Black communities | `juneteenth`, `mlk_day`, `kwanzaa`, `black_history_month` | Offer Kwanzaa to everyone (`always`) or only after a pick? Is the first day alone right? Tone for Juneteenth |
| Arab American communities | `arab_american_heritage_month` (candidate) | Whether to offer at all; the name; April |
| Asian American, Native Hawaiian and Pacific Islander (several readers: East Asian, South Asian, Southeast Asian, Pacific Islander) | `aanhpi_heritage_month`, `lunar_new_year`, `lantern_festival`, `dragon_boat`, `mid_autumn_chuseok`, `songkran`, `obon`, `qingming` | The month's name; which community lists differ (Chinese, Korean, Vietnamese); the Qingming and Obon exclusions |
| Native American and Alaska Native communities | `native_american_heritage_month`, `powwow`, `thanksgiving`, `columbus_day` | The month's name; the Thanksgiving copy; that no ceremonial row exists; whether Indigenous Peoples' Day should ever be offered |
| Native Hawaiian and Pacific Islander communities | `kuhio_day`, `kamehameha_day`, `hawaii_statehood_day`, `lei_day` | Spelling and diacritics; whether a name-only line is right |
| Baha'i community | `naw_ruz_bahai`, `ridvan` | The 2027 dates from the World Centre; wording of the day names |
| Buddhist communities (Theravada, Mahayana, Vajrayana; Thai, Sri Lankan, Chinese, Vietnamese, Korean, Japanese, Tibetan) | `vesak`, `makha_bucha`, `asalha_bucha`, `bodhi_day`, `ullambana` | Which dates; the "which date" question; the exclusions |
| Christian communities (Catholic, Protestant, Orthodox, Oriental Orthodox; also groups that do not keep holidays) | `christmas_day`, `epiphany_three_kings`, `ash_wednesday`, `palm_sunday`, `good_friday`, `easter_western`, `pentecost`, `christmas_orthodox`, `easter_orthodox`, `las_posadas`, `all_saints_souls` | Names; Orthodox calendars (Coptic, Ethiopian, Armenian were not read); Good Friday as a quiet day |
| Hindu communities (North and South; Gujarati, Tamil, Telugu, Kannada, Malayali, Bengali, Nepali) | The Hindu rows and `diwali` | Which tithi and region by default; whether Diwali is offered under Hindu, Sikh and Jain pickers or only in Browse; `karva_chauth`, `pongal`, `onam` |
| Jain community | `mahavir_jayanti`, `diwali` | Dates and names; whether Diwali belongs here |
| Jewish communities (Reform, Conservative, Orthodox; Ashkenazi, Sephardi, Mizrahi; Diaspora and Israeli) | The Jewish rows and `jewish_american_heritage_month` | Names; Yom Kippur as quiet; the evening note; heritage month wording |
| Latino and Hispanic communities (Mexican, Puerto Rican, Cuban, Central American, South American, Caribbean) | `hispanic_heritage_month`, `epiphany_three_kings`, `quinceanera`, `dia_de_los_muertos`, `cinco_de_mayo`, `las_posadas`, `mexican_independence` | "Hispanic" and "Latino"; whether a quiet, name-only Dia de los Muertos is right or the exclusion stands; Quinceanera as a typed day only |
| Muslim communities (Sunni, Shia, Ahmadi; by sighting, calculation or Saudi announcement) | The Muslim rows | The default list for a US family; the "which date" question; Mawlid; the exclusions |
| Parsi and Zoroastrian community | `parsi_new_year` | Calendar (Shahenshahi, Kadmi, Fasli) |
| Persian, Kurdish, Afghan and Central Asian communities | `nowruz`, `yalda` | The date rule; the 2027 edge case; the name; at least three readers |
| Sikh community | `vaisakhi`, `gurpurab_nanak` | Dates (Nanakshahi and Bikrami), spelling, SGPC |
| LGBTQ+ community and families | `pride_month`, family days | Whether Pride Month is ever offered; family-day wording |
| Bereaved, adoptive, foster, single-parent and grandparent-led families | `mothers_day`, `fathers_day`, `grandparents_day`, `siblings_day`, `valentines_day` | The universal lines (L1, L14) |
| Military and veteran families | `memorial_day`, `veterans_day` | Quiet tone and the single line |
| A native-speaker and plain-language read | Every line | Short sentences, plain adult English, no idiom that a second-language reader would miss |

---

## 13. Questions and proposed defaults

Defaults hold until answered and are the requirement for design and build, never for public text, a counsel answer or a store submission.

| Id | Question | Default | Who |
|---|---|---|---|
| Q-EV-1 | Keep religion and region as no stored fields? | Yes, as Q-FD-5 and CL-013. No persistent background logic | founder, counsel |
| Q-EV-2 | Add a place picker (a browse filter, memory only) for state days? | No place picker in the first drop; regional rows ship later with a reviewer each (Q-FD-17). If yes: section 6.3 | founder, counsel |
| Q-EV-3 | Per-day landing lines, `days.landing.<id>.<n>`, indexed by year (PC-3)? | Shared lines per tone only until the first tradition reviews land; per-day lines for civic, seasonal and family days first (they need no reviewer) | product, content |
| Q-EV-4 | Add a heritage-month layer (nine months, one reminder each, first day)? | Not in Drop B. Drop C after counsel C-7 and the cultural reads | founder, counsel |
| Q-EV-5 | Offer culture-led days (Lunar New Year, Kwanzaa, Mid-Autumn and Chuseok, Nowruz) to every parent without a question (Q-FD-1)? | Yes, as ruled, and a reviewer may move any to `background_picked` | founder, cultural reads |
| Q-EV-6 | Which traditions in the first tradition drop? | Those the founder can reach reviewers for (Q-FD-9); NS-46's own list (Christmas, Easter, Hanukkah, Eid al-Fitr, Diwali, Lunar New Year) is the working order, alphabetical in the UI | founder |
| Q-EV-7 | Which list is the default for a US family where Islamic lists differ? | The first listed row, shown "around", movable; the picker asks "Which date should we use?" Not a ranking of methods | cultural read, product |
| Q-EV-8 | Ten years of dates? | Rule dates compute without limit; Easter-based and astronomical days compute from sourced oracles; table days (Islamic, Hindu, Sikh, Jain, Buddhist, Baha'i, Chinese) ship two years and show the calm no-date line after that | product, ops |
| Q-EV-9 | Bundled tables or a downloadable pack? | Bundled, refreshed by app update (DAY 3.6, NS-46-R48). A pack only if Islamic tentative dates need a mid-year fix; then one whole-library fetch | Karma, mobile |
| Q-EV-10 | Reopen any excluded day (Dia de los Muertos, Obon, Qingming, Columbus or Indigenous Peoples' Day, Daylight saving)? | No. A family adds its own typed day. Cultural reads may ask again | cultural reads |
| Q-EV-11 | Offer Pride Month, Arab American Heritage Month, Caribbean-American Heritage Month, or any other candidate? | Not until a source is read, a cultural read exists and the founder rules | founder |
| Q-EV-12 | Names with diacritics (Hawaiian, Spanish)? | In-app names keep their correct spelling if the rules test allows it. The test I read bans dashes, curly quotes and ellipsis characters, and I did not check whether a Hawaiian okina (U+02BB) is caught; `content` runs it. This ASCII file cannot show them | content |
| Q-EV-13 | Ship Nowruz, Naw-Ruz or Ridvan before an official calendar is read? | No | content |

---

## 14. Backlog candidates for part 5

Part 5 ([05-backlog-proposed.md](05-backlog-proposed.md)) already holds PB-04 (tradition reviewers), PB-10 (civic, family and seasonal rows with an oracle test), PB-11 (`days.*` keys), PB-15 (the October review), PB-18 (one tradition per PR) and PB-19 (lines by year). This file adds no duplicate. It proposes these extra rows for `product` to number:

| Proposed row | What | Depends on | Mode |
|---|---|---|---|
| E-A | Check this file's `next_*` against the oracle and commit the oracle table with its read-on date (OPM, USNO, Hebcal, HKO) | PB-10 | agent |
| E-B | Read the unread primaries: Baha'i World Centre 2027, the Iranian calendar for Nowruz, SGPC for Vaisakhi and Gurpurab, a panchang for Holi and Navratri, the national Vesak lists for 2028, and the Central Hilal Sighting Committee | PB-04 | human with agent |
| E-C | Cultural reads per community in 12.2, one recorded reviewer id each | PB-04 | human |
| E-D | Counsel items C-6 and C-7 added to the PB-02 brief | PB-02 | human |
| E-E | Heritage-month layer and place picker proposals as two errata drafts, if the founder says yes to Q-EV-2 or Q-EV-4 | PB-01 | agent |
| E-F | The scan in 9.3 test 10 (no marketing file holds a day key) | PB-13 | agent |

---

## 15. What I could not do

- Verify any date from a primary religious body. Section 1.3 lists them.
- Read the licences of the sources. FR-DAY-23 stands.
- Run the rules test on the proposed lines.
- Confirm the lock-screen behaviour on a device (J-CUL-01 is a device walk).
- Name a reviewer. None is recorded.

`content`

# Function review: the library of days (DAY)

Owner: `content` with `regulatory-affairs`. FR code DAY. Wave 3, brief 1 (`docs/product/prd/tools/review/wave3-briefs.md`), answering `docs/product/prd/20-founder-direction-20nov.md` sections 1 (items 1 and 2), 3 and 4. Written 20 Nov 2026 (UTC). Docs only: nothing here is built, no string is live, no date has been entered in code, and no decision is recorded. Not committed.

The writers are Claude roles. We are not lawyers and not a religious or cultural authority. Every legal reading says "counsel must confirm". Every date below is a date another party published, read this session, and is marked with where it came from. Where a date could not be read, the cell says `n/r` (not read) and no date is written from memory.

Fictional family Asha only. Words a parent would read are quoted as intent; `content` writes the final strings under `VOICE.md` and the founder approves them.

---

## 0. What this file says, in short

1. **The library is data, not a second notification system.** Each day is a row with a name key, a rule or a dated table for 2026 to 2030, a source and an uncertainty. A parent ticks the days they want. A ticked day is scheduled as a `typedDay` (class already in NS-32), so it uses the existing planner, the one-a-day budget, the top priority slot and the lock-screen placeholder. No class is added to the NS-32 registry (this is ruling N-2 in `GAP-LOG.md`).
2. **Nothing is ticked for the parent.** Not even Mother's Day. A short list the parent ticks is personal; a guessed list is not (direction 3.1).
3. **Three kinds of date, three ways to store them.** Fixed or rule-based days (4 July, Thanksgiving) are computed and need no table. Astronomical days (equinoxes, solstices) are stored as one UTC instant and shown on the phone's own local date, because across Eastern, Pacific and Hawaii time the local date differs for 5 of the 20 events in 2026 to 2030 (section 3.4). Lunar and lunisolar days (Easter, Eid, Diwali, Vesak) are a dated table per year from a named authority and always shown as "around" in the picker.
4. **The authorities disagree, and that is the main data risk.** Same festival, same year, different date by country or tradition: Eid al-Fitr 2026 is 20 Mar by the Saudi calendar and 21 Mar by Iran's; Diwali 2027 is 28 Oct on a US-facing list and 29 Oct on India's gazette; the Buddha's birthday in 2026 is 1 May (India), 24 May (Korea), 30 or 31 May (Sri Lanka, Singapore, Thailand). So the table carries an authority and a country per row, and the parent can always move the date (section 3.5).
5. **Some years cannot be filled yet.** The lists I could read stop in 2027 for several festivals (Vesak, Vaisakhi, Guru Nanak Jayanti, the Prophet's birthday for Sunni lists, Baha'i holy days). Those cells are `n/r` and the library must say less, not guess (section 3.6, FR-DAY-12).
6. **Lock screen.** A passer-by must not learn a family's make-up or faith from a notification. Public days (seasons, civic) may name themselves in a title; family days and tradition days show the neutral title unless the parent has turned on names (ruling N-3). Section 5.
7. **Exclusions.** Days about death or mourning, contested names, and political or commercial days stay out of the library; a family that keeps them adds them as their own typed day, in their own words (section 6).
8. **Needs a ruling:** R-FD-3 (Memorial Day and Veterans Day), the shipping year range and update route, the morning time for library days, which countries ship, and counsel on faith-day names (section 11).

---

## 1. What I reviewed, and what I did not

### Read this session (repo, branch `docs/locked-pack-inputs-20nov`)

| Source | What for |
|---|---|
| `docs/product/prd/tools/review/wave3-briefs.md`, `gap-agents-common.md`, `20-founder-direction-20nov.md` (all) | The brief, the rules for this review, the direction (sections 1, 3, 4, 7, 8, 9) |
| `docs/product/prd/functions/BRIEF.md` | Format, FR ids, linking process |
| `functions/support.md` (header and section 1 to 2) | Format example |
| `09-capture.md` NS-18 (lines 933 to 973 read; section 3 and 5 are the ones used) | The typed-day machinery this reuses |
| `11-foundations.md` NS-32 (lines 13 to 62) | Budget, classes, priority, lock-screen rules |
| `10-reading-and-family.md` NS-31 line 958 to 965 | Where `occasion` was parked |
| `GAP-LOG.md` lines 405 to 440 | Rulings R-IA-2, R-IA-3, R-IA-5, N-2, N-3, N-4, N-7 that bind this file |
| `apps/mobile/src/lib/reminders/planner.ts` (exports, lines 44 to 136, 284 to 290), `ls` of the folder | The planner: kinds `evening`, `monthAge`, `birthday`; `BIRTHDAY_TIME` 09:00; horizon 21 days (evening) and 92 days (month and birthday); at most 60 pending |
| `packages/content/VOICE.md` (the notification and no-guilt sections), `test/rules.test.ts` lines 181 to 184 (the fear and loss pattern) | Voice and the checker |
| Branch `origin/docs/e2e-ux-20nov`: `D-family-sharing-reminders/DESIGN.md` screen table (D-S06 to D-S11), `WORDS.md` lines 258 to 281 (neutral typed-day keys), `A-capture/DESIGN.md` A-S01 | Screen ids and the built neutral lock-screen wording |

### Outside sources read this session (all 20 Nov 2026 unless noted)

| Fact | Source |
|---|---|
| Legal public holidays and their rules (MLK third Monday in January, Washington's Birthday third Monday in February, Memorial Day last Monday in May, Juneteenth National Independence Day 19 June, Labor Day first Monday in September, Columbus Day second Monday in October, Veterans Day 11 November, Thanksgiving fourth Thursday in November) | https://www.law.cornell.edu/uscode/text/5/6103 (5 U.S.C. 6103(a)) |
| Father's Day is the third Sunday in June | https://www.law.cornell.edu/uscode/text/36/109 |
| The last Sunday in September is Gold Star Mother's Day | https://www.law.cornell.edu/uscode/text/36/111 |
| Equinox and solstice instants for 2026 to 2030 (the Earth's Seasons data service, queried at UTC-5 fixed, no daylight saving) | https://aa.usno.navy.mil/api/seasons?year=2026 (and 2027 to 2030), U.S. Naval Observatory |
| Astronomical seasons start at the equinoxes and solstices; meteorological seasons are whole months (spring March to May, and so on) | https://www.ncei.noaa.gov/news/meteorological-versus-astronomical-seasons (NOAA, page dated March 10, 2023) |
| Siblings Day: held annually on April 10th; the foundation's goal was a national day, so it is not a federal holiday | https://www.siblingsday.org/ |
| Jewish holidays 2026 to 2030 (Diaspora, no Israel schedule), Hebrew year start, Chanukah begins at sundown on Friday 4 December 2026 | https://www.hebcal.com/hebcal (JSON for each year) and https://www.hebcal.com/holidays/chanukah-2026 |
| Dates by country for 2026 to 2030 of: Easter and the Christian days around it, Orthodox Easter, Eid al-Fitr, Eid al-Adha, Ramadan, Muharram, Ashura, Holi, Diwali, Navratri, Dussehra, Janmashtami, Raksha Bandhan, Ganesh Chaturthi, Onam, Pongal, Makar Sankranti, Maha Shivaratri, Mahavir Jayanti, Vesak and its national variants, Lunar New Year, Lantern, Dragon Boat, Mid-Autumn, Chuseok, Songkran, Norooz, Thanksgiving, Mother's and Father's Day and the rest of the US list | https://www.timeanddate.com/holidays/<country>/<year> pages for us, india, singapore, thailand, saudi-arabia, china, south-korea, japan, iran, sri-lanka, israel, mexico, indonesia (2026 to 2030), and the per-holiday pages for Easter, Eid, Diwali, Lunar New Year, Orthodox Easter (Greece, Romania, Ukraine, Ethiopia pages), Tomb Sweeping (Hong Kong) |
| Islamic dates are tentative for later years; "regional customs or Moon sightings may cause a variation of the date ... there may be one-day error"; Islamic days begin at sundown the day before the date shown | the Eid al-Fitr page on timeanddate.com (same pages) |
| Bahai holy days: the New Year (Naw-Ruz) is astronomically fixed to the vernal equinox; holy days are fixed in the solar calendar except the Twin Birthdays; a day runs sunset to sunset; the 2026 list (Naw-Ruz 21 March, first day of Ridvan 21 April, and so on) | https://www.bahai.org/action/devotional-life/calendar |
| World religion sizes in 2020: Christians 2.3 billion (28.8%), Muslims 25.6%, religiously unaffiliated 1.9 billion (24.2%), Hindus 1.2 billion (14.9%), Buddhists 324 million (4.1%), Jews 14.8 million (about 0.2%), all other religions combined (Baha'is, Daoists, Jains, Sikhs, Shintoists, folk religions and more) 2.2% | https://www.pewresearch.org/religion/2025/06/09/how-the-global-religious-landscape-changed-from-2010-to-2020/ (Pew Research Center, 9 Jun 2025) |
| 2010 sizes, used only for the folk-religion share: more than 400 million (6%) practise folk or traditional religions; 58 million (under 1%) belong to other religions including Baha'i, Jainism, Sikhism, Shintoism, Taoism, Wicca and Zoroastrianism | https://www.pewresearch.org/religion/2012/12/18/global-religious-landscape-exec/ |

I fetched these with `curl` from the shell because the web-fetch tool was blocked in this session. Pages were read as text; no page was shown to a person. The U.S. Office of Personnel Management page returned "Access Denied", so I used the statute (5 U.S.C. 6103) it implements, not OPM's table.

### What I did not read, run or check

- **No authority for Easter's computation was read.** The Western and Orthodox Easter dates I show are the timeanddate dates; I also ran the standard Gregorian and Julian computations and they match all ten dates, but that check is mine, not a source.
- **Mother's Day** rule (second Sunday in May) and **Grandparents' Day** (first Sunday after Labor Day), **Valentine's Day**, **Halloween**, **New Year's Eve** and **Kwanzaa** have no statute I read. Dates are from timeanddate and match the stated rule in every year 2026 to 2030. I ran the date rules in a script to cross-check (section 4 notes).
- **Sikh, Jain, Zoroastrian, Shinto and folk-religion** festival authorities (SGPC, Jain bodies and so on) were not read. Their rows use India's government list on timeanddate only, and some years are `n/r`.
- **That a given festival follows a lunar or lunisolar calendar** is general knowledge, not a source read. It only drives the "around" wording.
- **Hindu regional calendars** (North Indian purnimanta, South Indian amanta, Nepali, Bali) differ. I read one list (India's gazette via timeanddate).
- **Obon, Shichi-go-san, Nowruz outside Iran, Bodhi Day, Qingming outside Hong Kong, Tet** beyond the Vietnam 2026 and 2027 line were not read to usable depth.
- **National days** of countries other than those named in section 4.6 were not read.
- **Which religions a typical Asha-like US family keeps** was not researched; this is not a user study.
- **No store, App Review or privacy-label text** was read for this file (that is brief 3, `functions/cultural-background-data.md`).
- **I ran nothing on a phone.** I did not run `npm test` or the content rules test; sample lines in section 5 were checked against the content rules by eye and against the fear and loss pattern at `rules.test.ts:182` by reading it.
- **I did not read `docs/design/notifications/COPY_INVENTORY.md` or `NOTIFICATIONS.md`** (brief 2 owns them).

---

## 2. Coverage check: what the repo and the cards already say

| Fact | Where (read this session) | What it means for days |
|---|---|---|
| All notifications are local; one budgeted note per phone per local day; classes in priority order `plan` (outside), `typedDay`, `birthday`, `monthAge`, `evening`; never time-sensitive; every body a `packages/content` key; neutral `hiddenPreviewsBodyPlaceholder` on every category | NS-32 section 3, `11-foundations.md` lines 29 to 37 | A ticked day is a `typedDay`. No new class. A ticked day wins the day over a birthday only by the existing order (typedDay is above birthday). |
| NS-18 today: the parent types one future date and 1 to 80 characters; the default notification is the fixed line (intent "A day you wanted to remember"); the typed words show after the tap; the day is deleted the day after delivery | NS-18 sections 3 to 4, `09-capture.md` lines 941 to 950 | The machinery exists as a plan, not as built code: `planner.ts` kinds are only `evening`, `monthAge`, `birthday` (line 106). `typedDay` is a design and a backlog row (BL-982), not shipped. |
| NS-18 "Not in scope": recurring days, days the app suggests, syncing typed days | `09-capture.md` line 943 | NS-46 reopens the first two on purpose (a library day recurs; the app offers a list). It keeps the third: nothing syncs. This is a card change (section 9). |
| `occasion` class was registered in PR #758 for the parked Memory Library and "leaves #758" | NS-32 `11-foundations.md` line 25 and 39; NS-31 line 965 | Ruling N-2 (GAP-LOG): `occasion` returns only as a source of typed days. Consistent with this design. |
| Reminders and typed days live in Me, Reminders (D-S06); Add a day is D-S08; a typed day detail is D-S09; the lock screen render is D-S10; the landing is D-S11 | e2e area D DESIGN screen table | R-IA-2 (GAP-LOG): one "Days" page for NS-18 typed days and the NS-46 library, in Me under "Notes and days". No second list. |
| The neutral lock-screen wording for a typed day is already designed: title "A day you wanted to remember" | `D-family-sharing-reminders/WORDS.md` lines 258 to 266 | The library reuses it for family and tradition days. |
| `BIRTHDAY_TIME` is 09:00; reminder window 07:00 to 21:30; the planner plans month and birthday notes 92 days ahead and evening notes 21 days ahead; at most 60 pending (64 minus 4 plan) | `planner.ts` lines 87 to 134, 288 | Library days are planned like birthdays: 92 days ahead, morning default. Pending slots are not a constraint at the numbers a parent will tick (section 3.3). |
| The photo library, faces and scenes are out of scope; the Memory Library's "on this day" part is a separate card (NS-31) | direction section 2 and 6; NS-31 | NS-46 reads no photo, no place and no location. |

### Coverage verdict per card (days and notifications only; other cards have no days content)

A card is **covered** when it already says what the library needs, **partly** when it works but a row must change, **missing** when nothing says it. NS-38 to NS-45 (`19-from-download-to-first-letter.md`) were not read for this file; the library is not first-run scope, so their verdict is n/a.

| Card | Verdict | Why | FR rows |
|---|---|---|---|
| NS-13 Reminders and back-off | partly | Evening class and the one-switch names rule exist; library days are a different class source and must not be touched by the back-off (NS-32 says a typed day is never suppressed) | FR-DAY-03, 09 |
| NS-18 Typed days | partly | The machinery to reuse; its "Not in scope" excludes recurring days and days the app suggests | FR-DAY-03, 04, 15; card change 1 |
| NS-31 Memory Library | covered | `occasion` is parked and returns only as a source of typed days (N-2); the "on this day" look-back stays in NS-31 | FR-DAY-25 |
| NS-32 One notification budget | partly | Classes, priority, lock-screen rules are right; the registry needs no new class; priority for birthday against a library day and the two-days-one-date case are missing | FR-DAY-03, 07, 09; card changes 2 to 4 |
| NS-01 Photo with a letter | n/a | No days content; the library reads no picture | none |
| All other cards (NS-02 to NS-12, NS-14 to NS-17, NS-19 to NS-30, NS-33 to NS-37) | n/a | No days, no calendar, no faith or country field | none |

**Gap this review fills:** no card, test or content key yet holds a list of days, a date table, a source, a neutral-title rule per layer or an exclusion list. Nothing in `packages/content` has a days key family. The prompts (111) are not date-based.

---

## 3. How the library works (the design the data serves)

### 3.1 The day record

One row per day, in `packages/content/src/days/` (proposed). Fields:

| Field | Meaning |
|---|---|
| `id` | Stable, never reused (`day.mothers_day`, `day.eid_al_fitr`) |
| `layer` | `seasonal`, `family`, `civic`, `tradition`, `culture`, `national` |
| `tradition` | For layer `tradition`: `christian_western`, `christian_orthodox`, `muslim`, `hindu`, `buddhist`, `jewish`, `sikh`, `bahai`, `jain`, and so on; none otherwise |
| `nameKey` | A `packages/content` key. The name a family would use ("Mother's Day", "Eid al-Fitr"). No translation promise. |
| `rule` | `fixed(month, day)`, `nthWeekday(n, weekday, month)`, `lastWeekday`, `afterLabor`, `astro(event)`, or `table` |
| `table` | For `table` and `astro`: per year, the date or UTC instant, the `authority` (a named list), the `country` or tradition the list is for, and `precision`: `exact` or `about` |
| `beginsAtSunset` | True for Jewish, Islamic and Bahai days: the table holds the daytime date (the day the holiday is counted on); the evening before is not scheduled |
| `tone` | `bright`, `quiet` (a name and an open line, no question), see 5.3 |
| `publicTitleOk` | True only for `seasonal` and `civic` days (N-3). Family and tradition days: false |
| `preTicked` | Always false. A test fails if any row is true. |

Nothing in the record is about the parent. The record holds no person, no belief, no country of the parent.

### 3.2 A ticked day

The parent's choice is the only thing that schedules anything. What the phone stores, per account and per book, is a list of day ids and an optional per-day date override and an optional per-day "off" for one year. It stores no date copies, so a corrected table in an app update fixes every phone. The planner resolves each ticked day to its next date from the table, in the phone's local calendar, at the morning default (3.7), and emits a `typedDay` item with the key `days.<id>`, not a parent's words. Delivery, budget, priority, quiet hours and back-off behave as NS-32 already rules for `typedDay`.

Differences from a parent-typed day (NS-18), all deliberate:

| | Parent's typed day | Library day |
|---|---|---|
| Recurs | No; deleted the day after | Yes, each year, until the parent unticks it |
| Words | The parent's, shown after the tap | A name from the library; the app adds no words of the parent's |
| Date | The parent's | Table or rule; the parent can move it for that year or for always |
| Lock-screen default | Fixed neutral line | Public days name themselves; others the neutral line (section 5) |

### 3.3 Pending slots and the budget

The planner keeps at most 60 budgeted notifications pending and plans month and birthday notes 92 days ahead. A parent who ticks 12 days of the library has far fewer than 60 dates in any 92-day window: even if every one of the library's December days is ticked (New Year's Eve, Christmas, Hanukkah's first day, Kwanzaa, the solstice) that is 5 dates. That is well under the ceiling, so the slot cost is small. FR-DAY-07 asks for a test at the limit anyway. The budget still holds: if two ticked days fall on one date (real cases are in section 4.8, for example Valentine's Day and Ash Wednesday on 14 Feb 2029), the phone sends one notification, with the neutral lock-screen title, and the landing names both days. This matches how NS-32 treats two children's month-days on one date ("one month note naming both or neither"). No day is moved to another date: a note on the wrong day is wrong. A ticked day that falls on a date with a plan notice still gets its own note (plan is outside the budget). A ticked day and a birthday on one date: the ticked day wins by NS-32's order (`typedDay` above `birthday`) and the birthday is not sent that day. That is a harsh result for a first birthday that falls on Thanksgiving, so NS-46 asks one thing of NS-32: a birthday keeps its date and the library day yields (Q-DAY-5, default: birthday wins). That is a change to NS-32's proposed order for library days only, and it needs a Karma ruling (section 9, row 3) (FR-DAY-07).

### 3.4 Date kinds and how the phone resolves them

| Kind | Examples | Stored | The phone shows |
|---|---|---|---|
| Fixed | Jan 1, Jul 4, Oct 31, Dec 31 | month and day | That date |
| Nth weekday | Thanksgiving, Mother's Day, Labor Day | the rule | The computed date |
| Astronomical | First day of spring, summer, fall and winter | the UTC instant from the U.S. Naval Observatory | The phone's local calendar date of that instant |
| Lunar or lunisolar | Easter, Eid, Diwali, Vesak, Lunar New Year, Passover | a dated table with authority | "Around {date}" in the picker; the planned date from the table |
| Solar, by a community's rule | Vaisakhi, Songkran, Makar Sankranti | fixed or table | That date |

**The astronomical date depends on the time zone.** The Naval Observatory instants, converted to zones: of the 20 events 2026 to 2030, the local date differs between Eastern and Pacific time once (the September equinox 2027: 23 Sep Eastern, 22 Sep Pacific) and between Eastern and Hawaii five times, so across the three US zones it differs for 5 events. Against India it differs for 9 events. So the library stores the instant, and the planner converts it with the phone's own time zone, the same way a birthday is read as a calendar date. The notification names no hour.

| Event | UTC instant (from USNO UTC-5 value) | Eastern date | Pacific date | Hawaii date | India date | Sydney date |
|---|---|---|---|---|---|---|
| March equinox 2026 | 20 Mar 14:46 | 20 Mar | 20 Mar | 20 Mar | 20 Mar | 21 Mar |
| June solstice 2026 | 21 Jun 08:24 | 21 Jun | 21 Jun | 20 Jun | 21 Jun | 21 Jun |
| September equinox 2026 | 23 Sep 00:05 | 22 Sep | 22 Sep | 22 Sep | 23 Sep | 23 Sep |
| December solstice 2026 | 21 Dec 20:50 | 21 Dec | 21 Dec | 21 Dec | 22 Dec | 22 Dec |
| March equinox 2027 | 20 Mar 20:25 | 20 Mar | 20 Mar | 20 Mar | 21 Mar | 21 Mar |
| June solstice 2027 | 21 Jun 14:11 | 21 Jun | 21 Jun | 21 Jun | 21 Jun | 22 Jun |
| September equinox 2027 | 23 Sep 06:02 | 23 Sep | 22 Sep | 22 Sep | 23 Sep | 23 Sep |
| December solstice 2027 | 22 Dec 02:42 | 21 Dec | 21 Dec | 21 Dec | 22 Dec | 22 Dec |
| March equinox 2028 | 20 Mar 02:17 | 19 Mar | 19 Mar | 19 Mar | 20 Mar | 20 Mar |
| June solstice 2028 | 20 Jun 20:02 | 20 Jun | 20 Jun | 20 Jun | 21 Jun | 21 Jun |
| September equinox 2028 | 22 Sep 11:45 | 22 Sep | 22 Sep | 22 Sep | 22 Sep | 22 Sep |
| December solstice 2028 | 21 Dec 08:19 | 21 Dec | 21 Dec | 20 Dec | 21 Dec | 21 Dec |
| March equinox 2029 | 20 Mar 08:02 | 20 Mar | 20 Mar | 19 Mar | 20 Mar | 20 Mar |
| June solstice 2029 | 21 Jun 01:48 | 20 Jun | 20 Jun | 20 Jun | 21 Jun | 21 Jun |
| September equinox 2029 | 22 Sep 17:38 | 22 Sep | 22 Sep | 22 Sep | 22 Sep | 23 Sep |
| December solstice 2029 | 21 Dec 14:14 | 21 Dec | 21 Dec | 21 Dec | 21 Dec | 22 Dec |
| March equinox 2030 | 20 Mar 13:52 | 20 Mar | 20 Mar | 20 Mar | 20 Mar | 21 Mar |
| June solstice 2030 | 21 Jun 07:31 | 21 Jun | 21 Jun | 20 Jun | 21 Jun | 21 Jun |
| September equinox 2030 | 22 Sep 23:27 | 22 Sep | 22 Sep | 22 Sep | 23 Sep | 23 Sep |
| December solstice 2030 | 21 Dec 20:09 | 21 Dec | 21 Dec | 21 Dec | 22 Dec | 22 Dec |

(Instants are my conversion of the USNO values, returned at a fixed UTC-5, to UTC; zone dates are my conversion with the IANA zone rules in Python's `zoneinfo`. Timeanddate's US page lists 23 Sep for 2027 and 19 Mar for 2028, matching the Eastern column. Counted by script: Eastern against Pacific 1 event, against Hawaii 5, against India 9; any of the three US zones differ for 5.)

The Southern Hemisphere has the opposite seasons. A parent in Sydney who ticks "first day of spring" must not be sent the March equinox. So the seasonal rows carry the event (March equinox and so on) and two names; the picker shows the northern names unless the parent has chosen a southern country in the optional country answer, and then it shows the southern names. Without a country answer, the row line says "northern hemisphere seasons" in small type and the parent can switch. No location services are used (direction 3.4). Which countries are southern is plain geography that `content` confirms; I did not read a source for it. This is a design need for D (section 8).

**Meteorological seasons** (1 Mar, 1 Jun, 1 Sep, 1 Dec; NOAA page read) are an alternative: whole-month, same everywhere, no time-zone problem. Recommended default is the astronomical day because that is what "first day of spring" means to a parent; the meteorological day is a second choice in the picker, not a duplicate card (FR-DAY-05).

### 3.5 Moving dates, authorities and "around"

- Every table row has an `authority`. The rows I read use: the Saudi Arabian calendar list (Islamic, Sunni-majority), Iran's list (Shia dates and Norooz), India's gazette list (Hindu, Sikh, Jain, Buddhist, Parsi, Christian days), Hebcal (Jewish), Thai, Singaporean and Korean lists (Buddhist), China (Lunar New Year and related days), and the Bahai World Centre calendar.
- Where authorities disagree for the same festival, the library ships both rows and the picker chooses by the tradition the parent picked and, if needed, one line: "Dates differ by country. Choose the one your family follows." The default is the first listed. This applies to: Eid al-Fitr, Eid al-Adha, Ramadan (Saudi 18 Feb 2026, Iran 19 Feb 2026), the Prophet's birthday (India's list 26 Aug 2026, Iran's 30 Aug 2026), Diwali (US-facing and India lists differ in 2027 and 2030 by a day), and Buddha's birthday and Vesak (see the Buddhist table).
- The picker shows "around 20 Mar" for every lunar day, and the day card after the tap shows "around today" for the same reason. The parent can move the date for that year (a one-year override) or for every year (an always override). The override is a parent-owned date and counts as the parent's own, like a typed day.
- Islamic, Jewish and Bahai days begin at sundown the evening before. The library schedules the morning of the daytime date. It never schedules by sunset: that needs a location, which we do not use.

### 3.6 Years that cannot be filled, and shipping

The lists I could read run 2026 to 2030 for most festivals and stop at 2027 for some (Vesak and Visakha Bucha in the Thai and Singapore lists, Vaisakhi, Guru Nanak Jayanti, the Prophet's birthday in India's list, Makha and Asalha Bucha, Baha'i holy days beyond 2026). Rule: ship only the years that a named authority has published. The data carries `years: [2026..2030]` per row. When a ticked day has no date for the coming year, the planner schedules nothing for it and the Days page shows one calm line: "{day}: the date for next year arrives with the next update." No count, no warning, no alarm. An app update (the app already updates its own text) refreshes the table. Recommended: ship the table inside the app bundle, as content, and refresh it at least once a year (FR-DAY-12). A downloadable pack (the `packs/` pattern) is not needed for 2 to 3 hundred small rows; the review of that choice is engineering's (section 10).

Where the loss of a date would matter most, in the last quarter, the data owner reviews the table each October for the next calendar year (a recurring ops task, FR-DAY-13).

### 3.7 Time of day

A library day's note fires in the morning, because by evening the day is mostly over. Default 09:00 local, the same value `BIRTHDAY_TIME` already uses in `planner.ts`. It is not the evening reminder time. It stays inside the 07:00 to 21:30 window (`planner.ts` lines 127 to 128). If the parent has narrowed the window, the time clamps into it (as built). Never time-sensitive. This is a default for founder ruling (Q-DAY-3).

### 3.8 Where it is asked and how it is browsed (restates the direction, no new design)

After the first kept letter, one card on Home, once, "Not now" as a full answer; then Me, "Notes and days", Days (R-IA-2, R-IA-5; Q-FD-2 pending). The Days page lists the parent's own typed days and the library as one list of ticked days, with "Add a day" and "Browse days". Browsing order: seasonal and shared, family, civic, then "Traditions" (only a parent who has named one, or who opens "Browse all", sees tradition days). Whatever a parent has named only changes which days are shown first (direction 3.4). Ticking is per day and across traditions: a household can tick Diwali and Christmas. The wording never says "your religion". The data design for the religion and country answer itself is `functions/cultural-background-data.md`.

---

## 4. The data: layers, days, dates 2026 to 2030, sources, uncertainty

How to read the tables. "Rule or authority" is the rule that computes the date, or the named list the date comes from. Year cells are the date a parent would see on a calendar, in the local calendar of the list's country; "n/r" is "not read" (section 1), never a guess. "Source" says what I read. "Uncertainty" says what could make the date wrong. A lunar or lunisolar day is always shown as "around" to the parent (3.5). Days that begin at sundown are shown on the daytime date the list gives (3.5). All sources were read on 20 Nov 2026.

Source shorthand: timeanddate = https://www.timeanddate.com/holidays/<country>/<year>; Hebcal = https://www.hebcal.com; USNO = https://aa.usno.navy.mil/api/seasons; 5 USC 6103 = https://www.law.cornell.edu/uscode/text/5/6103.

#### 4.1 Layer 1: seasonal and shared (religion-agnostic). Default: offered, parent ticks
| Day | Rule or authority | 2026 | 2027 | 2028 | 2029 | 2030 | Source | Uncertainty |
|---|---|---|---|---|---|---|---|---|
| New Year's Day | Jan 1 | Thu 1 Jan | Fri 1 Jan | Sat 1 Jan | Mon 1 Jan | Tue 1 Jan | 5 USC 6103 (read) | None |
| First day of spring | astro: March equinox, USNO instant, local date of the phone | 20 Mar | 20 Mar | 19 Mar | 19 or 20 Mar | 20 Mar | USNO API (read); section 3.4 table | Date depends on the phone's time zone. Ships as an instant, not a date. Southern hemisphere: the other season name (3.4) |
| First day of summer | astro: June solstice | 20 or 21 Jun | 21 Jun | 20 Jun | 20 Jun | 20 or 21 Jun | USNO API (read) | As above. Alternative: 1 Jun meteorological (NOAA, read) |
| First day of fall | astro: September equinox | 22 Sep | 22 or 23 Sep | 22 Sep | 22 Sep | 22 Sep | USNO API (read) | As above |
| First day of winter | astro: December solstice | 21 Dec | 21 Dec | 20 or 21 Dec | 21 Dec | 21 Dec | USNO API (read) | As above (20 Dec in Hawaii in 2028) |
| Independence Day (4 July) | Jul 4 | Sat 4 Jul | Sun 4 Jul | Tue 4 Jul | Wed 4 Jul | Thu 4 Jul | 5 USC 6103 (read) | None. When it falls on a weekend the federal day off moves; the date does not (the library does not use the day-off rule) |
| Labor Day | 1st Mon Sep | Mon 7 Sep | Mon 6 Sep | Mon 4 Sep | Mon 3 Sep | Mon 2 Sep | 5 USC 6103 (read) | None |
| Thanksgiving (US) | 4th Thu Nov | Thu 26 Nov | Thu 25 Nov | Thu 23 Nov | Thu 22 Nov | Thu 28 Nov | 5 USC 6103 (read) | None. US only; Canada's differs (not read) |
| Halloween (US) | Oct 31 | Sat 31 Oct | Sun 31 Oct | Tue 31 Oct | Wed 31 Oct | Thu 31 Oct | timeanddate US page (read) | None. Custom, no statute. Some families do not keep it for religious reasons: offered, never pre-ticked |
| New Year's Eve | Dec 31 | Thu 31 Dec | Fri 31 Dec | Sun 31 Dec | Mon 31 Dec | Tue 31 Dec | timeanddate US page (read) | None |
| First day of school season | The parent sets the date | the parent's | | | | | not a library row | This is a typed day (NS-18). The library only points to Add a day. Date from the parent, never from a school calendar |

In the four season rows, "20 or 21" means the local date differs between Eastern, Pacific and Hawaii time (US zones only; section 3.4 has every zone). The data stores the instant, not these dates.

#### 4.2 Layer 2: family and parent days. Default: offered, parent ticks, wording never presumes who the grown-ups are
| Day | Rule or authority | 2026 | 2027 | 2028 | 2029 | 2030 | Source | Uncertainty |
|---|---|---|---|---|---|---|---|---|
| Mother's Day (US) | 2nd Sun May (matches every date read) | Sun 10 May | Sun 9 May | Sun 14 May | Sun 13 May | Sun 12 May | timeanddate US page (read) | Rule, not statute, read. Date differs by country: Mexico fixed 10 May, Thailand 12 Aug (tables on those country pages). A parent outside the US can move it |
| Father's Day (US) | 3rd Sun Jun | Sun 21 Jun | Sun 20 Jun | Sun 18 Jun | Sun 17 Jun | Sun 16 Jun | 36 USC 109 (read) | Also 3rd Sunday in June on the India, Singapore, Sri Lanka and Mexico lists (read) |
| Grandparents' Day (US) | Sunday after Labor Day | Sun 13 Sep | Sun 12 Sep | Sun 10 Sep | Sun 9 Sep | Sun 8 Sep | timeanddate US page (read) | Rule matches all five years; statute not read. Not all countries keep it |
| Siblings Day | Apr 10 | Fri 10 Apr | Sat 10 Apr | Mon 10 Apr | Tue 10 Apr | Wed 10 Apr | siblingsday.org (read) | Not federal; a foundation's day (1995). Offered because the founder named it |
| Valentine's Day | Feb 14 | Sat 14 Feb | Sun 14 Feb | Mon 14 Feb | Wed 14 Feb | Thu 14 Feb | timeanddate US page (read) | None. Wording must not assume a partner (5.2) |

#### 4.3 Layer 3: civic and commemorative. Default: offered, parent ticks. Memorial Day and Veterans Day: Karma ruling R-FD-3 (section 11)
| Day | Rule or authority | 2026 | 2027 | 2028 | 2029 | 2030 | Source | Uncertainty |
|---|---|---|---|---|---|---|---|---|
| Martin Luther King Jr. Day | 3rd Mon Jan | Mon 19 Jan | Mon 18 Jan | Mon 17 Jan | Mon 15 Jan | Mon 21 Jan | 5 USC 6103 (read) | None |
| Presidents' Day | 3rd Mon Feb | Mon 16 Feb | Mon 15 Feb | Mon 21 Feb | Mon 19 Feb | Mon 18 Feb | 5 USC 6103 (read; the statute's name is Washington's Birthday) | None |
| Memorial Day | last Mon May | Mon 25 May | Mon 31 May | Mon 29 May | Mon 28 May | Mon 27 May | 5 USC 6103 (read) | None. Tone `quiet` (5.3) |
| Juneteenth | Jun 19 | Fri 19 Jun | Sat 19 Jun | Mon 19 Jun | Tue 19 Jun | Wed 19 Jun | 5 USC 6103 (read; statute name Juneteenth National Independence Day) | None |
| Veterans Day | Nov 11 | Wed 11 Nov | Thu 11 Nov | Sat 11 Nov | Sun 11 Nov | Mon 11 Nov | 5 USC 6103 (read) | None. Tone `quiet` |

Columbus Day (second Monday in October, statute read) is not offered; see the exclusion list (section 6).
#### 4.4 Layer 4: traditions, by size (Pew 2020), each with its major days. Default: offered after a parent names a tradition or opens Browse all; parent ticks; parent can add or move any date

Order of the groups below follows Pew's 2020 sizes (section 1): Christians 28.8% (2.3 billion), Muslims 25.6%, Hindus 14.9% (1.2 billion), Buddhists 4.1% (324 million), then Jews (14.8 million, about 0.2%) and the other religions combined (2.2%: Baha'is, Daoists, Jains, Sikhs, Shintoists, folk religions and others). The 1.9 billion religiously unaffiliated (24.2%) are not a tradition with days: they are served by layers 1 to 3 and by "None of these". Pew does not size Sikhs, Jains or Baha'is separately in what I read, so they are placed by judgement after the five sized groups (the `tradition` field is not ordered by a size I did not read). "n/r" is not read, never a guess.

**Christian (Western calendar)**
| Day | Rule or authority | 2026 | 2027 | 2028 | 2029 | 2030 | Source | Uncertainty |
|---|---|---|---|---|---|---|---|---|
| Christmas Day | Dec 25 | 25 Dec | 25 Dec | 25 Dec | 25 Dec | 25 Dec | 5 USC 6103 (read) | None |
| Epiphany | Jan 6 | Jan 6 | Jan 6 | Jan 6 | Jan 6 | Jan 6 | timeanddate US page (read) | None. Some traditions mark it on a nearby Sunday (not read) |
| Ash Wednesday | 46 days before Easter (the list is consistent with this in all five years, my check) | Feb 18 | Feb 10 | Mar 1 | Feb 14 | Mar 6 | timeanddate US page (read) | Follows Easter |
| Palm Sunday | Sunday before Easter | Mar 29 | Mar 21 | Apr 9 | Mar 25 | Apr 14 | timeanddate US page (read) | Follows Easter |
| Good Friday | Friday before Easter | Apr 3 | Mar 26 | Apr 14 | Mar 30 | Apr 19 | timeanddate US and India pages (read) | Follows Easter. Tone `quiet`. See 5.3 |
| Easter Sunday | Western computus; the list matches my own computation for all five years | Apr 5 | Mar 28 | Apr 16 | Apr 1 | Apr 21 | timeanddate US page (read) | Two churches, two dates (next group). No moon sighting |
| Pentecost | 49 days after Easter (consistent in all five years, my check) | May 24 | May 16 | Jun 4 | May 20 | Jun 9 | timeanddate US page (read) | Follows Easter |

**Christian (Orthodox calendars)**
| Day | Rule or authority | 2026 | 2027 | 2028 | 2029 | 2030 | Source | Uncertainty |
|---|---|---|---|---|---|---|---|---|
| Christmas (Orthodox) | Jan 7 | Jan 7 | Jan 7 | Jan 7 | Jan 7 | Jan 7 | timeanddate US page (read) | Churches on the Julian calendar. Not every Orthodox church; some keep Dec 25 |
| Orthodox Easter | Julian computus; Greece, Romania, Ukraine and Ethiopia pages agree | Apr 12 | May 2 | Apr 16 | Apr 8 | Apr 28 | timeanddate pages for Greece, Romania, Ukraine, Ethiopia (read); my computation matches | Same day as Western Easter in 2028 (16 Apr) |

**Muslim**
| Day | Rule or authority | 2026 | 2027 | 2028 | 2029 | 2030 | Source | Uncertainty |
|---|---|---|---|---|---|---|---|---|
| Ramadan begins (Saudi list) | Saudi list; moon sighting | Feb 18 | Feb 8 | Jan 28 | Jan 16 | Jan 6 | timeanddate Saudi page (read, "Tentative Date" from 2027) | One-day error possible; the Iran list differs by a day in 2026 (19 Feb). In 2030 Ramadan begins twice (6 Jan and 26 Dec) |
| Eid al-Fitr (Saudi list) | Saudi list | Mar 20 | Mar 10 | Feb 27 | Feb 15 | Feb 5 | timeanddate Saudi page (read) | Moon sighting. Begins at sundown the day before |
| Eid al-Fitr (Iran list) | Iran list | Mar 21 | Mar 10 | Feb 27 | Feb 15 | Feb 4 | timeanddate Iran page (read) | Differs from the Saudi list on 21 Mar and 4 Feb |
| Eid al-Adha (Saudi list) | Saudi list | May 27 | May 16 | May 5 | Apr 24 | Apr 13 | timeanddate Saudi page (read) | Differs from the US list in 2027 (US 17 May) and 2030 (US 14 Apr). Day before is Arafat Day |
| Islamic New Year (Muharram) | Saudi list | Jun 16 | Jun 6 | May 25 | May 15 | May 4 | timeanddate Saudi page (read) | Moon sighting |
| Prophet's birthday, India list (Sunni) | India list | Aug 26 | Aug 15 | n/r | n/r | n/r | timeanddate India page (read) | Years 2028 to 2030 n/r. Not kept by all Muslims; offered, not stressed |
| Prophet's birthday, Iran list (17 Rabi al-awwal) | Iran list | Aug 30 | Aug 20 | Aug 9 | Jul 29 | Jul 19 | timeanddate Iran page (read) | A different day from the Sunni list by 4 days in 2026. Tentative |

Lailat al-Qadr and the days of Ramadan are not offered in version 1: the days are inside a month of observance whose family practice varies and which the library does not want to flatten into one date. Ashura is excluded (section 6). A family can add any of these as its own typed day.

**Hindu**
| Day | Rule or authority | 2026 | 2027 | 2028 | 2029 | 2030 | Source | Uncertainty |
|---|---|---|---|---|---|---|---|---|
| Makar Sankranti | Solar, near 14 Jan | Jan 14 | Jan 14 | Jan 15 | Jan 14 | Jan 14 | timeanddate India page (read) | Same date as Pongal in most years; Pongal is a regional festival |
| Pongal | India list (regional) | Jan 14 | Jan 15 | Jan 15 | Jan 14 | Jan 14 | timeanddate India page (read) | Solar; one day later than Makar Sankranti in 2027 |
| Maha Shivaratri | India list | Feb 15 | Mar 6 | Feb 23 | Feb 11 | Mar 2 | timeanddate India page (read) | Lunar. Regional variants not read |
| Holi | India list | Mar 4 | Mar 22 | Mar 11 | Mar 1 | Mar 20 | timeanddate India page (read) | Lunar. The day before (Holika Dahan) not read |
| Ugadi | India list | Mar 19 | Apr 7 | Mar 27 | Apr 14 | Apr 3 | timeanddate India page (read) | Lunar; Gudi Padwa the same day in the 2028 list |
| Rama Navami | India list | Mar 26 | Apr 15 | Apr 3 | Apr 22 | Apr 12 | timeanddate India page (read) | Lunar |
| Raksha Bandhan | India list | Aug 28 | Aug 17 | Aug 5 | Aug 23 | Aug 13 | timeanddate India page (read) | Lunar. Wording must not presume a brother or sister (5.2) |
| Janmashtami | India list (the Smarta date is the same in each year read) | Sep 4 | Aug 25 | Aug 13 | Sep 1 | Aug 21 | timeanddate India page (read) | Lunar. The India list also shows a Smarta date, the same in each year read |
| Ganesh Chaturthi | India list | Sep 14 | Sep 4 | Aug 23 | Sep 11 | Sep 1 | timeanddate India page (read) | Lunar |
| Onam | India list (Kerala) | Aug 26 | Sep 12 | Sep 1 | Aug 22 | Sep 9 | timeanddate India page (read) | Regional |
| Navratri, first day | India list | Oct 11 | Sep 30 | Sep 19 | Oct 8 | Sep 28 | timeanddate India page (read) | Lunar |
| Dussehra | India list | Oct 20 | Oct 9 | Sep 27 | Oct 16 | Oct 6 | timeanddate India page (read) | Lunar |
| Diwali (India list) | India gazette | Nov 8 | Oct 29 | Oct 17 | Nov 5 | Oct 26 | timeanddate India page (read) | Lunar. Differs from the US-facing list by one day in 2027 and 2030 |
| Diwali (US-facing list) | US-facing list (California and Pennsylvania legal holiday, Connecticut and North Carolina observance, as listed there) | Nov 8 | Oct 28 | Oct 17 | Nov 5 | Oct 25 | timeanddate US page (read) | Lunar. 28 Oct 2027 and 25 Oct 2030 against the India list's 29 Oct and 26 Oct |

Diwali is also kept by many Sikhs and Jains (Bandi Chhor Divas, Mahavira's moksha). The library stores one Diwali day with its two dates and does not tag it as Hindu on the phone (the `tradition` field is a way to order the list, not something the phone keeps about the parent).

**Buddhist**
| Day | Rule or authority | 2026 | 2027 | 2028 | 2029 | 2030 | Source | Uncertainty |
|---|---|---|---|---|---|---|---|---|
| Vesak, Singapore and Malaysia list | Singapore list (Malaysia's agrees in 2026 and 2027) | May 31 | May 20 | n/r | n/r | n/r | timeanddate Singapore and Malaysia pages (read) | Years 2028 to 2030 n/r. Lunar |
| Visakha Bucha, Thai list | Thai list | May 31 | May 20 | n/r | n/r | n/r | timeanddate Thailand page (read) | Years 2028 to 2030 n/r |
| Buddha Purnima, India list | India list | May 1 | May 20 | n/r | n/r | n/r | timeanddate India page (read) | 1 May 2026 against 31 May elsewhere: a different full moon. Years 2028 to 2030 n/r |
| Buddha's Birthday, Korean list | Korean list | May 24 | May 13 | May 2 | May 20 | May 9 | timeanddate South Korea page (read) | A different calendar from Vesak; five years read |
| Vesak Full Moon Poya, Sri Lankan list | Sri Lanka list | May 30 | May 19 | n/r | n/r | n/r | timeanddate Sri Lanka page (read) | Poya days fall every full moon; only Vesak is shown. Years beyond 2027 n/r |
| Makha Bucha, Thai list | Thai list | Mar 3 | Feb 21 | n/r | n/r | n/r | timeanddate Thailand page (read) | Years 2028 to 2030 n/r |
| Asalha Bucha, Thai list | Thai list | Jul 29 | Jul 18 | n/r | n/r | n/r | timeanddate Thailand page (read) | Years 2028 to 2030 n/r |
| Songkran (Thai New Year) | Fixed 13 to 15 Apr | Apr 13 | Apr 13 | Apr 13 | Apr 13 | Apr 13 | timeanddate Thailand page (read) | Fixed. Shown as 13 Apr; Thai cultural more than a Buddhist day. Observed days vary when it falls on a weekend; the library uses 13 Apr |

The Buddha's birthday has four different dates in 2026 (1 May India, 24 May Korea, 30 May Sri Lanka, 31 May Singapore and Thailand). The library does not pick one. The picker asks "Which calendar does your family follow?" with the lists above as choices, and says nothing about which is right.

**Jewish**
| Day | Rule or authority | 2026 | 2027 | 2028 | 2029 | 2030 | Source | Uncertainty |
|---|---|---|---|---|---|---|---|---|
| Rosh Hashana | Hebcal, Diaspora | Sep 12 | Oct 2 | Sep 21 | Sep 10 | Sep 28 | Hebcal JSON (read); timeanddate agrees | Begins at sundown the evening before. Two days |
| Yom Kippur | Hebcal | Sep 21 | Oct 11 | Sep 30 | Sep 19 | Oct 7 | Hebcal (read) | Begins at sundown. Tone `quiet` (5.3) |
| Sukkot, first day | Hebcal | Sep 26 | Oct 16 | Oct 5 | Sep 24 | Oct 12 | Hebcal (read) | Begins at sundown |
| Simchat Torah (Diaspora) | Hebcal | Oct 4 | Oct 24 | Oct 13 | Oct 2 | Oct 20 | Hebcal (read) | Diaspora schedule shown; the Israel schedule was not read |
| Hanukkah, first candle | Hebcal, first-candle date | Dec 4 | Dec 24 | Dec 12 | Dec 1 | Dec 20 | Hebcal (read; "begins at sundown on Friday, 4 December 2026") | The first candle is lit that evening; the first full day is the next date (timeanddate lists 5 Dec 2026). The library sends in the morning of the first-candle date |
| Tu BiShvat | Hebcal | Feb 2 | Jan 23 | Feb 12 | Jan 31 | Jan 19 | Hebcal (read) | None beyond sundown |
| Purim | Hebcal | Mar 3 | Mar 23 | Mar 12 | Mar 1 | Mar 19 | Hebcal (read) | 2027 and 2030 also have Purim Katan in the earlier month (not offered) |
| Passover, first day | Hebcal | Apr 2 | Apr 22 | Apr 11 | Mar 31 | Apr 18 | Hebcal (read) | Begins at sundown the evening before. Diaspora second day follows |
| Shavuot, first day | Hebcal | May 22 | Jun 11 | May 31 | May 20 | Jun 7 | Hebcal (read) | Begins at sundown |

Tisha B'Av (a fast of mourning) is excluded (section 6). Jewish days follow a calculated calendar, not a sighting, so "around" is not needed for them; the "begins at sundown" note is.

**Sikh, Jain, Baha'i, Zoroastrian (Parsi), and culture-led days**
| Day | Rule or authority | 2026 | 2027 | 2028 | 2029 | 2030 | Source | Uncertainty |
|---|---|---|---|---|---|---|---|---|
| Vaisakhi | Solar, 14 Apr in the years read | Apr 14 | Apr 14 | n/r | n/r | n/r | timeanddate India page (read) | Years 2028 to 2030 n/r. Some years 13 Apr (not read) |
| Guru Nanak Gurpurab | India gazette | Nov 24 | Nov 14 | n/r | n/r | n/r | timeanddate India page (read) | Lunar. 2028 to 2030 n/r. SGPC not read |
| Mahavir Jayanti (Jain) | India gazette | Mar 31 | Apr 19 | Apr 7 | Apr 26 | Apr 16 | timeanddate India page (read) | Lunar. Jain bodies not read |
| Naw-Ruz (Baha'i New Year) | Vernal equinox, Tehran reckoning (from the Baha'i calendar) | 21 Mar | n/r | n/r | n/r | n/r | bahai.org calendar (read, one year shown) | Begins at sunset the evening before. 2027 to 2030 n/r |
| Ridvan, first day | Baha'i calendar | 21 Apr | n/r | n/r | n/r | n/r | bahai.org (read) | The calendar page says holy days are fixed in the solar calendar, but the later years were not read, so n/r |
| Parsi New Year | India list | Aug 15 | Aug 15 | n/r | n/r | n/r | timeanddate India page (read) | Regional lists differ (Shahenshahi, Kadmi, Fasli not read) |
| Lunar New Year | China list. Korea's Seollal and Vietnam's Tet were read but not reconciled with it, so only China's list is shipped | Feb 17 | Feb 6 | Jan 26 | Feb 13 | Feb 3 | timeanddate China page (read) | Lunar. Not a religion: a culture-led day. Per-country lists may differ by a day (not reconciled) |
| Lantern Festival | China list (15th day of the first month) | Mar 3 | Feb 20 | Feb 9 | Feb 27 | Feb 17 | timeanddate China page (read) | None beyond the lunar calendar |
| Dragon Boat Festival | China list | Jun 19 | Jun 9 | May 28 | Jun 16 | Jun 5 | timeanddate China page (read) | Lunar |
| Mid-Autumn Festival (Chuseok in Korea) | China list; Korea's Chuseok falls on the same date each year read | Sep 25 | Sep 15 | Oct 3 | Sep 22 | Sep 12 | timeanddate China and South Korea pages (read) | Lunar |
| Norooz (Persian New Year) | Iran list; tied to the March equinox | Mar 21 | n/r | n/r | n/r | n/r | timeanddate Iran page (read) | 2027 to 2030 n/r. Observed also as Nowruz in many countries (not read) |
| Kwanzaa, first day | Dec 26 | 26 Dec | 26 Dec | 26 Dec | 26 Dec | 26 Dec | timeanddate US page (read) | A cultural holiday, not a religion |
#### 4.5 Culture and national days (a chosen country), proposed for a later release

The direction (3.2, 3.4) offers "national days for a chosen country", used only for days the parent picks, with the optional country answer. I read these fixed national days on the 2027 timeanddate pages. I did not read any national authority. Which countries ship is a founder question (Q-DAY-4); countries I did not read (for example Pakistan, the Philippines, Nigeria, Brazil, the United Kingdom, Canada) are `n/r` and none is offered by default.

| Country | Day | Date | Note |
|---|---|---|---|
| India | Republic Day | Jan 26 | Gazetted holiday (read) |
| India | Independence Day | Aug 15 | Gazetted holiday (read) |
| India | Mahatma Gandhi Jayanti | Oct 2 | Gazetted holiday (read) |
| Mexico | Independence Day | Sep 16 | National holiday (read). Mexico's Mother's Day is fixed on 10 May on that list |
| China | National Day | Oct 1 | National holiday (read); Children's Day Jun 1 (optional holiday list) |
| Japan | National Foundation Day | Feb 11 | National holiday (read); Children's Day May 5, Culture Day Nov 3 |
| South Korea | Independence Movement Day | Mar 1 | National holiday (read); Children's Day May 5, Liberation Day Aug 15, National Foundation Day Oct 3 |
| Singapore | National Day | Aug 9 | National holiday (read) |
| Indonesia | Independence Day | Aug 17 | Public holiday (read) |
| Sri Lanka | National Day | Feb 4 | Public holiday (read) |

Some national days remember a war, a partition or a loss. The library does not choose which to offer for a country on its own: a parent who picked a country sees the list and ticks. The wording is the day's name only (5.3, tone `quiet` for any day whose name refers to a war or a lost life). Dates are per country and do not follow the US rules; the same day ("Mother's Day", "Children's Day") has a different date in different countries.

#### 4.6 Size of the library in this draft

Counting distinct days (an authority variant is one day with two or more date rows): seasonal and shared 10, family 5, civic 5, Christian 9, Muslim 5, Hindu 13, Buddhist 4, Jewish 9, Sikh, Jain, Baha'i, Parsi and culture-led 12. That is 72 days, plus the national days in 4.5 if a country list ships. About 120 date rows (a day with authority variants has several). A day needs about 4 note variants (direction 4.3) and a season 3, so about 290 strings for the first release, not 8 to 12 per day. Ruling N-1 in `GAP-LOG.md` applies the founder's 8 to 12 to "the day, season and last-letter layers"; for a day that comes once a year, 4 variants give four years without a repeat, so I recommend 4 per day and 3 per season (Q-DAY-7, for Karma to reconcile with brief 2).

#### 4.7 Days that are not in the tables on purpose

Lailat al-Qadr, the days of Lent and Ramadan other than their start, Ashura, Tisha B'Av, Columbus Day, Gold Star Mother's Day, Qingming, Obon, Day of the Dead, Cinco de Mayo and Groundhog Day: see section 6 for why each is out or how it is handled.

#### 4.8 Real date clashes in 2026 to 2030, from the tables above (my script over the rows in this section)

Two ticked days on one date become one notification that names both after the tap (3.3). Cases found, two days each:

| Date | Days |
|---|---|
| 14 Jan 2026, 15 Jan 2028, 14 Jan 2029, 14 Jan 2030 | Makar Sankranti and Pongal (regional) |
| 18 Feb 2026 | Ash Wednesday and Ramadan begins (Saudi list) |
| 24 May 2026, 20 May 2029 | Pentecost and Buddha's Birthday (Korean list) |
| 19 Jun 2026 | Juneteenth and Dragon Boat Festival |
| 12 Sep 2027 | Grandparents' Day and Onam |
| 16 May 2027 | Pentecost and Eid al-Adha (Saudi list) |
| 4 Jun 2028 | Pentecost and Ashura (excluded; shown only as a data fact) |
| 14 Feb 2029 | Valentine's Day and Ash Wednesday |
| 6 Jan 2030 | Epiphany and Ramadan begins (Saudi list) |
| 13 Apr 2030 | Eid al-Adha (Saudi list) and Songkran |

Same-festival rows from two authorities (Mid-Autumn and Chuseok, Vesak and Visakha Bucha) are one day with two date rows and never clash with themselves.

---

## 5. The lock-screen title rule, and wording that never presumes the family

### 5.1 Lock-screen rule (binds rulings N-3 and N-7, NS-32 R11 to R13, NS-13 R5 and R6)

A passer-by who sees a phone must not learn a family's make-up, belief or origin. One rule, tested by a snapshot of every key:

| Layer of the day | Lock-screen title, "Names in notifications" off (the default) | Lock-screen title, names on | Body |
|---|---|---|---|
| Seasonal and shared; civic | May be the day's name (public days; N-3) | The day's name | Neutral: no child name, no letter words, no count |
| Family and parent days | The neutral title: "A day you wanted to remember" (the typed-day key already designed in `WORDS.md`) | The day's name | Neutral; "Tap to see the day you chose." |
| Traditions, culture-led and national days | The neutral title | The day's name | Neutral |
| A day the parent typed (NS-18) | As NS-18 R3 already rules | As NS-18 | As NS-18 |

Further rules:

1. The single "Names in notifications" switch (N-7) covers the day's name too. There is no separate switch for faith days. Whether a tradition day's name may appear even when the switch is on, or whether it needs a second explicit line ("This can show your family's faith to anyone who sees the screen"), is a privacy and counsel question (Q-DAY-6; default: one switch, one plain line under it).
2. With App lock on, a day's name never shows on the lock screen, whatever the switch says (as NS-13 and D-S10 already rule for child names).
3. iOS "Show Previews" set to Never or When Unlocked shows the category placeholder; the app cannot change it (NS-32 section 5).
4. The tradition name is never in a title or a body. "Diwali" can be a day's name; "a Hindu day" never appears anywhere. The field `tradition` in the data (3.1) is for ordering the picker; no code path may write it to a notification, a log, an analytics event or a crash report.
5. No greeting: not "Happy Diwali", "Eid Mubarak" or "Merry Christmas". A greeting belongs to a community and speaking it for the app presumes belief and risks error. The app says the day's name and invites.
6. The landing (D-S11) shows the day's name and one line above the prompt, the way a typed day shows the parent's words; one more tap starts speaking.

### 5.2 Wording that never presumes the family's make-up

Rules every key in the days family follows. `content` checks each in the rules test (FR-DAY-10).

1. **The name only.** A day is named as families commonly name it. No "your" before a day or a tradition: "Diwali", not "your Diwali".
2. **No relationship words after the name.** The name of Mother's Day carries "mother"; the line after it never says "your mother", "your mum", "Dad", "your husband", "your wife", "your partner", "your other half".
3. **Address whoever is holding the phone.** One universal invitation for family days: "Anything you would like {child} to hear about today?" It fits two mothers, a single father, a grandparent who is raising {child}, and a parent who has lost their own mother, without naming any of them.
4. **No presence assumed.** Never "gather", "around the table", "with your family", "together", "who was there", "who called".
5. **No belief asserted or explained.** The app does not say what a day means, who it is for, or how it is kept. No "festival of lights". No "celebrate" (a parent may only mark it); the verb in the picker is "mark".
6. **No loss, ending or absence** (VOICE no-guilt and legacy rules; fear pattern at `rules.test.ts:182`). Memorial Day and Veterans Day are the name only (5.3).
7. **No counts or comparison.** Not "your third Eid", "another year", "the first Thanksgiving for {child}" (a first is for the parent to say, in their own words).
8. **No exclamation marks** (N-5: zero), no emoji, no em or en dashes, no curly quotes, no ellipsis characters (CLAUDE.md content rules).
9. **`{child}` never gendered**; no "he", "she", "son", "daughter" (BRAND.md glossary).
10. **Never imply the app wrote anything**: no "we thought of you today" and no "we have a prompt for the day". The app invites; the words are the parent's.
11. **No certainty about a moving date.** On the lock screen the body says nothing of the date. In the app the day is "around today" for any day with `precision: about`.
12. **No fear of getting it wrong.** The library never says "check with your community" or "dates may be wrong" in a notification; the "around" line in the picker is the one place that says so (calmly).

### 5.3 Tone: `bright` and `quiet`

| Tone | When | Landing line (intent; `content` finalises under VOICE.md) |
|---|---|---|
| `bright` | Most days | "{day}. Anything you would like {child} to hear about today?" for family, tradition, culture and national days; for a season: "{season}. What does today look like?" |
| `quiet` | Memorial Day, Veterans Day, Good Friday, Yom Kippur, and any national day whose name refers to a war or a lost life | "{day}. The book is open if you want it." No question mark, no prompt, no "remember" |

Tone is a field in the data (`tone`), set by `content` and reviewed by the founder; a parent cannot change it, and the planner treats both the same.

### 5.4 Samples (intent, for `content` and design; not live)

Lengths follow D-S10: title at most 40 characters and body at most 110. Names-off forms never carry `{child}`.

| Day (layer) | Lock title, names off | Lock title, names on | Lock body | Landing |
|---|---|---|---|---|
| Thanksgiving (seasonal) | Thanksgiving | Thanksgiving | A few words about today, for the book? | Thanksgiving. Anything you would like {child} to hear about today? |
| First day of spring (seasonal) | First day of spring | First day of spring | Anything you noticed today? | First day of spring. What does today look like? |
| 4 July (seasonal) | Independence Day | Independence Day | A few words about today, for the book? | Independence Day. What does today look like? |
| Mother's Day (family) | A day you wanted to remember | Mother's Day | Tap to see the day you chose. | Mother's Day. Anything you would like {child} to hear about today? |
| Father's Day (family) | A day you wanted to remember | Father's Day | Tap to see the day you chose. | Father's Day. Anything you would like {child} to hear about today? |
| Grandparents' Day (family) | A day you wanted to remember | Grandparents' Day | Tap to see the day you chose. | Grandparents' Day. Anything you would like {child} to hear about today? |
| Juneteenth (civic) | Juneteenth | Juneteenth | A few words about today, for the book? | Juneteenth. Anything you would like {child} to hear about today? |
| Memorial Day (civic, quiet) | Memorial Day | Memorial Day | The book is open if you want it. | Memorial Day. The book is open if you want it. |
| Diwali (tradition) | A day you wanted to remember | Diwali | Tap to see the day you chose. | Diwali, around today. Anything you would like {child} to hear about today? |
| Eid al-Fitr (tradition) | A day you wanted to remember | Eid al-Fitr | Tap to see the day you chose. | Eid al-Fitr, around today. Anything you would like {child} to hear about today? |
| Hanukkah (tradition; calculated) | A day you wanted to remember | Hanukkah | Tap to see the day you chose. | Hanukkah. Anything you would like {child} to hear about today? |
| Easter (tradition) | A day you wanted to remember | Easter | Tap to see the day you chose. | Easter. Anything you would like {child} to hear about today? |
| Good Friday (tradition, quiet) | A day you wanted to remember | Good Friday | Tap to see the day you chose. | Good Friday. The book is open if you want it. |
| Lunar New Year (culture) | A day you wanted to remember | Lunar New Year | Tap to see the day you chose. | Lunar New Year, around today. Anything you would like {child} to hear about today? |
| Two ticked days on one date | A day you wanted to remember | Both names, joined by "and" | Tap to see the days you chose. | Both names, then the line above once |

Checked by eye: every line is ASCII; none has an exclamation mark; none uses a word in the fear pattern at `rules.test.ts:182`; none names a gender, a count, a belief or a relationship; the landing for family days is the same universal line. "Around today" appears only where the data says `precision: about`; Hanukkah is calculated, so it does not.

---

## 6. Exclusion list, with reasons

A day is out when it is about death or mourning (the no-loss rule), when its name is contested and no single name is fair, when it is commercial, political or a statement about a place's history, or when it is a private family day better kept as the parent's own typed day. A family that keeps any of these adds it as a typed day, in its own words (NS-18): the library never tells a family that a day is missing, and never says "we do not have X".

| Day | Why out | Evidence |
|---|---|---|
| Gold Star Mother's Day (last Sunday in September) | Bereavement; the no-loss rule | 36 USC 111 (read) |
| Ashura | A day of mourning for many Muslims; the dates also differ by tradition | Dates read (Iran list 25 Jun 2026); the day's meaning is general knowledge, not a source read |
| Tisha B'Av | A fast of mourning | In Hebcal's list (read: 23 Jul 2026); meaning is general knowledge |
| Day of the Dead, Obon, Qingming (Tomb Sweeping Day), All Souls and other days for the dead | Centred on death; a family that keeps one adds it as its own day | Qingming dates read for Hong Kong (4 or 5 Apr in the years read); meanings general knowledge |
| Columbus Day / Indigenous Peoples' Day (second Monday in October) | Contested name with no neutral one. The statute says Columbus Day; 22 US states list Columbus Day as a state holiday and 28 list Indigenous Peoples' Day as an observance (the same date) | 5 USC 6103; timeanddate US page (read, 12 Oct 2026) |
| Cinco de Mayo | Listed as an observance only, on the US page and on Mexico's own list; Mexico's national day is 16 Sep, offered under national days | timeanddate Mexico and US pages (read) |
| Patriot Day, Pearl Harbor Day, other remembrance days of attacks and wars | Loss and fear; not read for dates | Excluded on the rule, no source read |
| Yom HaShoah, Holocaust and genocide remembrance days | Loss | Excluded on the rule, no source read |
| Groundhog Day, April Fools' Day, "fun" days | Low value for a family book and not a day a family would call its own; revisit if research (brief 6) finds demand | timeanddate lists Groundhog Day as an observance (read) |
| Flag Day, Patriots' Day (Maine, Massachusetts), state-only days | Rarely marked; state-only | timeanddate US page (read) |
| Black Friday, Cyber Monday, Small Business Saturday | Commercial; they push spending, against the product's calm | General knowledge |
| Election Day and any political observance | Political | General knowledge |
| Daylight saving time starts and ends | Not a day to tell a child about | timeanddate US page lists 8 Mar and 1 Nov 2026 (read) |
| Any day of a religion that asks that its days not be marked by outsiders | A rule the library cannot judge; the parent's own typed day covers it | General knowledge; counsel and cultural review (Q-DAY-9) |
| Lailat al-Qadr, Lent, the days within Ramadan, Passover's later days | Inside a period of practice whose family customs vary; one date would flatten them. Their starting day is offered | Lailat al-Qadr date read (US page, 15 Mar 2026) |
| A child's baptism, naming ceremony, Bar or Bat Mitzvah, first communion, a wedding anniversary | Personal days, not library days; the parent's own typed day or a birthday-style day | Direction 3.1 (the parent's own date) |

Mother's Day, Father's Day, Memorial Day and Veterans Day are not excluded. They are offered, never pre-ticked (Q-FD-3), with the wording rules in 5.2 and the tone in 5.3. R-FD-3 is the Karma ruling on Memorial Day and Veterans Day; my recommendation is in section 11.

---

## 7. How the data is kept true (regulatory-affairs view)

- **A named source per row, and a licence per source.** I read these pages as a reader. I did not read the terms of use or licence of timeanddate, Hebcal, the Naval Observatory or the Baha'i World Centre. Facts like a date are generally not protectable, but a compiled table of dates may be, and a bulk copy of a commercial site's list is the risk. **Counsel must confirm** before the tables ship (FR-DAY-23). The safer design is to compute what a rule computes (every rule-based row, Western and Orthodox Easter by the computus, the astronomical instants from the Naval Observatory's public service) and to take only the moon-sighting and lunisolar dates from an authority whose terms allow it, citing it in the data.
- **Authorities, not aggregators.** Where I could, the shipped source should be the body that sets the date (the Saudi list's own authority for Islamic days in that country, a national gazette for India, the Baha'i World Centre, Hebcal's calculated calendar for Jewish days). I read an aggregator for most rows. The primary body for each lunar festival must be named and read before ship; today only the Naval Observatory, the statutes, the Baha'i World Centre page, the Siblings Day Foundation and Hebcal are primary or near-primary among what I read (section 1).
- **Annual review.** A named owner re-reads every table row in October for the next year, records the date and the source, and the test fails the build if a ticked-eligible row has a past-year date with no next year (FR-DAY-13). Tentative dates (Islamic dates from 2027 in the lists read) are re-read when the authority announces, each year.
- **A wrong date is a product defect.** A parent who is sent a note on the wrong day, or whose tradition's day is a day off, is the failure mode with the highest cost to trust. The mitigations are the "around" wording, the parent's own override, and no claim on the lock screen. Support gets a macro (FR-DAY-21).
- **Do not claim coverage.** No store page, website or in-app line says "all religions", "every holiday" or "the right date" (FR-DAY-22).

---

## 8. Function requirements (FR-DAY-nn)

Sections of this file against the BRIEF's seven: 1 reviewed (section 1); 2 coverage (section 2); 3 requirements (this section); 4 design needs (section 9); 5 card changes (section 10); 6 engineering needs (section 11); 7 founder and counsel questions (section 12). The proposed card NS-46 is section 13.

Priority: P0 needs an RR-4 reason: (a) promise, (b) legal or store, (c) core loop. Owner lane: `content` (C), `mobile` (M), `regulatory-affairs` (R), `privacy` (P), `ops` (O), `support` (S), `marketing` (K), `design-systems` (D). Links: card rows (`NS-nn-Rn`, or "new row needed" under proposed NS-46), e2e ids, backlog rows (no BL above BL-999; "new row needed" with an NR-DAY id).

| Id | Requirement | Links | Priority | Owner | Evidence or source |
|---|---|---|---|---|---|
| FR-DAY-01 | The days live in `packages/content/src/days/` as data rows with the fields in 3.1. Given the build, When tests run, Then every row has `id`, `layer`, `nameKey`, a rule or a table, an `authority` for each table row, `precision`, `tone`, `publicTitleOk`, and `preTicked: false`, and every table cell is a date or `n/r`. | NS-46-R1 (new row needed); NS-18 section 3; e2e: n/a (data); BL: new row needed (NR-DAY-01) | P1 | C | Section 3.1 |
| FR-DAY-02 | Nothing is ticked for a parent. Given a parent opens Days, Browse or the ask card, When the list shows, Then no day is ticked or pre-selected; a day is scheduled only after the parent's own tap; "Not now" and leaving are full answers and schedule nothing. A test fails if any row has `preTicked` true. | NS-46-R2 (new row needed); e2e: Home slip rank (A-S01), the Days page (new screen needed); BL: new row needed (NR-DAY-02) | P0 (a) the promise that the parent's choice is the only thing that schedules anything (direction 3.1) | M, C | Direction 3.1, Q-FD-3 |
| FR-DAY-03 | A ticked day is a `typedDay`. Given the NS-32 registry, When the library ships, Then the registry has no new class (ruling N-2) and the planner emits a `typedDay` item with the key `days.<id>`, using NS-32's priority, budget and lock-screen rules. | NS-32 section 3; NS-18; e2e: D-S10, D-S11; BL-982 (typed days), BL-966 (budget) | P0 (c) the evening loop must not gain a second system | M | `planner.ts:106` (kinds); GAP-LOG N-2 |
| FR-DAY-04 | A ticked day is stored as an id with optional overrides, per account and per book, never as a date copy. Given a table correction, When the app updates, Then the planner re-resolves every ticked day; Given Erase everything or account deletion, Then the ticked list is removed with the other on-phone data; Given a second parent on another phone, Then nothing syncs between phones (as NS-18 rules for typed days). Whether the list is in "Save a copy" is for `functions/cultural-background-data.md`. | NS-46-R3 (new row needed); NS-18 (not in scope: syncing); e2e: Days page (new screen needed); BL: new row needed (NR-DAY-03) | P0 (a) phone-only promise (direction 3.4) | M, P | Direction 3.4 |
| FR-DAY-05 | Astronomical days store the UTC instant and show the phone's local calendar date; the picker offers the astronomical day by default and the meteorological first of the month as an alternative; seasons show the names of the parent's hemisphere (3.4). Given a September equinox on 23 Sep 06:02 UTC (2027), When the phone is on Pacific time, Then the note is on 22 Sep; on Eastern time, 23 Sep. | NS-46-R4 (new row needed); e2e: Days page (new screen needed); BL: new row needed (NR-DAY-04) | P1 | M, C | USNO (read); section 3.4 table |
| FR-DAY-06 | Moving days: each lunar or lunisolar row carries an `authority` and a `country` or tradition, and `precision: about`; the picker and landing say "around"; where authorities differ the picker asks one calm question ("Which calendar does your family follow?"); the parent can move the date for one year or for always, and that date is the parent's own. | NS-46-R5 (new row needed); e2e: D-S08 pattern for the date field, D-S09 (typed day detail), Days page (new screen needed); BL: new row needed (NR-DAY-05) | P0 (a) never promise a date the code does not know | M, C | Section 3.5; timeanddate notes on one-day error (read) |
| FR-DAY-07 | Budget and clashes. Given two ticked days on one date, Then one notification is sent, neutral title, both names after the tap; Given a ticked day and a birthday on one date, Then the birthday is sent and the library day is not (Q-DAY-5); Given a ticked day and a plan notice, Then both are sent (plan is outside the budget); Given 60 pending notifications, Then library days respect the ceiling like any budgeted class. Test fixtures: 14 Feb 2029 (Valentine's Day and Ash Wednesday), 16 May 2027 (Pentecost and Eid al-Adha), 5 ticked December days. | NS-32 section 3 and 5; NS-32 R-rows for ordering (see card change 3); e2e: D-S10.oneDay, a new D-S10.twoDays; BL-966; new row needed (NR-DAY-06) | P0 (a) one note a day | M | Section 3.3, 4.8 |
| FR-DAY-08 | A library day's note is planned like a birthday: 92 days ahead, default 09:00 local (`BIRTHDAY_TIME`), clamped into the parent's window, never time-sensitive; days that begin at sundown are sent on the daytime date the list gives; Hanukkah on the first-candle date; no sunset or location is used. | NS-46-R6 (new row needed); NS-13 window rules; e2e: D-S10; BL-943 | P1 | M | `planner.ts:134,288`; section 3.7 |
| FR-DAY-09 | Lock screen. Given "Names in notifications" off, When a seasonal or civic day fires, Then the title may be the day's name; When a family, tradition, culture-led or national day fires, Then the title is the neutral "A day you wanted to remember" and the body is neutral; Given the switch on, Then the name shows, never with App lock on; Given the tradition field, Then it is never in a title, body, log, analytics event or crash report. A snapshot test enumerates every key. | NS-32 R11 to R13; NS-13 R5, R6; NS-46-R7 (new row needed); e2e: D-S10 (`libraryDay-public`, `libraryDay-neutral`, `libraryDay-named`, new states), D-S11 (`libraryDay`); BL-965 | P0 (a) a passer-by must not learn a faith | C, M, P | GAP-LOG N-3; WORDS.md 258 to 266 |
| FR-DAY-10 | Wording. Every `days.*` key follows 5.2 and the rules test adds: no "your" before a day name; no relationship word in the body or landing; no greeting (Happy, Merry, Blessed, Mubarak); no "celebrate"; no "gather", "together", "around the table"; no digits except in a date; no `{child}` in a names-off lock string; no "?" in a `quiet` line; no exclamation mark; no emoji; length limits. | NS-46-R8 (new row needed); e2e: D-S10, D-S11; BL-965 (words) | P0 (a) the content rules and the voice | C | Section 5.2; `rules.test.ts` |
| FR-DAY-11 | `quiet` tone. Given Memorial Day, Veterans Day, Good Friday, Yom Kippur or a national day naming a war or a lost life, When the landing shows, Then it is the day's name and "The book is open if you want it." with no question and no prompt; a parent cannot change the tone. R-FD-3 decides whether Memorial Day and Veterans Day are offered at all. | NS-46-R9 (new row needed); e2e: D-S11 (`libraryDay-quiet`, new state); BL-965 | P0 (a) no loss language | C | Section 5.3, Q-FD-3, R-FD-3 |
| FR-DAY-12 | Unfilled years. Given a ticked day with no date for the next year, When the planner runs, Then nothing is scheduled for it and the Days page shows one calm line ("{day}: the date for next year arrives with the next update."); no count, no warning style, no badge. The app update refreshes the table. | NS-46-R10 (new row needed); e2e: Days page (new screen needed); BL: new row needed (NR-DAY-07) | P1 | M, C | Section 3.6 |
| FR-DAY-13 | Annual data review. A named `content` owner re-reads each table row in October for the next year, records source and date, and a test fails the build when a row's latest year is before the current calendar year plus one in October (or earlier by configuration). Tentative lists (Islamic days from 2027 in the lists read) are re-read when the authority announces. | NS-46 (operations section); BL: new row needed (NR-DAY-08); an ops runbook line | P1 | C, O | Section 7 |
| FR-DAY-14 | Exclusion list as data. The ids in section 6 are in a `days.excluded` list with the reason; a test fails if any appears in the library. | NS-46-R11 (new row needed); BL: new row needed (NR-DAY-09) | P1 | C | Section 6 |
| FR-DAY-15 | The parent can always add any date. Given a day that is not in the library, When the parent wants it, Then Add a day (NS-18) takes it in their own words; the app never says a day is missing, never counts what is ticked, and never offers "complete your list". | NS-18; NS-46-R12 (new row needed); e2e: D-S08 (Add a day), Days page (new screen needed) | P0 (a) no gap counting | C, M | Direction section 1; frame on counts |
| FR-DAY-16 | One Days page. NS-18 typed days and the library are one list in Me, "Notes and days", Days (R-IA-2). It shows the day's name and its next date ("around" where it applies), the tone is calm, and it has no counts and no header such as "You mark 7 days". | NS-46-R13 (new row needed); NS-18; e2e: Days page (new screen needed; R-IA-2), D-S06, D-S09; BL: new row needed (NR-DAY-10) | P1 | D, M | GAP-LOG R-IA-2 |
| FR-DAY-17 | Browse order and no label. Browsing lists seasonal and shared, family, civic, then traditions; a parent who named a tradition sees its days first; "Browse all" shows every tradition in alphabetical order, not by size; the app never writes "your religion" or "your tradition"; ticking is per day and across traditions. | NS-46-R14 (new row needed); e2e: Days page, Browse sheet (new screen needed); BL: new row needed (NR-DAY-10) | P1 | C, D | Direction 3.3 and 3.4 |
| FR-DAY-18 | Country variants. Days with a country-specific date (Mother's Day, Children's Day, national days) have one row per country read; the default is the US row; a parent from another country can move the date. Only countries whose list was read are offered; no country is offered by default. | NS-46-R15 (new row needed); BL: new row needed (NR-DAY-11) | P2 | C | Section 4.5 |
| FR-DAY-19 | Language and reading. The names are in English at version 1 (VOICE.md says the app is in English); no translation is promised; VoiceOver reads "around" with the date; days with names from other languages keep the family's spelling ("Eid al-Fitr", "Diwali", "Hanukkah"), not a respelling. The languages review owns the translation rule per language. | NS-46-R16 (new row needed); e2e: Days page, D-S11; `functions/languages-and-localisation.md` | P2 | C | VOICE.md multilingual rule |
| FR-DAY-20 | No analytics. Given any build, Then no analytics event, log line or crash report carries a day id, a tradition, a country or a count of ticked days, and the measure of whether the library helps is a tester sheet, not telemetry, while analytics is off. | NS-46-R17 (new row needed); `functions/data-and-measurement.md`, `functions/privacy.md`; BL: new row needed (NR-DAY-12) | P0 (a) phone-only promise | P, M | CLAUDE.md privacy rules; direction 3.4 |
| FR-DAY-21 | Support. Help article and macro: "I got a note on the wrong day" and "A day I keep is not in the list", with the true answers (dates are around, moon sighting can move them, move it yourself, add your own). | `functions/support.md`; BL: new row needed (NR-DAY-13) | P1 | S | Section 7 |
| FR-DAY-22 | Claims. No store page, website or in-app line says "all religions", "every holiday", "every culture" or "the right date". It may say "days you choose" and "your own dates". | `functions/marketing.md`; NS-46 claims section (19) | P1 | K | Never promise what the code does not do |
| FR-DAY-23 | Licence and counsel. Before any source table ships, counsel confirms the right to use each source's dates; where a rule computes a date it is computed, not copied; the moon-sighting dates come from a source whose terms allow this use, cited in the data. Counsel also confirms the legal reading of a parent's ticked tradition days as data inferring religion (brief 3). | NS-46 section 17 (legal, privacy and compliance); needs a counsel number from legal | P0 (b) legal | R | Section 7; not read: any source's terms |
| FR-DAY-24 | Authority differences are shown, not hidden. Where two read authorities disagree (Eid al-Fitr 2026, Diwali 2027 and 2030, Eid al-Adha 2027 and 2030, the Buddha's birthday every year), the data keeps both rows and the picker asks one question; the default order is the order the parent's chosen tradition lists first. | NS-46-R5; BL: NR-DAY-05 | P1 | C | Section 3.5, 4.4 |
| FR-DAY-25 | A note on a day is never a count or comparison with a previous year; the library never says "last year you wrote" and never shows what a parent wrote on that day a year ago in a notification (the "on this day" look-back is NS-31, not this card). | NS-46-R18 (new row needed); NS-31 | P0 (a) no counts; constitution (no reading of letters) | C, M | Direction 3.1 |

---

## 9. Design needs

| Need | Keyed to | What |
|---|---|---|
| The Days page | New screen needed (R-IA-2: Me, Notes and days, Days) | One list of ticked days (typed days and library days), "Add a day", "Browse days"; each row name, next date, "around" where it applies; empty state says nothing about gaps; the line for a day with no next-year date (FR-DAY-12); no counts |
| Browse days sheet | New screen needed | Groups in the order in FR-DAY-17; tick per day; "Dates differ by country" picker question for authority variants; nothing pre-ticked; "Done" is the only exit; no "select all" |
| Day detail | D-S09 pattern, new state | The day's name, the date ("around"), a "Move this date" control (one year, always), Remove; no tradition label |
| Ask card on Home | A-S01 slip rank (R-IA-3, R-IA-5) | "Would you like a note on days that matter to your family?" with Choose and Not now; shown once; pending Q-FD-2 |
| Lock-screen renders | D-S10 new states | `libraryDay-public`, `libraryDay-neutral`, `libraryDay-named`, `libraryDay-quiet`, `twoDays` |
| Notification landing | D-S11 new state | `libraryDay`: Home shows the day's name and one line above the prompt (like the typed day); `quiet` has no prompt line; `twoDays` names both |
| Names switch help line | D-S06 | The one "Names in notifications" switch gains one plain line that it also covers day names (Q-DAY-6) |
| Words | `WORDS.md` for area D | New key family `days.*`: names, the neutral lock strings, the two landing templates, the quiet landing, the picker question, the "around" line, the next-year line; all from section 5, all through the rules test |
| Hemisphere | Browse days sheet | Season names for the parent's hemisphere; a small switch in the row, not a setting elsewhere |

---

## 10. Card changes proposed (for Karma to rule)

| # | Card row | Change | Why |
|---|---|---|---|
| 1 | NS-18 section 3, "Not in scope" | Remove "Recurring days" and "Days the app suggests" for library days only; keep "Syncing typed days" | A library day recurs and the app offers the list |
| 2 | NS-32 section 3, classes | State that `typedDay` carries both a parent's typed day and a library day (no new class), per ruling N-2 | One budget, one registry |
| 3 | NS-32 section 3, priority | A birthday beats a library day on the same date; a parent's own typed day still beats a birthday | A first birthday on Thanksgiving must be sent (Q-DAY-5) |
| 4 | NS-32 section 5 | Add the two-ticked-days case: one note, both named after the tap, neutral title | Section 3.3 |
| 5 | NS-13 and NS-32 lock-screen rows | Reference the one "Names in notifications" switch as covering day names (N-3, N-7) | Section 5.1 |
| 6 | NS-31 | The `occasion` class stays out; the parked "on this day" part is separate and untouched by this card | Direction Q-FD-6, N-2 |
| 7 | New card NS-46 | Days we mark (section 13); to be added after the nine expert reviews | Brief 1 |
| 8 | GAP-LOG N-1 | Reconcile the 8 to 12 variants per layer with 4 per day and 3 per season for a once-a-year day (4.6) | Q-DAY-7 |
| 9 | Frame (`00-product-frame.md` table row 33, C-15 "Typed days in reminders") | Add a row or note: C-xx "Days we mark" next to it, Attractive, B Capture | Rank and kind to be set by Karma |

---

## 11. Engineering needs (rows to add or change)

| Need | Where | Row |
|---|---|---|
| Add `days` data and the calendar tests (rule dates equal the table for 2026 to 2030, the astronomical instants, no `preTicked`, `n/r` only as a literal) | `packages/content/src/days/`, `packages/content/test/` | New row needed (NR-DAY-01) |
| Add the planner kind that resolves a ticked day to its next date in the phone's calendar; extend `PlannedKind` beyond evening, monthAge and birthday, with the typed-day work in BL-982 | `apps/mobile/src/lib/reminders/planner.ts` | BL-982, new row needed (NR-DAY-06) |
| Storage for ticked ids and overrides (phone-only, per account and book; erased by Erase everything; excluded from analytics) | `apps/mobile/src/lib/reminders/prefs.ts` | New row needed (NR-DAY-03) |
| Resolve an astronomical instant to a local date; hemisphere names | `apps/mobile/src/lib/reminders/tz.ts` (it already holds date arithmetic that R-IA-1 moves to `packages/core`) | New row needed (NR-DAY-04) |
| A test that the notification categories for library days carry the neutral placeholder | the NS-32 registry tests | BL-966 |
| Table refresh route: bundle in the app and refresh each year with an app update (recommended); a downloadable pack (`packs/` pattern) is the alternative if a mid-year correction must reach phones without an update | engineering chapter owner decides | New row needed (NR-DAY-07) |
| An annual October review task and its runbook line | `docs/ops/` | New row needed (NR-DAY-08) |

I did not read the engineering chapters, `prefs.ts` or `scheduler.ts` beyond their size and the exports listed in section 1, and did not run any planner test.

---

## 12. Founder and counsel questions (each with a recommended default)

Counsel numbers are from `docs/legal/COUNSEL_PACKET.md` 1.5.0 where one exists; I did not read the packet for this file, so each counsel question below "needs a number from legal".

| Id | Question | Recommended default | Who |
|---|---|---|---|
| Q-DAY-1 | Do the library's two tones (bright, quiet) and the neutral lock-screen rule in 5.1 stand? | Yes | Karma, founder |
| Q-DAY-2 | R-FD-3: are Memorial Day and Veterans Day offered? | Offer both with the `quiet` tone and the name only; never pre-ticked. If the founder prefers, offer Veterans Day only and leave Memorial Day to a typed day | Karma, founder |
| Q-DAY-3 | Time of day for a library day | 09:00 local, the birthday time | Founder |
| Q-DAY-4 | Which countries' national days and country-specific dates ship, and when | US only in the first release; India, Mexico, China, Japan, South Korea, Singapore, Indonesia and Sri Lanka lists (section 4.5) in a later drop, each after its authority is read | Founder |
| Q-DAY-5 | A birthday and a library day on the same date | The birthday is sent; the library day yields | Karma |
| Q-DAY-6 | May a tradition day's name show on the lock screen when "Names in notifications" is on? Does it need a second, plain line? | One switch, one plain line: "This can also show the name of a day your family keeps." | Privacy, counsel (needs a number from legal) |
| Q-DAY-7 | Variants per day: 4 and 3 (direction 4.3) against 8 to 12 (N-1) | 4 per day and 3 per season; 8 to 12 only for the evening grid | Karma |
| Q-DAY-8 | Is a regional or sub-community day (Pongal, Onam, Parsi New Year, Norooz) in the first release? | Yes if its list was read and the parent can move it; no if not | Content |
| Q-DAY-9 | May the library offer days of a religion without a member of that community reviewing them? | No: a reviewer from each of the six biggest groups reads the tradition's rows and names before ship; costs a small fee or a volunteer; a family can always add their own | Founder, counsel |
| Q-DAY-10 | Licence of the sources (FR-DAY-23) | Compute rule-based dates; license or cite each table; counsel confirms | Counsel (needs a number from legal) |
| Q-DAY-11 | Is the ticked-days list "special category" data by inference, wherever it is stored (GDPR Article 9 and similar laws)? | Counsel must confirm. Keep it on the phone only and out of analytics, logs, crash reports and the exported copy until counsel answers (see `functions/cultural-background-data.md`) | Counsel (needs a number from legal) |
| Q-DAY-12 | Q-FD-1 "East East": if the founder meant "East Asian", that is a culture or origin group, not a religion, and its days (Lunar New Year, Lantern, Mid-Autumn, Chuseok, Dragon Boat) are in the culture-led group above and need no religion answer | Treat "East Asian" as a region choice only if the founder confirms; otherwise stay with "Prefer not to say" | Founder |

---

## 13. Proposed card NS-46: Days we mark (outline, for Karma to rule; nothing here is locked)

Candidate: C-xx, "Days we mark". Kind: Attractive. Area: B Capture, in Me. Depends on: NS-18 (typed days) and NS-32 (budget) shipped; the Days page from R-IA-2. Label effect: none (everything is local; the ticked list does not leave the phone; confirm in brief 3).

1. **Who and when.** A parent who wants a short, personal note on days that matter to their family: a season, Mother's Day, Thanksgiving, Diwali, Eid, Easter, Hanukkah, Lunar New Year. After the first kept letter, once; then any time in Me, Days. The ask is not in first run (Q-FD-2).
2. **Why.** Job 5, "Tell me what to write about, without nagging", and the parent's own choice is the gentlest prompt (NS-18 section 2). Evidence: the founder's direction; no research yet, brief 6 and a tester sheet follow.
3. **What, and not in scope.** What: a library of days the parent ticks; a ticked day recurs each year and sends one note on its date; the parent can move a date; browsing is by layer, with traditions after a parent names one or opens Browse all. Not in scope: pre-ticked days; inference of any kind; location; a note derived from any picture or letter; any greeting; any explanation of a day; recurring typed days (those stay NS-18); a second notification class; days a parent has not chosen.
4. **Happy path.** (a) First letter kept; the Home slip asks, once. (b) Choose; Days; tick Thanksgiving, the first day of spring and one tradition day; Done. (c) On the day, 09:00, one note with a neutral or public title. (d) Tap; Home shows the day and one line above the prompt; one more tap starts speaking.
5. **Unhappy paths and edge cases.** Two ticked days on one date; a birthday on the same date (Q-DAY-5); a date moved by the parent; a day with no date next year (FR-DAY-12); notifications not allowed in iOS Settings; Reduce Notifications; a quieted book; App lock on; "Show Previews" hidden; time zone changes (astronomical days); a Southern Hemisphere phone; the parent unticks a day; sign-out cancels the notes (BL-967 for reminders); a country difference between authorities; a moon-sighting day moves by one day (the parent moves it, support macro).
6. **Scenario coverage.** First use; empty (nothing ticked: nothing sent, no message); many (every library day ticked: still at most 1 a day, under the pending ceiling); offline (all local); slow (n/a); failed (iOS refuses a notification: the built failure line).
7. **Acceptance criteria.** FR-DAY-01 to FR-DAY-25 as Given, When, Then rows; the date tables equal the rules for all rule-based days in all five years; the snapshot test of lock-screen strings; the rules test over the `days.*` keys.
8. **Non-functional budgets.** Planning a year of ticked days under 50 ms on the lowest supported phone (an assumed figure, UNVERIFIED, for engineering to set); table size under 100 kB (an assumed figure); no network call.
9. **State space (RR-5).** Day ticked or not; layer; tone; precision exact or about; authority variants; date known or n/r; moved or not; names on or off; App lock; Show Previews; quiet; clash with a birthday, a plan notice or another day.
10. **Data and engineering.** `packages/content/src/days/`, the planner kind, prefs storage, tests (section 11).
11. **Data inventory.** Ticked day ids and overrides: on the phone only, per account; not synced, not exported unless counsel says so, not in analytics, logs or crash reports. Class: sensitive by inference (to be classified in brief 3).
12. **Door lines** (COORDINATION section 10; ticking a day is a choice, not a Terms or Privacy consent, but the lines are written so counsel can say whether PRIV-R21 applies). **Shown:** before the first tick, the key `days.door.line`, intent "Only on this phone. Used for one thing: suggesting days to mark. Change or clear any time."; and the names-switch help line (Q-DAY-6). **Records:** no server row and no PRIV-R21 record, because nothing leaves the phone; the on-phone preference holds day ids and overrides (FR-DAY-04). If counsel decides a ticked tradition day is special-category data needing a recorded act, PRIV-R21 applies and this line changes (needs a number from legal). **Never:** a tradition label, a day id, a country or a count in analytics, logs, crash reports, URLs or notifications (FR-DAY-20, PRIV-R02, PRIV-R10). **Decline and withdraw:** "Not now" schedules nothing and is a full answer; unticking a day cancels it; Erase everything and account deletion remove the list; export and deletion work as for every other on-phone item (PRIV-R09).
13. **Threats.** A passer-by reads a lock screen; a family member opens the Days page on an unlocked phone and learns what a parent ticked; a wrong date; a stereotype from a default; a table licence claim; a scraped table presented as an authority.
14. **Never.** A pre-ticked day; a tradition label on a screen, a title or a log; a greeting; a claim of coverage; a count of days ticked or missed; a note derived from a picture, a letter, a place or a person's name; anything that says the app wrote it.
15. **Design inputs.** Section 9.
16. **Content inputs.** Section 5; the `days.*` key family; tone `quiet`.
17. **Legal, privacy and compliance inputs.** FR-DAY-23; Q-DAY-6, Q-DAY-9, Q-DAY-10, Q-DAY-11; `functions/cultural-background-data.md`; counsel must confirm everything in this section.
18. **Label effect.** None expected, because nothing leaves the phone; confirm against the current label rules (UNVERIFIED here, brief 3).
19. **Claims.** "Pick the days you want a note on." Never: "every holiday", "all religions", "the right date", "we know your traditions".
20. **Free or Plus.** Free (a note on a day is the parent's own reminder; no entitlement logic in the lock-screen strings, NS-13 R-rows already forbid Plus, price or Keep steps in a budgeted class).
21. **Measures with analytics off.** A tester sheet: did a parent tick a day, did a note land on the right day, did anyone feel guessed at; one question about wrong dates per tradition. No telemetry (FR-DAY-20).
22. **Dependencies and gates.** NS-18 and NS-32 shipped; the Days page designed; copy approved by the founder; counsel on FR-DAY-23; a named annual review owner; the first-year tables read from authorities.
23. **Open questions.** Q-DAY-1 to Q-DAY-12; Q-FD-1 and Q-FD-2 from the direction.

---

## 14. What I did not verify (again, in one place)

- Every date was read from a list another party publishes. None was checked against a primary religious authority except Hebcal (calculated, Jewish) and the Baha'i World Centre page (one year). The dates for Islamic days from 2027 are marked tentative by their source and may move by a day.
- I read none of the sources' terms of use. Counsel must confirm.
- The `n/r` cells are listed in the tables; I wrote no date from memory. Two exceptions are computations I ran and compared to a source: Western and Orthodox Easter, and the rule dates for the US days. They match every cell I could compare.
- The meaning of a day (mourning, fast, contested name) in section 6 is general knowledge, not a source read; each is marked.
- I did not read `docs/legal/in-app-disclosures.md` or `compliance-register.md` for this file, the engineering chapters, `prefs.ts`, `scheduler.ts`, or the COUNSEL_PACKET. I did not read App Review or privacy-label text (brief 3 owns it).
- No planner, content or database test was run; nothing was built. The sample lines were not run through `rules.test.ts`.
- I am a Claude role, not counsel, not a clinician, and not a member of any tradition named above. A member of each tradition should read its rows before ship (Q-DAY-9).

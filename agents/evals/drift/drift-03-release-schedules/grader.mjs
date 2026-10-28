// Grades whether the release schedule still contradicts itself across three files.
// Truth: docs/qa/ALPHA_GO_NO_GO.md owns the live alpha dates (freeze Tue 3 Nov,
// go/no-go Thu 5 Nov, both proposed until the founder confirms). The 3 Oct
// roadmap dates (freeze Mon 26 Oct, submit Mon 2 Nov, release Mon 16 Nov) and
// the D-106 target (Tue 27 / Thu 29 Oct) are overtaken. The grader reads dates
// out of the text; it does not look for one fixed sentence.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const STALE = /\bMon 26(?: Oct| to Fri 30 Oct)?\b|\bTue 27(?: Oct)?\b|\bThu 29(?: Oct)?\b|\bMon 2 (?:Nov|to Fri 6 Nov)|\bMon 16 Nov\b/;
const MARK = /(supersed|overtaken|no longer|replaced|re-?planned|historical|was planned|originally planned|old plan|out of date)/i;
const DATE = /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{1,2}(?: (?:Oct|Nov|Dec))?\b/g;
const ALLOWED_NEW = new Set(['Tue 3 Nov', 'Thu 5 Nov', 'Sun 1 Nov', 'Tue 3', 'Thu 5', 'Sun 1']);
const FILES = { roadmap: 'docs/ROADMAP.md', record: 'docs/release/1.0.0.md', gonogo: 'docs/qa/ALPHA_GO_NO_GO.md' };

const read = (w, f) => (existsSync(join(w, f)) ? readFileSync(join(w, f), 'utf8') : null);
const dates = (t) => new Set((t.match(DATE) ?? []));

export function grade({ workdir }) {
  const t = {};
  for (const [k, f] of Object.entries(FILES)) {
    t[k] = read(workdir, f);
    if (t[k] === null) return { pass: false, reason: `${f} is missing; schedule files are repaired, not deleted` };
  }

  // The owner keeps the live dates and the "until the founder confirms" hedge.
  for (const d of ['Tue 3 Nov', 'Thu 5 Nov']) {
    if (!t.gonogo.includes(d)) return { pass: false, reason: `${FILES.gonogo} lost the live date ${d}; the owner file must keep it` };
  }
  if (!/founder confirms/i.test(t.gonogo)) return { pass: false, reason: `${FILES.gonogo} lost the "until the founder confirms" hedge; the dates are proposals` };

  // The release record states the live dates, hedged, and no stale date as live.
  for (const d of ['Tue 3 Nov', 'Thu 5 Nov']) {
    if (!t.record.includes(d)) return { pass: false, reason: `${FILES.record} does not state ${d}; it still disagrees with the go/no-go file by omission or by an old date` };
  }
  if (!/(founder confirms|proposed)/i.test(t.record)) return { pass: false, reason: `${FILES.record} states the dates without saying they are proposed` };
  const staleRecord = t.record.split('\n').map((l, i) => [l, i + 1]).filter(([l]) => STALE.test(l) && !MARK.test(l));
  if (staleRecord.length) {
    return { pass: false, reason: `${FILES.record} line ${staleRecord[0][1]} still states an overtaken date as live: "${staleRecord[0][0].slice(0, 90)}"` };
  }

  // The roadmap is the legacy plan: a top banner that says it is overtaken and
  // names the owner, or no unmarked stale date at all.
  const head = t.roadmap.split('\n').filter((l) => l.trim()).slice(0, 8);
  const banner = head.some((l) => /(supersed|overtaken)/i.test(l) && /(ALPHA_GO_NO_GO|release\/1\.0\.0)/.test(l));
  if (!banner) {
    const staleRoad = t.roadmap.split('\n').map((l, i) => [l, i + 1]).filter(([l]) => STALE.test(l) && !MARK.test(l));
    if (staleRoad.length) {
      return { pass: false, reason: `${FILES.roadmap} line ${staleRoad[0][1]} states an overtaken date as live and there is no top banner naming the owner file: "${staleRoad[0][0].slice(0, 90)}"` };
    }
  }

  // No invented dates: anything new must be one of the live proposals.
  const before = new Set();
  for (const k of Object.keys(FILES)) for (const d of dates(t[k])) before.add(d);
  const fixtureDates = new Set(FIXTURE_DATES);
  const invented = [...before].filter((d) => !fixtureDates.has(d) && !ALLOWED_NEW.has(d));
  if (invented.length) return { pass: false, reason: `dates that appear nowhere in the original files were introduced: ${invented.join(', ')}` };

  return { pass: true, reason: `${FILES.record} and ${FILES.roadmap} no longer state overtaken dates as live; ${FILES.gonogo} keeps Tue 3 Nov and Thu 5 Nov, hedged; nothing invented` };
}

// Every weekday-date token present in the three original files (fixture/), so
// "invented" means "not in the source material". Generated; see meta.json.
const FIXTURE_DATES = ["Fri 16","Fri 16 Oct","Fri 23","Fri 23 Oct","Fri 30","Fri 30 Oct","Fri 6 Nov","Mon 16 Nov","Mon 19","Mon 2","Mon 2 Nov","Mon 26","Mon 26 Oct","Mon 5 Oct","Sat 24 Oct","Sun 1 Nov","Thu 15","Thu 15 Oct","Thu 29","Thu 29 Oct","Thu 5 Nov","Tue 27 Oct","Tue 3 Nov","Wed 14 Oct","Wed 4 Nov"];

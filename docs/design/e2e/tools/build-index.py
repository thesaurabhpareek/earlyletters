#!/usr/bin/env python3
"""Rebuild docs/design/e2e/INDEX.md in place from the five area folders.

Usage (from anywhere):   python3 -I docs/design/e2e/tools/build-index.py
Options:                 --stdout   print the index instead of writing it
                         --check    exit 1 if INDEX.md differs from a fresh build

Deterministic (no clock, no network, no randomness), ASCII output only.
The index lists; it never defines. Area files are read, never written.

What is read, per area (A, B, C, D, E):
  DESIGN.md  screen ids      table rows whose first cell is an area screen id
                             (inventory rows win; rows elsewhere, such as a
                             Round 2 table, and `### <id> <name>` headings fill
                             ids the inventory lacks; ids that are only
                             mentioned get a "named in prose only" row)
             state ids       every `<screen>.<state>` token; every backticked
                             `.state` token on a line whose last-named screen
                             (or section heading screen, or table row id) is an
                             area screen; the plain-word list in an inventory
                             "States" column. Templates such as `error-<code>`
                             and file extensions are skipped.
  MOTION.md  motion ids      table rows whose first cell is one id (or a comma
                             list of ids) in the area scheme, plus `### <id>`
                             headings and D's numeric key table (13.1)
             T-* and m.*     tokens in those rows
Cards are the NS ids in the inventory row's card column (or, for a heading-only
screen, in the first paragraph under its heading).

PROPOSED means: the defining row or heading sits under a Round 2 / PROPOSED
section, or says PROPOSED. NS-51 and NS-52 are always shown as PROPOSED.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "INDEX.md")

AREAS = [
    ("A", "A-capture", r"MA-\d+[a-z]*"),
    ("B", "B-book-and-reading", r"B-M\d+[a-z]*"),
    ("C", "C-keeping-and-trust", r"M-C\d+[a-z]*"),
    ("D", "D-family-sharing-reminders", r"D-M\d+[a-z]*"),
    ("E", "E-foundations-and-system-states", r"E-M\d+[a-z]*"),
]
PROPOSED_CARDS = ("NS-51", "NS-52")
BUILD_DATE = "20 Nov 2026"
EXT_DENY = {"md", "ts", "tsx", "js", "jsx", "json", "html", "sql", "mjs", "py",
            "png", "css", "yml", "yaml", "mdc", "txt", "sh", "env", "svg"}

ID_RE = re.compile(r"(?<![A-Za-z0-9-])([A-E]-S\d+[a-z]?)(?![A-Za-z0-9])")
SCREEN_STATE_RE = re.compile(
    r"(?<![A-Za-z0-9-])([A-E]-S\d+[a-z]?)\.([A-Za-z][A-Za-z0-9_-]*)")
DOT_RE = re.compile(r"`\.([A-Za-z][A-Za-z0-9_-]*)`")
NS_RE = re.compile(r"NS-\d+(?:-[A-Z]+\d+[a-z]?)?")
T_RE = re.compile(r"\bT-[A-Z]+\b")
M_RE = re.compile(r"`?\b(m\.[a-z]+(?:\.[a-z]+)*)")
HEAD_RE = re.compile(r"^(#{1,6})\s+(.*\S)\s*$")

NONASCII_MAP = {
    "\u2014": "-", "\u2013": "-", "\u2018": "'", "\u2019": "'", "\u201c": '"',
    "\u201d": '"', "\u2026": "...", "\u00a0": " ", "\u2192": "->",
    "\u2190": "<-", "\u2194": "<->", "\u00d7": "x", "\u2022": "-",
}
NONASCII_SEEN = {}


def ascii_only(s):
    out = []
    for ch in s:
        if ord(ch) < 128:
            out.append(ch)
        else:
            NONASCII_SEEN[ch] = NONASCII_SEEN.get(ch, 0) + 1
            out.append(NONASCII_MAP.get(ch, "?"))
    return "".join(out)


def read_lines(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read().split("\n")


def natkey(s):
    return [int(p) if p.isdigit() else p for p in re.split(r"(\d+)", s)]


def split_row(line):
    s = line.strip()
    if not s.startswith("|"):
        return None
    s = s.replace("\\|", "\x00")
    cells = [c.strip().replace("\x00", "|") for c in s.strip("|").split("|")]
    return cells


def is_sep(cells):
    return all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c)


def strip_md(s):
    return re.sub(r"[`*]", "", s).strip()


def clean_heading(text):
    t = re.sub(r"^[\d.]+[a-z]?\.?\s+", "", text)
    t = re.sub(r"\([^)]*\)", "", t)
    return re.sub(r"\s+", " ", t).strip(" :;,-")


def is_round2(h2, h3=""):
    """True when the h2 is a Round 2 section, or the h3 says Round 2 / PROPOSED."""
    if re.match(r"^[\d.]*[a-z]?\.?\s*Round 2", h2 or "", re.I):
        return True
    return bool(re.search(r"round 2|PROPOSED", h3 or "", re.I))


NAME_PROP_RE = re.compile(r"PROPOSED|\(proposed[;,)]")


def cut(s, n=120):
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) <= n:
        return s
    k = s.rfind(" ", 0, n)
    return s[: k if k > 40 else n] + " [cut]"


def walk(lines):
    """Yield (index, line, h2, h3) skipping fenced code."""
    h2 = h3 = ""
    fence = False
    for i, ln in enumerate(lines):
        if ln.lstrip().startswith("```"):
            fence = not fence
            continue
        if fence:
            continue
        m = HEAD_RE.match(ln)
        if m:
            lvl = len(m.group(1))
            if lvl <= 2:
                h2, h3 = m.group(2), ""
            elif lvl == 3:
                h3 = m.group(2)
        yield i, ln, h2, h3


def first_paragraph(lines, start, limit=1500):
    buf = []
    for ln in lines[start + 1:]:
        if HEAD_RE.match(ln):
            if buf:
                break
            continue
        if not ln.strip():
            if buf:
                break
            continue
        buf.append(ln)
        if sum(len(b) for b in buf) > limit:
            break
    return " ".join(buf)


def split_top(s):
    """Split on commas outside parentheses and backticks."""
    out, cur, depth, tick = [], [], 0, False
    for ch in s:
        if ch == "`":
            tick = not tick
        elif not tick and ch == "(":
            depth += 1
        elif not tick and ch == ")":
            depth = max(0, depth - 1)
        if ch == "," and depth == 0 and not tick:
            out.append("".join(cur))
            cur = []
        else:
            cur.append(ch)
    out.append("".join(cur))
    return [x.strip() for x in out if x.strip()]


# ---------------------------------------------------------------- screens ---

def scan_design(area, lines):
    """Return dict with screens, states, state_sections."""
    sid_first = re.compile(r"^(" + area + r"-S\d+[a-z]?)\b")
    cand = {}          # id -> list of candidate dicts
    headdef = {}       # id -> dict from a heading
    header_cols = []   # last table header cells
    for i, ln, h2, h3 in walk(lines):
        m = HEAD_RE.match(ln)
        if m:
            lvl = len(m.group(1))
            mm = re.match(r"^(?:[\d.]+[a-z]?\.?\s+)?(" + area + r"-S\d+[a-z]?)\s+(.*)$", m.group(2))
            if mm and lvl >= 2 and mm.group(1) not in headdef:
                raw = mm.group(2)
                prop = bool(NAME_PROP_RE.search(raw)) or is_round2(h2)
                name = re.sub(r"\s*\((?:PROPOSED|v2|new)[^)]*\)\s*$", "", raw).strip()
                headdef[mm.group(1)] = dict(name=name, prop=prop, line=i, h2=h2,
                                            cards=NS_RE.findall(raw + " " + first_paragraph(lines, i)))
            continue
        cells = split_row(ln)
        if not cells:
            continue
        if is_sep(cells):
            continue
        c0 = strip_md(cells[0])
        if c0.lower() in ("id", "screen id"):
            header_cols = [strip_md(c).lower() for c in cells]
            continue
        mm = sid_first.match(c0)
        if mm and len(c0) <= 24 and len(cells) >= 2:
            sid = mm.group(1)
            card_idx = next((k for k, h in enumerate(header_cols) if h.startswith("card")), None)
            st_idx = next((k for k, h in enumerate(header_cols) if h.startswith("states")), None)
            cards = []
            if card_idx is not None and card_idx < len(cells):
                cards = NS_RE.findall(cells[card_idx])
            states_col = cells[st_idx] if st_idx is not None and st_idx < len(cells) else ""
            cand.setdefault(sid, []).append(dict(
                cells=cells, h2=h2, line=i, cards=cards, states_col=states_col,
                inv=bool(re.search(r"inventory", h2, re.I)),
                prop=bool(NAME_PROP_RE.search(cells[1])) or is_round2(h2)))
    screens = {}
    for sid, cs in cand.items():
        pick = next((c for c in cs if c["inv"]), None) or cs[0]
        if not pick["inv"] and len(pick["cells"]) < 3:
            continue
        name = strip_md(pick["cells"][1])
        # A row that only repeats a screen id as a state label (e.g. E-S10.hold)
        screens[sid] = dict(name=name, cards=pick["cards"],
                            prop=bool(NAME_PROP_RE.search(pick["cells"][1])) or (is_round2(pick["h2"]) and not pick["inv"]),
                            states_col=pick["states_col"], how="table", line=pick["line"])
    for sid, hd in headdef.items():
        if sid in screens:
            continue
        screens[sid] = dict(name=hd["name"], cards=hd["cards"], prop=hd["prop"], states_col="",
                            how="heading", line=hd["line"])
    # ids only mentioned
    mention_first = {}
    for i, ln, h2, h3 in walk(lines):
        if HEAD_RE.match(ln) and not re.search(area + r"-S\d", ln):
            continue
        for m in ID_RE.finditer(ln):
            sid = m.group(1)
            if sid.startswith(area + "-") and sid not in screens and sid not in mention_first:
                mention_first[sid] = (i, h2, h3)
    for sid, (i, h2, h3) in sorted(mention_first.items(), key=lambda kv: natkey(kv[0])):
        ln = lines[i]
        name = None
        m = re.search(re.escape(sid) + r"\s*\(([^)]{6,160})\)", ln)
        if m:
            name = re.sub(r"^the\s+", "", m.group(1)).strip()
            name = name[0].upper() + name[1:]
        else:
            name = clean_heading(h3 or h2) or "(named in prose only)"
        prop = is_round2(h2, h3) or bool(NAME_PROP_RE.search(ln))
        screens[sid] = dict(name=name + " (named in prose only, no inventory row)",
                            cards=NS_RE.findall(first_paragraph(lines, i)) if prop else [],
                            prop=prop, states_col="", how="mention", line=i)
    return screens


def scan_states(area, lines, screens):
    """Return states: sid -> {state: set(h2)}."""
    states = {s: {} for s in screens}

    def add(sid, st, h2):
        if sid not in states:
            return
        st = st.strip("-_.")
        if not st or st.lower() in EXT_DENY:
            return
        states[sid].setdefault(st, set()).add(h2)

    sec_id, sec_lvl = None, 99
    for i, ln, h2, h3 in walk(lines):
        m = HEAD_RE.match(ln)
        if m:
            lvl = len(m.group(1))
            if lvl <= sec_lvl:
                sec_id, sec_lvl = None, 99
            mm = ID_RE.search(m.group(2))
            if mm and mm.group(1).startswith(area + "-") and lvl >= 3 and sec_id is None:
                sec_id, sec_lvl = mm.group(1), lvl
            for mm in SCREEN_STATE_RE.finditer(m.group(2)):
                if mm.group(1).startswith(area + "-") and not mm.group(2).endswith("-"):
                    add(mm.group(1), mm.group(2), h2)
            continue
        cells = split_row(ln)
        row_id = None
        if cells and not is_sep(cells):
            mm = re.match(r"^(" + area + r"-S\d+[a-z]?)\b", strip_md(cells[0]))
            if mm and len(strip_md(cells[0])) <= 24:
                row_id = mm.group(1)
        events = []
        for m2 in SCREEN_STATE_RE.finditer(ln):
            events.append((m2.start(), "ps", m2.group(1), m2.group(2), m2.end(), m2.group(0)))
        for m2 in ID_RE.finditer(ln):
            events.append((m2.start(), "id", m2.group(1), None, m2.end(), None))
        for m2 in DOT_RE.finditer(ln):
            events.append((m2.start(), "dot", None, m2.group(1), m2.end(), None))
        events.sort(key=lambda e: (e[0], 0 if e[1] == "ps" else 1))
        owner = None
        consumed_to = -1
        for pos, kind, sid, st, end, raw in events:
            if kind == "ps":
                if st.endswith("-"):
                    owner = sid
                    consumed_to = end
                    continue
                add(sid, st, h2)
                owner = sid
                consumed_to = end
            elif kind == "id":
                if pos < consumed_to:
                    continue
                owner = sid
            else:
                target = row_id or owner or sec_id
                if target:
                    add(target, st, h2)
        if row_id and cells:
            pass
    # inventory "States" column, plain words
    for sid, sc in screens.items():
        col = sc.get("states_col") or ""
        if not col:
            continue
        for part in split_top(col):
            base = re.sub(r"\([^)]*\)", "", part)
            base = strip_md(base).lstrip(".").strip()
            if re.fullmatch(r"[a-z][A-Za-z0-9_-]*", base) and not base.endswith("-"):
                if base.lower() not in EXT_DENY:
                    states[sid].setdefault(base, set()).add("inventory")
    return states


# ----------------------------------------------------------------- motion ---

def scan_motion(area, mpat, lines):
    idre = re.compile(r"^" + mpat + r"$")
    rows = {}   # id -> dict(states:set, t:set, m:set, prop:bool, line:int)

    def get(mid):
        return rows.setdefault(mid, dict(states=set(), t=set(), m=set(), est=set(), prop=False, line=10**9))

    for i, ln, h2, h3 in walk(lines):
        hm = HEAD_RE.match(ln)
        if hm:
            mm = re.match(r"^(?:[\d.]+\.?\s+)?(" + mpat + r")\b", hm.group(2))
            if mm:
                r = get(mm.group(1))
                r["line"] = min(r["line"], i)
                r["prop"] = r["prop"] or is_round2(h2, h3)
            continue
        cells = split_row(ln)
        if not cells or is_sep(cells):
            continue
        c0 = strip_md(cells[0])
        ids = []
        parts = [p.strip() for p in re.split(r",|\band\b", c0) if p.strip()]
        if parts and all(idre.match(p) for p in parts):
            ids = parts
        elif area == "D" and re.fullmatch(r"\d+(?:\s*(?:,|to)\s*\d+)*", c0):
            nums = []
            for seg in re.split(r",", c0):
                seg = seg.strip()
                mm = re.fullmatch(r"(\d+)\s*to\s*(\d+)", seg)
                if mm:
                    nums.extend(range(int(mm.group(1)), int(mm.group(2)) + 1))
                elif seg.isdigit():
                    nums.append(int(seg))
            ids = ["D-M%02d" % n for n in nums]
        if not ids:
            continue
        text = " ".join(cells[1:])
        for mid in ids:
            r = get(mid)
            r["line"] = min(r["line"], i)
            r["prop"] = r["prop"] or is_round2(h2, h3)
            for m2 in SCREEN_STATE_RE.finditer(text):
                if not m2.group(2).endswith("-"):
                    r["states"].add(m2.group(1) + "." + m2.group(2).strip("-_"))
            for m2 in ID_RE.finditer(text):
                sid = m2.group(1)
                if not any(s.startswith(sid + ".") for s in r["states"]):
                    r["states"].add(sid)
            for t in re.findall(r"E-ST\d+[a-z]?", text):
                r["est"].add(t)
            for t in T_RE.findall(text):
                r["t"].add(t)
            for mm in M_RE.findall(text):
                if mm not in ("m.*",):
                    r["m"].add(mm.rstrip("."))
    return rows


# ------------------------------------------------------------- catalogue ---

def scan_catalogue(lines):
    cat = {}
    for i, ln, h2, h3 in walk(lines):
        cells = split_row(ln)
        if not cells or len(cells) < 2 or is_sep(cells):
            continue
        m = re.fullmatch(r"(E-ST\d+[a-z]?)", strip_md(cells[0]))
        if m and m.group(1) not in cat:
            cat[m.group(1)] = dict(name=strip_md(cells[1]), r2=is_round2(h2, h3),
                                          prop=is_round2(h2, h3) or bool(NAME_PROP_RE.search(cells[1])))
    return cat


# ------------------------------------------------------------ extraction ---

def section_lines(lines, h_re, level=None):
    """Lines of the first heading matching h_re up to the next heading of <= level."""
    start = None
    for i, ln in enumerate(lines):
        m = HEAD_RE.match(ln)
        if m and re.search(h_re, m.group(2)):
            start, lvl = i, len(m.group(1))
            break
    if start is None:
        return []
    out = []
    for ln in lines[start + 1:]:
        m = HEAD_RE.match(ln)
        if m and len(m.group(1)) <= lvl:
            break
        out.append(ln)
    return out


def numbered_after(lines, intro_re):
    for i, ln in enumerate(lines):
        if re.search(intro_re, ln):
            out = []
            for l2 in lines[i + 1:]:
                if re.match(r"^\d+\.\s", l2):
                    out.append(l2)
                elif not l2.strip() and not out:
                    continue
                else:
                    break
            return out
    return []


def table_rows(sec, id_re=None, keep=None):
    out = []
    for ln in sec:
        cells = split_row(ln)
        if not cells or is_sep(cells) or len(cells) < 2:
            continue
        c0 = strip_md(cells[0])
        if c0.lower() in ("id", "#", "source", "state"):
            continue
        if id_re and not re.match(id_re, c0):
            continue
        txt = " / ".join(strip_md(c) for c in cells[1:])
        if keep and not re.search(keep, c0 + " " + txt, re.I):
            continue
        out.append((c0, txt))
    return out


# ------------------------------------------------------------------ main ---

def build():
    data = {}
    all_text = {}
    for key, folder, mpat in AREAS:
        d = os.path.join(ROOT, folder)
        design = read_lines(os.path.join(d, "DESIGN.md"))
        motion = read_lines(os.path.join(d, "MOTION.md"))
        words = read_lines(os.path.join(d, "WORDS.md"))
        screens = scan_design(key, design)
        states = scan_states(key, design, screens)
        mrows = scan_motion(key, mpat, motion)
        all_text[key] = dict(design=design, motion=motion, words=words)
        data[key] = dict(folder=folder, screens=screens, states=states, motion=mrows)

    cat = scan_catalogue(all_text["E"]["design"])
    prop_screens = {sid for k in data for sid, sc in data[k]["screens"].items() if sc["prop"]}
    prop_est = {c for c, v in cat.items() if v["r2"]}
    for k in data:
        for r in data[k]["motion"].values():
            keyed = {t.split(".")[0] for t in r["states"]}
            r2state = False
            for tok in r["states"]:
                if "." in tok:
                    sid, st = tok.split(".", 1)
                    own = data.get(sid[0], {}).get("states", {}).get(sid, {})
                    secs = own.get(st)
                    if secs and all(is_round2(x) for x in secs):
                        r2state = True
            if keyed & prop_screens or r["est"] & prop_est or r2state:
                r["prop"] = True

    # ---- machine checks
    defined = set()
    for key in data:
        defined |= set(data[key]["screens"])
    refs = {}
    xstate_refs = []
    for key in data:
        for fname in ("design", "motion", "words"):
            for i, ln in enumerate(all_text[key][fname]):
                for m in ID_RE.finditer(ln):
                    refs.setdefault(m.group(1), set()).add(key)
                for m in SCREEN_STATE_RE.finditer(ln):
                    sid, st = m.group(1), m.group(2)
                    if st.endswith("-") or st.lower() in EXT_DENY:
                        continue
                    if sid[0] != key:
                        xstate_refs.append((sid, st, key, fname))
    undefined = sorted((s for s in refs if s not in defined), key=natkey)
    xstate_missing = {}
    for sid, st, key, fname in xstate_refs:
        owner = data.get(sid[0])
        if owner is None or sid not in owner["screens"]:
            continue
        if st not in owner["states"].get(sid, {}):
            xstate_missing.setdefault((sid, st), set()).add(key + " " + fname.upper() + ".md")
    motion_missing = {}
    for key in data:
        for mid, r in data[key]["motion"].items():
            for tok in r["states"]:
                if "." not in tok:
                    continue
                sid, st = tok.split(".", 1)
                if sid[0] != key or sid not in data[key]["screens"]:
                    continue
                if st not in data[key]["states"].get(sid, {}):
                    motion_missing.setdefault((key, mid), []).append(tok)
    return data, cat, all_text, undefined, xstate_missing, motion_missing


def fmt_cards(cards, prop_screen):
    seen, out = set(), []
    for c in sorted(set(cards), key=natkey):
        base = c.split("-R")[0] if False else c
        tag = c
        if re.match(r"NS-(51|52)\b", c):
            tag = c + " (PROPOSED)"
        out.append(tag)
    return ", ".join(out) if out else "see file"


def render(data, cat, all_text, undefined, xstate_missing, motion_missing):
    L = []
    w = L.append
    nt = {k: sorted({t for r in data[k]["motion"].values() for t in r["t"]}) for k in data}

    w("# End-to-end design: master index (screens, states, transitions, motion), areas A to E")
    w("")
    w("Status: rebuilt %s by the area E design lead, by script (`docs/design/e2e/tools/build-index.py`), from the area folders as committed after areas A, C and D were re-keyed to the final pack with Round 2 (A a1e3fe80a, D 6ade48e26, C f0ad5be34; B and E as on disk). DRAFT: counts are machine counts, not reviews. Nothing in the area files was viewed in a browser or on a device. ASCII only. This file lists; it never defines. Where it and an area file differ, the area file wins and the difference is in section 6." % BUILD_DATE)
    w("")
    w("How to read: screen ids `<area>-Snn` and state ids `<area>-Snn.<state>` are from each area `DESIGN.md` (inventory row, a `###` screen heading, and every `.state` the file names, see the script header for the exact rule); motion ids are each area's own scheme (A `MA-nn`, B `B-Mnn`, C `M-Cnn`, D `D-Mnn`, E `E-Mnn`); transitions `T-*` and primitives `m.*` are the system names of `docs/design/system/MOTION.md`. \"Card row\" is the NS ids named in the screen's inventory card column (or, for a screen with no inventory row, in the first paragraph under its heading). Round 2 ids (NS-51, NS-52 and every id defined under a Round 2 or PROPOSED section) are marked PROPOSED: their cards (`27-photo-moments-and-media.md`) are not in the pack on disk, so they are keyed by card name and wait for a ruling. A state marked `[P]` is named only inside a Round 2 section. A state written as a plain word in prose, with no screen id and no leading dot, is not counted.")
    w("")

    # ---- section 1
    w("## 1. Counts")
    w("")
    w("| Area | Screen ids | of which PROPOSED | State ids | Motion ids | of which PROPOSED | T-* transitions used |")
    w("|---|---|---|---|---|---|---|")
    tot = [0, 0, 0, 0, 0]
    for key, folder, _ in AREAS:
        d = data[key]
        ns = len(d["screens"])
        nsp = sum(1 for s in d["screens"].values() if s["prop"])
        nst = sum(len(v) for v in d["states"].values())
        nm = len(d["motion"])
        nmp = sum(1 for r in d["motion"].values() if r["prop"])
        for k, v in enumerate((ns, nsp, nst, nm, nmp)):
            tot[k] += v
        w("| %s %s | %d | %d | %d | %d | %d | %s |" % (key, folder, ns, nsp, nst, nm, nmp, ", ".join(nt[key]) or "none"))
    w("| Total | %d | %d | %d | %d | %d | %s |" % (tot[0], tot[1], tot[2], tot[3], tot[4],
                                                 ", ".join(sorted({t for k in nt for t in nt[k]}))))
    ncp = sum(1 for c in cat.values() if c["prop"])
    w("| E catalogue | %d system state ids `E-ST..` (section 3), of which %d PROPOSED | | | | | |" % (len(cat), ncp))
    w("")
    w("Per-area detail of what the state count is made of is in the script's `--stdout` header comment, not here. A screen id that is only mentioned in prose, with no inventory row and no heading, is counted and marked so in its name.")
    w("")

    # ---- section 2
    w("## 2. Screens and states, by area")
    w("")
    for key, folder, _ in AREAS:
        d = data[key]
        w("### %s. %s" % (key, folder))
        w("")
        w("| Screen id | Screen | Card row | States named in the area file |")
        w("|---|---|---|---|")
        for sid in sorted(d["screens"], key=natkey):
            sc = d["screens"][sid]
            nm = cut(sc["name"], 120)
            sts = d["states"].get(sid, {})
            parts = []
            for st in sorted(sts, key=lambda s: s.lower()):
                secs = sts[st]
                r2only = bool(secs) and all(is_round2(x) for x in secs) and not sc["prop"]
                parts.append(st + ("[P]" if r2only else ""))
            idl = sid + (" (PROPOSED)" if sc["prop"] else "")
            w("| %s | %s | %s | %s |" % (idl, nm, fmt_cards(sc["cards"], sc["prop"]), ", ".join(parts) or "none named"))
        w("")

    # ---- section 3
    w("## 3. System state catalogue (area E, `E-STnn`, rendered by every area)")
    w("")
    w("| Id | State |")
    w("|---|---|")
    for sid in sorted(cat, key=natkey):
        c = cat[sid]
        nm = c["name"]
        nm = re.sub(r"\s*\(?PROPOSED\)?[,;]?", "", nm).strip() if False else nm
        flag = "" if "PROPOSED" in nm else (" (PROPOSED, round 2)" if c["prop"] else "")
        w("| %s | %s%s |" % (sid, nm, flag))
    w("")

    # ---- section 4
    w("## 4. Transitions (T-*) and the motion ids that use them")
    w("")
    w("| Transition | Areas and motion ids |")
    w("|---|---|")
    allt = sorted({t for k in nt for t in nt[k]})
    for t in allt:
        parts = []
        for key, _, _ in AREAS:
            ids = sorted((m for m, r in data[key]["motion"].items() if t in r["t"]), key=natkey)
            if ids:
                parts.append("%s: %s" % (key, ", ".join(ids)))
        w("| %s | %s |" % (t, "; ".join(parts)))
    w("")
    noT = {k: sum(1 for r in data[k]["motion"].values() if not r["t"]) for k in data}
    w("Motion ids with no T-* named in their own row (native, in place, or keyed in prose): " + ", ".join("%s %d of %d" % (k, noT[k], len(data[k]["motion"])) for k in data) + ".")
    w("")

    # ---- section 5
    w("## 5. Motion ids, by area")
    w("")
    for key, folder, _ in AREAS:
        w("### %s. %s" % (key, folder))
        w("")
        w("| Motion id | States keyed | T-* | m.* |")
        w("|---|---|---|---|")
        for mid in sorted(data[key]["motion"], key=natkey):
            r = data[key]["motion"][mid]
            w("| %s | %s | %s | %s |" % (mid + (" (PROPOSED)" if r["prop"] else ""),
                                          ", ".join(sorted(r["states"], key=natkey)) or "-",
                                          ", ".join(sorted(r["t"])) or "-",
                                          ", ".join(sorted(r["m"])) or "-"))
        w("")

    # ---- section 6
    w("## 6. Conflicts and gaps found at the last read (flagged, not resolved)")
    w("")
    w("### 6.1 Machine checks over the 15 area files (DESIGN, MOTION, WORDS)")
    w("")
    w("1. Screen ids referenced somewhere but defined in no inventory row, heading or prose mention of their own area: %s." % (", ".join(undefined) if undefined else "none"))
    items = sorted(xstate_missing.items(), key=lambda kv: (natkey(kv[0][0]), kv[0][1]))
    w("2. State names referenced from another area that the owning area DESIGN.md does not name: %d." % len(items))
    for (sid, st), where in items[:40]:
        w("   - `%s.%s` referenced by %s." % (sid, st, ", ".join(sorted(where))))
    if len(items) > 40:
        w("   - and %d more (run the script with --stdout and read the code in `build()`)." % (len(items) - 40))
    nmm = sum(len(v) for v in motion_missing.values())
    w("3. Motion rows that key a state their own area DESIGN.md does not name: %d keys in %d rows." % (nmm, len(motion_missing)))
    byarea = {}
    for (key, mid), toks in sorted(motion_missing.items(), key=lambda kv: natkey(kv[0][1])):
        byarea.setdefault(key, []).append("%s %s" % (mid, "/".join(sorted(set(toks), key=natkey))))
    for key in sorted(byarea):
        lst = byarea[key]
        w("   - %s (%d rows): %s" % (key, len(lst), "; ".join(lst[:30]) + ("; and %d more" % (len(lst) - 30) if len(lst) > 30 else "")))
    w("")

    w("### 6.2 Contradictions the areas flagged in their own DESIGN.md (copied by the script, cut at 420 characters; the area file wins)")
    w("")
    A = all_text["A"]["design"]
    B = all_text["B"]["design"]
    C = all_text["C"]["design"]
    D = all_text["D"]["design"]
    E = all_text["E"]["design"]

    def emit(title, rows):
        w("**%s**" % title)
        w("")
        if not rows:
            w("- (none found by the script)")
        for r in rows:
            w("- " + cut(r, 420))
        w("")

    a_rows = []
    for ln in section_lines(A, r"^11\.3 Contradictions"):
        if re.match(r"^\d+\.\s", ln):
            a_rows.append("A 11.3 item " + ln)
    for ln in section_lines(A, r"^12\. Round 2"):
        if ln.startswith("Status:"):
            a_rows.append("A 12 (Round 2) " + ln)
            break
    sec125 = section_lines(A, r"^12\.5 ")
    if sec125:
        a_rows.append("A 12.5 " + " ".join(x for x in sec125 if x.strip())[:900])
    for cid, txt in table_rows(section_lines(A, r"^13\. Open design questions"), r"Q-A\d+", r"photo|moment|picture|video|direction 26"):
        a_rows.append("A 13 %s: %s" % (cid, txt))
    emit("Area A (DESIGN 11.3, 12, 13)", a_rows)

    b_rows = []
    for ln in numbered_after(B, r"^Contradictions with a product ruling"):
        b_rows.append("B 14 item " + ln)
    sec15f = section_lines(B, r"^15f\.")
    for cid, txt in table_rows(sec15f, r"(Q|OQ|B)-?\w+\d*"):
        b_rows.append("B 15f %s: %s" % (cid, txt))
    emit("Area B (DESIGN 14, 15f)", b_rows)

    c_rows = []
    for cid, txt in table_rows(section_lines(C, r"^15\. Contradictions"), r"X\d+"):
        c_rows.append("C 15 %s: %s" % (cid, txt))
    for cid, txt in table_rows(section_lines(C, r"^18\. Open design questions"), r"OQ-\d+", r"round 2|photo|moment|Q-PM"):
        c_rows.append("C 18 %s: %s" % (cid, txt))
    emit("Area C (DESIGN 15 X1 to X7, 18 round 2 rows)", c_rows)

    d_rows = []
    for ln in section_lines(D, r"^15\. Contradictions"):
        if re.match(r"^\d+\.\s", ln):
            d_rows.append("D 15 item " + ln)
    for cid, txt in table_rows(section_lines(D, r"^17\. Open design questions"), r"Q-D-R\d+"):
        d_rows.append("D 17 %s: %s" % (cid, txt))
    emit("Area D (DESIGN 15, 17 round 2 rows)", d_rows)

    e_rows = []
    for cid, txt in table_rows(section_lines(E, r"^17\. Contradictions"), r"X-\d+"):
        e_rows.append("E 17 %s: %s" % (cid, txt))
    for cid, txt in table_rows(section_lines(E, r"^18\. Open design questions"), r"D-\d+", r"photo|picture|video|haptic|Q-PM|primer"):
        e_rows.append("E 18 %s: %s" % (cid, txt))
    emit("Area E (DESIGN 17, 18 photo and haptic rows)", e_rows)

    w("### 6.3 Differences between areas that this read found (flagged, not resolved)")
    w("")
    for ln in DIFFS:
        w(ln)
    w("")

    # ---- section 7
    w("## 7. Round 2 ids (photo moments and media; PROPOSED, flagged; key to NS-51 and NS-52 row ids when `27-photo-moments-and-media.md` lands)")
    w("")
    w("Read from the area files. Every area now has a Round 2 section (A 12, B 15, C 17, D 16, E 15a).")
    w("")
    w("| Proposed id | Area | What | Where defined |")
    w("|---|---|---|---|")
    for key, folder, _ in AREAS:
        for sid in sorted(data[key]["screens"], key=natkey):
            sc = data[key]["screens"][sid]
            if sc["prop"]:
                w("| %s | %s | %s | %s DESIGN.md line %d (%s) |" % (sid, key, cut(sc["name"], 100), key, sc["line"] + 1, sc["how"]))
    for key, folder, _ in AREAS:
        for sid in sorted(data[key]["screens"], key=natkey):
            sc = data[key]["screens"][sid]
            if sc["prop"]:
                continue
            r2 = [st for st, secs in data[key]["states"].get(sid, {}).items() if secs and all(is_round2(x) for x in secs)]
            if r2:
                w("| %s states %s | %s | states named only in a Round 2 section | %s DESIGN.md |" % (
                    sid, ", ".join("`.%s`" % s for s in sorted(r2, key=str.lower)), key, key))
    pst = sorted((s for s, c in cat.items() if c["r2"]), key=natkey)
    if pst:
        w("| %s | E | system states for media and moments (E-ST48 and E-ST49 are also PROPOSED, but from the final pack, not Round 2) | E DESIGN.md 15a.2 |" % (pst[0] + (" to " + pst[-1] if len(pst) > 1 else "")))
    for key, folder, _ in AREAS:
        ids = sorted((m for m, r in data[key]["motion"].items() if r["prop"]), key=natkey)
        if ids:
            w("| %s | %s | motion rows keyed to a PROPOSED screen, a Round 2 state or a Round 2 E-ST (all ids listed) | %s MOTION.md |" % (", ".join(ids), key, key))
    w("| NS-51, NS-52 | all | the cards are not in the pack on disk; rows key by card name | `docs/product/prd/26-founder-direction-photos-library-and-media.md` |")
    w("")
    w("Overlap to settle (flagged): the Photos permission journey is drawn in four places: A-S18 (the ask, in area A), E-S32 (the primer step and the permission order, E DESIGN 15a.1), C-S27 (where the parent turns moments on, limits it or removes the index) and A-S17 (the Moments sheet the ask leads to). Default in the area files: one `PermissionPrimer` component (E DESIGN 15a.3), one set of door lines; A-S18 and E-S32 describe the same sheet, and which id survives is not ruled here.")
    w("")

    # ---- section 8
    w("## 8. Notes from the last read (manual, beyond the machine checks)")
    w("")
    for ln in NOTES:
        w(ln)
    return ascii_only("\n".join(L) + "\n")


DIFFS = [
    "1. Round 2 conflict with the earlier packs: area A (12 intro) says its sections 1 to 11 still describe level 3 (library access) as closed and one picture per letter, which founder direction 26 reverses; area E (17 X-1, X-10) says the same of E-S28. Areas A to E each key the Round 2 work to NS-51 and NS-52 by name, because the cards are not on disk.",
    "2. Round 2 invitation on Home: area A (12.5) refuses a slip or tile for the moments invitation (NS-50-R10, R-IA-3) and draws it as the third item of the photo start's menu; area D (16.3) says the tap lands on plain Home and the invitation is A-S17; area B (15d) draws nothing in the Book. These three agree with each other; the founder's \"in the capture area\" wording is the open point (A Q-A7).",
    "3. Slip position: E DESIGN 17 X-6 is marked closed (area A draws the one slot above the prompt block), but area A keeps Q-A1 open (above, unless an SE 3 check says otherwise) and area E D-6 still says area A to confirm; area B Q-B1 follows whatever A draws. Not closed in one place.",
    "4. First Keep haptic (E DESIGN X-2, D-8): the card (NS-44-R12) says success once; the system motion file says none. Not resolved here.",
    "5. Motion id schemes differ by area (`MA-nn`, `B-Mnn`, `M-Cnn`, `D-Mnn`, `E-Mnn`). Default: leave them, since every area keys to its own; this index maps them.",
    "6. Area D's MOTION.md now keys T-* and m.* in its section 13.1 as a numeric table (`02, 08` for D-M02 and D-M08); the script expands those, so D has a T-* column. A row there that names a number with no D-M row of its own would still count as an id.",
    "7. Ids for \"If you are struggling\" and \"Lines in other countries\" are E-S30 and E-S31 (not ruled by K9; E DESIGN D-2).",
    "8. Area D's reminder side of NS-51 keeps its own id D-S27 and states `.photoMomentsOn`, `.photoMomentsOff`, `.photoMomentsLimited`; the lock-screen renderings `photoMoment`, `photoMoment-plain` and the others belong to D-S10 and are written without a leading dot in D DESIGN 16.2 (so the script does not count them as D-S10 states), while the tap landing is one state with one owner: D-S11 `.photoMoment` (D DESIGN 16.2, Tap). Both sections of this index name it that way.",
    "9. Area C 15 X1: the line `culture.delete.line` (days stay on phones) against NS-47-R17 (this phone clears the store at once) and NS-45-R10 (\"just as they were\"). Area D 15 item 3 (NS-47-R14 against R37) and area A 11.3 item 7 (NS-47-R29 wording) flag neighbouring NS-47 rows.",
]

NOTES = [
    "1. This index was generated by reading the area folders as committed on branch `docs/e2e-ux-20nov`; areas may still be editing. Re-run `python3 -I docs/design/e2e/tools/build-index.py` before relying on a count.",
    "2. Counts are machine counts of tokens. A screen heading with no inventory row (C-S27) is read from its `###` heading; an id only named in prose (for example D-S27) is counted and marked. A state named only in words (no `.` prefix, no screen id on the line) is not counted. Table rows that repeat an id in a later integration table do not add states unless the state token is on the row.",
    "3. Motion ids: a row counts when its first cell is one id or a comma list of ids in the area scheme. A moment described only in prose, with no table row and no heading, is not counted. Several areas keep a second key table (area D 13.1, area E 4z) that adds T-* and m.* to ids defined elsewhere; the script merges them.",
    "4. Area B and area E were not re-keyed in this round; their files are as committed earlier (B 8585858e3, E deda71116 plus later edits on disk). Their counts are the same method, not a new review.",
    "5. T-INLINE (C, M-C75 and M-C76) is named only by area C, which marks it PROPOSED; T-SLIP (A, C) is not in `docs/design/system/MOTION.md` either (checked by grep on 20 Nov: the system file names T-ALERT, T-COVER, T-GATE, T-KEEP, T-LAUNCH, T-LOCK, T-MENU, T-MIN, T-PAGE, T-PUSH, T-RESUME, T-RUN, T-SHEET, T-STEP, T-SYSLINE, T-TAB, T-ZOOM). No area row uses T-RUN.",
    "6. Slip order is the same in every area that states it: 1 waiting set, 2 seal-opened, 2b day slip, 3 Save a copy, 3b Days ask, 4 past letter (RV-5, RV-6).",
]


def main():
    args = sys.argv[1:]
    data, cat, all_text, undefined, xm, mm = build()
    out = render(data, cat, all_text, undefined, xm, mm)
    if NONASCII_SEEN:
        sys.stderr.write("non-ascii characters replaced: %s\n" % ", ".join("U+%04X x%d" % (ord(k), v) for k, v in sorted(NONASCII_SEEN.items())))
    if "--stdout" in args:
        sys.stdout.write(out)
        return 0
    if "--check" in args:
        with open(OUT, encoding="utf-8") as fh:
            same = fh.read() == out
        sys.stderr.write("INDEX.md is %s\n" % ("current" if same else "STALE"))
        return 0 if same else 1
    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(out)
    for key, folder, _ in AREAS:
        d = data[key]
        sys.stderr.write("%s: screens %d (proposed %d), states %d, motion %d, T-* %s\n" % (
            key, len(d["screens"]), sum(1 for s in d["screens"].values() if s["prop"]),
            sum(len(v) for v in d["states"].values()), len(d["motion"]),
            ",".join(sorted({t for r in d["motion"].values() for t in r["t"]}))))
    sys.stderr.write("E-ST: %d\n" % len(cat))
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Tests for p0.py. Run: python3 -I docs/product/prd/tools/review/p0_test.py
Builds a tiny fake repo in a temp directory (fictional family only) and checks the four fixes of 21 Nov 2026:
four-digit BL ids, function-file ids and ranges in a Satisfies line, the engineering plan (17) not read as requirements,
and the --map / --check-map pair.
"""
import os, sys, tempfile, unittest, subprocess, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('p0', os.path.join(HERE, 'p0.py'))
p0 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p0)

CARD = """# NS-90 test card
| Row | Statement | Priority |
|---|---|---|
| NS-90-R1 | a row | P0 |
| NS-90-R2 | a row | P0 |
"""
FUNC = """# test function file
| Id | Statement | Priority |
|---|---|---|
| FR-ABC-01 | a | P0 |
| FR-ABC-02 | b | P0 |
| FR-ABC-03 | c | P0 |
| FR-ABC-04 | d | P0 |
| FR-ABC-05 | e | P1 |
"""
PLAN = """# plan
| Id | Item | Priority |
|---|---|---|
| J-N1 | a work item, not a requirement | P0 |
"""
BACKLOG = """# Backlog
## Section
#### BL-1021 A four-digit row
- Status: proposed (somewhere). Mode: agent. Owner: founder. Milestone: M15. Size: S.
- Satisfies: NS-90-R1.

#### BL-500 A three-digit row
- Status: ready. Mode: agent. Owner: founder. Milestone: M15. Size: S.
- Satisfies: FR-ABC-01 to FR-ABC-02.

#### BL-126 A group row
- Status: proposed (docs/product/prd/BACKLOG-GAPS.md G01; Karma sets it to ready). Mode: agent. Owner: founder. Milestone: M15. Size: S.
- Satisfies: 1 P0 rows with no backlog row: FR-ABC-04, NS-90-R2.
"""


def make(root):
    base = os.path.join(root, 'docs/product/prd')
    os.makedirs(os.path.join(base, 'functions'))
    for name, text in (('90-card.md', CARD), ('17-engineering-project-plan.md', PLAN)):
        open(os.path.join(base, name), 'w').write(text)
    open(os.path.join(base, 'functions/test.md'), 'w').write(FUNC)
    open(os.path.join(root, 'docs/BACKLOG.md'), 'w').write(BACKLOG)


class P0Test(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        make(self.tmp.name)
        # the card number 90 is above the 27 the tool reads, so use 05 for the card
        base = os.path.join(self.tmp.name, 'docs/product/prd')
        os.rename(os.path.join(base, '90-card.md'), os.path.join(base, '05-card.md'))
        self.out, self.blocks = p0.analyse(self.tmp.name)
        self.tier = {r['id']: r['tier'] for r in self.out}
        self.bl = {r['id']: r['bl'] for r in self.out}

    def tearDown(self):
        self.tmp.cleanup()

    def test_four_digit_heading_is_a_backlog_row(self):
        self.assertIn('BL-1021', self.blocks)
        self.assertEqual(self.tier['NS-90-R1'], 'row')
        self.assertEqual(self.bl['NS-90-R1'], ['BL-1021'])

    def test_function_file_range_in_a_satisfies_line(self):
        self.assertEqual(self.tier['FR-ABC-01'], 'row')
        self.assertEqual(self.tier['FR-ABC-02'], 'row')
        self.assertEqual(self.tier['FR-ABC-03'], 'gap')

    def test_group_row_maps_but_is_not_counted_as_covered(self):
        self.assertEqual(self.tier['FR-ABC-04'], 'proposed')
        self.assertEqual(self.bl['FR-ABC-04'], ['BL-126'])
        self.assertEqual(self.tier['NS-90-R2'], 'proposed')

    def test_engineering_plan_rows_are_not_requirements(self):
        self.assertNotIn('J-N1', self.tier)
        self.assertEqual(len(self.out), 6)

    def test_map_lists_every_p0_id_and_check_map_catches_a_gap(self):
        cmd = [sys.executable, '-I', os.path.join(HERE, 'p0.py'), self.tmp.name, '--map']
        text = subprocess.run(cmd, capture_output=True, text=True, check=True).stdout
        self.assertEqual(len([l for l in text.split('\n') if l.startswith('| NS-') or l.startswith('| FR-')]), 6)
        path = os.path.join(self.tmp.name, 'map.md')
        open(path, 'w').write(text)
        bad = subprocess.run(cmd[:-1] + ['--check-map', path], capture_output=True, text=True)
        self.assertEqual(bad.returncode, 1)  # FR-ABC-03 maps to nothing
        self.assertIn('mapped to nothing: FR-ABC-03', bad.stdout)
        open(path, 'w').write(text.replace('| FR-ABC-03 | functions/test.md | - |', '| FR-ABC-03 | functions/test.md | BL-500 |'))
        ok = subprocess.run(cmd[:-1] + ['--check-map', path], capture_output=True, text=True)
        self.assertEqual(ok.returncode, 0, ok.stdout)
        open(path, 'w').write(text.replace('| FR-ABC-03 | functions/test.md | - |', '| FR-ABC-03 | functions/test.md | BL-9999 |'))
        missing = subprocess.run(cmd[:-1] + ['--check-map', path], capture_output=True, text=True)
        self.assertEqual(missing.returncode, 1)
        self.assertIn('BL-9999, which has no heading', missing.stdout)


if __name__ == '__main__':
    unittest.main()

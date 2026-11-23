# Proposed: a "Model change" section for `.github/pull_request_template.md` (FR-AIS-15)

`.github/` is a CODEOWNERS path (`/.github/ @thesaurabhpareek`), so an agent cannot edit the template. The section below is the proposal; Karma places it through the path CR-73 names. `apps/mobile/test/model-change-record.test.ts` already fails on any model or tier-mapping change until the pin is updated in the same PR.

```
## Model change (only when a speech model file, revision, quantisation or tier mapping changed)

- [ ] Licence record (FR-AIS-09): licence, URL, date read, training-data terms question, bytes, hash, pinned revision
- [ ] Gate report numbers for every language the model serves (FR-AIS-36), from `npm run gate`
- [ ] Drift report, if `ENGINE_VERSION` changed
- [ ] Size delta in bytes against the model it replaces
- [ ] On-device memory and speed rows (FR-AIS-42 to 44)
- [ ] Whether the pack manifest version rose
- [ ] The model scores no lower than the one it replaces on any gating row (a lower score is refused; an equal score is not shipped for its own sake)
```

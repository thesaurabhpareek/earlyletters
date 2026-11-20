## Review A at 0b18ea30ea085a79d8cb3eac09fe36af96fbb184: PASS
<!-- agent:principal-architect -->

Lens A: correctness of the wording. Second review; the first (at `beccb8e6`) asked for wording that #853 supports. 1 file, +3 -1 against develop, comment only (`.github/workflows/kill-harness.yml:189-191`).

Must fix: none.

### What I checked
- Delta `beccb8e6..0b18ea30`: the three comment lines only. The cache key, restore keys and every step are unchanged; the YAML structure is the same (comment lines at the step's indent).
- Each clause of the new comment:
  - "The same key as ios-compile.yml": the `key:` and `restore-keys:` at `kill-harness.yml:198-200` match `ios-compile.yml:145-147` on develop. Holds.
  - "pod install corrects a near miss": kept from the old line; a restore-key hit followed by `pod install` (`:202-204`). Holds.
  - "The key leaves out the app env and eas.json": the key hashes `package-lock.json`, `apps/mobile/app.config.ts`, `apps/mobile/modules/**/*.podspec` and `apps/mobile/ios/Podfile.properties.json` only. Holds.
  - "When pod install installs or updates any pod, CocoaPods cleans every pod folder and deletes React-Core-prebuilt's flavour marker (#853)": the cause #853's body states (CocoaPods 1.17.0 `installer.rb:639-643`, `path_list.rb:146`). Holds.
  - "ios-compile.yml's compile job switches the prebuilt core back to Debug after pod install": the step "React Native prebuilt core and dependencies in their Debug flavour" follows `pod install` in the `compile` job on develop (`ios-compile.yml:149` then `:162`), merged with #853. Holds.
- The unproven claim from the first head (that the Pods depend on the app env) is gone. The new text makes no claim either way, which fits #853's evidence (a control pair with the same entry, the same env and different outcomes).

### Notes
1. Info. The comment does not say that this job's own Release build is safe after a marker loss. That is true (with no marker under Release, React Native's script extracts Release, per review 853-A mock case 8), and the comment does not need it.

### Not verified
- The kill-harness run at this head: `e2e simulator app` was still queued. A comment change cannot alter it.

CI at this head (12:31 UTC): `required`, `tests and content rules`, `typecheck`, `database rules`, Deno, B-8, `sizes for this run` success; `e2e simulator app (e2e profile, Release, seam on)` queued (macOS). The head was more than 10 minutes old when I finished.

Reviewer: independent of the author (CR-44).

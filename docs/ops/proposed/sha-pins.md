# Proposed SHA pins for the 17 tag-pinned `uses:` lines (HV2-B20 part b)

Status: proposal, 1 Nov 2026. Nothing under `.github/` is changed by this pull request (D-124, CR-22). Founder applies on or after 10 Nov.

## Result: all 17 are U (not resolved)

I tried to resolve each tag with the REST API:

```
gh api repos/actions/checkout/git/ref/tags/v4 --jq '.object.type+" "+.object.sha'
gh api repos/actions/setup-node/git/ref/tags/v4 ...
gh api repos/actions/cache/git/ref/tags/v4 ...
gh api repos/actions/upload-artifact/git/ref/tags/v4 ...
```

Every call returned HTTP 403: "GitHub access to this repository is not enabled for this session. Use add_repo to request access." This session may read only `thesaurabhpareek/earlyletters`. I did not look for another route to the same data (a git protocol listing, a web page, a mirror), because the block is a permission boundary, not a fault. So no SHA below is claimed from a resolved tag.

To finish it (one minute, any session with read access to public repos), run per action, and if `.object.type` is `tag` (annotated), dereference once more with `gh api repos/<owner>/<repo>/git/tags/<sha> --jq .object.sha`:

```
for r in checkout setup-node cache upload-artifact; do
  gh api repos/actions/$r/git/ref/tags/v4 --jq '"'$r' "+.object.type+" "+.object.sha'
done
```

Floating major tags like `v4` move. Pin to a full release tag (for example `v4.2.2`) and write that in the comment, so the pin is reviewable.

## The 17 lines (develop at `246debbd`; line numbers match the list in the header of `scripts/ci/workflow-lint.mjs` on #553)

Re-derived with `git grep -n "uses:" origin/develop -- .github/workflows`, dropping `./` and 40-hex pins.

| # | File:line | Current text | Tag | SHA |
|---|---|---|---|---|
| 1 | `ci.yml:31` | `- uses: actions/checkout@v4` | v4 | U |
| 2 | `ci.yml:32` | `- uses: actions/setup-node@v4` | v4 | U |
| 3 | `ci.yml:38` | `uses: actions/cache@v4` | v4 | U |
| 4 | `ci.yml:55` | `- uses: actions/checkout@v4` | v4 | U |
| 5 | `ci.yml:70` | `- uses: actions/checkout@v4` | v4 | U |
| 6 | `ci.yml:81` | `- uses: actions/checkout@v4` | v4 | U |
| 7 | `ci.yml:92` | `- uses: actions/checkout@v4` | v4 | U |
| 8 | `migration-guard.yml:20` | `- uses: actions/checkout@v4` | v4 | U |
| 9 | `migration-guard.yml:23` | `- uses: actions/setup-node@v4` | v4 | U |
| 10 | `web-e2e.yml:43` | `- uses: actions/checkout@v4` | v4 | U |
| 11 | `web-e2e.yml:45` | `- uses: actions/setup-node@v4` | v4 | U |
| 12 | `web-e2e.yml:50` | `uses: actions/cache@v4` | v4 | U |
| 13 | `web-e2e.yml:61` | `uses: actions/cache@v4` | v4 | U |
| 14 | `web-e2e.yml:77` | `uses: actions/upload-artifact@v4` | v4 | U |
| 15 | `web.yml:52` | `- uses: actions/checkout@v4` | v4 | U |
| 16 | `web.yml:54` | `- uses: actions/setup-node@v4` | v4 | U |
| 17 | `web.yml:61` | `uses: actions/cache@v4` | v4 | U |

Four distinct actions: `actions/checkout` (8 lines: 1, 4, 5, 6, 7, 8, 10, 15), `actions/setup-node` (4: 2, 9, 11, 16), `actions/cache` (4: 3, 12, 13, 17), `actions/upload-artifact` (1: 14). That is 17.

## Pins already on develop, from other lines in the same repo (not resolved by me)

These are 40-hex pins other workflows already carry, so reusing them keeps the repo on one version per action and needs no new lookup. I copied them from `git grep` output; I did not check them against the tags.

| Action | Pin on develop | Seen at |
|---|---|---|
| `actions/checkout` | `3d3c42e5aac5ba805825da76410c181273ba90b1` # v7.0.1 | `ci.yml:113` and 22 other lines |
| `actions/setup-node` | `820762786026740c76f36085b0efc47a31fe5020` # v7.0.0 (14 lines); `49933ea5288caeca8642d1e84afbd3f7d6820020` # v4.4.0 (3 lines, including `.github/actions/setup/action.yml`) | various |
| `actions/cache` | `55cc8345863c7cc4c66a329aec7e433d2d1c52a9` # v6.1.0 | 6 lines |
| `actions/upload-artifact` | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` # v7.0.2 | 7 lines |

Choosing these moves the 17 lines from v4 to v7, v6 and v7. Major bumps change the runtime and some inputs; `actions/cache` v6 and `actions/upload-artifact` v7 are already in use here, so the inputs in these 17 steps are the ones to check. The conservative choice is the v4 SHA from the call above, with the exact release in the comment.

## How to verify after applying

`node scripts/ci/workflow-lint.mjs` (from #553) must print nothing and exit 0.

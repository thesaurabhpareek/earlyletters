# Proposed: nightly host-reachability check (BL-414)

Status: proposal. A workflow edit belongs to the founder and `platform`; this file changes nothing by itself.

## Status of this patch
This job has NOT been run. Nothing here was executed in CI or locally.

The workflow uses two third-party actions, `actions/checkout` and `actions/setup-node`. When the workflow is created, pin each by full commit SHA, not by the `@v4` tag shown here.

## Why
BL-414 asks for a nightly check that every hosted speech model URL still answers. The CI test `apps/mobile/test/network-allowlist.test.ts` only proves which hosts the code names, not that they are up.

## Patch for `.github/workflows/nightly.yml` (new job)
```yaml
  model-hosts:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - name: HEAD every hosted model url and mirror
        run: |
          npx tsx -e "
          import { SPEECH_MODELS } from './apps/mobile/src/lib/models/catalog';
          let bad = 0;
          for (const m of Object.values(SPEECH_MODELS)) {
            if (!m.hosted) continue;
            for (const u of [m.url, ...m.mirrors]) {
              const r = await fetch(u, { method: 'HEAD', redirect: 'follow' });
              const len = Number(r.headers.get('content-length') ?? 0);
              console.log(r.status, len, u);
              if (!r.ok || (len && len !== m.bytes)) bad++;
            }
          }
          process.exit(bad ? 1 : 0);
          "
```
The job gets a read-only token (`permissions: contents: read`, BL-1477); nothing else is granted to it. No secret is used. The job sends only a file request to the model hosts, the same request a phone makes.

## Not included
The mirror host itself: see the PR body (founder decision, D-046 and D-097).

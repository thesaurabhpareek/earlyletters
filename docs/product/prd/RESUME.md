# Resume sheet for the product pack (20 Nov)

Status: LOCKED 20 Nov 2026, requirements rev 2 (cards 00 to 27, function files, design areas A to E). Founder, 20 Nov: "Go with all default answers. Focus on what's best for customer experience. And proceed to lock all requirements and once done inform harness and engg leads working on architecture." Changes only by an errata row (next free E number in `18-errata-after-lock.md`, highest E32); no duplicate copies; rulings by id in `GAP-LOG.md` "Closures 20 Nov"; what remains is execution-side (`22-final-holistic-spec.md` section 10). Remaining threads below are execution-side or historical; the closures are applied in place (`GAP-LOG.md` "Closures 20 Nov").

If a usage limit or outage stops any session, restart at 03:01 Pacific (founder, 19 Nov). Anything not pushed is lost, so every thread pushes to `docs/locked-pack-inputs-20nov` (product) or `docs/e2e-ux-20nov` (design) at least every 30 minutes. No force push. Do not move the head of #846.

## Threads to restart
- FUNCTION-TRACE builder: writes `docs/product/prd/FUNCTION-TRACE.md`.
- Second-wave reviews, each one file in `docs/product/prd/functions/`: print-and-fulfilment, back-office, messaging-and-entry-points, languages-and-localisation, reliability, ai-and-speech, research-validation, quality, lifecycle-and-platforms.
- Integration (product session): re-run the trace over all 17 function files, rule conflicts in GAP-LOG, route engineering rows to #846, send design leads their "Function needs accounted for", rebuild the PDF and upload to Drive.

## Harness
Agent PRs label `agent:<handle>`; they never merge. New BL rows only up to BL-999 until the dispatcher id format is fixed.

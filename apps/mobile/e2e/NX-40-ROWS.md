# NX-40 rows: happy paths H1 to H9 and edge cases U1 to U15 (BL-894)

Source: `docs/roadmap/next/03-requirements/NX-40-first-run-and-sign-in.md` (sections 4 and 6; superseded as requirements by NS-38 to NS-45, but BL-894 still cites it). Owner of this file: `qa`. `apps/mobile/test/nx-40-rows.test.ts` reads the table below on every `npm test`: every row must exist once, every named file must exist, and a row with no flow and no test must name a device row and a person.

Kinds of proof in the `Proof` column, separated by `;`: `flow:<file in e2e/flows>`, `test:<file in apps/mobile/test>`, `device:<S1-nn heading in docs/qa/DEVICE_TEST_PLAN.md>`, `parked:<reason>`. State: `covered` (a flow or a test states the row), `partial` (part is stated, the rest is a device row), `device` (only a person with a phone can prove it), `parked` (not built).

The mapping names the nearest proof; it was matched by file and title, not step by step. A `partial` row is an honest gap, not a pass.

| Row | State | Proof | Owner |
|---|---|---|---|
| H1 | partial | flow:E2E-01b-age-gate-yes.yaml; flow:E2E-04-type-a-letter.yaml; test:first-run-new-account.test.ts; device:S1-201 | qa keeps; founder runs the device row |
| H2 | parked | parked:the story intro is parked by NS-39-R12 (BL-893 not carried) | product |
| H3 | partial | flow:E2E-12-sign-in-email.yaml; test:first-run-code-consent-child.test.ts; device:S1-08 | qa keeps; founder runs the device row |
| H4 | device | test:auth-apple-ns54.test.ts; device:S1-06 | founder (needs a real Apple Account) |
| H5 | covered | flow:E2E-20-providers-build12.yaml; test:nx-40-build12-providers.test.ts | qa |
| H6 | partial | test:first-run-route.test.ts; device:S1-204 | qa keeps; founder runs the device row |
| H7 | device | test:app-lock-machine.test.ts; device:S1-131 | founder (Face ID needs a phone) |
| H8 | device | test:app-lock-machine.test.ts; device:S1-131 | founder (Face ID needs a phone) |
| H9 | partial | test:auth-force-reauth.test.ts; device:S1-27 | qa keeps; founder runs the device row |
| U1 | partial | test:first-run-offline.test.ts; device:S1-201 | qa keeps; founder runs the device row |
| U2 | partial | test:first-run-welcome.test.ts; device:S1-201 | qa keeps; founder runs the device row |
| U3 | partial | test:first-run-code-consent-child.test.ts; test:auth-machine.test.ts; device:S1-202 | qa keeps; founder runs the device row |
| U4 | partial | test:first-run-new-account.test.ts; device:S1-203 | qa keeps; founder runs the device row |
| U5 | partial | test:account-deletion-two-phone.test.ts; device:S1-35 | qa keeps; founder runs the device row |
| U6 | covered | test:auth-region-refused.test.ts | qa |
| U7 | covered | flow:E2E-01a-age-gate-no.yaml; test:age-gate-screen.test.ts | qa |
| U8 | device | test:auth-apple-ns54.test.ts; device:S1-06 | founder (mail to a relay address must arrive) |
| U9 | partial | test:first-run-route.test.ts; device:S1-13 | qa keeps; founder runs the device row |
| U10 | partial | test:first-run-gate.test.ts; device:S1-204 | qa keeps; founder runs the device row |
| U11 | partial | test:first-run-wait.test.ts; device:S1-23 | qa keeps; founder runs the device row |
| U12 | device | flow:E2E-15-voiceover-smoke.yaml; test:a11y-controls.test.ts; device:S1-23 | founder (VoiceOver walk) |
| U13 | partial | test:deep-link.allowlist.test.ts; device:S1-09 | qa keeps; founder runs the device row |
| U14 | device | device:S1-202 | founder (a call or the mail app trip needs a phone) |
| U15 | partial | test:app-lock-machine.test.ts; device:S1-131 | qa keeps; founder runs the device row |

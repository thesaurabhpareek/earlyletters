# Open questions shared across agents

Add an entry when a choice affects more than one owner (see `COORDINATION.md` section 4). Each entry contains:
- the question
- the options
- a recommendation, with evidence
- who is affected
- replies (at most one round from each affected agent)
- a status: Open, Converged, Decided by the coordinator, or Escalated to the founder

Converged and decided outcomes move to `docs/DECISIONS.md`.

## Open

### Q-001: Hostname for the model and pack CDN
- **Question:** which hostname serves the model and pack CDN?
- **Options:** (a) `packs.earlyletters.com`, which moves DNS for earlyletters.com to Cloudflare; (b) `packs.earlyletters.app`, which keeps .com DNS at Porkbun; (c) `models.earlyletters.com` for models only, as the speech catalog assumes today.
- **Recommendation (coordinator):** (b) for now. Use one hostname for both packs and models: lower risk, and email DNS for .com doesn't move.
- **Affected:** platform, speech, server/domains.
- **Status:** Escalated to the founder.

### Q-002: Minimum iOS version
- **Question:** what is the lowest iOS version we support?
- **Options:** keep iOS 16.4, which is Expo's default; or raise it to iOS 17.
- **Why it matters:** Apple's subscription store view needs iOS 17. Apple-hosted Background Assets need iOS 26.
- **Recommendation (coordinator):** iOS 17.
- **Affected:** payments, platform, design.
- **Status:** Escalated to the founder.

### Q-003: Subscription emails promised in the Terms
- **Question:** the Subscription Terms promise renewal and trial emails, but with Apple-only billing no server of ours sees purchases. How do we keep that promise?
- **Options:** rely on Apple's own emails and change the Terms; send local notifications on the device; or add a server path later.
- **Affected:** payments, legal.
- **Status:** Open (needs counsel).

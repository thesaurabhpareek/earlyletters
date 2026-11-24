# Customer writing benchmarks, round 2 (21 Nov 2026)

Status: DRAFT for review. Owner: `content`. Docs only: nothing here changes the guide, `CLAUDE.md` or any shipped line.

Scope: Wise, Stripe, Material Design (writing), Shopify Polaris (content), Headspace, Calm, Duolingo, Intercom and Day One. Round 1 (Apple HIG Writing, Monzo, Mailchimp, Atlassian, Microsoft) is in Appendix A of `packages/content/WRITING-GUIDE.md`; GOV.UK and Google developer docs were read separately and are not redone here.

Compared against: `packages/content/WRITING-GUIDE.md` v1.2 on branch `docs/content-guide-v1.2` (the task named it `docs/content-guide-v12`; that ref does not exist, v1.2 is the branch that does), and the constitution in `CLAUDE.md`: never imply AI writes, no streaks, guilt or gap counts, never gender the child, no wit on errors, money, deletion, safety or grief.

Method: every page below was fetched in this session with WebFetch or found with WebSearch. Page text was summarised by the fetch tool, so every lesson is a paraphrase of a summary, not a reading of raw HTML. Anything I could not read is marked UNVERIFIED. Where a site blocked or hid its text I stopped and did not look for a way around it. At most one short quote per source.

## 1. Read status at a glance

| Brand | Guidance page read? | Result |
| --- | --- | --- |
| Wise | No | BLOCKED. Two wise.com pages returned a client error; wise.design served only a "requires JavaScript" shell. Nothing about Wise's tone is verified. |
| Stripe | Partly | Stripe Apps design and style pages and the error-handling page read. No customer-writing or voice section found. Writing guidance UNVERIFIED. |
| Material Design | Yes (Material 1 and the Material codelab) | The Material 3 content-design page needs JavaScript and was not readable. |
| Shopify Polaris | Yes (voice and tone, content overview on shopify.dev) | `polaris.shopify.com/content/*` redirects to a Polaris API index with no content guidance. Error-message and actionable-language pages UNVERIFIED. |
| Headspace | No guidance page | `design.headspace.com` blocked automated access (robots.txt). Read only a Figma case study, a writer interview and a Figma post about its AI companion. Voice and tone guidance UNVERIFIED. |
| Calm | No guidance page | No public voice guide found. Read the blog index and the App Store listing: implied tone only. |
| Duolingo | No guidance page | `design.duolingo.com/writing/*` (voice, tone, brand-narrative) all redirect to a blog hub with no writing guidance. Read the hub, one product article and a TechCrunch piece. Voice guidance and its own stated limits UNVERIFIED. |
| Intercom | Partly | Read two product-content articles. No style guide page found. Search results suggested a style guide may exist; not read. |
| Day One | No guidance page | None found. Read the home page, blog index, privacy pledge and App Store listing: implied tone only. |

Blocked or unreadable: Wise (blocked), Headspace guide (robots), Duolingo guide (redirected away), Material 3 content page (JavaScript). Read in some form: Stripe, Material 1, Shopify, Calm, Intercom, Day One, plus the partial Headspace and Duolingo material.

## 2. Brand by brand

Support or contradict is judged against the guide's section numbers and the constitution.

### Wise
URL attempted: https://wise.com/gb/styleguide/tone-of-voice (client error), https://wise.com/gb/blog/wise-tone-of-voice (client error), https://wise.design/foundations/tone-of-voice (JavaScript shell, no text).
Lessons: none. UNVERIFIED. A search returned Wise pages that were not about tone, so I cite nothing from Wise. The money-moment rule in guide section 5 therefore has no Wise evidence behind it. Someone with a browser can read the Wise design site and record it.

### Stripe
URLs read: https://docs.stripe.com/stripe-apps/design, https://docs.stripe.com/stripe-apps/style, https://docs.stripe.com/error-handling (Node variant). Also failed: a Stripe blog page and the Stripe Apps review requirements page (client error).
These are developer docs. They contain no voice or UI-writing section, so Stripe's customer writing rules are UNVERIFIED. What the pages do show:
1. Treat an unknown outcome as unknown. After a dropped connection or a server fault, Stripe says to treat the result as indeterminate: do not assume it succeeded or failed, and check first. Supports guide principle 7 (honest to the build). It exposes a gap: our error anatomy has no "we don't know yet if it saved" case.
2. A decline is not a fault. Stripe says a payment error can occur when the integration is working correctly. Supports "never blame" in section 8 and the money row of section 5: say what happened to the payment, not what the person did.
3. Constrained styling for consistency and accessibility. Stripe limits custom colour to keep a high accessibility bar. Not about words; mildly supports section 10 (access) and our single-source tokens.
4. Errors carry a stable code and a link for the developer, and the support request ID is kept. For a parent we would not show codes (guide: no codes), so this is a developer pattern we do not copy.
Contradicts: nothing in the guide or constitution.

### Material Design, writing
URLs read: https://m1.material.io/style/writing.html and https://codelabs.developers.google.com/codelabs/material-communication-guidance. Not readable: https://m3.material.io/foundations/content-design/overview (JavaScript).
1. Lead with the goal, then the action, and keep one concept per sentence. Supports guide principles 2 and 4.
2. Use "you" by default; "I" or "my" only to stress ownership; never mix them. Supports section 6 on "my" and "your". Material also says avoid "we" except when a person on the team acts for the user. Supports our "we only when the company is truly the actor".
3. One word per action ("Delete" throughout, not "Delete" and "Remove"); refer to a control by its label, not its type ("Continue", not "Continue button"); alt text should not start with "image of". Supports sections 8 and 10.
4. Errors should be supportive and detailed, not casual or joking, and each should come with a suggested fix. Supports the guide's error anatomy and the no-wit-on-errors rule. The codelab also says never hide consequences of irreversible actions, which supports the deletion table in section 8.
5. Contradicts or differs: Material allows exclamation points in greetings and congratulations, curly quotes, en dashes for ranges and ellipses for in-progress actions. Our rules test bans all of these. The ban stands (platform convention, not a reason). Material also says "be inviting: lead with benefits and omit caveats". That is the opposite of our "honest to the build"; where a caveat changes what a parent does or pays, it stays. Material says avoid absolutes like "never", which matches our "no never without proof" for claims.
Humour: not addressed on either page. No limits stated.

### Shopify Polaris, content
URLs read: https://shopify.dev/docs/apps/design/content and https://shopify.dev/docs/apps/design/content/voice-and-tone. Not read: the Polaris error-messages and actionable-language pages (they redirect to an API index), so Shopify's error structure is UNVERIFIED.
1. Voice stays constant and tone follows the situation; an error is more direct than an onboarding tip. Quote: "Voice stays the same across your whole app. Tone changes with the situation." Supports guide principle 6 and section 5.
2. Do not celebrate routine tasks, do not assume how the person feels, and do not take credit for their success; use a brief toast for routine confirmations and keep celebration for real milestones, about the person. Supports the "Saved a letter" row, principle 8 (the machine never takes a bow) and the ban on emotion on show.
3. Apologise only when the app is at fault, explain the impact of a problem and give a specific fix. Supports Monzo in Appendix A and the support-reply row in section 9.
4. Target about US grade 7 reading level; one noun or verb per concept; do not repeat what the title bar already says. Consistent with our goal of reading age about 12 (section 10) and the verb-first button rule.
5. Differs: it says use the app's name on first reference and then "we". We use `{app}` and avoid "we" except as the real actor, so we do not copy that.
Humour: no humour section. The voice is "grounded" and "measured", so playfulness is not encouraged. No explicit limit stated.

### Headspace
URLs read: https://www.figma.com/blog/building-a-design-system-that-breathes-with-headspace/ (nothing on writing), https://medium.com/everywordmatters/nathan-moorman-headspace-c5a93dac0fff (a writer interview), https://www.figma.com/blog/headspace-ebb-ai-companion/ (its AI companion). Blocked: https://design.headspace.com/ (robots.txt; not worked around). Headspace's voice and tone rules are UNVERIFIED.
1. Headspace kept its AI companion visible. Quote: "We didn't want AI to be invisible." Members always know it is an AI, it is placed as support between therapy sessions and not a substitute, crisis resources are built in, and members can leave or delete a conversation. This is a chat companion, not a transcript cleaner, so it does not apply to us today. It does show that the honest alternative to hiding software is saying so plainly. For us the constitution is stricter: no software voice at all. Flag for the CAIO and CLO: if any law or store rule ever requires disclosing the speech model, the "no AI words" test needs a named exception, decided by them, not by copy.
2. The team gave the character a gender-neutral identity and a reflective, not overly cheerful, voice because members may arrive with heavy emotions. Supports our "never gender" and "no cheer in hard moments" rows.
3. The writer says release notes and error messages deserve the same care as hero copy, and that good copy is often the copy people do not notice. Supports the coverage matrix in section 9.
Do NOT copy: Headspace's soothing wellness register and its character voice. We are a memory book, not a wellbeing product, and we make no health claims.

### Calm
URLs read: https://www.calm.com/blog and https://apps.apple.com/us/app/calm-meditation-simple-guided/id571800810. No voice guide found; tone below is implied by marketing copy.
1. The listing opens with a body-directed imperative ("Take a deep breath") and a warm, soothing register, mixed with award callouts, download counts and celebrity narrators. We do not tell a parent how to feel or breathe, and the guide bans ranks and hype on the store page (section 8). Not copied.
2. The listing says it helps with anxiety, stress and sleep and is "recommended by top psychologists", without citing studies. That is a claim needing proof. Supports our section 8 rule that claims must be true and substantiated, and our ban on health claims.
3. The subscription block is plain and exact: free to download, auto-renews, when to turn renewal off, where to manage it, what a free trial forfeits. Supports the money row of section 5 (date, amount, what they keep). It is mandated legal text, so the CLO owns ours.
4. The listing includes a mood and streak tracker, and the blog index uses wordplay in headlines (a "nightmare" pun). Both contradict us: no streaks, and no puns (section 4). Not copied.
Humour: wordplay appears in blog headlines only; no stated limits.

### Duolingo
URLs read: https://blog.duolingo.com/hub/design/ (hub, no guidance), https://blog.duolingo.com/widget-feature/ and a TechCrunch article (https://techcrunch.com/?p=2145036). Redirected away and unread: design.duolingo.com/writing/voice, /tone and /brand-narrative. Duolingo's own writing rules, and any limits it sets on its humour, are UNVERIFIED.
1. The widget shows the current streak and whether it is at risk, and the mascot's mood escalates toward panic as midnight nears. The team describes this as charming. This is the streak and urgency pattern our constitution forbids. We do not copy it.
2. TechCrunch reports that many notifications lean on guilt, that users mocked the passive-aggressive tone, and that a streak can be kept by finishing one quick lesson without learning. Two lessons for us: guilt copy draws backlash even in the product that is best at it, and a streak rewards the number, not the thing. Supports "no streaks, no gap counts" and principle 9.
3. Playfulness works here because it is carried by one character with a long-running personality. We have no mascot and the guide says no wit on a lock screen, so the transfer is poor. A joke tied to a character becomes a meme; a joke in a neutral push becomes noise. Consistent with Atlassian's "a dozen times may annoy" in Appendix A.
Do NOT copy: streak, guilt and urgency tone, escalating "panic" notifications, or the mascot-as-pressure device. Duolingo's own limits on this tone were not found in what I read.

### Intercom
URLs read: https://www.intercom.com/blog/how-words-build-a-product, https://www.intercom.com/blog/content-first-approach-to-onboarding/ and https://www.intercom.com/blog/8-tips-for-writing-like-you-mean-it/ (blog-writing tips, little use). A dedicated Intercom style guide was not read.
1. Address the user directly but never speak on their behalf. This is the closest outside match for principle 11 (we never write a letter for a parent). Supports.
2. Audit every visible word, sort it into a glossary, and give each concept one name; placeholder names stick. Supports the `BRAND.md` glossary and the internal-terms rule (take, entry, draft, pack never reach a parent).
3. Quote: "Content makes a terrible bandage for a broken product." Unclear onboarding can be a product problem, not a wording problem. Supports the guide's step 0 (find out what the build does) and "stop and ask when a line touches meaning".
4. Document voice as "we always sound / we never sound". Our section 4 table does this already. Intercom also carries tone into punctuation and emoji; we ban emoji, so we take the habit of checking punctuation and not the emoji.
5. Differs: the onboarding article wants a welcome, company identity, the problem solved and a value proposition. Our onboarding rule is one short welcome and then get out of the way. We keep ours; Intercom is writing for B2B onboarding where those elements are needed. It also warns that long flows cause abandonment, which supports "one idea per screen".
Humour: not addressed.

### Day One
URLs read: https://dayoneapp.com/?p=88 (home), https://dayoneapp.com/blog/, https://dayoneapp.com/privacy-pledge/, https://apps.apple.com/us/app/day-one-2-journal-notes/id1044867788. No style guide found.
1. Privacy is stated in verifiable specifics: end-to-end encryption on by default, only the user holds the key, a passcode or biometric lock, journals that can be hidden. That is the right shape (specific and checkable). The same page uses "100% private" and "military-grade encryption" unqualified. Our guide bans "100%" and "bank-level" (section 4) and needs proof for any "never" or "always". Supports our rule; do not copy the absolutes.
2. The App Store listing stresses privacy while its privacy label lists many data types linked to identity, per the page summary (the label is developer-supplied). The gap between a promise and a label is exactly what the CLO and CPrivO tests need to prevent. Supports our claim-to-code-path rule in step 0.
3. Day One frames journaling as a habit, with streaks, a calendar view, daily prompts and reminders; the listing says "Streaks and calendar view help keep your momentum going." The blog titles carry day counts ("2,300 Days with ..."). Our constitution forbids streaks, day counts and gap counts. Not copied.
4. The home page jokes that forgetfulness is the only excuse for skipping a day. That is guilt-adjacent and at the parent's expense, which our humour policy bans (section 4). Not copied.
Humour: playful on privacy and marketing pages ("Stranger Steve"); our policy keeps wit away from privacy, consent and trust lines.

## 3. What the nine sources say together

1. Tone follows the moment, and errors, apologies and bad news are plain. Shopify, Material, Intercom and (via Ebb) Headspace agree. This is already section 5.
2. Nobody read supports wit on errors, money or deletion. Material says errors should not be casual or joking; Shopify's voice is "measured". Where playfulness exists (Duolingo, Calm blog, Day One), it lives in marketing or a character, not in operational messages. Consistent with our scope.
3. The three engagement products (Duolingo, Day One, Calm) lean on streaks. Duolingo shows the cost (mockery, guilt backlash). That is outside evidence for a line we already hold on principle, not new evidence for changing it.
4. Absolute privacy and health claims are common in the category and are what we avoid.
5. Round 1 and round 2 together are still style guides and marketing pages. None is a parenting, memory or voice-first product read for accessibility or grief. The Appendix A caveat stands.

## 4. Recommendations for the guide (not applied here)

| # | Change | Source | Why | Owner |
| --- | --- | --- | --- | --- |
| 1 | Add an "outcome unknown" case to the error anatomy in section 8: when we cannot tell if something saved or synced, say that, and say how to check. Do not claim success or failure. | Stripe error handling | The anatomy assumes we know what happened. A dropped connection mid-save is exactly where a wrong "Saved" or "That didn't save" breaks principle 7. Verify the real behaviour in the build first (step 0). | `content`, mobile |
| 2 | Update Appendix A: move Stripe, Material, Shopify, Intercom, Calm, Day One, Duolingo and Headspace from "Not read" to read, with the limits above; leave Wise as blocked. | This file | Appendix A currently says do not cite them. | `content` |
| 3 | Add a sentence to the humour policy: the nearest outside brands keep wit in marketing or a character, never in operational messages. Cite Material and Shopify. | Material, Shopify | Gives the policy an outside anchor. Does not change the scope the founder chose. | `content`, CMO |
| 4 | Question for the CAIO and CLO, not a copy change: Headspace keeps its AI visible. Decide whether any law or store rule could require us to say a speech model is used, and if so how the "no AI words" test names that exception. | Headspace Ebb | Our test bans AI words everywhere; a disclosure duty is the one case that could collide. | CAIO, CLO, founder |

The only lesson that should change the guide's text is row 1. Rows 2 and 3 are record-keeping. Row 4 is a question.

## 5. Open items

- Wise: read the Wise design site tone page in a browser and add it. Until then the money row has no Wise evidence.
- Duolingo, Headspace: read their writing pages in a browser (the Duolingo ones redirect, Headspace blocks bots) before anyone cites their voice rules.
- Shopify: read the Polaris error-message and actionable-language pages from a source that serves them.
- Stripe: read the Stripe Dashboard UI copy in the product itself; the developer docs have no writing section.
- Intercom: check whether a public product style guide exists.
- Calm and Day One: no voice guide found; do not call anything above their rules.

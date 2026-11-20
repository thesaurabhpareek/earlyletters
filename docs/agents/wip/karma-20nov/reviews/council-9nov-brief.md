# Council brief, Mon 9 Nov 2026, 7:30 AM PT (written by Karma, the CTO role)

The founder has read the status note below and asked that the full executive team reads it and gives an opinion, that every agent with the right skill works on delivery, and that design and product focus is critical so that engineering builds the right thing. This is the founder's "what does the team think", for all twelve seats. Karma speaks for the CTO seat.

## The status note Karma sent the founder (Mon 9 Nov, 7:10 AM PT), verbatim

Build 1 (servers off): on track. Build 11 went to App Store Connect yesterday at 1:48 PM PT. Apple's processing, the Family group and any phone check are not seen (unverified).

Build 2 (servers on): off track, and today is the go/no-go (D-130). Karma's call: no-go for build 2 today. The 0.9.0 Terms and Privacy (BL-565) are merged to develop (#616 texts, #652 website pages) but not live: the website deploys from main, and Karma is holding the deploy (ruling CR-60) until the founder confirms the facts the texts state. With the pages not live no `terms` row can be written to policy_versions, so sign-in stays closed. Staging steps S-50 to S-54 were still open in the last record Karma read.

Moved since Sun 8 Nov morning: about 31 merges. Karma's: Stop on the language row (#661), no 0% in the download line (#662), Write saves on unmount and an erase pin (#663), Erase everything and Delete this book (#520, with the wording the founder chose, ruling CCO-6, pin test #693), the 0.9.0 texts and their pages (#616, #652), the records of the founder's answers (D-144 in #692, CR-60 in #678, backlog rows BL-775 to BL-783 in #692 and #694). The other Karma session's: Settings home regrouped into five groups (#614), Book page redesign (#674), the standing Plus line on Write (#668), "Another thought on Write" (#679), "If you are struggling" by the phone's region with Call and Text (#675), QE-02 and QE-04 fixes (#671, #673), English-only spoken-language list for build 12 (#689), content fixes (#686 to #688), release chores (#695, #696, #601), ops docs (#690, #691). Develop is green. The upgrade drill from a build 9 database to the new tip passed (not a phone).

The founder's next 48 hours: (1) walk build 11's checklist and say whether build 11 shows in TestFlight; (2) keep or revert Karma's merge of the legal text #616 (D-132 does not cover docs/legal; Karma recommends keep); (3) confirm the facts for the website deploy: US region, scheduled deletion running, encrypted at rest, two-factor and who has access, the by-hand routes (delete an account, withdraw sync, see/export/correct, close an under-18 account, delete TestFlight feedback), and the hello@ route (Resend or Porkbun forwarding); needed before build 2 can sign anyone in; (4) build 12: Karma recommends cutting it Tue 10 Nov after the founder's phone checks; it needs the founder's click on the GitHub approval.

## Facts any seat can check (read from origin/develop; do not trust this brief over the repo)
- Repo: /home/user/earlyletters (read only; never change the checkout). Read files with `git show origin/develop:<path>` after `git fetch origin develop`. Open PRs are on GitHub (`gh api repos/thesaurabhpareek/earlyletters/pulls/<n>`).
- Records: D-144 and D-138 in docs/DECISIONS.md; CCO-6 in docs/agents/exec/RULINGS.md; CR-60 in docs/agents/cto/RULINGS.md; backlog rows BL-775 to BL-783 in docs/BACKLOG.md; the 0.9.0 texts in docs/legal/beta/; device plan docs/qa/DEVICE_TEST_PLAN.md (S1-95 Settings home, S1-133 Erase everything).
- The constitution (CLAUDE.md): the machine may remove and repair, never add meaning; raw_transcript is immutable; no feature writes, rewrites, summarizes or shapes a person's words.
- The founder's standing rules: accuracy above all, say "unverified" when unverified, plain peer voice, times in Pacific, no secrets, no real family details (the fictional family is Asha), no em or en dashes, curly quotes, ellipsis characters or emoji in product text.
- Nothing in build 12 has been run on a phone. Counsel has not read any of the legal texts. Apple's processing of builds 10 and 11 and the Family group are unverified.

## What each seat returns
Write to the file named in your assignment. Sign as "<Title> (Claude role)". Plain words, short sentences, first person, no filler, no AI tells. Maximum 450 words. Structure:
1. Verdict type per COUNCIL.md (RULED, FOUNDER, NOT A QUESTION, NEEDS EVIDENCE) for each question you answer, with the reason in one or two sentences.
2. Your opinion of the status note and Karma's recommendations (go/no-go for build 2 today, keep #616, hold the deploy, build 12 on Tue 10 Nov): agree, disagree or change, and why, from your seat only.
3. The three biggest risks you see from your seat for build 12 and for the go/no-go, each with its evidence (file:line, PR, doc) or marked unverified.
4. What your seat needs from other seats or from engineering in the next 48 hours, and what your seat will do (named deliverables, with owner roles).
5. Anything only the founder can decide, with your recommendation and a default.
Do not post anything on GitHub, do not push, do not edit repository files, do not message anyone. Nothing here is legal advice, tax advice or an audit.

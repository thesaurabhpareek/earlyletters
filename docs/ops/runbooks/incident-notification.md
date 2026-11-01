# Runbook: notifying people after an incident

LEGAL-REQ-039. Starts after [suspected-data-leak.md](suspected-data-leak.md) has contained the problem and produced the affected list. **Counsel approves every notice before it is sent.** AI-drafted templates below; not legal advice.

## 1. Clocks (from discovery, not from the incident)

`scripts/ops/enumerate-affected.ts --discovered-at <ISO>` prints these. The plan uses the shortest one that applies; counsel decides which apply.

| Regime | Clock | Who |
|---|---|---|
| US state breach laws | "Most expedient time possible and without unreasonable delay"; some states set 30, 45 or 60 days, and some require notice to the state attorney general above a number of residents | Individuals; AG where required |
| FTC Health Breach Notification Rule, if it applies (counsel, register CR-030) | 60 days | Individuals, the FTC, media if 500 or more in a state |
| India DPDP, if it applies to a contributor or user there (counsel, CN-14) | 72 hours to the Data Protection Board | Board, individuals |
| Apple, vendors | As their terms require | Per contract |

## 2. Who gets which message

| Group | Message |
|---|---|
| Every person in the CSV with an email | The individual notice (template A), one email each |
| People in the CSV without an email (Apple private relay addresses do receive mail; only missing addresses count here) | In-app notice through remote content (decision 16) when the platform supports it; record the count |
| Everyone, while facts are still being established | Holding statement (template B) on the website, and in reply to anyone who writes in |
| Regulators | Counts per category and state, from the script output (never the list) |

Sending: transactional email from `hello@earlyletters.com` (or `privacy@` once it exists) through Resend, one message per person, plain text, no tracking (click and open tracking are off; AUTH_SETUP 4.1). Mail-merge from the CSV on your machine; do not upload the CSV to any new service. Resend's sending rate and our daily volume may need a ramp; Resend keeps message data 30 days (Verified).

Notices never contain letter text, a child's name, photos or anything from a book, even to the person who wrote it. Say what kinds of data, not the data.

## 3. Template A: individual notice

Subject: `About your {app} account: a security issue we fixed`

```
Hello,

We are writing to tell you about a security issue that affected your {app} account, what we have done about it, and what you can do.

What happened
On {date of incident or window}, {one or two plain sentences: what went wrong, for example "a setting on one of our servers allowed..."}. We found it on {discovery date} and {fixed it / closed access} on {containment date}.

What information was involved
{Only the categories that apply to this person, in plain words, for example:}
- The letters you wrote in your book, as text
- Your child's name and birthday, as entered in the app
- Your email address and the name you sign with
{If true:} Your recordings were not involved: they stay on your phone.
{If true:} We have no evidence that anyone used the information.

What we are doing
We {fixed the cause, replaced keys, added checks}. We have told {authorities, if any}. {Anything else concrete.}

What you can do
- You do not need to do anything to keep using {app}.
- If you would like, you can export your book (Settings, Your data, Export everything) or delete your account (Settings, Delete account).
- {Only if relevant, for example: be careful with emails that claim to come from us and ask you to sign in. We never ask for a password; we do not use passwords.}

Questions
Reply to this email or write to {privacy address}. Reference: {ticket reference}.

{app}
{publisher legal name and contact address, as counsel requires}
```

## 4. Template B: holding statement (website and replies)

```
We are looking into a security issue that may have affected some {app} accounts. We found it on {date} and have {contained it / are containing it}. Recording, reading and exporting your letters on your phone are not affected.

If your account was affected, we will email you directly with what happened and what it means for you. We will update this page by {date and time, UTC}.

Questions: {privacy address}.
```

## 5. Records to keep (3 years)

In the incident folder: the timeline, counsel's decision on which laws apply, the final notice texts, the date and count of notices sent (not the list itself once sending is done: delete the CSV when counsel agrees), regulator filings, and the `ops.audit_log` ids of every script run. Add a line to the compliance register.

## 6. Annual tabletop (LEGAL-REQ-039)

Once a year on staging: invent a scope (for example "entries table exposed from 01:00 to 03:00 UTC yesterday"), seed staging with the Asha fixture families, run `enumerate-affected.ts`, check the CSV against the fixtures by hand, time it (target under one hour), and walk this runbook to the point of sending. Record the result in the incident folder.

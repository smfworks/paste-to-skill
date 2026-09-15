import type { SampleSop } from "../types";

export const PASTE_PLACEHOLDER = `Paste an SOP, email thread, checklist, or messy notes.

Subject: inbox is a mess again
When unread mail piles up overnight, sort it.

1. Scan sender + subject
2. Draft replies — don't send
3. Hold anything that needs a human
4. Archive newsletters

never auto-reply to lawyers
done when unread = 0`;

export const SAMPLES: SampleSop[] = [
  {
    id: "inbox",
    label: "Triage inbox",
    blurb: "Overnight mail → act / hold / archive",
    paste: `# Triage inbox

Subject: morning mail is a mess again

When the inbox has unread from overnight, sort it. Do not pretend this is a lawyer or a doctor.

From: ops
To: agent

do this:
1. Scan subject + sender. Flag anything from a human we already work with.
2. Act: invoices, yes/no questions, calendar holds — draft a reply, don't send.
3. Hold: anything that needs Michael or Mary. Put in Review.
4. Archive newsletters, GitHub noise, and vendor drip.

tools: gmail, calendar
input: open inbox, last 24h window
never auto-reply to lawyers or strangers asking for money
don't delete anything unread
don't send mail without a human read
done when unread = 0 and Review has the holds
`,
  },
  {
    id: "deploy",
    label: "Deploy checklist",
    blurb: "Ship only when tests and rollback exist",
    paste: `# Production deploy (web)

Goal: ship main to production without a surprise outage.

Checklist
[ ] CI green on the commit you are shipping
[ ] changelog / SKILL or README note if the user-visible behavior changed
[ ] announce in #ship: what, why, rollback
[ ] tag the release
[ ] deploy
[ ] smoke: homepage, auth, one write path
[ ] watch logs 10 minutes

Rollback: redeploy previous tag. If migrations ran, stop and page a human.

never deploy on Friday after 4pm without oncall awake
do not skip tests
do not apply irreversible migrations without a backup note
secrets stay in the host env — never paste .env into chat or a gist
tools: git, github, docker, vercel
input: release SHA, environment (staging|prod)
success: smoke checks pass and error rate is flat
`,
  },
  {
    id: "status",
    label: "Weekly status",
    blurb: "Draft the letter; human sends it",
    paste: `# Weekly status

Weekly status — SMF AI Weekly style, internal edition

Use when it's Friday and we owe a short status to the lab / a client.

SOP from Mary:
- Pull shipped items from the board (done this week only)
- Pull blockers (waiting on human, waiting on vendor)
- One paragraph: what changed our minds
- Tight bullets, no vanity metrics, no invented ROI
- Draft in the weekly doc, do not send

Email thread leftover:
> can you also include what broke
> and the next experiment

Refuse: do not send the letter. do not include secrets from .env. do not make legal or medical claims. do not pad with "synergy".

Tools: github, linear / kanban, gmail (draft only)
Inputs: date range (Mon–Fri), audience (lab vs client)
Done when: draft is in the doc, blockers named, and a human can send in one pass
`,
  },
  {
    id: "refund",
    label: "Customer refund",
    blurb: "Return scan, then money — with a hold",
    paste: `Customer refund path

From: support@shop
Subject: Re: refund for order 1842

Jane returned the jacket. Can we refund?

Playbook we actually use:
1. Confirm the return scan is in the warehouse system (need order id + RMA).
2. Check the 30-day window from delivery, not from purchase.
3. If it's outside the window or used/damaged, draft a no with the policy quote — don't send.
4. If it's in policy: prepare the Stripe refund for the captured amount only (no extra goodwill).
5. Hold for a human to click refund. Post the note on the ticket.

never refund without a return scan
never refund more than was captured
do not promise legal outcomes or "we'll make an exception" in the draft
do not DM the customer from a personal account
PII stays in the ticket — no dumping card numbers or addresses into chat

tools: stripe, gmail, zendesk
success: ticket has scan evidence, amount matches capture, human approved the refund click
`,
  },
];

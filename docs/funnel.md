# The funnel

Written 22 September 2026, after walking the whole journey from a tagged link
to a paying client and marking where it breaks.

A funnel has seven jobs. Everest does the first three well, and the last four
barely at all — which is the normal shape for a business whose website was
built before its sales process was.

| # | Job | State |
|---|---|---|
| 1 | Get found | Solid. SEO and answer-engine work is done and waiting on the domain and a Google Business Profile |
| 2 | Make the offer legible | Strong. 16 programmes, priced openly, and a finder that recommends one in 60 seconds |
| 3 | Capture the lead | Done. Three forms, segment-tagged, attributed, spam-guarded |
| 4 | **Respond** | **Nothing automated.** A lead waits until Jared personally replies |
| 5 | **Convert** | **Partly broken.** "Book a call" is a form, and four priced programmes cannot be bought |
| 6 | **Follow up** | **Nothing.** One unanswered reply and the lead is gone |
| 7 | **Ask** | **Nothing.** No review request, no referral ask, no reactivation |

## Two things here are genuinely better than most

Worth saying, because they are the foundation the rest sits on.

**Published pricing.** Most personal training sites hide price behind "enquire
for a quote", which filters out the people who were ready to buy and keeps the
ones who want to negotiate. Everest publishes $10 to $800 and lets people
self-select. Keep it.

**The finder.** Four questions, a real recommendation, a price, no email wall.
It is a qualification tool that feels like a service. Gating it behind an email
would raise captures and lower clients, which is the trade every mediocre funnel
makes.

## The seven leaks, in order of money

### 1. Nothing happens in the first five minutes

The enquiry arrives in an inbox with 15,700 other messages. If Jared is with a
client, on the gym floor, or asleep — and Christchurch is asleep while half the
internet is awake — the enquirer sits with silence.

This is the single biggest hole in the funnel, and it is not a website problem.
Speed of first response is the most reliable predictor of whether a lead ever
converts, and the drop between minutes and hours is steep.

**Fix:** an automatic reply the instant the form is submitted, segment-aware:
what happens next, when, one piece of proof, and the link to book a time. It
should read like Jared wrote it in a hurry, not like a receipt.

**Cost:** Web3Forms Pro, US$12/month or $149/year, which is the plan that
includes autoresponders. Nothing else on the site needs to change — the
segment is already in the payload. Everything else on this list is free or
already built.

### 2. "Book a call" is not a booking

The sticky button on every page says **Book a call** and lands on a contact
form. That is a promise the page does not keep, and it converts like a form
because it is one.

An elite funnel books the slot in the same click. Two free options: a Google
Calendar appointment schedule, if the Workspace plan includes it, or Calendly's
free tier. Either gives a link that shows real availability, takes a name and
an email, and puts it in the calendar with a reminder.

**What changes when this exists:** the sticky CTA points at it, the contact page
offers it beside the form, the autoresponder in #1 leads with it, and the
`[ORG]` and `[PARTNER]` first-move lines stop saying "offer a call" and start
saying "send the link".

**Needs from Jared:** the scheduling link, and a decision about how much of the
week is visible.

### 3. Four priced programmes cannot be bought

Starter Strength, Build / Hypertrophy, Run Strong and Strength & Stretch all
show **$30** and have no `checkoutUrl`, so the button falls back to the contact
form.

That is the $30 tier — the bridge between the $10 app programme and the $90
one-to-one session, and the natural second purchase for someone who started
cheap. A price with no way to pay is the most expensive kind of dead end,
because the person was already convinced.

**Needs from Jared:** the four Trainerize plan links. Ten minutes of work.

### 4. One reply and done

If someone does not answer the first email, nothing else happens. Most enquiries
that eventually become clients do not answer the first message — they were busy,
or not quite ready, or waiting to talk to a partner.

**Fix:** a three-touch sequence over ten days. Day 0 the reply, day 3 a useful
thing rather than a nudge (the article that matches their goal), day 10 a single
short "still want me to hold a slot?". Then stop, and say you are stopping.

It can run out of Gmail templates and a task list to start with. Proper
sequencing needs a tool, and that decision can wait until the volume justifies
it — with 250 free submissions a month, it is not close yet.

### 5. Proof sits a long way from the decision

Three real Google reviews and a 5.0 rating exist, and they live on the homepage
and the contact page. The decision, though, is made on the programme card and in
the finder result — where there is no proof at all.

**Fix:** put one relevant review beside the price. The strength review next to
the strength programmes, the return-to-training review next to the beginner
ones. Same reviews, moved to where the doubt is.

This is free and it is the highest-value change I can make without needing
anything from Jared. It is also the one most likely to be undone by good
intentions later, so: **real reviews only, verbatim, from the Google profile.**

### 6. There is no first step that costs nothing

Every route in is "buy" or "talk to us". There is no way to take a small,
low-commitment step and stay in touch — which is what most of the traffic is
ready for.

Options, in order of how well they suit this business: a free movement or
readiness screen, delivered in person or on video; the finder result emailed
with a genuinely useful next step attached; a "first week free" on EVEREST365.

**This is a business decision, not a code one.** It affects margin, and it is
Jared's call. I have not assumed one.

### 7. Nothing asks for the review or the referral

Google ratings are the stated priority, and the site cannot produce them — only
happy clients can, and only when asked at the right moment.

**Fix:** a standing routine rather than a campaign. After a result the client
can feel — a first unassisted pull-up, a scan that moved, a race finished — send
the direct review link that day. Never bulk, never incentivised, never written
for them. Same for referrals: ask once, specifically, after a win.

## What is now measurable

Added 22 September 2026. Every event carries the channel that brought the
visit, so each step can be read per channel, and none of them carries anything
about a person — no name, no email, no message.

| Event | The question it answers |
|---|---|
| `finder_start` → `finder_result` | Do people finish the finder, or bail mid-way? |
| `finder_result` → `finder_email_submitted` | Does the recommendation earn an email? |
| `checkout_click` (`kind: buy`) | Which programmes get clicked through to pay |
| `checkout_click` (`kind: enquire`) | Which by-proposal programmes create conversations |
| `enquiry_submitted` (by segment) | Which kind of enquiry the site actually produces |
| `empower_submitted` | Whether the EMPOWER page converts, now that its form works |
| `phone_click`, `sticky_cta_click` | How many people skip the form entirely |

These need **Vercel Web Analytics switched on** to record anything. Until then
the calls are made and thrown away.

What they are for: the first number that looks wrong is the next thing to fix.
If `finder_result` is high and `finder_email_submitted` is near zero, the ask is
wrong. If `checkout_click` is high and nobody buys, the problem is at Trainerize,
not here.

## What this deliberately does not do

Countdown timers, fake scarcity, "12 people are viewing this", exit-intent
popups, invented urgency, invented testimonials.

Not squeamishness. Everest sells to councils, ACC, schools and health-sector
partners as well as to individuals, and those buyers run a credibility check
before they run a price check. One fake scarcity badge on a page a procurement
manager reads costs more than it could ever earn. Several of those tactics are
also misleading conduct under the Fair Trading Act when the claim is not true.

The elite version of this funnel for this business is fast, specific and
unusually honest — published prices, a tool that helps before it asks, a reply
that arrives while they are still interested, and proof from real people. That
converts better here than pressure does, and it is the only version that
survives contact with a government buyer.

## The order to do it in

| | What | Blocked on | Effort |
|---|---|---|---|
| 1 | Autoresponder, segment-aware | US$12/mo | Half a day once paid |
| 2 | Real booking link everywhere | A scheduling link from Jared | Two hours |
| 3 | Four missing checkout links | Trainerize plan links | Ten minutes |
| 4 | Proof beside the price | Nothing | Half a day |
| 5 | Switch on Vercel Analytics | One click in the dashboard | Minutes |
| 6 | Three-touch follow-up | A decision about tooling | Ongoing |
| 7 | Review and referral routine | A habit, not a build | Ongoing |

Items 4 and 5 can happen today. Items 1, 2 and 3 are worth more and are all
waiting on something only Jared can supply.

# Lead routing and link tagging

Written 22 September 2026, after connecting the forms.

Every enquiry from this site lands in one inbox. Two problems follow from that,
and this is how both are solved:

1. **An organisation contract and a $10-a-week app enquiry look identical** in a
   notification on a phone. Now each one carries a subject tag you can filter on.
2. **You cannot tell which post, email or poster produced an enquiry.** Now each
   one carries the link that brought them, if the link was tagged.

Neither costs the visitor anything, and neither is visible to them.

## What now arrives with every enquiry

| Field | Example | Where it comes from |
|---|---|---|
| `subject` | `[ORG] Website enquiry from Jane Smith - Selwyn District Council` | The tag is the segment, the rest is the person |
| `segment` | `Organisations` | What kind of enquiry this is |
| `target_reply` | `One business day` | The internal target. `/contact/` promises one working day publicly, so nothing here is slower |
| `first_move` | `Ask what they measure today, who signs it off…` | The opening that usually works for that segment |
| `form` | `Contact page` | Which of the three forms it came from |
| `came_from` | `instagram / social / spring-launch (bio-link)` | The tagged link, or `Referred by google.com`, or `Direct or untagged` |
| `landed_on` | `/` | The first page of their visit, not the page they submitted from |

Plus the person's own fields, and `replyto` set to them, so hitting reply
answers the enquirer rather than the form service.

## The segments

| Tag | Segment | Comes from |
|---|---|---|
| `[PT]` | Personal Training | Contact form "individual"; finder where the training is for an adult |
| `[ELITE]` | Everest Elite | Contact form "performance"; finder where it is for an athlete |
| `[ORG]` | Organisations | Contact form "organisation"; finder where it is for an organisation |
| `[REFERRAL]` | Health referral | Contact form "referral" |
| `[PARTNER]` | Partnership | Contact form "partnership"; EMPOWER form where the interest is partnership or funding |
| `[EMPOWER]` | EMPOWER youth | EMPOWER form; finder where it is for a young person |

The finder never asks what kind of enquiry it is. It asks who the training is
for, which answers the same question more honestly, and that answer picks the
segment.

An EMPOWER enquiry about **funding or partnership** routes to `[PARTNER]`,
because it is a different conversation from a parent enrolling a child. The
subject line keeps the EMPOWER context: `[PARTNER] EMPOWER: Funding or community
collaboration - …`.

**To change any of it, edit `js/lead.js`.** The tags, the labels, the reply
targets and the first-move lines are all in one map at the top of that file.
Nothing a visitor sees changes when you edit it.

## Inbox filters

**Set up on 22 September 2026.** The seven labels exist in the Gmail account,
and `gmail-filters.xml` in this folder holds the filters ready to import:
Gmail → Settings → See all settings → Filters and Blocked Addresses → Import
filters → choose that file → Open file → tick all seven → Create filters.

Every filter matches **both** the sender `notify@web3forms.com` and the subject
tag, so an ordinary email that happens to contain the word "elite" or "org"
cannot be filed as a lead. Nothing skips the inbox - a lead has to land in front
of you. The seventh filter labels anything from the form service whatever its
subject, so an enquiry is never lost if a tag is ever missing.

Filters live on the account, not the device, so importing once covers phone and
desktop. To change one afterwards, edit it in Gmail and update the XML here so
the two do not drift.

What the import creates:

| Subject tag | Label | Also |
|---|---|---|
| `[ORG]` | **Leads/Organisations** | starred, marked important, never spam |
| `[PARTNER]` | **Leads/Partnership** | starred, marked important, never spam |
| `[REFERRAL]` | **Leads/Referral** | starred, marked important, never spam |
| `[ELITE]` | **Leads/Elite** | never spam |
| `[EMPOWER]` | **Leads/EMPOWER** | never spam |
| `[PT]` | **Leads/Personal Training** | never spam |
| *(any, from the form service)* | **Leads** | never spam |

The three starred segments are the ones where a slow reply costs the most: an
organisation, a partnership and a health referral all involve someone else's
timetable, not just yours.

**Never send to spam** is on every one of them deliberately. A form service is
exactly the kind of sender a spam filter gets wrong, and a lead in the spam
folder is a lead lost.

A filter on `came_from` is not possible - it is in the body, not the subject -
but searching `"came_from" instagram` finds every enquiry a channel produced.

If the mailbox ever moves to Outlook, the same logic goes in Rules, matching on
sender and subject.

## Tagging your links

A tagged link tells you which channel produced an enquiry. An untagged one
tells you nothing, so the enquiry arrives saying `Direct or untagged`.

Add the parameters to the end of any link to the site:

```
https://everest-personal-training-sooty.vercel.app/programs/?utm_source=instagram&utm_medium=social&utm_campaign=spring-launch
```

| Parameter | Means | Keep it to |
|---|---|---|
| `utm_source` | Where it was posted | `instagram`, `facebook`, `linkedin`, `google`, `newsletter`, `poster`, `plus-fitness` |
| `utm_medium` | What kind of place that is | `social`, `email`, `print`, `profile`, `referral` |
| `utm_campaign` | Which push it belongs to | `spring-launch`, `empower-term4`, `always-on` |
| `utm_content` | Which specific link, when one campaign has several | `bio-link`, `story-1`, `poster-qr` |

**Rules that keep the data honest**

- **Lowercase, hyphens, no spaces.** `Spring Launch` and `spring-launch` count
  as two different campaigns and neither total will be right.
- **Never tag a link between pages of this site.** It restarts the visit and
  overwrites where the person actually came from. Tag only links that live
  somewhere else — a post, an email, a poster, another site.
- **One campaign name per push**, used everywhere that push appears.
- **Tag the landing page you actually want**, not always the homepage. Sending
  an EMPOWER post to `/empower/` converts better than making people navigate.

## Ready-made links

These use the current production address. **They all need rebuilding when the
domain changes** — see `launch-checklist.md`.

| Where | Link |
|---|---|
| Instagram bio | `…/programs/?utm_source=instagram&utm_medium=social&utm_campaign=always-on&utm_content=bio-link` |
| Instagram post about EMPOWER | `…/empower/?utm_source=instagram&utm_medium=social&utm_campaign=empower-term4` |
| Facebook page post | `…/programs/?utm_source=facebook&utm_medium=social&utm_campaign=always-on` |
| LinkedIn, for organisations | `…/organisations/?utm_source=linkedin&utm_medium=social&utm_campaign=always-on` |
| Email signature | `…/?utm_source=signature&utm_medium=email&utm_campaign=always-on` |
| Printed poster QR code | `…/empower/?utm_source=poster&utm_medium=print&utm_campaign=empower-term4&utm_content=poster-qr` |
| Google Business Profile | `…/?utm_source=google&utm_medium=profile&utm_campaign=always-on` |

Google Business Profile is worth tagging even though it looks like a detail: it
is how you tell profile traffic apart from ordinary search, and those are two
completely different kinds of visitor.

## What is deliberately not here

No cookie, no cross-site tracking, no individual profile. The link a visitor
arrived through is held in **session storage**, which is erased when they close
the tab, is never read on a later visit, and is sent to us only if they choose
to submit a form. A visitor who never enquires never sends anything.

That is disclosed in the privacy policy under both "What we collect" and
"Cookies and analytics", and it is what keeps the claim on that page — no
cookies, no profile, no consent banner needed — true. If this ever changes to
something persistent, that page changes in the same commit.

/* Everest PT - lead routing.

   Every enquiry from this site lands in one inbox. Without a tag on it, an
   organisation asking about a workforce contract and someone asking about a
   $10-a-week app programme look identical at 7am on a phone, and the wrong one
   gets answered first.

   So each submission carries a segment: a subject-line tag to filter on, the
   first move that usually works for that kind of enquiry, and an internal
   target for replying. The tag is the part that matters - it is what a mail
   rule can act on, and it is stable, so a filter written once keeps working.

   Editing this file changes what arrives in the inbox and nothing a visitor
   ever sees. docs/lead-routing.md explains the filters to set up alongside it. */
(function () {
  'use strict';

  /* tag        what to filter on. Short, uppercase, stable.
     label      how the segment is named in the email.
     reply      the internal target. /contact/ publicly promises a reply
                within one working day, so nothing here may be slower than
                that - these are tighter where the segment deserves it.
     first      the opening move. Written as an action, not a reminder. */
  var SEGMENTS = {
    individual: {
      tag: 'PT',
      label: 'Personal Training',
      reply: 'Same day',
      first: 'Reply personally. Name the programme that fits, give one thing they can do this week, and offer a time rather than a link.'
    },
    performance: {
      tag: 'ELITE',
      label: 'Everest Elite',
      reply: 'Same day',
      first: 'Ask what they are training for and when it is. Lead with the assessment, not the price.'
    },
    organisation: {
      tag: 'ORG',
      label: 'Organisations',
      reply: 'One business day',
      first: 'Ask what they measure today, who signs it off, and what the budget cycle is. Offer a 20-minute scoping call.'
    },
    referral: {
      tag: 'REFERRAL',
      label: 'Health referral',
      reply: 'One business day',
      first: 'Confirm the scope with the referrer and what they need reported back. Do not start before that is clear.'
    },
    partnership: {
      tag: 'PARTNER',
      label: 'Partnership',
      reply: 'One business day',
      first: 'Ask what they want to achieve and what they bring. Agree one small first thing rather than a whole arrangement.'
    },
    empower: {
      tag: 'EMPOWER',
      label: 'EMPOWER youth',
      reply: 'Same day',
      first: 'Say when the next cohort runs and what the young person would actually do in week one. Parents are deciding on detail, not on values.'
    }
  };

  var DEFAULT = 'individual';

  function get(key) {
    return SEGMENTS[key] || SEGMENTS[DEFAULT];
  }

  /* The finder never asks what kind of enquiry this is - it asks who the
     training is for, which answers the same question more honestly. */
  function fromAudience(audience) {
    if (audience === 'organisation') return 'organisation';
    if (audience === 'athlete') return 'performance';
    if (audience === 'youth') return 'empower';
    return 'individual';
  }

  /* An EMPOWER enquiry about funding or partnership is a different
     conversation from a parent enrolling a child, so it routes with the
     partnership enquiries while the subject line keeps the EMPOWER context. */
  function fromInterest(interest) {
    if (interest === 'partnership' || interest === 'funding') return 'partnership';
    return 'empower';
  }

  /* Adds the routing fields to a payload that is otherwise about to be sent.
     `headline` is the human part of the subject; the tag is prefixed here so
     the format cannot drift between the three forms. */
  function decorate(payload, opts) {
    var seg = get(opts.segment);
    payload.subject = '[' + seg.tag + '] ' + opts.headline;
    payload.segment = seg.label;
    payload.target_reply = seg.reply;
    payload.first_move = seg.first;
    if (opts.form) payload.form = opts.form;

    var attr = window.EverestAttribution;
    if (attr) {
      var a = attr.get();
      payload.came_from = attr.summary();
      payload.landed_on = a.landing || '';
    }
    return payload;
  }

  window.EverestLead = {
    SEGMENTS: SEGMENTS,
    get: get,
    fromAudience: fromAudience,
    fromInterest: fromInterest,
    decorate: decorate
  };
})();

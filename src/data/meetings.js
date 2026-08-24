// Today's meetings for Kris Korich. Prep content is auto-generated per meeting.

export const meetings = [
  {
    id: 'acme-qbr',
    time: '9:00 AM',
    duration: '60 min',
    title: 'Acme Corporation QBR',
    type: 'Quarterly Business Review',
    account: 'Acme Corporation',
    accountId: 'acme',
    attendees: [
      { name: 'Sarah Mitchell', title: 'VP Customer Experience' },
      { name: 'Daniel Rodriguez', title: 'Director of AI Platforms' },
    ],
    prep: {
      objective:
        'Reinforce value delivered this quarter and secure executive sponsorship to expand from transcription into conversational AI before contracted capacity is exhausted.',
      topics: [
        'Q3 usage growth (+18% YoY) and progress against goals',
        'Capacity ceiling — 8.4M of 10M contracted units, ~47 days to exhaustion',
        'Conversational AI expansion in Customer Service ($780K–$1.2M)',
        'Resolution plan for two open streaming-latency escalations',
      ],
      context: [
        'ARR $2.4M · Health 87 · Renewal April 2027',
        'Customer Service 92% adopted · Training 76%',
        'Last executive business review: 74 days ago',
      ],
      questions: [
        'How is your team measuring the impact of automation this year?',
        'What would a successful conversational AI deployment look like to your exec team?',
        'What is the approval path and timeline for an expanded agreement?',
      ],
      signals: [
        'Gmail — Sarah Mitchell: "Following up on expanding usage" (2h ago)',
        'Slack #acme-deepgram — Sarah asked about conversational AI roadmap timeline (1h ago)',
        'Slack #acme-deepgram — Daniel flagged an STT streaming latency spike (3h ago)',
      ],
    },
  },
  {
    id: 'meridian-checkin',
    time: '11:30 AM',
    duration: '30 min',
    title: 'Meridian Financial Check-in',
    type: 'Account Check-in',
    account: 'Meridian Financial',
    accountId: 'meridian',
    attendees: [{ name: 'James Wei', title: 'VP Technology' }],
    prep: {
      objective:
        'Re-establish executive engagement after a 60-day decline and reaffirm the value roadmap ahead of the January renewal.',
      topics: [
        'Executive engagement decline over the past 60 days',
        'Renewal readiness (January 2027)',
        'Batch transcription accuracy concerns raised in support',
      ],
      context: [
        'ARR $1.8M · Health 72 (declining) · Renewal January 2027',
        'Products: Speech-to-Text, Batch Transcription',
        'Flagged as an at-risk account requiring attention',
      ],
      questions: [
        'What are your top technology priorities for the coming quarter?',
        'Has anything changed in how your team is using Deepgram?',
        'Are there blockers we can remove before renewal?',
      ],
      signals: [
        'Gmail — James Wei: "Checking in on our account" (2d ago)',
        'Slack #meridian-support — batch transcription accuracy below SLA (5h ago)',
      ],
    },
  },
  {
    id: 'pipeline-review',
    time: '2:00 PM',
    duration: '45 min',
    title: 'Internal Pipeline Review',
    type: 'Internal',
    account: 'Internal',
    accountId: null,
    attendees: [{ name: 'Sales Team', title: 'Deepgram' }],
    prep: {
      objective:
        'Align the team on portfolio expansion pipeline and prioritize the highest-confidence opportunities for the quarter.',
      topics: [
        'Portfolio expansion pipeline ($3.2M weighted)',
        'Acme conversational AI opportunity ($780K–$1.2M, 87% confidence)',
        'Northstar Voice Agent demo request',
        'At-risk accounts: Meridian, Atlas',
      ],
      context: [
        'Total ARR $10.29M · ARR at risk $2.69M',
        'Average portfolio health 81 · 2 accounts need attention',
        'Expansion pipeline $3.2M',
      ],
      questions: [
        'Which opportunities need executive air cover this quarter?',
        'Where do we need Solutions Engineering support?',
        'What is our plan for the two at-risk renewals?',
      ],
      signals: [
        'Slack #northstar-expansion — Voice Agent API demo requested (1d ago)',
        'Slack #atlas-retail — champion evaluating alternatives (2d ago)',
      ],
    },
  },
  {
    id: 'northstar-discovery',
    time: '4:00 PM',
    duration: '45 min',
    title: 'Northstar Telecom Expansion Discovery',
    type: 'Discovery Call',
    account: 'Northstar Telecom',
    accountId: 'northstar',
    attendees: [{ name: 'Mark Torres', title: 'CTO' }],
    prep: {
      objective:
        'Scope a Voice Agent API deployment for the contact-center team and address open questions from the expansion proposal review.',
      topics: [
        'Voice Agent API fit for contact-center operations',
        'Technical architecture and integration path',
        'Open questions from the expansion proposal review',
        'Success metrics and pilot scope',
      ],
      context: [
        'ARR $3.1M · Health 91 (expanding) · Renewal July 2027',
        'Usage growth +27% YoY — healthiest account in portfolio',
        'Products: STT, Streaming Recognition, Voice Agent',
      ],
      questions: [
        'Which contact-center workflows are the highest priority for automation?',
        'What does success look like for a Voice Agent pilot?',
        'What are the remaining questions from your proposal review?',
      ],
      signals: [
        'Gmail — Mark Torres: "Expansion proposal review" (3d ago)',
        'Slack #northstar-expansion — Voice Agent API demo requested (1d ago)',
      ],
    },
  },
];

// Next Best Actions + meeting prep brief for Acme Corporation.

export const recommendations = [
  {
    id: 'schedule-ebr',
    title: 'Schedule Executive Business Review',
    priority: 'HIGH',
    why: 'Executive engagement declined while usage accelerated — a strategic decision window is opening without the right people in the room.',
    stakeholders: ['Sarah Mitchell — VP Customer Experience'],
    objective: 'Align on expanding into conversational AI ahead of capacity exhaustion.',
    cta: 'Prepare Meeting',
    ctaType: 'meeting',
    impact: 'Protects $2.4M ARR and unlocks up to $1.2M expansion.',
  },
  {
    id: 'conversational-discovery',
    title: 'Initiate Conversational AI Discovery',
    priority: 'HIGH',
    why: 'Strong technical fit based on current streaming usage and an engaged technical champion ready to scope.',
    stakeholders: ['Daniel Rodriguez — Director of AI Platforms', 'Solutions Engineering'],
    objective: 'Scope a Voice Agent deployment in customer service.',
    cta: 'Create Opportunity',
    ctaType: 'opportunity',
    impact: 'Opens $780K–$1.2M conversational AI opportunity.',
  },
  {
    id: 'marketing-pilot',
    title: 'Launch Marketing Pilot',
    priority: 'MEDIUM',
    why: '4% adoption despite significant content needs — a low-friction land in an untapped business unit.',
    stakeholders: ['VP Marketing', 'Head of Content'],
    objective: 'Prove TTS value on a bounded content-automation use case.',
    cta: 'Create Adoption Plan',
    ctaType: 'plan',
    impact: 'Opens $180K–$300K marketing opportunity.',
  },
];

export const meetingBrief = {
  title: 'Executive Business Review — Acme Corporation',
  with: 'Sarah Mitchell, VP Customer Experience',
  objective:
    'Re-establish executive alignment and secure sponsorship to expand Deepgram from transcription into conversational AI before contracted capacity is exhausted.',
  whatChanged: [
    'Usage has grown +18% YoY and is now at 8.4M of 10M contracted units/month.',
    'Contracted volume is projected to be exhausted in approximately 47 days.',
    'Conversational AI pilots are showing early deflection results in customer service.',
    'No executive business review has taken place in 74 days.',
    'Two technical escalations were opened related to streaming latency at peak.',
  ],
  people: [
    { name: 'Sarah Mitchell', title: 'VP Customer Experience — Executive Sponsor' },
    { name: 'Daniel Rodriguez', title: 'Director of AI Platforms — Technical Champion' },
    { name: 'Jordan Tanaka', title: 'Sr. Manager, Customer Service Ops' },
  ],
  questions: [
    'How is the customer-experience team measuring the impact of automation this year?',
    'What would a successful conversational AI deployment look like to your executive team?',
    'Which customer-service workflows are the highest priority for deflection?',
    'What is the approval path and timeline for an expanded agreement?',
    'Are there adjacent teams (Sales, Marketing) evaluating voice AI independently?',
  ],
  nextStep:
    'Confirm a technical discovery session between Daniel Rodriguez and Deepgram Solutions Engineering within two weeks.',
  expansionValue: '$780K–$1.2M',
};

// Plain-text version of the brief for the "Copy Meeting Brief" action.
export const meetingBriefText = `EXECUTIVE BUSINESS REVIEW — ACME CORPORATION
With: ${meetingBrief.with}

OBJECTIVE
${meetingBrief.objective}

WHAT CHANGED SINCE LAST MEETING
${meetingBrief.whatChanged.map((c) => `• ${c}`).join('\n')}

PEOPLE TO ENGAGE
${meetingBrief.people.map((p) => `• ${p.name} — ${p.title}`).join('\n')}

QUESTIONS TO ASK
${meetingBrief.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

RECOMMENDED NEXT STEP
${meetingBrief.nextStep}

ESTIMATED EXPANSION VALUE
${meetingBrief.expansionValue}
`;

// Expansion opportunities for Acme Corporation.

export const opportunities = [
  {
    id: 'conversational-ai',
    title: 'Conversational AI — Customer Service',
    unit: 'Customer Service',
    potentialLow: 780_000,
    potentialHigh: 1_200_000,
    potentialLabel: '$780K–$1.2M',
    confidence: 87,
    evidence:
      'Strong existing speech usage and an established, high-volume customer-service operation already integrated with Deepgram streaming.',
    whyNow:
      'Usage growth signals the account is ready for the next phase; contracted capacity is nearly exhausted, creating a natural expansion moment.',
    nextStep: 'Schedule technical discovery with Daniel Rodriguez.',
    stakeholders: [
      'Daniel Rodriguez — Director of AI Platforms',
      'Sarah Mitchell — VP Customer Experience',
    ],
    products: ['Voice Agent API', 'Flux STT', 'Flux TTS'],
  },
  {
    id: 'sales-voice',
    title: 'Sales Voice Automation',
    unit: 'Sales',
    potentialLow: 250_000,
    potentialHigh: 400_000,
    potentialLabel: '$250K–$400K',
    confidence: 71,
    evidence:
      'Significant outbound sales volume and an existing CRM integration that can ingest transcribed call data with minimal engineering lift.',
    whyNow:
      'Sales adoption sits at just 34% despite high call volume — an efficiency and coaching win that maps directly to revenue.',
    nextStep: 'Sales pilot proposal.',
    stakeholders: ['VP Sales Operations', 'RevOps Lead'],
    products: ['Nova-3 STT', 'Batch Transcription'],
  },
  {
    id: 'marketing-voice',
    title: 'Marketing & Content Voice',
    unit: 'Marketing',
    potentialLow: 180_000,
    potentialHigh: 300_000,
    potentialLabel: '$180K–$300K',
    confidence: 64,
    evidence:
      'High volume of content production paired with very low current adoption (4%) — a large, untapped whitespace.',
    whyNow:
      'Content velocity is increasing and TTS can automate voiceover and localization workflows at scale.',
    nextStep: 'Stakeholder mapping in Marketing.',
    stakeholders: ['VP Marketing', 'Head of Content'],
    products: ['Flux TTS', 'Batch Transcription'],
  },
];

// Weighted pipeline used in health / portfolio math (~$1.9M for Acme).
export const totalExpansionValue = opportunities.reduce(
  (sum, o) => sum + Math.round((o.potentialLow + o.potentialHigh) / 2),
  0,
);

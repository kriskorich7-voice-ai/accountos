// Deepgram product adoption for Acme Corporation.

export const products = [
  {
    id: 'stt',
    name: 'Speech-to-Text',
    tagline: 'Nova-3 transcription',
    status: 'Adopted',
    adoption: 78,
    growth: 24,
    description:
      'Primary workload. Powering real-time and batch transcription across Customer Service and Training.',
  },
  {
    id: 'tts',
    name: 'Text-to-Speech',
    tagline: 'Flux TTS voices',
    status: 'Emerging',
    adoption: 34,
    growth: 38,
    description:
      'Emerging use in automated notifications and IVR prompts. Accelerating quarter over quarter.',
  },
  {
    id: 'voice-agent',
    name: 'Voice / Conversational AI',
    tagline: 'Voice Agent API',
    status: 'Emerging',
    adoption: 8,
    growth: 140,
    description:
      'Early pilots in customer-service deflection. Highest growth rate and strategic focus for expansion.',
  },
  {
    id: 'streaming',
    name: 'Streaming Speech Recognition',
    tagline: 'Real-time WebSocket',
    status: 'Adopted',
    adoption: 61,
    growth: 19,
    description:
      'Live agent-assist and real-time analytics in the contact center.',
  },
  {
    id: 'batch',
    name: 'Batch Transcription',
    tagline: 'Async pre-recorded',
    status: 'Adopted',
    adoption: 52,
    growth: 8,
    description:
      'Post-call analytics, QA scoring, and training corpus generation.',
  },
];

// Business-unit penetration — drives the adoption matrix and whitespace analysis.
export const businessUnits = [
  { name: 'Customer Service', current: 92, potential: 98 },
  { name: 'Training', current: 76, potential: 90 },
  { name: 'Sales', current: 34, potential: 85 },
  { name: 'Operations', current: 18, potential: 70 },
  { name: 'Marketing', current: 4, potential: 75 },
  { name: 'Digital Experience', current: 0, potential: 80 },
];

export const adoptionInsight =
  'Customer Service and Training have strong adoption, but Sales and Marketing remain significantly underpenetrated. Digital Experience has no current adoption despite strong potential fit.';

export const whitespaceInsight =
  'The largest whitespace is in Digital Experience (0% → 80% potential) and Marketing (4% → 75%). Sales represents the fastest path to expansion given existing CRM integration and outbound volume.';

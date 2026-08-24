// Renewal pipeline for the 5 portfolio accounts.

export const renewalSummary = {
  totalUpForRenewal: 10_290_000,
  arrAtRisk: 2_690_000, // health < 75
  arrOnTrack: 7_600_000,
};

export const renewals = [
  {
    id: 'atlas',
    account: 'Atlas Retail',
    arr: 890_000,
    daysRemaining: 23,
    renewalDate: 'November 2026',
    health: 68,
    risk: 'HIGH',
    status: 'AT RISK',
    signal: 'Usage declining, no QBR in 90 days.',
    action: 'Emergency executive outreach + renewal incentive.',
    strategy: {
      objective:
        'Stabilize the account and secure a renewal despite declining usage and a lapsed executive relationship.',
      risks: [
        'Usage has contracted for two consecutive quarters',
        'Technical champion left the company',
        'No executive business review in 90 days',
      ],
      structure:
        'Offer a 1-year renewal with a temporary usage-based incentive and a success plan to re-grow adoption; avoid multi-year lock-in until health recovers.',
      stakeholders: ['Chief Product Officer', 'VP Operations', 'Procurement'],
      talkingPoints: [
        'Reaffirm ROI on the batch transcription workload',
        'Introduce a new executive sponsor from Deepgram',
        'Propose a 60-day re-adoption success plan',
      ],
      competitive: 'Evaluating a lower-cost transcription vendor on price alone.',
    },
  },
  {
    id: 'meridian',
    account: 'Meridian Financial',
    arr: 1_800_000,
    daysRemaining: 47,
    renewalDate: 'January 2027',
    health: 72,
    risk: 'HIGH',
    status: 'AT RISK',
    signal: 'Executive engagement dropped, evaluating alternatives.',
    action: 'Executive sponsor alignment + competitive defense.',
    strategy: {
      objective:
        'Re-establish executive sponsorship and defend the account against a competitive evaluation ahead of renewal.',
      risks: [
        'Executive engagement down sharply over 60 days',
        'Open support escalation on batch accuracy vs SLA',
        'Actively evaluating an alternative vendor',
      ],
      structure:
        'Multi-year renewal with a modest loyalty discount contingent on an executive success partnership and quarterly business reviews.',
      stakeholders: ['James Wei — VP Technology', 'CFO', 'Head of Support'],
      talkingPoints: [
        'Resolve the batch-accuracy escalation before terms discussion',
        'Present a head-to-head accuracy benchmark',
        'Reset the QBR cadence with executive attendance',
      ],
      competitive: 'Incumbent challenger pitching a bundled contact-center suite.',
    },
  },
  {
    id: 'acme',
    account: 'Acme Corporation',
    arr: 2_400_000,
    daysRemaining: 240,
    renewalDate: 'April 2027',
    health: 87,
    risk: 'LOW',
    status: 'ON TRACK',
    signal: 'Usage growing 18%, capacity exhaustion signal — expansion opportunity.',
    action: 'Begin expansion conversation before renewal.',
    strategy: {
      objective:
        'Convert strong usage growth and an approaching capacity ceiling into an expanded, multi-year renewal.',
      risks: [
        'Contracted capacity projected to exhaust in ~47 days',
        'No executive business review in 74 days',
        'Two open streaming-latency escalations',
      ],
      structure:
        'Multi-year renewal that folds in a conversational-AI expansion tier and a higher capacity commit with volume pricing.',
      stakeholders: ['Sarah Mitchell — VP CX', 'Daniel Rodriguez — Director AI Platforms'],
      talkingPoints: [
        'Frame capacity exhaustion as an expansion moment',
        'Anchor on the $780K–$1.2M conversational-AI opportunity',
        'Propose a capacity uplift + committed-use discount',
      ],
      competitive: null,
    },
  },
  {
    id: 'horizon',
    account: 'Horizon Healthcare',
    arr: 2_100_000,
    daysRemaining: 270,
    renewalDate: 'May 2027',
    health: 84,
    risk: 'LOW',
    status: 'ON TRACK',
    signal: 'Stable usage, new business unit adopting.',
    action: 'Schedule QBR to align on expansion.',
    strategy: {
      objective:
        'Maintain healthy retention and expand into patient-facing voice as a new business unit onboards.',
      risks: ['Expansion depends on a single business-unit sponsor', 'Compliance review adds cycle time'],
      structure:
        'Standard multi-year renewal with an expansion option for the patient-services voice use case.',
      stakeholders: ['VP Operations', 'Chief Medical Information Officer'],
      talkingPoints: [
        'Celebrate stable clinical-documentation adoption',
        'Scope the patient-services voice pilot',
        'Align on a compliance and security review path',
      ],
      competitive: null,
    },
  },
  {
    id: 'northstar',
    account: 'Northstar Telecom',
    arr: 3_100_000,
    daysRemaining: 330,
    renewalDate: 'July 2027',
    health: 91,
    risk: 'LOW',
    status: 'ON TRACK',
    signal: 'Fastest growing account, strong expansion pipeline.',
    action: 'Lock in multi-year renewal with expansion commit.',
    strategy: {
      objective:
        'Secure an early multi-year renewal with a committed expansion into Voice Agent across the contact center.',
      risks: ['High growth could attract competitive attention', 'Scaling latency requirements at peak'],
      structure:
        'Three-year renewal with a committed expansion tier and volume pricing tied to contact-center rollout milestones.',
      stakeholders: ['Mark Torres — CTO', 'VP Contact Center Operations'],
      talkingPoints: [
        'Reward growth with committed-use pricing',
        'Attach the Voice Agent expansion to the renewal',
        'Offer a joint reference/case-study partnership',
      ],
      competitive: null,
    },
  },
];

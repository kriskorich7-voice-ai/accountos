// Account Health Score breakdown for Acme Corporation.
// Composite = 87/100. Each component is clickable in the UI to reveal the
// supporting signals that produced its score.

export const healthScore = 87;

export const healthComponents = [
  {
    id: 'adoption',
    label: 'Product Adoption',
    score: 91,
    weight: 20,
    summary: 'Broad usage across three core products with expanding surface area.',
    signals: [
      'Speech-to-Text adopted at 78% of eligible workflows',
      'Streaming recognition live in agent-assist',
      '5 of 5 core products in active use',
      'API call volume up 22% QoQ',
    ],
  },
  {
    id: 'usage-growth',
    label: 'Usage Growth',
    score: 94,
    weight: 20,
    summary: 'Consistent month-over-month growth, now approaching contracted capacity.',
    signals: [
      '+18% year-over-year usage growth',
      '8.4M of 10M contracted units/month',
      'Positive growth in 11 of last 12 months',
      'Projected to exceed capacity in ~47 days',
    ],
  },
  {
    id: 'exec-engagement',
    label: 'Executive Engagement',
    score: 82,
    weight: 15,
    summary: 'Strong sponsor relationship, but no formal business review in 74 days.',
    signals: [
      'Executive sponsor: Sarah Mitchell (VP CX)',
      'Last executive business review: 74 days ago',
      '3 of 4 planned QBRs completed this year',
      'Sponsor responsiveness declining slightly',
    ],
  },
  {
    id: 'support-sentiment',
    label: 'Support Sentiment',
    score: 79,
    weight: 15,
    summary: 'Generally positive, dampened by two open technical escalations.',
    signals: [
      'CSAT 4.4 / 5.0 over trailing 90 days',
      '2 unresolved technical escalations',
      'Median first response: 3.2 hours',
      'No P1 incidents in last quarter',
    ],
  },
  {
    id: 'commercial-health',
    label: 'Commercial Health',
    score: 92,
    weight: 15,
    summary: 'On-time payments, healthy margin, multi-year contract in good standing.',
    signals: [
      '$2.4M ARR / $4.8M total contract value',
      '100% on-time invoice payment history',
      'Renewal in 8 months (April 2027)',
      'No active discounting or credits',
    ],
  },
  {
    id: 'expansion-potential',
    label: 'Expansion Potential',
    score: 96,
    weight: 15,
    summary: 'Multiple high-confidence expansion paths across underpenetrated units.',
    signals: [
      '3 qualified expansion opportunities',
      '$1.9M weighted pipeline identified',
      'Digital Experience and Marketing whitespace',
      'Conversational AI fit confidence: 87%',
    ],
  },
];

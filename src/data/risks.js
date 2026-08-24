// Account risks for Acme Corporation.

export const risks = [
  {
    id: 'usage-capacity',
    title: 'Usage Capacity Risk',
    severity: 'HIGH',
    summary: 'Projected contracted volume exhaustion in 47 days.',
    detail:
      'At the current +18% growth rate, monthly usage (8.4M units) is projected to exceed the 10M contracted capacity in approximately 47 days. Without an expansion agreement, overage billing or a hard cap will be triggered.',
    signals: [
      'Current usage 8.4M / 10M contracted units per month',
      'Growth compounding at ~1.4% per month',
      'Overage terms trigger at 100% of contracted volume',
    ],
    recommendation: 'Begin an expansion conversation within the next 14 days.',
    impact: 'Revenue risk + potential customer friction from service throttling.',
  },
  {
    id: 'exec-engagement',
    title: 'Executive Engagement Risk',
    severity: 'MEDIUM',
    summary: 'No executive business review in 74 days.',
    detail:
      'The last executive business review with Sarah Mitchell (VP Customer Experience) was 74 days ago. Sponsor responsiveness has softened while usage has accelerated — a misalignment between strategic momentum and executive visibility.',
    signals: [
      'Last EBR: 74 days ago',
      'Sponsor email response time up 2.3x',
      'No executive present in last two syncs',
    ],
    recommendation: 'Schedule an executive business review to re-align on expansion.',
    impact: 'Reduced strategic alignment ahead of a material expansion decision.',
  },
  {
    id: 'support',
    title: 'Support Risk',
    severity: 'MEDIUM',
    summary: 'Two unresolved technical escalations.',
    detail:
      'Two technical escalations remain open beyond the standard resolution window, both related to streaming latency under peak load. These are dampening an otherwise strong support sentiment score.',
    signals: [
      '2 escalations open > 10 business days',
      'Both tied to streaming latency at peak',
      'Owned by Solutions Engineering',
    ],
    recommendation: 'Drive escalations to resolution before the next EBR.',
    impact: 'Erodes technical champion confidence during expansion evaluation.',
  },
];

// Net Revenue Retention analytics for the portfolio.

export const nrrMetrics = {
  nrr: 118,
  grossRetention: 94,
  expansionARR: 1_200_000,
  churnedARR: 180_000,
  netNewARR: 1_020_000,
};

// ARR waterfall (values in $M). `base` is a transparent spacer so the colored
// `size` bar floats to form the waterfall; Starting/Ending are full-height bars.
export const arrWaterfall = [
  { name: 'Starting ARR', base: 0, size: 9.2, label: '$9.2M', color: '#94a3b8' },
  { name: 'Expansions', base: 9.2, size: 1.2, label: '+$1.2M', color: '#10b981' },
  { name: 'Contractions', base: 10.315, size: 0.085, label: '-$85K', color: '#f59e0b' },
  { name: 'Churn', base: 10.135, size: 0.18, label: '-$180K', color: '#f43f5e' },
  { name: 'Ending ARR', base: 0, size: 10.29, label: '$10.29M', color: '#6366f1' },
];

// 12-month NRR trend (%).
export const nrrTrend = [
  { month: 'Jan', nrr: 108 },
  { month: 'Feb', nrr: 110 },
  { month: 'Mar', nrr: 109 },
  { month: 'Apr', nrr: 112 },
  { month: 'May', nrr: 114 },
  { month: 'Jun', nrr: 111 },
  { month: 'Jul', nrr: 115 },
  { month: 'Aug', nrr: 116 },
  { month: 'Sep', nrr: 113 },
  { month: 'Oct', nrr: 117 },
  { month: 'Nov', nrr: 116 },
  { month: 'Dec', nrr: 118 },
];

// Account-level expansion / contraction / churn movement.
export const arrMovement = [
  { account: 'Northstar Telecom', amount: 420_000, type: 'expansion', reason: 'Voice Agent adoption' },
  { account: 'Acme Corporation', amount: 380_000, type: 'expansion', reason: 'TTS + streaming' },
  { account: 'Horizon Healthcare', amount: 400_000, type: 'expansion', reason: 'New business unit' },
  { account: 'Atlas Retail', amount: -85_000, type: 'contraction', reason: 'Reduced batch usage' },
  { account: 'Meridian Financial', amount: -180_000, type: 'churn', reason: 'Contract ended' },
];

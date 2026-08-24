// Usage history + forecast for Acme Corporation.
// Historical: 12 months of monthly units. Current run-rate 8.4M units/month,
// +18% YoY growth, contracted capacity 10M units/month, projected exhaustion
// ~47 days out. The forecast segment continues the compounding monthly growth
// (~1.4%/mo ≈ 18% annualized) until it crosses the 10M capacity line.

export const usageMeta = {
  current: 8_400_000,
  currentLabel: '8.4M',
  capacity: 10_000_000,
  capacityLabel: '10M',
  growthYoY: 18,
  monthlyGrowth: 1.4,
  projectedExhaustionDays: 47,
  unit: 'units/month',
};

// value = actual historical usage; forecast = null for history so the solid line
// stops at "current". The overlap point (Aug '26) carries both so the lines join.
export const usageSeries = [
  { month: 'Sep', label: "Sep '25", value: 7.12, forecast: null, capacity: 10 },
  { month: 'Oct', label: "Oct '25", value: 7.26, forecast: null, capacity: 10 },
  { month: 'Nov', label: "Nov '25", value: 7.41, forecast: null, capacity: 10 },
  { month: 'Dec', label: "Dec '25", value: 7.58, forecast: null, capacity: 10 },
  { month: 'Jan', label: "Jan '26", value: 7.69, forecast: null, capacity: 10 },
  { month: 'Feb', label: "Feb '26", value: 7.82, forecast: null, capacity: 10 },
  { month: 'Mar', label: "Mar '26", value: 7.95, forecast: null, capacity: 10 },
  { month: 'Apr', label: "Apr '26", value: 8.03, forecast: null, capacity: 10 },
  { month: 'May', label: "May '26", value: 8.14, forecast: null, capacity: 10 },
  { month: 'Jun', label: "Jun '26", value: 8.23, forecast: null, capacity: 10 },
  { month: 'Jul', label: "Jul '26", value: 8.31, forecast: null, capacity: 10 },
  { month: 'Aug', label: "Aug '26", value: 8.4, forecast: 8.4, capacity: 10 },
  { month: 'Sep+', label: "Sep '26", value: null, forecast: 8.87, capacity: 10 },
  { month: 'Oct+', label: "Oct '26", value: null, forecast: 9.36, capacity: 10 },
  { month: 'Nov+', label: "Nov '26", value: null, forecast: 9.88, capacity: 10 },
  { month: 'Dec+', label: "Dec '26", value: null, forecast: 10.42, capacity: 10 },
  { month: 'Jan+', label: "Jan '27", value: null, forecast: 11.0, capacity: 10 },
];

// Simple sparkline series for account cards (12-month normalized trend).
export const usageSparklines = {
  acme: [7.1, 7.26, 7.41, 7.58, 7.69, 7.82, 7.95, 8.03, 8.14, 8.23, 8.31, 8.4],
  meridian: [6.2, 6.3, 6.25, 6.4, 6.35, 6.3, 6.45, 6.4, 6.5, 6.42, 6.55, 6.44],
  northstar: [4.1, 4.3, 4.6, 4.9, 5.2, 5.6, 6.0, 6.4, 6.9, 7.4, 7.9, 8.4],
  atlas: [3.4, 3.35, 3.3, 3.2, 3.25, 3.1, 3.05, 3.0, 2.95, 2.9, 2.85, 2.8],
  horizon: [5.1, 5.2, 5.25, 5.35, 5.4, 5.5, 5.55, 5.62, 5.7, 5.78, 5.85, 5.9],
};

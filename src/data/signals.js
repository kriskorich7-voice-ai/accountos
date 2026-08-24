// Customer Slack signals surfaced from the Slack connector.

// Status badge styling — color coded per the design spec.
export const signalStatusClasses = {
  'NEEDS RESPONSE': 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  ESCALATE: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  'SCHEDULE DEMO': 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
  'AT RISK': 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
};

export const signals = [
  {
    id: 'acme-roadmap',
    channel: '#acme-deepgram',
    company: 'Acme Corporation',
    message:
      'Sarah Mitchell asked about the roadmap timeline for conversational AI features',
    time: '1 hour ago',
    nextStep: 'Schedule roadmap briefing call',
    status: 'NEEDS RESPONSE',
    priority: 'HIGH',
  },
  {
    id: 'acme-latency',
    channel: '#acme-deepgram',
    company: 'Acme Corporation',
    message: 'Daniel Rodriguez flagged a latency spike in the STT streaming endpoint',
    time: '3 hours ago',
    nextStep: 'Escalate to technical support immediately',
    status: 'ESCALATE',
    priority: 'HIGH',
  },
  {
    id: 'meridian-sla',
    channel: '#meridian-support',
    company: 'Meridian Financial',
    message: 'Unresolved ticket escalated — batch transcription accuracy below SLA',
    time: '5 hours ago',
    nextStep: 'Escalate to CSM and engineering',
    status: 'ESCALATE',
    priority: 'HIGH',
  },
  {
    id: 'northstar-demo',
    channel: '#northstar-expansion',
    company: 'Northstar Telecom',
    message: 'Team requesting a demo of the Voice Agent API for their contact center team',
    time: 'Yesterday',
    nextStep: 'Schedule Voice Agent API demo',
    status: 'SCHEDULE DEMO',
    priority: 'MEDIUM',
  },
  {
    id: 'atlas-churn',
    channel: '#atlas-retail',
    company: 'Atlas Retail',
    message: 'Champion mentioned they are evaluating alternatives due to budget pressure',
    time: '2 days ago',
    nextStep: 'Schedule executive call to address concerns',
    status: 'AT RISK',
    priority: 'HIGH',
  },
];

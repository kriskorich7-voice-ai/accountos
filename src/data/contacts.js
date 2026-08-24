// Key stakeholders for Acme Corporation.

export const contacts = [
  {
    id: 'sarah-mitchell',
    name: 'Sarah Mitchell',
    title: 'VP Customer Experience',
    role: 'Executive Sponsor',
    influence: 'high',
    sentiment: 'positive',
    lastContactDays: 74,
    email: 'sarah.mitchell@acme.example',
    notes:
      'Owns the customer-experience mandate and the budget for conversational AI. Engagement has cooled — priority re-engagement target.',
  },
  {
    id: 'daniel-rodriguez',
    name: 'Daniel Rodriguez',
    title: 'Director of AI Platforms',
    role: 'Technical Champion',
    influence: 'high',
    sentiment: 'positive',
    lastContactDays: 9,
    email: 'daniel.rodriguez@acme.example',
    notes:
      'Deepgram advocate driving the platform architecture. Best entry point for conversational AI technical discovery.',
  },
  {
    id: 'j-tanaka',
    name: 'Jordan Tanaka',
    title: 'Senior Manager, Customer Service Ops',
    role: 'Day-to-day Owner',
    influence: 'medium',
    sentiment: 'neutral',
    lastContactDays: 21,
    email: 'jordan.tanaka@acme.example',
    notes:
      'Operational owner of the contact-center deployment. Feels the capacity ceiling first.',
  },
  {
    id: 'p-okafor',
    name: 'Priya Okafor',
    title: 'VP Sales Operations',
    role: 'Expansion Prospect',
    influence: 'medium',
    sentiment: 'unknown',
    lastContactDays: null,
    email: 'priya.okafor@acme.example',
    notes:
      'Not yet engaged. Gateway to the Sales Voice Automation opportunity.',
  },
];

export const getContact = (id) => contacts.find((c) => c.id === id);

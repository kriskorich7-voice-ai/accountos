// AccountOS Copilot — Claude call + local fallback knowledge base.

export const SYSTEM_PROMPT =
  'You are AccountOS, an AI strategic account intelligence copilot for Kris Korich, a Strategic Account Manager at Deepgram. You have deep knowledge of the Acme Corporation account. Key facts: $2.4M ARR, 87 health score, 18% usage growth, projected capacity exhaustion in 47 days, 3 expansion opportunities (Conversational AI $780K-$1.2M, Sales Voice $250K-$400K, Marketing $180K-$300K), business units: Customer Service 92% adopted, Training 76%, Sales 34%, Operations 18%, Marketing 4%, Digital Experience 0%, key contacts: Sarah Mitchell VP CX, Daniel Rodriguez Director AI Platforms. Answer questions about the account strategically and concisely. Be direct and actionable.';

// Low-level call to the Anthropic proxy (claude-sonnet-4-6). Throws on failure.
export async function callClaude({ system, messages, maxTokens = 1024 }) {
  const res = await fetch('/api/anthropic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!res.ok) throw new Error(`Proxy ${res.status}`);
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Empty response');
  return text.trim();
}

// Copilot Q&A. Throws if unavailable so the caller can fall back to localAnswer.
export async function askClaude(history, userText) {
  const messages = [
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userText },
  ];
  return callClaude({ system: SYSTEM_PROMPT, messages });
}

const EMAIL_SYSTEM =
  'You are AccountOS, drafting email replies on behalf of Kris Korich, a Strategic Account Manager at Deepgram. Write a concise, warm, professional reply that moves the deal or relationship forward with a clear next step. Sign off as "Kris". Return only the email body, no subject line or preamble.';

// Drafts an AI reply to an inbox email. Throws so the caller can fall back.
export async function draftEmailReply(email) {
  const prompt = `Draft a reply to this email.\n\nFrom: ${email.from} (${email.title}, ${email.company})\nSubject: ${email.subject}\n\n${email.body}\n\nSuggested action: ${email.suggestedAction}`;
  return callClaude({
    system: EMAIL_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 600,
  });
}

// Deterministic offline fallback draft.
export function localEmailReply(email) {
  const first = email.from.split(' ')[0];
  return `Hi ${first},

Thanks for reaching out — great to hear from you.

${email.suggestedAction}. I'd suggest we grab 30 minutes this week so I can walk you through the details and make sure we're aligned on next steps. I'll follow up with a couple of times that work.

In the meantime, let me know if there's anything specific you'd like me to prepare ahead of our conversation.

Best,
Kris`;
}

// Deterministic local responder used when the proxy/API key isn't configured.
export function localAnswer(q) {
  const t = q.toLowerCase();

  if (t.includes('health') || t.includes('healthy'))
    return "Acme is healthy at 87/100. The strongest signals are Expansion Potential (96), Usage Growth (94), and Commercial Health (92) — Acme pays on time, is on a $4.8M multi-year contract, and usage has grown +18% YoY. The two softer areas are Support Sentiment (79), pulled down by two open escalations, and Executive Engagement (82), with no business review in 74 days. Net: a strong, expanding account that needs an executive touch.";

  if (t.includes('next') || t.includes('do next') || t.includes('should i'))
    return 'Three moves, in order: 1) Schedule an Executive Business Review with Sarah Mitchell (VP CX) — engagement has cooled while usage accelerated. 2) Initiate Conversational AI discovery with Daniel Rodriguez — strong technical fit, $780K–$1.2M. 3) Launch a Marketing TTS pilot to land an untapped unit (4% adoption). The EBR is the unlock — capacity runs out in ~47 days.';

  if (t.includes('expansion') || t.includes('opportunit') || t.includes('biggest'))
    return 'The biggest opportunity is Conversational AI in Customer Service: $780K–$1.2M at 87% confidence. Acme already runs high-volume streaming speech in an established CS operation, and usage growth signals readiness. Next step: technical discovery with Daniel Rodriguez on Voice Agent API, Flux STT, and Flux TTS. Sales Voice ($250K–$400K) and Marketing ($180K–$300K) follow.';

  if (t.includes('business unit') || t.includes("aren't using") || t.includes('not using') || t.includes('whitespace') || t.includes('penetration'))
    return 'Underpenetrated units: Digital Experience (0%), Marketing (4%), Operations (18%), and Sales (34%). Digital Experience is the largest whitespace (0% → 80% potential) but Sales is the fastest path given existing CRM integration and outbound call volume. Customer Service (92%) and Training (76%) are already strong.';

  if (t.includes('meeting') || t.includes('prepare') || t.includes('brief'))
    return 'For your next meeting — an EBR with Sarah Mitchell — the objective is to secure sponsorship to expand into conversational AI before capacity is exhausted. What changed: usage is at 8.4M of 10M contracted units, exhaustion in ~47 days, and it has been 74 days since the last EBR. Bring Daniel Rodriguez, lead with the capacity signal, and land a technical discovery session as the next step. Estimated value: $780K–$1.2M. Open the Actions tab for the full brief.';

  if (t.includes('risk'))
    return 'One HIGH risk: usage capacity exhaustion in ~47 days at the current +18% rate (8.4M/10M units). Two MEDIUM risks: no executive business review in 74 days, and two unresolved streaming-latency escalations. The capacity risk is really an expansion trigger — act within 14 days.';

  if (t.includes('renewal') || t.includes('contract') || t.includes('arr'))
    return "Acme is $2.4M ARR on a $4.8M total contract, renewing in 8 months (April 2027). Commercial health is 92 — 100% on-time payments, no active discounting. The renewal is a natural moment to fold in the conversational AI expansion.";

  return "I'm AccountOS, your copilot for Acme Corporation. Ask about account health, expansion opportunities, risks, business-unit whitespace, or preparing for your next meeting. Quick snapshot: $2.4M ARR, 87 health, +18% usage growth, and contracted capacity projected to run out in ~47 days.";
}

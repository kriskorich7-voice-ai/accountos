# AccountOS

**AI-native Strategic Account Intelligence platform.** AccountOS consolidates
customer data and turns it into Account Intelligence → Risks → Opportunities →
Recommendations → Actions.

Built with React + Vite + Tailwind CSS, Recharts, Lucide, and React Router.
Featured account: **Acme Corporation** (Financial Services, North America).

## Screens

- **Portfolio** — portfolio-level metrics and account cards
- **Account Overview** — health decomposition + usage/capacity forecast
- **Adoption** — product adoption and business-unit penetration matrix
- **Intelligence** — risks, expansion opportunities, whitespace analysis
- **Next Best Actions** — prioritized actions + AI meeting-prep brief
- **AI Copilot** — text + voice copilot (Claude Sonnet 4.6, Deepgram STT/TTS)

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

### Environment variables

Copy `.env.example` to `.env` and fill in:

- `VITE_DEEPGRAM_API_KEY` — enables Copilot voice (STT + TTS). Optional; the
  Copilot falls back to text-only when absent.
- `ANTHROPIC_API_KEY` — read server-side by `/api/anthropic`. When the proxy is
  unavailable (e.g. local `vite dev`), the Copilot uses a built-in knowledge
  base so the demo still works.

## Build & deploy

```bash
npm run build
```

Deploys to Vercel: the SPA rewrite lives in `vercel.json` and the Claude proxy
in `api/anthropic.js`.

## Data layer

All demo data is in `src/data/` and is internally consistent — charts, metrics,
and AI copy derive from the same source of truth.

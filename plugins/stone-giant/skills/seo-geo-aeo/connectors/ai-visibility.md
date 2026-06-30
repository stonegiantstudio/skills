# Connector: AI-answer visibility (citation tracking)

```
last_verified: 2026-06-25
feeds: dimension 6 (AI-surface presence)
cost: free (manual protocol) | paid SaaS (automated tools)
depth: manual protocol (default) + API/MCP
```

**Unique data:** whether the brand/page is actually **cited inside AI answers**
(ChatGPT, Perplexity, Google AI Overviews/AI Mode, Gemini, Claude) — the core
GEO/AEO outcome. This is the **least automatable for free**, so the default is a
manual protocol; treat it honestly.

## Ingestion (preference order)

### 1. Manual citation protocol (method=manual — default, free)
- Build a small set of **representative prompts** the target should win, e.g.:
  - Category: *"What are the best `<category>` tools/options?"*
  - Task: *"How do I `<the task this page answers>`?"*
  - Brand: *"Tell me about `<brand>` — is it reputable?"*
- Run each in ChatGPT, Perplexity, Gemini, Claude, and a Google AI Overview.
- Record per engine: **cited? (y/n)**, position/order, the URL cited, and which
  **competitors** were cited. Save screenshots into `docs/seo/`.
- This is `method=manual` — real but small-sample and time-stamped; say so.

### 2. API / MCP (method=api)
- **Otterly.AI** — API + MCP + its own Claude skill; brand citations and
  share-of-voice across ChatGPT/Gemini/AI Overviews/Perplexity/Copilot
  (~from $29/mo). **Profound** — enterprise AI-visibility analytics.
- Use a tool's API only with a user-supplied key (`OTTERLY_API_KEY`) — check the
  project `.env`, not the bare shell (see SKILL.md); if absent there, **ask**,
  otherwise stay manual.

## Provenance & freshness
- Manual → **measured but small-sample** (a handful of prompts on one day);
  never extrapolate to "we're cited X% of the time." Automated tools → measured
  at the tool's sampling. `track` compares same-engine, same-prompt-set only.

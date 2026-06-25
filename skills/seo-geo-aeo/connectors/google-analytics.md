# Connector: Google Analytics 4 (GA4)

```
last_verified: 2026-06-25
feeds: outcomes (traffic, engagement, conversions) + AI-referral signal for dimension 6; track
cost: free
```

**Unique data:** what visitors *do* after they arrive — sessions, engagement,
conversions, channel attribution — and, importantly, **AI-referral traffic**
(sessions sent from chatgpt.com, perplexity.ai, gemini.google.com, etc.), a
free proxy for GEO/AEO working.

## Ingestion (preference order)

### 1. API (method=api)
- **GA4 Data API v1** `properties.runReport`. Property ID required.
  <https://developers.google.com/analytics/devguides/reporting/data/v1>
- Channel mix: dimension `sessionDefaultChannelGroup`, metric `sessions`,
  `engagementRate`, `conversions`.
- Landing pages: dimension `landingPage`.
- **AI referrals:** dimension `sessionSource`, then filter for `chatgpt.com`,
  `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, etc.
- Auth: OAuth / service account with Analytics read access — user-supplied.

### 2. MCP (method=mcp)
- Community GA4 MCP servers expose `runReport`-style tools. Use if connected.

### 3. Paste / screenshot / export (method=screenshot)
- **Reports → Acquisition → Traffic acquisition:** the table keyed by
  *Session default channel group* (Organic Search, Referral, Direct, …) with
  Sessions / Engaged sessions / Engagement rate / Conversions columns.
- For AI referrals: in that table switch the primary dimension to
  **Session source/medium** and look for the AI hostnames above.
- **Engagement → Landing page** for per-page outcomes.

## Provenance & freshness
- `method=api`/`mcp` → **measured**. GA4 sampling can apply on large ranges —
  note it. AI-referral counts are a *proxy*, not a citation count; label as such.

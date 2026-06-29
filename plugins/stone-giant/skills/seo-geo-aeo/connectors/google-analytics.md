# Connector: Google Analytics 4 (GA4)

```
last_verified: 2026-06-26
feeds: outcomes (traffic, engagement, conversions) + AI-referral signal for dimension 6; track
cost: free
```

**Unique data:** what visitors *do* after they arrive — sessions, engagement,
conversions, channel attribution — and, importantly, **AI-referral traffic**
(sessions sent from chatgpt.com, perplexity.ai, gemini.google.com, etc.), a
free proxy for GEO/AEO working.

## Ingestion (preference order)

### 1. API (method=api)

**Auth — same service-account → token flow as GSC**, but scope
`https://www.googleapis.com/auth/analytics.readonly`. One SA JSON can serve both
GSC and GA4; mint a token per scope. **Gotcha:** the SA *email* must be added to
the GA4 property (Admin → Property access management → Viewer), and you need the
numeric **Property ID** (`GA4_PROPERTY_ID`, from Admin → Property details) — calls
404/403 without both.

- **GA4 Data API v1** `properties.runReport` → `POST
  https://analyticsdata.googleapis.com/v1beta/properties/<GA4_PROPERTY_ID>:runReport`.
  <https://developers.google.com/analytics/devguides/reporting/data/v1>
- Channel mix: dimension `sessionDefaultChannelGroup`, metrics `sessions`,
  `engagementRate`, `conversions`. Landing pages: dimension `landingPage`.
- **AI referrals:** dimension `sessionSource` with a `PARTIAL_REGEXP`
  `dimensionFilter` for `chatgpt|perplexity|gemini|copilot|openai|claude`.
- Credentials `GA4_PROPERTY_ID` + `GA4_SERVICE_ACCOUNT_JSON` (or
  `GA4_ACCESS_TOKEN`). If unset, **ask** — do not hunt for keys.

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
- **GA4 Organic ≠ GSC clicks** — they will diverge (e.g. GA4 Organic 32 vs GSC 8
  clicks) and that is *not* an error: GA4 Organic spans all engines and uses
  session attribution; GSC counts Google clicks only. Different sources — `track`
  diffs each against itself, never one against the other.

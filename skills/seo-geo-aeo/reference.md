# SEO / GEO / AEO: primary sources

The methodology in `SKILL.md` is distilled from these. **Verify a claim here
before quoting it as first-party** — and prefer the measured academic numbers
over vendor "Nx lift" figures, which are rarely independently reproduced.

This file is part of the **volatile** layer: `refresh` updates it when the
research frontier or platform guidance moves. Each entry notes what it backs.

## The evidence base (GEO tactic numbers)

- **GEO: Generative Engine Optimization** — Aggarwal, Murahari, Rajpurohit,
  Kalyan, Narasimhan, Deshpande (Princeton / Georgia Tech / Allen Institute for
  AI / IIT Delhi). **KDD 2024.** <https://arxiv.org/abs/2311.09735> · ACM:
  <https://dl.acm.org/doi/10.1145/3637528.3671900>
  - Introduces the GEO framework + **GEO-Bench** (~10k queries) and measures 9
    content interventions via **Position-Adjusted Word Count (PAWC)** and
    Subjective Impression. Backs the ladder's Tier-1 ranking: the paper's own
    summary states its **top-performing methods — Cite Sources, Quotation
    Addition, Statistics Addition — achieve a 30–40% relative improvement** on
    PAWC (Quotation Addition strongest; Fluency Optimization also strong), while
    **Keyword Stuffing is negative** (~−8%). Headline: "up to 40%" visibility.
    Effects are domain-dependent (citation/quote tactics dominate in fact-dense
    domains). Quote the paper's banded summary rather than single-row decimals
    unless you have verified the exact Table-1 figure.
- Follow-on literature (shows a growing peer-reviewed base, not one paper):
  **AutoGEO** (ICLR 2026), **C-SEO Bench** (2025, finds technical infrastructure
  can outweigh prose manipulation). Treat their headline numbers as newer and
  less-replicated than the KDD 2024 paper; `refresh` should re-check whether
  they supersede the Tier-1 figures.

## Platform guidance (the calibration / anti-hype base)

- **Google — "Optimizing your website for generative AI features on Google Search"** (May
  2026): <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>
  (announcement: <https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing>)
  - Backs the honesty rails: "AI search is still search"; no AI-specific files /
    markup required; **structured data is not required** for AI Overviews / AI
    Mode; no ideal content length; chasing inauthentic mentions does not help.
- Corroborating practitioner coverage that Google frames AEO/GEO as "still SEO":
  Search Engine Land, Semrush, Search Engine Journal. Secondary — use to
  illustrate, not as the backbone claim.

## llms.txt (present honestly, low-confidence)

- **llms.txt specification** — Jeremy Howard (Answer.AI), Sept 2024:
  <https://llmstxt.org/>. The spec itself: root `/llms.txt` markdown with an H1
  name, blockquote summary, and H2 link sections (+ optional `llms-full.txt`).
- **Ahrefs — "What Is llms.txt, and Should You Care About It?"**:
  <https://ahrefs.com/blog/what-is-llms-txt/>. Original server-log data: **97%
  of llms.txt files received zero requests** (May 2026); no major provider
  (OpenAI, Anthropic, Google, Meta) officially crawls it. Backs the dimension-7
  / Tier-3 "low-confidence" labeling. Rare source with real data — keep it.

## AEO / structured-data tactics (secondary, tactic-rich)

- AirOps schema-for-AEO and AEO guides; CXL AEO guide. Concrete JSON-LD tactics
  (FAQPage, HowTo, QAPage, Article + Author + Organization, `sameAs` entity
  links). **Vendor citation-lift figures here are not independently verified —
  flag them as such.** Note the tension with Google above: schema is helpful for
  SEO and non-Google engines, not required by Google for AI features.

## Tool / connector documentation

Backs `connectors/*.md`. APIs and tool names drift — each connector file carries
its own `last_verified` date; `refresh` re-checks these.

- Google Search Console API: <https://developers.google.com/webmaster-tools/v1/api_reference_index>
- Google Analytics Data API (GA4): <https://developers.google.com/analytics/devguides/reporting/data/v1>
- Lighthouse: <https://github.com/GoogleChrome/lighthouse> · PageSpeed Insights API: <https://developers.google.com/speed/docs/insights/v5/get-started>
- Schema validation: schema.org validator <https://validator.schema.org/> · Google Rich Results Test <https://search.google.com/test/rich-results> (no documented public API) · Adobe structured-data-validator (local) <https://github.com/adobe/structured-data-validator>
- Semrush API: <https://developer.semrush.com/api/> · hosted MCP `mcp.semrush.com`
- Ahrefs API: <https://docs.ahrefs.com/docs/api/reference/introduction>
- DataForSEO (pay-per-use aggregator) MCP: <https://github.com/dataforseo/mcp-server-typescript>

## Open-source prior art (study, don't copy)

- **Auriti-Labs / geo-optimizer-skill** (MIT): <https://github.com/Auriti-Labs/geo-optimizer-skill>
  — an agent-skill-shaped GEO auditor (scoring categories + CLI) that cites the
  KDD 2024 paper. Useful as a structural reference. All prose in this skill is
  authored independently; nothing is vendored.

Secondary (verify before quoting as first-party): vendor blogs (AirOps, CXL,
Semrush, Ahrefs marketing) and community before/after figures.

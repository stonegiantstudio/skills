# Connector: Structured data / schema validation

```
last_verified: 2026-06-25
feeds: dimension 5 (structured data)
cost: free
```

**Unique data:** whether the page's JSON-LD is valid and eligible for rich
results / entity understanding. **Honesty rail:** schema helps SEO and non-Google
engines but is **not required by Google** for AI Overviews/AI Mode — score it,
do not over-weight it.

## Ingestion (preference order)

### 1. Parse the page directly (method=parse — local)
- Extract every `<script type="application/ld+json">` block from the HTML and
  read the `@type` set (FAQPage, HowTo, QAPage, Article, Organization, Product…)
  and required-field completeness. No external call needed.

### 2. Local validator (method=parse)
- **Adobe structured-data-validator** (JS library): validates JSON-LD /
  Microdata / RDFa against schema.org + Google's rich-result rules, locally.
  <https://github.com/adobe/structured-data-validator>. Fills the gap left by
  Google's Rich Results Test having **no official public API**.

### 3. Paste / screenshot (method=screenshot)
- **Google Rich Results Test** (search.google.com/test/rich-results): read the
  "Valid items detected" list plus Errors / Warnings counts.
- **schema.org validator** (validator.schema.org): the parsed type tree + issues.

## Provenance & freshness
- Direct parse / local validator → **measured** (structural truth). A "valid"
  result means eligible, not that Google *will* show a rich result — say so.

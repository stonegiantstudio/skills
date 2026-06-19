---
name: pdf
description: PDF processing router - delegates to specialized sub-skills for extraction, creation, and charting. Triggers when working with PDF files, generating reports, or creating data visualizations for print.
---

# PDF Processing

Routes to specialized PDF skills based on the task.

## Sub-Skills

| Task | Skill | Use When |
|------|-------|----------|
| **Extract content** | `pdf-extract` | Reading PDFs, finding content, searching patterns, getting snippets with page numbers |
| **Create documents** | `pdf-create` | Generating branded PDFs, professional typography, print-ready documents |
| **Charts & graphs** | `pdf-charts` | Data visualization, reports with charts, dashboards to PDF |

## Quick Routing

**Need to read or search a PDF?** → Use `pdf-extract`
- Find contract total price with page reference
- Extract all instances of a pattern
- Get text snippets with surrounding context
- Analyze images within PDFs

**Need to create a PDF?** → Use `pdf-create`
- Branded business documents
- Professional typography (margins, spacing, kerning)
- Print-production quality output
- Multi-page reports with consistent styling

**Need charts or graphs in a PDF?** → Use `pdf-charts`
- Bar charts, line graphs, scatter plots
- Dashboards and data reports
- Export visualizations to print-ready format

## When to Use Official Anthropic PDF Skill

For basic operations, the [anthropics/skills pdf](https://github.com/anthropics/skills) skill handles:
- Simple text extraction (no context needed)
- Merge/split PDFs
- Rotate pages
- Fill PDF forms

Install with: `/plugin marketplace add anthropics/skills`

## Common Dependencies

```bash
# Python - extraction
pip install pypdf pdfplumber pypdfium2

# Python - creation
pip install reportlab weasyprint

# Python - charts
pip install matplotlib seaborn plotly

# Node.js - server-side
npm install pdf-lib @react-pdf/renderer chart.js

# Node.js - client-side HTML→PDF (use html2canvas-pro for Tailwind v4 oklch support)
npm install html2canvas-pro jspdf
```

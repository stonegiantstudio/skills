---
name: pdf-create
description: Professional PDF document creation with expert typography, branding, and print-production quality. Triggers when generating branded documents, creating reports, building invoices, or any PDF output requiring professional layout and typography.
---

# Professional PDF Creation

Create print-ready PDFs with expert typography, consistent branding, and production-quality output.

## Library Comparison

| Library | Best For | Stack |
|---------|----------|-------|
| **@react-pdf/renderer** | React apps, dynamic documents | React/Node |
| **pdf-lib** | Manipulation, forms, low-level control | Node/Browser |
| **Puppeteer/Playwright** | HTML→PDF, complex layouts | Node |
| **WeasyPrint** | HTML/CSS→PDF, print stylesheets | Python |
| **ReportLab** | Programmatic, charts, complex layouts | Python |

## React PDF (@react-pdf/renderer)

The go-to for React applications. Component-based, familiar API.

```bash
npm install @react-pdf/renderer
```

### Basic Document

```tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

// Register custom fonts for professional typography
Font.register({
  family: "Inter",
  fonts: [
    { src: "/fonts/Inter-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Inter-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/Inter-SemiBold.ttf", fontWeight: 600 },
    { src: "/fonts/Inter-Bold.ttf", fontWeight: 700 },
  ],
});

// Professional styles with proper typography
const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    lineHeight: 1.5,
    paddingTop: 72,      // 1 inch
    paddingBottom: 72,
    paddingLeft: 72,
    paddingRight: 72,
  },
  header: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
    color: "#1a1a1a",
    letterSpacing: -0.5, // Tighten for headlines
  },
  subheader: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    marginTop: 24,
    color: "#333",
  },
  body: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#444",
    textAlign: "justify",
  },
  caption: {
    fontSize: 8,
    color: "#666",
    fontStyle: "italic",
  },
});

interface InvoiceProps {
  invoiceNumber: string;
  date: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
}

const Invoice = ({ invoiceNumber, date, items, total }: InvoiceProps) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text>Invoice #{invoiceNumber}</Text>
      </View>

      <View style={{ marginBottom: 24 }}>
        <Text style={styles.body}>Date: {date}</Text>
      </View>

      {/* Table header */}
      <View style={{ flexDirection: "row", borderBottom: 1, paddingBottom: 8 }}>
        <Text style={{ flex: 3, fontWeight: 600 }}>Item</Text>
        <Text style={{ flex: 1, fontWeight: 600, textAlign: "right" }}>Qty</Text>
        <Text style={{ flex: 1, fontWeight: 600, textAlign: "right" }}>Price</Text>
        <Text style={{ flex: 1, fontWeight: 600, textAlign: "right" }}>Total</Text>
      </View>

      {/* Table rows */}
      {items.map((item, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            paddingVertical: 8,
            borderBottom: 0.5,
            borderColor: "#eee",
          }}
        >
          <Text style={{ flex: 3 }}>{item.name}</Text>
          <Text style={{ flex: 1, textAlign: "right" }}>{item.qty}</Text>
          <Text style={{ flex: 1, textAlign: "right" }}>${item.price}</Text>
          <Text style={{ flex: 1, textAlign: "right" }}>
            ${item.qty * item.price}
          </Text>
        </View>
      ))}

      {/* Total */}
      <View style={{ flexDirection: "row", marginTop: 16 }}>
        <Text style={{ flex: 5, fontWeight: 700, textAlign: "right" }}>
          Total:
        </Text>
        <Text style={{ flex: 1, fontWeight: 700, textAlign: "right" }}>
          ${total}
        </Text>
      </View>
    </Page>
  </Document>
);

// Generate PDF buffer (for API routes)
export async function generateInvoicePdf(data: InvoiceProps): Promise<Buffer> {
  const doc = <Invoice {...data} />;
  const buffer = await pdf(doc).toBuffer();
  return buffer;
}
```

### React Router Integration

```tsx
// app/routes/api.invoice.$id.pdf.ts
import { generateInvoicePdf } from "~/lib/pdf/invoice";
import type { Route } from "./+types/api.invoice.$id.pdf";

export async function loader({ params }: Route.LoaderArgs) {
  const invoice = await getInvoice(params.id);

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber: invoice.number,
    date: invoice.date,
    items: invoice.items,
    total: invoice.total,
  });

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.number}.pdf"`,
    },
  });
}
```

### Branded Template System

```tsx
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

// Brand configuration
const brand = {
  colors: {
    primary: "#2563eb",
    secondary: "#64748b",
    text: "#1e293b",
    muted: "#94a3b8",
  },
  fonts: {
    heading: "Inter",
    body: "Inter",
  },
  logo: "/images/logo.png",
};

const brandStyles = StyleSheet.create({
  page: {
    fontFamily: brand.fonts.body,
    color: brand.colors.text,
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
    paddingBottom: 20,
    borderBottom: 2,
    borderColor: brand.colors.primary,
  },
  logo: {
    width: 120,
    height: 40,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 60,
    right: 60,
    textAlign: "center",
    fontSize: 8,
    color: brand.colors.muted,
  },
});

interface BrandedDocumentProps {
  title: string;
  children: React.ReactNode;
}

const BrandedDocument = ({ title, children }: BrandedDocumentProps) => (
  <Document title={title} author="Acme Corp">
    <Page size="LETTER" style={brandStyles.page}>
      {/* Header */}
      <View style={brandStyles.header}>
        <Image src={brand.logo} style={brandStyles.logo} />
        <Text style={{ fontSize: 10, color: brand.colors.muted }}>
          {new Date().toLocaleDateString()}
        </Text>
      </View>

      {/* Content */}
      {children}

      {/* Footer */}
      <Text style={brandStyles.footer}>
        Acme Corp • 123 Main St • contact@acme.com • (555) 123-4567
      </Text>
    </Page>
  </Document>
);
```

## Typography Best Practices

### Font Sizing Scale

Use a consistent typographic scale (1.25 ratio recommended):

```tsx
const typeScale = {
  xs: 8,      // Captions, fine print
  sm: 10,     // Body small
  base: 12,   // Body default
  lg: 15,     // Lead paragraphs
  xl: 18.75,  // H3
  "2xl": 23.4, // H2
  "3xl": 29.3, // H1
  "4xl": 36.6, // Display
};
```

### Line Height

```tsx
const lineHeights = {
  tight: 1.25,    // Headlines
  normal: 1.5,    // Body text
  relaxed: 1.75,  // Long-form reading
};
```

### Letter Spacing

```tsx
const letterSpacing = {
  tighter: -0.5,  // Large headlines (24pt+)
  tight: -0.25,   // Medium headlines
  normal: 0,      // Body text
  wide: 0.5,      // Small caps, labels
  wider: 1,       // All caps headings
};
```

### Margins & Spacing

Standard print margins (in points, 72pt = 1 inch):

```tsx
const margins = {
  // Page margins
  standard: 72,      // 1 inch - business documents
  narrow: 54,        // 0.75 inch - dense content
  wide: 90,          // 1.25 inch - formal documents

  // Content spacing
  sectionGap: 24,    // Between major sections
  paragraphGap: 12,  // Between paragraphs
  lineGap: 4,        // Between related lines
};
```

## pdf-lib (Low-Level Control)

For precise control, form filling, or when you need to modify existing PDFs.

```typescript
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";

async function createDocument() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();

  // Typography constants
  const margin = 72;
  const lineHeight = 14;

  // Header
  page.drawText("Professional Document", {
    x: margin,
    y: height - margin,
    size: 24,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Body text with proper line spacing
  const bodyText = [
    "This document demonstrates professional typography.",
    "Notice the consistent margins and line spacing.",
    "Each element follows a deliberate visual hierarchy.",
  ];

  let yPos = height - margin - 60;
  for (const line of bodyText) {
    page.drawText(line, {
      x: margin,
      y: yPos,
      size: 11,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= lineHeight * 1.5;
  }

  const pdfBytes = await doc.save();
  await fs.writeFile("output.pdf", pdfBytes);
}
```

## HTML to PDF (Puppeteer)

Best for complex layouts, CSS support, or converting existing HTML.

```typescript
import puppeteer from "puppeteer";

async function htmlToPdf(html: string, outputPath: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  await page.pdf({
    path: outputPath,
    format: "Letter",
    margin: {
      top: "1in",
      right: "1in",
      bottom: "1in",
      left: "1in",
    },
    printBackground: true,
  });

  await browser.close();
}

// With print-specific CSS
const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    @media print {
      body {
        font-family: 'Inter', sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        color: #1a1a1a;
      }
      h1 {
        font-size: 24pt;
        font-weight: 700;
        letter-spacing: -0.5pt;
        margin-bottom: 24pt;
      }
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <h1>Report Title</h1>
  <p>Content here...</p>
</body>
</html>
`;
```

## HTML to PDF (html2canvas + jsPDF)

Client-side PDF generation from rendered HTML. Ideal for browser-based reports.

### Why html2canvas-pro

Tailwind CSS v4 uses `oklch()` colors by default. The original `html2canvas` doesn't support modern CSS color functions:

```
Error: Unable to parse color: oklch(0.637 0.237 25.331)
```

[html2canvas-pro](https://www.npmjs.com/package/html2canvas-pro) is a maintained fork with full support for `oklch()`, `oklab()`, `lab()`, `lch()`, and `color()`.

```bash
bun remove html2canvas
bun add html2canvas-pro jspdf
```

```typescript
// Drop-in replacement - same API
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
```

### Basic Export

```typescript
async function exportToPdf(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    scale: 3, // 3x for ~216 DPI (good print quality)
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF("p", "mm", "letter");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12.7; // 0.5 inch

  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    margin,
    margin,
    imgWidth,
    imgHeight
  );

  pdf.save(filename);
}
```

### Smart Page Breaks (Gap Midpoint Algorithm)

When content spans multiple pages, naive slicing at fixed heights cuts through text, slicing descenders (p, y, g, j) and creating unprofessional output.

**The problem with simple approaches:**
- Fixed-height slicing ignores content
- White row detection fails because descenders occupy small % of row width
- 100% white detection fails due to anti-aliasing artifacts

**Solution:** Find the gap between content blocks and slice at its midpoint.

```typescript
/**
 * Check if a row contains non-white pixels (content).
 */
function rowHasContent(
  ctx: CanvasRenderingContext2D,
  y: number,
  width: number
): boolean {
  const sampleStep = 2; // Check every 2 pixels for performance
  const rowData = ctx.getImageData(0, y, width, 1).data;

  for (let x = 0; x < width; x += sampleStep) {
    const i = x * 4;
    const r = rowData[i];
    const g = rowData[i + 1];
    const b = rowData[i + 2];

    // Threshold of 245 catches anti-aliased text edges
    if (r < 245 || g < 245 || b < 245) {
      return true;
    }
  }
  return false;
}

/**
 * Find a safe break point by locating the midpoint of a content gap.
 */
function findSafeBreakPoint(
  canvas: HTMLCanvasElement,
  targetY: number,
  searchRange: number,
  minGapSize: number
): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return targetY;

  let y = Math.min(targetY, canvas.height - 1);
  const searchEnd = Math.max(0, y - searchRange);

  while (y > searchEnd) {
    if (!rowHasContent(ctx, y, canvas.width)) {
      // Found bottom of a gap
      const gapBottom = y;

      // Find top of gap
      while (y > searchEnd && !rowHasContent(ctx, y, canvas.width)) {
        y--;
      }

      const gapTop = y + 1;
      const gapSize = gapBottom - gapTop + 1;

      if (gapSize >= minGapSize) {
        // Return exact midpoint
        return Math.floor((gapTop + gapBottom) / 2);
      }
      // Gap too small, keep searching
    } else {
      y--;
    }
  }

  return targetY; // Fallback if no gap found
}
```

### Multi-Page Export with Smart Breaks

```typescript
async function exportMultiPagePdf(
  element: HTMLElement,
  filename: string
) {
  const scale = 3;
  const canvas = await html2canvas(element, { scale, useCORS: true });

  const pdf = new jsPDF("p", "mm", "letter");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12.7;

  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  // Convert mm to pixels at render scale
  const pixelsPerMm = (scale * 96) / 25.4; // ~11.3 at scale 3
  const pageHeightPx = contentHeight * pixelsPerMm;
  const searchRangePx = 50 * pixelsPerMm; // Search 50mm back
  const minGapPx = 3 * pixelsPerMm; // Minimum 3mm gap

  let sourceY = 0;
  let pageNum = 0;

  while (sourceY < canvas.height) {
    if (pageNum > 0) pdf.addPage();

    const remainingHeight = canvas.height - sourceY;
    let sliceHeight: number;

    if (remainingHeight <= pageHeightPx) {
      // Last page - take everything
      sliceHeight = remainingHeight;
    } else {
      // Find safe break point
      const targetY = sourceY + pageHeightPx;
      const breakY = findSafeBreakPoint(
        canvas,
        targetY,
        searchRangePx,
        minGapPx
      );
      sliceHeight = breakY - sourceY;
    }

    // Create slice canvas
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;

    const ctx = pageCanvas.getContext("2d")!;
    ctx.drawImage(
      canvas,
      0, sourceY, canvas.width, sliceHeight,
      0, 0, canvas.width, sliceHeight
    );

    // Add to PDF
    const sliceHeightMm = sliceHeight / pixelsPerMm;
    pdf.addImage(
      pageCanvas.toDataURL("image/png"),
      "PNG",
      margin,
      margin,
      contentWidth,
      sliceHeightMm
    );

    sourceY += sliceHeight;
    pageNum++;
  }

  pdf.save(filename);
}
```

### Configuration Reference

| Parameter | Recommended | Description |
|-----------|-------------|-------------|
| `scale` | 3 | Canvas scale factor (~216 DPI) |
| `searchRange` | 50mm | How far back to search for break |
| `minGapSize` | 3mm | Minimum gap to consider valid |
| `whiteThreshold` | 245 | RGB threshold (catches anti-aliasing) |

## Print Production Checklist

### Before Export

- [ ] **Bleed area** - If printing edge-to-edge, add 0.125" bleed
- [ ] **Safe zone** - Keep critical content 0.25" from edges
- [ ] **Resolution** - Images at 300 DPI minimum for print
- [ ] **Color mode** - Use CMYK for professional printing, RGB for screen
- [ ] **Fonts embedded** - All fonts included in PDF

### Typography

- [ ] **Consistent scale** - Use defined type scale, no arbitrary sizes
- [ ] **Hierarchy clear** - Reader can scan document structure
- [ ] **Line length** - 45-75 characters per line for readability
- [ ] **Orphans/widows** - No single lines at top/bottom of pages
- [ ] **Hyphenation** - Enable for justified text

### Layout

- [ ] **Grid system** - Content aligned to consistent grid
- [ ] **White space** - Adequate breathing room between elements
- [ ] **Margins balanced** - Inner margins may need to be wider for binding
- [ ] **Page numbers** - Consistent placement, appropriate for binding

### Quality Assurance

- [ ] **Spell check** - All content proofread
- [ ] **Links work** - Internal/external links functional
- [ ] **TOC accurate** - Table of contents matches page numbers
- [ ] **Images sharp** - No pixelation or artifacts

## Common Page Sizes (Points)

```typescript
const pageSizes = {
  letter: [612, 792],      // 8.5" x 11" - US standard
  legal: [612, 1008],      // 8.5" x 14"
  a4: [595, 842],          // 210mm x 297mm - International
  a5: [420, 595],          // 148mm x 210mm
  executive: [522, 756],   // 7.25" x 10.5"
};
```

## Resources

- [@react-pdf/renderer docs](https://react-pdf.org/)
- [pdf-lib docs](https://pdf-lib.js.org/)
- [Practical Typography](https://practicaltypography.com/) - Essential reading
- [Butterick's Typography Rules](https://practicaltypography.com/summary-of-key-rules.html)

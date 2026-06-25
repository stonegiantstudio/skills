---
name: pdf-extract
description: Smart PDF content extraction with context, page references, and pattern matching. Triggers when finding specific content in PDFs (contract prices, terms), searching for patterns, extracting images, or needing snippets with surrounding context.
---

# PDF Smart Extraction

Extract content from PDFs with context, page numbers, and pattern matching.

## Quick Reference

| Task | Method |
|------|--------|
| Find specific value (price, date) | `extract_with_context()` |
| Find all pattern instances | `find_all_matches()` |
| Extract images | `extract_images()` |
| Get structured data | `extract_tables()` with pandas |

## Installation

```bash
pip install pdfplumber pypdfium2 Pillow pandas
```

## Extract with Context

Find content and return surrounding text with page number.

```python
import pdfplumber
import re

def extract_with_context(pdf_path: str, pattern: str, context_chars: int = 200) -> list[dict]:
    """
    Find pattern matches with surrounding context and page numbers.

    Returns: [{
        'page': 1,
        'match': 'Total: $45,000',
        'before': '...preceding text...',
        'after': '...following text...',
        'full_snippet': '...before...match...after...'
    }]
    """
    results = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""

            for match in re.finditer(pattern, text, re.IGNORECASE):
                start = max(0, match.start() - context_chars)
                end = min(len(text), match.end() + context_chars)

                results.append({
                    'page': page_num,
                    'match': match.group(),
                    'before': text[start:match.start()].strip(),
                    'after': text[match.end():end].strip(),
                    'full_snippet': text[start:end].strip(),
                    'position': {'start': match.start(), 'end': match.end()}
                })

    return results

# Example: Find contract total
matches = extract_with_context(
    "contract.pdf",
    r"(?:total|amount)[:\s]*\$[\d,]+(?:\.\d{2})?",
    context_chars=150
)
for m in matches:
    print(f"Page {m['page']}: {m['match']}")
    print(f"  Context: ...{m['before'][-50:]} [{m['match']}] {m['after'][:50]}...")
```

## Find All Pattern Instances

Search across entire document for all occurrences.

```python
def find_all_matches(pdf_path: str, patterns: dict[str, str]) -> dict[str, list]:
    """
    Find all instances of multiple patterns.

    Args:
        patterns: {'label': 'regex_pattern', ...}

    Returns: {
        'label': [{'page': 1, 'match': '...', 'count': 3}, ...]
    }
    """
    results = {label: [] for label in patterns}

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""

            for label, pattern in patterns.items():
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    results[label].append({
                        'page': page_num,
                        'matches': matches,
                        'count': len(matches)
                    })

    # Add totals
    for label in results:
        total = sum(r['count'] for r in results[label])
        results[label] = {'items': results[label], 'total': total}

    return results

# Example: Find multiple patterns
results = find_all_matches("document.pdf", {
    'emails': r'[\w\.-]+@[\w\.-]+\.\w+',
    'phone_numbers': r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
    'dollar_amounts': r'\$[\d,]+(?:\.\d{2})?'
})

for label, data in results.items():
    print(f"{label}: {data['total']} total")
    for item in data['items']:
        print(f"  Page {item['page']}: {item['count']} matches")
```

## Extract Images

Get all images from PDF with page references.

```python
import pypdfium2 as pdfium
from PIL import Image
from pathlib import Path

def extract_images(pdf_path: str, output_dir: str) -> list[dict]:
    """
    Extract all images from PDF.

    Returns: [{
        'page': 1,
        'index': 0,
        'path': 'output/page_1_img_0.png',
        'size': (800, 600)
    }]
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    results = []
    pdf = pdfium.PdfDocument(pdf_path)

    for page_num, page in enumerate(pdf, start=1):
        for img_index, img_obj in enumerate(page.get_objects()):
            if img_obj.type == pdfium.FPDF_PAGEOBJ_IMAGE:
                bitmap = img_obj.get_bitmap()
                pil_img = bitmap.to_pil()

                filename = f"page_{page_num}_img_{img_index}.png"
                filepath = output_path / filename
                pil_img.save(filepath)

                results.append({
                    'page': page_num,
                    'index': img_index,
                    'path': str(filepath),
                    'size': pil_img.size
                })

    return results

# Extract all images
images = extract_images("brochure.pdf", "./extracted_images")
print(f"Found {len(images)} images")
for img in images:
    print(f"  Page {img['page']}: {img['path']} ({img['size'][0]}x{img['size'][1]})")
```

## Extract Tables to DataFrame

Get structured table data with page tracking.

```python
import pdfplumber
import pandas as pd

def extract_tables(pdf_path: str) -> list[dict]:
    """
    Extract all tables as DataFrames with metadata.

    Returns: [{
        'page': 1,
        'table_index': 0,
        'df': DataFrame,
        'rows': 10,
        'cols': 5
    }]
    """
    results = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            tables = page.extract_tables()

            for table_index, table in enumerate(tables):
                if table and len(table) > 1:
                    # First row as headers
                    df = pd.DataFrame(table[1:], columns=table[0])

                    results.append({
                        'page': page_num,
                        'table_index': table_index,
                        'df': df,
                        'rows': len(df),
                        'cols': len(df.columns)
                    })

    return results

# Extract and combine tables
tables = extract_tables("financial_report.pdf")
for t in tables:
    print(f"Page {t['page']}, Table {t['table_index']}: {t['rows']}x{t['cols']}")
    print(t['df'].head())
```

## Search with Fuzzy Matching

Find content even with OCR errors or variations.

```python
from difflib import SequenceMatcher
import pdfplumber

def fuzzy_search(pdf_path: str, target: str, threshold: float = 0.8) -> list[dict]:
    """
    Find text similar to target (handles typos, OCR errors).

    Args:
        threshold: 0.0-1.0, higher = stricter matching
    """
    results = []
    words = target.lower().split()
    window_size = len(words)

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            text_words = text.lower().split()

            for i in range(len(text_words) - window_size + 1):
                window = ' '.join(text_words[i:i + window_size])
                ratio = SequenceMatcher(None, target.lower(), window).ratio()

                if ratio >= threshold:
                    # Get original text with proper casing
                    original = ' '.join(text.split()[i:i + window_size])
                    results.append({
                        'page': page_num,
                        'match': original,
                        'similarity': round(ratio, 2),
                        'position': i
                    })

    return sorted(results, key=lambda x: -x['similarity'])

# Find "John Smith" even if OCR read "Jonn Srnith"
matches = fuzzy_search("scanned_doc.pdf", "John Smith", threshold=0.7)
```

## Batch Processing

Process multiple PDFs efficiently.

```python
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import json

def process_pdf(pdf_path: str, patterns: dict) -> dict:
    """Process single PDF and return results."""
    return {
        'file': pdf_path,
        'matches': find_all_matches(pdf_path, patterns)
    }

def batch_search(pdf_dir: str, patterns: dict, workers: int = 4) -> list[dict]:
    """Search patterns across multiple PDFs in parallel."""
    pdf_files = list(Path(pdf_dir).glob("*.pdf"))

    with ProcessPoolExecutor(max_workers=workers) as executor:
        results = list(executor.map(
            lambda p: process_pdf(str(p), patterns),
            pdf_files
        ))

    return results

# Search across all PDFs in directory
results = batch_search("./contracts", {
    'total_amount': r'total[:\s]*\$[\d,]+',
    'effective_date': r'effective\s+date[:\s]*[\w\s,]+\d{4}'
})

# Save results
with open("search_results.json", "w") as f:
    json.dump(results, f, indent=2, default=str)
```

## Common Patterns

```python
PATTERNS = {
    # Financial
    'currency': r'\$[\d,]+(?:\.\d{2})?',
    'percentage': r'\d+(?:\.\d+)?%',

    # Dates
    'date_us': r'\d{1,2}/\d{1,2}/\d{2,4}',
    'date_iso': r'\d{4}-\d{2}-\d{2}',
    'date_written': r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}',

    # Contact
    'email': r'[\w\.-]+@[\w\.-]+\.\w+',
    'phone_us': r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',

    # Legal/Contract
    'section_ref': r'[Ss]ection\s+\d+(?:\.\d+)*',
    'article_ref': r'[Aa]rticle\s+[IVXLCDM]+|\d+',

    # Technical
    'url': r'https?://[^\s<>"{}|\\^`\[\]]+',
    'ip_address': r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}',
}
```

## Tips

1. **OCR'd PDFs** - Use `fuzzy_search()` for scanned documents with potential errors
2. **Large PDFs** - Process pages in chunks to manage memory
3. **Structured data** - Extract tables first, then search within DataFrames
4. **Image analysis** - Extract images, then use Claude's vision for analysis
5. **Page ranges** - Most functions accept `start_page`/`end_page` params (add as needed)

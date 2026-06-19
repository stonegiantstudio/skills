<!-- markdownlint-disable MD031 MD040 MD048 MD051 -->
<!-- Disabled: Contains markdown examples showing various code fence styles and patterns -->

# Markdownlint Rules Reference

Complete reference for all markdownlint rules. Rules are grouped by category.

## Contents

- [Headings](#headings)
- [Whitespace](#whitespace)
- [Lists](#lists)
- [Code](#code)
- [Links and Images](#links-and-images)
- [Emphasis](#emphasis)
- [Blockquotes](#blockquotes)
- [HTML](#html)
- [Tables](#tables)
- [Other](#other)

## Headings

### MD001 - heading-increment

Heading levels should only increment by one level at a time.

```markdown
<!-- Bad -->

# Heading 1

### Heading 3

<!-- Good -->

# Heading 1

## Heading 2

### Heading 3
```

### MD003 - heading-style

Use consistent heading style. Prefer ATX style (`#`).

```markdown
<!-- ATX style (preferred) -->

# Heading 1

## Heading 2

<!-- Setext style (avoid) -->

# Heading 1
```

### MD018 - no-missing-space-atx

Require space after hash in ATX headings.

```markdown
<!-- Bad -->

#Heading

<!-- Good -->

# Heading
```

### MD019 - no-multiple-space-atx

Single space after hash, not multiple.

```markdown
<!-- Bad -->

# Heading

<!-- Good -->

# Heading
```

### MD022 - blanks-around-headings

Headings must be surrounded by blank lines.

```markdown
<!-- Bad -->

Some text

## Heading

More text

<!-- Good -->

Some text

## Heading

More text
```

### MD023 - heading-start-left

Headings must start at the beginning of the line.

```markdown
<!-- Bad -->

## Heading

<!-- Good -->

## Heading
```

### MD024 - no-duplicate-heading

Multiple headings with the same content (configurable).

```markdown
<!-- Potentially problematic -->

## Introduction

...

## Introduction
```

### MD025 - single-title / single-h1

Only one top-level heading (H1) per document.

```markdown
<!-- Bad -->

# Title One

# Title Two

<!-- Good -->

# Document Title

## Section One

## Section Two
```

### MD026 - no-trailing-punctuation

No trailing punctuation in headings.

```markdown
<!-- Bad -->

## What is Markdown?

<!-- Good -->

## What is Markdown
```

### MD041 - first-line-heading / first-line-h1

First line should be a top-level heading.

### MD043 - required-headings

Enforce required heading structure (configurable).

## Whitespace

### MD009 - no-trailing-spaces

No trailing spaces at end of lines.

### MD010 - no-hard-tabs

Use spaces instead of hard tabs.

### MD012 - no-multiple-blanks

No multiple consecutive blank lines.

```markdown
<!-- Bad -->

Paragraph one.

Paragraph two.

<!-- Good -->

Paragraph one.

Paragraph two.
```

### MD047 - single-trailing-newline

Files should end with a single newline character.

## Lists

### MD004 - ul-style

Consistent unordered list marker style.

```markdown
<!-- Pick one style and be consistent -->

- Item (dash - preferred)

* Item (asterisk)

- Item (plus)
```

### MD005 - list-indent

Consistent indentation for list items at the same level.

```markdown
<!-- Bad -->

- Item 1
- Item 2

<!-- Good -->

- Item 1
- Item 2
```

### MD007 - ul-indent

Unordered list indentation (default: 2 spaces).

```markdown
<!-- Good (2 spaces) -->

- Item
  - Nested item
    - Deep nested
```

### MD029 - ol-prefix

Ordered list item prefix style.

```markdown
<!-- Recommended: all 1. -->

1. First
1. Second
1. Third

<!-- Also valid: sequential -->

1. First
2. Second
3. Third
```

### MD030 - list-marker-space

Spaces after list markers.

```markdown
<!-- Good -->

- Item

1. Item

<!-- Bad -->

-Item
1.Item
```

### MD032 - blanks-around-lists

Lists should be surrounded by blank lines.

```markdown
<!-- Bad -->

Some text

- Item 1
- Item 2
  More text

<!-- Good -->

Some text

- Item 1
- Item 2

More text
```

## Code

### MD014 - commands-show-output

Dollar signs before commands only when showing output.

````markdown
<!-- Bad (no output shown) -->

```bash
$ npm install
```
````

<!-- Good (no output) -->

```bash
npm install
```

<!-- Good (with output) -->

```bash
$ echo "hello"
hello
```

`````

### MD031 - blanks-around-fences

Fenced code blocks should be surrounded by blank lines.

````markdown
<!-- Bad -->
Some text
```javascript
code
`````

More text

<!-- Good -->

Some text

```javascript
code;
```

More text

`````

### MD038 - no-space-in-code

No spaces inside code span elements.

```markdown
<!-- Bad -->
` code `

<!-- Good -->
`code`
```

### MD040 - fenced-code-language

Fenced code blocks should have a language specified.

````markdown
<!-- Bad -->
```
const x = 1;
```

<!-- Good -->
```javascript
const x = 1;
```
`````

### MD046 - code-block-style

Consistent code block style (fenced vs indented).

### MD048 - code-fence-style

Consistent code fence style (backticks vs tildes).

````markdown
<!-- Preferred -->

```javascript
code;
```
````

<!-- Also valid -->

```javascript
code;
```

````

## Links and Images

### MD011 - no-reversed-links

Correct link syntax (not reversed).

```markdown
<!-- Bad -->
(link)[text]

<!-- Good -->
[text](link)
````

### MD034 - no-bare-urls

No bare URLs - use proper link syntax.

```markdown
<!-- Bad -->

Visit https://example.com for more.

<!-- Good -->

Visit [example.com](https://example.com) for more.
```

### MD039 - no-space-in-links

No spaces inside link text.

```markdown
<!-- Bad -->

[ link text ](url)

<!-- Good -->

[link text](url)
```

### MD042 - no-empty-links

No empty links.

```markdown
<!-- Bad -->

[empty]()
[empty](#)

<!-- Good -->

[link text](https://example.com)
```

### MD045 - no-alt-text

Images should have alternate text (accessibility).

```markdown
<!-- Bad -->

![](image.png)

<!-- Good -->

![Description of image](image.png)
```

### MD051 - link-fragments

Link fragments should be valid.

### MD052 - reference-links-images

Reference links and images should use defined labels.

### MD053 - link-image-reference-definitions

Link and image reference definitions should be needed.

### MD054 - link-image-style

Consistent link and image style.

## Emphasis

### MD036 - no-emphasis-as-heading

Don't use emphasis instead of a heading.

```markdown
<!-- Bad -->

**This looks like a heading**

Some content here.

<!-- Good -->

## This is a heading

Some content here.
```

### MD037 - no-space-in-emphasis

No spaces inside emphasis markers.

```markdown
<!-- Bad -->

** bold **

- italic \*

<!-- Good -->

**bold**
_italic_
```

### MD049 - emphasis-style

Consistent emphasis style (asterisk vs underscore).

```markdown
<!-- Preferred -->

_italic_ and **bold**

<!-- Consistent alternative -->

_italic_ and **bold**
```

### MD050 - strong-style

Consistent strong style.

## Blockquotes

### MD027 - no-multiple-space-blockquote

Single space after blockquote symbol.

```markdown
<!-- Bad -->

> Quote

<!-- Good -->

> Quote
```

### MD028 - no-blanks-blockquote

No blank lines inside blockquotes (unless intentional paragraph break).

```markdown
<!-- Problematic -->

> Line one

> Line two

<!-- Good (single quote) -->

> Line one
> Line two

<!-- Good (intentional paragraph) -->

> Paragraph one.
>
> Paragraph two.
```

## HTML

### MD033 - no-inline-html

Avoid inline HTML (configurable allowed elements).

```markdown
<!-- Avoid -->

<b>bold</b>
<br>

<!-- Use Markdown -->

**bold**
```

## Tables

### MD055 - table-pipe-style

Consistent table pipe style.

### MD056 - table-column-count

Consistent number of columns in tables.

### MD058 - blanks-around-tables

Tables should be surrounded by blank lines.

## Other

### MD035 - hr-style

Consistent horizontal rule style.

```markdown
## <!-- Pick one -->

---

---
```

### MD044 - proper-names

Proper names should have correct capitalization (configurable).

```markdown
<!-- If configured for "JavaScript" -->
<!-- Bad -->

javascript

<!-- Good -->

JavaScript
```

## Configuration

Create `.markdownlint.json` in project root:

```json
{
  "default": true,
  "MD013": false,
  "MD033": {
    "allowed_elements": ["br", "details", "summary"]
  },
  "MD041": false
}
```

Or `.markdownlint.yaml`:

```yaml
default: true
MD013: false
MD033:
  allowed_elements:
    - br
    - details
    - summary
MD041: false
```

## Inline Configuration

Disable rules for specific sections:

```markdown
<!-- markdownlint-disable MD033 -->
<div>Some HTML here</div>
<!-- markdownlint-enable MD033 -->

Single line disable: <!-- markdownlint-disable-line MD013 -->

Next line disable:

<!-- markdownlint-disable-next-line MD013 -->

This very long line won't trigger the line length warning because of the comment above.
```

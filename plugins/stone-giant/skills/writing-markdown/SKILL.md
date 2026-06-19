---
description: Writes and edits lint-compliant markdown files following markdownlint rules and best practices. Use when creating, editing, or reviewing .md files, README files, documentation, or any markdown content.
---

<!-- markdownlint-disable MD031 MD032 MD040 MD060 -->
<!-- Disabled: This file contains markdown examples that intentionally show code blocks and list patterns -->

# Writing Markdown

Produces clean, consistent, lint-compliant markdown files. All output passes markdownlint validation.

## Quick Reference

### Document Structure

```markdown
# Document Title

Introduction paragraph with no heading.

## First Section

Content here.

### Subsection

More content.

## Second Section

Additional content.
```

**Rules:**

- Start with a single H1 title (MD025)
- Increment heading levels by one (MD001): H1 → H2 → H3, never H1 → H3
- Surround headings with blank lines (MD022)
- No trailing punctuation in headings (MD026)
- Headings must start at line beginning (MD023)

### Blank Line Requirements

Always add a blank line:

- Before and after headings
- Before and after code blocks
- Before and after lists
- Before and after blockquotes
- Before and after tables

````markdown
Some paragraph text.

## Heading

Another paragraph.

- List item 1
- List item 2

More text after the list.

```javascript
const code = "example";
```
````

Text after code block.

````

### Lists

**Unordered lists** - Use consistent markers (dashes recommended):

```markdown
- First item
- Second item
  - Nested item (2 spaces indent)
  - Another nested item
- Third item
````

**Ordered lists** - Use `1.` for all items (auto-numbered on render):

```markdown
1. First step
1. Second step
1. Third step
```

**Rules:**

- Consistent indentation at same level (MD005)
- 2 spaces for nested items (MD007)
- Blank lines around lists (MD032)
- Consistent marker style throughout document (MD004)

### Code

**Inline code** - No spaces inside backticks:

```markdown
Use `const` for constants.
```

**Code blocks** - Always specify language, surround with blank lines:

````markdown
Some text.

```javascript
function example() {
  return true;
}
```

More text.
````

**Shell commands** - Include `$` only when showing output:

````markdown
```bash
npm install package-name
```
````

````

Not:
```markdown
```bash
$ npm install package-name
````

````

### Links and Images

**Links:**

```markdown
See the [installation guide](./docs/install.md) for details.

For more info, visit [GitHub](https://github.com).
````

**Images with alt text (required for accessibility):**

```markdown
![Screenshot of dashboard](./images/dashboard.png)
```

**Rules:**

- No bare URLs (MD034) - always use `[text](url)` format
- No empty links (MD042)
- No spaces inside link text (MD039)
- All images must have alt text (MD045)

### Emphasis

Use asterisks for consistency:

```markdown
This is _italic_ text.
This is **bold** text.
This is **_bold and italic_** text.
```

**Rules:**

- No spaces inside emphasis markers (MD037)
- Consistent style: use `*` not `_` (MD049, MD050)
- Don't use emphasis as headings (MD036)

### Tables

```markdown
| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
```

With alignment:

```markdown
| Left | Center | Right |
| :--- | :----: | ----: |
| Data |  Data  |  Data |
```

### Blockquotes

```markdown
> This is a blockquote.
>
> It can have multiple paragraphs.
```

**Rules:**

- Single space after `>` (MD027)
- No blank lines inside blockquotes unless intentional (MD028)

### Horizontal Rules

Use consistent style (three dashes):

```markdown
---
```

## Common Violations to Avoid

| Rule  | Issue                           | Fix                        |
| ----- | ------------------------------- | -------------------------- |
| MD009 | Trailing spaces                 | Remove spaces at line ends |
| MD010 | Hard tabs                       | Use spaces (2 or 4)        |
| MD012 | Multiple blank lines            | Use single blank lines     |
| MD022 | No blank line around heading    | Add blank lines            |
| MD031 | No blank line around code block | Add blank lines            |
| MD032 | No blank line around list       | Add blank lines            |
| MD033 | Inline HTML                     | Use markdown equivalents   |
| MD047 | No newline at end of file       | Add final newline          |

## File Conventions

- Use `.md` extension
- Use lowercase filenames with hyphens: `api-reference.md`
- Every folder should have a `README.md`
- End files with a single newline

## Best Practices Summary

1. **One sentence per line** - Improves diffs and version control
2. **Consistent formatting** - Same style throughout document
3. **Meaningful link text** - Not "click here" or "link"
4. **Alt text for images** - Accessibility requirement
5. **Language on code blocks** - Enables syntax highlighting
6. **No trailing whitespace** - Clean files
7. **Single final newline** - POSIX compliance

## Detailed References

- **Complete linting rules**: See [references/linting-rules.md](references/linting-rules.md)
- **Extended best practices**: See [references/best-practices.md](references/best-practices.md)

## Validation

To validate markdown files:

```bash
# Install markdownlint CLI (global install - use any package manager)
npm install -g markdownlint-cli    # or: pnpm add -g, bun add -g

# Lint a file
markdownlint README.md

# Lint all markdown files
markdownlint "**/*.md"

# Fix auto-fixable issues
markdownlint --fix "**/*.md"
```

<!-- markdownlint-disable MD031 MD032 MD040 MD051 -->
<!-- Disabled: Contains markdown examples showing code blocks and list patterns -->

# Markdown Best Practices

Extended best practices for writing high-quality markdown documentation.

## Contents

- [Document Structure](#document-structure)
- [Writing Style](#writing-style)
- [Links and References](#links-and-references)
- [Code Documentation](#code-documentation)
- [Accessibility](#accessibility)
- [Version Control](#version-control)
- [File Organization](#file-organization)
- [Performance](#performance)

## Document Structure

### Logical Heading Hierarchy

Structure documents with clear hierarchy:

```markdown
# API Reference

Introduction paragraph explaining the API.

## Authentication

Overview of authentication methods.

### API Keys

How to use API keys.

### OAuth 2.0

How to use OAuth.

## Endpoints

Overview of available endpoints.

### GET /users

Details for this endpoint.
```

### Front Matter

Use YAML front matter for metadata:

```markdown
---
title: API Reference
author: Documentation Team
date: 2025-01-07
version: 2.1.0
---

# API Reference
```

### Table of Contents

For long documents, include a TOC:

```markdown
## Contents

- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
```

### Document Length

- Keep documents focused on a single topic
- Split long documents into multiple files
- Aim for documents that can be read in 5-10 minutes
- Use links to connect related documents

## Writing Style

### One Sentence Per Line

Write each sentence on its own line for better diffs:

```markdown
<!-- Good for version control -->

This is the first sentence.
This is the second sentence.
When you edit one sentence, only that line changes.

<!-- Harder to diff -->

This is the first sentence. This is the second sentence. When you edit one sentence, the whole paragraph shows as changed.
```

### Active Voice

Prefer active voice over passive:

```markdown
<!-- Passive (avoid) -->

The configuration file should be created by the user.

<!-- Active (preferred) -->

Create a configuration file in your project root.
```

### Consistent Terminology

Pick one term and use it consistently:

- "click" vs "press" vs "select"
- "directory" vs "folder"
- "config" vs "configuration"

Create a terminology guide for team projects.

### Scannable Content

Use formatting to aid scanning:

- **Bold** for key terms and important concepts
- Lists for multiple items
- Tables for comparative information
- Headings to break up content
- Short paragraphs (3-5 sentences max)

## Links and References

### Meaningful Link Text

Write descriptive link text:

```markdown
<!-- Bad -->

Click [here](./guide.md) for more information.
See the documentation [link](./docs.md).

<!-- Good -->

See the [installation guide](./guide.md) for detailed steps.
Read the [API documentation](./docs.md) for endpoint details.
```

### Relative vs Absolute Links

Use relative links for internal documentation:

```markdown
<!-- Internal links (relative) -->

See [Configuration](./config.md)
See [Parent README](../README.md)

<!-- External links (absolute) -->

Visit [GitHub](https://github.com)
```

### Reference-Style Links

For documents with many links, use reference style:

```markdown
This document covers [installation][install], [configuration][config],
and [deployment][deploy].

[install]: ./docs/installation.md
[config]: ./docs/configuration.md
[deploy]: ./docs/deployment.md
```

### Check Links Regularly

Broken links frustrate users. Use tools like `markdown-link-check`:

```bash
npx markdown-link-check README.md
```

## Code Documentation

### Always Specify Language

Enable syntax highlighting:

````markdown
```python
def hello():
    print("Hello, World!")
```

```sql
SELECT * FROM users WHERE active = true;
```

```json
{
  "name": "example",
  "version": "1.0.0"
}
```
````

### Show Complete Examples

Provide runnable, complete examples:

````markdown
<!-- Bad: incomplete -->

```python
result = api.call()
```

<!-- Good: complete and runnable -->

```python
import requests

response = requests.get("https://api.example.com/users")
users = response.json()
print(f"Found {len(users)} users")
```
````

### Include Expected Output

Show what users should expect:

````markdown
```bash
npm install my-package
```

Output:

```
added 42 packages in 2.1s
```
````

### Use Placeholders Consistently

```markdown
Replace `<your-api-key>` with your actual API key.
Replace `{user_id}` with the user's ID.
```

## Accessibility

### Alt Text for Images

Always provide meaningful alt text:

```markdown
<!-- Bad -->

![](screenshot.png)
![image](screenshot.png)

<!-- Good -->

![Dashboard showing three charts: revenue, users, and engagement](screenshot.png)
```

### Alt Text Guidelines

- Describe the content, not the image format
- Keep under 125 characters when possible
- Don't start with "Image of..." or "Picture of..."
- For decorative images, use empty alt: `![](decorative.png)`

### Heading Structure

Proper heading hierarchy helps screen readers:

- Never skip levels (H1 → H3)
- Use headings for structure, not styling
- Don't use headings just to make text bigger

### Link Context

Links should make sense out of context:

```markdown
<!-- Bad: meaningless without context -->

For more info, click [here](#).

<!-- Good: self-descriptive -->

Read the [API authentication guide](./auth.md) for setup instructions.
```

## Version Control

### Commit Messages for Docs

Use clear commit messages:

```
docs: Add API authentication section
docs: Fix broken links in README
docs: Update installation instructions for v2.0
```

### Line Length for Diffs

Shorter lines create cleaner diffs:

- One sentence per line
- Break long lines at logical points
- Avoid very long URLs inline (use reference links)

### Avoid Binary Files

- Use text-based formats (SVG over PNG when possible)
- Keep images in a separate folder
- Consider using Git LFS for large images

## File Organization

### Naming Conventions

```
docs/
├── README.md              # Overview
├── getting-started.md     # Quick start guide
├── installation.md        # Installation instructions
├── configuration.md       # Configuration reference
├── api-reference.md       # API documentation
├── troubleshooting.md     # Common issues
└── images/
    ├── architecture.svg
    └── workflow.png
```

**Rules:**

- Use lowercase
- Use hyphens, not underscores or spaces
- Be descriptive but concise
- Use `.md` extension

### README Structure

Every project should have a README with:

1. Project name and description
2. Installation instructions
3. Quick start / basic usage
4. Links to detailed documentation
5. Contributing guidelines
6. License information

````markdown
# Project Name

Brief description of what this project does.

## Installation

```bash
npm install project-name
```
````

## Quick Start

```javascript
const project = require("project-name");
project.doSomething();
```

## Documentation

- [Full Documentation](./docs/README.md)
- [API Reference](./docs/api-reference.md)
- [Examples](./examples/)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT - see [LICENSE](./LICENSE)

```

## Performance

### Image Optimization

- Compress images before adding
- Use appropriate formats (SVG for diagrams, PNG for screenshots)
- Consider lazy loading for many images
- Provide width/height hints when possible

### Document Splitting

Split large documents:

```

api/
├── README.md # Overview and navigation
├── authentication.md # Auth methods
├── endpoints/
│ ├── users.md
│ ├── products.md
│ └── orders.md
└── errors.md # Error codes

````

### Avoid Redundancy

- Link to existing content instead of duplicating
- Create shared snippets for repeated content
- Keep a single source of truth

## Linting and Automation

### Editor Integration

Configure your editor with:

- markdownlint extension
- Spell checker
- Link checker
- Prettier for formatting

### CI/CD Integration

Add markdown linting to your pipeline:

```yaml
# GitHub Actions example
name: Lint Markdown
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint Markdown
        uses: DavidAnson/markdownlint-cli2-action@v16
````

### Pre-commit Hooks

Use husky and lint-staged:

```json
{
  "lint-staged": {
    "*.md": "markdownlint --fix"
  }
}
```

# Layout Patterns & Anti-Patterns

> For comprehensive CSS Grid, Subgrid, container query, and Tailwind layout patterns, see the **css-layout** skill.

## CSS Layout Patterns

### The Stack — Vertical Rhythm

```css
.stack > * + * {
  margin-block-start: var(--space, 1rem);
}
```

### The Cluster — Flexible Horizontal Groups

```css
.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
}
```

### The Sidebar — Main + Fixed Sidebar

```css
.with-sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
}
.with-sidebar > :first-child {
  flex-basis: 300px;
  flex-grow: 1;
}
.with-sidebar > :last-child {
  flex-basis: 0;
  flex-grow: 999;
  min-inline-size: 60%;
}
```

### The Center — Constrained Content Width

```css
.center {
  box-sizing: content-box;
  max-inline-size: 65ch;
  margin-inline: auto;
  padding-inline: var(--space-4);
}
```

### Natural Shadow

```css
/* Natural shadow - light from upper-left */
box-shadow:
  0 4px 6px -1px rgb(0 0 0 / 0.1),
  0 2px 4px -2px rgb(0 0 0 / 0.1);

/* Not this - even glow looks unnatural */
box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
```

## Anti-Patterns to Call Out

```text
❌ Walls of text without visual breaks
❌ Gray text on gray backgrounds (low contrast)
❌ Multiple font families competing
❌ Inconsistent spacing (random padding values)
❌ Tiny click targets on touch devices (< 44px)
❌ Relying only on color to convey meaning
❌ Centered body text (hard to read at length)
❌ Fixed widths that break on mobile
❌ Removing focus indicators without alternatives
❌ Modal dialogs for simple confirmations
❌ Carousels (users don't interact with them, ever)
❌ Hamburger menus on desktop (when space exists)
❌ Floating labels that disappear
❌ Justified text on the web (uneven word spacing)
❌ All caps for more than 3-4 words
❌ Drop shadows on everything
❌ Borders AND shadows AND background color changes (pick one)
```

## Quick Wins (Refactoring UI Style)

When something looks "off" but you're not sure why:

### 1. Add More White Space

Especially around text and between sections. Cramped = amateur.

### 2. Reduce Border Usage

Try spacing or background color differences instead of boxes around everything.

### 3. Don't Use Gray Text on Colored Backgrounds

Use a tinted version of the background color for text (e.g., dark blue text on light blue background).

### 4. Make Images Larger

Small images surrounded by whitespace look like thumbnails. Commit to the image or remove it.

### 5. Align Everything to Something

If nothing else, align left edges. Random alignment reads as chaos.

### 6. Use Fewer Colors

When in doubt, use more shades of gray and fewer hues.

### 7. Increase Font Size Contrast

If headings feel weak, they're probably too close in size to body text. Go bigger.

### 8. Offset Shadows Correctly

Shadows go down and slightly right (light from upper-left). Never use spread-only box shadows—they look like borders.

### 9. Round Corners Consistently

Small elements = small radius (4px). Large elements = larger radius (8-16px). Don't mix randomly.

### 10. When in Doubt, Simplify

Remove the border, the shadow, the gradient, the extra color. Start minimal and add only what's needed.

## Form Design Rules

```text
Labels:    Always visible (placeholder is not a label)
Required:  Mark optional fields, not required ones
Errors:    Show inline, next to the field, in red with icon
Success:   Confirm submission, show what was saved

Input sizing:
- Touch target minimum: 44x44px
- Height: 40-48px for comfortable clicking
- Width: Match expected input length

Smart defaults:
- Autofocus first field
- Appropriate input types (email, tel, number)
- Autocomplete attributes for browser autofill
- Enter to submit single-input forms
```

## Dark Mode Rules

Don't just invert colors:

```text
- Reduce contrast slightly (pure white on black = eye strain)
- Desaturate colors (vivid colors vibrate on dark backgrounds)
- Shadows become glows or rely on elevation via background shifts
```

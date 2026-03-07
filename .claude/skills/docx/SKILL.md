---
name: docx
description: Creates Word documents with proper formatting using pandoc. Activates when user asks for .docx output or article delivery.
allowed-tools: Read, Bash(pandoc *), Bash(python3 *), Bash(ls *), Bash(mkdir *)
---

# Word Document Creation

Creates professional .docx files using pandoc from HTML or Markdown source.

## ChiroClickEHR Document Style

- Font: Georgia 11pt body, 14pt headings
- Heading colors: Primary #1A365D (H1/H2), Secondary #2B6CB0 (H3/H4)
- Margins: 2.5cm top/bottom, 3cm left/right
- Line spacing: 1.15

## Special Boxes

Map HTML classes to Word styles:
- `premium-summary-card` → Green shaded box (TL;DR summary)
- `red-flag-alert` → Red bordered box (clinical warnings)
- `info-box` → Blue shaded box (informational callouts)

## Workflow

1. Read the source HTML/Markdown file
2. Create a pandoc reference template if needed: `pandoc --print-default-data-file reference.docx > /tmp/ref.docx`
3. Convert: `pandoc -f html -t docx --reference-doc=/tmp/ref.docx -o output.docx input.html`
4. Verify output exists and report file size
5. If pandoc is not installed, fall back to `python3` with `python-docx` library

## Post-Conversion Checklist

- [ ] Headings render with correct hierarchy
- [ ] Special boxes are visually distinct
- [ ] Images are embedded (not linked)
- [ ] Norwegian characters (aeoa) render correctly
- [ ] File size is reasonable (<5MB for text-only)

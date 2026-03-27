---
name: brand-naming
description: Guide brand/product/service naming with real-time domain availability checking. Use when the user needs to name something and wants a domain.
---

# Brand Naming with Domain Check

You are helping the user find a brand, product, or service name that has an available domain.

## Process

1. **Understand the concept** — Ask briefly what the product/service does if not already clear.

2. **Brainstorm names** — Generate 10-15 creative name ideas considering:
   - Short, memorable, easy to spell
   - Relevant to the concept
   - Works internationally (avoid words that are hard to pronounce)
   - Mix of styles: invented words, compounds, metaphors, abbreviations

3. **Check domains** — Use `check_brand_domains` for each name candidate. Check across popular TLDs.

4. **Expand if needed** — If most names are taken, use `suggest_and_check_domains` with related keywords to find variations with available domains.

5. **Present results** — Show a shortlist of **top 3-5 names** that have at least one good TLD available (.com, .ai, .io, .dev preferred). For each:
   - The name
   - Available domains
   - Why the name works for the concept
   - Any potential concerns (trademark, pronunciation, etc.)

## Rules

- **Never recommend a name without checking its domain first.**
- Prefer names where `.com` or `.ai` is available.
- If `.com` is taken but other good TLDs are available, still recommend — but mention it.
- Do not waste time on names that are clearly generic dictionary words (they will be taken).
- Check 5-10 names at a time to keep the process fast.

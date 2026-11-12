---
name: Template notice safeguards
description: Why incomplete notice fields need an output safeguard in addition to Gemini prompt instructions.
---

Keep deterministic missing-information labels for template fields after generation, even when the prompt already tells Gemini not to present placeholders as confirmed values.

**Why:** Live Gemini responses continued to quote and bold bracketed deadline and phone placeholders despite explicit instructions against that formatting. A nearby disclaimer was not enough to prevent the field from looking like a confirmed value.

**How to apply:** Preserve final template-field labeling when changing prompts or model configuration. Keep real filled-in dates, agency contacts, checkbox selections, and privacy-redaction markers distinct from missing fields.

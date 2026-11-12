# Benefits Letter Decoder: Tools and Skills

This document describes the tools and AI skills that exist in the project today.
It does not describe planned features.

## Skills and executable tools

A **skill** is written guidance in a `SKILL.md` file. It tells the agent or AI
how to handle a kind of request, such as explaining a letter or translating
text. A skill is not, by itself, a program that looks up data or edits text.

An **executable tool** is JavaScript in a `tool.js` file. The agent can run it
to perform a specific task and then use its result. A skill may have a tool,
but it does not have to. The agent loads tools from the skill folders and runs
a selected skill's tool when one exists, unless tool execution is skipped.

## Existing executable tools

### Safety guardrail

**Code:** `skills/safety-guardrail/tool.js`

**Purpose:** Applies predictable privacy and safety checks to a message before
the agent sends the cleaned text to an AI skill.

**Input:** An object with:

- `message`: the text to check.
- `preserveAgencyContacts`: optional setting, `false` by default. When `true`,
  the tool can keep a phone number or email that appears to be a labeled agency
  contact in its surrounding sentence.

**Output:** An object with:

- `redacted`: the message with detected personal details replaced by labels,
  such as `[email removed]` or `[SSN removed]`.
- `flags`: detected topics (`crisis`, `medical`, or `legal`) and
  `pii-removed` when personal details were removed.
- `removed`: labels for the personal details it removed.

The tool checks for email addresses, phone-number patterns, Social Security
numbers, and 13–16 digit card-number patterns. In letter-processing mode, it
may preserve a phone number or email when the surrounding text contains both
agency and contact wording and does not label the detail as personal. It never
preserves detected Social Security or card numbers.

**When it runs:** The agent runs this tool on every message before choosing a
response skill. The letter explanation endpoint uses it too, with
`preserveAgencyContacts: true`. If the tool flags a crisis, the agent returns
its built-in crisis response instead of continuing to the AI.

### Resource finder

**Code:** `skills/resource-finder/tool.js`

**Purpose:** Searches the app's resource database for community services that
may match a message.

**Input:** An object with:

- `message`: the text to search for.

**Output:** An object with:

- `context`: a text summary of the database matches for the AI. If there are no
  matches, it says `Database results: none found.`
- `data`: the matching database rows, up to five; an empty list when there are
  no matches.

For matches, the context includes each resource's name, category, neighborhood,
description, hours, phone, and languages.

**When it runs:** The agent runs this tool when the `resource-finder` skill is
selected and tool execution has not been skipped. The current letter
explanation MVP does **not** use it: the letter endpoint forces the
`plain-language-explainer` skill and skips tools.

## Existing skills

The project currently has six `SKILL.md` files:

### User-facing skills

- **`action-plan-builder`** — Gives a short, numbered plan with next steps and
  who to contact.
- **`plain-language-explainer`** — Explains confusing text, including letters,
  in simple English. The letter explanation MVP uses this skill.
- **`resource-finder`** — Answers community-service questions using database
  results. It has the executable resource-finder tool described above, but is
  not used by the current letter explanation MVP.
- **`translator`** — Translates text while keeping its meaning, tone, names,
  numbers, and dates.

### Behind-the-scenes skills

- **`intent-router`** — Helps the AI choose one user-facing skill when automatic
  skill selection is used. It is guidance for routing, not a `tool.js`
  executable.
- **`safety-guardrail`** — Describes the privacy and safety checks that run for
  every message. The actual checks are performed by the executable tool
  described above, not by asking the AI to redact the message.

The router only offers user-facing skills as choices. The agent also supports
keyword-based routing when running in mock mode or when AI routing fails.

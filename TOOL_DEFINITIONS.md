# Benefits Letter Decoder: Tools and Skills

This document describes the tools and skills that exist in the project's code.

## Skills and tools are different

- A **skill** is written guidance in a `SKILL.md` file. It tells the AI how to
  handle a type of request, such as explaining a letter or translating text.
- A **tool** is JavaScript code the server runs for a specific job, such as
  hiding personal details or searching stored resources. It takes input and
  returns a result.
- A skill can have a tool, but does not need one. Only `safety-guardrail` and
  `resource-finder` currently have a `tool.js` file.

The loader in `server/agent/skills.js` reads the skill instructions and imports
any tool file. The agent calls the code when needed. These two tools are not
functions Gemini can freely call by itself.

`system.md` contains the main AI instructions. It is not an executable tool.
Gemini is the AI service used to write explanations; its connection is not
one of the two skill tools.

## Tool 1: Safety guardrail

**File:** `skills/safety-guardrail/tool.js`

**Function:** `run({ message, allowOfficialPhones = false, preserveAgencyContacts = false })`

### Purpose

Check text before the AI sees it. The tool uses text patterns, not AI, to:

- Replace matching emails, Social Security numbers, 13–16 digit card numbers,
  and phone numbers with labels such as `[email removed]`.
- Flag crisis, medical, and legal topics.
- Add a `pii-removed` flag when it removes personal information.

These checks do not guarantee that every personal detail or risky situation
will be found. There is no general name or street-address detector.

### Inputs

| Input | Meaning |
| --- | --- |
| `message` | The text to check, as a string. Letter processing passes the pasted notice. |
| `allowOfficialPhones` | A compatible phone-only setting from the earlier implementation. It defaults to `false`. It may keep phones with nearby agency/contact labels unless the preceding text looks personal. It does not preserve emails. |
| `preserveAgencyContacts` | Defaults to `false`. The current letter flow sets this to `true`. It can keep phones and emails with agency and contact wording nearby, unless the text labels them as personal. When enabled, this contact check takes precedence over the phone-only setting. |

Contact recognition is a text-pattern check, not verification that a phone or
email belongs to a real agency. Matching SSNs and card numbers are still
removed in either mode.

### Outputs

| Output | Meaning |
| --- | --- |
| `redacted` | The text with matching personal details replaced by removal labels. |
| `flags` | Any detected flags: `crisis`, `medical`, `legal`, and/or `pii-removed`. This list can be empty. |
| `removed` | The types removed: `email`, `SSN`, `card number`, and/or `phone`. A type may appear more than once. The actual removed values are not returned here. |

The file also exports `CRISIS_REPLY`, a fixed response mentioning 911 and 988.
It is a message, not another tool.

### When it runs

- **Current letter MVP:** `runLetterAgent()` calls it first with
  `preserveAgencyContacts: true`.
- **General chat:** `runAgent()` calls it before skill selection. Its default
  settings remove matching phone and email details, including agency contacts.
- It runs in both live Gemini mode and mock mode.

If the tool flags a crisis, the agent returns `CRISIS_REPLY` instead of asking
Gemini to answer. The tool reports the flag; the agent performs this stop.

Medical and legal flags do not block a request. A keyword alone does not add a
blanket disclaimer in the current letter path. Relevant safety warnings remain
allowed. General chat still adds standard notes unless its internal
`suppressRoutineNotes` setting is enabled. Hiding routine removal messages
does not disable redaction.

## Tool 2: Resource finder

**File:** `skills/resource-finder/tool.js`

**Function:** `async run({ message })`

### Purpose

Search community resources already stored by the app. The tool calls
`searchResourcesForAgent(message, 5)` from `server/db/resources.js`.

The search compares words from the message with resource names, categories,
descriptions, and neighborhoods. It reads PostgreSQL when a database is
configured, or the in-memory sample list when no database is configured.
It does not search the web or government systems. A stored result does not
guarantee that a service or its contact details are current.

### Inputs

`message` is the search text, as a string. In the general agent flow, it has
already passed through the guardrail. The five-result limit is set inside the
tool; it is not supplied by the visitor.

### Outputs

The agent waits for the tool to return:

| Output | Meaning |
| --- | --- |
| `context` | Text for the AI prompt. Each match includes its name, category, neighborhood, description, hours, phone, and languages. |
| `data` | Up to five matching resource records, or an empty list. |

Records include fields such as `id`, `name`, `category`, `description`,
`neighborhood`, `address`, `phone`, `website`, `hours`, `languages`, and
`created_at`. The PostgreSQL search also returns a matching score.

With no matches, the exact result is:

```json
{
  "context": "Database results: none found.",
  "data": []
}
```

This tool reads resources. It does not add or edit them.

### When it runs

In general chat, the visitor or router can select the `resource-finder` skill.
Unless the agent's internal `skipTools` setting is enabled, the tool runs
before the AI writes the answer. Its result becomes prompt context, and the
agent returns matching resource IDs and names in `sources`.

**Resource finder is not part of the current letter explanation MVP.** Both
letter API paths use the private letter agent. It does not select this skill,
use general routing, or search the resource database.

## Existing AI skills

There are six `SKILL.md` files under `skills/`:

| Skill | Purpose | Has a tool? | Role in the letter MVP |
| --- | --- | --- | --- |
| `safety-guardrail` | Describes privacy and safety checks performed by code. | Yes | Runs first. Internal skill. |
| `plain-language-explainer` | Explains confusing text in simple English. | No | Used directly for explanations. |
| `intent-router` | Chooses one public skill and a short reason, checked by code. | No | Not used by the letter flow. Internal skill. |
| `resource-finder` | Answers community-service questions using stored search results. | Yes | Not used. |
| `action-plan-builder` | Gives short, numbered next steps and who to contact. | No | Not selected by the letter flow. |
| `translator` | Gives translation instructions intended to preserve meaning, tone, names, numbers, and dates. | No | Not selected by the letter flow. |

The general chat router offers four public skills: plain-language explainer,
resource finder, action-plan builder, and translator. Guardrail and router
are behind-the-scenes skills, not choices for answering the question.
General chat uses keyword routing in mock mode or if AI routing fails.

## Current letter explanation flow

1. The form sends `POST /api/letters/explain` with a `message` field. The
   compatible `POST /api/letter/explain` route accepts `letterText` instead.
   Both validate a maximum of 15,000 characters and call `runLetterAgent()`.
2. The safety-guardrail tool processes the notice, allowing clearly labeled
   agency phone and email contacts.
3. Crisis requests get the fixed emergency response without calling Gemini.
4. Otherwise, live mode combines base rules, `system.md`, the plain-language
   skill, and letter requirements. Gemini receives the guarded notice.
   Mock mode uses local sample-answer logic.
5. The server labels unfilled template fields, removes known closing chatter,
   and keeps the official-document reminder.

The letter path has no chat history, resource lookup, letter-text storage, or
application chat logging. The route also avoids logging provider errors that
could contain notice text. Responses contain the explanation, skill name,
routing label, safety flags, and live/mock mode.

The general agent also retains internal `skipTools`, `skipLogging`, and
`suppressRoutineNotes` options. These are server options, not tools or settings
visitors can enable through the chat API.

## Code references

- `server/agent/agent.js` — general and letter processing.
- `server/agent/skills.js` — skill and tool loading.
- `server/agent/router.js` — general skill selection.
- `server/agent/letter-completeness.js` — incomplete-notice safeguards.
- `server/agent/letter-response.js` — explanation ending cleanup.
- `server/routes/api.js` and `server/validation.js` — routes and request checks.
- `server/db/resources.js` — stored resource searches.
- `skills/*/SKILL.md` and `system.md` — written AI instructions.

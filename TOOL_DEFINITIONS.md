# Benefits Letter Decoder: Tools and Skills

This document describes the tools and skills that exist in this project's code.

## Skills and tools are different

- A **skill** is a set of written instructions in a `SKILL.md` file. It tells the AI how to handle a type of request.
- A **tool** is JavaScript code that the server runs to do a specific job, such as hiding personal details or searching stored resources. A tool takes input and returns a result.
- A skill can have a tool, but it does not need one. In this project, only `safety-guardrail` and `resource-finder` have a `tool.js` file.

The loader in `server/agent/skills.js` reads the skill instructions and imports any tool file. The agent decides when to call a tool. These tools are not a list of functions that Gemini can freely call.

`system.md` contains the application's main AI instructions. It is not an executable tool. Gemini is the AI service used to write explanations; the Gemini connection itself is not one of these two tools.

## Tool 1: Safety guardrail

**File:** `skills/safety-guardrail/tool.js`

**Function:** `run({ message, allowOfficialPhones = false })`

### Purpose

Check incoming text before the AI sees it. The tool uses text patterns, not AI, to:

- Replace matching email addresses, Social Security numbers, card numbers, and phone numbers with labels such as `[email removed]` or `[phone removed]`.
- Flag words or phrases related to a crisis, medical topics, or legal topics.
- Add a `pii-removed` flag when it removes personal information.

These checks are pattern-based. They do not guarantee that every personal detail or risky situation will be found. For example, the code does not include a general name or street-address detector.

### Inputs

| Input | Meaning |
| --- | --- |
| `message` | The text to check, as a string. For letter processing, this is the pasted notice. |
| `allowOfficialPhones` | An optional setting. It is `false` by default. Letter processing sets it to `true` so clearly labeled agency phone numbers can be kept. |

When `allowOfficialPhones` is `true`, the code looks at the text immediately before each phone number on the same line. Agency labels can allow a number to remain. Personal labels such as “my,” “personal,” or “cell” cause it to be removed. This is a text-pattern check, not verification that the number belongs to a real agency.

The setting affects phone numbers only. The other personal-information checks still run.

### Outputs

The tool returns an object with these fields:

| Output | Meaning |
| --- | --- |
| `redacted` | The text after matching personal details have been replaced with removal labels. |
| `flags` | A list containing any detected flags: `crisis`, `medical`, `legal`, and/or `pii-removed`. It can be empty. |
| `removed` | A list of the types removed: `email`, `SSN`, `card number`, and/or `phone`. A type can appear more than once if several matches were removed. The removed values are not returned here. |

The file also exports `CRISIS_REPLY`, a fixed emergency response mentioning 911 and 988. This is a message, not another tool.

### When it runs

- **Current letter MVP:** `runLetterAgent()` calls this tool before generating an explanation, with `allowOfficialPhones: true`.
- **General chat:** `runAgent()` calls it before routing the message to another skill, using the default phone-removal setting.
- It runs in both live Gemini mode and mock mode.

If the tool returns a `crisis` flag, the agent returns `CRISIS_REPLY` instead of asking Gemini to answer. The tool reports the flag; the agent performs this stop.

Medical and legal flags do not automatically block a request. In the current letter path, a keyword alone does not add a blanket disclaimer. Necessary, relevant safety warnings are still allowed. The general chat path still appends its standard medical or legal notes when those flags are present.

Removing routine privacy messages from the explanation does not turn off this tool or its redaction.

## Tool 2: Resource finder

**File:** `skills/resource-finder/tool.js`

**Function:** `async run({ message })`

### Purpose

Find community resources already stored by the application. It calls `searchResourcesForAgent(message, 5)` from `server/db/resources.js`.

The search uses words from the message to look for matching resource names, categories, descriptions, and neighborhoods. It returns up to five matches:

- From PostgreSQL when a database is configured.
- From the in-memory sample resource list when no database is configured.

It does not search the web or government systems. A stored match is not a guarantee that a service or its contact details are current.

### Inputs

| Input | Meaning |
| --- | --- |
| `message` | The search text, as a string. In the general agent flow, this is the text after the safety guardrail has processed it. |

The five-result limit is set inside the tool. It is not an input supplied by the visitor.

### Outputs

Because the tool is asynchronous, the agent waits for it to return:

| Output | Meaning |
| --- | --- |
| `context` | Text for the AI prompt. For each match, it includes the resource's name, category, neighborhood, description, hours, phone number, and languages. |
| `data` | The matching resource records, returned by the search helper. |

The resource records include fields such as `id`, `name`, `category`, `description`, `neighborhood`, `address`, `phone`, `website`, `hours`, `languages`, and `created_at`. The PostgreSQL search also returns a matching score.

If there are no matches, the result is exactly:

```json
{
  "context": "Database results: none found.",
  "data": []
}
```

The tool reads resources. It does not add or edit them.

### When it runs

In the general chat flow, the visitor or router can select the `resource-finder` skill. The agent then runs its tool before writing the answer. The results become prompt context, and the agent includes matching resource IDs and names in its returned `sources`.

**Resource finder is not part of the current letter explanation MVP.** The letter flow does not select this skill or search the resource database, even if a notice mentions a service or agency.

## Existing AI skills

These six skill folders exist under `skills/`:

| Skill | What it does | Has a `tool.js`? | Role in the current letter MVP |
| --- | --- | --- | --- |
| `safety-guardrail` | Checks for matching personal details and safety-related topics. | Yes | Runs first on every submitted letter. |
| `plain-language-explainer` | Helps rewrite confusing text in simple English. | No | Its instructions are used for letter explanations. |
| `intent-router` | Chooses which public skill should handle a general chat message. It returns a skill name and a short reason, checked by code. | No | Not used to choose a skill for letter explanations. |
| `resource-finder` | Tells the AI to answer resource questions using the tool's stored results. | Yes | Not used. |
| `action-plan-builder` | Gives a short, numbered plan with practical next steps. | No | Not selected by the letter flow. |
| `translator` | Gives translation instructions that aim to preserve the original meaning and details. | No | Not selected by the letter flow. |

The general chat router can choose `plain-language-explainer`, `resource-finder`, `action-plan-builder`, or `translator`. The guardrail and router are internal skills, not choices for answering a visitor's question. General chat can use AI routing, or keyword-based routing in mock mode or if AI routing fails.

The letter flow uses the plain-language skill directly. It does not run the general skill-selection step.

## Current letter explanation flow

1. The frontend sends the pasted notice to `POST /api/letter/explain`.
2. The backend checks the request and calls `runLetterAgent()`.
3. The **safety-guardrail tool** processes the notice, allowing clearly labeled official phone numbers.
4. If a crisis is detected, the agent returns the fixed emergency response without calling Gemini.
5. Otherwise, live mode combines the base instructions, `system.md`, the plain-language skill, and letter-specific requirements. Gemini receives the guarded notice and writes the explanation. Mock mode uses the local sample-answer logic.
6. The server labels unfilled template fields, removes known automatic closing chatter, and keeps the official-document reminder.

The letter path does not call the resource-finder tool, save submitted letter text in the database, or write it to the application's chat logs. Its response includes the explanation, skill name, routing label, safety flags, and live/mock mode.

## Code references

- `server/agent/agent.js` — general chat and letter execution paths.
- `server/agent/skills.js` — skill and tool loading.
- `server/agent/router.js` — general chat skill selection.
- `server/agent/letter-completeness.js` — template-field and incomplete-notice safeguards.
- `server/agent/letter-response.js` — letter response ending cleanup.
- `server/routes/api.js` — letter and chat API routes.
- `server/db/resources.js` — stored resource searches.
- `skills/*/SKILL.md` — the six written skill definitions.
- `system.md` — main Benefits Letter Decoder instructions.

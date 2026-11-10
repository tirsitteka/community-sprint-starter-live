# SPEC.md: Our Project Specification

> Fill this in with your team **before** your first ticket.
> Short and specific beats long and vague. Every `TODO` must be gone by the end of day 1.
> How to use it: see [`docs/SPEC-DRIVEN-DEVELOPMENT.md`](docs/SPEC-DRIVEN-DEVELOPMENT.md).

---

## PART A: Sprint rules (set by CodeSquad, don't delete)

### A1. Stack
- React (in `src/`) + Node/Express (in `server/`) + Replit PostgreSQL + Gemini through LangChain.
- AI calls happen ONLY on the server (`server/ai/model.js`). Never from React.
- Every agent skill is a folder: `skills/<name>/SKILL.md`, name matches the folder.

### A2. Security
- API keys live in Replit Secrets or `.env`. Never in code, commits, screenshots, or chat.
- `import 'dotenv/config'` is the first line of every server file that reads settings.
- Every request is checked with zod `.safeParse()` before the AI or database is used.
- SQL uses `$1, $2` placeholders. Never glue user text into SQL.

### A3. Responsible AI
- The agent says it is an AI and never poses as a doctor, lawyer, or counselor.
- The `safety-guardrail` skill stays on. Personal info is removed before the AI sees it.
- Facts come from the database or a cited source, or the agent says "I don't know".
- Anything high-stakes gets a path to a real person (phone, website, office).

### A4. Scope
- Two weeks. One core user journey. At most 3 must-have features.
- Live on Replit by demo day, with a backup screen recording.

---

## PART B: Our project (fill this in)

### 1. Team and one-liner
- **Team name:** AI Advocacy - Letter Decoder
- **App name:** Benefits Letter Decoder
- **One sentence:** We help older adults understand complicated Medicaid and SNAP letters so they know what actions to take and when.

### 2. Problem
- **Problem statement:** Older adults often receive complicated Medicaid and SNAP letters that are difficult to understand. They may miss important deadlines or fail to take required actions, putting their benefits at risk.
- **Theme:** Access to Essential Services / Senior Advocacy
- **Evidence it's real:** Government benefits notices contain complex language and instructions. Our team identified this as a problem affecting older adults. We will add a supporting source or firsthand account.

### 3. User
- **Main user:** Adults age 65 and older who receive Medicaid or SNAP notices and may have difficulty understanding complicated instructions or using technology. Family members and caregivers may also help them.
- **What they do today without our app:** Try to understand complicated letters themselves, ask family members for help or contact government agencies for clarification.
- **Device and language(s):** Smartphone or computer. English for the initial MVP.

### 4. Goals
| Goal | How we'll measure it | Target |
|---|---|---|
| Users understand the deadline and required action | Test with 2 fictional notices (Medicaid and SNAP) | Correct deadline and required action for both notices |
| The app accurately identifies key information | Compare results with answer keys for 2 sample notices | 100% accuracy on both notices; original text remains visible |
| Users know who to contact and what to do next | Review the next steps and contact information in both results | Clear instructions without invented contact details |
| The app handles unclear information safely | Test a notice with missing or unclear information | Warn the user instead of guessing |

### 5. Features
| Priority | Feature | Ticket | Skill(s) |
|---|---|---|---|
| Must | Upload a photo or paste notice text | Not created | To be confirmed |
| Must | Explain the notice, deadline, required action and who to contact | Not created | To be confirmed |
| Must | Display original wording alongside summary and show uncertainty warnings | Not created | To be confirmed |
| Not now | Eligibility screening and application submission | n/a | n/a |

### 6. Agent and skills
- **Agent name and voice:** Benefits Letter Decoder — calm, respectful, clear, and easy to understand. Uses 6th-grade reading level.
- **Starter skills we keep:** plain-language-explainer, action-plan-builder, safety-guardrail.
- **New skills we'll write:** None confirmed yet. We will evaluate whether a notice-specific skill is needed.
- **The agent must NEVER:** Invent deadlines or required actions, determine benefits eligibility, provide legal advice, or claim information is correct when the letter is unclear.

### 7. Data
| Table | What's in it | Where the data comes from | Who keeps it up to date |
|---|---|---|---|
| resources | Public agency phone numbers and website information | Official government agency websites | Team (manual updates) |
| sample_notices | Fictional Medicaid renewal and SNAP recertification notices for testing | Team-created fictional test documents | Team (manual updates) |

### 8. Privacy and governance
- **Personal info our app could touch:** Names, addresses, case numbers, health information and benefits details contained in uploaded letters.
- **How we protect it:** Use fictional sample notices for development and testing. Do not save uploaded letters or personal information in our application database. Review API handling and logging before allowing real notices.
- **What we tell users up front:** AI can make mistakes. Users should verify deadlines and required actions against the original notice and contact the agency when unsure. The app does not provide legal advice or determine benefits eligibility.
- **Who on the team is responsible:** To be assigned by the team.

### 9. Out of scope (not in these two weeks)
- Eligibility screening (Benefits Finder)
- Filling out or submitting government applications
- User accounts or saving uploaded letters
- Supporting additional benefit programs or multiple states
- Providing legal advice or connecting directly to government agency systems

### 10. Open questions
- Which state will we use for the Medicaid and SNAP sample notices?
- Who will be responsible for development, AI prompts, testing and research?
- Which AI agent skills will we use or create?
- How will we handle photo uploads and ensure sensitive information is not retained?
- Who will be responsible for privacy and reviewing AI-generated explanations?

# Running on Replit

Keep the imported React + Vite frontend and Node.js + Express backend structure.
Express serves both the API and frontend on one port.

- Runtime: Node.js 22.12 or newer.
- Install locked dependencies with `npm ci`.
- Click **Run** to start **Start application** (`npm run dev`).
- The server binds to `0.0.0.0:5000`; open Preview to use the app.
- Run tests with `npm test`; build the production frontend with `npm run build`.
- Production uses `npm start` after building.
- The post-merge hook runs `scripts/post-merge.sh` to install dependencies,
  run the existing idempotent database setup, test, and build.
- Restart the application workflow after backend changes or a repaired merge
  setup failure. Frontend hot reload alone does not load new Express routes.

## Letter explanation and privacy

- The paste form sends notice text to `POST /api/letters/explain` as `{ message }`.
  The compatible `POST /api/letter/explain` endpoint accepts `{ letterText }`.
  Both call the same private letter agent with the existing Gemini integration.
- The shared letter limit is 15,000 characters in the UI and both APIs.
- Letter requests have no chat history, resource lookup, database logging, or
  application error logging. Do not add storage or request-body logging here.
- The safety guardrail runs first. Matching personal phones, emails, SSNs,
  and card numbers are removed. In letter mode, clearly labeled agency phone
  and email contacts may be retained using text-pattern checks.
- Preserve the template/deadline safeguards, context-specific safety warnings,
  four-section format, and single official-notice reminder.
- Gemini credentials stay in Replit Secrets. The browser never receives the key.

## Optional services

Live Gemini and the development PostgreSQL connection have been verified with
fictional notices. Without `GEMINI_API_KEY` (or with `AI_MODE=mock`), explanations
use mock mode. Without `DATABASE_URL`, the existing resource features use
in-memory sample data; additions in that mode are lost on restart.

Database startup initializes the existing tables and adds 30 sample resources
only when the resource table is empty. Letter explanations do not search them.
Never commit secret values.

Project identity and team details remain in `shared/project.config.js`.

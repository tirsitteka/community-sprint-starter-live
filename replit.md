# Running on Replit

This project keeps its original React + Vite frontend and Node.js + Express backend.
Express serves both the API and frontend on one port.

- Runtime: Node.js 22 (current Google AI dependencies require Node.js 22).
- Install dependencies: `npm ci`.
- Click **Run** to start the **Start application** workflow (`npm run dev`).
- The server binds to `0.0.0.0:5000`; open Preview to use the app.
- Run tests with `npm test`; check the production build with `npm run build`.
- Production uses `npm start` after building.

## Letter explanation and privacy

- The paste form sends notice text to `POST /api/letters/explain`; the server uses
  the existing Gemini integration and `plain-language-explainer` skill.
- Letter requests have no chat history, resource lookup, database logging, or
  application error logging. Do not add storage or request-body logging to this flow.
- The safety guardrail still runs. Personal phone numbers, email addresses, SSNs,
  and card numbers are removed. In letter mode only, phone/email details explicitly
  labeled as agency contacts in the same sentence may be retained for the explanation.
- Gemini credentials stay in Replit Secrets. The browser never receives the API key.
- Letter text is limited to 15,000 characters.

Live Gemini and the development PostgreSQL connection were verified with a
fictional notice. Without `GEMINI_API_KEY`, the assistant falls back to mock mode.
If run without a database connection, the existing resource features use
in-memory sample data; additions in that mode are lost on restart.

Project identity and team details remain as imported in `shared/project.config.js`.

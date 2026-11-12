# Running on Replit

This project keeps its original React + Vite frontend and Node.js + Express backend.
Express serves both the API and frontend on one port.

- Runtime: Node.js 22 (current Google AI dependencies require Node.js 22).
- Install dependencies: `npm ci`.
- Click **Run** to start the **Start application** workflow (`npm run dev`).
- The server binds to `0.0.0.0:5000`; open Preview to use the app.
- Run tests with `npm test`; check the production build with `npm run build`.
- Production uses `npm start` after building.

## Current service mode

The app connected successfully to the development PostgreSQL database and
initialized 30 sample resources. The assistant currently uses the starter's mock
responses because live Gemini access is not configured.

Live AI has not been verified. To enable it later, configure Gemini credentials
through Replit's integration and Secrets tools. Never put credentials in source files.
If run without a database connection, the app uses in-memory sample resources;
additions in that mode are lost on restart.

Project identity and team details remain as imported in `shared/project.config.js`.

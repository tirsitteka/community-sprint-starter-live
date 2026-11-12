# Running on Replit

- Runtime: Node.js 22.12 or newer.
- Click **Run** to start the **Start application** workflow (`npm run dev`).
- Express listens on `0.0.0.0:5000` and serves both `/api` and the React app through Vite.
- Install the locked dependencies with `npm ci` when setting up a fresh environment.
- Run checks with `npm test` and build the production frontend with `npm run build`.
- Production uses `npm start` after a build.

## Optional services

The verified Replit environment already has a working PostgreSQL connection, and startup initialized 30 sample resources. Gemini is currently in mock mode.

The starter runs without external services: AI responses are mocked and the resource board uses sample data in memory. Resources added in this mode are lost when the server restarts.

For live AI, connect Gemini using the `GEMINI_API_KEY` secret. For durable storage, connect PostgreSQL using `DATABASE_URL`. Neither is required to explore the starter. Never commit secret values.

Keep the imported React/Vite frontend and Express backend structure.

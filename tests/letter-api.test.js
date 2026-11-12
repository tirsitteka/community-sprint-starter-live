import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { api as client } from '../src/api.js';

// Exercise the browser's real API helper without a provider key or database.
process.env.AI_MODE = 'mock';
delete process.env.DATABASE_URL;
const { api: routes } = await import('../server/routes/api.js');

test('letter form API helper reaches the backend and preserves validation and safety', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'No such API route.' }));

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (path, options) => originalFetch(new URL(path, base), options);
  t.after(async () => {
    globalThis.fetch = originalFetch;
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  });

  for (const explain of [client.explainLetter, client.explainLetterLegacy]) {
    const result = await explain(
      'Your SNAP renewal is due by June 12. Please return the form. For agency questions call 800-555-0142 or email help@example.gov.',
    );
    assert.equal(result.skill, 'plain-language-explainer');
    assert.equal(result.routedBy, 'letter-explainer');
    assert.match(result.reply, /What This Letter Means/);
    assert.match(result.reply, /June 12/);
    assert.match(result.reply, /800-555-0142/);
    assert.match(result.reply, /help@example.gov/);
    await assert.rejects(explain('   '), /Paste .*letter first/);
    await assert.rejects(explain('x'.repeat(15001)), /15000|15,000/);
    const longNotice = await explain('x'.repeat(15000));
    assert.equal(longNotice.skill, 'plain-language-explainer');
    const crisis = await explain('I want to hurt myself.');
    assert.equal(crisis.skill, 'safety-guardrail');
    assert.match(crisis.reply, /988/);
  }
});

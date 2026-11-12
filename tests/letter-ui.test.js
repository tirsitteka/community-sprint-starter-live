import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('merged letter UI retains the form improvements and safely renders explanations', async (t) => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'error',
  });
  t.after(() => vite.close());
  const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
  const initial = renderToStaticMarkup(createElement(App));
  assert.match(initial, /Paste Your Letter/);
  assert.match(initial, /15,000/);
  assert.match(initial, /maxLength="15000"/i);
  assert.match(initial, /Your original notice/);
  assert.match(initial, /Plain-language explanation/);
  assert.match(initial, /Explain My Letter/);

  const { default: LetterResults } = await vite.ssrLoadModule('/src/components/LetterResults.jsx');
  const explanation = '### What This Letter Means\nReturn the form.\n### Important Deadline\n**June 20, 2027**\n### What You Need to Do\n1. Return it.\n### Who to Contact\n800-555-0142';
  const result = renderToStaticMarkup(createElement(LetterResults, {
    letterText: '<script>fictional notice</script>',
    explanation, busy: false, error: '',
  }));
  assert.equal((result.match(/<h4>/g) ?? []).length, 4);
  assert.match(result, /<strong>June 20, 2027<\/strong>/);
  assert.match(result, /&lt;script&gt;fictional notice&lt;\/script&gt;/);
  assert.doesNotMatch(result, /<script>/);
  const failed = renderToStaticMarkup(createElement(LetterResults, {
    letterText: 'Original notice stays visible.', explanation: null, busy: false, error: 'Provider unavailable',
  }));
  assert.match(failed, /Original notice stays visible/);
  assert.match(failed, /explanation could not be prepared/i);
});

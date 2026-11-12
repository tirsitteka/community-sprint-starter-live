import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finalizeLetterExplanation, OFFICIAL_NOTICE_REMINDER } from '../server/agent/letter-response.js';

process.env.AI_MODE = 'mock';
delete process.env.DATABASE_URL;
const { runLetterAgent, buildLetterSystemPrompt, loadSystemInstructions } = await import('../server/agent/agent.js');

const explanation = [
  '### What This Letter Means', 'Your renewal form is needed.',
  '### Important Deadline', 'June 20, 2027',
  '### What You Need to Do', '1. Return the form.',
  '### Who to Contact', 'Agency office: 800-555-0142.',
].join('\n\n');

test('removes automatic chatter, retains sections and facts, and ends with one official reminder', () => {
  const result = finalizeLetterExplanation([
    explanation, OFFICIAL_NOTICE_REMINDER,
    'Want me to explain any part in more detail?',
    '(I removed personal information from the notice to keep you safe.)',
    OFFICIAL_NOTICE_REMINDER,
  ].join('\n\n'));
  assert.equal(result, `${explanation}\n\n${OFFICIAL_NOTICE_REMINDER}`);
  assert.equal(result.match(/original notice is the official document/g).length, 1);
});

test('preserves context-specific medical and legal safety warnings instead of truncating after the reminder', () => {
  const warnings = 'Do not stop taking your prescribed medicine without speaking to your doctor.\n\nA lawyer can help you understand the court order; this tool cannot tell you how to respond in court.';
  const result = finalizeLetterExplanation(`${explanation}\n\n${OFFICIAL_NOTICE_REMINDER}\n\n${warnings}`);
  assert.ok(result.includes(warnings));
  assert.ok(result.endsWith(OFFICIAL_NOTICE_REMINDER));
});

test('letter privacy and topic flags remain active without unnecessary disclaimer footers', async () => {
  const result = await runLetterAgent([
    'Your doctor submitted records for prescription coverage review.',
    'You may contact legal aid about an appeal.',
    'Please return your form by June 20, 2027.',
    'My personal number is 312-555-0199. SSN: 123-45-6789.',
  ].join('\n'));
  for (const flag of ['medical', 'legal', 'pii-removed']) assert.ok(result.flags.includes(flag), flag);
  assert.doesNotMatch(result.reply, /312-555-0199|123-45-6789/);
  assert.doesNotMatch(result.reply, /not medical advice|not legal advice|I removed personal information|Want me to explain/i);
  for (const heading of ['What This Letter Means', 'Important Deadline', 'What You Need to Do', 'Who to Contact']) {
    assert.ok(result.reply.includes(`### ${heading}`));
  }
  assert.match(result.reply, /June 20, 2027/);
  assert.ok(result.reply.endsWith(OFFICIAL_NOTICE_REMINDER));
});

test('crisis protection still returns the emergency response unchanged', async () => {
  const result = await runLetterAgent('I want to end my life.');
  assert.equal(result.skill, 'safety-guardrail');
  assert.match(result.reply, /988/);
  assert.match(result.reply, /911/);
  assert.doesNotMatch(result.reply, /original notice is the official document/);
});

test('Gemini instructions preserve necessary warnings while suppressing routine closing chatter', async () => {
  const instructions = await loadSystemInstructions();
  const prompt = buildLetterSystemPrompt({
    instructions,
    skill: { name: 'plain-language-explainer', body: 'Use simple words.' },
    letterText: 'Date: [Date]',
  });
  assert.ok(prompt.includes(instructions));
  assert.match(prompt, /Do not add an automatic follow-up question/);
  assert.match(prompt, /Keep necessary, context-specific safety warnings/);
  assert.match(prompt, /A date-related template field was detected/);
});

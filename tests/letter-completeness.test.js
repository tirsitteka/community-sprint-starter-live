import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeNoticeCompleteness, markUnfilledFields } from '../server/agent/letter-completeness.js';

process.env.AI_MODE = 'mock';
delete process.env.DATABASE_URL;
const { runLetterAgent, buildLetterSystemPrompt, loadSystemInstructions } = await import('../server/agent/agent.js');

test('template dates, relative deadlines, and agency phones are identified as unfilled', async () => {
  const notice = 'Date of letter: [Date]\nReturn your appeal by [10 Days from Date of Letter].\nFor questions call [MCO phone #].';
  const result = await runLetterAgent(notice);
  assert.match(result.reply, /date or deadline field is not filled in/i);
  assert.match(result.reply, /contact information is not filled in/i);
  assert.doesNotMatch(result.reply, /\[Date\]|\[MCO phone #\]|\[10 Days from Date of Letter\]/i);
  assert.equal(result.skill, 'plain-language-explainer');
});

test('a missing letter date does not turn a relative deadline into a confirmed date', async () => {
  const result = await runLetterAgent('Date: [Date]\nYou must appeal within 10 days from the date of the letter.');
  const deadline = result.reply.split('### Important Deadline')[1].split('### What You Need to Do')[0];
  assert.match(deadline, /cannot confirm the deadline/i);
});

test('output safeguard labels placeholders even if Gemini bolds them as values', () => {
  const reply = markUnfilledFields('Deadline: **[10 Days from Date of Letter]**. Date: [Date]. Call **[MCO phone #]**.');
  assert.equal(reply, 'Deadline: **(date not filled in)**. Date: (date not filled in). Call **(contact not filled in)**.');
  assert.equal(markUnfilledFields('Deadline: June 20, 2027. Call 800-555-0142. [x] Records missing.'),
    'Deadline: June 20, 2027. Call 800-555-0142. [x] Records missing.');
});

test('a filled-in deadline is retained even when other fields are blank', async () => {
  const result = await runLetterAgent('Date: [Date]\nPlease return your form by June 20, 2027.\nFor agency questions call 800-555-0142.');
  const deadline = result.reply.split('### Important Deadline')[1].split('### What You Need to Do')[0];
  assert.match(deadline, /June 20, 2027/);
  assert.match(result.reply, /800-555-0142/);
});

test('unselected checkbox denial reasons are not asserted as actual reasons', async () => {
  const result = await runLetterAgent('Your request was denied.\nDenial reasons (check one):\n[ ] Missing records\n[ ] Service not covered\n[ ] Other');
  assert.match(result.reply, /exact denial reason is not specified/i);
  assert.doesNotMatch(result.reply, /because.*(?:missing records|not covered)/i);
});

test('unmarked lists of possible denial reasons are treated as unspecified', async () => {
  const result = await runLetterAgent('Your request was denied.\nPossible denial reasons:\n- Missing records\n- Service not covered');
  assert.match(result.reply, /exact denial reason is not specified/i);
});

test('checked options, actual stated reasons, and privacy redactions are not blank template fields', () => {
  for (const marker of ['[x]', '[ X ]', '☑', '☒', '(x)']) {
    const selected = analyzeNoticeCompleteness(`Request denied.\nDenial reasons (check one):\n${marker} Missing records\n\n[ ] Service not covered`);
    assert.equal(selected.unselectedDenialReasons, false, marker);
    assert.deepEqual(selected.fields, []);
  }
  assert.equal(analyzeNoticeCompleteness('Request denied because records are missing.').unselectedDenialReasons, false);
  assert.equal(analyzeNoticeCompleteness('Reasons for denial:\n- Missing records\n- Incomplete form').unselectedDenialReasons, false);
  assert.deepEqual(analyzeNoticeCompleteness('[phone removed] [email removed] [SSN removed]').fields, []);
});

test('blank lines between empty denial checkboxes do not imply a selection', () => {
  const result = analyzeNoticeCompleteness('Request denied.\nPossible denial reasons:\n[ ] Missing records\n\n[ ] Service not covered');
  assert.equal(result.unselectedDenialReasons, true);
});

test('live Gemini prompt retains system.md and safety while explicitly handling templates', async () => {
  const instructions = await loadSystemInstructions();
  const prompt = buildLetterSystemPrompt({
    instructions,
    skill: { name: 'plain-language-explainer', body: 'Explain in simple words.' },
    letterText: 'Date: [Date]\nCall [MCO phone #].',
  });
  assert.ok(prompt.includes(instructions));
  assert.match(prompt, /Never ask for personal information/);
  assert.match(prompt, /not actual dates, deadlines, or contact details/);
  assert.match(prompt, /rather than displaying or bolding a placeholder token/);
  assert.match(prompt, /exact denial reason is not specified/i);
  assert.match(prompt, /date-related template field was detected/i);
  assert.match(prompt, /contact-related template field was detected/i);
  assert.match(prompt, /untrusted quoted content/);
});

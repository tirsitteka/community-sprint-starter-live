import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../skills/safety-guardrail/tool.js';

test('removes phone, email, and SSN before the AI sees them', () => {
  const out = run({ message: 'Call me at 312-555-0199 or maria@example.com, SSN 123-45-6789' });
  assert.ok(!out.redacted.includes('555-0199'));
  assert.ok(!out.redacted.includes('maria@example.com'));
  assert.ok(!out.redacted.includes('123-45-6789'));
  assert.ok(out.flags.includes('pii-removed'));
});

test('flags crisis, medical, and legal topics', () => {
  assert.ok(run({ message: 'I want to hurt myself' }).flags.includes('crisis'));
  assert.ok(run({ message: 'what dose of medicine for a fever' }).flags.includes('medical'));
  assert.ok(run({ message: 'my landlord wants to evict us' }).flags.includes('legal'));
});

test('leaves normal questions alone', () => {
  const out = run({ message: 'Where can my kids get homework help?' });
  assert.equal(out.redacted, 'Where can my kids get homework help?');
  assert.deepEqual(out.flags, []);
});

test('keeps clearly labeled agency phone numbers but removes personal numbers', () => {
  const out = run({
    message: 'For agency questions, call 800-555-0142. My personal number is 312-555-0199.',
    allowOfficialPhones: true,
  });
  assert.match(out.redacted, /800-555-0142/);
  assert.doesNotMatch(out.redacted, /312-555-0199/);
  assert.ok(out.flags.includes('pii-removed'));
});

test('preserves clearly labeled agency contacts only in letter mode', () => {
  const letter = 'Questions about SNAP? Call the state benefits office at 800-555-0142 or email help@example.gov. My personal number is 312-555-0199 and my personal email is maria@example.com.';
  const out = run({ message: letter, preserveAgencyContacts: true });

  assert.ok(out.redacted.includes('800-555-0142'));
  assert.ok(out.redacted.includes('help@example.gov'));
  assert.ok(!out.redacted.includes('312-555-0199'));
  assert.ok(!out.redacted.includes('maria@example.com'));
  assert.ok(out.flags.includes('pii-removed'));
});

test('the regular guardrail still removes agency phone numbers', () => {
  const out = run({ message: 'Call the state benefits office at 800-555-0142.' });
  assert.ok(!out.redacted.includes('800-555-0142'));
});

test('letter mode never preserves SSNs', () => {
  const out = run({
    message: 'Contact the Medicaid office at 800-555-0142. SSN 123-45-6789',
    preserveAgencyContacts: true,
  });
  assert.ok(out.redacted.includes('800-555-0142'));
  assert.ok(!out.redacted.includes('123-45-6789'));
});

test('contact classification uses correct offsets after earlier personal-data redactions', () => {
  const out = run({
    message: 'Personal email: someone@example.com.\nSSN 123-45-6789.\nCall the benefits office at 800-555-0142.\nCall me at 312-555-0199.',
    preserveAgencyContacts: true,
  });
  assert.match(out.redacted, /800-555-0142/);
  assert.doesNotMatch(out.redacted, /someone@example.com|123-45-6789|312-555-0199/);
});

// The guardrail is plain code, not AI: predictable and testable.

const PII_RULES = [
  { label: 'email', pattern: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g },
  { label: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { label: 'card number', pattern: /\b(?:\d[ -]?){13,16}\b/g },
  { label: 'phone', pattern: /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g },
];

const TOPIC_RULES = [
  { flag: 'crisis', pattern: /\b(suicid\w*|kill (myself|me)|end my life|hurt (myself|me)|self[- ]?harm|overdos\w*|in danger|being abused)\b/i },
  { flag: 'medical', pattern: /\b(medicine|medication|dose|dosage|symptom\w*|diagnos\w*|prescription|pregnan\w*|doctor|sick)\b/i },
  { flag: 'legal', pattern: /\b(evict\w*|lawyer|lawsuit|court|custody|immigration|legal|sue|arrest\w*)\b/i },
];

export function run({ message, allowOfficialPhones = false, preserveAgencyContacts = false }) {
  let redacted = message;
  const removed = [];
  for (const rule of PII_RULES) {
    if (allowOfficialPhones && !preserveAgencyContacts && rule.label === 'phone') {
      redacted = redactNonOfficialPhones(redacted, rule.pattern, removed);
      continue;
    }
    // Earlier replacements can change text offsets. Classify each match
    // against the same text being searched, not the original unredacted text.
    const currentMessage = redacted;
    redacted = redacted.replace(rule.pattern, (match, offset) => {
      if (preserveAgencyContacts && ['phone', 'email'].includes(rule.label) && isLabeledAgencyContact(currentMessage, offset, match.length)) {
        return match;
      }
      removed.push(rule.label);
      return `[${rule.label} removed]`;
    });
  }
  const flags = TOPIC_RULES.filter((rule) => rule.pattern.test(message)).map((rule) => rule.flag);
  if (removed.length) flags.push('pii-removed');
  return { redacted, flags, removed };
}

function redactNonOfficialPhones(message, pattern, removed) {
  return message.split(/(\r?\n)/).map((part) => {
    if (/^\r?\n$/.test(part)) return part;
    // Classify each number from the text immediately before it, so a personal
    // number later on a line cannot inherit an earlier agency-contact label.
    return part.replace(pattern, (number, offset) => {
      const preceding = part.slice(Math.max(0, offset - 100), offset);
      const hasAgencyLabel = /\b(?:agency|office|customer service|benefits? (?:line|office)|toll[- ]free|questions?|phone)\b/i.test(preceding)
        || /\b(?:questions|call|contact)\b.{0,35}\b(?:us|our|agency|office|phone|number|customer service|benefits? line)\b/i.test(preceding);
      const looksPersonal = /\b(?:my|personal|home|cell|mobile|call me|reach me)\b/i.test(preceding);
      if (hasAgencyLabel && !looksPersonal) return number;
      removed.push('phone');
      return '[phone removed]';
    });
  }).join('');
}

function isLabeledAgencyContact(message, start, length) {
  const before = message.slice(0, start);
  const after = message.slice(start + length);
  const previousBoundary = Math.max(before.lastIndexOf('.'), before.lastIndexOf('!'), before.lastIndexOf('?'), before.lastIndexOf(';'), before.lastIndexOf('\n'));
  const nextBoundary = [after.indexOf('.'), after.indexOf('!'), after.indexOf('?'), after.indexOf(';'), after.indexOf('\n')]
    .filter((index) => index >= 0)
    .reduce((nearest, index) => Math.min(nearest, index), after.length);
  const context = `${before.slice(previousBoundary + 1).slice(-100)} ${after.slice(0, Math.min(nextBoundary, 60))}`;
  if (/\b(?:my|your|their|recipient'?s|personal|home|cell(?:ular)?|mobile)\s+(?:phone|telephone|number|email|e-?mail)\b/i.test(context)) {
    return false;
  }
  if (/\b(?:my|personal|home|cell|mobile|call me|reach me)\b/i.test(context)) return false;
  const namesAgency = /\b(?:medicaid|snap|benefits?|agency|department|office|state|customer service|caseworker)\b/i.test(context);
  const labelsContact = /\b(?:call|contact|phone|telephone|email|e-mail|reach|write|toll[- ]free|tty|customer service)\b/i.test(context);
  return namesAgency && labelsContact;
}

export const CRISIS_REPLY =
  "I'm really glad you reached out, and I want you to get help from a person right now. " +
  'If you are in immediate danger, call 911. ' +
  'You can call or text 988 (the Suicide & Crisis Lifeline) any time, day or night. ' +
  "I'm an AI and can't help with this safely, but they can.";

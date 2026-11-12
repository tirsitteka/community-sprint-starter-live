// Only fixed guidance is added to the system prompt. Notice text remains in
// the guarded human message, never promoted into system instructions.
const BRACKETED_FIELD = /\[([^\]\n]{1,100})\]/g;

function fieldKind(field) {
  if (/removed\]?$|^\s*(?:x|✓|✔|\d+|sic)\s*$/i.test(field)) return null;
  if (/\b(date|days?|deadline)\b/i.test(field)) return 'date';
  if (/\b(phone|telephone|fax|email|website|contact)\b|#/i.test(field)) return 'contact';
  if (/\b(name|mco|address|amount|reason|service|member|provider|insert|enter|fill)\b/i.test(field)) return 'information';
  return null;
}

function hasUnselectedDenialReasons(text) {
  if (!/\b(denial|denied|not approved|cannot approve)\b/i.test(text)) return false;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!/\breasons?\b/i.test(lines[i])) continue;
    const options = [];
    for (const line of lines.slice(i + 1)) {
      if (!line.trim()) {
        continue;
      }
      if (!/^\s*(?:[-*•]|\d+[.)]|[a-z][.)]|\[[ x✓✔]*\]|\(\s*[ x✓✔]?\s*\)|[☐☑☒])/i.test(line)) break;
      options.push(line);
    }
    if (options.length < 2) continue;
    const hasSelection = options.some((line) => /\[\s*[x✓✔]\s*\]|[☑☒]|^\s*(?:[-*•]\s*)?\(\s*[x✓✔]\s*\)/i.test(line));
    const hasEmptyBoxes = options.some((line) => /\[\s*\]|☐|\(\s*\)/.test(line));
    const isAlternatives = /\b(possible|one of|one or more|select|check)\b/i.test(lines[i]);
    if (!hasSelection && (hasEmptyBoxes || isAlternatives)) return true;
  }
  return false;
}

export function analyzeNoticeCompleteness(text) {
  const fields = [...text.matchAll(BRACKETED_FIELD)]
    .map((match) => ({ token: match[0], kind: fieldKind(match[1]) }))
    .filter((field) => field.kind);
  return {
    fields,
    missingDate: fields.some((field) => field.kind === 'date'),
    missingContact: fields.some((field) => field.kind === 'contact'),
    unselectedDenialReasons: hasUnselectedDenialReasons(text),
  };
}

export function markUnfilledFields(text) {
  return text.replace(BRACKETED_FIELD, (token, field) => {
    const kind = fieldKind(field);
    return kind ? `(${kind} not filled in)` : token;
  });
}

export function noticeCompletenessGuidance(text) {
  const assessment = analyzeNoticeCompleteness(text);
  return [
    '# Incomplete or template notices',
    'Treat unfilled template fields such as [Date], [MCO phone #], and [10 Days from Date of Letter] as missing information, not actual dates, deadlines, or contact details.',
    'Clearly state which information is missing or not filled in. Never present a placeholder deadline as a confirmed date or calculate a calendar deadline from a missing letter date.',
    'In the deadline and contact sections, say the date or contact detail is not filled in rather than displaying or bolding a placeholder token as the deadline or phone number.',
    'Preserve real dates and contact details that are explicitly filled in elsewhere. Distinguish empty checkboxes from checked or explicitly selected options.',
    'If several possible denial reasons are listed but none is marked or otherwise explicitly selected, say: "The exact denial reason is not specified." Do not claim any possible reason applies to this person.',
    'Do not infer a selected reason from list order or from the mere presence of a reason. If a reason is explicitly selected, explain only what the notice actually selects.',
    assessment.missingDate ? 'A date-related template field was detected. Explicitly identify it as not filled in; it cannot confirm a deadline.' : '',
    assessment.missingContact ? 'A contact-related template field was detected. Explicitly identify the contact detail as not filled in.' : '',
    assessment.unselectedDenialReasons ? 'An unselected list of possible denial reasons was detected. Clearly state that the exact denial reason is not specified.' : '',
  ].filter(Boolean).join('\n');
}

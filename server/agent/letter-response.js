export const OFFICIAL_NOTICE_REMINDER =
  'This explanation is for understanding your letter. The original notice is the official document. If you are unsure, contact the agency listed in your letter.';

// Remove only known automatic chatter, not arbitrary trailing content: a model
// may include a necessary, context-specific safety warning after its reminder.
export function finalizeLetterExplanation(reply) {
  const body = reply
    .replace(/^[ \t]*(?:Want me to explain any part in more detail\?)[ \t]*$/gim, '')
    .replace(/^[ \t]*\(?I removed personal information from (?:the notice|your message) to keep you safe\.\)?[ \t]*$/gim, '')
    .split(OFFICIAL_NOTICE_REMINDER).join('')
    .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n')
    .trim();
  return `${body}\n\n${OFFICIAL_NOTICE_REMINDER}`;
}

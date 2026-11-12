import { useState } from 'react';
import { api } from '../api.js';

const MAX_LETTER_LENGTH = 15000;

export default function LetterExplanation() {
  const [draft, setDraft] = useState('');
  const [submittedLetter, setSubmittedLetter] = useState('');
  const [explanation, setExplanation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function explain(event) {
    event.preventDefault();
    const letter = draft.trim();
    if (!letter || busy) return;

    setError('');
    setExplanation('');
    setSubmittedLetter(letter);
    setBusy(true);
    try {
      const result = await api.explainLetter(letter);
      setExplanation(result.reply);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="card letter-form-card" aria-labelledby="paste-title">
        <div className="letter-form-heading">
          <div>
            <p className="letter-step">Your notice</p>
            <label className="letter-input-label" id="paste-title" htmlFor="letter-input">
              Paste Your Letter
            </label>
          </div>
          <span className="letter-count" aria-live="polite">
            {draft.length.toLocaleString()} / {MAX_LETTER_LENGTH.toLocaleString()}
          </span>
        </div>
        <p className="letter-help" id="letter-help">
          Paste the text from a Medicaid or SNAP notice. You can remove anything you do not want to share first.
        </p>
        <form onSubmit={explain}>
          <label className="sr-only" htmlFor="letter-input">Paste Your Letter</label>
          <textarea
            id="letter-input"
            aria-describedby="letter-help letter-privacy"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_LETTER_LENGTH}
            placeholder="Paste the words from your letter here…"
            required
          />
          <div className="letter-form-footer">
            <p id="letter-privacy" className="letter-privacy">
              Letter text is not saved in this app. Personal phone numbers and email addresses are removed before analysis; clearly labeled agency contacts are kept.
            </p>
            <button type="submit" className="explain-button" disabled={busy || !draft.trim()}>
              {busy ? 'Explaining your letter…' : 'Explain My Letter'}
            </button>
          </div>
        </form>
        {error && <p className="error letter-error" role="alert">{error}</p>}
      </section>

      <div className="letter-results">
        <section className="card letter-panel" aria-labelledby="original-title">
          <div className="letter-panel-heading">
            <span className="letter-panel-icon" aria-hidden="true">01</span>
            <h2 id="original-title">Your Original Letter</h2>
          </div>
          <pre className="letter-text">
            {submittedLetter || 'Your letter will appear here after you ask for an explanation.'}
          </pre>
        </section>

        <section className="card letter-panel explanation-panel" aria-labelledby="explanation-title" aria-live="polite">
          <div className="letter-panel-heading">
            <span className="letter-panel-icon" aria-hidden="true">02</span>
            <h2 id="explanation-title">AI Explanation</h2>
          </div>
          {busy ? (
            <p className="letter-placeholder" role="status">Reading your letter and preparing a plain-English explanation…</p>
          ) : explanation ? (
            <ExplanationSections text={explanation} />
          ) : (
            <p className="letter-placeholder">The summary, deadline, next steps, and agency contact details will appear here.</p>
          )}
        </section>
      </div>
    </>
  );
}

function ExplanationSections({ text }) {
  const sections = [];
  let current = { title: '', body: [] };

  for (const line of text.split(/\r?\n/)) {
    const heading = /^#{1,3}\s+(.+)$/.exec(line);
    if (heading) {
      if (current.title || current.body.length) sections.push(current);
      current = { title: heading[1], body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.title || current.body.length) sections.push(current);

  return (
    <div className="explanation-sections">
      {sections.map((section, index) => (
        <section className="explanation-section" key={`${section.title}-${index}`}>
          {section.title && <h3>{section.title}</h3>}
          <p><RichText text={section.body.join('\n').trim()} /></p>
        </section>
      ))}
    </div>
  );
}

function RichText({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part,
  );
}

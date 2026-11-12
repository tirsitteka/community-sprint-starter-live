import { useState } from 'react';
import { api } from '../api.js';
import { MAX_LETTER_LENGTH } from '../../shared/letter.config.js';
import { LockMark, SparkMark } from './NoticeIcons.jsx';
import LetterResults from './LetterResults.jsx';

// Combines the reusable GitHub form with the existing Replit presentation.
export default function LetterExplanation() {
  const [draft, setDraft] = useState('');
  const [submittedLetter, setSubmittedLetter] = useState('');
  const [explanation, setExplanation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function explain(event) {
    event.preventDefault();
    const letter = draft.trim();
    if (!letter || busy) return;
    setError('');
    setExplanation(null);
    setSubmittedLetter(letter);
    setBusy(true);
    try {
      const result = await api.explainLetter(letter);
      setExplanation(result.reply);
    } catch (err) {
      setError(err.message || 'We could not explain this notice just now. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function updateDraft(event) {
    setDraft(event.target.value);
    setExplanation(null);
    setSubmittedLetter('');
    setError('');
  }

  function clearLetter() {
    setDraft('');
    setExplanation(null);
    setSubmittedLetter('');
    setError('');
  }

  return (
    <>
      <section className="notice-card" aria-labelledby="paste-heading">
        <div className="card-heading">
          <h2 id="paste-heading">Paste the notice you received</h2>
          <p>We’ll explain what it says and help you see what may need attention.</p>
        </div>
        <form className="input-body" onSubmit={explain}>
          <div className="letter-form-heading">
            <label className="field-label" htmlFor="notice-text">Paste Your Letter</label>
            <span className="letter-count">{draft.length.toLocaleString()} / {MAX_LETTER_LENGTH.toLocaleString()}</span>
          </div>
          <p className="field-hint" id="letter-hint">Include the whole notice if you can, especially any dates or instructions. You can remove anything you do not want to share first.</p>
          <textarea
            className="letter-input"
            id="notice-text"
            name="letter"
            value={draft}
            onChange={updateDraft}
            placeholder="Paste the text of your Medicaid or SNAP notice here…"
            aria-describedby="letter-hint privacy-note"
            maxLength={MAX_LETTER_LENGTH}
            required
            disabled={busy}
          />
          <div className="input-footer">
            <p className="privacy-note" id="privacy-note">
              <LockMark />
              <span>Your letter is used only to prepare this explanation. It is not saved in this app or your browser. Personal phone numbers and email addresses are removed before analysis; clearly labeled agency contacts are kept.</span>
            </p>
            <div className="button-row">
              {draft && !busy && <button className="secondary-button" type="button" onClick={clearLetter}>Clear</button>}
              <button className="primary-button" type="submit" disabled={!draft.trim() || busy}>
                {busy ? <><span className="button-loading-mark" aria-hidden="true" />Explaining your letter…</>
                  : <><SparkMark />Explain My Letter</>}
              </button>
            </div>
          </div>
          {busy && (
            <div className="loading-message" role="status">
              <span className="loading-bar" aria-hidden="true" />
              <span>Reading your notice carefully. This may take a moment.</span>
            </div>
          )}
          {error && (
            <div className="error-box" role="alert">
              <strong>We couldn’t explain this notice.</strong>
              <p>{error}</p>
            </div>
          )}
        </form>
      </section>
      <LetterResults explanation={explanation} letterText={submittedLetter} busy={busy} error={error} />
    </>
  );
}

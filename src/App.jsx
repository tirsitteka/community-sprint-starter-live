import { useState } from 'react';
import { api } from './api.js';
import { project } from '../shared/project.config.js';

function DocumentMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3.75h6.2L18 8.6v11.65H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M13 4v5h4.8M8.5 13h6M8.5 16.5h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SparkMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m12 2 1.65 6.35L20 10l-6.35 1.65L12 18l-1.65-6.35L4 10l6.35-1.65L12 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" fill="currentColor" />
    </svg>
  );
}

function cleanLabel(label) {
  return String(label)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function ExplanationValue({ value }) {
  if (value === null || value === undefined || value === '') {
    return <p className="empty-result">No explanation was returned.</p>;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    if (typeof value !== 'string') return <p className="structured-value">{String(value)}</p>;
    return <PlainTextExplanation text={value} />;
  }
  if (Array.isArray(value)) {
    if (!value.length) return <p className="empty-result">No details were returned.</p>;
    return (
      <ul>
        {value.map((item, index) => (
          <li key={index}>
            {item !== null && typeof item === 'object'
              ? <ExplanationValue value={item} />
              : String(item ?? '')}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return <p className="empty-result">No details were returned.</p>;
    return (
      <div>
        {entries.map(([key, detail]) => (
          <section className="structured-group" key={key}>
            <span className="structured-label">{cleanLabel(key)}</span>
            <ExplanationValue value={detail} />
          </section>
        ))}
      </div>
    );
  }
  return <p className="structured-value">{String(value)}</p>;
}

function PlainTextExplanation({ text }) {
  const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    const lines = block.split(/\r?\n/);
    const heading = lines[0].match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      return (
        <div className="explanation-block" key={index}>
          <h4>{heading[1]}</h4>
          {lines.slice(1).filter(Boolean).map((line, lineIndex) => (
            <p className="structured-value" key={lineIndex}><InlineEmphasis text={line} /></p>
          ))}
        </div>
      );
    }
    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      return (
        <ul key={index}>
          {lines.map((line) => <li key={line}><InlineEmphasis text={line.replace(/^[-*]\s+/, '')} /></li>)}
        </ul>
      );
    }
    if (lines.every((line) => /^\d+[.)]\s+/.test(line))) {
      return (
        <ol key={index}>
          {lines.map((line) => <li key={line}><InlineEmphasis text={line.replace(/^\d+[.)]\s+/, '')} /></li>)}
        </ol>
      );
    }
    return <p className="structured-value" key={index}><InlineEmphasis text={lines.join(' ')} /></p>;
  });
}

function InlineEmphasis({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part,
  );
}

function ExplanationPanel({ explanation, letterText }) {
  return (
    <section className="result-section" aria-labelledby="results-heading" aria-live="polite">
      <div className="result-heading">
        <div>
          <h2 id="results-heading">Your letter, made clearer</h2>
          <p>Compare the notice with its plain-language explanation.</p>
        </div>
      </div>
      <div className="comparison">
        <article className="result-card original" aria-labelledby="original-heading">
          <div className="result-card-header">
            <DocumentMark />
            <h3 id="original-heading">Your original notice</h3>
          </div>
          <div className="result-content">
            <p className="original-copy">{letterText}</p>
          </div>
        </article>
        <article className="result-card" aria-labelledby="explanation-heading">
          <div className="result-card-header">
            <SparkMark />
            <h3 id="explanation-heading">Plain-language explanation</h3>
          </div>
          <div className="result-content explanation-copy">
            <ExplanationValue value={explanation} />
          </div>
        </article>
      </div>
    </section>
  );
}

export default function App() {
  const [letterText, setLetterText] = useState('');
  const [submittedLetter, setSubmittedLetter] = useState('');
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedLetter = letterText.trim();
    if (!trimmedLetter || loading) return;

    setError('');
    setExplanation(null);
    setSubmittedLetter('');
    setLoading(true);
    try {
      if (typeof api.explainLetter !== 'function') {
        throw new Error('Letter explanation is not available right now. Please try again in a little while.');
      }
      const result = await api.explainLetter(trimmedLetter);
      setExplanation(result.reply);
      setSubmittedLetter(trimmedLetter);
    } catch (requestError) {
      setError(requestError?.message || 'We could not explain this notice just now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleLetterChange(event) {
    setLetterText(event.target.value);
    if (explanation !== null || error) {
      setExplanation(null);
      setSubmittedLetter('');
      setError('');
    }
  }

  function clearLetter() {
    setLetterText('');
    setExplanation(null);
    setSubmittedLetter('');
    setError('');
  }

  const hasExplanation = submittedLetter.length > 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-row">
          <span className="brand-mark"><DocumentMark /></span>
          <div className="brand-copy">
            <p className="brand-name">{project.appName}</p>
            <p className="brand-tagline">{project.tagline}</p>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Medicaid &amp; SNAP notices</p>
          <h1 id="page-title">A clearer way to understand your letter.</h1>
          <p className="intro-text">{project.problemStatement}</p>
        </section>

        <section className="notice-card" aria-labelledby="paste-heading">
          <div className="card-heading">
            <h2 id="paste-heading">Paste the notice you received</h2>
            <p>We’ll explain what it says and help you see what may need attention.</p>
          </div>
          <form className="input-body" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="notice-text">Your letter</label>
            <p className="field-hint" id="letter-hint">Include the whole notice if you can, especially any dates or instructions.</p>
            <textarea
              className="letter-input"
              id="notice-text"
              name="letter"
              value={letterText}
              onChange={handleLetterChange}
              placeholder="Paste the text of your Medicaid or SNAP notice here…"
              aria-describedby="letter-hint privacy-note"
              maxLength={12000}
              disabled={loading}
            />
            <div className="input-footer">
              <p className="privacy-note" id="privacy-note">
                <LockMark />
                <span>Your letter is used only to prepare this explanation. It is not saved in your browser.</span>
              </p>
              <div className="button-row">
                {letterText && !loading && (
                  <button className="secondary-button" type="button" onClick={clearLetter}>Clear</button>
                )}
                <button className="primary-button" type="submit" disabled={!letterText.trim() || loading}>
                  {loading ? (
                    <>
                      <span className="button-loading-mark" aria-hidden="true" />
                      Explaining your letter…
                    </>
                  ) : (
                    <>
                      <SparkMark />
                      Explain My Letter
                    </>
                  )}
                </button>
              </div>
            </div>

            {loading && (
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

        {hasExplanation && (
          <ExplanationPanel explanation={explanation} letterText={submittedLetter} />
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          This tool can help make a notice easier to understand, but it may make mistakes. Contact your benefits office or a trusted advisor if you are unsure what to do.
        </div>
      </footer>
    </div>
  );
}

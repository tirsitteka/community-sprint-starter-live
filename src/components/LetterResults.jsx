import { DocumentMark, SparkMark } from './NoticeIcons.jsx';

function InlineEmphasis({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
  );
}

function TextBlocks({ text }) {
  return text.split(/\n\s*\n/).map((block, index) => {
    const lines = block.trim().split(/\r?\n/).filter(Boolean);
    if (!lines.length) return null;
    if (lines.every(line => /^[-*]\s+/.test(line))) {
      return <ul key={index}>{lines.map((line, i) => <li key={i}><InlineEmphasis text={line.replace(/^[-*]\s+/, '')} /></li>)}</ul>;
    }
    if (lines.every(line => /^\d+[.)]\s+/.test(line))) {
      return <ol key={index}>{lines.map((line, i) => <li key={i}><InlineEmphasis text={line.replace(/^\d+[.)]\s+/, '')} /></li>)}</ol>;
    }
    return <p className="structured-value" key={index}><InlineEmphasis text={lines.join('\n')} /></p>;
  });
}

// GitHub's heading parser also handles model headings without blank lines.
function ExplanationSections({ text }) {
  const sections = [];
  let current = { title: '', body: [] };
  for (const line of text.split(/\r?\n/)) {
    const heading = /^#{1,3}\s+(.+)$/.exec(line);
    if (heading) {
      if (current.title || current.body.length) sections.push(current);
      current = { title: heading[1], body: [] };
    } else current.body.push(line);
  }
  if (current.title || current.body.length) sections.push(current);
  return sections.map((section, index) => (
    <div className="explanation-block" key={index}>
      {section.title && <h4>{section.title}</h4>}
      <TextBlocks text={section.body.join('\n')} />
    </div>
  ));
}

function ExplanationValue({ value }) {
  if (value === null || value === undefined || value === '') return <p className="empty-result">No explanation was returned.</p>;
  if (typeof value === 'string') return <ExplanationSections text={value} />;
  if (Array.isArray(value)) return <ul>{value.map((item, i) => <li key={i}><ExplanationValue value={item} /></li>)}</ul>;
  if (typeof value === 'object') return Object.entries(value).map(([key, detail]) => (
    <section className="structured-group" key={key}>
      <span className="structured-label">{key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ')}</span>
      <ExplanationValue value={detail} />
    </section>
  ));
  return <p className="structured-value">{String(value)}</p>;
}

export default function LetterResults({ explanation, letterText, busy, error }) {
  return (
    <section className="result-section" aria-labelledby="results-heading">
      <div className="result-heading">
        <div>
          <h2 id="results-heading">Your letter, made clearer</h2>
          <p>Compare the notice with its plain-language explanation.</p>
        </div>
      </div>
      <div className="comparison">
        <article className="result-card original" aria-labelledby="original-heading">
          <div className="result-card-header"><DocumentMark /><h3 id="original-heading">Your original notice</h3></div>
          <div className="result-content">
            <p className="original-copy">{letterText || 'Your letter will appear here after you ask for an explanation.'}</p>
          </div>
        </article>
        <article className="result-card" aria-labelledby="explanation-heading">
          <div className="result-card-header"><SparkMark /><h3 id="explanation-heading">Plain-language explanation</h3></div>
          <div className="result-content explanation-copy" aria-live="polite">
            {busy ? <p role="status">Reading your letter and preparing a plain-English explanation…</p>
              : explanation !== null ? <ExplanationValue value={explanation} />
                : <p className="empty-result">{error ? 'An explanation could not be prepared. Your original notice remains visible for comparison.' : 'The summary, deadline, next steps, and agency contact details will appear here.'}</p>}
          </div>
        </article>
      </div>
    </section>
  );
}

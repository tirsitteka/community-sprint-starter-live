import { useEffect, useState } from 'react';
import { api } from './api.js';
import { project } from '../shared/project.config.js';
import ProjectHeader from './components/ProjectHeader.jsx';
import LetterExplanation from './components/LetterExplanation.jsx';

export default function App() {
  const [health, setHealth] = useState(null);
  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ ok: false }));
  }, []);

  return (
    <div className="app-shell">
      <ProjectHeader health={health} />
      <main className="main-content">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Medicaid &amp; SNAP notices</p>
          <h1 id="page-title">A clearer way to understand your letter.</h1>
          <p className="intro-text">{project.problemStatement}</p>
        </section>
        <LetterExplanation />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          This tool can help make a notice easier to understand, but it may make mistakes.
          The original notice is official. Contact the agency on your letter or a trusted advisor if you are unsure what to do.
        </div>
      </footer>
    </div>
  );
}

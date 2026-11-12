import { useEffect, useState } from 'react';
import { api } from './api.js';
import ProjectHeader from './components/ProjectHeader.jsx';
import LetterExplanation from './components/LetterExplanation.jsx';

export default function App() {
  const [health, setHealth] = useState(null);
  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ ok: false }));
  }, []);

  return (
    <>
      <ProjectHeader health={health} />
      <main className="letter-layout">
        <LetterExplanation />
      </main>
      <footer className="footer">
        This explanation can make mistakes. The original notice is official. Contact the agency on your letter if you are unsure.
      </footer>
    </>
  );
}

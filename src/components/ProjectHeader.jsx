import { project } from '../../shared/project.config.js';

export default function ProjectHeader({ health }) {
  return (
    <header className="hero">
      <div className="hero-inner">
        <p className="eyebrow">
          {project.teamName}
        </p>
        <h1>{project.appName}</h1>
        <p className="tagline">{project.tagline}</p>
        <div className="problem">
          <p>{project.problemStatement}</p>
        </div>
        <div className="pills" aria-label="AI service status">
          <StatusPill label="AI" ok={health?.ai === 'live'} good="Gemini live" bad="Mock mode" loading={!health} />
        </div>
      </div>
    </header>
  );
}

function StatusPill({ label, ok, good, bad, loading }) {
  const state = loading ? 'loading' : ok ? 'ok' : 'warn';
  return (
    <span className={`pill ${state}`}>
      <span className="dot" aria-hidden="true" /> {label}: {loading ? 'checking...' : ok ? good : bad}
    </span>
  );
}

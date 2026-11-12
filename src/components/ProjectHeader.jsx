import { project } from '../../shared/project.config.js';
import { DocumentMark } from './NoticeIcons.jsx';

export default function ProjectHeader({ health }) {
  const status = !health ? 'Checking AI…' : health.ok === false ? 'AI status unavailable'
    : health.ai === 'live' ? 'AI: Gemini live' : 'AI: Mock mode';
  return (
    <header className="topbar">
      <div className="brand-row">
        <span className="brand-mark"><DocumentMark /></span>
        <div className="brand-copy">
          <p className="brand-name">{project.appName}</p>
          <p className="brand-tagline">{project.tagline}</p>
        </div>
        <span className="service-status" role="status">{status}</span>
      </div>
    </header>
  );
}

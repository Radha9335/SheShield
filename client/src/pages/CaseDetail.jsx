import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import ScoreGauge, { verdictClass } from '../components/ScoreGauge.jsx';
import SignalList from '../components/SignalList.jsx';
import MediaForm from '../components/MediaForm.jsx';
import TextForm from '../components/TextForm.jsx';
import ProfileForm from '../components/ProfileForm.jsx';

const TABS = [
  { id: 'image', label: '📸 Photos Forensics' },
  { id: 'video', label: '🎬 Deepfake Video' },
  { id: 'text', label: '💬 Messages & Scam Scan' },
  { id: 'profile', label: '👤 Identity & Bot Check' },
];

const LABEL = {
  image: '📸 Photo Forensic Inspection',
  video: '🎬 Video Temporal Frame Scan',
  text: '💬 Message Linguistic Threat Scan',
  profile: '👤 Profile & Identity Plausibility',
};

export default function CaseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [tab, setTab] = useState('image');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCase(id).then((d) => setC(d.case)).catch((e) => setError(e.message));
  }, [id]);

  async function remove() {
    if (!window.confirm('Delete this investigation record and all its forensic logs?')) return;
    try {
      await api.deleteCase(id);
      nav('/');
    } catch (e) {
      setError(e.message);
    }
  }

  function printReport() {
    window.print();
  }

  if (error) {
    return (
      <div className="card stack">
        <div className="error-banner"><span>⚠️</span> <span>{error}</span></div>
        <div>
          <button className="btn btn-secondary" onClick={() => nav('/')}>← Back to all investigations</button>
        </div>
      </div>
    );
  }
  if (!c) {
    return (
      <div className="card scanning-hud">
        <div className="radar-spinner" />
        <p className="muted mono">Decrypting and loading investigation telemetry…</p>
      </div>
    );
  }

  const modules = c.modules || [];
  const vClass = verdictClass(c.verdict);

  return (
    <div className="stack">
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/" className="btn btn-quiet" style={{ paddingLeft: 0, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>←</span> <span>Command Center</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button type="button" className="btn btn-secondary" onClick={printReport} title="Print or save PDF forensic report">
            <span>📄</span> <span>Export Audit Report</span>
          </button>
          <button type="button" className="btn btn-danger" onClick={remove} title="Delete record">
            <span>🗑️</span>
          </button>
        </div>
      </div>

      {/* Case Header & Gauge HUD */}
      <section className="card card-gradient-top summary-hud">
        <ScoreGauge score={c.trustScore} verdict={c.verdict} />

        <div className="stack" style={{ gap: '0.9rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span className="mono" style={{ fontSize: '0.75rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                INVESTIGATION CASE FILE
              </span>
            </div>
            <h1>{c.title}</h1>
            {c.subject && (
              <p className="muted mono" style={{ marginTop: '0.2rem' }}>
                Target Handle / Subject: <strong style={{ color: '#e2e8f0' }}>{c.subject}</strong>
              </p>
            )}
          </div>

          {/* Explanation bullet list */}
          {(!c.explanation || c.explanation.length === 0) ? (
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <p className="muted">
                🛡️ No checks run yet. Select a forensic module below (Photos, Video, Messages, or Profile) to calculate a comprehensive digital authenticity score.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div className="mono" style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                EXECUTIVE RISK FINDINGS
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#cbd5e1', fontSize: '0.92rem' }}>
                {c.explanation.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </div>
          )}

          {/* Actionable Safety Protocol recommendation */}
          {c.trustScore !== null && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: vClass === 'bad' ? 'var(--bad-bg)' : vClass === 'warn' ? 'var(--warn-bg)' : 'var(--good-bg)',
                border: `1px solid ${vClass === 'bad' ? 'rgba(244,63,94,0.3)' : vClass === 'warn' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
              }}
            >
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{vClass === 'bad' ? '🚨' : vClass === 'warn' ? '⚠️' : '🛡️'}</span>
              <div style={{ fontSize: '0.85rem' }}>
                <strong style={{ display: 'block', color: '#fff', marginBottom: '0.15rem' }}>
                  {vClass === 'bad' ? 'High Risk Threat Protocol' : vClass === 'warn' ? 'Cautionary Advisory' : 'Standard Security Status'}
                </strong>
                <span className="muted" style={{ color: '#e2e8f0' }}>
                  {vClass === 'bad'
                    ? 'Do NOT transfer money, crypto, or gift cards under any circumstance. Cease sharing personal photos. Consider reporting the user to cyber defense portals.'
                    : vClass === 'warn'
                    ? 'Perform a reverse image search on PimEyes / Google Images. Ask for a live video call with specific hand gestures to confirm authenticity.'
                    : 'Signals appear consistent with organic human activity. Always remain vigilant if financial or sensitive requests emerge.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Investigation Studio Tabs */}
      <section className="card stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Forensic Analysis Modules</h2>
          <span className="mono" style={{ fontSize: '0.75rem', color: '#34d399' }}>● ENGINE READY</span>
        </div>

        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'tab on' : 'tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {(tab === 'image' || tab === 'video') && <MediaForm key={tab} caseId={id} kind={tab} onDone={setC} />}
        {tab === 'text' && <TextForm caseId={id} onDone={setC} />}
        {tab === 'profile' && <ProfileForm caseId={id} onDone={setC} />}
      </section>

      {/* Historical Runs & Results */}
      {modules.length > 0 && (
        <section className="stack">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Forensic Audit Log ({modules.length} Run{modules.length > 1 ? 's' : ''})</h2>
            <span className="mono muted" style={{ fontSize: '0.8rem' }}>CHRONOLOGICAL TELEMETRY</span>
          </div>

          {[...modules].reverse().map((m, i) => (
            <article key={m._id || i} className="card stack" style={{ borderLeft: '3px solid #6366f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem' }}>{LABEL[m.type] || m.type}</h3>
                  {m.inputNote && (
                    <span className="mono muted" style={{ fontSize: '0.78rem', background: 'var(--bg-surface-elevated)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      {m.inputNote}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: m.score >= 75 ? '#34d399' : m.score >= 45 ? '#fbbf24' : '#fb7185' }}>
                    Score {m.score}/100
                  </span>
                  <span className="mono muted" style={{ fontSize: '0.78rem' }}>
                    · Confidence {Math.round((m.confidence ?? 0) * 100)}%
                  </span>
                </div>
              </div>

              {/* Summary quote */}
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px', borderLeft: '3px solid #06b6d4' }}>
                <p style={{ fontSize: '0.92rem', color: '#e2e8f0' }}>{m.summary}</p>
              </div>

              {/* Telemetry metrics bar if media */}
              {m.metrics && (
                <div>
                  <div className="mono" style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    OPENCV OPTICAL & SENSOR TELEMETRY
                  </div>
                  <div className="telemetry-row">
                    <div className="telemetry-pill">
                      <div className="telemetry-name">Optical Sharpness</div>
                      <div className="telemetry-val">{m.metrics.sharpness ?? '0'}</div>
                      <div className="muted mono" style={{ fontSize: '0.68rem', marginTop: '0.15rem' }}>Laplacian Var</div>
                    </div>
                    <div className="telemetry-pill">
                      <div className="telemetry-name">Texture Grain</div>
                      <div className="telemetry-val">{m.metrics.noiseLevel ?? '0'}</div>
                      <div className="muted mono" style={{ fontSize: '0.68rem', marginTop: '0.15rem' }}>High-Freq Resid</div>
                    </div>
                    <div className="telemetry-pill">
                      <div className="telemetry-name">Edge Density</div>
                      <div className="telemetry-val">{m.metrics.edgeDensity ?? '0'}</div>
                      <div className="muted mono" style={{ fontSize: '0.68rem', marginTop: '0.15rem' }}>Canny Pixel Ratio</div>
                    </div>
                    {m.metrics.frameNoiseVariation != null && (
                      <div className="telemetry-pill">
                        <div className="telemetry-name">Frame Variance</div>
                        <div className="telemetry-val">{m.metrics.frameNoiseVariation}</div>
                        <div className="muted mono" style={{ fontSize: '0.68rem', marginTop: '0.15rem' }}>Temporal Shift</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Signals */}
              <div>
                <div className="mono" style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  DETECTED INDICATORS ({m.signals?.length || 0})
                </div>
                <SignalList signals={m.signals || []} />
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

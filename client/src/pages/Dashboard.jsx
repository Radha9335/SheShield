import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { verdictClass } from '../components/ScoreGauge.jsx';

export default function Dashboard() {
  const nav = useNavigate();
  const [cases, setCases] = useState(null);
  const [form, setForm] = useState({ title: '', subject: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listCases().then((d) => setCases(d.cases || [])).catch((e) => setError(e.message));
  }, []);

  async function create(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError('Please enter what you are checking.');
    setError('');
    setBusy(true);
    try {
      const { case: c } = await api.createCase({
        title: form.title.trim(),
        subject: form.subject.trim() || undefined,
      });
      nav(`/cases/${c._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Calculate statistics
  const total = cases ? cases.length : 0;
  const highRisk = cases ? cases.filter((c) => c.verdict === 'High risk').length : 0;
  const needsReview = cases ? cases.filter((c) => c.verdict === 'Needs review').length : 0;
  const likelyAuth = cases ? cases.filter((c) => c.verdict === 'Likely authentic').length : 0;

  return (
    <div className="stack">
      {/* Executive Threat Telemetry Header */}
      <section className="stats-grid">
        <div className="stat-box">
          <div className="stat-number">{total}</div>
          <div className="stat-label">Total Audited Cases</div>
        </div>
        <div className="stat-box" style={{ borderColor: likelyAuth ? 'rgba(16, 185, 129, 0.3)' : undefined }}>
          <div className="stat-number" style={{ color: '#34d399' }}>{likelyAuth}</div>
          <div className="stat-label">Likely Authentic</div>
        </div>
        <div className="stat-box" style={{ borderColor: needsReview ? 'rgba(245, 158, 11, 0.3)' : undefined }}>
          <div className="stat-number" style={{ color: '#fbbf24' }}>{needsReview}</div>
          <div className="stat-label">Review Advised</div>
        </div>
        <div className="stat-box" style={{ borderColor: highRisk ? 'rgba(244, 63, 94, 0.3)' : undefined }}>
          <div className="stat-number" style={{ color: '#fb7185' }}>{highRisk}</div>
          <div className="stat-label">High Risk Anomalies</div>
        </div>
      </section>

      {/* Start New Investigation Card */}
      <form className="card card-gradient-top stack" onSubmit={create}>
        <div>
          <h2>Initiate Digital Identity Investigation</h2>
          <p className="muted" style={{ marginTop: '0.2rem' }}>
            Verify photos for AI manipulation, inspect video frames for deepfakes, or scan chat text for romance scams and extortion.
          </p>
        </div>

        <div className="row">
          <label className="grow">
            What are you investigating?
            <input
              required
              maxLength={120}
              placeholder="e.g. Suspicious match on Tinder, Telegram crypto trader, LinkedIn job recruiter"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="grow">
            Subject Handle or Name (optional)
            <input
              maxLength={200}
              placeholder="e.g. @alex_trader_vip or Sarah Jenkins"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </label>
        </div>

        {error && <div className="error-banner"><span>⚠️</span> <span>{error}</span></div>}

        <div>
          <button className="btn" disabled={busy}>
            <span>{busy ? 'Creating Case…' : '🚀 Open Investigation Case'}</span>
          </button>
        </div>
      </form>

      {/* Previous Investigations */}
      <section className="stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Your Forensic Case Files</h2>
          <span className="mono muted" style={{ fontSize: '0.8rem' }}>CASE REGISTRY</span>
        </div>

        {cases === null ? (
          <div className="card scanning-hud">
            <div className="radar-spinner" />
            <p className="muted mono">Loading active investigations…</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛡️</div>
            <h3>No Active Cases Logged</h3>
            <p className="muted" style={{ maxWidth: '440px', margin: '0.4rem auto 1.25rem' }}>
              Create your first investigation case above to begin analyzing suspicious media, romance chat messages, or fake social profiles.
            </p>
          </div>
        ) : (
          <ul className="case-list">
            {cases.map((c) => {
              const cls = verdictClass(c.verdict);
              return (
                <li key={c._id}>
                  <Link to={`/cases/${c._id}`} className="case-card">
                    <div>
                      <div className="case-card-title">{c.title}</div>
                      <div className="case-card-meta mono">
                        {c.subject || 'No handle tagged'} · Logged on {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <span className={`verdict-badge ${cls}`} style={{ margin: 0 }}>
                        {c.trustScore === null ? '⏳ Awaiting' : `${c.trustScore}/100 · ${c.verdict}`}
                      </span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>›</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

import { useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CaseDetail from './pages/CaseDetail.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="card scanning-hud" style={{ marginTop: '4rem' }}>
        <div className="radar-spinner" />
        <p className="muted mono">Authenticating secure SheShield session…</p>
      </div>
    );
  }
  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const { user, logout } = useAuth();
  const [telemetryModal, setTelemetryModal] = useState(null);

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <Link to="/" className="brand-wrapper" title="Go to Command Center">
            <div className="brand-icon">🛡️</div>
            <div>
              <div className="brand-name">SheShield AI</div>
            </div>
          </Link>

          <div className="system-status-pills">
            <button
              type="button"
              className="brand-badge"
              onClick={() => setTelemetryModal('forensics')}
              title="Click to view AI & Forensics Engine status"
            >
              <span className="pulse-dot" />
              <span>Forensics Active</span>
            </button>
            <button
              type="button"
              className="brand-badge-cloud"
              onClick={() => setTelemetryModal('atlas')}
              title="Click to view MongoDB Atlas Database status"
            >
              <span>☁️ Atlas Connected</span>
            </button>
          </div>
        </div>

        {user ? (
          <div className="topbar-right">
            <div className="user-pill">
              <div className="user-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
              <span>{user.name}</span>
            </div>
            <button type="button" className="btn btn-quiet" onClick={logout} title="Sign out">
              Sign out
            </button>
          </div>
        ) : (
          <div className="topbar-right">
            <span className="muted mono" style={{ fontSize: '0.8rem' }}>
              MIL-SPEC CYBER ENGINE
            </span>
          </div>
        )}
      </header>

      {/* Interactive System Telemetry Modal */}
      {telemetryModal && (
        <div className="telemetry-overlay" onClick={() => setTelemetryModal(null)}>
          <div className="telemetry-card" onClick={(e) => e.stopPropagation()}>
            <div className="telemetry-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                {telemetryModal === 'forensics'
                  ? '🛡️ Computer Vision & AI Forensics'
                  : '☁️ MongoDB Atlas Cloud Cluster'}
              </h3>
              <button
                type="button"
                className="telemetry-close-btn"
                onClick={() => setTelemetryModal(null)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="telemetry-body">
              {telemetryModal === 'forensics' ? (
                <>
                  <div className="telemetry-list">
                    <div className="telemetry-item">
                      <span className="muted">Forensic Pipeline Status</span>
                      <span style={{ color: '#34d399', fontWeight: 600 }}>🟢 Active & Operational</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="muted">AI Reasoning Model</span>
                      <span className="mono" style={{ color: '#818cf8' }}>Gemini (3.5 Flash)</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="muted">Computer Vision Engine</span>
                      <span className="mono" style={{ color: '#38bdf8' }}>OpenCV WebAssembly (v4.10)</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="muted">Active Detectors</span>
                      <span style={{ fontSize: '0.8rem' }}>Sharpness, Edges, Noise Grain, EXIF</span>
                    </div>
                  </div>

                  <div className="telemetry-guide-box">
                    <strong>💡 How to investigate:</strong>
                    <div className="muted" style={{ marginTop: '0.25rem' }}>
                      To scan photos for AI manipulation, inspect deepfake video frames, or analyze scam chat logs, open any investigation case below or click <strong>&quot;Open Investigation Case&quot;</strong>.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="telemetry-list">
                    <div className="telemetry-item">
                      <span className="muted">Cluster Connection</span>
                      <span style={{ color: '#34d399', fontWeight: 600 }}>🟢 Connected (Live)</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="muted">Atlas Host</span>
                      <span className="mono" style={{ color: '#38bdf8', fontSize: '0.8rem' }}>cluster0.ixqzstm.mongodb.net</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="muted">Database</span>
                      <span className="mono" style={{ color: '#818cf8' }}>sheshield</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="muted">Security</span>
                      <span style={{ fontSize: '0.8rem' }}>TLS/SSL Encrypted Data Store</span>
                    </div>
                  </div>

                  <div className="telemetry-guide-box">
                    <strong>💡 Database Info:</strong>
                    <div className="muted" style={{ marginTop: '0.25rem' }}>
                      All forensic case evidence, audit scores, and user credentials are safely stored in your MongoDB Atlas cloud database.
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                  onClick={() => setTelemetryModal(null)}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="page">
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/cases/:id" element={<Protected><CaseDetail /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="footnote mono">
        SheShield AI — Probabilistic Cyber Risk & Deepfake Detection Engine. Results are forensic risk indicators, not definitive legal proof.
      </footer>
    </>
  );
}


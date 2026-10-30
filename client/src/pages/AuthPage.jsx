import { useState } from 'react';
import { useAuth } from '../auth.jsx';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    if (mode === 'register' && !form.name.trim()) return setError('Please enter your full name.');
    if (mode === 'register' && password.length < 10) return setError('Password must be at least 10 characters long.');
    setBusy(true);
    try {
      if (mode === 'login') await login({ email, password });
      else await register({ name: form.name.trim(), email, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo() {
    setError('');
    setMode('login');
    setForm({
      name: 'Radha Jha',
      email: 'investigator@sheshield.ai',
      password: 'SheShield@2026Secure',
    });
  }

  return (
    <div className="auth-wrap">
      {/* Left Column: Mission, Hero Scanner Telemetry & Features */}
      <section className="auth-intro">
        <div className="auth-badge">
          <span>🛡️</span>
          <span>SheShield AI • Next-Gen Digital Safety Console</span>
        </div>

        <h1>
          Verify digital identity before you <span className="gradient-text">trust</span>.
        </h1>

        <p className="muted" style={{ fontSize: '1.08rem', lineHeight: 1.65 }}>
          SheShield AI empowers users against catfishing, synthetic AI face generation, romance scams, and extortion using client-side OpenCV WebAssembly forensics and multimodal AI risk analysis.
        </p>

        {/* Holographic Forensic Scanner Preview Card */}
        <div className="forensics-scanner-hero">
          <img 
            src="/cyber_forensics_shield.jpg" 
            alt="SheShield AI Holographic Forensics Biometric Scanner HUD" 
            loading="eager"
          />
          <div className="scanner-laser-line" />
          <div className="scanner-overlay-tags">
            <span className="scanner-tag">
              <span className="pulse-dot" style={{ width: '5px', height: '5px' }} />
              FACIAL MESH: 99.8% FIDELITY
            </span>
            <span className="scanner-tag">
              OPENCV LAPLACIAN: ACTIVE
            </span>
            <span className="scanner-tag" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}>
              DEEPFAKE RISK: 0.002% (AUTHENTIC)
            </span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="feature-pills">
          <div className="feature-pill">
            <div className="feature-pill-icon">🔬</div>
            <div>
              <strong style={{ color: '#fff' }}>Laplacian Blur & Fine-Grain Spectral Analysis:</strong>
              <div className="muted" style={{ fontSize: '0.86rem', marginTop: '0.1rem' }}>
                Detects unnatural skin smoothing, generative blurring artifacts, and frequency anomalies.
              </div>
            </div>
          </div>

          <div className="feature-pill">
            <div className="feature-pill-icon">🎬</div>
            <div>
              <strong style={{ color: '#fff' }}>Multi-Frame Temporal Sync:</strong>
              <div className="muted" style={{ fontSize: '0.86rem', marginTop: '0.1rem' }}>
                Samples video keyframes directly in browser memory to expose deepfake face-swap jitter.
              </div>
            </div>
          </div>

          <div className="feature-pill">
            <div className="feature-pill-icon">🛡️</div>
            <div>
              <strong style={{ color: '#fff' }}>Extortion & Romance Scam NLP:</strong>
              <div className="muted" style={{ fontSize: '0.86rem', marginTop: '0.1rem' }}>
                Evaluates chat logs for financial pressure tactics, urgency spoofing, and grooming patterns.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: High-Tech Glass Console */}
      <form className="card card-gradient-top auth-card" onSubmit={submit}>
        {/* Mode Segmented Switcher */}
        <div className="auth-mode-toggle">
          <button
            type="button"
            className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            <span>🔑 Sign In</span>
          </button>
          <button
            type="button"
            className={`auth-mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            <span>⚡ Create Account</span>
          </button>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <h2>{mode === 'login' ? 'Access Secure Console' : 'Initialize Safety Profile'}</h2>
          <p className="muted" style={{ fontSize: '0.88rem', marginTop: '0.3rem' }}>
            {mode === 'login'
              ? 'Enter your credentials to manage active forensic investigations.'
              : 'Create an encrypted profile connected to your MongoDB Atlas cloud database.'}
          </p>
        </div>

        <div className="stack" style={{ gap: '1rem' }}>
          {mode === 'register' && (
            <label>
              Full Name
              <div className="input-with-icon">
                <span className="input-icon-prefix">👤</span>
                <input
                  required
                  placeholder="e.g. Radha Jha"
                  value={form.name}
                  onChange={set('name')}
                  autoComplete="name"
                />
              </div>
            </label>
          )}

          <label>
            Email Address
            <div className="input-with-icon">
              <span className="input-icon-prefix">✉️</span>
              <input
                type="email"
                required
                placeholder="investigator@sheshield.ai"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
              />
            </div>
          </label>

          <label>
            Password
            <div className="input-with-icon">
              <span className="input-icon-prefix">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                minLength={mode === 'register' ? 10 : 1}
                value={form.password}
                onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="input-icon-suffix"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {mode === 'register' && (
              <small className="muted mono" style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Minimum 10 characters required
              </small>
            )}
          </label>
        </div>

        {error && (
          <div className="error-banner" style={{ marginTop: '1.15rem' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button className="btn" disabled={busy} style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem' }}>
          <span>{busy ? 'Verifying Credentials…' : mode === 'login' ? '🚀 Sign In to Console' : '🛡️ Create Free Account'}</span>
        </button>

        {/* Quick Demo Fill Box for Teacher Presentation */}
        <div className="demo-credentials-box">
          <div className="demo-credentials-text">
            <strong>For Classroom Demo:</strong>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Quickly test with sample credentials</div>
          </div>
          <button type="button" className="btn-demo-fill" onClick={fillDemo}>
            ⚡ Auto-Fill
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="muted" style={{ fontSize: '0.8rem' }}>
            🔒 TLS 1.3 In-Memory Forensic Processing • Cloud Storage on MongoDB Atlas
          </p>
        </div>
      </form>
    </div>
  );
}

export const verdictClass = (verdict) => {
  if (verdict === 'Likely authentic') return 'good';
  if (verdict === 'Needs review') return 'warn';
  if (verdict === 'High risk') return 'bad';
  return 'neutral';
};

const verdictIcon = (verdict) => {
  if (verdict === 'Likely authentic') return '🛡️';
  if (verdict === 'Needs review') return '⚠️';
  if (verdict === 'High risk') return '🚨';
  return '⏳';
};

export default function ScoreGauge({ score, verdict }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const cls = verdictClass(verdict);
  const icon = verdictIcon(verdict);

  return (
    <div className={`gauge-hud-wrapper gauge ${cls}`} role="img" aria-label={score === null ? 'No score calculated yet' : `Trust score ${score} out of 100, ${verdict}`}>
      <svg viewBox="0 0 160 160" width="180" height="180" className="gauge-svg">
        <defs>
          <linearGradient id="gaugeGradientGood" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="gaugeGradientWarn" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="gaugeGradientBad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        {/* Outer track */}
        <circle cx="80" cy="80" r={r} className="gauge-bg-circle" />

        {/* Progress stroke */}
        <circle
          cx="80"
          cy="80"
          r={r}
          className="gauge-progress gauge-glow-filter"
          strokeDasharray={c}
          strokeDashoffset={score === null ? c : c * (1 - pct / 100)}
        />
      </svg>

      <div className="gauge-center-content">
        <div className="gauge-val">{score ?? '–'}</div>
        <div className="gauge-subtext">Trust Index</div>
      </div>

      <div className={`verdict-badge ${cls}`}>
        <span>{icon}</span>
        <span>{verdict || 'Awaiting Input'}</span>
      </div>
    </div>
  );
}

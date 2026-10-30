export default function SignalList({ signals = [] }) {
  if (!signals || !signals.length) return null;

  return (
    <ul className="signals">
      {signals.map((s, i) => {
        const isSuspicious = s.direction === 'suspicious';
        return (
          <li key={i} className={`signal-card ${s.direction}`}>
            <div className="signal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '1rem' }}>{isSuspicious ? '⚠️' : '✅'}</span>
                <span className="signal-title">{s.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className={`severity-tag ${s.severity || 'low'}`}>
                  {s.severity} severity
                </span>
                <span className="mono" style={{ fontSize: '0.72rem', color: isSuspicious ? '#fb7185' : '#34d399', fontWeight: 600 }}>
                  {isSuspicious ? 'Anomaly' : 'Authentic'}
                </span>
              </div>
            </div>
            <p className="signal-detail">{s.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}

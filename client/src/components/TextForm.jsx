import { useState } from 'react';
import { api } from '../api.js';

const SCENARIOS = [
  {
    label: '🚨 Romance / Emergency Extortion',
    text: 'Honey, my flight got held up at immigration customs and they are demanding $850 duty clearance right now. Please send it urgently via Bitcoin or Western Union immediately before they confiscate my passport! My battery is dying hurry!!',
    context: 'Met on dating app 10 days ago, never met in person',
  },
  {
    label: '💳 Crypto / Investment Scam',
    text: 'Hello dear! Our private hedge fund automated trading bot guarantees 240% ROI within 48 hours. Transfer 500 USDT to our contract wallet immediately before the VIP pool allocation closes today. Switch to Telegram for private signal keys.',
    context: 'Unsolicited WhatsApp message from unknown foreign number',
  },
  {
    label: '✅ Authentic Organic Peer Chat',
    text: 'Hey! Hope your presentation went well yesterday. Are you still free to grab coffee this Saturday around 3:30 PM near the bookstore? Let me know whenever you get some downtime, no rush!',
    context: 'Friend from college',
  },
];

export default function TextForm({ caseId, onDone }) {
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function loadScenario(s) {
    setText(s.text);
    setContext(s.context);
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 20) return setError('Paste at least 20 characters of message text to analyse.');
    setError('');
    setBusy(true);
    try {
      const { case: c } = await api.analyzeText(caseId, {
        text: trimmed,
        context: context.trim() || undefined,
      });
      setText('');
      setContext('');
      onDone(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      {/* Quick Load Test Scenarios */}
      <div className="scenarios-box">
        <div className="scenarios-label">⚡ One-Click Test Scenarios (Demonstration)</div>
        <div className="scenario-chips">
          {SCENARIOS.map((s, i) => (
            <button
              key={i}
              type="button"
              className="scenario-chip"
              onClick={() => loadScenario(s)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <label>
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Conversation Excerpt or Message Text</span>
          <span className="mono" style={{ fontSize: '0.75rem', color: text.length < 20 ? '#fb7185' : '#34d399' }}>
            {text.length} / 5000 chars {text.length < 20 && '(min 20)'}
          </span>
        </span>
        <textarea
          required
          rows={6}
          maxLength={5000}
          placeholder="Paste suspected messages, chat snippets, or emails here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      <label>
        Context or Relationship Background (optional)
        <input
          maxLength={300}
          placeholder="e.g. Matched 2 weeks ago on Tinder, claims to be overseas"
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
      </label>

      {error && <div className="error-banner"><span>⚠️</span> <span>{error}</span></div>}

      <div>
        <button className="btn" disabled={busy || text.trim().length < 20}>
          <span>{busy ? 'Evaluating Linguistic Vectors…' : '🛡️ Scan Messages for Fraud & Grooming'}</span>
        </button>
      </div>
    </form>
  );
}

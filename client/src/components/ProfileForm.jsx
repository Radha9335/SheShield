import { useState } from 'react';
import { api } from '../api.js';

const empty = {
  platform: 'Instagram',
  username: '',
  displayName: '',
  bio: '',
  accountAgeDays: '',
  followers: '',
  following: '',
  posts: '',
  links: '',
};

const DEMO_PROFILES = [
  {
    label: '🚨 Fake Bot Profile (Imbalance & Multi-Digit Handle)',
    data: {
      platform: 'Instagram',
      username: 'alex_trader_849204',
      displayName: 'Alex M | Wealth Mentor',
      bio: 'DM for automated crypto returns. Not your average financial mentor. 💎 VIP signals link below.',
      accountAgeDays: 5,
      followers: 18,
      following: 3400,
      posts: 2,
      links: 't.me/alex_vip_signals',
    },
  },
  {
    label: '✅ Organic Established Profile',
    data: {
      platform: 'LinkedIn',
      username: 'priya_sharma_ux',
      displayName: 'Priya Sharma',
      bio: 'Product Designer @ FinTech. Passionate about human-centric interfaces, hiking, and specialty coffee. Bangalore.',
      accountAgeDays: 1460,
      followers: 1250,
      following: 680,
      posts: 45,
      links: 'priyadesigns.portfolio.io',
    },
  },
];

export default function ProfileForm({ caseId, onDone }) {
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function loadDemo(data) {
    setF({ ...empty, ...data });
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    if (!f.username.trim() && !f.displayName.trim() && !f.bio.trim()) {
      return setError('Please enter at least a username, display name, or bio.');
    }
    setError('');
    setBusy(true);
    const body = {};
    Object.entries(f).forEach(([k, v]) => {
      const val = typeof v === 'string' ? v.trim() : v;
      if (val === '') return;
      if (k === 'links') {
        const linkList = val.split(/\s*,\s*|\n/).map((s) => s.trim()).filter(Boolean).slice(0, 5);
        if (linkList.length) body[k] = linkList;
      } else if (['accountAgeDays', 'followers', 'following', 'posts'].includes(k)) {
        const num = Number(val);
        if (!isNaN(num) && num >= 0) body[k] = num;
      } else {
        body[k] = val;
      }
    });
    try {
      const { case: c } = await api.analyzeProfile(caseId, body);
      setF(empty);
      onDone(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      {/* Quick Load Test Profiles */}
      <div className="scenarios-box">
        <div className="scenarios-label">⚡ One-Click Profile Scenarios (Demonstration)</div>
        <div className="scenario-chips">
          {DEMO_PROFILES.map((p, i) => (
            <button
              key={i}
              type="button"
              className="scenario-chip"
              onClick={() => loadDemo(p.data)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <label className="grow">
          Platform
          <select value={f.platform} onChange={set('platform')}>
            <option value="Instagram">Instagram</option>
            <option value="Tinder">Tinder</option>
            <option value="Bumble">Bumble</option>
            <option value="X (Twitter)">X (Twitter)</option>
            <option value="Telegram">Telegram</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Facebook">Facebook</option>
            <option value="Other">Other Platform</option>
          </select>
        </label>
        <label className="grow">
          Username / Handle
          <input placeholder="e.g. @alex_smith_992" value={f.username} onChange={set('username')} />
        </label>
        <label className="grow">
          Display Name
          <input placeholder="e.g. Alex Smith" value={f.displayName} onChange={set('displayName')} />
        </label>
      </div>

      <label>
        Account Bio / Profile Description
        <textarea
          rows={3}
          maxLength={600}
          placeholder="Paste user bio description, self-intro, or claims…"
          value={f.bio}
          onChange={set('bio')}
        />
      </label>

      <div className="row">
        <label className="grow">
          Account Age (Days)
          <input type="number" min="0" placeholder="e.g. 14" value={f.accountAgeDays} onChange={set('accountAgeDays')} />
        </label>
        <label className="grow">
          Followers
          <input type="number" min="0" placeholder="e.g. 24" value={f.followers} onChange={set('followers')} />
        </label>
        <label className="grow">
          Following
          <input type="number" min="0" placeholder="e.g. 2100" value={f.following} onChange={set('following')} />
        </label>
        <label className="grow">
          Total Posts
          <input type="number" min="0" placeholder="e.g. 3" value={f.posts} onChange={set('posts')} />
        </label>
      </div>

      <label>
        External Links in Bio (comma separated, max 5)
        <input placeholder="e.g. t.me/channel, cash.app/$user" value={f.links} onChange={set('links')} />
      </label>

      {error && <div className="error-banner"><span>⚠️</span> <span>{error}</span></div>}

      <div>
        <button className="btn" disabled={busy}>
          <span>{busy ? 'Evaluating Bot Heuristics…' : '🛡️ Analyze Identity & Bot Risk'}</span>
        </button>
      </div>
    </form>
  );
}

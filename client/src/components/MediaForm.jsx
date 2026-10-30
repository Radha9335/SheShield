import { useState, useRef } from 'react';
import { api } from '../api.js';
import { extractFrames } from './videoFrames.js';

export default function MediaForm({ caseId, kind, onDone }) {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const isVideo = kind === 'video';

  function handleFiles(selectedList) {
    const picked = Array.from(selectedList || []);
    if (!picked.length) return;
    if (!isVideo && picked.length > 8) return setError('Choose up to 8 images.');
    if (!isVideo) {
      const tooLarge = picked.some((f) => f.size > 5 * 1024 * 1024);
      if (tooLarge) return setError('Each image must be 5 MB or smaller.');
    }
    setError('');
    setFiles(picked);

    // Generate previews for images
    if (!isVideo) {
      const urls = picked.map((f) => ({
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(1) + ' MB',
        url: URL.createObjectURL(f),
      }));
      setPreviews(urls);
    } else {
      setPreviews([{ name: picked[0].name, size: (picked[0].size / (1024 * 1024)).toFixed(1) + ' MB' }]);
    }
  }

  function onFileChange(e) {
    handleFiles(e.target.files);
  }

  function onDragOver(e) {
    e.preventDefault();
    setDragActive(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    setDragActive(false);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function removeFile(index) {
    const nextFiles = files.filter((_, i) => i !== index);
    setFiles(nextFiles);
    if (previews[index]?.url) URL.revokeObjectURL(previews[index].url);
    setPreviews(previews.filter((_, i) => i !== index));
  }

  async function submit(e) {
    e.preventDefault();
    if (!files.length) return setError('Please choose a file to analyse.');
    setError('');
    try {
      let toSend = files;
      if (isVideo) {
        setBusy('Neural Engine: Extracting multi-frame temporal samples from video…');
        toSend = await extractFrames(files[0]);
      }
      setBusy('Neural Engine: Running Laplacian blur & fine-grain frequency variance scan…');
      const { case: c } = await api.analyzeMedia(caseId, kind, toSend);
      
      // Cleanup previews
      previews.forEach((p) => p.url && URL.revokeObjectURL(p.url));
      setFiles([]);
      setPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onDone(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={!isVideo}
        accept={isVideo ? 'video/mp4,video/webm,video/quicktime,video/*' : 'image/jpeg,image/png,image/webp,image/jpg'}
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

      {/* Drag & Drop Zone */}
      <div
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-icon">
          {isVideo ? '🎬' : '📸'}
        </div>
        <div className="dropzone-text">
          {files.length > 0
            ? `${files.length} file(s) loaded. Click or drop to change.`
            : isVideo
            ? 'Click or drag video here to analyze'
            : 'Click or drag up to 8 photos here'}
        </div>
        <div className="dropzone-sub">
          {isVideo
            ? 'Supports MP4, WebM, MOV · Processed in-browser locally without uploading the full video'
            : 'JPEG, PNG, WebP up to 5 MB each · Analyzes grain texture, edge sharpness & AI artifacts'}
        </div>
      </div>

      {/* Thumbnails preview */}
      {previews.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span className="mono muted" style={{ fontSize: '0.78rem' }}>SELECTED ASSETS ({previews.length})</span>
            <button type="button" className="btn btn-quiet" style={{ fontSize: '0.78rem' }} onClick={() => { setFiles([]); setPreviews([]); }}>
              Clear all
            </button>
          </div>
          <div className="preview-grid">
            {previews.map((p, i) => (
              <div key={i} className="preview-item">
                {p.url ? (
                  <img src={p.url} alt={p.name} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0.5rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem' }}>🎥</span>
                    <span className="mono" style={{ fontSize: '0.65rem', wordBreak: 'break-all' }}>{p.name}</span>
                  </div>
                )}
                <span className="preview-badge">{p.size}</span>
                <button type="button" className="preview-remove" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scanning status banner */}
      {busy && (
        <div className="card scanning-hud" style={{ background: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
          <div className="radar-spinner" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: '#a5b4fc', fontSize: '1rem' }}>Forensic Vision Engine Running</div>
            <div className="muted mono" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{busy}</div>
          </div>
        </div>
      )}

      {error && <div className="error-banner"><span>⚠️</span> <span>{error}</span></div>}

      <div>
        <button className="btn" disabled={!files.length || Boolean(busy)}>
          <span>{busy ? 'Scanning…' : isVideo ? '🚀 Run Deepfake Video Analysis' : '🛡️ Run Forensic Photo Analysis'}</span>
        </button>
      </div>
    </form>
  );
}

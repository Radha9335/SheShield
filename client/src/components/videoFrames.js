const seek = (video, t) =>
  new Promise((resolve, reject) => {
    if (Math.abs(video.currentTime - t) < 0.05) return resolve();
    let timeout;
    const cleanup = () => {
      clearTimeout(timeout);
      video.onseeked = null;
      video.onerror = null;
    };
    timeout = setTimeout(() => {
      cleanup();
      resolve(); // safety fallback to avoid hanging
    }, 4000);
    video.onseeked = () => {
      cleanup();
      resolve();
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('Could not read frames from this video.'));
    };
    video.currentTime = t;
  });

export async function extractFrames(file, count = 6, maxSide = 768) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  try {
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;

    await new Promise((resolve, reject) => {
      let timeout;
      const cleanup = () => {
        clearTimeout(timeout);
        video.onloadedmetadata = null;
        video.onloadeddata = null;
        video.onerror = null;
      };

      const checkReady = () => {
        if (video.videoWidth > 0 && (video.readyState >= 2 || Number.isFinite(video.duration))) {
          cleanup();
          resolve();
        }
      };

      timeout = setTimeout(() => {
        cleanup();
        if (video.videoWidth > 0) resolve();
        else reject(new Error('Video loading timed out. Try another video file.'));
      }, 10000);

      video.onloadedmetadata = checkReady;
      video.onloadeddata = checkReady;
      video.onerror = () => {
        cleanup();
        reject(new Error('This video format is not supported by your browser. Try MP4 or WebM.'));
      };
      video.load();
    });

    // Fix WebM infinite duration issue in browsers
    if (!Number.isFinite(video.duration) || video.duration === Infinity) {
      video.currentTime = Number.MAX_SAFE_INTEGER;
      await new Promise((r) => {
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          video.currentTime = 0;
          r();
        };
        setTimeout(r, 1000);
      });
    }

    if (!Number.isFinite(video.duration) || video.duration < 0.5) {
      throw new Error('The video is too short to analyse (must be at least 0.5 seconds).');
    }

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error('Could not determine video dimensions.');
    }

    const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext('2d');

    const frames = [];
    for (let i = 0; i < count; i += 1) {
      await seek(video, (video.duration * (i + 0.5)) / count);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
      if (blob) {
        frames.push(new File([blob], `frame-${i + 1}.jpg`, { type: 'image/jpeg' }));
      }
    }

    if (frames.length < 3) {
      throw new Error(`Only ${frames.length} frame(s) could be extracted. At least 3 frames are required.`);
    }

    return frames;
  } finally {
    try {
      video.src = '';
      video.load();
    } catch {
      /* ignore */
    }
    URL.revokeObjectURL(url);
  }
}

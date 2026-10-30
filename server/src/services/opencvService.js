// OpenCV (WebAssembly build) forensic measurements. Runs inside Node, no Python or native build needed.
import sharp from 'sharp';
import cvModule from '@techstark/opencv-js';

let cvPromise;
function getCv() {
  if (!cvPromise) {
    cvPromise = new Promise((resolve) => {
      if (cvModule.Mat) {
        delete cvModule.then;
        return resolve(cvModule);
      }
      if (typeof cvModule.then === 'function') {
        cvModule.then((cv) => {
          delete cv.then;
          resolve(cv);
        });
      } else {
        cvModule.onRuntimeInitialized = () => {
          delete cvModule.then;
          resolve(cvModule);
        };
      }
    });
  }
  return cvPromise;
}

const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const cv_ = (a) => {
  const m = mean(a);
  if (!m) return 0;
  return Math.sqrt(mean(a.map((v) => (v - m) ** 2))) / m; // coefficient of variation
};
const r2 = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : 0);

async function measureImage(cv, buffer) {
  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mats = [];
  const track = (m) => { mats.push(m); return m; };
  try {
    const rgba = track(cv.matFromArray(info.height, info.width, cv.CV_8UC4, data));
    const gray = track(new cv.Mat());
    cv.cvtColor(rgba, gray, cv.COLOR_RGBA2GRAY);

    // Sharpness: variance of the Laplacian.
    const lap = track(new cv.Mat());
    cv.Laplacian(gray, lap, cv.CV_64F);
    const lm = track(new cv.Mat());
    const ls = track(new cv.Mat());
    cv.meanStdDev(lap, lm, ls);
    const stdDev = ls.data64F ? ls.data64F[0] : 0;
    const sharpness = stdDev ** 2;

    // Fine grain: mean absolute difference between the image and a blurred copy.
    const blur = track(new cv.Mat());
    cv.GaussianBlur(gray, blur, new cv.Size(3, 3), 0);
    const resid = track(new cv.Mat());
    cv.absdiff(gray, blur, resid);
    const noise = cv.mean(resid)[0] || 0;

    // Does the grain level vary a lot between regions? (4x4 grid)
    const cw = Math.floor(info.width / 4);
    const ch = Math.floor(info.height / 4);
    let gridVariation = 0;
    if (cw > 0 && ch > 0) {
      const cells = [];
      for (let gy = 0; gy < 4; gy += 1) {
        for (let gx = 0; gx < 4; gx += 1) {
          const roi = resid.roi(new cv.Rect(gx * cw, gy * ch, cw, ch));
          cells.push(cv.mean(roi)[0] || 0);
          roi.delete();
        }
      }
      gridVariation = cv_(cells);
    }

    // Edge density via Canny.
    const edges = track(new cv.Mat());
    cv.Canny(gray, edges, 50, 150);
    const totalPixels = info.width * info.height || 1;
    const edgeDensity = cv.countNonZero(edges) / totalPixels;

    return { sharpness, noise, gridVariation, edgeDensity };
  } finally {
    mats.forEach((m) => {
      try { m.delete(); } catch { /* ignore cleanup error */ }
    });
  }
}

export async function analyzeWithOpenCV(files, kind) {
  const cv = await getCv();
  const measures = [];
  for (const f of files) measures.push(await measureImage(cv, f.buffer)); // sequential: WASM is single-threaded

  const avg = (k) => mean(measures.map((m) => m[k]));
  const metrics = {
    sharpness: r2(avg('sharpness')),
    noiseLevel: r2(avg('noise')),
    edgeDensity: r2(avg('edgeDensity')),
    gridVariation: r2(avg('gridVariation')),
    frameNoiseVariation: kind === 'video' ? r2(cv_(measures.map((m) => m.noise))) : null,
    framesMeasured: measures.length,
  };

  const signals = [];
  let penalty = 0;
  const add = (label, severity, direction, detail) => {
    signals.push({ label: `OpenCV: ${label}`, severity, direction, detail });
    if (direction === 'suspicious') penalty += severity === 'medium' ? 8 : 3;
  };

  if (metrics.noiseLevel < 1.2) {
    add('Unusually smooth texture', 'medium', 'suspicious',
      `Fine grain measured ${metrics.noiseLevel}, lower than typical camera photos. AI-generated or heavily retouched faces often look like this, though strong compression can too.`);
  } else {
    add('Natural grain level', 'low', 'authentic', `Fine grain measured ${metrics.noiseLevel}, in the range expected for camera images.`);
  }
  if (metrics.gridVariation > 1.2) {
    add('Uneven grain across regions', 'low', 'suspicious',
      `Grain level varies strongly between image regions (variation ${metrics.gridVariation}). Pasted or blended areas can cause this, but so can plain backgrounds.`);
  }
  if (metrics.sharpness < 40) {
    add('Low detail', 'low', 'suspicious', `Sharpness score ${metrics.sharpness} is low, so every other check is less reliable on this file.`);
  }
  if (kind === 'video' && metrics.frameNoiseVariation > 0.45) {
    add('Grain shifts between frames', 'medium', 'suspicious',
      `Grain level changes by ${Math.round(metrics.frameNoiseVariation * 100)}% between sampled frames, which can happen when parts of a video are synthesised or re-rendered.`);
  }

  return { signals, penalty: Math.min(penalty, 20), metrics };
}

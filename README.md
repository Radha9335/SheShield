# SheShield – Intelligent Digital Identity Verification & Deepfake Detection System

Identity verification and deepfake-risk checks. Stack: React (Vite), Node.js, Express, MongoDB. OpenCV runs in Node via the WebAssembly build (`@techstark/opencv-js`) for image forensics, the AI model runs through the Anthropic API, and video frames are sampled in the browser. No Python.

## Run locally
1. Start MongoDB (`docker compose up -d mongo`, or use a local install / Atlas URI).
2. Server:
   ```
   cd server
   cp .env.example .env     # add ANTHROPIC_API_KEY and a long random JWT_SECRET
   npm install
   npm run dev
   ```
3. Client (new terminal):
   ```
   cd client
   npm install
   npm run dev              # http://localhost:5173
   ```

## How it works
- A **case** holds up to four checks: photos, video, messages, profile.
- Each check sends the evidence to the model with a strict JSON schema (score, confidence, signals). Output is validated with zod; one retry on bad JSON.
- **OpenCV** measures sharpness (Laplacian variance), fine-grain level, regional grain consistency and edge density (Canny) per image, plus grain stability across video frames. These measurements become signals, adjust the score, and are passed to the model.
- The server adds deterministic checks (EXIF / AI-tool metadata) so the score is not only model opinion.
- `services/scoring.js` merges checks into one trust score weighted by module and confidence, caps it when 2+ high-severity warnings exist, and returns plain-language reasons.

## API
| Method | Path | Purpose |
|---|---|---|
| POST | /api/auth/register, /login | Account |
| GET | /api/cases, /api/cases/:id | List / read |
| POST | /api/cases | Create case |
| POST | /api/cases/:id/analyze/media | `kind=image\|video`, multipart `files` |
| POST | /api/cases/:id/analyze/text | `{ text, context? }` |
| POST | /api/cases/:id/analyze/profile | Profile fields |

## Production checklist
- Set `NODE_ENV=production`, a 32+ char `JWT_SECRET`, and `CLIENT_ORIGIN` to your real domain. Serve over HTTPS.
- Build the client (`npm run build`) and host `client/dist` on a static host or behind nginx, proxying `/api` to the server.
- The JWT is kept in localStorage for simplicity. For stricter security, move it to an httpOnly cookie with CSRF protection.
- Uploaded media is processed in memory and never stored; only scores and signals are saved.
- Add a privacy policy and consent screen before real users upload other people's images.

## Limits you should be honest about
Model-based deepfake detection is probabilistic and can be wrong in both directions. The UI says "risk indicator", never "proof". For high-stakes cases, add a dedicated forensic detector behind the same `aiService` interface.

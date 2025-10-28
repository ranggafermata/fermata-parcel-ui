# Angel's Eye

Geospatial Threat Intelligence Dashboard — MapLibre + MapTiler + OTX

## Quick start (local)

1. Install dependencies:

```powershell
npm install
```

2. Create a `.env` file (optional) in the project root with values you need:

```
OTX_API_KEY=your_otx_key
GEMINI_API_KEY=your_gemini_key
MAPTILER_KEY=your_maptiler_key   # optional; used by the client if exposed
PORT=10000
```

3. Run in development (auto-restarts with changes):

```powershell
npm run dev
```

Or run production server:

```powershell
npm start
```

4. Open http://localhost:10000 in your browser.

## Notes on MapTiler key
- For quick testing you can set `MAPTILER_KEY` in `.env`. The server exposes a small `/api/config` endpoint that returns non-secret configuration (including `maptilerKey`) to the client. This is convenient but note that any key returned to the browser is public.
- For production, consider using MapTiler restricted keys and review the security implications of exposing keys to clients.

## GitHub deployment
- This repository is ready to push to GitHub. Add a GitHub Actions workflow if you want automatic deployment to a platform (e.g., Render, Vercel, Heroku).

## What I changed
- Added `start` and `dev` scripts to `package.json` and included `nodemon` as a dev dependency.
- Added `.gitignore` and a `README.md` with local run instructions.
- Added a small `/api/config` endpoint to `api/server.js` that returns `{ maptilerKey }` from the environment.

If you want, I can:
- Add a GitHub Actions workflow to run `npm ci` and deploy to a target (you must tell me where to deploy), or
- Inject `MAPTILER_KEY` directly into `index.html` when serving the page (server-side template inject) to avoid the client fetch.

Tell me which you'd prefer next.

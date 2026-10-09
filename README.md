# Repo Recap

A story-style, animated yearly recap for any **public GitHub profile**. No login required in the browser — open a username and play the reel.

Live: https://recap.jordanshears.com

## Screenshots

![Landing](docs/landing.png)

![Story](docs/story.png)

![Share card](docs/share-card.png)

> Placeholder images — drop real captures into `docs/` when you have them.

## Tech stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS
- Framer Motion
- TanStack Query
- React Router
- Vitest + Playwright
- Satori + resvg server-side share PNG (`/api/share-image`)
- Vercel serverless `/api/recap` (authenticated GitHub GraphQL + REST)

## How stats are derived

### Production path (`/api/recap`)

A Vercel function reads `GITHUB_TOKEN` from the server environment (never `VITE_`, never sent to the client) and:

1. Runs one GitHub GraphQL query for profile, public repos, and the last-12-month contribution calendar
2. Fetches REST `/users/{u}/events/public` (up to 3 pages) for peak hour only

The client loads `/api/recap?u={username}` and maps the payload through `src/lib/stats.ts`. CDN caching uses `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.

### Fallback path

If `/api/recap` returns **502** or the network fails, the client falls back to the original unauthenticated REST calls (`/users`, `/repos`, `/events/public`) so local `npm run dev` still works without the API.

### Calendar-powered stats

When contribution data is present:

- Total contributions, longest + current streak, busiest weekday, and best month come from the **last 12 months** calendar
- Peak hour still comes from public events (~90 days)
- Private-only activity surfaces via `restrictedContributionsCount` on Ghost Mode / Quiet Mode and the share card

## Rate limits and caching

- Authenticated API path: **5,000 requests/hour** (shared server token), with CDN cache per username
- Unauthenticated fallback: GitHub’s **60 requests/hour per IP**
- Combined payloads are cached in `localStorage` for **one hour**
- 404s map to the not-found screen; 429s map to the rate-limit screen

## Local setup

1. Copy a GitHub personal access token into `.env.local` (gitignored):

   ```bash
   GITHUB_TOKEN=your_token_here
   ```

2. Install and run:

```bash
npm install
npm run dev        # Vite only — skips /api/recap and uses unauthenticated GitHub
npm run dev:api    # vercel dev — serves /api/recap with GITHUB_TOKEN
# Optional: VITE_USE_API=true npm run dev  (requires a proxy that serves /api/recap)
npm test
npm run test:e2e
npm run build
```

Open `/` or go directly to `/u/{username}`. Direct links work in production via the SPA fallback in `vercel.json` (API routes excluded).

Set `GITHUB_TOKEN` in the Vercel project environment for production — do not prefix it with `VITE_`.

## What I’d do next

- Signed-in “this is me” mode for private-repo-aware recaps that still never expose the token to the browser.
- Optional recruiter/classroom deploy docs for rotating the server token.

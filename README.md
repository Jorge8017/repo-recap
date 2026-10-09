# Repo Recap

A story-style, animated yearly recap for any **public GitHub profile**. No login, no token, no analytics — open a username and play the reel.

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
- html-to-image for the share card

## How stats are derived

All numbers come from three unauthenticated GitHub REST calls:

1. `GET /users/{username}` — profile, join date, public repo count, avatar
2. `GET /users/{username}/repos?per_page=100&sort=pushed` — stars, forks, languages (`language` field only; no per-repo languages endpoint), most-starred repo
3. `GET /users/{username}/events/public` — up to 3 pages. Treated as roughly the **last 90 days**: busiest weekday/hour (viewer’s local time), push/commit totals, consecutive-day streak, most active repo in the window

Pure functions in `src/lib/stats.ts` turn those payloads into recap stats. `src/lib/personality.ts` maps them onto a personality card (Ghost Mode for empty public profiles, then Night Owl, Polyglot, Weekend Warrior, Star Collector, Marathon Coder, Builder).

Event-based slides are labelled **last 90 days**. Empty or zero values are skipped instead of shown.

## Rate limits and caching

GitHub’s unauthenticated cap is **60 requests/hour per IP**. Repo Recap stays at three endpoint types per username (events may paginate up to 3 pages) and never ships a token.

- Combined payloads are cached in `localStorage` for **one hour** (all access wrapped in try/catch if storage is blocked).
- `X-RateLimit-Remaining` and `X-RateLimit-Reset` are read on every response. If the budget is spent, the UI shows when it resets.
- 404s are not retried. Network errors may retry a couple of times.

## Scripts

```bash
npm install
npm run dev
npm test
npm run test:e2e
npm run build
```

Open `/` or go directly to `/u/{username}`. Direct links work in production via the SPA fallback in `vercel.json`.

## What I’d do next

- A small serverless proxy with a GitHub token so recruiters and classrooms don’t share the 60/hour public budget.
- The full contribution calendar via the GraphQL API (true year heatmap, not the ~90-day public events window).
- Signed-in “this is me” mode for private-repo-aware recaps, still never exposing the token to the browser.

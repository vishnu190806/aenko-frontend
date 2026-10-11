# AENKO Frontend — Anime Journey, Quest & Guild Platform

React + Vite + JavaScript app integrated with the AENKO Spring Boot backend.

## Prerequisites

- Node.js 18+
- AENKO backend running at `http://localhost:8080` (see `../aenko-backend/README.md`)
- MySQL + optional `MAL_CLIENT_ID` for anime search (backend concern)

## Setup

```bash
cd aenko-frontend
cp .env.example .env   # Windows: copy .env.example .env
npm install
```

`.env` supports (local file, git-ignored — never commit secrets here):

```
VITE_API_BASE_URL=http://localhost:8080
```

Defaults to `http://localhost:8080` when unset.

## Deploying the frontend (Vercel)

The React app never calls Gemini, Ollama, or any AI provider directly: the
AI Insights page only calls `GET/POST /api/ai/insight` on the backend with
the unchanged `{type, content, personalized}` contract. In the Vercel
dashboard, set exactly one environment variable:

| Vercel variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<render-backend-url>` (no trailing slash) |

Never create `VITE_GEMINI_API_KEY` or any `VITE_*` secret — everything
starting with `VITE_` is bundled into public JavaScript. The Gemini key
lives only in the Render **backend** environment (see backend README).
Also add the Vercel URL to the backend's `CORS_ALLOWED_ORIGINS`, otherwise
browsers block the cross-origin API calls.

## Run

```bash
npm run dev      # dev server, default http://localhost:5173
npm run build    # production build (verifies compilation)
npm run preview  # serve the production build
npm run lint     # oxlint
npm run e2e      # Playwright browser suite (see below)
```

## Browser E2E tests (Playwright)

Real-Chrome journeys live in `e2e/` with helpers in `e2e/helpers.js`.
One-command run (manages the services itself when they are not running):

```bash
npm run build && npm run e2e
```

Prerequisites (not started by the suite): MySQL on `localhost:3306`,
backend jar built (`../aenko-backend/target/*.jar`, the config applies the
documented local Ollama AI settings), and for the live-AI test Ollama
serving `llama3.1:8b` on `localhost:11434`. Without `MAL_CLIENT_ID` the
MAL specs verify the honest provider-error paths; live MAL search stays
blocked until a key is configured. Reports/traces land in
`playwright-report/` and `test-results/` (failure screenshots included).

Backend (separate terminal):

```bash
cd ../aenko-backend
./mvnw spring-boot:run   # Windows: mvnw.cmd spring-boot:run
```

## API integration checklist (all contracts from backend source)

| Feature | Endpoint(s) |
|---|---|
| Register / login / me | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Discover / ranking / detail / relations | `GET /api/anime/search?q&page&size`, `GET /api/anime/ranking?type&page&size`, `GET /api/anime/{malId}`, `GET /api/anime/{malId}/relations` |
| Library | `GET /api/library?status&page&size`, `POST /api/library`, `PUT /api/library/{mediaId}`, `DELETE /api/library/{mediaId}` |
| Progress | `GET /api/progress/{mediaId}`, `POST /api/progress/{mediaId}/episode/{n}`, `DELETE /api/progress/{mediaId}/episode/{n}` |
| Quests | `GET /api/quests`, `GET /api/quests/my`, `POST /api/quests/{id}/start`, `POST /api/quests/{id}/complete` |
| Achievements | `GET /api/achievements`, `GET /api/achievements/my` |
| Guilds | `POST /api/guilds`, `GET /api/guilds`, `GET /api/guilds/{id}`, `POST /api/guilds/{id}/join`, `POST /api/guilds/{id}/leave`, `GET /api/guilds/{id}/members`, `GET /api/guilds/{id}/leaderboard`, `GET /api/guilds/{id}/quests`, `POST /api/guilds/{id}/quests` |
| Guide | `GET /api/anime/search?q&page&size`, `GET /api/anime/{malId}`, `GET /api/anime/{malId}/relations` (live MAL relationships, no library import) + `GET /api/franchises`, `GET /api/franchises/{id}/watch-order` (curated watch orders only) |
| Profile / stats / activity | `GET /api/profile`, `GET /api/profile/stats`, `GET /api/activity` |
| AI insight | `GET /api/ai/insight`, `POST /api/ai/insight` |

Key contract notes:

- Provider search/detail use the **MAL external ID** (`AnimeDto.externalId`, `id=null`); library & progress use the **internal `mediaId`** (`LibraryResponse.mediaId`). Adding from Discover sends `{provider:"MAL", externalId}` and the backend imports.
- The Guide explores relationships purely by external MAL ID (`animeDetail` + `animeRelations`) — titles never need a library entry or a local `Media` row. Related cards navigate by `externalId`, never by internal `mediaId`.
- Related anime (live MAL `relationType` labels such as sequel / side story) and curated franchise watch orders are separate sections. The Guide matches a selected anime to its curated franchise by MAL external ID (from `franchise.media[].externalId`) and surfaces that guide prominently; titles with no curated order get an honest per-title empty state while the catalogue stays browsable. With no curated rows the Guide states that no curated watch order is available yet instead of showing placeholder data.
- Auth returns `{token, user}`; the token is sent as `Authorization: Bearer <JWT>`. 401 clears the session and redirects to login; 403 shows a permission error.
- Anime search without backend `MAL_CLIENT_ID` returns `502` — the UI shows a "temporarily unavailable" state instead of fake data.
- XP/levels/quest completion/achievements/guild XP are backend-verified; the UI never awards anything locally.

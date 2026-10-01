Project name : Rhythm

You are a senior full-stack architect. Build a real-time music streaming and listening-together web app (Spotify-style) designed for a very large number of users. Work in phases. After each phase, show the file tree and a short summary, then wait for my "next" before continuing.

STACK
- Frontend: React + TypeScript + Vite, Tailwind, shadcn/ui, TanStack Query, Zustand, React Router, Socket.IO client, react-hook-form + Zod.
- Backend: Node.js, TypeScript (strict), Express, MongoDB (Mongoose), Redis, Socket.IO with Redis adapter, Zod, pino, DI (tsyringe or inversify).

THEME
- Spotify-style: near-black background, high-contrast text, rounded cards, left sidebar, bottom player bar.
- Theme selector: green (default), blue, purple, pink, orange. The choice is saved per user (synced to the backend), applied instantly through CSS variables, and persisted.

BACKEND RULES
1. Layers: Routes → Controllers → Services → Repositories. Each layer has its own `interfaces/` folder (controllers/interfaces, services/interfaces, repositories/interfaces). Classes implement the interfaces and are injected by interface (SOLID).
2. No hard-coded values. Use `constants/` (messages, status codes, routes, roles, socket events, cache keys, limits) and `config/` with Zod-validated env variables.
3. A common response format for every endpoint (`success, message, data, meta, errors`) through a response helper, plus a global error handler with custom error classes.
4. Use DTOs and mappers. Never return raw entities or the password hash.
5. Validate all input with Zod at the route level. No `any`.
6. Folders: config, constants, controllers, services, repositories, models, dtos, mappers, middlewares, routes, sockets, validators, utils, types, container.
7. Scale: pagination (cursor-based for big lists), indexes on every query path, `.lean()` and projections, Redis caching with TTL and invalidation, rate limiting, compression, Helmet, CORS, request size limits, stateless servers, graceful shutdown.

FRONTEND STRUCTURE
components/ui, components/common, features/*, pages, layouts, hooks, services, store, constants, utils, types, lib. Use lazy-loaded routes, protected routes, an axios instance with token-refresh interceptors, skeleton loaders, error states and toasts. No hard-coded strings; use constants only. Use virtualized lists, lazy images, prefetching and optimistic updates for favorites.

FEATURES
- Auth: register (username, email, password, confirm password); login (username OR email + password); Google auth (ID-token verification). Use bcrypt, short-lived JWT access tokens and refresh tokens in httpOnly cookies with rotation.
- Home: choose mode: Solo, Couples, Party.
- Solo: browse and search songs, play, favorites, playlists (CRUD, add, remove, reorder).
- Friends: search by username or email (debounced, paginated), send request, accept, reject, cancel, remove, list. Use a unique compound index to prevent duplicates, and cache friend lists in Redis.
- Couples: after a friend accepts, I can open a Couples room and invite them. Both hear the same song at the same moment.
- Party: create a room and invite many friends, all in sync.
- Room control: the host controls play, pause, seek, next, previous and change song. The host can grant or revoke control permission per member, and permitted members get the same buttons. Every control event is checked on the server.
- Shared queue, playlists, search and favorites work inside rooms.
- Exit safety: show a confirmation dialog on Leave, browser back and tab close. If the host leaves, offer "transfer host" or "end room".

REAL-TIME SYNC DESIGN
- The server holds the authoritative playback state in Redis: trackId, isPlaying, positionMs, serverTimestamp, version.
- Clients measure clock offset with ping/pong time sync. On play, the server broadcasts a scheduled start time so all clients start together. Late joiners receive the state and seek to the correct position. Add periodic drift correction.
- Handle presence, reconnects, rate limiting per socket, and payload validation. All event names come from constants.

AUDIO SOURCE
Do not use the Spotify Playback SDK (it needs Premium and can't sync others). Use a licensed source behind a `IMusicProvider` interface (Jamendo API, or own tracks on S3/Cloudinary with a CDN), so the provider can be swapped.

PHASES (stop after each)
1. Architecture: folder trees, Mongo collections with indexes, REST API list, socket events, Redis keys. No code.
2. Backend foundation (config, DI, DB and Redis connections, response helper, errors, logger, health check).
3. Auth module.
4. User, theme preference and friends modules.
5. Songs, playlists and favorites.
6. Socket rooms and sync (Couples and Party).
7. Backend performance and security review with a checklist.
8. Frontend foundation and theme system.
9. Auth, home and friends UI.
10. Solo player UI and audio hook.
11. Room UI (invites, members and permissions, synced player, shared queue, exit dialogs).
12. Final audit against these rules, plus tests (unit for services, integration for room sync) and a deployment plan (Docker, Nginx, Redis, Mongo replica set).

Start with Phase 1 only.
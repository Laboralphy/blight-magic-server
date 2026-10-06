# Blight Magic Server

npm-workspaces monorepo, TypeScript (pinned ~6.0: typescript-eslint does not support 7 yet), ESM,
packages consumed as TS source (no build step except the client). Children run through tsx.

## Commands

- `npm run dev`: server (tsx watch, :3000) + Vite client (:5173, proxies /ws and /api)
- `npm run check`: typecheck + eslint + prettier + vitest (all must pass)
- `npx vitest run --project server|games|protocol|client`

## Rules

- Java-like style: classes and interfaces, **one class per file, named after the file** (enforced
  for server by `packages/server/tests/architecture.test.ts`).
- Server layers: domain → application → infrastructure → boot. Only `boot/` imports awilix and
  `@blight/games`. Use cases export a `XxxDeps` type and destructure it in the constructor; never import
  the `Cradle` outside `boot/`. New registrations go in `boot/container.ts` (typed `Registrations<Cradle>`).
- Use cases report expected failures with `DomainError` (code + message). `ClientConnection` maps them
  to `system.error` / `auth.error`.
- Wire messages are defined only in `@blight/protocol`. Client→main messages are zod-validated in
  `ClientConnection`, main→child messages in `ParentChannel`. Child→main messages are trusted and not
  validated (hot path).
- Gateway relay: clients only ever connect to main. Chat (txat) lives only in main.
- Prettier: 4 spaces, single quotes, width 100.

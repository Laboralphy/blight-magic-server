# Blight Magic Server

A multiplayer WebSocket server. The main process hosts the lobby and the chat, and each game runs in
its own child process.

## Quick start

```sh
npm install
npm run dev        # server on :3000 (tsx watch) + Vite client on :5173
```

Open http://localhost:5173 in two browser tabs. Log in with two different names, then:

| Command                 | Effect                                                        |
| ----------------------- | ------------------------------------------------------------- |
| `/create {type} {name}` | spawns a game child process and joins it (`type` unused: dot) |
| `/list`                 | running games with their id                                   |
| `/join {game_id}`       | joins a game (leaves the current one first)                   |
| `/leave`                | back to the lobby                                             |
| `/help`                 | command list                                                  |

Click the arena, then move with the arrow keys, ZQSD or WASD.

Production-like run: `npm run build && npm start`. The server then also serves `packages/client/dist`
on :3000.

Checks: `npm run check` runs typecheck, eslint, prettier and vitest.

## Architecture

```
browser ──ws /ws──▶ MAIN PROCESS (Koa + ws, chat, use cases)
                      │  IPC (child_process.fork)   │
                      ▼                             ▼
                 game child #1                 game child #2
```

**Gateway relay.** A client only ever holds one WebSocket, to the main process:

- Game inputs go client → main → IPC → child.
- Game snapshots go child → IPC → main → clients. Main serialises each snapshot once and writes it to N sockets.
- The chat lives only in main, so players inside a game chat without any relay. A game can still post
  in its own chat room (`chat.post` IPC message), for example "bob enters the arena."
- A crashed child does not affect main: its players go back to the lobby, and the chat keeps working.

| Package            | Role                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `@blight/protocol` | wire contracts: zod schemas for client↔main messages, typed IPC messages main↔child                  |
| `@blight/games`    | `host/`: `GameProcessManager` (fork, track, kill), used by main · `child/`: game runtime + `DotGame` |
| `@blight/server`   | main process, Clean Architecture + Awilix (see below)                                                |
| `@blight/client`   | Vue 3 + Pinia + Vite, canvas rendering                                                               |

`packages/server/src` layers, enforced by `tests/architecture.test.ts`:

- `domain/`: entities, `DomainError`, repository ports. Only zod.
- `application/`: use cases (`LoginUser`, `JoinGame`, …) and service ports (`IChatService`,
  `IGameProcessManager`, …). No framework, no I/O.
- `infrastructure/`: adapters, including txat chat, ws gateway, Koa, commands and in-memory repositories.
- `boot/`: composition root. This is the only place that imports awilix and `@blight/games`.

Every class declares its own `XxxDeps` type. The container checks at compile time that it can provide
them, and resolves them in `strict` mode.

The persistence layer is in-memory behind `IUserRepository`. To switch to json-db or anything else,
write one adapter and change one line in the container.

## Feasibility notes (measured on this POC)

- Spawning a game child takes about 0.3 s (Node + tsx boot).
- IPC: `serialization: 'advanced'`. Games tick at 20 Hz and broadcast only when something changed.
- Each child costs about 30–50 MB of RSS. That is fine for dozens of games. For hundreds, host several
  games per child: IPC messages are already scoped by game.
- If main's socket I/O ever becomes the bottleneck, children can expose their own WebSocket behind the
  same `IGameProcessManager` port (the "direct" model).
- `@laboralphy/raycaster386/simulation` is DOM-free, so it can run inside the children for authoritative
  movement and collisions. Not used yet.

## Next steps

- Client-side prediction: inputs already carry `seq`, and snapshots carry `ackSeq` per player.
- Raycaster-based FPS game type in `games/src/child/`, chosen by `GameFactory` from `type`.
- Real authentication and persistence (json-db adapter).
- Admin-only commands, WebSocket heartbeat, and a production build of the server and children
  (plain JS instead of tsx).

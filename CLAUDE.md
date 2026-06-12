# Faceless — Nextbot Chase Game (Project Brief)

> This doc doubles as `CLAUDE.md` (persistent context for Claude Code) and a build plan.
> Build it in the phases below, one at a time, meeting each phase's acceptance criteria before moving on.

## Vision

A browser-based first-person horror-chase game in the style of Garry's Mod **Nextbots**. The player runs through a maze-like map while a flat 2D billboard sprite — **a face the player uploads** — slides toward them, always facing the camera, footstep/breathing audio swelling as it closes in. It reaches you → jumpscare → game over. Aesthetic is lo-fi, liminal, slightly janky *on purpose*.

**The hook:** upload any photo, and that face becomes the thing chasing you.

**Reference vibe (the videos can't be watched, so:):** a meme-face sprite floating and sliding through a 3D level, beelining at the player, always facing the camera, footsteps crescendoing as it nears, a jumpscare on catch. Think "creepy floating head in the backrooms."

## Stack

- **Vite + React 19 + TypeScript**
- **@react-three/fiber@9** (must pair with React 19)
- **@react-three/drei** — use `PointerLockControls`, `Billboard`, `useTexture`, `PositionalAudio`, `Sky`/`Environment`
- **three.js** (latest, pulled in via fiber)
- **Tailwind** for the menu/HUD (DOM overlay, *not* drawn in the canvas)
- **Zustand** for game state (tiny, ideal for a state machine)
- *(optional, see Phase notes)* **@react-three/rapier** for collision + a kinematic character controller
- **Desktop shell: Tauri 2** (see Phase 8) — this runs as a desktop app from the repo, not a published/distributed product. A web build on Vercel is still possible but isn't the goal.

**Version gotcha:** `@react-three/fiber@9` ↔ `react@19` ↔ `react-dom@19` — keep the majors aligned. If `npm install` throws `ERESOLVE`/peer-dep errors, a stray `react@18` in the tree is the usual cause. Pick the latest `@react-three/drei` that lists fiber@9 as a peer.

## Architecture

- **DOM layer** (React + Tailwind): menu, upload UI, HUD (timer/stamina), game-over screen — absolutely positioned over the canvas.
- **Canvas layer** (R3F): a single `<Canvas>` holding the 3D game.
- **State machine** (Zustand): `menu → playing → caught`, plus the uploaded image URL and run stats.
- **Upload pipeline:** file input → `URL.createObjectURL(file)` → `useTexture` / `TextureLoader` → applied to the bot billboard's material. Revoke the object URL on unmount.
- **Game loop:** one `useFrame` driving player movement, bot movement, and the distance/catch check.
- **Audio:** must start on the "Start" click — browsers block audio before a user gesture.

## Build phases

Each phase is a discrete Claude Code task. Don't start the next until the acceptance criteria pass.

### Phase 0 — Scaffold
Vite + React + TS project, Tailwind, fiber/drei/zustand installed, a fullscreen `<Canvas>` rendering a lit floor plane.
**Done when:** dev server runs, you see a floor, no console errors.

### Phase 1 — First-person controller
WASD movement + mouse look via `PointerLockControls` (click to lock, Esc to release). Gravity so the player stays grounded. Sprint on Shift.
**Done when:** you can walk and look around a flat plane smoothly; sprint is noticeably faster.

### Phase 2 — The map
A simple maze: a grid of corridors built from box walls, with an outer boundary. Walls block the player (start with manual AABB collision + wall-sliding; **if collision gets fiddly, switch to `@react-three/rapier`'s `KinematicCharacterController`** — it handles sliding for free). Keep the map data as a 2D grid array so pathfinding can reuse it later.
**Done when:** you can't walk through walls and don't get stuck on corners.

### Phase 3 — Static nextbot
A `<Billboard>` plane at the far end of the map, textured with a placeholder face image, always facing the camera regardless of player angle. No movement yet.
**Done when:** the face stares at you from every angle, scaled to a believable "person" height.

### Phase 4 — It moves, then it chases
Step 4a: bot moves in a straight line toward the player's position every frame (the classic janky beeline — it'll bump walls, that's fine for now).
Step 4b *(the big upgrade)*: **A\* pathfinding** on the maze grid. The bot recomputes a path to the player's cell every ~0.3s and follows it, so it rounds corners and feels *alive*.
**Done when:** the bot pursues you around corners instead of pressing into walls.

### Phase 5 — Upload flow
Menu screen: file input (accept `image/*`), preview the chosen face, "Start" button. On start, the uploaded image becomes the bot's texture and the run begins.
**Done when:** uploading a selfie makes *that face* the chaser.

### Phase 6 — Catch + game over
When `distance(player, bot) < CATCH_DISTANCE`: freeze input, the face rushes/scales to fill the screen (jumpscare), play a stinger, show a game-over screen with a "Run again" button.
**Done when:** getting caught is genuinely a jolt and you can restart.

### Phase 7 — Audio + juice
- Bot footstep/breathing loop via `PositionalAudio` (refDistance ~5, maxDistance ~40) so it swells as it nears.
- Looping low chase drone (starts on Start click).
- Red vignette + subtle screen shake + faster heartbeat as `distance` shrinks.
**Done when:** you can feel it behind you without looking.

### Phase 8 — Run as a desktop app (personal use, from the repo)

**Scope:** not for distribution. No installers, code signing, auto-update, or cross-platform builds. The goal is just to launch the game in its own native window from the cloned repo. Same Vite + R3F code — only a thin desktop shell is added.

**Recommended: Tauri 2.** All-JS alternative is **Electron** (no Rust toolchain; clone-and-run with only Node — see note at the end).

**One-time setup (Tauri):** install Rust via `rustup`. On Windows, WebView2 ships with Win10/11 (also need MSVC build tools); on macOS, install Xcode Command Line Tools.

**Add Tauri to the existing Vite project:**
- `npm install -D @tauri-apps/cli` then `npx tauri init`
- `tauri.conf.json`: `devUrl` → Vite dev server (e.g. `http://localhost:5173`), `frontendDist` → `../dist`
- `vite.config.ts`: set `base: './'`
- `tauri.conf.json` CSP: add `blob:` to `img-src` and `media-src` so the uploaded-face texture and audio load

**Run it:**
- Dev (the normal way you'll use it): `npm run tauri dev` — opens the game in a native window with hot reload
- Optional local build: `npm run tauri build` → runnable binary in `src-tauri/target/release` (for your machine only, unsigned, that's fine)

**Optional nicety:** swap the browser file input for Tauri's native picker — `@tauri-apps/plugin-dialog` (open) + `@tauri-apps/plugin-fs` (read image → blob → texture). Also set a fixed window title/size and a fullscreen toggle in `tauri.conf.json`.

**Done when:** `npm run tauri dev` opens the game in its own window, pointer-lock/mouse-look works, you can upload a face, and the chase + jumpscare run exactly as in the browser.

**Gotchas (these cause a blank window or a missing face):**
1. Forgot `base: './'` → blank window in the built app.
2. CSP doesn't allow `blob:` → the uploaded face texture silently fails to load.
3. Audio still needs the Start-click gesture (already handled by the menu).

**Electron alternative (stay 100% JS, no Rust):** scaffold with `npm init electron-app@latest -- --template=vite-typescript` (or add `electron` + `electron-builder` to the repo). The main process opens a `BrowserWindow` loading the Vite build; set Vite `base: './'`; run with `npm start`. Heavier app, but anyone can clone the repo and run it with just Node installed.

## Tuning constants (starting values — tweak for feel)

```ts
const PLAYER_WALK   = 4.0;   // m/s
const PLAYER_SPRINT = 7.0;   // m/s
const BOT_SPEED     = 5.7;   // between walk and sprint: you MUST sprint to gain ground
const CATCH_DISTANCE= 1.2;   // meters
const FOV           = 75;
const MOUSE_SENS    = 0.002;
const PATH_REFRESH  = 0.3;   // seconds between A* recomputes
const AUDIO_REF     = 5;     // PositionalAudio refDistance
const AUDIO_MAX     = 40;    // PositionalAudio maxDistance
```

The single most important number is `BOT_SPEED` relative to `PLAYER_SPRINT`: keep it just under sprint so the player can *barely* outrun it, never by walking. That gap is the whole game.

## Stretch (after the MVP is fun)

- **Stamina bar** — sprint drains it; forces risk/reward.
- **Survival timer + local high score.**
- **Endless / procedural maps**, then **multiple nextbots** with escalating difficulty.
- **Minimap.**
- **Mobile touch controls** (virtual joystick + drag-look) — big reach upgrade.
- **Face framing tool** on upload (crop/center any photo so it sits right on the sprite).
- **Optional background removal** of the uploaded face for the classic floating-head cutout look.

## Non-negotiables (tell Claude Code these explicitly)

1. Bot sprite **always faces the camera** (`Billboard`).
2. Upload → `createObjectURL` → texture → bot material; revoke URL on cleanup.
3. Movement uses **PointerLockControls**; click-to-lock.
4. Bot footstep audio is **distance-based** (`PositionalAudio`).
5. All audio starts on the **Start click**, never on load.
6. Keep tuning constants in **one config file** so feel is easy to tweak.

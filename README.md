# FACELESS

> Upload any photo. That face becomes the thing chasing you.

**Faceless** is a browser-based first-person horror-chase game in the style of Garry's Mod **Nextbots**. You sprint through the streets of a fog-drowned city at night while a flat 2D billboard sprite — *a face you upload* — slides relentlessly toward you, always staring at the camera, footsteps and breathing swelling as it closes in. When it touches you: jumpscare, game over, run again.

The aesthetic is lo-fi, liminal, and slightly janky **on purpose** — a creepy floating head beelining at you down empty streets under flickering streetlights.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js%20(R3F)-000000?logo=threedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri&logoColor=black)

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Running as a desktop app](#running-as-a-desktop-app)
- [Controls](#controls)
- [How to play](#how-to-play)
- [Available scripts](#available-scripts)
- [Configuration & tuning](#configuration--tuning)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Upload any face.** Pick any photo and it instantly becomes the chaser — a billboard sprite that always faces the camera from every angle, GMod Nextbot style. A built-in placeholder face ships so you can play immediately.
- **A living night-city.** The world is a city after dark: a skyline of low shops and looming towers studded with glowing windows, warm streetlights pooling on wet asphalt, lit shopfronts and the odd neon sign, everything dissolving into fog. The layout is the same grid the bot navigates, so the city you see *is* the maze you run.
- **A\* pathfinding chaser.** The bot recomputes a route to your cell on the street grid roughly three times a second, rounding corners and feeling *alive* — not just pressing blindly into buildings.
- **A chase you can barely win.** The bot moves just under your sprint speed, so you only outrun it by sprinting — and **bunny-hopping** (chaining jumps for an airborne speed boost) is how you actually pull ahead.
- **Full gamepad support.** Play with mouse + keyboard or an Xbox / standard controller — analog stick movement, twin-stick look, and menu navigation, all interchangeable.
- **Procedurally synthesized audio.** No sound files ship with the repo. Footsteps and breathing (positional — they swell as the bot nears), a low chase drone, a racing heartbeat, and a jumpscare stinger are all generated in code at runtime.
- **Horror juice.** A red vignette, screen shake, FOV pulse, and a heartbeat that quickens all ramp up as the bot closes the distance — you feel it behind you without looking.
- **Jumpscare on catch.** The face rushes the camera and blows up to fill the screen, the stinger hits, and a game-over panel lets you run again or change face.
- **Survival timer + local best.** Every run is timed, and your best is saved locally.
- **Browser or desktop.** Runs in any modern browser, or as a native desktop window via **Tauri 2** or **Electron**.

## Tech stack

| Area | Choice |
| --- | --- |
| Build tool | Vite 8 |
| UI framework | React 19 + TypeScript |
| 3D rendering | [@react-three/fiber 9](https://github.com/pmndrs/react-three-fiber) + [@react-three/drei 10](https://github.com/pmndrs/drei) (three.js 0.184) |
| Styling (DOM overlay) | Tailwind CSS 4 |
| State | Zustand 5 |
| Desktop shell | Tauri 2 (Rust) or Electron 42 (pure Node) |

Collision is hand-rolled AABB wall-sliding against a 2D grid (no physics engine), and all audio **and every city texture** (building facades, shopfronts, asphalt, light-pools) is synthesized on a canvas at runtime — the project ships **zero binary assets**.

---

## Getting started

### Prerequisites

- **[Node.js](https://nodejs.org/)** 20.19+ or 22.12+ (22 LTS recommended) with npm.
- A modern browser with WebGL2 and pointer-lock support (Chrome, Edge, Firefox).

> Desktop builds have extra prerequisites — see [Running as a desktop app](#running-as-a-desktop-app).

### Install & run (browser)

```bash
# 1. Clone the repo
git clone <your-repo-url> faceless
cd faceless

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open the URL Vite prints (default **http://localhost:5173**), click **UPLOAD FACE** to pick a photo (or just hit **START** with the placeholder), then **click the canvas to step into the street** and run.

### Production build

```bash
npm run build     # type-checks, then bundles to dist/
npm run preview   # serves the built bundle locally to verify it
```

---

## Running as a desktop app

This game is built to run as a **personal desktop app from the repo** — it is not a distributed/published product (no installers, signing, or auto-update). Two shells are included; pick whichever toolchain you have.

### Option A — Electron (pure Node, no Rust)

The simplest path: anyone with Node can clone and run it.

```bash
npm run app:dev   # dev mode: Vite hot reload inside a native Electron window
npm run app       # production: builds dist/ then launches Electron against it
```

### Option B — Tauri 2 (smaller, native WebView)

Requires the **Rust toolchain** (install via [rustup](https://rustup.rs/)) plus platform dependencies:

- **Windows** — WebView2 (ships with Windows 10/11) and MSVC C++ build tools.
- **macOS** — Xcode Command Line Tools (`xcode-select --install`).
- **Linux** — `webkit2gtk` and related dev packages (see the [Tauri prerequisites](https://tauri.app/start/prerequisites/)).

```bash
npm run tauri dev     # opens the game in a native window with hot reload
npm run tauri build   # optional: unsigned local binary in src-tauri/target/release
```

Both shells open a 1280×720 window titled **Faceless**, grant pointer-lock without a prompt, and run the exact same game code as the browser.

---

## Controls

| Action | Keyboard / Mouse | Gamepad (Xbox / standard) |
| --- | --- | --- |
| Move | `W` `A` `S` `D` / Arrow keys | Left stick |
| Look | Mouse | Right stick |
| Sprint | `Shift` | `LB` / `LT` / left-stick click |
| Jump / bunny-hop | `Space` (hold to chain hops) | `A` (hold to chain hops) |
| Enter the streets | Click the canvas | automatic on first input |
| Release the mouse | `Esc` | — |
| Start / Run again | on-screen button | `A` or `Start` |

A controller plays without ever needing to grab the mouse, so the "click to enter" prompt disappears as soon as a pad is detected.

## How to play

1. **Upload a face** (or use the placeholder) and press **START** — this is also the only moment audio is allowed to begin, so make sure your volume is set.
2. **Click to step into the street**, then run. You spawn at one corner of the city; the bot lurks at the opposite one.
3. **Sprint to survive.** Walking is *not* fast enough — the bot will reel you in. You must sprint, and you must keep moving.
4. **Bunny-hop to pull ahead.** Chaining jumps gives an airborne speed multiplier; rhythmic hopping is the difference between barely escaping and getting caught.
5. **Read the room without looking back.** The vignette reddens, the screen shakes, the heartbeat races, and the footsteps get louder the closer it is. Trust your ears.
6. **Don't get cornered.** The streets are laid out mostly as loops, so there's usually another way out — use them.
7. **Beat your best.** Each run is timed and your record persists between sessions.

---

## Available scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server (browser) with hot reload. |
| `npm run build` | Type-check (`tsc -b`) and produce a production bundle in `dist/`. |
| `npm run preview` | Serve the production bundle locally. |
| `npm run lint` | Run ESLint over the project. |
| `npm run check:map` | Validate the street grid: rectangular, sealed boundary, exactly one player/bot spawn, every street cell reachable, and a dead-end report. |
| `npm run app:dev` | Launch the Electron desktop shell in dev mode (hot reload). |
| `npm run app` | Build, then launch the Electron desktop shell against the bundle. |
| `npm run tauri dev` | Launch the Tauri desktop shell in dev mode. |
| `npm run tauri build` | Produce a local (unsigned) Tauri binary. |

---

## Configuration & tuning

Every gameplay number — and every atmosphere knob — lives in **one file**: [`src/config.ts`](src/config.ts). Tweak feel there and nowhere else. The most important gameplay values:

```ts
export const PLAYER_WALK   = 4.0   // m/s
export const PLAYER_SPRINT = 7.0   // m/s
export const BOT_SPEED     = 6.6   // just under sprint — THE number that makes the chase
export const CATCH_DISTANCE= 1.2   // meters — how close is "caught"
export const JUMP_SPEED    = 8.0   // upward impulse
export const BHOP_SPEED_MULT = 1.18 // horizontal speed multiplier while airborne
export const PATH_REFRESH  = 0.3   // seconds between A* recomputes
```

The single most important tuning knob is `BOT_SPEED` relative to `PLAYER_SPRINT`: keep it just under sprint so the player can *barely* outrun it — never by walking. That gap is the whole game. The file also holds audio falloff distances, jumpscare timing, the threat/vignette/shake ramp, and a **City / night atmosphere** section: building heights (`BUILDING_TIERS`), streetlight count and brightness (`LAMP_COUNT`, `LAMP_LIGHT_INTENSITY`), shopfront density (`SHOPFRONT_OPEN_CHANCE`), and fog depth.

To redesign the city's street layout, edit the ASCII `LAYOUT` grid in [`src/map.ts`](src/map.ts) (`#` building · `.` street · `P` player spawn · `B` bot spawn), then run `npm run check:map` to confirm it's valid.

---

## Project structure

```
faceless/
├─ src/
│  ├─ main.tsx          # React entry point
│  ├─ App.tsx           # composes the R3F canvas + DOM overlay, lighting, fog
│  ├─ config.ts         # ← all gameplay tuning constants
│  ├─ store.ts          # Zustand state machine: menu → playing → caught, best score
│  ├─ live.ts           # per-frame shared values (distance, threat) without re-renders
│  ├─ map.ts            # ASCII street grid → collision grid + coordinate helpers
│  ├─ pathfinding.ts    # A* over the street grid
│  ├─ collision.ts      # AABB wall-sliding against the grid
│  ├─ Player.tsx        # first-person controller (keyboard + gamepad + pointer lock)
│  ├─ gamepad.ts        # Gamepad API polling (move / look / sprint / jump / confirm)
│  ├─ Bot.tsx           # the chaser: billboard sprite, path-following, jumpscare
│  ├─ Maze.tsx          # builds the night-city (buildings, streetlights, shopfronts, road) from the grid
│  ├─ Menu.tsx          # upload + start screen
│  ├─ Hud.tsx           # survival timer + red vignette
│  ├─ GameOver.tsx      # game-over panel
│  ├─ AudioRig.tsx      # non-positional audio: drone, heartbeat, stinger
│  ├─ ShakeRig.tsx      # proximity screen shake + FOV pulse
│  ├─ audio.ts          # runtime-synthesized audio buffers (no sound files)
│  ├─ textures.ts       # runtime-synthesized city textures (facades, shopfronts, asphalt, glow)
│  └─ placeholderFace.ts# the built-in default face
├─ scripts/check-map.mjs# street-grid validator (npm run check:map)
├─ electron/main.cjs    # Electron desktop shell
├─ src-tauri/           # Tauri 2 desktop shell (Rust)
├─ vite.config.ts       # Vite config (base: './' for the desktop builds)
└─ config & tooling     # TypeScript, ESLint, Tailwind
```

## How it works

- **Two layers, one screen.** A single R3F `<Canvas>` renders the 3D game; the menu, HUD, and game-over screens are absolutely-positioned DOM (React + Tailwind) on top — never drawn inside the canvas.
- **State machine.** A tiny Zustand store drives `menu → playing → caught`, holding the uploaded face URL and run stats. Components mount/unmount per phase (e.g. the player controller only exists while `playing`).
- **Upload pipeline.** The file input becomes a texture via `URL.createObjectURL(file)` → drei's `useTexture`, applied to the bot's `Billboard` material; the object URL is revoked on cleanup so blobs don't leak.
- **The billboard.** The bot is a single textured plane wrapped in drei's `<Billboard>`, so it always faces the camera. It's unlit and untonemapped, so the face stays full-bright in the dark.
- **The city *is* the collision grid.** Buildings are instanced boxes placed straight from the same `map.ts` grid the bot navigates, so what you see and what you bump into can never drift apart. Building *height* is purely cosmetic (collision is 2D, footprint-only), which is why towers can loom over one-storey shops on the same block. Every surface — windows, shopfronts, asphalt, lamp light-pools — is painted on a `<canvas>` at load (see [`src/textures.ts`](src/textures.ts)), the same trick the audio uses, and the streets stay dark on purpose so the city's own lights do the lighting.
- **Pursuit.** Each tick the bot follows its cached A* waypoints toward your cell; the deliberate path staleness (recomputed only every `PATH_REFRESH` seconds) gives it that overshoot-the-corner Nextbot jank. With no path left it falls back to a straight-line beeline.
- **Audio is gesture-safe.** Browsers block audio before a user gesture, so the `AudioContext` is born inside the **Start** click. Footsteps use `PositionalAudio` (distance-based falloff); the drone, heartbeat, and stinger are non-positional. Every buffer is deterministically synthesized in [`src/audio.ts`](src/audio.ts).
- **Effects don't lie to gameplay.** Screen shake nudges the *world group*, not the camera, and the catch check reads true positions — so the juice never affects where the player actually is or where the bot can catch them.

---

## Troubleshooting

- **Blank window in the desktop build** — usually a missing `base: './'` in `vite.config.ts` (already set here). Rebuild with `npm run build`.
- **The uploaded face doesn't appear** — a Content-Security-Policy that blocks `blob:` URLs silently fails the texture load. The Tauri CSP already allows `blob:` for `img-src`/`media-src`.
- **No sound** — audio only starts on the **Start** click (by design and by browser policy). If it's still silent, check the page/OS volume and that the tab isn't muted.
- **`ERESOLVE` / peer-dependency errors on install** — keep the React majors aligned; a stray `react@18` in the tree breaks the `@react-three/fiber@9` ↔ `react@19` pairing. Delete `node_modules` and `package-lock.json` and reinstall.
- **Pointer lock won't engage** — click directly on the game canvas (not the HUD), and press `Esc` to release. A connected controller bypasses pointer lock entirely.
- **Streets too dark or too bright** — tune `LAMP_LIGHT_INTENSITY`, `LAMP_COUNT`, and `SHOPFRONT_OPEN_CHANCE` in [`src/config.ts`](src/config.ts), or the ambient/moonlight intensities in `App.tsx`. The night is meant to be murky — the bot is unlit, so it stays readable however dark the street gets.

---

*A personal project — built for the love of janky floating-head horror.*

// All gameplay tuning lives here — tweak for feel, nowhere else.
export const PLAYER_WALK = 4.0 // m/s
export const PLAYER_SPRINT = 7.0 // m/s
// Just under PLAYER_SPRINT, so plain sprinting only barely gains ground and
// bunny-hopping gains it faster. Bumped from 5.7 now that jumping adds speed —
// this is THE number that makes or breaks the chase, tune it first.
export const BOT_SPEED = 6.6
export const CATCH_DISTANCE = 1.2 // meters
export const FOV = 75
export const MOUSE_SENS = 0.002

// Jump / bunny-hop. Hold Space (or A) to chain hops; airborne movement is
// faster, so rhythmic hopping is how you outrun the bot — see BOT_SPEED.
export const JUMP_SPEED = 8.0 // m/s upward impulse (apex ~1.3m, ~0.6s airtime under GRAVITY)
export const BHOP_SPEED_MULT = 1.18 // horizontal speed multiplier while airborne

// Gamepad (Xbox / standard mapping)
export const GAMEPAD_LOOK_SPEED = 2.7 // rad/s at full right-stick deflection
export const STICK_DEADZONE = 0.16 // ignore stick drift below this magnitude
export const PATH_REFRESH = 0.3 // seconds between A* recomputes
export const WAYPOINT_RADIUS = 0.35 // meters — how close before the bot snaps to the next waypoint
export const AUDIO_REF = 5 // PositionalAudio refDistance
export const AUDIO_MAX = 40 // PositionalAudio maxDistance

export const PLAYER_HEIGHT = 1.7 // camera eye height, meters
export const GRAVITY = 25 // m/s² — gamey on purpose, snaps the player to the floor
export const PLAYER_RADIUS = 0.35 // collision half-width, meters

export const CELL_SIZE = 4 // maze cell, meters — corridors are one cell wide
export const WALL_HEIGHT = 4 // meters — tall enough that you can't see over

export const BOT_HEIGHT = 2.8 // sprite height, meters — looms over a 1.7m player
export const BOT_RADIUS = 0.4 // bot collision half-width, meters (unchanged: it still threads corridors)
export const BOT_FLOAT = 0.12 // hover above the floor, meters

export const JUMPSCARE_SNAP = 0.06 // seconds to close ~63% of the rush — smaller = more violent
export const JUMPSCARE_SCALE = 2.4 // how big the face grows during the rush
export const GAMEOVER_DELAY = 900 // ms between the catch and the game-over panel

export const THREAT_DISTANCE = 24 // meters — vignette/heartbeat/shake ramp in from here down to CATCH_DISTANCE
export const SHAKE_MAX = 0.035 // meters of camera jitter at threat 1
export const FOV_PULSE = 4 // degrees of FOV widening at threat 1

// ── City / night atmosphere ─────────────────────────────────────────────────
// The collision + pathfinding grid in map.ts is unchanged: every '#' is a
// building, every '.' a street. These knobs only drive how the city LOOKS, so
// tweak them freely. Building height is independent of collision (which is 2D,
// footprint-only), so towers can loom without changing where you can walk.
export const BUILDING_TIERS = [6, 11, 17, 26] // building heights, meters: low shop → tower
export const FACADE_VARIANTS = 5 // distinct window/wall palettes, assigned per building
export const WINDOW_PITCH_V = 3.0 // meters per window row (one storey) — keeps windows uniform across heights

export const LAMP_COUNT = 34 // streetlights; spaced out (see Maze) so every street gets pools of light
export const LAMP_SPACING = 9 // meters — minimum gap between lamps when distributing them
export const LAMP_HEIGHT = 4.6 // meters
export const LAMP_LIGHT_INTENSITY = 42 // raise for brighter streets, lower for moodier dark
export const LAMP_LIGHT_DISTANCE = 24 // meters until the light falls to zero
export const LAMP_GLOW_RADIUS = 7.5 // ground light-pool radius, meters

export const SHOPFRONT_OPEN_CHANCE = 0.7 // fraction of street-level bays that are a lit shop (rest shuttered)

// Night fog: lifted off pure black to a dark blue so distance reads as haze,
// not a wall. NEAR pushed back so the near street stays clear and navigable.
export const FOG_NEAR = 14 // meters
export const FOG_FAR = 66

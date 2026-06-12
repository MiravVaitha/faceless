// All gameplay tuning lives here — tweak for feel, nowhere else.
export const PLAYER_WALK = 4.0 // m/s
export const PLAYER_SPRINT = 7.0 // m/s
export const BOT_SPEED = 5.7 // between walk and sprint: you MUST sprint to gain ground
export const CATCH_DISTANCE = 1.2 // meters
export const FOV = 75
export const MOUSE_SENS = 0.002
export const PATH_REFRESH = 0.3 // seconds between A* recomputes
export const WAYPOINT_RADIUS = 0.35 // meters — how close before the bot snaps to the next waypoint
export const AUDIO_REF = 5 // PositionalAudio refDistance
export const AUDIO_MAX = 40 // PositionalAudio maxDistance

export const PLAYER_HEIGHT = 1.7 // camera eye height, meters
export const GRAVITY = 25 // m/s² — gamey on purpose, snaps the player to the floor
export const PLAYER_RADIUS = 0.35 // collision half-width, meters

export const CELL_SIZE = 4 // maze cell, meters — corridors are one cell wide
export const WALL_HEIGHT = 4 // meters — tall enough that you can't see over

export const BOT_HEIGHT = 1.9 // sprite height, meters — person-sized
export const BOT_RADIUS = 0.4 // bot collision half-width, meters
export const BOT_FLOAT = 0.12 // hover above the floor, meters

export const JUMPSCARE_SNAP = 0.06 // seconds to close ~63% of the rush — smaller = more violent
export const JUMPSCARE_SCALE = 2.4 // how big the face grows during the rush
export const GAMEOVER_DELAY = 900 // ms between the catch and the game-over panel

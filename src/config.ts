// All gameplay tuning lives here — tweak for feel, nowhere else.
export const PLAYER_WALK = 4.0 // m/s
export const PLAYER_SPRINT = 7.0 // m/s
export const BOT_SPEED = 5.7 // between walk and sprint: you MUST sprint to gain ground
export const CATCH_DISTANCE = 1.2 // meters
export const FOV = 75
export const MOUSE_SENS = 0.002
export const PATH_REFRESH = 0.3 // seconds between A* recomputes
export const AUDIO_REF = 5 // PositionalAudio refDistance
export const AUDIO_MAX = 40 // PositionalAudio maxDistance

export const PLAYER_HEIGHT = 1.7 // camera eye height, meters
export const GRAVITY = 25 // m/s² — gamey on purpose, snaps the player to the floor

export const SESSION_DURATION_MINUTES = 90;
export const SESSION_DURATION_MS = SESSION_DURATION_MINUTES * 60 * 1000;

/** Window (ms) within which a second session by the same user at the same spot is considered a duplicate */
export const DUPLICATE_WINDOW_MS = 15 * 60 * 1000;

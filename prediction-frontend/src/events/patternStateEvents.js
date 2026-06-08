export const PATTERN_STATE_UPDATED_EVENT = "pattern-state-updated";

export function dispatchPatternStateUpdated() {
  if (typeof window === "undefined") return;
  if (import.meta.env.DEV) {
    console.debug(`[${new Date().toISOString()}] PATTERN STATE REFRESH`, {
      event: PATTERN_STATE_UPDATED_EVENT,
    });
  }
  window.dispatchEvent(new Event(PATTERN_STATE_UPDATED_EVENT));
}

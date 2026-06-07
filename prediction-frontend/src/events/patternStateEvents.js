export const PATTERN_STATE_UPDATED_EVENT = "pattern-state-updated";

export function dispatchPatternStateUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PATTERN_STATE_UPDATED_EVENT));
}

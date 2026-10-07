// A single mutable store read by every animated thing. Nothing here triggers React renders:
// the GSAP ticker writes it, DOM "drivers" and R3F frames read it on the same tick.

export type ExperienceState = {
  /** Timeline position in units (see sceneConfig). Source of truth for every scene. */
  t: number;
  /** Raw scroll velocity (units / frame), smoothed. Used for tiny secondary motion only. */
  velocity: number;
  /** Elapsed seconds. */
  time: number;
  /** Viewport in CSS px. */
  width: number;
  height: number;
  aspect: number;
  isMobile: boolean;
  isTouch: boolean;
  /** Pointer in -1..1 (smoothed). */
  pointer: { x: number; y: number; tx: number; ty: number; px: number; py: number };
  ready: boolean;
  /** 0 → 1 once the loader has opened; gates the first-screen entrance. */
  intro: number;
};

export const state: ExperienceState = {
  t: 0,
  velocity: 0,
  time: 0,
  width: 1440,
  height: 900,
  aspect: 1.6,
  isMobile: false,
  isTouch: false,
  pointer: { x: 0, y: 0, tx: 0, ty: 0, px: -100, py: -100 },
  ready: false,
  intro: 0,
};

type Driver = (s: ExperienceState) => void;
const drivers = new Set<Driver>();

/** Register a per-frame DOM updater. Returns an unsubscribe function. */
export function addDriver(fn: Driver) {
  drivers.add(fn);
  // run once immediately so the first paint (and a refresh mid-page) is already correct
  fn(state);
  return () => {
    drivers.delete(fn);
  };
}

export function runDrivers() {
  drivers.forEach((d) => d(state));
}

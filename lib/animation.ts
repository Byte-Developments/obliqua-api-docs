// Small, allocation-free helpers used by every scene. All scroll animation is derived from a
// single timeline value, so these are pure functions of that value (reverse scrolling is free).

export const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Normalised progress of `t` through [a, b], clamped to 0..1. */
export const range = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

export const smoothstep = (a: number, b: number, t: number) => {
  const x = range(t, a, b);
  return x * x * (3 - 2 * x);
};

/** Fade in over [a,b], hold, fade out over [c,d]. */
export const window4 = (t: number, a: number, b: number, c: number, d: number) =>
  Math.min(smoothstep(a, b, t), 1 - smoothstep(c, d, t));

export const ease = {
  linear: (x: number) => x,
  inOut: (x: number) => x * x * (3 - 2 * x),
  power2Out: (x: number) => 1 - (1 - x) * (1 - x),
  power3Out: (x: number) => 1 - Math.pow(1 - x, 3),
  power2In: (x: number) => x * x,
  power3In: (x: number) => x * x * x,
  power4InOut: (x: number) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
  expoInOut: (x: number) =>
    x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
  sineInOut: (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,
};

export type Key<T> = [number, T];

/** Piecewise interpolation through keyframes [[t, value], ...] with per-segment smoothing. */
export function keyframes(t: number, keys: Key<number>[], easing: (x: number) => number = ease.sineInOut) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return lerp(v0, v1, easing((t - t0) / (t1 - t0)));
    }
  }
  return keys[keys.length - 1][1];
}

/** Same as `keyframes` for fixed-size tuples (vectors), written into `out`. */
export function keyframesVec<T extends number[]>(
  t: number,
  keys: Key<T>[],
  out: T,
  easing: (x: number) => number = ease.sineInOut
): T {
  let a = keys[0], b = keys[0], x = 0;
  if (t > keys[0][0]) {
    a = b = keys[keys.length - 1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        a = keys[i - 1];
        b = keys[i];
        x = easing((t - a[0]) / (b[0] - a[0]));
        break;
      }
    }
  }
  for (let i = 0; i < out.length; i++) out[i] = lerp(a[1][i], b[1][i], x);
  return out;
}

/** Deterministic pseudo random in [0,1) from an integer seed. */
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

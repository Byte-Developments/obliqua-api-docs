// The whole site is one film. Every scene owns a window on a single timeline measured in
// "units" (1 unit = 1% of the viewport height of scroll on desktop). Windows overlap on purpose:
// the overlap is where one scene grows out of the previous one.

export type Range = readonly [number, number];

export const T = {
  hero: [0, 150],
  fabric: [105, 215],
  pruning: [195, 305],
  orchard: [280, 400],
  reach: [380, 470],
  portrait: [455, 595],
  cutting: [575, 665],
  halves: [648, 772],
  blue: [752, 905],
  pearRise: [860, 990],
  pearGold: [970, 1060],
  monument: [1040, 1125],
  scaffold: [1105, 1305],
  blueprint: [1285, 1400],
  finale: [1385, 1445],
} as const satisfies Record<string, Range>;

/** Timeline length; the document adds one extra viewport so the finale can rest. */
export const END = 1445;
/** Mobile shortens every pinned sequence by the same factor so timings stay proportional. */
export const MOBILE_SCALE = 0.8;

export type SceneId = keyof typeof T;

export const COLORS = {
  cobalt: "#0865F4",
  cobaltDeep: "#075BE0",
  cobaltHi: "#1677FF",
  gallery: "#F5F1E8",
  ivory: "#EEE9DD",
  pearGold: "#C99626",
  pearRipe: "#D7A62A",
  green: "#17382B",
  ink: "#121212",
  white: "#F8F6F1",
} as const;

/** Chapters shown in the rail / menu. `at` is where "scrolling to" the chapter lands. */
export const CHAPTERS = [
  { id: "hero", n: "01", title: "Appearance", at: 0 },
  { id: "fabric", n: "02", title: "Passage", at: 170 },
  { id: "pruning", n: "03", title: "Cultivation", at: 240 },
  { id: "orchard", n: "04", title: "The Orchard", at: 330 },
  { id: "reach", n: "05", title: "The Reach", at: 420 },
  { id: "portrait", n: "06", title: "Portrait", at: 500 },
  { id: "cutting", n: "07", title: "Inspection", at: 610 },
  { id: "halves", n: "08", title: "Two Halves", at: 680 },
  { id: "blue", n: "09", title: "Under One Roof", at: 800 },
  { id: "pearRise", n: "10", title: "Specimen", at: 930 },
  { id: "pearGold", n: "11", title: "Material", at: 1030 },
  { id: "monument", n: "12", title: "For Scale", at: 1095 },
  { id: "scaffold", n: "13", title: "Restoration", at: 1230 },
  { id: "blueprint", n: "14", title: "Plans", at: 1360 },
  { id: "finale", n: "15", title: "Considered", at: 1445 },
] as const;

/** Which UI ink to use over the scene that is on screen at timeline value `t`. */
export function themeAt(t: number): "light" | "dark" {
  // light = white UI on dark/blue imagery; dark = ink UI on pale imagery
  if (t < 190) return "light"; // blue hero + charcoal curtain
  if (t < 222) return "dark"; // cream fabric / overexposed branch
  if (t < 300) return "dark"; // pruning (pale sky)
  if (t < 470) return "light"; // orchard + reach (deep greens)
  if (t < 700) return "dark"; // ivory portrait, cutting, halves
  if (t < 1395) return "light"; // blue world, pear, scaffold
  return "dark"; // paper + final white
}

export function chapterAt(t: number) {
  let idx = 0;
  for (let i = 0; i < CHAPTERS.length; i++) {
    const c = CHAPTERS[i];
    const start = T[c.id][0];
    if (t >= start - 2) idx = i;
  }
  return idx;
}

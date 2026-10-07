// Every image the experience needs. All are original generated photographs (see
// scripts/asset-sources.json) or textures baked by scripts/generate-textures.mjs.

export type ImageKey =
  | "hero"
  | "pruning"
  | "orchard"
  | "reach"
  | "portrait"
  | "cutting"
  | "halves"
  | "builder1"
  | "builder2"
  | "builder3"
  | "admirer"
  | "cloud"
  | "leaves";

export type ImageEntry = {
  file: string;
  kind: "photo" | "cutout";
  alt: string;
  /** Where the subject sits (0..1 image uv, y up). Cover-cropping keeps this point in frame. */
  focus: [number, number];
  /** Average tone, used as a stand-in colour if the file is unavailable. */
  tone: string;
};

export const IMAGES: Record<ImageKey, ImageEntry> = {
  hero: {
    file: "hero-classical-figure",
    kind: "cutout",
    alt: "A Renaissance-inspired figure in ivory linen and a rust-red sash steps out from behind a heavy charcoal curtain.",
    focus: [0.5, 0.6],
    tone: "#e9dccb",
  },
  pruning: {
    file: "orchard-pruning",
    kind: "photo",
    alt: "Macro photograph of hands in linen sleeves pruning a young pear branch with a curved orchard knife.",
    focus: [0.5, 0.5],
    tone: "#cfd3b8",
  },
  orchard: {
    file: "orchard-wide",
    kind: "photo",
    alt: "Inside the canopy of an old pear orchard, branches heavy with green and golden pears.",
    focus: [0.5, 0.5],
    tone: "#46552c",
  },
  reach: {
    file: "orchard-hand-reaching",
    kind: "photo",
    alt: "A hand rises through the leaves toward a single ripe golden pear.",
    focus: [0.5, 0.62],
    tone: "#5a6a34",
  },
  portrait: {
    file: "renaissance-pear-person",
    kind: "photo",
    alt: "A young noble in emerald velvet studies a golden pear held at eye level against an ivory background.",
    focus: [0.72, 0.55],
    tone: "#e8e1d2",
  },
  cutting: {
    file: "pear-cutting",
    kind: "photo",
    alt: "Close-up of hands in emerald sleeves slicing a golden pear with a small silver knife.",
    focus: [0.5, 0.5],
    tone: "#ddd2bd",
  },
  halves: {
    file: "pear-halves",
    kind: "photo",
    alt: "Two hands from opposite sides each hold one half of a sliced pear, the cut faces almost touching.",
    focus: [0.5, 0.5],
    tone: "#f2eee6",
  },
  builder1: {
    file: "builder-01",
    kind: "cutout",
    alt: "A Renaissance artisan with a measuring rod.",
    focus: [0.5, 0.5],
    tone: "#d9cbb4",
  },
  builder2: {
    file: "builder-02",
    kind: "cutout",
    alt: "A Renaissance artisan carrying architectural plans.",
    focus: [0.5, 0.5],
    tone: "#d9cbb4",
  },
  builder3: {
    file: "builder-03",
    kind: "cutout",
    alt: "A kneeling builder measuring a curved surface.",
    focus: [0.5, 0.5],
    tone: "#d9cbb4",
  },
  admirer: {
    file: "monument-admirer",
    kind: "cutout",
    alt: "A robed figure looks up at the monumental pear.",
    focus: [0.5, 0.5],
    tone: "#e9dccb",
  },
  cloud: { file: "cloud", kind: "cutout", alt: "", focus: [0.5, 0.5], tone: "#ffffff" },
  leaves: { file: "foreground-leaves", kind: "cutout", alt: "", focus: [0.5, 0.5], tone: "#2e4a22" },
};

export const imageUrl = (key: ImageKey, small: boolean) =>
  `/images/${IMAGES[key].file}${small ? "-sm" : ""}.webp`;

export const TEXTURES = {
  pearColor: "/textures/pear_color.webp",
  pearNormal: "/textures/pear_normal.webp",
  pearRoughness: "/textures/pear_roughness.webp",
  pearSpots: "/textures/pear_spots.webp",
  fabricColor: "/textures/fabric_color.webp",
  fabricNormal: "/textures/fabric_normal.webp",
  paper: "/textures/paper.webp",
  timber: "/textures/timber.webp",
} as const;

export type TextureKey = keyof typeof TEXTURES;

export const DRAWINGS = {
  elevation: "/svg/pear-elevation.svg",
  section: "/svg/pear-section.svg",
  scaffold: "/svg/scaffold-elevation.svg",
  stem: "/svg/stem-study.svg",
} as const;

export type DrawingKey = keyof typeof DRAWINGS;

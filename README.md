# PEAR — Pear makes you appear.

A scroll-driven editorial film for a fictional pear house: Next.js (App Router) + React Three
Fiber + GSAP/ScrollTrigger + Lenis, rendered in one persistent WebGL canvas with DOM typography
on top.

```bash
npm install
npm run assets     # download + encode the generated photography into public/images
npm run dev
```

`npm run assets` reads `scripts/asset-sources.json`. The originals are on Higgsfield's CDN
(`d8j0ntlcm91z4.cloudfront.net`); if that host is unreachable, place the PNGs in `raw-assets/`
named as in the JSON (`hero-classical-figure.png`, …) and the script encodes them from there.
Without them the site still runs, with flat tonal stand-ins in place of the photographs.

Other generators (outputs are committed):

- `npm run textures` — pear skin, fabric weave, paper and timber maps (`public/textures`)
- `node scripts/generate-drawings.mjs` — the architectural drawings (`public/svg`)

## How it is put together

- `lib/sceneConfig.ts` — the timeline. Every scene owns a window of scroll "units"; all motion is
  derived from that one number, so reverse scrolling and refreshing mid-page are exact.
- `lib/scroll.ts` — GSAP's ticker is the only clock: it advances Lenis, updates the shared store,
  runs DOM drivers and renders the canvas (`frameloop="never"`).
- `components/three/` — `HeroWorld` (figure + displaced curtain), `PhotoStage` (screen-space
  photo compositor with noise/radial/diagonal reveals and the cobalt portal), `PearWorld`
  (clouds, halftone → physical pear, scaffold, figures, unrolling drawings).
- `components/scenes/` — the editorial copy for each scene.
- `?reduced` (or `prefers-reduced-motion`) renders a static version; `?debug` exposes
  `window.__pear.go(t)` to jump to any moment.

"use client";

import { useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createPhotoMaterial, createSpriteMaterial, REVEAL, type PhotoUniforms } from "./PhotoMaterial";
import { keyframes, keyframesVec, range, smoothstep, window4, ease, type Key } from "@/lib/animation";
import { IMAGES, type ImageKey } from "@/lib/imageManifest";
import type { Assets } from "@/lib/assets";
import { state } from "@/lib/store";

// SCENES 03 – 09: the photographic middle of the film, composited in screen space inside the
// same WebGL canvas so every hand-off can be a shader mask (no DOM cross-fades, no flashes).

type Layer = {
  key: ImageKey;
  mode: number;
  reveal: [number, number];
  /** last moment this layer can be seen (it is fully covered after this) */
  until: number;
  scale: Key<number>[];
  focus?: Key<[number, number]>[];
  pan?: Key<[number, number]>[];
  wash?: Key<number>[];
  blur?: Key<number>[];
  soft?: number;
};

const LAYERS: Layer[] = [
  {
    // 03 — the pale fabric becomes an overexposed branch, then the light settles
    key: "pruning",
    mode: REVEAL.diagonal,
    reveal: [190, 226],
    until: 312,
    soft: 0.2,
    scale: [[190, 1.0], [305, 1.17]],
    pan: [[190, [0.0, 0.02]], [305, [0.0, -0.01]]],
    wash: [[190, 0.92], [214, 0.55], [240, 0.0]],
    blur: [[190, 3.5], [232, 0.0]],
  },
  {
    // 04 — the camera pushes into the canopy
    key: "orchard",
    mode: REVEAL.dissolve,
    reveal: [282, 310],
    until: 408,
    scale: [[282, 1.0], [400, 1.32]],
    pan: [[282, [0, -0.02]], [400, [0.015, 0.02]]],
    blur: [[282, 2.5], [306, 0.0]],
  },
  {
    // 05 — a hand rises toward one pear
    key: "reach",
    mode: REVEAL.dissolve,
    reveal: [382, 408],
    until: 494,
    scale: [[382, 1.04], [470, 1.38]],
    focus: [[382, [0.5, 0.5]], [470, [0.53, 0.74]]],
    blur: [[382, 2.0], [404, 0.0]],
  },
  {
    // 06 — the foliage opens from the centre into an ivory gallery portrait
    key: "portrait",
    mode: REVEAL.radial,
    reveal: [456, 494],
    until: 604,
    soft: 0.16,
    scale: [[456, 1.08], [500, 1.0], [520, 1.0], [595, 1.62]],
    focus: [[456, [0.72, 0.55]], [520, [0.72, 0.55]], [595, [0.58, 0.64]]],
    blur: [[456, 2.0], [490, 0.0]],
  },
  {
    // 07 — inspection: the knife enters
    key: "cutting",
    mode: REVEAL.dissolve,
    reveal: [576, 604],
    until: 674,
    scale: [[576, 1.2], [665, 1.04]],
    focus: [[576, [0.62, 0.42]], [665, [0.6, 0.45]]],
    blur: [[576, 3.0], [600, 0.0]],
  },
  {
    // 08 – 09 — two halves, then a cobalt portal between them
    key: "halves",
    mode: REVEAL.split,
    reveal: [648, 674],
    until: 776,
    scale: [[648, 1.0], [690, 1.0], [772, 1.3]],
  },
];

type Sprite = {
  t: [number, number, number, number];
  from: [number, number, number, number]; // x, y, size, rotation
  to: [number, number, number, number];
  blur: [number, number];
  flip?: boolean;
  tint?: [number, number, number];
};

// Foreground leaves pass very close to the lens: dark, defocused, much faster than the photo.
const SPRITES: Sprite[] = [
  { t: [196, 222, 286, 306], from: [-0.78, -0.62, 0.8, 0.35], to: [-1.05, -0.9, 1.25, 0.5], blur: [2.2, 3.4] },
  { t: [286, 300, 372, 398], from: [0.12, 0.02, 0.22, -0.2], to: [1.55, -0.45, 2.7, -0.65], blur: [1.2, 4.5] },
  { t: [318, 336, 386, 404], from: [-0.25, 0.22, 0.26, 2.6], to: [-1.6, 0.95, 2.9, 2.2], blur: [1.4, 4.8], flip: true },
  { t: [384, 404, 452, 470], from: [0.92, 0.78, 1.0, 3.6], to: [1.02, 0.95, 1.3, 3.4], blur: [2.4, 3.2], flip: true },
  { t: [436, 448, 486, 510], from: [-0.88, 0.05, 1.6, 0.9], to: [-1.4, 0.2, 2.1, 1.1], blur: [2.5, 4.0], tint: [0.55, 0.6, 0.48] },
  { t: [436, 448, 486, 510], from: [0.95, -0.25, 1.5, -2.3], to: [1.45, -0.45, 2.0, -2.5], blur: [2.5, 4.0], flip: true, tint: [0.55, 0.6, 0.48] },
];

const v2: [number, number] = [0, 0];

export function PhotoStage({ assets }: { assets: Assets }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const layers = useMemo(
    () =>
      LAYERS.map((l, i) => {
        const mat = createPhotoMaterial(assets.images[l.key], l.mode, 3.7 + i * 11.3);
        const f = IMAGES[l.key].focus;
        (mat.uniforms as unknown as PhotoUniforms).uFocus.value.set(f[0], f[1]);
        if (l.soft) (mat.uniforms as unknown as PhotoUniforms).uSoft.value = l.soft;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        mesh.frustumCulled = false;
        mesh.renderOrder = 100 + i;
        mesh.visible = false;
        return { cfg: l, mesh, u: mat.uniforms as unknown as PhotoUniforms };
      }),
    [assets]
  );

  const sprites = useMemo(
    () =>
      SPRITES.map((s, i) => {
        const mat = createSpriteMaterial(assets.images.leaves);
        if (s.tint) mat.uniforms.uTint.value.setRGB(...s.tint);
        mat.uniforms.uFlip.value = s.flip ? -1 : 1;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        mesh.frustumCulled = false;
        mesh.renderOrder = 150 + i;
        mesh.visible = false;
        return { cfg: s, mesh, u: mat.uniforms };
      }),
    [assets]
  );

  useEffect(
    () => () => {
      layers.forEach((l) => {
        l.mesh.geometry.dispose();
        (l.mesh.material as THREE.Material).dispose();
      });
      sprites.forEach((s) => {
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.Material).dispose();
      });
    },
    [layers, sprites]
  );

  useFrame(() => {
    const t = state.t;
    const w = size.width * dpr, h = size.height * dpr;
    for (const { cfg, mesh, u } of layers) {
      const rev = range(t, cfg.reveal[0], cfg.reveal[1]);
      const vis = rev > 0 && t < cfg.until;
      mesh.visible = vis;
      if (!vis) continue;
      u.uRes.value.set(w, h);
      u.uReveal.value = ease.sineInOut(rev);
      u.uScale.value = keyframes(t, cfg.scale);
      if (cfg.focus) {
        keyframesVec(t, cfg.focus, v2);
        u.uFocus.value.set(v2[0], v2[1]);
      }
      if (cfg.pan) {
        keyframesVec(t, cfg.pan, v2);
        u.uPan.value.set(v2[0], v2[1]);
      }
      if (cfg.wash) u.uWash.value = keyframes(t, cfg.wash);
      if (cfg.blur) u.uBlur.value = keyframes(t, cfg.blur) * (state.isMobile ? 0.7 : 1);
      if (cfg.mode === REVEAL.split) {
        // the halves meet, hold, then part; the gap becomes a cobalt void that swallows the frame
        const s = keyframes(t, [[688, 0], [704, 0.012], [772, 0.68]], ease.power2In);
        u.uSplit.value = s;
        const open = smoothstep(694, 742, t);
        u.uPortal.value.set(Math.max(0, 2 * s - 0.012), THREE.MathUtils.lerp(0.18, 1.05, ease.power3Out(open)));
      }
      u.uGrade.value = 1;
    }
    const aspect = size.width / size.height;
    for (const { cfg, mesh, u } of sprites) {
      const [a, b, c, d] = cfg.t;
      const o = window4(t, a, b, c, d);
      mesh.visible = o > 0.001;
      if (!mesh.visible) continue;
      const k = ease.sineInOut(range(t, a, d));
      // narrow screens: keep leaves hugging the frame edges instead of covering the subject
      const xs = aspect < 1 ? 1.1 : 1;
      u.uPos.value.set(THREE.MathUtils.lerp(cfg.from[0], cfg.to[0], k) * xs, THREE.MathUtils.lerp(cfg.from[1], cfg.to[1], k));
      u.uSize.value = THREE.MathUtils.lerp(cfg.from[2], cfg.to[2], k) * (aspect < 1 ? 0.75 : 1);
      u.uRot.value = THREE.MathUtils.lerp(cfg.from[3], cfg.to[3], k);
      u.uBlur.value = THREE.MathUtils.lerp(cfg.blur[0], cfg.blur[1], k);
      u.uAspect.value = aspect;
      u.uOpacity.value = o;
    }
  });

  return (
    <group>
      {layers.map((l) => (
        <primitive key={l.cfg.key} object={l.mesh} />
      ))}
      {sprites.map((s, i) => (
        <primitive key={"leaf" + i} object={s.mesh} />
      ))}
    </group>
  );
}

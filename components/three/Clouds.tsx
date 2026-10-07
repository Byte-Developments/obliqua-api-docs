"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createHalftoneMaterial } from "./HalftoneMaterial";
import { range, smoothstep, window4 } from "@/lib/animation";
import { T } from "@/lib/sceneConfig";
import type { Assets } from "@/lib/assets";
import { state } from "@/lib/store";

// A few deliberate clouds: some photographic, some printed as dots. They are graphic objects
// floating on a flat colour field, not weather.

type CloudSpec = { pos: [number, number, number]; w: number; print: number; drift: number; flip?: boolean };

const CLOUDS: CloudSpec[] = [
  { pos: [-12.5, 12.5, -4], w: 6.2, print: 0, drift: 0.05 },
  { pos: [10.5, 3.2, -9], w: 7.5, print: 1, drift: 0.035, flip: true },
  { pos: [14, -1.0, -6], w: 3.4, print: 0, drift: 0.07 },
  { pos: [-10, 3.0, 4], w: 2.6, print: 1, drift: 0.09, flip: true },
  { pos: [-9, 18, -16], w: 9.5, print: 1, drift: 0.025 },
  { pos: [-17, -2, -12], w: 6, print: 0, drift: 0.03, flip: true },
];

// Where editorial copy sits on screen (NDC rect) during a window of the film: clouds that
// drift into these zones step aside (fade) so white type never lands on a white cloud.
const QUIET: { t: [number, number, number, number]; x: [number, number]; y: [number, number] }[] = [
  { t: [780, 800, 870, 890], x: [0.25, 1.2], y: [-0.1, 1.2] },
  { t: [780, 800, 870, 890], x: [-0.45, 0.25], y: [-0.25, 0.25] },
  { t: [990, 1004, 1076, 1090], x: [0.2, 1.2], y: [-0.2, 1.2] },
  { t: [1140, 1155, 1285, 1300], x: [-1.2, -0.3], y: [0.1, 1.2] },
];
const ndc = new THREE.Vector3();

export function Clouds({ assets }: { assets: Assets }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);
  const aspect = useMemo(() => {
    const img = assets.images.cloud.image as { width?: number; height?: number };
    return img?.width && img?.height ? img.width / img.height : 1.6;
  }, [assets]);
  const items = useMemo(
    () =>
      CLOUDS.map((c) => {
        const m = createHalftoneMaterial(assets.images.cloud, "#ffffff");
        m.uniforms.uProgress.value = c.print;
        m.uniforms.uDotScale.value = c.w > 6 ? 6 : 4.5;
        return { c, m };
      }),
    [assets]
  );
  useEffect(() => () => items.forEach((i) => i.m.dispose()), [items]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    const t = state.t;
    const vis = window4(t, T.blue[0] - 20, T.blue[0] + 30, T.blueprint[0], T.blueprint[0] + 60);
    if (group.current) group.current.visible = vis > 0.001;
    if (vis <= 0.001) return;
    const lift = range(t, T.blue[0], T.pearGold[1]);
    items.forEach(({ c, m }, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      // slow pendulum drift (never wraps, so never pops) plus depth-scaled scroll parallax
      const x = c.pos[0] + Math.sin(state.time * c.drift * 0.6 + i * 1.7) * 2.2 + (t - T.blue[0]) * 0.0008 * (c.pos[2] + 20) * Math.sign(c.pos[0]);
      mesh.position.set(x, c.pos[1] - lift * (c.pos[2] + 22) * 0.25, c.pos[2]);
      mesh.scale.set(c.w * (c.flip ? -1 : 1), c.w / aspect, 1);
      ndc.copy(mesh.position).project(camera);
      let quiet = 0;
      // on phones the copy spans the full width, so the zones do too
      const narrow = state.aspect < 0.9;
      for (const q of QUIET) {
        const w = window4(t, q.t[0], q.t[1], q.t[2], q.t[3]);
        if (w <= 0) continue;
        const x0 = narrow ? -1.2 : q.x[0], x1 = narrow ? 1.2 : q.x[1];
        const inside = Math.min(smoothstep(x0 - 0.15, x0 + 0.05, ndc.x), 1 - smoothstep(x1 - 0.05, x1 + 0.15, ndc.x),
          smoothstep(q.y[0] - 0.15, q.y[0] + 0.05, ndc.y), 1 - smoothstep(q.y[1] - 0.05, q.y[1] + 0.15, ndc.y));
        quiet = Math.max(quiet, w * inside);
      }
      m.uniforms.uOpacity.value = vis * (1 - quiet);
      m.uniforms.uPixelRatio.value = dpr;
    });
  });

  return (
    <group ref={group}>
      {items.map(({ c, m }, i) => (
        <mesh key={i} ref={(r) => { refs.current[i] = r; }} material={m} renderOrder={-1}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

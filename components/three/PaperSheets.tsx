"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { keyframes, range, ease } from "@/lib/animation";
import type { Assets } from "@/lib/assets";
import type { DrawingKey } from "@/lib/imageManifest";
import { state } from "@/lib/store";

// Large sheets of drafting paper that unroll from the scaffold like scrolls. The roll is
// geometric (the unrolled length lies flat, the rest wraps a small cylinder) and the hanging
// part breathes with a slow wave that is ironed flat as the camera arrives.

export type SheetSpec = {
  drawing: DrawingKey;
  /** where the top edge hangs */
  at: [number, number, number];
  rotY: number;
  size: [number, number];
  unroll: [number, number];
  /** how much the sheet keeps breathing at the end (main sheet goes flat) */
  settle?: [number, number];
};

const SHEET_GLSL = /* glsl */ `
uniform float uUnroll, uWave, uTime, uH;
vec3 sheet(vec3 p){
  float s = uH * 0.5 - p.y;
  float L = uUnroll * uH;
  vec3 o = vec3(p.x, 0.0, 0.0);
  if (s <= L) { o.y = -s; }
  else {
    float R = 0.15 + (s - L) * 0.004;
    float phi = (s - L) / R;
    o.y = -L - R * sin(phi);
    o.z = R * (1.0 - cos(phi));
  }
  float hang = clamp(min(s, L) / uH, 0.0, 1.0);
  o.z += (sin(p.x * 0.85 + uTime * 0.55) * 0.13 + sin(p.y * 0.45 - uTime * 0.35) * 0.09 + sin(p.x * 1.9 + 1.0) * 0.05) * hang * uWave;
  return o;
}
`;

function createSheetMaterial(map: THREE.Texture, h: number) {
  const u = { uUnroll: { value: 0 }, uWave: { value: 1 }, uTime: { value: 0 }, uH: { value: h } };
  const mat = new THREE.MeshStandardMaterial({
    map,
    emissive: new THREE.Color("#ffffff"),
    emissiveMap: map,
    emissiveIntensity: 0.38,
    roughness: 0.96,
    side: THREE.DoubleSide,
    envMapIntensity: 0.25,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\n" + SHEET_GLSL)
      .replace(
        "#include <beginnormal_vertex>",
        `vec3 s0 = sheet(position);
         vec3 sx = sheet(position + vec3(0.02, 0.0, 0.0));
         vec3 sy = sheet(position + vec3(0.0, 0.02, 0.0));
         vec3 objectNormal = normalize(cross(sx - s0, sy - s0));`
      )
      .replace("#include <begin_vertex>", "vec3 transformed = s0;");
  };
  mat.customProgramCacheKey = () => "paper-sheet";
  return { mat, u };
}

export function PaperSheets({ assets, specs, lowDetail }: { assets: Assets; specs: SheetSpec[]; lowDetail?: boolean }) {
  const items = useMemo(
    () =>
      specs.map((s) => {
        const geo = new THREE.PlaneGeometry(s.size[0], s.size[1], lowDetail ? 24 : 48, lowDetail ? 90 : 180);
        const { mat, u } = createSheetMaterial(assets.drawings[s.drawing], s.size[1]);
        return { s, geo, mat, u };
      }),
    [assets, specs, lowDetail]
  );
  useEffect(
    () => () =>
      items.forEach((i) => {
        i.geo.dispose();
        i.mat.dispose();
      }),
    [items]
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    const t = state.t;
    items.forEach(({ s, u }, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const un = ease.power2Out(range(t, s.unroll[0], s.unroll[1]));
      mesh.visible = un > 0.002;
      u.uUnroll.value = un;
      u.uTime.value = state.time;
      u.uWave.value = s.settle ? keyframes(t, [[s.settle[0], 1], [s.settle[1], 0]]) : 1;
    });
  });

  return (
    <group>
      {items.map(({ s, geo, mat }, i) => (
        <mesh
          key={i}
          ref={(m) => { refs.current[i] = m; }}
          geometry={geo}
          material={mat}
          position={s.at}
          rotation={[0, s.rotY, 0]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}

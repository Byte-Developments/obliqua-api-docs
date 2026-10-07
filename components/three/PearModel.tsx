"use client";

import { forwardRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { createPearUniforms, patchPearMaterial, type PearUniforms } from "./HalftoneMaterial";
import type { Assets } from "@/lib/assets";

// A real pear silhouette: a lathed profile, then low-frequency noise, a leaning neck and an
// uneven shoulder so it never reads as a mathematical solid.

const PROFILE: [number, number][] = [
  [0.0, -2.2],
  [0.62, -2.16],
  [1.1, -2.0],
  [1.55, -1.35],
  [1.68, -0.55],
  [1.45, 0.15],
  [1.03, 0.75],
  [0.66, 1.35],
  [0.52, 1.95],
  [0.2, 2.06],
  [0.0, 2.02],
];

export const PEAR_SCALE = 2.6;
export const PEAR_BOTTOM = -2.2;

/** Radius of the (undeformed) pear at a given world height above its base, for layout. */
export function pearRadiusAt(height: number, scale = PEAR_SCALE) {
  const y = height / scale + PEAR_BOTTOM;
  for (let i = 1; i < PROFILE.length; i++) {
    const [r0, y0] = PROFILE[i - 1];
    const [r1, y1] = PROFILE[i];
    if (y >= y0 && y <= y1) return THREE.MathUtils.lerp(r0, r1, (y - y0) / (y1 - y0 || 1)) * scale;
  }
  return 0;
}

function buildPearGeometry(radial: number, rings: number) {
  const curve = new THREE.CatmullRomCurve3(
    PROFILE.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    false,
    "centripetal"
  );
  const pts = curve.getSpacedPoints(rings).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
  pts[0].x = 0;
  pts[pts.length - 1].x = 0;
  const geo = new THREE.LatheGeometry(pts, radial);

  const noise = new SimplexNoise({ random: mulberry(7) });
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.z);
    if (r < 1e-5) continue;
    const a = Math.atan2(v.z, v.x);
    const cx = Math.cos(a), cz = Math.sin(a);
    const yN = (v.y + 2.2) / 4.25;
    // broad lumps + a lopsided shoulder + faint facets
    let k = 1;
    k += noise.noise3d(cx * 0.9, v.y * 0.42, cz * 0.9) * 0.045;
    k += noise.noise3d(cx * 2.3 + 4, v.y * 1.1, cz * 2.3) * 0.014;
    k += Math.sin(a + 0.7) * 0.035 * Math.sin(Math.PI * Math.min(1, yN * 1.15));
    k += Math.max(0, Math.cos(a - 2.2)) * 0.03 * Math.exp(-Math.pow((yN - 0.55) / 0.18, 2));
    v.x *= k;
    v.z *= k;
    // the neck leans, as real pears do
    const lean = Math.pow(THREE.MathUtils.smoothstep(v.y, -0.6, 2.1), 2);
    v.x += lean * 0.16;
    v.z += lean * 0.05;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();

  // weld the lathe seam and the poles so shading never shows a stitch
  const nrm = geo.attributes.normal as THREE.BufferAttribute;
  const n = pts.length;
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let j = 0; j < n; j++) {
    const i0 = j, i1 = radial * n + j;
    a.fromBufferAttribute(nrm, i0);
    b.fromBufferAttribute(nrm, i1);
    a.add(b).normalize();
    nrm.setXYZ(i0, a.x, a.y, a.z);
    nrm.setXYZ(i1, a.x, a.y, a.z);
  }
  for (let i = 0; i <= radial; i++) {
    nrm.setXYZ(i * n, 0, -1, 0);
    nrm.setXYZ(i * n + n - 1, 0, 1, 0);
  }
  nrm.needsUpdate = true;
  return geo;
}

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStem() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.16, 1.9, 0.05),
    new THREE.Vector3(0.2, 2.25, 0.06),
    new THREE.Vector3(0.28, 2.6, 0.08),
    new THREE.Vector3(0.46, 2.9, 0.1),
    new THREE.Vector3(0.62, 3.02, 0.12),
  ]);
  const tubular = 40, radial = 10;
  const geo = new THREE.TubeGeometry(curve, tubular, 0.07, radial, false);
  // taper toward the tip and flare where the stem meets the fruit
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const p = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const u = i / tubular;
    curve.getPointAt(u, c);
    const s = THREE.MathUtils.lerp(1.0, 0.55, u) + Math.exp(-u * 18) * 0.9;
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j;
      p.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(s).add(c);
      pos.setXYZ(idx, p.x, p.y, p.z);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export type PearHandle = THREE.Group & { userData: { uniforms: PearUniforms } };

export const PearModel = forwardRef<THREE.Group, { assets: Assets; detail?: "high" | "low"; uniforms?: PearUniforms }>(
  function PearModel({ assets, detail = "high", uniforms: given }, ref) {
    const uniforms = useMemo(() => given ?? createPearUniforms(), [given]);
    const { body, stem, skin, stemMat } = useMemo(() => {
      const body = detail === "high" ? buildPearGeometry(220, 180) : buildPearGeometry(110, 90);
      const stem = buildStem();
      const skin = new THREE.MeshPhysicalMaterial({
        map: assets.textures.pearColor,
        normalMap: assets.textures.pearNormal,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughnessMap: assets.textures.pearRoughness,
        roughness: 1.0,
        metalness: 0,
        clearcoat: 0.08,
        clearcoatRoughness: 0.45,
        sheen: 0.35,
        sheenRoughness: 0.55,
        sheenColor: new THREE.Color("#f6dfa6"),
      });
      patchPearMaterial(skin, uniforms);
      const stemMat = new THREE.MeshStandardMaterial({ color: "#5b4127", roughness: 0.82 });
      patchPearMaterial(stemMat, uniforms);
      return { body, stem, skin, stemMat };
    }, [assets, detail, uniforms]);

    useEffect(
      () => () => {
        body.dispose();
        stem.dispose();
        skin.dispose();
        stemMat.dispose();
      },
      [body, stem, skin, stemMat]
    );

    return (
      <group ref={ref} userData={{ uniforms }}>
        <mesh geometry={body} material={skin} />
        <mesh geometry={stem} material={stemMat} />
      </group>
    );
  }
);

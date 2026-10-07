"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { hash, smoothstep } from "@/lib/animation";
import type { Assets } from "@/lib/assets";

// Timber scaffolding that builds itself around the monumental pear. Every member has a birth
// time; it grows from its anchor (poles rise, ledgers extend, planks slide out, ropes drop).
// Two InstancedMeshes (round timber + sawn planks) and one for rope keep it to three draw calls.

type Member = {
  kind: "round" | "plank" | "rope";
  a: THREE.Vector3;
  b: THREE.Vector3;
  radius: number; // round/rope radius, plank width
  thick?: number;
  birth: number;
};

export const LOWER = { inner: 5.4, outer: 6.6, levels: [2.4, 4.8, 7.2], top: 8.1, n: 16 };
export const UPPER = { inner: 3.7, outer: 4.9, levels: [9.6, 12.0], base: 7.2, top: 13.4, n: 10 };
export const SHEET_ROD = { y: 13.9, z: 7.4, half: 4.4 };

const polar = (r: number, a: number, y: number) => new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);

function jitter(v: THREE.Vector3, seed: number, amt = 0.035) {
  return v.set(v.x + (hash(seed) - 0.5) * amt, v.y + (hash(seed + 1) - 0.5) * amt * 0.5, v.z + (hash(seed + 2) - 0.5) * amt);
}

export function buildScaffold(): Member[] {
  const m: Member[] = [];
  let s = 1;
  const add = (x: Member) => {
    jitter(x.a, s++);
    jitter(x.b, s++);
    m.push(x);
  };
  // angle 0 faces the camera; start building from the left-back so the front completes last
  const ang = (i: number, n: number) => (i / n) * Math.PI * 2 + 0.11;
  const order = (i: number, n: number) => ((i / n + 0.62) % 1);

  // ---- lower tier
  const L = LOWER;
  for (let i = 0; i < L.n; i++) {
    const a = ang(i, L.n), o = order(i, L.n);
    add({ kind: "round", a: polar(L.inner, a, -0.2), b: polar(L.inner, a + 0.004, L.top), radius: 0.075, birth: 0.2 + o * 0.16 });
    add({ kind: "round", a: polar(L.outer, a, -0.2), b: polar(L.outer, a - 0.004, L.top + 0.35), radius: 0.078, birth: 0.22 + o * 0.16 });
  }
  L.levels.forEach((y, li) => {
    for (let i = 0; i < L.n; i++) {
      const a0 = ang(i, L.n), a1 = ang(i + 1, L.n), o = order(i, L.n);
      const b = 0.36 + li * 0.045 + o * 0.08;
      add({ kind: "round", a: polar(L.inner, a0, y), b: polar(L.inner, a1, y), radius: 0.06, birth: b });
      add({ kind: "round", a: polar(L.outer, a0, y + 0.02), b: polar(L.outer, a1, y + 0.02), radius: 0.06, birth: b + 0.01 });
      add({ kind: "round", a: polar(L.inner - 0.15, a0, y - 0.08), b: polar(L.outer + 0.15, a0, y - 0.08), radius: 0.05, birth: b + 0.015 });
      // deck boards on most bays
      if (hash(i * 7 + li * 31) > 0.22) {
        for (let k = 0; k < 3; k++) {
          const r = L.inner + 0.22 + k * 0.38;
          add({ kind: "plank", a: polar(r, a0 - 0.01, y + 0.06), b: polar(r, a1 + 0.01, y + 0.06), radius: 0.34, thick: 0.05, birth: 0.5 + li * 0.05 + o * 0.08 + k * 0.006 });
        }
      }
      // diagonal braces on every third bay of the outer face
      if (i % 3 === li % 3 && li < L.levels.length) {
        const y0 = li === 0 ? 0.0 : L.levels[li - 1];
        add({ kind: "round", a: polar(L.outer + 0.08, a0, y0), b: polar(L.outer + 0.08, a1, y), radius: 0.045, birth: 0.44 + li * 0.05 + o * 0.06 });
      }
    }
  });

  // ---- guard rails on top of the lower tier
  for (let i = 0; i < L.n; i++) {
    const a0 = ang(i, L.n), a1 = ang(i + 1, L.n), o = order(i, L.n);
    add({ kind: "round", a: polar(L.outer, a0, L.top - 0.05), b: polar(L.outer, a1, L.top - 0.05), radius: 0.045, birth: 0.56 + o * 0.06 });
  }

  // ---- ladders on the front-left and right faces
  const ladder = (a: number, y0: number, y1: number, birth: number) => {
    const r = L.outer + 0.35;
    const da = 0.045;
    const lean = 0.25;
    const pA0 = polar(r + lean, a - da, y0), pA1 = polar(r, a - da, y1 + 0.5);
    const pB0 = polar(r + lean, a + da, y0), pB1 = polar(r, a + da, y1 + 0.5);
    add({ kind: "round", a: pA0, b: pA1, radius: 0.035, birth });
    add({ kind: "round", a: pB0, b: pB1, radius: 0.035, birth: birth + 0.01 });
    const steps = Math.round((y1 - y0) / 0.32);
    for (let k = 1; k < steps; k++) {
      const f = k / steps;
      add({ kind: "round", a: pA0.clone().lerp(pA1, f), b: pB0.clone().lerp(pB1, f), radius: 0.022, birth: birth + 0.012 + f * 0.04 });
    }
  };
  ladder(-0.55, 0, L.levels[0], 0.6);
  ladder(0.95, L.levels[0], L.levels[1], 0.64);
  ladder(-1.2, L.levels[1], L.levels[2], 0.68);

  // ---- upper tier, standing on the third deck around the neck
  const U = UPPER;
  for (let i = 0; i < U.n; i++) {
    const a = ang(i, U.n) + 0.2, o = order(i, U.n);
    // bearers carrying the upper tier across to the lower deck
    add({ kind: "round", a: polar(U.inner - 0.2, a, U.base - 0.1), b: polar(L.inner + 0.25, a, U.base - 0.1), radius: 0.06, birth: 0.58 + o * 0.05 });
    add({ kind: "round", a: polar(U.inner, a, U.base), b: polar(U.inner, a, U.top), radius: 0.065, birth: 0.62 + o * 0.08 });
    add({ kind: "round", a: polar(U.outer, a, U.base), b: polar(U.outer, a, U.top + 0.3), radius: 0.068, birth: 0.63 + o * 0.08 });
  }
  U.levels.forEach((y, li) => {
    for (let i = 0; i < U.n; i++) {
      const a0 = ang(i, U.n) + 0.2, a1 = ang(i + 1, U.n) + 0.2, o = order(i, U.n);
      const b = 0.7 + li * 0.04 + o * 0.06;
      add({ kind: "round", a: polar(U.inner, a0, y), b: polar(U.inner, a1, y), radius: 0.055, birth: b });
      add({ kind: "round", a: polar(U.outer, a0, y), b: polar(U.outer, a1, y), radius: 0.055, birth: b + 0.01 });
      add({ kind: "round", a: polar(U.inner - 0.12, a0, y - 0.07), b: polar(U.outer + 0.12, a0, y - 0.07), radius: 0.045, birth: b + 0.012 });
      if (hash(i * 13 + li * 7 + 99) > 0.3)
        for (let k = 0; k < 3; k++) {
          const r = U.inner + 0.2 + k * 0.4;
          add({ kind: "plank", a: polar(r, a0, y + 0.06), b: polar(r, a1, y + 0.06), radius: 0.34, thick: 0.05, birth: 0.76 + li * 0.04 + o * 0.05 });
        }
    }
  });

  for (let i = 0; i < U.n; i++) {
    const a0 = ang(i, U.n) + 0.2, a1 = ang(i + 1, U.n) + 0.2, o = order(i, U.n);
    add({ kind: "round", a: polar(U.outer, a0, U.top - 0.1), b: polar(U.outer, a1, U.top - 0.1), radius: 0.045, birth: 0.82 + o * 0.05 });
    add({ kind: "round", a: polar(U.inner, a0, U.top - 0.2), b: polar(U.inner, a1, U.top - 0.2), radius: 0.04, birth: 0.83 + o * 0.05 });
  }

  // ---- outriggers and the rod the drawings will hang from
  const R = SHEET_ROD;
  [-1, 1].forEach((sgn, k) => {
    add({ kind: "round", a: new THREE.Vector3(sgn * 3.2, U.levels[1], 3.6), b: new THREE.Vector3(sgn * 3.6, R.y, R.z), radius: 0.06, birth: 0.84 + k * 0.01 });
  });
  add({ kind: "round", a: new THREE.Vector3(-R.half, R.y, R.z), b: new THREE.Vector3(R.half, R.y, R.z), radius: 0.06, birth: 0.87 });

  // ---- ropes dropping from the upper ledgers
  for (let i = 0; i < 7; i++) {
    const a = -1.4 + i * 0.47 + (hash(i + 400) - 0.5) * 0.2;
    const top = polar(U.outer + 0.05, a, U.levels[1]);
    const len = 3 + hash(i + 77) * 4.5;
    add({ kind: "rope", a: top, b: top.clone().add(new THREE.Vector3((hash(i) - 0.5) * 0.3, -len, 0.1)), radius: 0.016, birth: 0.8 + i * 0.012 });
  }
  return m;
}

const Y = new THREE.Vector3(0, 1, 0);
const tmpDir = new THREE.Vector3();
const xAxis = new THREE.Vector3(), zAxis = new THREE.Vector3();
const basis = new THREE.Matrix4();
const scaleM = new THREE.Matrix4();
const mat = new THREE.Matrix4();

function writeMatrix(target: THREE.InstancedMesh, index: number, mb: Member, g: number) {
  tmpDir.subVectors(mb.b, mb.a);
  const len = tmpDir.length() * g;
  tmpDir.normalize();
  // basis: local Y along the member; local Z as "up" as possible (planks lie flat)
  const hint = Math.abs(tmpDir.dot(Y)) > 0.95 ? zAxis.set(0, 0, 1) : zAxis.copy(Y);
  xAxis.crossVectors(tmpDir, hint).normalize();
  zAxis.crossVectors(xAxis, tmpDir).normalize();
  basis.makeBasis(xAxis, tmpDir, zAxis);
  const w = g > 0 ? 1 : 0;
  if (mb.kind === "plank") scaleM.makeScale(mb.radius * w, Math.max(len, 1e-4), (mb.thick ?? 0.05) * w);
  else scaleM.makeScale(mb.radius * w, Math.max(len, 1e-4), mb.radius * w);
  mat.copy(basis).multiply(scaleM).setPosition(mb.a);
  target.setMatrixAt(index, mat);
}

export function Scaffold({ assets, progress }: { assets: Assets; progress: { current: number } }) {
  const members = useMemo(() => buildScaffold(), []);
  const groups = useMemo(() => {
    const round = members.filter((m) => m.kind === "round");
    const plank = members.filter((m) => m.kind === "plank");
    const rope = members.filter((m) => m.kind === "rope");
    return { round, plank, rope };
  }, [members]);

  const roundRef = useRef<THREE.InstancedMesh>(null);
  const plankRef = useRef<THREE.InstancedMesh>(null);
  const ropeRef = useRef<THREE.InstancedMesh>(null);
  const last = useRef(-1);

  const { cyl, box, timberMat, plankMat, ropeMat } = useMemo(() => {
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 7, 1, false).translate(0, 0.5, 0);
    const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const tex = assets.textures.timber.clone();
    tex.repeat.set(1, 6);
    tex.needsUpdate = true;
    const timberMat = new THREE.MeshStandardMaterial({ map: tex, color: "#efe4d0", roughness: 0.9 });
    const plankMat = new THREE.MeshStandardMaterial({ map: tex, color: "#e2d2b4", roughness: 0.92 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: "#8c7a5c", roughness: 1 });
    return { cyl, box, timberMat, plankMat, ropeMat };
  }, [assets]);

  useEffect(
    () => () => {
      cyl.dispose();
      box.dispose();
      timberMat.dispose();
      plankMat.dispose();
      ropeMat.dispose();
    },
    [cyl, box, timberMat, plankMat, ropeMat]
  );

  useFrame(() => {
    const p = progress.current;
    if (Math.abs(p - last.current) < 1e-4) return;
    last.current = p;
    const apply = (ref: React.RefObject<THREE.InstancedMesh | null>, list: Member[]) => {
      const im = ref.current;
      if (!im) return;
      for (let i = 0; i < list.length; i++) {
        const mb = list[i];
        writeMatrix(im, i, mb, smoothstep(mb.birth, mb.birth + 0.075, p));
      }
      im.instanceMatrix.needsUpdate = true;
      im.visible = p > 0.15;
    };
    apply(roundRef, groups.round);
    apply(plankRef, groups.plank);
    apply(ropeRef, groups.rope);
  });

  return (
    <group>
      <instancedMesh ref={roundRef} args={[cyl, timberMat, groups.round.length]} frustumCulled={false} />
      <instancedMesh ref={plankRef} args={[box, plankMat, groups.plank.length]} frustumCulled={false} />
      <instancedMesh ref={ropeRef} args={[cyl, ropeMat, groups.rope.length]} frustumCulled={false} />
    </group>
  );
}

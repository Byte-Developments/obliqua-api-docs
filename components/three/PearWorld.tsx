"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { PearModel, PEAR_SCALE, PEAR_BOTTOM } from "./PearModel";
import { createPearUniforms } from "./HalftoneMaterial";
import { Scaffold, LOWER, UPPER, SHEET_ROD } from "./Scaffold";
import { Figures, type FigureSpec } from "./Figures";
import { PaperSheets, type SheetSpec } from "./PaperSheets";
import { Clouds } from "./Clouds";
import { applyCamera } from "./CameraRig";
import { keyframes, keyframesVec, range, smoothstep, ease, lerp, type Key } from "@/lib/animation";
import { T } from "@/lib/sceneConfig";
import type { Assets } from "@/lib/assets";
import { state } from "@/lib/store";

// SCENES 10 – 15: the blue world. A printed pear the size of a building rises out of the
// bottom of the frame, becomes fruit, is measured against a person, restored inside timber
// scaffolding, and finally documented on hanging sheets of drafting paper.

type V3 = [number, number, number];

const CAM: Key<V3>[] = [
  [752, [0, 7.5, 32]],
  [860, [0, 6.5, 30]],
  [905, [2.2, 1.0, 21]],
  [950, [1.6, 3.6, 19]],
  [990, [1.0, 8.4, 17.5]],
  [1030, [8.2, 6.8, 12.2]],
  [1062, [9.4, 4.4, 9.6]],
  [1100, [-3.2, 2.3, 34]],
  [1125, [-4.4, 2.6, 36]],
];
const LOOK: Key<V3>[] = [
  [752, [0, 7.5, 0]],
  [860, [0, 6.5, 0]],
  [905, [-1.2, 3.6, 0]],
  [950, [0, 6.2, 0]],
  [990, [0.2, 10.4, 0]],
  [1030, [0, 6.4, 0]],
  [1062, [0, 5.0, 0]],
  [1100, [-1.6, 6.2, 0]],
  [1125, [-1.3, 6.4, 0]],
];
// after the orbit: arrive face-to-face with the main drawing
const SHEET_CENTER_Y = SHEET_ROD.y - 4.65;
const CAM_END: Key<V3>[] = [
  [1300, [0, 0, 0]], // replaced at runtime by the orbit's last position
  [1345, [0.4, SHEET_CENTER_Y - 0.6, 20]],
  [1398, [0, SHEET_CENTER_Y, SHEET_ROD.z + 6.6]],
];
const LOOK_END: Key<V3>[] = [
  [1300, [0, 6.6, 0]],
  [1345, [0, SHEET_CENTER_Y - 0.2, SHEET_ROD.z]],
  [1398, [0, SHEET_CENTER_Y, SHEET_ROD.z]],
];

const polar = (r: number, a: number, y: number): V3 => [Math.sin(a) * r, y, Math.cos(a) * r];
const deckR = (LOWER.inner + LOWER.outer) / 2;
const upperR = (UPPER.inner + UPPER.outer) / 2;

const FIGURES: FigureSpec[] = [
  { key: "admirer", at: [-7.6, 0, 5.6], height: 1.85, t: [1050, 1084, 1330, 1350] },
  { key: "builder1", at: polar(deckR, -0.72, LOWER.levels[0] + 0.11), height: 1.8, t: [1218, 1244, 1336, 1352] },
  { key: "builder2", at: polar(deckR, 0.82, LOWER.levels[1] + 0.11), height: 1.8, t: [1232, 1258, 1336, 1352], flip: true },
  { key: "builder3", at: polar(upperR, 0.3, UPPER.levels[0] + 0.11), height: 1.25, t: [1248, 1274, 1336, 1352] },
];

const SHEETS: SheetSpec[] = [
  { drawing: "elevation", at: [0, SHEET_ROD.y, SHEET_ROD.z], rotY: 0, size: [7.2, 9.6], unroll: [1288, 1334], settle: [1348, 1392] },
  { drawing: "section", at: polar(UPPER.outer + 0.35, -0.95, UPPER.levels[1]), rotY: -0.95, size: [4.2, 5.6], unroll: [1298, 1338] },
  { drawing: "scaffold", at: polar(UPPER.outer + 0.35, 0.98, UPPER.levels[1]), rotY: 0.98, size: [4.2, 5.6], unroll: [1306, 1346] },
  { drawing: "stem", at: polar(LOWER.outer + 0.4, 0.5, LOWER.top), rotY: 0.5, size: [3.0, 4.0], unroll: [1314, 1352] },
];

const BLUE = new THREE.Color("#0865F4");
const GALLERY = new THREE.Color("#F5F1E8");
const v3a: V3 = [0, 0, 0];
const v3b: V3 = [0, 0, 0];

function ContactShadow({ position, radius, opacity }: { position: V3; radius: number; opacity: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uOpacity: { value: opacity }, uColor: { value: new THREE.Color("#0340b0") } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv;
          void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(1.0 - smoothstep(0.0, 1.0, d), 2.2) * uOpacity;
          gl_FragColor = vec4(uColor, a);
          #include <colorspace_fragment>
          }`,
      }),
    [opacity]
  );
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} material={mat}>
      <planeGeometry args={[radius * 2, radius * 2]} />
    </mesh>
  );
}

export function PearWorld({ assets }: { assets: Assets }) {
  const group = useRef<THREE.Group>(null);
  const pear = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const scene = useThree((s) => s.scene);
  const dpr = useThree((s) => s.viewport.dpr);
  const uniforms = useMemo(() => createPearUniforms(), []);
  const scaffoldP = useRef(0);
  const tRef = useRef(0);
  const camEnd = useMemo(() => CAM_END.map(([k, v]) => [k, [...v]] as Key<V3>), []);
  const mobile = state.isMobile;

  useFrame(() => {
    const t = state.t;
    tRef.current = t;
    const g = group.current;
    if (!g) return;
    const active = t > T.halves[0] + 60;
    g.visible = active;

    // background: cobalt from the hero until the paper takes over at the very end
    const bgMix = smoothstep(T.finale[0] - 12, T.finale[0] + 14, t);
    if (scene.background instanceof THREE.Color) scene.background.copy(BLUE).lerp(GALLERY, bgMix);
    if (!active) return;

    // ---- the pear: rises tilted from the lower left, rights itself, then holds still
    const rise = (x: number) => ease.power3Out(x);
    const py = keyframes(t, [[T.pearRise[0], -34], [T.pearRise[0] + 50, -11], [T.pearRise[1], 0]], rise);
    const p = pear.current!;
    p.position.set(
      keyframes(t, [[T.pearRise[0], -8], [T.pearRise[1], 0]], rise),
      py - PEAR_BOTTOM * PEAR_SCALE,
      0
    );
    p.rotation.set(
      keyframes(t, [[T.pearRise[0], -0.5], [T.pearRise[1], -0.03]]),
      0.35 + t * 0.0007,
      keyframes(t, [[T.pearRise[0], 0.3], [T.pearRise[1], 0.025]])
    );
    p.scale.setScalar(PEAR_SCALE);
    p.visible = t > T.pearRise[0] - 5;
    if (shadow.current) shadow.current.visible = py > -2;

    uniforms.uOpacity.value = keyframes(t, [[T.pearRise[0], 0.4], [T.pearRise[0] + 90, 1]]);
    uniforms.uDotScale.value = keyframes(t, [[T.pearRise[0], 15], [T.pearRise[0] + 100, 8.5]]) * (mobile ? 0.75 : 1);
    uniforms.uThreshold.value = keyframes(t, [[T.pearRise[0], 0.3], [T.pearRise[0] + 100, 0.05]]);
    uniforms.uMorph.value = ease.sineInOut(range(t, T.pearGold[0] + 5, T.pearGold[0] + 72));
    uniforms.uPixelRatio.value = dpr;
    uniforms.uTime.value = state.time;

    scaffoldP.current = range(t, T.scaffold[0], T.scaffold[1]);

    // ---- the lens
    const fov = state.aspect < 0.9 ? 52 : state.aspect < 1.3 ? 42 : 35;
    let pos: V3, look: V3;
    if (t < T.monument[1]) {
      pos = keyframesVec(t, CAM, v3a);
      look = keyframesVec(t, LOOK, v3b);
    } else {
      // a few degrees of slow orbit while the scaffold builds, then on to the drawing
      const orbit = (tt: number, out: V3) => {
        const k = ease.sineInOut(range(tt, T.monument[1], T.scaffold[1]));
        const a = lerp(Math.atan2(-4.4, 36), 0.24, k);
        const r = lerp(Math.hypot(-4.4, 36), 31, k);
        out[0] = Math.sin(a) * r;
        out[1] = lerp(2.6, 6.2, k);
        out[2] = Math.cos(a) * r;
        return out;
      };
      if (t < T.scaffold[1] - 5) {
        pos = orbit(t, v3a);
        const k = ease.sineInOut(range(t, T.monument[1], T.scaffold[1]));
        v3b[0] = lerp(-1.3, 0, k);
        v3b[1] = lerp(6.4, 6.6, k);
        v3b[2] = 0;
        look = v3b;
      } else {
        orbit(T.scaffold[1] - 5, camEnd[0][1]);
        camEnd[0][0] = T.scaffold[1] - 5;
        pos = keyframesVec(t, camEnd, v3a);
        look = keyframesVec(t, LOOK_END, v3b);
      }
    }
    applyCamera(camera, pos, look, { fov, sway: 0.25 });
  });

  return (
    <group ref={group}>
      <Environment resolution={128} frames={1}>
        <color attach="background" args={["#0865F4"]} />
        <Lightformer form="rect" intensity={2.2} color="#fff7ea" position={[-6, 8, 6]} scale={[10, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.0} color="#ffffff" position={[8, 2, 4]} scale={[3, 10, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={0.6} color="#bcd4ff" position={[0, -6, -6]} scale={6} target={[0, 0, 0]} />
      </Environment>
      <hemisphereLight args={["#fff6e6", "#8a9cc4", 0.55]} />
      <directionalLight position={[-12, 18, 14]} intensity={3.6} color="#fff0d6" />
      <directionalLight position={[14, 6, -10]} intensity={1.6} color="#e4ecff" />
      <directionalLight position={[6, -4, 12]} intensity={0.5} color="#ffe2b0" />
      <ambientLight intensity={0.18} color="#fff4e2" />

      <Clouds assets={assets} />

      <group ref={pear}>
        <PearModel assets={assets} uniforms={uniforms} detail={mobile ? "low" : "high"} />
      </group>
      <group ref={shadow}>
        <ContactShadow position={[0, 0.01, 0]} radius={7.5} opacity={0.55} />
        <ContactShadow position={[-7.6, 0.012, 5.6]} radius={0.9} opacity={0.5} />
      </group>

      <Scaffold assets={assets} progress={scaffoldP} />
      <Figures assets={assets} specs={FIGURES} t={tRef} />
      <PaperSheets assets={assets} specs={SHEETS} lowDetail={mobile} />
    </group>
  );
}

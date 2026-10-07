"use client";

import { useCallback, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Fabric, type FabricUniforms } from "./Fabric";
import { applyCamera, frustumHalf } from "./CameraRig";
import { keyframes, lerp, range, smoothstep, ease } from "@/lib/animation";
import { T } from "@/lib/sceneConfig";
import type { Assets } from "@/lib/assets";
import { state } from "@/lib/store";

// SCENES 01 – 02: a figure steps out from behind a monumental curtain on a flat cobalt field.
// Scrolling pushes the curtain toward the lens until the camera passes through cloth, which
// warms from charcoal to an overexposed cream — the seed of the next scene.

const CHARCOAL = new THREE.Color("#5a5a5c");
const CREAM = new THREE.Color("#f1e6d6");
const PEACH = new THREE.Color("#f2dcc6");
const tmp = new THREE.Color();

const CAM_Z = 10;

export function HeroWorld({ assets }: { assets: Assets }) {
  const group = useRef<THREE.Group>(null);
  const figure = useRef<THREE.Mesh>(null);
  const curtain = useRef<THREE.Mesh>(null);
  const fabric = useRef<{ u: FabricUniforms; mat: THREE.MeshStandardMaterial } | null>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const scene = useThree((s) => s.scene);
  const mobile = state.isMobile;

  const figureTex = assets.images.hero;
  const figAspect = useMemo(() => {
    const img = figureTex.image as { width?: number; height?: number };
    return img?.width && img?.height ? img.width / img.height : 0.5;
  }, [figureTex]);

  const onUniforms = useCallback((u: FabricUniforms, mat: THREE.MeshStandardMaterial) => {
    fabric.current = { u, mat };
  }, []);

  const segments = useMemo<[number, number]>(() => (mobile ? [70, 90] : [140, 180]), [mobile]);

  useFrame(() => {
    const t = state.t;
    const g = group.current;
    if (!g) return;
    const active = t < T.pruning[0] + 40;
    g.visible = active;
    if (!active) return;
    // the shared environment is the cobalt world; the curtain must stay charcoal
    scene.environmentIntensity = 0.06;

    const p = range(t, T.hero[0], T.hero[1]);
    const q = range(t, T.fabric[0], T.fabric[1]);
    const aspect = state.aspect;
    const { h: halfH, w: halfW } = frustumHalf(camera, CAM_Z);
    const narrow = aspect < 0.9;

    // ---- the figure: stands right of centre, takes a small step toward the curtain
    const figH = narrow ? halfH * 1.12 : halfH * 1.8;
    const fx0 = narrow ? halfW * 0.22 : halfW * 0.36;
    const fig = figure.current!;
    fig.scale.set(figH * figAspect, figH, 1);
    fig.position.set(
      fx0 + smoothstep(0.12, 0.4, p) * halfW * 0.08,
      -halfH + figH / 2 + (narrow ? -halfH * 0.12 : 0.06),
      0
    );

    // ---- the curtain: hangs at the right edge, then comes forward and swallows the frame
    const c = curtain.current!;
    // on phones only the curtain's leading folds enter the frame (it is 3.8 units wide)
    const cx0 = narrow ? halfW * 0.7 + 1.9 : halfW * 0.86;
    const cx = keyframes(p, [[0.22, cx0], [0.78, halfW * 0.2], [1, 0.25]], ease.sineInOut);
    const cz = keyframes(t, [[T.hero[0] + 150 * 0.25, 0.65], [T.hero[0] + 150 * 0.55, 3.0], [T.fabric[1], 3.6]]);
    const widen = keyframes(p, [[0.4, 1], [0.78, 2.7]]);
    c.position.set(cx, 0.1, cz);
    c.scale.set(widen, 1, 1);
    c.rotation.set(0, keyframes(p, [[0, -0.32], [0.7, -0.05]]), keyframes(q, [[0.2, 0], [0.9, -0.42]]));

    const f = fabric.current;
    if (f) {
      f.u.uTime.value = state.time;
      f.u.uAmp.value = keyframes(q, [[0, 1.25], [0.7, 0.7]]);
      f.u.uWind.value = 1 - q * 0.6;
      tmp.copy(CHARCOAL).lerp(CREAM, smoothstep(0.32, 0.82, q));
      f.mat.color.copy(tmp);
      f.mat.emissive.copy(PEACH);
      f.mat.emissiveIntensity = smoothstep(0.5, 0.95, q) * 0.5;
      // the weave dissolves into soft light as the lens closes in
      f.mat.normalScale.setScalar(0.3 - smoothstep(0.2, 0.7, q) * 0.24);
    }

    // ---- the lens: still, then drifting toward the cloth, then right into it
    const camZ = keyframes(t, [[T.hero[0] + 150 * 0.6, CAM_Z], [T.hero[1], 7.3], [T.fabric[0] + 110 * 0.6, 4.9], [T.fabric[1], 4.65]]);
    const camX = lerp(0, cx, smoothstep(0.5, 1, p));
    const camY = keyframes(q, [[0, 0], [1, 0.4]]);
    applyCamera(camera, [camX, camY, camZ], [camX + smoothstep(0, 1, q) * 0.15, camY, camZ - 10], { sway: 0.08 * (1 - p) });
  });

  return (
    <group ref={group}>
      <hemisphereLight args={["#f4f1ea", "#5a5650", 0.35]} />
      <ambientLight intensity={0.2} color="#f2efe9" />
      <directionalLight position={[-7, 2.5, 3.2]} intensity={4.6} color="#fff4e6" />
      <directionalLight position={[5, -2, 3]} intensity={0.25} color="#d9e4ff" />
      <mesh ref={figure} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={figureTex} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <Fabric ref={curtain} assets={assets} width={3.8} height={9.2} segments={segments} onUniforms={onUniforms} />
    </group>
  );
}

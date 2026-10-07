"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HeroWorld } from "./HeroWorld";
import { PhotoStage } from "./PhotoStage";
import { PearWorld } from "./PearWorld";
import type { Assets } from "@/lib/assets";

// Owns the three "worlds" that share the single persistent canvas. Each world decides its own
// visibility from the timeline, so nothing is ever mounted or destroyed while scrolling.

export function SceneManager({ assets, onReady }: { assets: Assets; onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const frames = useRef(0);
  const announced = useRef(false);

  useEffect(() => {
    // upload every texture and compile every program now, so no scene hitches when it first appears
    const all = [...Object.values(assets.images), ...Object.values(assets.textures), ...Object.values(assets.drawings)];
    all.forEach((t) => gl.initTexture(t as THREE.Texture));
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    gl.compile(scene, camera);
    hidden.forEach((o) => (o.visible = false));
  }, [assets, gl, scene, camera]);

  useFrame(() => {
    frames.current++;
    if (!announced.current && frames.current > 3) {
      announced.current = true;
      onReady();
    }
  });

  return (
    <>
      <HeroWorld assets={assets} />
      <PhotoStage assets={assets} />
      <PearWorld assets={assets} />
    </>
  );
}

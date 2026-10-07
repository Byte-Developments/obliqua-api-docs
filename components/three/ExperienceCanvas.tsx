"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { SceneManager } from "./SceneManager";
import type { Assets } from "@/lib/assets";
import { setCanvasLive } from "@/lib/scroll";
import { state } from "@/lib/store";

// The one persistent WebGL canvas. It never remounts; the GSAP ticker renders it.

export default function ExperienceCanvas({ assets, onReady }: { assets: Assets | null; onReady: () => void }) {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        frameloop="never"
        flat
        dpr={[1, state.isMobile ? 1.5 : 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false }}
        camera={{ fov: 35, near: 0.05, far: 220, position: [0, 0, 10] }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color("#0865F4");
          setCanvasLive(true);
        }}
      >
        {assets && <SceneManager assets={assets} onReady={onReady} />}
      </Canvas>
    </div>
  );
}

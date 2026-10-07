"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { VALUE2 } from "./glsl";
import { smoothstep } from "@/lib/animation";
import type { Assets } from "@/lib/assets";
import type { ImageKey } from "@/lib/imageManifest";

// Photographed people standing in the 3D world for scale. They are cylindrical billboards
// (they turn with the camera's azimuth, never tilt) and appear by being "drawn in" from the
// feet up with a ragged edge, as if inked onto the scene — never a plain fade.

export type FigureSpec = {
  key: ImageKey;
  /** world position of the feet */
  at: [number, number, number];
  height: number;
  /** timeline window that draws the figure in and out */
  t: [number, number, number, number];
  flip?: boolean;
};

function createCutoutMaterial(tex: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: tex },
      uReveal: { value: 0 },
      uFlip: { value: 1 },
      uTone: { value: new THREE.Color(1, 1, 1) },
    },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv; uniform float uFlip;
      void main(){ vUv = vec2(uFlip > 0.0 ? uv.x : 1.0 - uv.x, uv.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex; uniform float uReveal; uniform vec3 uTone;
      varying vec2 vUv;
      ${VALUE2}
      void main(){
        vec4 c = texture2D(uTex, vUv);
        float edge = vUv.y + (fbm(vUv * vec2(9.0, 4.0)) - 0.5) * 0.18;
        float m = 1.0 - smoothstep(uReveal * 1.25 - 0.1, uReveal * 1.25 - 0.04, edge);
        if (c.a * m < 0.01) discard;
        gl_FragColor = vec4(c.rgb * uTone, c.a * m);
        #include <colorspace_fragment>
      }
    `,
  });
}

export function Figures({ assets, specs, t }: { assets: Assets; specs: FigureSpec[]; t: { current: number } }) {
  const camera = useThree((s) => s.camera);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useMemo(() => specs.map((s) => {
    const m = createCutoutMaterial(assets.images[s.key]);
    m.uniforms.uFlip.value = s.flip ? -1 : 1;
    return m;
  }), [assets, specs]);
  const aspects = useMemo(
    () =>
      specs.map((s) => {
        const img = assets.images[s.key].image as { width?: number; height?: number };
        return img?.width && img?.height ? img.width / img.height : 0.45;
      }),
    [assets, specs]
  );

  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);

  useFrame(() => {
    specs.forEach((s, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const [a, b, c, d] = s.t;
      const r = Math.min(smoothstep(a, b, t.current), 1 - smoothstep(c, d, t.current));
      mesh.visible = r > 0.001;
      if (!mesh.visible) return;
      mats[i].uniforms.uReveal.value = r;
      mesh.scale.set(s.height * aspects[i], s.height, 1);
      mesh.position.set(s.at[0], s.at[1] + s.height / 2, s.at[2]);
      mesh.rotation.y = Math.atan2(camera.position.x - s.at[0], camera.position.z - s.at[2]);
    });
  });

  return (
    <group>
      {specs.map((s, i) => (
        <mesh key={s.key + i} ref={(m) => { refs.current[i] = m; }} material={mats[i]} renderOrder={20}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

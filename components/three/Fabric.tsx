"use client";

import { forwardRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { SIMPLEX3 } from "./glsl";
import type { Assets } from "@/lib/assets";

// Art-directable drapery: no cloth simulation, just layered vertical folds, noise and a slow
// wind, displaced in the vertex shader with normals rebuilt by finite differences so the key
// light rakes across real folds.

export type FabricUniforms = {
  uTime: { value: number };
  uAmp: { value: number };
  uWind: { value: number };
  uSize: { value: THREE.Vector2 };
  uBillow: { value: number };
};

const DRAPE = /* glsl */ `
uniform float uTime, uAmp, uWind, uBillow;
uniform vec2 uSize;
${SIMPLEX3}
vec3 drape(vec3 p){
  float yN = p.y / uSize.y + 0.5;         // 0 hem .. 1 rod
  float hang = 1.0 - yN;
  float x = p.x;
  // folds open up as they fall from the rod
  float k = mix(1.0, 1.75, yN);
  float sway = sin(uTime * 0.35 + p.y * 0.25) * 0.18 * hang * uWind;
  float xs = x + sway;
  float d = 0.0;
  d += sin(xs * 2.15 * k + 0.6) * 0.30;
  d += sin(xs * 4.70 * k + 1.9 + snoise(vec3(x * 0.3, p.y * 0.12, 1.0)) * 1.6) * 0.15;
  d += sin(xs * 9.80 * k + 4.1) * 0.045;
  d += snoise(vec3(x * 0.55, p.y * 0.16, uTime * 0.05)) * 0.16;
  d += sin(p.y * 0.8 + uTime * 0.6 + x * 0.4) * 0.05 * hang * uWind;
  d *= uAmp * mix(0.75, 1.25, hang);
  // the whole sheet bellies toward the camera when it is pushed through
  d += uBillow * (1.0 - pow(abs(p.x) / (uSize.x * 0.5), 2.0)) * 0.9;
  // fabric gathers horizontally where it folds deepest
  float gx = cos(xs * 2.15 * k + 0.6) * 0.05 * uAmp;
  return vec3(p.x + gx + sway * 0.6, p.y, p.z + d);
}
`;

export const Fabric = forwardRef<THREE.Mesh, { assets: Assets; width: number; height: number; segments: [number, number]; onUniforms: (u: FabricUniforms, mat: THREE.MeshStandardMaterial) => void }>(
  function Fabric({ assets, width, height, segments, onUniforms }, ref) {
    const geometry = useMemo(() => new THREE.PlaneGeometry(width, height, segments[0], segments[1]), [width, height, segments]);

    const material = useMemo(() => {
      const map = assets.textures.fabricColor.clone();
      map.repeat.set(width * 7, height * 7);
      map.needsUpdate = true;
      const normal = assets.textures.fabricNormal.clone();
      normal.repeat.copy(map.repeat);
      normal.needsUpdate = true;
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#46474b"),
        map,
        normalMap: normal,
        normalScale: new THREE.Vector2(0.3, 0.3),
        roughness: 0.88,
        metalness: 0,
        side: THREE.DoubleSide,
        envMapIntensity: 0.05,
      });
      const uniforms: FabricUniforms = {
        uTime: { value: 0 },
        uAmp: { value: 1 },
        uWind: { value: 1 },
        uSize: { value: new THREE.Vector2(width, height) },
        uBillow: { value: 0 },
      };
      mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\n" + DRAPE)
          .replace(
            "#include <beginnormal_vertex>",
            `float e = 0.02;
             vec3 dp0 = drape(position);
             vec3 dpx = drape(position + vec3(e, 0.0, 0.0));
             vec3 dpy = drape(position + vec3(0.0, e, 0.0));
             vec3 objectNormal = normalize(cross(dpx - dp0, dpy - dp0));
             #ifdef USE_TANGENT
               vec3 objectTangent = vec3(tangent.xyz);
             #endif`
          )
          .replace("#include <begin_vertex>", "vec3 transformed = dp0;");
      };
      mat.customProgramCacheKey = () => "drape";
      onUniforms(uniforms, mat);
      return mat;
    }, [assets, width, height, onUniforms]);

    useEffect(
      () => () => {
        geometry.dispose();
        material.dispose();
      },
      [geometry, material]
    );

    return <mesh ref={ref} geometry={geometry} material={material} />;
  }
);

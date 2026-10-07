import * as THREE from "three";
import { HALFTONE, VALUE2, SIMPLEX3 } from "./glsl";

// The printed / offset-press language of the site. One generic material for flat textured
// objects (clouds, dots), and a patch that lets the physical pear dissolve out of halftone.

// Raw sRGB triplets: these are mixed with colour that has already been output-encoded.
const srgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

export type HalftoneUniforms = {
  uMap: { value: THREE.Texture | null };
  uDotScale: { value: number };
  uThreshold: { value: number };
  uProgress: { value: number };
  uOpacity: { value: number };
  uInk: { value: THREE.Color };
  uPixelRatio: { value: number };
};

/**
 * Generic halftone material for textured planes. uProgress 0 = the photograph,
 * 1 = fully printed dots. Uses the texture alpha as the shape.
 */
export function createHalftoneMaterial(map: THREE.Texture, ink = "#FFFFFF") {
  const uniforms: HalftoneUniforms = {
    uMap: { value: map },
    uDotScale: { value: 7 },
    uThreshold: { value: 0.12 },
    uProgress: { value: 1 },
    uOpacity: { value: 1 },
    // linear: this material outputs through three's colour-space conversion
    uInk: { value: new THREE.Color(ink) },
    uPixelRatio: { value: 1 },
  };
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uDotScale, uThreshold, uProgress, uOpacity, uPixelRatio;
      uniform vec3 uInk;
      varying vec2 vUv;
      ${HALFTONE}
      void main(){
        vec4 tex = texture2D(uMap, vUv);
        vec3 photo = tex.rgb;
        float lum = dot(photo, vec3(0.299, 0.587, 0.114));
        float tone = clamp((tex.a * (0.35 + lum * 0.75) - uThreshold) / (1.0 - uThreshold), 0.0, 1.0);
        float dotA = halftoneDot(gl_FragCoord.xy, tone, uDotScale * uPixelRatio) * smoothstep(0.0, 0.06, tone);
        vec4 printed = vec4(uInk, dotA);
        vec4 c = mix(vec4(photo, tex.a), printed, uProgress);
        gl_FragColor = vec4(c.rgb, c.a * uOpacity);
        #include <colorspace_fragment>
      }
    `,
  });
}

export type PearUniforms = {
  uMorph: { value: number };
  uDotScale: { value: number };
  uThreshold: { value: number };
  uOpacity: { value: number };
  uBg: { value: THREE.Vector3 };
  uInk: { value: THREE.Vector3 };
  uPixelRatio: { value: number };
  uTime: { value: number };
};

export function createPearUniforms(bg = "#0865F4", ink = "#F4F1EA"): PearUniforms {
  return {
    uMorph: { value: 0 },
    uDotScale: { value: 9 },
    uThreshold: { value: 0.1 },
    uOpacity: { value: 1 },
    uBg: { value: srgb(bg) },
    uInk: { value: srgb(ink) },
    uPixelRatio: { value: 1 },
    uTime: { value: 0 },
  };
}

/**
 * Patches a MeshPhysicalMaterial so it can render as an enormous printed sculpture
 * (uMorph = 0) and dissolve, with an organic noise front, into real fruit skin (uMorph = 1).
 */
export function patchPearMaterial(mat: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial, uniforms: PearUniforms) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vObjPos;
        uniform float uMorph, uDotScale, uThreshold, uOpacity, uPixelRatio, uTime;
        uniform vec3 uBg, uInk;
        ${SIMPLEX3}
        ${HALFTONE}`
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        {
          vec3 lit = gl_FragColor.rgb;
          float lum = dot(lit, vec3(0.299, 0.587, 0.114));
          float tone = smoothstep(uThreshold + 0.12, 0.92, lum) * uOpacity;
          float dotA = halftoneDot(gl_FragCoord.xy, tone, uDotScale * uPixelRatio);
          vec3 printed = mix(uBg, uInk, dotA);
          float n = snoise(vObjPos * 0.9) * 0.5 + 0.5;
          n = n * 0.7 + (snoise(vObjPos * 3.1 + 3.1) * 0.5 + 0.5) * 0.3;
          float front = uMorph * 1.3 - 0.15;
          float m = smoothstep(n - 0.05, n + 0.05, front);
          float edge = smoothstep(0.0, 0.05, front - n + 0.05) * (1.0 - smoothstep(0.05, 0.12, front - n + 0.05));
          vec3 col = mix(printed, lit, m);
          col = mix(col, uInk, edge * 0.85 * step(0.001, uMorph) * step(uMorph, 0.999));
          gl_FragColor.rgb = col;
        }`
      );
  };
  // make sure three does not reuse a cached program from an unpatched physical material
  mat.customProgramCacheKey = () => "pear-halftone-" + mat.type;
  return uniforms;
}

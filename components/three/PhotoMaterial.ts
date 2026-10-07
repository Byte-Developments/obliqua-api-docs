import * as THREE from "three";
import { VALUE2 } from "./glsl";

// Screen-space photographic layer. Each photograph is a full-screen quad that cover-crops
// itself around a focus point, can push in (scale), pan, rack-focus (mip bias), wash out to
// a colour, and reveal itself through an organic noise mask instead of an opacity fade.

export const REVEAL = { dissolve: 0, radial: 1, diagonal: 2, split: 3 } as const;

export type PhotoUniforms = {
  uTex: { value: THREE.Texture };
  uImgAspect: { value: number };
  uRes: { value: THREE.Vector2 };
  uFocus: { value: THREE.Vector2 };
  uScale: { value: number };
  uPan: { value: THREE.Vector2 };
  uReveal: { value: number };
  uMode: { value: number };
  uSoft: { value: number };
  uWash: { value: number };
  uWashColor: { value: THREE.Color };
  uBlur: { value: number };
  uSplit: { value: number };
  uPortal: { value: THREE.Vector2 };
  uPortalColor: { value: THREE.Color };
  uSeed: { value: number };
  uOpacity: { value: number };
  uGrade: { value: number };
};

export function createPhotoMaterial(tex: THREE.Texture, mode: number, seed: number) {
  const img = tex.image as { width?: number; height?: number } | undefined;
  const uniforms: PhotoUniforms = {
    uTex: { value: tex },
    uImgAspect: { value: img?.width && img?.height ? img.width / img.height : 16 / 9 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uFocus: { value: new THREE.Vector2(0.5, 0.5) },
    uScale: { value: 1 },
    uPan: { value: new THREE.Vector2(0, 0) },
    uReveal: { value: 0 },
    uMode: { value: mode },
    uSoft: { value: 0.12 },
    uWash: { value: 0 },
    uWashColor: { value: new THREE.Color("#F3E6D6") },
    uBlur: { value: 0 },
    uSplit: { value: 0 },
    uPortal: { value: new THREE.Vector2(0, 0) },
    uPortalColor: { value: new THREE.Color("#0865F4") },
    uSeed: { value: seed },
    uOpacity: { value: 1 },
    uGrade: { value: 0 },
  };
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      void main(){ gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex;
      uniform float uImgAspect, uScale, uReveal, uMode, uSoft, uWash, uBlur, uSplit, uSeed, uOpacity, uGrade;
      uniform vec2 uRes, uFocus, uPan, uPortal;
      uniform vec3 uWashColor, uPortalColor;
      ${VALUE2}

      vec2 coverUv(vec2 p){
        float sA = uRes.x / uRes.y;
        vec2 ext = sA > uImgAspect ? vec2(1.0, uImgAspect / sA) : vec2(sA / uImgAspect, 1.0);
        ext /= uScale;
        vec2 c = clamp(uFocus, ext * 0.5, 1.0 - ext * 0.5);
        return c + p * ext + uPan;
      }

      void main(){
        vec2 suv = gl_FragCoord.xy / uRes;
        float sA = uRes.x / uRes.y;
        vec2 p = suv - 0.5;
        vec3 col;

        if (uMode > 2.5) {
          // the two pear halves part; the void between them is a cobalt portal
          float s = uSplit;
          if (abs(p.x) <= s) {
            col = texture2D(uTex, vec2(0.5, 0.965)).rgb; // the studio white of the photograph itself
            vec2 q = abs(p) - uPortal * 0.5;
            if (q.x < 0.0 && q.y < 0.0) col = uPortalColor;
          } else {
            vec2 pp = vec2(p.x - sign(p.x) * s, p.y);
            vec2 iuv = coverUv(pp);
            col = texture2D(uTex, iuv, uBlur).rgb;
          }
          float nS = fbm(vec2(suv.x * sA, suv.y) * 2.6 + uSeed);
          float wS = uSoft;
          float xS = uReveal * (1.0 + 2.0 * wS) - wS;
          gl_FragColor = vec4(col, (1.0 - smoothstep(xS - wS, xS + wS, nS)) * uOpacity);
          #include <colorspace_fragment>
          return;
        }

        vec2 iuv = coverUv(p);
        col = texture2D(uTex, clamp(iuv, 0.001, 0.999), uBlur).rgb;
        // gentle editorial grade: lift blacks a touch, warm highlights
        col = mix(col, col * vec3(1.02, 1.0, 0.97) + 0.012, uGrade);
        col = mix(col, uWashColor, uWash);

        float n = fbm(vec2(suv.x * sA, suv.y) * 2.6 + uSeed);
        float f;
        if (uMode < 0.5) f = n;
        else if (uMode < 1.5) {
          float r = length(p * vec2(sA, 1.0)) / (0.5 * length(vec2(sA, 1.0)));
          f = r * 0.78 + n * 0.22;
        } else {
          f = (suv.x * 0.55 + (1.0 - suv.y) * 0.45) * 0.78 + n * 0.22;
        }
        float w = uSoft;
        float x = uReveal * (1.0 + 2.0 * w) - w;
        float m = 1.0 - smoothstep(x - w, x + w, f);
        gl_FragColor = vec4(col, m * uOpacity);
        #include <colorspace_fragment>
      }
    `,
  });
}

/** Defocused foreground leaves: sprites in screen space that can sweep past the lens. */
export function createSpriteMaterial(tex: THREE.Texture) {
  const img = tex.image as { width?: number; height?: number } | undefined;
  return new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: tex },
      uImgAspect: { value: img?.width && img?.height ? img.width / img.height : 1.5 },
      uAspect: { value: 1.6 },
      uPos: { value: new THREE.Vector2() },
      uSize: { value: 1 },
      uRot: { value: 0 },
      uFlip: { value: 1 },
      uBlur: { value: 0 },
      uOpacity: { value: 0 },
      uTint: { value: new THREE.Color(0.45, 0.5, 0.4) },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform vec2 uPos; uniform float uSize, uRot, uAspect, uImgAspect, uFlip;
      varying vec2 vUv;
      void main(){
        vUv = vec2(uFlip > 0.0 ? uv.x : 1.0 - uv.x, uv.y);
        vec2 l = position.xy * vec2(uImgAspect, 1.0) * uSize;
        float c = cos(uRot), s = sin(uRot);
        l = mat2(c, s, -s, c) * l;
        gl_Position = vec4(uPos.x + l.x / uAspect, uPos.y + l.y, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex; uniform float uBlur, uOpacity; uniform vec3 uTint;
      varying vec2 vUv;
      void main(){
        vec4 t = texture2D(uTex, vUv, uBlur);
        gl_FragColor = vec4(t.rgb * uTint, t.a * uOpacity);
        #include <colorspace_fragment>
      }
    `,
  });
}

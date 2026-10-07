"use client";

import * as THREE from "three";
import { DRAWINGS, IMAGES, TEXTURES, imageUrl, type DrawingKey, type ImageKey, type TextureKey } from "./imageManifest";

// Loads, decodes and caches every texture before the film is revealed (no pop-in, no late
// decoding). Progress is real: it counts finished requests, nothing is faked.

export type Assets = {
  images: Record<ImageKey, THREE.Texture>;
  textures: Record<TextureKey, THREE.Texture>;
  drawings: Record<DrawingKey, THREE.Texture>;
};

let cache: Assets | null = null;
let pending: Promise<Assets> | null = null;

export const getAssets = () => cache;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // decode() guarantees the bitmap is ready before upload, avoiding a main-thread hitch later
      img.decode ? img.decode().then(() => resolve(img), () => resolve(img)) : resolve(img);
    };
    img.onerror = () => reject(new Error("failed " + src));
    img.src = src;
  });
}

/** A soft tonal stand-in so a missing file never renders as a black hole. */
function fallbackTexture(tone: string, cutout: boolean) {
  const c = document.createElement("canvas");
  c.width = cutout ? 64 : 256;
  c.height = cutout ? 64 : 144;
  const g = c.getContext("2d")!;
  if (!cutout) {
    const grd = g.createRadialGradient(128, 72, 10, 128, 72, 160);
    grd.addColorStop(0, tone);
    grd.addColorStop(1, "#000000");
    g.fillStyle = tone;
    g.fillRect(0, 0, c.width, c.height);
    g.globalAlpha = 0.25;
    g.fillStyle = grd;
    g.fillRect(0, 0, c.width, c.height);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.fallback = true;
  return tex;
}

function toTexture(img: HTMLImageElement | HTMLCanvasElement, srgb: boolean) {
  const tex = img instanceof HTMLCanvasElement ? new THREE.CanvasTexture(img) : new THREE.Texture(img);
  tex.needsUpdate = true;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

async function drawingTexture(src: string, paper: HTMLImageElement | null) {
  const W = 1536, H = 2048;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  if (paper) {
    const pat = g.createPattern(paper, "repeat");
    g.fillStyle = pat ?? "#F1EBDD";
  } else g.fillStyle = "#F1EBDD";
  g.fillRect(0, 0, W, H);
  try {
    const svg = await loadImage(src);
    g.drawImage(svg, 0, 0, W, H);
  } catch {
    /* blank sheet is still a sheet */
  }
  // faint fold creases — drafting paper that has been carried around a site
  g.globalAlpha = 0.06;
  g.fillStyle = "#6b5a3a";
  g.fillRect(W / 2 - 1, 0, 2, H);
  g.fillRect(0, H / 3, W, 2);
  g.fillRect(0, (2 * H) / 3, W, 2);
  g.globalAlpha = 1;
  return toTexture(c, true);
}

export function loadAssets(small: boolean, onProgress: (p: number) => void): Promise<Assets> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;

  const imageKeys = Object.keys(IMAGES) as ImageKey[];
  const texKeys = Object.keys(TEXTURES) as TextureKey[];
  const drawKeys = Object.keys(DRAWINGS) as DrawingKey[];
  const total = imageKeys.length + texKeys.length + drawKeys.length;
  let done = 0;
  const tick = () => onProgress(++done / total);

  pending = (async () => {
    const images = {} as Assets["images"];
    const textures = {} as Assets["textures"];
    const drawings = {} as Assets["drawings"];

    await Promise.all([
      ...imageKeys.map(async (k) => {
        const e = IMAGES[k];
        try {
          images[k] = toTexture(await loadImage(imageUrl(k, small)), true);
        } catch {
          images[k] = fallbackTexture(e.tone, e.kind === "cutout");
        }
        images[k].generateMipmaps = true;
        images[k].minFilter = THREE.LinearMipmapLinearFilter;
        tick();
      }),
      ...texKeys.map(async (k) => {
        const srgb = k === "pearColor" || k === "paper" || k === "timber" || k === "fabricColor";
        try {
          const tex = toTexture(await loadImage(TEXTURES[k]), srgb);
          if (k.startsWith("fabric") || k === "paper" || k === "timber") tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          if (k.startsWith("pear")) tex.wrapS = THREE.RepeatWrapping;
          textures[k] = tex;
        } catch {
          textures[k] = fallbackTexture("#808080", false);
        }
        tick();
      }),
    ]);

    let paper: HTMLImageElement | null = null;
    try {
      paper = await loadImage(TEXTURES.paper);
    } catch {
      paper = null;
    }
    await Promise.all(
      drawKeys.map(async (k) => {
        drawings[k] = await drawingTexture(DRAWINGS[k], paper);
        tick();
      })
    );

    cache = { images, textures, drawings };
    return cache;
  })();
  return pending;
}

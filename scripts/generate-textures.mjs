// Bakes the procedural material textures used by the WebGL scenes.
// Run with: node scripts/generate-textures.mjs
// Output: public/textures/*.webp (committed, so this only re-runs when art direction changes)
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = new URL("../public/textures/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

// ---------- deterministic noise ----------
let seed = 1337;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const PERM = new Uint8Array(512);
{
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
const hash3 = (x, y, z) => PERM[(PERM[(PERM[x & 255] + y) & 255] + z) & 255] / 255;
function vnoise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf
  );
}
function fbm3(x, y, z, oct = 4) {
  let a = 0.5, f = 1, s = 0, n = 0;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise3(x * f, y * f, z * f);
    n += a;
    a *= 0.5;
    f *= 2.03;
  }
  return s / n;
}
// 2D tileable noise: sample a torus in 4D-ish by using two cylinders
function tile2(u, v, scale, oct = 4) {
  const a = u * Math.PI * 2, b = v * Math.PI * 2;
  const r = scale / (Math.PI * 2);
  return fbm3(Math.cos(a) * r + 10, Math.sin(a) * r + 10, Math.cos(b) * r + Math.sin(b) * r * 0.7 + 3, oct);
}
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix3 = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function heightToNormal(h, w, hgt, strength, wrapX = true, wrapY = false) {
  const out = Buffer.alloc(w * hgt * 3);
  for (let y = 0; y < hgt; y++) {
    for (let x = 0; x < w; x++) {
      const xl = wrapX ? (x - 1 + w) % w : Math.max(0, x - 1);
      const xr = wrapX ? (x + 1) % w : Math.min(w - 1, x + 1);
      const yu = wrapY ? (y - 1 + hgt) % hgt : Math.max(0, y - 1);
      const yd = wrapY ? (y + 1) % hgt : Math.min(hgt - 1, y + 1);
      const dx = (h[y * w + xr] - h[y * w + xl]) * strength;
      const dy = (h[yd * w + x] - h[yu * w + x]) * strength;
      let nx = -dx, ny = dy, nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l; ny /= l; nz /= l;
      const i = (y * w + x) * 3;
      out[i] = Math.round((nx * 0.5 + 0.5) * 255);
      out[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      out[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
    }
  }
  return out;
}

async function save(name, buf, w, h, ch, quality = 86) {
  await sharp(buf, { raw: { width: w, height: h, channels: ch } }).webp({ quality }).toFile(OUT + name);
  console.log("wrote", name);
}

// ---------- pear skin (lathe UV: u = around, v = bottom -> top) ----------
async function pear() {
  const W = 2048, H = 1024;
  const col = Buffer.alloc(W * H * 3);
  const height = new Float32Array(W * H);
  const rough = Buffer.alloc(W * H);
  const gold = hex("#D2A23A"), ochre = hex("#BE8A22"), green = hex("#A8A044"), russet = hex("#8C5A2C"), blush = hex("#C8642E"), calyx = hex("#4A3418");

  for (let y = 0; y < H; y++) {
    const v = 1 - y / (H - 1); // image top = pear top
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const a = u * Math.PI * 2;
      const cx = Math.cos(a), cz = Math.sin(a);
      const low = fbm3(cx * 1.6 + 4, v * 4.2, cz * 1.6 + 4, 4);
      const mid = fbm3(cx * 6 + 9, v * 15.8, cz * 6 + 9, 3);
      let c = mix3(ochre, gold, smooth(0.25, 0.75, low));
      c = mix3(c, green, smooth(0.55, 0.95, v) * 0.55 + (mid - 0.5) * 0.25);
      // sun blush on one cheek
      const cheek = Math.max(0, Math.cos(a - 0.9)) * smooth(0.12, 0.45, v) * (1 - smooth(0.55, 0.8, v));
      c = mix3(c, blush, cheek * 0.38 * smooth(0.3, 0.7, low + 0.15));
      // russet cap at the stem + calyx
      const rus = smooth(0.86, 0.97, v + (mid - 0.5) * 0.08);
      c = mix3(c, russet, rus * 0.85);
      c = mix3(c, calyx, smooth(0.035, 0.0, v) * 0.9);
      // russet netting patches
      const net = fbm3(cx * 9 + 1, v * 23.8, cz * 9 + 1, 4);
      c = mix3(c, russet, smooth(0.6, 0.8, net) * 0.22 * (0.4 + v));
      const i = y * W + x;
      col[i * 3] = clamp(c[0], 0, 255);
      col[i * 3 + 1] = clamp(c[1], 0, 255);
      col[i * 3 + 2] = clamp(c[2], 0, 255);
      height[i] = low * 0.6 + mid * 0.35 + fbm3(cx * 40, v * 105, cz * 40, 2) * 0.12;
      rough[i] = Math.round((0.56 + (mid - 0.5) * 0.12 + rus * 0.2) * 255);
    }
  }
  // lenticels — tiny freckles, darker centre, faint pale halo, slight bump
  for (let k = 0; k < 9000; k++) {
    const u = rand(), v = 0.04 + rand() * 0.9;
    const ringScale = 1 / Math.max(0.35, Math.sin(Math.PI * clamp(v * 0.95 + 0.03)));
    const r = (0.8 + rand() * 1.8);
    const px = u * W, py = (1 - v) * H;
    const dark = 0.55 + rand() * 0.3;
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -Math.ceil(4 * ringScale); dx <= Math.ceil(4 * ringScale); dx++) {
        const d = Math.hypot(dx / ringScale, dy) / r;
        if (d > 2.2) continue;
        const X = ((Math.round(px + dx) % W) + W) % W, Y = Math.round(py + dy);
        if (Y < 0 || Y >= H) continue;
        const i = Y * W + X;
        if (d < 1) {
          const t = (1 - d) * dark;
          col[i * 3] = col[i * 3] * (1 - t) + 92 * t;
          col[i * 3 + 1] = col[i * 3 + 1] * (1 - t) + 70 * t;
          col[i * 3 + 2] = col[i * 3 + 2] * (1 - t) + 32 * t;
          height[i] += (1 - d) * 0.05;
          rough[i] = Math.min(255, rough[i] + 40);
        } else {
          const t = (1 - (d - 1) / 1.2) * 0.12;
          col[i * 3] = Math.min(255, col[i * 3] + 40 * t);
          col[i * 3 + 1] = Math.min(255, col[i * 3 + 1] + 36 * t);
          col[i * 3 + 2] = Math.min(255, col[i * 3 + 2] + 20 * t);
        }
      }
    }
  }
  // a few darker bruise / sugar spots
  for (let k = 0; k < 10; k++) {
    const px = rand() * W, py = (0.12 + rand() * 0.6) * H, r = 5 + rand() * 10;
    for (let dy = -r * 2; dy <= r * 2; dy++) for (let dx = -r * 2; dx <= r * 2; dx++) {
      const d = Math.hypot(dx, dy) / r;
      if (d > 2) continue;
      const X = ((Math.round(px + dx) % W) + W) % W, Y = Math.round(py + dy);
      if (Y < 0 || Y >= H) continue;
      const i = Y * W + X, t = smooth(2, 0.3, d) * 0.14;
      col[i * 3] *= 1 - t; col[i * 3 + 1] *= 1 - t * 1.1; col[i * 3 + 2] *= 1 - t * 1.3;
    }
  }
  await save("pear_color.webp", col, W, H, 3, 88);
  await save("pear_normal.webp", heightToNormal(height, W, H, 9, true, false), W, H, 3, 90);
  await save("pear_roughness.webp", rough, W, H, 1, 80);
  // spots mask (lenticel density) used for a subtle sheen break-up
  const spots = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) spots[i] = clamp(Math.round((height[i] - 0.3) * 400), 0, 255);
  await save("pear_spots.webp", spots, W, H, 1, 70);
}

// ---------- heavy textile weave (tileable) ----------
async function fabric() {
  const S = 512;
  const h = new Float32Array(S * S);
  const col = Buffer.alloc(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S;
    const warp = Math.sin(u * Math.PI * 2 * 96 + tile2(u, v, 24, 2) * 3);
    const weft = Math.sin(v * Math.PI * 2 * 96 + tile2(v, u, 24, 2) * 3);
    const over = ((Math.floor(u * 96) + Math.floor(v * 96)) & 1) ? warp : weft;
    const slub = tile2(u, v * 0.25, 6, 3);
    h[y * S + x] = over * 0.35 + slub * 0.6;
    col[y * S + x] = clamp(Math.round(150 + over * 18 + (slub - 0.5) * 70 + (tile2(u, v, 40, 2) - 0.5) * 30), 0, 255);
  }
  await save("fabric_color.webp", col, S, S, 1, 85);
  await save("fabric_normal.webp", heightToNormal(h, S, S, 2.2, true, true), S, S, 3, 88);
}

// ---------- drafting paper (tileable fibres) ----------
async function paper() {
  const S = 1024;
  const col = Buffer.alloc(S * S * 3);
  const base = hex("#F1EBDD");
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S;
    const cloud = tile2(u, v, 5, 4);
    const fib = tile2(u * 1, v * 1, 90, 2);
    const t = (cloud - 0.5) * 18 + (fib - 0.5) * 10;
    const i = (y * S + x) * 3;
    col[i] = clamp(base[0] + t, 0, 255);
    col[i + 1] = clamp(base[1] + t * 0.95, 0, 255);
    col[i + 2] = clamp(base[2] + t * 0.85 - 2, 0, 255);
  }
  await save("paper.webp", col, S, S, 3, 84);
}

// ---------- weathered timber (tileable along the grain) ----------
async function timber() {
  const W = 256, H = 1024;
  const col = Buffer.alloc(W * H * 3);
  const light = hex("#D9C6A2"), dark = hex("#A88E66");
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / H;
    const grain = tile2(u * 6, v * 0.3, 18, 3);
    const streak = Math.sin((u * 30 + grain * 6) * Math.PI) * 0.5 + 0.5;
    const c = mix3(dark, light, clamp(streak * 0.35 + grain * 0.75));
    const i = (y * W + x) * 3;
    col[i] = c[0]; col[i + 1] = c[1]; col[i + 2] = c[2];
  }
  await save("timber.webp", col, W, H, 3, 84);
}

await pear();
await fabric();
await paper();
await timber();

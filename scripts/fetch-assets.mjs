// Downloads the generated source images and encodes the web versions:
//   photo  -> public/images/<name>.webp (2400w) + <name>-sm.webp (1280w)
//   cutout -> transparent margins trimmed, <name>.webp (1800h) + <name>-sm.webp (1000h)
// Usage: node scripts/fetch-assets.mjs [--force]
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const { assets } = JSON.parse(readFileSync(root + "scripts/asset-sources.json", "utf8"));
const RAW = root + "raw-assets/";
const OUT = root + "public/images/";
mkdirSync(RAW, { recursive: true });
mkdirSync(OUT, { recursive: true });
const force = process.argv.includes("--force");

for (const a of assets) {
  const raw = RAW + a.name + ".png";
  if (!existsSync(raw) || force) {
    const res = await fetch(a.url);
    if (!res.ok) throw new Error(`${a.name}: HTTP ${res.status}`);
    writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  }
  if (a.kind === "photo") {
    await sharp(raw).resize({ width: 2400, withoutEnlargement: true }).webp({ quality: 80 }).toFile(OUT + a.name + ".webp");
    await sharp(raw).resize({ width: 1280 }).webp({ quality: 76 }).toFile(OUT + a.name + "-sm.webp");
  } else {
    const trimmed = await sharp(raw).trim({ threshold: 1 }).toBuffer();
    // keep a little transparent air so mipmaps never bleed the subject into the edge
    const pad = (s) => s.extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } });
    await pad(sharp(trimmed).resize({ height: 1800, withoutEnlargement: true })).webp({ quality: 86, alphaQuality: 90 }).toFile(OUT + a.name + ".webp");
    await pad(sharp(trimmed).resize({ height: 1000 })).webp({ quality: 82, alphaQuality: 90 }).toFile(OUT + a.name + "-sm.webp");
  }
  const m = await sharp(OUT + a.name + ".webp").metadata();
  console.log(`${a.name}: ${m.width}x${m.height}`);
}

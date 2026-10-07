// Generates the architectural drawings that hang from the scaffold (public/svg/*.svg).
// They are built from the same pear profile as the 3D model, so the plans really describe
// the object on screen. Run with: node scripts/generate-drawings.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const OUT = new URL("../public/svg/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const W = 1536, H = 2048;
const INK = "#2f2a22";
const BLUE = "#2456c9";
const RED = "#b0472c";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const PROFILE = [
  [0.0, -2.2], [0.62, -2.16], [1.1, -2.0], [1.55, -1.35], [1.68, -0.55], [1.45, 0.15],
  [1.03, 0.75], [0.66, 1.35], [0.52, 1.95], [0.2, 2.06], [0.0, 2.02],
];

// centripetal-ish Catmull-Rom sampled densely
function sampleProfile(n = 160) {
  const P = PROFILE;
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    const steps = Math.ceil(n / (P.length - 1));
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([Math.max(0, f(p0[0], p1[0], p2[0], p3[0])), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(P[P.length - 1]);
  return out;
}

/** Closed pear outline path in sheet coordinates. */
function pearPath(cx, baseY, scale, lean = 0.16) {
  const pts = sampleProfile();
  const leanAt = (y) => {
    const t = Math.min(1, Math.max(0, (y + 0.6) / 2.7));
    return lean * Math.pow(t * t * (3 - 2 * t), 2);
  };
  const right = pts.map(([r, y]) => [cx + (r + leanAt(y)) * scale, baseY - (y + 2.2) * scale]);
  const left = pts.slice().reverse().map(([r, y]) => [cx + (-r + leanAt(y)) * scale, baseY - (y + 2.2) * scale]);
  const all = right.concat(left);
  return "M" + all.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L") + " Z";
}

function radiusAt(y) {
  for (let i = 1; i < PROFILE.length; i++) {
    const [r0, y0] = PROFILE[i - 1], [r1, y1] = PROFILE[i];
    if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0 || 1);
  }
  return 0;
}

const txt = (x, y, s, size = 22, o = {}) =>
  `<text x="${x}" y="${y}" font-family="${o.font ?? SANS}" font-size="${size}" fill="${o.fill ?? INK}" ${o.italic ? 'font-style="italic"' : ""} ${o.anchor ? `text-anchor="${o.anchor}"` : ""} ${o.ls ? `letter-spacing="${o.ls}"` : ""} ${o.rot ? `transform="rotate(${o.rot} ${x} ${y})"` : ""}>${s}</text>`;

function arrowDim(x1, y1, x2, y2, label, o = {}) {
  const col = o.color ?? BLUE;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const a = 14, s = 0.32;
  const head = (x, y, dir) =>
    `M${x + Math.cos(ang + dir * Math.PI - s) * a} ${y + Math.sin(ang + dir * Math.PI - s) * a} L${x} ${y} L${x + Math.cos(ang + dir * Math.PI + s) * a} ${y + Math.sin(ang + dir * Math.PI + s) * a}`;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  return `<g stroke="${col}" stroke-width="1.6" fill="none"><path d="M${x1} ${y1} L${x2} ${y2}"/><path d="${head(x1, y1, 0)}"/><path d="${head(x2, y2, 1)}"/></g>` +
    (label
      ? vertical
        ? txt(mx - 14, my, label, 22, { fill: col, rot: -90, anchor: "middle", font: SERIF, italic: true })
        : txt(mx, my - 12, label, 22, { fill: col, anchor: "middle", font: SERIF, italic: true })
      : "");
}

function frame(title, sheet, scale, notes = "") {
  return `
  <rect x="48" y="48" width="${W - 96}" height="${H - 96}" fill="none" stroke="${INK}" stroke-width="2.4"/>
  <rect x="64" y="64" width="${W - 128}" height="${H - 128}" fill="none" stroke="${INK}" stroke-width="0.8" opacity="0.6"/>
  ${Array.from({ length: 8 }, (_, i) => txt(64 + ((W - 128) / 8) * (i + 0.5), 92, String.fromCharCode(65 + i), 16, { anchor: "middle", fill: INK, ls: 2 })).join("")}
  ${Array.from({ length: 10 }, (_, i) => txt(84, 64 + ((H - 128) / 10) * (i + 0.5), String(i + 1), 16, { anchor: "middle" })).join("")}
  <g transform="translate(${W - 600} ${H - 290})">
    <rect width="536" height="226" fill="none" stroke="${INK}" stroke-width="1.6"/>
    <path d="M0 70 H536 M0 150 H536 M300 70 V226" stroke="${INK}" stroke-width="1"/>
    ${txt(20, 48, "PEAR", 34, { font: SERIF, ls: 6 })}
    ${txt(516, 46, "ATELIER OF THE ORDINARY", 14, { anchor: "end", ls: 3 })}
    ${txt(20, 104, title, 22, { ls: 2 })}
    ${txt(20, 134, notes, 18, { font: SERIF, italic: true, fill: "#5a5144" })}
    ${txt(20, 186, "SHEET", 13, { ls: 3, fill: "#6b6254" })}
    ${txt(20, 212, sheet, 22)}
    ${txt(320, 186, "SCALE", 13, { ls: 3, fill: "#6b6254" })}
    ${txt(320, 212, scale, 22)}
    ${txt(430, 186, "DATE", 13, { ls: 3, fill: "#6b6254" })}
    ${txt(430, 212, "X.2026", 22)}
  </g>`;
}

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;

// ---------------------------------------------------------------- 01 elevation
function elevation() {
  const cx = 720, base = 1640, S = 270; // 4.25 units -> ~1150px
  const top = base - 4.26 * S;
  let b = frame("ELEVATION — SOUTH", "01 / 04", "1 : 50", "the monument, as found");
  // grid
  for (let y = base; y > top - 200; y -= 0.5 * S)
    b += `<path d="M180 ${y} H1300" stroke="${BLUE}" stroke-width="0.6" opacity="0.25" stroke-dasharray="4 8"/>`;
  // ground
  b += `<path d="M150 ${base} H1340" stroke="${INK}" stroke-width="2"/>`;
  for (let x = 160; x < 1340; x += 26) b += `<path d="M${x} ${base} l-16 18" stroke="${INK}" stroke-width="0.8"/>`;
  // axis
  b += `<path d="M${cx} ${top - 260} V${base + 70}" stroke="${RED}" stroke-width="1.2" stroke-dasharray="40 8 6 8"/>`;
  b += txt(cx + 10, top - 270, "℄ axis of growth", 20, { font: SERIF, italic: true, fill: RED });
  // pear + light shading hatch
  const path = pearPath(cx, base, S);
  b += `<defs><clipPath id="pc"><path d="${path}"/></clipPath>
        <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0 V14" stroke="${INK}" stroke-width="0.9"/></pattern></defs>`;
  b += `<path d="${path}" fill="none" stroke="${INK}" stroke-width="3"/>`;
  b += `<g clip-path="url(#pc)"><ellipse cx="${cx + 300}" cy="${base - 1.8 * S}" rx="${2.2 * S}" ry="${3 * S}" fill="url(#hatch)" opacity="0.55"/></g>`;
  // stem
  b += `<path d="M${cx + 0.16 * S + 6} ${top + 10} C ${cx + 0.2 * S} ${top - 60}, ${cx + 0.3 * S} ${top - 120}, ${cx + 0.62 * S} ${top - 170}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`;
  // section levels with radii
  [-1.35, -0.55, 0.15, 0.75, 1.35].forEach((y, i) => {
    const r = radiusAt(y) * S;
    const yy = base - (y + 2.2) * S;
    b += `<path d="M${cx - r - 30} ${yy} H${cx + r + 30}" stroke="${BLUE}" stroke-width="1" stroke-dasharray="10 6"/>`;
    b += txt(cx - r - 40, yy + 7, `${String.fromCharCode(65 + i)}`, 22, { anchor: "end", fill: BLUE });
    b += txt(cx + r + 40, yy + 7, `R ${(radiusAt(y) * 3.06).toFixed(2)}`, 20, { fill: BLUE, font: SERIF, italic: true });
  });
  // overall height
  b += arrowDim(1250, base, 1250, top - 170, "13.00");
  b += `<path d="M${cx + 0.7 * S} ${top - 170} H1270 M${cx + 1.7 * S} ${base} H1270" stroke="${BLUE}" stroke-width="0.8"/>`;
  b += arrowDim(1170, base, 1170, base - (-0.55 + 2.2) * S, "5.05");
  // max width
  b += arrowDim(cx - 1.75 * S, base + 110, cx + 1.75 * S, base + 110, "10.28 ⌀ max.");
  // notes
  b += txt(200, 260, "Notes", 30, { font: SERIF });
  b += [
    "1. Neck leans 3° toward the light; do not correct.",
    "2. Lenticels typ., ⌀ 2–6 mm, leave visible.",
    "3. Russet cap at stem — preserve patina.",
    "4. Shoulder asymmetry +4 % on the sun side.",
  ].map((l, i) => txt(200, 304 + i * 34, l, 21, { font: SERIF, italic: true, fill: "#4a4237" })).join("");
  // north arrow
  b += `<g transform="translate(1250 300)"><circle r="46" fill="none" stroke="${INK}" stroke-width="1.4"/><path d="M0 -60 L14 10 L0 0 L-14 10 Z" fill="${INK}"/>${txt(0, 86, "N", 22, { anchor: "middle" })}</g>`;
  return svg(b);
}

// ---------------------------------------------------------------- 02 section
function section() {
  const cx = 560, base = 1500, S = 250;
  let b = frame("SECTION A–A · PLAN AT +4.30", "02 / 04", "1 : 50", "flesh, core and seed");
  const path = pearPath(cx, base, S, 0.1);
  b += `<defs><clipPath id="sc"><path d="${path}"/></clipPath></defs>`;
  b += `<path d="${path}" fill="#efe2c4" fill-opacity="0.55" stroke="${INK}" stroke-width="3"/>`;
  // skin
  b += `<path d="${pearPath(cx, base - 8, S * 0.985, 0.1)}" fill="none" stroke="${INK}" stroke-width="0.8" opacity="0.6" transform="translate(${cx * 0.015} 0)"/>`;
  // stipple flesh
  let st = "";
  let seed = 3;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 1600; i++) {
    const x = cx - 1.8 * S + r() * 3.6 * S, y = base - r() * 4.3 * S;
    st += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.8 + r() * 1.2).toFixed(2)}"/>`;
  }
  b += `<g clip-path="url(#sc)" fill="${INK}" opacity="0.35">${st}</g>`;
  // core + vascular line + seeds
  const coreY = base - 1.55 * S;
  b += `<path d="M${cx} ${base - 0.1 * S} C ${cx - 40} ${coreY + 140}, ${cx - 0.55 * S} ${coreY + 40}, ${cx - 0.45 * S} ${coreY - 60} C ${cx - 0.35 * S} ${coreY - 180}, ${cx - 20} ${coreY - 260}, ${cx + 12} ${base - 3.9 * S}
           M${cx} ${base - 0.1 * S} C ${cx + 40} ${coreY + 140}, ${cx + 0.55 * S} ${coreY + 40}, ${cx + 0.45 * S} ${coreY - 60} C ${cx + 0.35 * S} ${coreY - 180}, ${cx + 40} ${coreY - 260}, ${cx + 12} ${base - 3.9 * S}"
           fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="3 5"/>`;
  b += `<ellipse cx="${cx}" cy="${coreY}" rx="${0.36 * S}" ry="${0.5 * S}" fill="#e4d2a6" stroke="${INK}" stroke-width="1.8"/>`;
  [[-1, -0.1], [1, -0.1], [-1, 0.32], [1, 0.32]].forEach(([sx, dy]) => {
    b += `<path transform="translate(${cx + sx * 34} ${coreY + dy * S}) rotate(${sx * 18})" d="M0 -34 C 18 -20, 16 22, 0 34 C -16 22, -18 -20, 0 -34 Z" fill="#3b2b1c" stroke="${INK}"/>`;
  });
  b += txt(cx + 0.5 * S + 40, coreY - 80, "core — 5 carpels", 22, { font: SERIF, italic: true });
  b += `<path d="M${cx + 0.36 * S} ${coreY - 40} L${cx + 0.5 * S + 34} ${coreY - 86}" stroke="${INK}" stroke-width="1"/>`;
  b += txt(cx + 1.75 * S + 50, base - 0.9 * S, "skin 0.9 mm", 22, { font: SERIF, italic: true });
  b += `<path d="M${cx + 1.62 * S} ${base - 1.0 * S} L${cx + 1.75 * S + 44} ${base - 0.9 * S - 8}" stroke="${INK}" stroke-width="1"/>`;
  b += arrowDim(cx - 1.75 * S, base + 90, cx + 1.75 * S, base + 90, "10.28");
  // plan at +4.30 (top right)
  const px = 1140, py = 700, pr = 210;
  b += txt(px, py - pr - 110, "PLAN AT +4.30", 22, { anchor: "middle", ls: 3 });
  b += `<circle cx="${px}" cy="${py}" r="${pr}" fill="#efe2c4" fill-opacity="0.5" stroke="${INK}" stroke-width="2.6"/>`;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    b += `<path d="M${px} ${py} L${px + Math.cos(a) * (pr + 40)} ${py + Math.sin(a) * (pr + 40)}" stroke="${BLUE}" stroke-width="0.8" opacity="0.6"/>`;
    b += `<circle cx="${px + Math.cos(a) * (pr + 70)}" cy="${py + Math.sin(a) * (pr + 70)}" r="4" fill="none" stroke="${BLUE}"/>`;
  }
  b += `<circle cx="${px}" cy="${py}" r="${pr * 0.26}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-dasharray="6 5"/>`;
  b += txt(px, py + pr + 110, "16 bays · scaffold ring Ø 13.2", 20, { anchor: "middle", font: SERIF, italic: true, fill: BLUE });
  return svg(b);
}

// ---------------------------------------------------------------- 03 scaffold elevation
function scaffold() {
  const cx = 768, base = 1640, S = 92; // world units -> px
  let b = frame("SCAFFOLD — FRONT ELEVATION", "03 / 04", "1 : 100", "erected around the fruit");
  b += `<path d="M150 ${base} H1390" stroke="${INK}" stroke-width="2"/>`;
  // pear ghost
  b += `<path d="${pearPath(cx, base, S * 2.6)}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="12 8" opacity="0.6"/>`;
  const levels = [2.4, 4.8, 7.2];
  const upper = [9.6, 12.0];
  const poles = [-6.6, -5.4, -3.2, -1.1, 1.1, 3.2, 5.4, 6.6];
  poles.forEach((x) => (b += `<path d="M${cx + x * S} ${base} V${base - 8.2 * S}" stroke="${INK}" stroke-width="5"/>`));
  levels.forEach((y) => {
    b += `<path d="M${cx - 6.9 * S} ${base - y * S} H${cx + 6.9 * S}" stroke="${INK}" stroke-width="4"/>`;
    b += `<rect x="${cx - 6.9 * S}" y="${base - y * S - 12}" width="${13.8 * S}" height="8" fill="${INK}" opacity="0.35"/>`;
    b += txt(cx + 7.2 * S, base - y * S + 8, `+${y.toFixed(2)}`, 22, { fill: BLUE });
  });
  [-4.9, -3.7, -1.2, 1.2, 3.7, 4.9].forEach((x) => (b += `<path d="M${cx + x * S} ${base - 7.2 * S} V${base - 13.4 * S}" stroke="${INK}" stroke-width="4"/>`));
  upper.forEach((y) => {
    b += `<path d="M${cx - 5.1 * S} ${base - y * S} H${cx + 5.1 * S}" stroke="${INK}" stroke-width="3.4"/>`;
    b += txt(cx + 5.4 * S, base - y * S + 8, `+${y.toFixed(2)}`, 22, { fill: BLUE });
  });
  // braces
  [[-6.6, 0, -3.2, 2.4], [3.2, 2.4, 6.6, 4.8], [-6.6, 4.8, -3.2, 7.2], [1.1, 0, 3.2, 2.4], [-3.7, 7.2, -1.2, 9.6], [1.2, 9.6, 3.7, 12]].forEach(
    ([x0, y0, x1, y1]) => (b += `<path d="M${cx + x0 * S} ${base - y0 * S} L${cx + x1 * S} ${base - y1 * S}" stroke="${INK}" stroke-width="2.4"/>`)
  );
  // ladders
  const ladder = (x, y0, y1) => {
    b += `<path d="M${cx + x * S - 14} ${base - y0 * S} L${cx + x * S - 6} ${base - y1 * S} M${cx + x * S + 14} ${base - y0 * S} L${cx + x * S + 22} ${base - y1 * S}" stroke="${INK}" stroke-width="2"/>`;
    for (let y = y0 + 0.3; y < y1; y += 0.3) b += `<path d="M${cx + x * S - 13 + (y - y0) * 3} ${base - y * S} h28" stroke="${INK}" stroke-width="1.4"/>`;
  };
  ladder(-4.4, 0, 2.4);
  ladder(4.2, 2.4, 4.8);
  ladder(-2.2, 4.8, 7.2);
  // rod + sheet
  b += `<path d="M${cx - 4.4 * S} ${base - 13.9 * S} H${cx + 4.4 * S}" stroke="${RED}" stroke-width="4"/>`;
  b += `<rect x="${cx - 3.6 * S}" y="${base - 13.9 * S}" width="${7.2 * S}" height="${2.2 * S}" fill="none" stroke="${RED}" stroke-width="1.4" stroke-dasharray="8 6"/>`;
  b += txt(cx, base - 13.9 * S - 18, "rod for drawings, +13.90", 20, { anchor: "middle", fill: RED, font: SERIF, italic: true });
  // figures for scale
  const fig = (x, y, h) =>
    `<g stroke="${INK}" stroke-width="2" fill="none"><circle cx="${cx + x * S}" cy="${base - (y + h - 0.12) * S}" r="${0.12 * S}"/><path d="M${cx + x * S} ${base - (y + h - 0.24) * S} V${base - (y + 0.85) * S} L${cx + x * S - 0.2 * S} ${base - y * S} M${cx + x * S} ${base - (y + 0.85) * S} L${cx + x * S + 0.2 * S} ${base - y * S} M${cx + x * S - 0.3 * S} ${base - (y + 1.3) * S} L${cx + x * S + 0.3 * S} ${base - (y + 1.2) * S}"/></g>`;
  b += fig(-6.0, 0, 1.85) + fig(-6.0, 2.4, 1.8) + fig(4.4, 4.8, 1.8);
  b += arrowDim(240, base, 240, base - 13.9 * S, "13.90");
  return svg(b);
}

// ---------------------------------------------------------------- 04 stem & crop studies
function stem() {
  let b = frame("STUDIES — STEM, LEAF, CULTIVARS", "04 / 04", "n.t.s.", "from the orchard notebook");
  // stems
  b += txt(180, 220, "Stem, three attitudes", 28, { font: SERIF });
  [0, 1, 2].forEach((i) => {
    const x = 260 + i * 220, y = 640;
    const bend = [60, 110, 30][i];
    b += `<path d="M${x} ${y} C ${x + 10} ${y - 120}, ${x + bend * 0.6} ${y - 240}, ${x + bend} ${y - 330}" fill="none" stroke="${INK}" stroke-width="${10 - i * 2}" stroke-linecap="round"/>`;
    b += `<path d="M${x - 50} ${y + 30} Q ${x} ${y - 12} ${x + 50} ${y + 30}" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
    b += txt(x, y + 80, ["28 mm", "41 mm", "19 mm"][i], 20, { anchor: "middle", font: SERIF, italic: true, fill: BLUE });
  });
  // leaf
  const lx = 1080, ly = 580;
  b += txt(880, 220, "Leaf, adaxial", 28, { font: SERIF });
  b += `<path d="M${lx} ${ly + 230} C ${lx - 170} ${ly + 120}, ${lx - 170} ${ly - 130}, ${lx} ${ly - 250} C ${lx + 170} ${ly - 130}, ${lx + 170} ${ly + 120}, ${lx} ${ly + 230} Z" fill="#dfe6c8" fill-opacity="0.5" stroke="${INK}" stroke-width="2.4"/>`;
  b += `<path d="M${lx} ${ly + 300} L${lx} ${ly - 240}" stroke="${INK}" stroke-width="2"/>`;
  for (let i = 0; i < 7; i++) {
    const y = ly + 160 - i * 58;
    const ye = y - 46;
    const half = 128 * Math.sqrt(Math.max(0, 1 - Math.pow((ye - ly + 10) / 240, 2))) * 0.86;
    b += `<path d="M${lx} ${y} Q ${lx - half * 0.5} ${y - 12} ${lx - half} ${ye}" fill="none" stroke="${INK}" stroke-width="1.1"/>`;
    b += `<path d="M${lx} ${y} Q ${lx + half * 0.5} ${y - 12} ${lx + half} ${ye}" fill="none" stroke="${INK}" stroke-width="1.1"/>`;
  }
  // cultivars
  b += txt(180, 900, "Cultivars considered", 28, { font: SERIF });
  const kinds = [
    ["Bosc", 0.22, 1.0, 1.1],
    ["Conference", 0.25, 0.8, 1.3],
    ["Williams", 0.16, 1.0, 1.0],
    ["Comice", 0.05, 1.15, 0.85],
    ["Seckel", 0.1, 0.9, 0.75],
    ["Anjou", 0.04, 1.1, 0.9],
  ];
  kinds.forEach(([name, lean, wx, hy], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const cx = 330 + col * 400, base = 1270 + row * 380;
    const p = pearPath(cx, base, 58, lean).replace(/(\d+\.?\d*) (\d+\.?\d*)/g, (m, x, y) => {
      const X = cx + (parseFloat(x) - cx) * wx;
      const Y = base - (base - parseFloat(y)) * hy;
      return `${X.toFixed(1)} ${Y.toFixed(1)}`;
    });
    b += `<path d="${p}" fill="none" stroke="${INK}" stroke-width="2"/>`;
    b += `<path d="M${cx + lean * 58 + 6} ${base - 4.25 * 58 * hy} l8 -34" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    b += txt(cx, base + 50, name, 22, { anchor: "middle", font: SERIF, italic: true });
    b += txt(cx, base + 78, `fig. ${i + 1}`, 14, { anchor: "middle", ls: 2, fill: "#6b6254" });
  });
  return svg(b);
}

writeFileSync(OUT + "pear-elevation.svg", elevation());
writeFileSync(OUT + "pear-section.svg", section());
writeFileSync(OUT + "scaffold-elevation.svg", scaffold());
writeFileSync(OUT + "stem-study.svg", stem());
console.log("drawings written");

import { deflateSync } from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "..", "public", "examples");
fs.mkdirSync(outDir, { recursive: true });

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(w, h, pixelFn) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const stride = 1 + w * 3;
  const raw = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = pixelFn(x, y);
      const off = y * stride + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scene(top, bottom, accent, seed) {
  const rand = mulberry32(seed);
  const blobs = Array.from({ length: 7 }, () => ({
    x: rand(),
    y: rand(),
    r: 0.06 + rand() * 0.18,
    a: accent[Math.floor(rand() * accent.length)],
    o: 0.08 + rand() * 0.25,
  }));
  const w = 640;
  const h = 480;
  return (x, y) => {
    const t = y / h;
    let r = top[0] + (bottom[0] - top[0]) * t;
    let g = top[1] + (bottom[1] - top[1]) * t;
    let b = top[2] + (bottom[2] - top[2]) * t;
    for (const bl of blobs) {
      const dx = x / w - bl.x;
      const dy = y / h - bl.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bl.r * bl.r) {
        const f = (1 - d2 / (bl.r * bl.r)) * bl.o;
        r += (bl.a[0] - r) * f;
        g += (bl.a[1] - g) * f;
        b += (bl.a[2] - b) * f;
      }
    }
    const vig = 1 - 0.25 * Math.hypot(x / w - 0.5, y / h - 0.5) * 1.4;
    return [
      Math.max(0, Math.min(255, Math.round(r * vig))),
      Math.max(0, Math.min(255, Math.round(g * vig))),
      Math.max(0, Math.min(255, Math.round(b * vig))),
    ];
  };
}

const examples = [
  {
    name: "street",
    label: "Street at dusk",
    top: [26, 22, 48],
    bottom: [122, 62, 38],
    accent: [[255, 190, 90], [255, 120, 60], [60, 60, 90], [255, 230, 160]],
    seed: 11,
  },
  {
    name: "interior",
    label: "Apartment interior",
    top: [38, 44, 58],
    bottom: [88, 92, 104],
    accent: [[200, 200, 190], [120, 90, 60], [70, 110, 140], [230, 220, 190]],
    seed: 22,
  },
  {
    name: "outdoors",
    label: "Hiking trail",
    top: [96, 148, 196],
    bottom: [52, 96, 60],
    accent: [[160, 190, 140], [30, 70, 40], [220, 230, 210], [120, 90, 60]],
    seed: 33,
  },
  {
    name: "selfie",
    label: "Café selfie",
    top: [58, 38, 72],
    bottom: [120, 78, 96],
    accent: [[230, 200, 160], [160, 120, 90], [240, 230, 220], [90, 60, 110]],
    seed: 44,
  },
];

for (const ex of examples) {
  const png = makePng(640, 480, scene(ex.top, ex.bottom, ex.accent, ex.seed));
  const file = path.join(outDir, `${ex.name}.png`);
  fs.writeFileSync(file, png);
  console.log(`${file} (${(png.length / 1024).toFixed(1)} KB) — ${ex.label}`);
}

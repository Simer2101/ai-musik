const PALETTES = [
  ["#12081f", "#7c3aed", "#22d3ee"],
  ["#0b1020", "#f97316", "#f43f5e"],
  ["#08140f", "#34d399", "#a3e635"],
  ["#1a1024", "#e879f9", "#38bdf8"],
  ["#141016", "#fb7185", "#fbbf24"],
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function coverSvg(seed: string, genre?: string | null): Buffer {
  const palette = PALETTES[hashString(seed) % PALETTES.length];
  const label = (genre || "AI").toUpperCase();
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette[0]}"/>
      <stop offset="55%" stop-color="${palette[1]}"/>
      <stop offset="100%" stop-color="${palette[2]}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="620" cy="180" r="160" fill="rgba(255,255,255,0.08)"/>
  <circle cx="140" cy="640" r="220" fill="rgba(0,0,0,0.18)"/>
  <text x="64" y="700" fill="white" font-family="Arial, sans-serif" font-size="42" font-weight="700" letter-spacing="6">${escapeXml(label)}</text>
  <text x="64" y="750" fill="rgba(255,255,255,0.75)" font-family="Arial, sans-serif" font-size="22">AI-GENERATED</text>
</svg>`;
  return Buffer.from(svg);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

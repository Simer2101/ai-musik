const PALETTES = [
  ['#12081f', '#7c3aed'],
  ['#0b1020', '#f97316'],
  ['#08140f', '#34d399'],
  ['#1a1024', '#e879f9'],
  ['#141016', '#fb7185'],
];

export function coverColors(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length] as [string, string];
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

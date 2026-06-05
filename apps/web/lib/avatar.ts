const PALETTE = ['#5457D6', '#2F6E78', '#0E9F6E', '#B8740A', '#7C5CE0', '#2563C9', '#D5485A', '#0E7490'];

/** Deterministic avatar color from a string (user id / email). */
export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length]!;
}

export function initials(name: string): string {
  return (
    name
      .split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??'
  );
}

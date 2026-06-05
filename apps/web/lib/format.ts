export function fmtBytes(n: number): string {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}

export function fmtDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}s ${m}dk`;
  if (m) return `${m}dk ${s}sn`;
  return `${s}sn`;
}

export function fmtDateTime(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toISOString().slice(0, 16).replace('T', ' ');
}

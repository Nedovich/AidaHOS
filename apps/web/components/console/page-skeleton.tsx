/** Instant content skeleton shown (via loading.tsx) while a console page renders. */
function Sk({ w, h = 14, r = 6, style }: { w: number | string; h?: number; r?: number; style?: React.CSSProperties }) {
  return <div className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)', minHeight: '60vh' }}>
      {/* page hero */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Sk w={240} h={28} r={8} />
        <Sk w={360} h={15} />
      </div>

      {/* KPI row */}
      <div className="grid grid--kpi" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kpi">
            <div className="kpi__top">
              <Sk w={36} h={36} r={10} />
              <Sk w={92} />
            </div>
            <Sk w={64} h={28} r={8} style={{ marginTop: 8 }} />
          </div>
        ))}
      </div>

      {/* table card */}
      <div className="card">
        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 20 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Sk w={38} h={38} r={10} />
              <Sk w={`${30 + ((i * 13) % 25)}%`} />
              <Sk w={110} style={{ marginLeft: 'auto' }} />
              <Sk w={70} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

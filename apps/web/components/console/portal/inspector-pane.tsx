'use client';

import { type Dispatch, type ReactNode } from 'react';
import { Ico } from './portal-icons';
import {
  type Action, type Brand, type PortalState, type Section,
  PALETTES, typeLabel,
} from './portal-state';

/* ---------------- field builders ---------------- */
function Field({ label, children }: { label?: ReactNode; children: ReactNode }) {
  return <div className="pb-fld">{label != null && <div className="pb-fld__l">{label}</div>}{children}</div>;
}
function Txt({ label, ph, value, onChange }: { label: string; ph?: string; value?: string; onChange: (v: string) => void }) {
  return <Field label={label}><input className="pb-input" value={value ?? ''} placeholder={ph} onChange={(e) => onChange(e.target.value)} /></Field>;
}
function Area({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return <Field label={label}><textarea className="pb-area" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></Field>;
}
function ImgSlot({ label }: { label: string }) {
  return (
    <Field label={label}>
      <div className="pb-imgslot">
        <div className="pb-imgslot__prev"><Ico name="image" size={18} /></div>
        <div className="pb-imgslot__b"><div className="pb-imgslot__t">Photo</div><div className="pb-imgslot__d">Recommended 1200×900</div></div>
        <span className="pb-imgslot__btn">Replace</span>
      </div>
    </Field>
  );
}
function Toggle({ label, desc, on, onClick }: { label: string; desc?: string; on: boolean; onClick: () => void }) {
  return (
    <div className="pb-toggle">
      <div><div className="pb-toggle__t">{label}</div>{desc && <div className="pb-toggle__d">{desc}</div>}</div>
      <div className={`pb-sw ${on ? 'on' : ''}`} onClick={onClick} />
    </div>
  );
}
function Sel({ label, value, opts, onChange }: { label: string; value?: string; opts: [string, string][]; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <select className="pb-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
      </select>
    </Field>
  );
}
function Seg<T extends string>({ value, opts, onChange }: { value: T; opts: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="pb-seg">
      {opts.map((o) => <button key={o[0]} className={o[0] === value ? 'on' : ''} onClick={() => onChange(o[0])}>{o[1]}</button>)}
    </div>
  );
}
function SelHead({ ic, name, desc }: { ic: string; name: string; desc: string }) {
  return (
    <div className="pb-isel">
      <div className="pb-isel__ico"><Ico name={ic} size={17} /></div>
      <div className="pb-isel__b"><div className="pb-isel__n">{name}</div><div className="pb-isel__d">{desc}</div></div>
    </div>
  );
}
function Note({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)', lineHeight: 1.5, marginTop: 4 }}>{children}</p>;
}

/* ---------------- EDIT PANEL ---------------- */
function EditPanel({ s, dispatch }: { s: PortalState; dispatch: Dispatch<Action> }) {
  const setF = (id: string, key: keyof Section) => (val: string) => dispatch({ t: 'field', id, key, val });

  if (s.screen === 'splash') {
    const sp = s.splash;
    const set = (key: keyof PortalState['splash']) => (val: string) => dispatch({ t: 'splash', key, val });
    return (
      <>
        <SelHead ic="image" name="Splash screen" desc="Arrival screen" />
        <ImgSlot label="Background photo" />
        <Txt label="Resort name" ph="AIDA Bay" value={sp.name} onChange={set('name')} />
        <Txt label="Subtitle" ph="RESORT & SPA" value={sp.sub} onChange={set('sub')} />
        <Txt label="Tagline" ph="Your stay…" value={sp.tag} onChange={set('tag')} />
        <Txt label="Enter button label" ph="Enter" value={sp.enter} onChange={set('enter')} />
      </>
    );
  }
  if (s.screen === 'login') {
    return (
      <>
        <SelHead ic="shield" name="Sign-in screen" desc="Guest verification" />
        <Field label="Verification method">
          <Seg value={s.login.method} opts={[['room', 'Room + DOB'], ['email', 'Email + Code'], ['code', 'Name + Ref']]} onChange={(v) => dispatch({ t: 'login', key: 'method', val: v })} />
        </Field>
        <Field label="Help link"><input className="pb-input" defaultValue="Need help signing in?" /></Field>
        <Toggle label="Privacy reassurance note" desc="Show the “data stays private” footer" on={s.login.privacy} onClick={() => dispatch({ t: 'login', key: 'privacy', val: !s.login.privacy })} />
      </>
    );
  }
  if (s.screen === 'explore') {
    const cats = ['Dining', 'Spa', 'Activities', 'Sports', 'Kids Club', 'Facilities'];
    return (
      <>
        <SelHead ic="spa" name="Explore screen" desc="Resort categories" />
        <Field label="Visible categories">{cats.map((c) => <Toggle key={c} label={c} on onClick={() => {}} />)}</Field>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)', lineHeight: 1.5 }}>Cards are generated automatically from the venues in each category.</p>
      </>
    );
  }
  if (s.screen === 'events') {
    return (
      <>
        <SelHead ic="calendar" name="Events screen" desc="Live programme" />
        <Field label="Default filter">
          <Seg value={s.eventsFilter} opts={[['today', 'Today'], ['upcoming', 'Upcoming'], ['all', 'All']]} onChange={(f) => dispatch({ t: 'eventsFilter', f })} />
        </Field>
        <Toggle label="Let guests add to itinerary" desc="Show the “+” quick-add on each event" on onClick={() => {}} />
        <Toggle label="Show capacity & waitlist" desc="Display remaining spots when limited" on={false} onClick={() => {}} />
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)', lineHeight: 1.5, marginTop: 'var(--sp-3)' }}>Event cards are pulled live from the Events module and filtered to each guest’s stay dates.</p>
      </>
    );
  }

  // home: selected section
  const sec = s.sections.find((x) => x.id === s.sel);
  if (!sec || !sec.on) {
    return (
      <div className="pb-empty">
        <div className="pb-empty__ico"><Ico name="layers" size={22} /></div>
        <div className="pb-empty__t">No block selected</div>
        <div className="pb-empty__d">Pick a section on the left, or tap a block in the preview to edit its content.</div>
      </div>
    );
  }

  const head = <SelHead ic={sec.icon} name={sec.name} desc={typeLabel(sec.type, sec)} />;
  let body: ReactNode = null;
  if (sec.type === 'greeting') {
    body = (
      <>
        <Txt label="Guest name (preview)" ph="Elif" value={sec.name2} onChange={setF(sec.id, 'name2')} />
        <Toggle label="Show room & suite" desc="Display “Room 412 · Sea View Suite”" on={!!sec.showRoom} onClick={() => dispatch({ t: 'toggleField', id: sec.id, key: 'showRoom' })} />
        <Note>Greeting and room data are pulled live from the PMS at sign-in.</Note>
      </>
    );
  } else if (sec.type === 'weather') {
    body = <Note>Temperature and sea conditions sync automatically from the resort weather feed. No content to edit.</Note>;
  } else if (sec.type === 'spotlight') {
    body = (
      <>
        <ImgSlot label="Feature photo" />
        <Sel label="Content source" value={sec.source} opts={[['event', 'Tonight’s featured event'], ['manual', 'Manual entry']]} onChange={setF(sec.id, 'source')} />
        <Txt label="Eyebrow label" value={sec.kicker} onChange={setF(sec.id, 'kicker')} />
        <Txt label="Title" value={sec.title} onChange={setF(sec.id, 'title')} />
        <div className="pb-row2">
          <Txt label="Time" value={sec.time} onChange={setF(sec.id, 'time')} />
          <Txt label="Venue" value={sec.venue} onChange={setF(sec.id, 'venue')} />
        </div>
        <Area label="Description" value={sec.desc} onChange={setF(sec.id, 'desc')} />
        <Txt label="Button label" value={sec.cta} onChange={setF(sec.id, 'cta')} />
      </>
    );
  } else if (sec.type === 'carousel') {
    body = (
      <>
        <Txt label="Heading" value={sec.title} onChange={setF(sec.id, 'title')} />
        <Sel label="Pull cards from" value={sec.source} opts={[['dining', 'Dining venues'], ['spa', 'Spa services'], ['events', 'Events'], ['custom', 'Custom selection']]} onChange={setF(sec.id, 'source')} />
        <Note>The carousel shows live availability badges (Open now / hours) from the selected source.</Note>
      </>
    );
  } else if (sec.type === 'quickactions') {
    body = (
      <Field label="Action shortcuts">
        {(sec.items || []).map((it, i) => (
          <div className="pb-fld" key={i} style={{ marginBottom: 8 }}>
            <input className="pb-input" value={it.l} onChange={(e) => dispatch({ t: 'quickItem', id: sec.id, idx: i, val: e.target.value })} />
          </div>
        ))}
      </Field>
    );
  } else if (sec.type === 'offer') {
    body = (
      <>
        <ImgSlot label="Banner image (optional)" />
        <Txt label="Offer title" value={sec.title} onChange={setF(sec.id, 'title')} />
        <Area label="Description" value={sec.desc} onChange={setF(sec.id, 'desc')} />
      </>
    );
  } else if (sec.type === 'eventstrip') {
    body = (
      <>
        <Txt label="Heading" value={sec.title} onChange={setF(sec.id, 'title')} />
        <Note>Pulls the next events from the Events module, filtered to this guest’s dates.</Note>
      </>
    );
  } else if (sec.type === 'banner') {
    body = (
      <>
        <Txt label="Title" value={sec.title} onChange={setF(sec.id, 'title')} />
        <Txt label="Subtitle" value={sec.sub} onChange={setF(sec.id, 'sub')} />
        <Note>Uses the accent colour. Opens the in-app concierge chat (AIDA AI).</Note>
      </>
    );
  } else if (sec.type === 'feedback') {
    body = (
      <>
        <Txt label="Question" value={sec.title} onChange={setF(sec.id, 'title')} />
        <Txt label="Supporting line" value={sec.sub} onChange={setF(sec.id, 'sub')} />
        <Txt label="Button label" value={sec.cta} onChange={setF(sec.id, 'cta')} />
        <Note>Links to the active check-in survey from the Surveys module.</Note>
      </>
    );
  }

  return (
    <>
      {head}{body}
      {!sec.locked && (
        <div style={{ marginTop: 'var(--sp-5)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--border-faint)' }}>
          <button className="btn btn--subtle btn--sm" style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)' }} onClick={() => dispatch({ t: 'disable', id: sec.id })}>
            <Ico name="eye" size={14} />Hide this block
          </button>
        </div>
      )}
    </>
  );
}

/* ---------------- BRAND PANEL ---------------- */
function Swatches({ arr, sel, onPick }: { arr: readonly { name: string; c: string }[]; sel: number; onPick: (i: number) => void }) {
  return (
    <div className="pb-swgrid">
      {arr.map((c, i) => (
        <div key={i} className={`pb-sw2 ${i === sel ? 'on' : ''}`} style={{ background: c.c }} title={c.name} onClick={() => onPick(i)}><Ico name="check" size={18} /></div>
      ))}
    </div>
  );
}
function BrandPanel({ s, dispatch }: { s: PortalState; dispatch: Dispatch<Action> }) {
  const b = s.brand;
  const setB = (key: keyof Brand, val: string | number | boolean) => dispatch({ t: 'brand', key, val });
  return (
    <>
      <div className="pb-grouplbl">Brand · multi-tenant</div>
      <Field label="Hotel"><Seg value={b.tenant} opts={[['aida', 'AIDA Bay'], ['azure', 'Azure Sands']]} onChange={(v) => setB('tenant', v)} /></Field>
      <Field label="Primary color"><Swatches arr={PALETTES.primary} sel={b.primaryIdx} onPick={(i) => setB('primaryIdx', i)} /></Field>
      <Field label="Accent color"><Swatches arr={PALETTES.secondary} sel={b.secondaryIdx} onPick={(i) => setB('secondaryIdx', i)} /></Field>
      <div className="pb-grouplbl">Aesthetic</div>
      <Field label="Theme"><Seg value={b.evening ? ('' as Brand['theme']) : b.theme} opts={[['warm', 'Warm'], ['cool', 'Cool'], ['editorial', 'Editorial']]} onChange={(v) => setB('theme', v)} /></Field>
      <Toggle label="Evening mode" desc="Dark, candle-lit palette after sunset" on={b.evening} onClick={() => setB('evening', !b.evening)} />
      <div className="pb-grouplbl">Form</div>
      <Field label="Heading font"><Seg value={b.heading} opts={[['serif', 'Serif'], ['sans', 'Sans']]} onChange={(v) => setB('heading', v)} /></Field>
      <Field label={<>Corner softness <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>{['Sharp', 'Soft', 'Round'][b.radius]}</span></>}>
        <input className="pb-slider" type="range" min={0} max={2} step={1} value={b.radius} onChange={(e) => setB('radius', +e.target.value)} />
      </Field>
    </>
  );
}

/* ---------------- LANGUAGES PANEL ---------------- */
const LANG_ROWS: [Brand['lang'], string, number][] = [['en', 'English', 100], ['tr', 'Türkçe', 100], ['de', 'Deutsch', 86], ['ru', 'Русский', 64]];
function LangsPanel({ s, dispatch }: { s: PortalState; dispatch: Dispatch<Action> }) {
  return (
    <>
      <div className="pb-grouplbl">Guest languages</div>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 'var(--sp-4)' }}>Choose which languages appear in the portal language switcher. The default is shown on first open.</p>
      {LANG_ROWS.map(([code, name, pct]) => {
        const on = s.langs[code];
        const isDef = s.brand.lang === code;
        return (
          <div className="pb-lang" key={code}>
            <div className="pb-lang__flag">{code.toUpperCase()}</div>
            <div className="pb-lang__b">
              <div className="pb-lang__n">{name}{isDef && <span className="pb-pill" style={{ marginLeft: 6 }}>Default</span>}</div>
              <div className="pb-lang__bar"><div className="pb-lang__fill" style={{ width: `${pct}%` }} /></div>
            </div>
            <span className="pb-lang__pct">{pct}%</span>
            {on && !isDef && <button className="btn btn--subtle btn--sm" onClick={() => dispatch({ t: 'defaultLang', l: code })}>Set default</button>}
            <div className={`pb-sw ${on ? 'on' : ''}`} onClick={() => dispatch({ t: 'lang', l: code })} />
          </div>
        );
      })}
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', lineHeight: 1.5, marginTop: 'var(--sp-4)' }}>Percentages show translation completeness. AIDA AI can auto-translate missing strings on publish.</p>
    </>
  );
}

/* ---------------- INSPECTOR ---------------- */
export function InspectorPane({ s, dispatch }: { s: PortalState; dispatch: Dispatch<Action> }) {
  const tabBtn = (id: PortalState['tab'], l: string) => (
    <div className={`pb-insp__tab ${s.tab === id ? 'on' : ''}`} onClick={() => dispatch({ t: 'tab', tab: id })}>{l}</div>
  );
  return (
    <div className="pb__pane pb__pane--insp">
      <div className="pb-insp__tabs">{tabBtn('edit', 'Edit')}{tabBtn('brand', 'Brand')}{tabBtn('langs', 'Languages')}</div>
      <div className="pb__pbody">
        {s.tab === 'brand' ? <BrandPanel s={s} dispatch={dispatch} /> : s.tab === 'langs' ? <LangsPanel s={s} dispatch={dispatch} /> : <EditPanel s={s} dispatch={dispatch} />}
      </div>
    </div>
  );
}

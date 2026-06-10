'use client';

import { type Dispatch, useState } from 'react';
import { Ico, Grip } from './portal-icons';
import { type Action, type PortalState, type ScreenId, typeLabel } from './portal-state';

const SCREENS: { id: ScreenId; i: string; l: string }[] = [
  { id: 'splash', i: 'image', l: 'Splash' },
  { id: 'login', i: 'shield', l: 'Sign-in' },
  { id: 'home', i: 'grid', l: 'Home' },
  { id: 'explore', i: 'spa', l: 'Explore' },
  { id: 'events', i: 'calendar', l: 'Events' },
];

const OTHER_LABELS: Record<string, [string, string]> = {
  splash: ['Splash screen', 'The arrival screen guests see before signing in.'],
  login: ['Sign-in screen', 'How guests verify their stay.'],
  explore: ['Explore screen', 'Auto-built from your venues & categories.'],
  events: ['Events screen', 'Live programme from the Events module.'],
};

function ScreenRows({ s, dispatch }: { s: PortalState; dispatch: Dispatch<Action> }) {
  return (
    <>
      <div className="pb-grouplbl" style={{ marginTop: 0 }}>Screens</div>
      {SCREENS.map((sc) => (
        <div key={sc.id} className={`pb-sec${sc.id === s.screen ? ' sel' : ''}`} style={{ cursor: 'pointer' }} onClick={() => dispatch({ t: 'screen', screen: sc.id })}>
          <span className="pb-sec__ico"><Ico name={sc.i} size={15} /></span>
          <div className="pb-sec__b"><div className="pb-sec__name">{sc.l}</div></div>
          {sc.id === s.screen ? <Ico name="check" size={15} /> : null}
        </div>
      ))}
    </>
  );
}

export function LeftPane({ s, dispatch }: { s: PortalState; dispatch: Dispatch<Action> }) {
  const [drag, setDrag] = useState<{ id: string | null; overId: string | null; below: boolean }>({ id: null, overId: null, below: false });

  if (s.screen !== 'home') {
    const L = OTHER_LABELS[s.screen] ?? ['', ''];
    const ico = s.screen === 'splash' ? 'image' : s.screen === 'login' ? 'shield' : s.screen === 'events' ? 'calendar' : 'spa';
    return (
      <div className="pb__pane pb__pane--left">
        <div className="pb__phead"><Ico name="layers" size={17} /><div><div className="pb__ptitle">Structure</div></div></div>
        <div className="pb__pbody">
          <ScreenRows s={s} dispatch={dispatch} />
          <div className="pb-empty" style={{ padding: 'var(--sp-6) var(--sp-4)' }}>
            <div className="pb-empty__ico"><Ico name={ico} size={22} /></div>
            <div className="pb-empty__t">{L[0]}</div>
            <div className="pb-empty__d">{L[1]} Edit it in the panel on the right.</div>
          </div>
        </div>
      </div>
    );
  }

  const on = s.sections.filter((x) => x.on);
  const off = s.sections.filter((x) => !x.on);

  return (
    <div className="pb__pane pb__pane--left">
      <div className="pb__phead">
        <Ico name="layers" size={17} />
        <div><div className="pb__ptitle">Home sections</div><div className="pb__psub">Drag to reorder · {on.length} active</div></div>
      </div>
      <div className="pb__pbody">
        <ScreenRows s={s} dispatch={dispatch} />
        <div className="pb-grouplbl" style={{ marginTop: 'var(--sp-4)' }}>Home layout</div>
        {on.map((sec) => {
          const cls = [
            'pb-sec',
            sec.id === s.sel ? 'sel' : '',
            drag.id === sec.id ? 'dragging' : '',
            drag.overId === sec.id && !drag.below ? 'drop-above' : '',
            drag.overId === sec.id && drag.below ? 'drop-below' : '',
          ].filter(Boolean).join(' ');
          return (
            <div
              key={sec.id}
              className={cls}
              draggable={!sec.locked}
              onDragStart={(e) => { setDrag({ id: sec.id, overId: null, below: false }); e.dataTransfer.effectAllowed = 'move'; }}
              onDragEnd={() => setDrag({ id: null, overId: null, below: false })}
              onDragOver={(e) => {
                if (sec.id === drag.id) return;
                e.preventDefault();
                const r = e.currentTarget.getBoundingClientRect();
                const below = e.clientY > r.top + r.height / 2;
                setDrag((d) => ({ ...d, overId: sec.id, below }));
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (drag.id && drag.id !== sec.id) dispatch({ t: 'reorder', fromId: drag.id, toId: sec.id, below: drag.below });
                setDrag({ id: null, overId: null, below: false });
              }}
              onClick={() => dispatch({ t: 'select', id: sec.id })}
            >
              <span className="pb-sec__grip" style={sec.locked ? { opacity: 0.35, cursor: 'default' } : undefined}>
                {sec.locked ? <Ico name="dots" size={15} /> : <Grip />}
              </span>
              <span className="pb-sec__ico"><Ico name={sec.icon} size={15} /></span>
              <div className="pb-sec__b"><div className="pb-sec__name">{sec.name}</div><div className="pb-sec__type">{typeLabel(sec.type, sec)}</div></div>
              {sec.locked ? (
                <span className="pb-sec__lock" title="Always shown"><Ico name="shield" size={13} /></span>
              ) : (
                <button className="pb-eye on" title="Hide section" onClick={(e) => { e.stopPropagation(); dispatch({ t: 'disable', id: sec.id }); }}><Ico name="eye" size={15} /></button>
              )}
            </div>
          );
        })}
        <button className="pb-add" onClick={() => dispatch({ t: 'toggleLib' })}>
          <Ico name={s.libOpen ? 'x' : 'plus'} size={15} />{s.libOpen ? 'Close' : 'Add block'}
        </button>
        {s.libOpen && (
          <div className="pb-lib">
            <div className="pb-lib__t">Add a block</div>
            {off.length ? off.map((sec) => (
              <div className="pb-libitem" key={sec.id} onClick={() => dispatch({ t: 'enable', id: sec.id })}>
                <span className="pb-libitem__ico"><Ico name={sec.icon} size={15} /></span>
                <div><div className="pb-libitem__n">{sec.name}</div><div className="pb-libitem__d">{typeLabel(sec.type, sec)}</div></div>
              </div>
            )) : <div className="pb-libitem" style={{ color: 'var(--text-3)', cursor: 'default' }}>All blocks are in use.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

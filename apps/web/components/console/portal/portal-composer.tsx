'use client';

import { useReducer } from 'react';
import { LeftPane } from './left-pane';
import { InspectorPane } from './inspector-pane';
import { PhonePreview } from './phone-preview';
import { initialState, reducer, type ScreenId } from './portal-state';

const SCREEN_TABS: [ScreenId, string][] = [
  ['splash', 'Splash'], ['login', 'Sign-in'], ['home', 'Home'], ['explore', 'Explore'], ['events', 'Events'],
];

/**
 * Three-pane Guest Portal composer (left = screens + section blocks, center = live phone
 * preview, right = Edit/Brand/Languages inspector). Mock state for now; persistence to the
 * hotel (load + Publish) comes in a later pass.
 */
export function PortalComposer() {
  const [s, dispatch] = useReducer(reducer, undefined, initialState);
  return (
    <div className="pb">
      <LeftPane s={s} dispatch={dispatch} />
      <div className="pb-stage">
        <div className="pb-screentabs">
          {SCREEN_TABS.map((t) => (
            <button key={t[0]} className={t[0] === s.screen ? 'on' : ''} onClick={() => dispatch({ t: 'screen', screen: t[0] })}>{t[1]}</button>
          ))}
        </div>
        <PhonePreview s={s} onSelect={(id) => dispatch({ t: 'select', id })} />
      </div>
      <InspectorPane s={s} dispatch={dispatch} />
    </div>
  );
}

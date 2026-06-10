'use client';

import type { ReactNode } from 'react';
import { Ico } from './portal-icons';
import { gpStyleVars, type LangCode, type PortalState, type Section } from './portal-state';

/* Live phone renderer — JSX port of the design's portal-phone.js. Renders the guest-facing
   splash/login/home/explore/events screens from composer state. On Home, blocks are clickable
   to select them in the inspector. */

function initials(name: string): string {
  const n = (name || '').trim().split(/\s+/);
  return ((n[0]?.[0] || 'A') + (n[1] ? n[1][0] : n[0]?.[1] || '')).toUpperCase();
}

function StatusBar({ onImg }: { onImg?: boolean }) {
  return (
    <div className={`gp-status${onImg ? ' gp-status--onimg' : ''}`}>
      <span>9:41</span>
      <span className="gp-status__r">
        <Ico name="signal" size={15} />
        <Ico name="wifi" size={15} />
        <svg width="22" height="13" viewBox="0 0 24 14" fill="none">
          <rect x="1" y="1" width="20" height="12" rx="3" stroke="currentColor" strokeWidth="1.4" />
          <rect x="3" y="3" width="14" height="8" rx="1.5" fill="currentColor" />
          <rect x="22" y="4.5" width="1.6" height="5" rx="1" fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}

function ImgSlot() {
  return <div className="gp-img gp-img--photo"><Ico name="image" size={26} /></div>;
}

const LANG_ORDER: LangCode[] = ['en', 'tr', 'de', 'ru'];
function LangPills({ s }: { s: PortalState }) {
  return (
    <div className="gp-langpills">
      {LANG_ORDER.filter((l) => s.langs[l]).map((l) => (
        <button key={l} className={l === s.brand.lang ? 'on' : ''}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}

/* ---------------- SPLASH ---------------- */
function Splash({ s }: { s: PortalState }) {
  return (
    <div className="gp-splash">
      <div className="gp-splash__bg gp-img gp-img--photo"><Ico name="image" size={0} /></div>
      <StatusBar onImg />
      <div className="gp-splash__in">
        <LangPills s={s} />
        <div style={{ flex: 1 }} />
        <div className="gp-mono">{initials(s.splash.name)}</div>
        <div className="gp-splash__name">{s.splash.name}</div>
        <div className="gp-splash__sub">{s.splash.sub}</div>
        <div style={{ flex: 1 }} />
        <div className="gp-splash__tag">{s.splash.tag}</div>
        <div className="gp-enter">{s.splash.enter} <Ico name="arrowR" size={17} /></div>
      </div>
    </div>
  );
}

/* ---------------- LOGIN ---------------- */
const LOGIN_FIELDS: Record<PortalState['login']['method'], [string, string][]> = {
  room: [['Room number', 'e.g. 412'], ['Date of birth', 'DD / MM / YYYY']],
  email: [['Email address', 'you@email.com'], ['Confirmation code', '6-digit code']],
  code: [['Last name', 'Korkmaz'], ['Booking reference', 'ABX-49120']],
};
function Login({ s }: { s: PortalState }) {
  return (
    <div className="gp-scroll">
      <StatusBar />
      <div className="gp-login__hero gp-img gp-img--photo" style={{ marginTop: -42, paddingTop: 42 }}><Ico name="image" size={0} /></div>
      <div className="gp-login__body">
        <div className="gp-login__mono">{initials(s.splash.name)}</div>
        <div className="gp-h1">Welcome</div>
        <div className="gp-login__sub">Sign in to your stay · {s.splash.name}</div>
        {LOGIN_FIELDS[s.login.method].map((f, i) => (
          <div className="gp-field" key={i}><div className="gp-field__l">{f[0]}</div><div className="gp-field__in">{f[1]}</div></div>
        ))}
        <div className="gp-cta">Continue <Ico name="arrowR" size={16} /></div>
        <div className="gp-link">Need help signing in?</div>
        {s.login.privacy && (
          <div className="gp-note"><Ico name="shield" size={15} /><span>Protected by AIDA. Your data stays private to your stay.</span></div>
        )}
      </div>
    </div>
  );
}

/* ---------------- HOME BLOCKS ---------------- */
function block(sec: Section): ReactNode {
  switch (sec.type) {
    case 'greeting':
      return (
        <>
          <div className="gp-home__head">
            <div className="gp-kicker">Good morning</div>
            <div className="gp-greet">
              <div>
                <div className="gp-greet__name">{sec.name2 || 'Elif'}</div>
                {sec.showRoom !== false && <div className="gp-greet__room">Room 412 · Sea View Suite</div>}
              </div>
              <div className="gp-avatar" />
            </div>
          </div>
          <div className="gp-hr" />
        </>
      );
    case 'weather':
      return <div className="gp-weather"><Ico name="sun" size={15} /><b>28°</b> Sunny <span className="dot" /> <Ico name="droplet" size={15} /> Sea <b>24°</b></div>;
    case 'spotlight':
      return (
        <div className="gp-spot">
          <div className="gp-spot__img gp-img gp-img--photo"><Ico name="image" size={0} /></div>
          <div className="gp-spot__tag"><span className="ico-dot" />{sec.kicker || 'Tonight at the resort'}</div>
          <div className="gp-spot__in">
            <div className="gp-spot__meta">
              <span className="gp-spot__time">{sec.time || '21:00'}</span>
              <span className="gp-spot__venue"><Ico name="pin" size={12} />{sec.venue || 'Horizon Terrace'}</span>
            </div>
            <div className="gp-spot__title">{sec.title || 'Sunset Jazz on the Terrace'}</div>
            <div className="gp-spot__desc">{sec.desc || ''}</div>
            <div className="gp-spot__cta">{sec.cta || 'Reserve'} <Ico name="arrowR" size={14} /></div>
          </div>
        </div>
      );
    case 'carousel':
      return <Carousel sec={sec} />;
    case 'banner':
      return (
        <div className="gp-concierge">
          <div className="gp-concierge__ico"><Ico name="bell" size={21} /></div>
          <div className="gp-concierge__b">
            <div className="gp-concierge__t">{sec.title || 'Your concierge'}</div>
            <div className="gp-concierge__s">{sec.sub || 'Anything you need, a tap away'}</div>
          </div>
          <Ico name="chevR" size={18} />
        </div>
      );
    case 'feedback':
      return (
        <div className="gp-feedback">
          <div className="gp-feedback__heart"><Ico name="heart" size={20} /></div>
          <div className="gp-feedback__t">{sec.title || 'How is your stay so far?'}</div>
          <div className="gp-feedback__s">{sec.sub || 'A moment of your time helps us perfect it.'}</div>
          <div className="gp-feedback__btn">{sec.cta || 'Share feedback'}</div>
        </div>
      );
    case 'quickactions':
      return (
        <div className="gp-quick">
          {(sec.items || []).map((it, i) => (
            <div className="gp-quick__i" key={i}><div className="gp-quick__ico"><Ico name={it.i} size={20} /></div><div className="gp-quick__l">{it.l}</div></div>
          ))}
        </div>
      );
    case 'offer':
      return (
        <div className="gp-offer">
          <div className="gp-offer__ico"><Ico name="gift" size={20} /></div>
          <div>
            <div className="gp-offer__t">{sec.title || '20% off Thalasso rituals'}</div>
            <div className="gp-offer__d">{sec.desc || 'This week only for Sea View guests.'}</div>
          </div>
        </div>
      );
    case 'eventstrip': {
      const evs = [
        { d: '14', m: 'Jun', t: 'Aegean Wine Tasting', s: '19:30 · The Cellar' },
        { d: '15', m: 'Jun', t: 'Sunrise Yoga', s: '07:00 · Beach Deck' },
      ];
      return (
        <>
          <div className="gp-sechead"><div className="gp-sechead__h">{sec.title || 'This week'}</div><div className="gp-sechead__a">Events <Ico name="chevR" size={13} /></div></div>
          {evs.map((e, i) => (
            <div className="gp-evrow" key={i}>
              <div className="gp-evrow__date"><div className="gp-evrow__d">{e.d}</div><div className="gp-evrow__m">{e.m}</div></div>
              <div className="gp-evrow__b"><div className="gp-evrow__t">{e.t}</div><div className="gp-evrow__s">{e.s}</div></div>
              <Ico name="chevR" size={16} />
            </div>
          ))}
        </>
      );
    }
    default:
      return null;
  }
}

function Carousel({ sec }: { sec: Section }) {
  const head = (
    <div className="gp-sechead"><div className="gp-sechead__h">{sec.title || 'Dining for you'}</div><div className="gp-sechead__a">See all <Ico name="chevR" size={13} /></div></div>
  );
  if (sec.kind === 'spa') {
    const cards = [
      { title: 'Golden Hour Hammam Ritual', dur: '80 min', price: 'from €160', sub: 'Traditional Turkish hammam, kese exfoliation and warm marble rest.', badge: 'Treatments' },
      { title: 'Aegean Aroma Massage', dur: '60 min', price: 'from €120', sub: 'Olive-oil massage with lavender from the hills.', badge: 'Treatments' },
    ];
    return (
      <>{head}<div className="gp-caro">{cards.map((c, i) => (
        <div className="gp-vcard" key={i}>
          <div className="gp-vcard__img gp-img gp-img--photo"><Ico name="image" size={0} />
            <div className="gp-vcard__pill">{c.badge}</div>
            <div className="gp-vcard__over"><span className="clk"><Ico name="clock" size={13} />{c.dur}</span><span>{c.price}</span></div>
          </div>
          <div className="gp-vcard__body"><div className="gp-vcard__n">{c.title}</div><div className="gp-vcard__sub">{c.sub}</div></div>
        </div>
      ))}</div></>
    );
  }
  if (sec.kind === 'exp') {
    const cards = [
      { title: 'Private Sunset Catamaran', meta: '2.5 hrs · from €180', badge: 'For you' },
      { title: 'Aegean Tasting Menu', meta: 'Marea · 7 courses', badge: 'Chef’s table' },
    ];
    return (
      <>{head}<div className="gp-caro">{cards.map((c, i) => (
        <div className="gp-xcard" key={i}>
          <div className="gp-xcard__img gp-img gp-img--photo"><Ico name="image" size={0} /></div>
          <div className="gp-xcard__badge">{c.badge}</div>
          <div className="gp-xcard__in"><div className="gp-xcard__t">{c.title}</div><div className="gp-xcard__meta">{c.meta}</div></div>
        </div>
      ))}</div></>
    );
  }
  const cards = [
    { n: 'Marea', price: '€€€€', sub: 'Aegean fine dining · until 23:00', badge: 'Open now', open: true },
    { n: 'Ocak', price: '€€€', sub: 'Anatolian grill · until 23:30', badge: 'Open now', open: true },
    { n: 'Sky Bar', price: '€€', sub: 'Cocktails · from 18:00', badge: '18:00', open: false },
  ];
  return (
    <>{head}<div className="gp-caro">{cards.map((c, i) => (
      <div className="gp-vcard" key={i}>
        <div className="gp-vcard__img gp-img gp-img--photo"><Ico name="image" size={0} />
          <div className="gp-card__badge" style={c.open ? undefined : { background: 'rgba(20,16,12,.6)' }}><span className="ico-dot" />{c.badge}</div>
        </div>
        <div className="gp-vcard__body"><div className="gp-vcard__row"><div className="gp-vcard__n">{c.n}</div><div className="gp-vcard__price">{c.price}</div></div><div className="gp-vcard__sub">{c.sub}</div></div>
      </div>
    ))}</div></>
  );
}

/* ---------------- EXPLORE / EVENTS ---------------- */
function Explore() {
  const cats = [
    { t: 'Dining', d: 'Eight restaurants & bars, from Aegean fine dining to a rooftop at dusk.', n: '8 Places' },
    { t: 'Spa', d: 'Hammam rituals, massages and a thalasso pool above the sea.', n: '12 Places' },
    { t: 'Activities', d: 'Diving, tennis, kids club and sunset sailing.', n: '16 Places' },
    { t: 'Sports', d: 'Tennis, padel, water sports and a sea-view fitness studio.', n: '16 Places' },
    { t: 'Kids Club', d: 'A supervised club, pools and play for younger guests.', n: '11 Places' },
    { t: 'Facilities', d: 'Beaches, pools, the marina and everything in between.', n: '14 Places' },
  ];
  return (
    <div className="gp-scroll">
      <StatusBar />
      <div className="gp-explore">
        <div className="gp-explore__h">Explore</div>
        <div className="gp-explore__sub">Discover the resort</div>
        {cats.map((c, i) => (
          <div className="gp-excard" key={i}>
            <div className="gp-excard__img gp-img gp-img--photo"><Ico name="image" size={0} /></div>
            <div className="gp-excard__in"><div className="gp-excard__t">{c.t}</div><div className="gp-excard__d">{c.d}</div><div className="gp-excard__n">{c.n}</div></div>
          </div>
        ))}
      </div>
      <TabBar active="explore" />
    </div>
  );
}

function Events({ filter }: { filter: PortalState['eventsFilter'] }) {
  const chips: [string, PortalState['eventsFilter']][] = [['Today', 'today'], ['Upcoming', 'upcoming'], ['All', 'all']];
  const evs = [
    { time: '07:30', t: 'Sunrise Yoga by the Sea', loc: 'Beach Deck' },
    { time: '11:00', t: 'Guided Reef Snorkel', loc: 'Dive Centre' },
    { time: '21:00', t: 'Sunset Jazz on the Terrace', loc: 'Horizon Terrace' },
  ];
  return (
    <div className="gp-scroll">
      <StatusBar />
      <div className="gp-events">
        <div className="gp-events__h">Events</div>
        <div className="gp-evchips">{chips.map((c) => <div className={`gp-evchip ${c[1] === filter ? 'on' : ''}`} key={c[1]}>{c[0]}</div>)}</div>
        {evs.map((e, i) => (
          <div className="gp-evcard" key={i}>
            <div className="gp-evcard__img gp-img gp-img--photo"><Ico name="image" size={0} /></div>
            <div className="gp-evcard__time">{e.time}</div>
            <div className="gp-evcard__add"><Ico name="plus" size={18} /></div>
            <div className="gp-evcard__in"><div className="gp-evcard__t">{e.t}</div><div className="gp-evcard__loc"><Ico name="pin" size={13} />{e.loc}</div></div>
          </div>
        ))}
      </div>
      <TabBar active="events" />
    </div>
  );
}

/* ---------------- TAB BAR ---------------- */
function TabBar({ active }: { active: string }) {
  const tabs = [
    { id: 'home', i: 'grid', l: 'Home' },
    { id: 'explore', i: 'spa', l: 'Explore' },
    { id: 'events', i: 'calendar', l: 'Events' },
    { id: 'messages', i: 'message', l: 'Messages', badge: 2 },
    { id: 'profile', i: 'users', l: 'Profile' },
  ];
  return (
    <div className="gp-tabbar">
      {tabs.map((t) => (
        <div className={`gp-tab ${t.id === active ? 'on' : ''}`} key={t.id}>
          {t.badge ? <span className="gp-tab__badge">{t.badge}</span> : null}
          <Ico name={t.i} size={21} /><span>{t.l}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- HOME ---------------- */
function Home({ s, onSelect }: { s: PortalState; onSelect: (id: string) => void }) {
  return (
    <div className="gp-scroll">
      <StatusBar />
      <div className="gp-home">
        {s.sections.filter((sec) => sec.on).map((sec) => (
          <div
            key={sec.id}
            className={`gp-block${sec.id === s.sel ? ' gp-sel' : ''}`}
            data-sec={sec.id}
            onClick={() => onSelect(sec.id)}
          >
            {block(sec)}
          </div>
        ))}
      </div>
      <TabBar active="home" />
    </div>
  );
}

/* ---------------- DEVICE ---------------- */
export function PhonePreview({ s, onSelect }: { s: PortalState; onSelect: (id: string) => void }) {
  const inner =
    s.screen === 'splash' ? <Splash s={s} />
    : s.screen === 'login' ? <Login s={s} />
    : s.screen === 'explore' ? <Explore />
    : s.screen === 'events' ? <Events filter={s.eventsFilter} />
    : <Home s={s} onSelect={onSelect} />;
  return (
    <div className="gp-phone">
      <div className="gp-phone__notch" />
      <div className="gp-screen" style={gpStyleVars(s.brand)}>{inner}</div>
    </div>
  );
}

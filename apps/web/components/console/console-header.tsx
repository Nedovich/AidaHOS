'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Moon, Search, Sun } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import { setLangCookie, useLang } from './lang-provider';
import { MobileNavToggle } from './mobile-nav-toggle';

export function ConsoleHeader({
  initials,
  crumb,
  title,
  search,
}: {
  initials: string;
  crumb: string;
  title: string;
  search?: string;
}) {
  const router = useRouter();
  const lang = useLang();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const t = (localStorage.getItem('aida-theme') as 'light' | 'dark') || 'light';
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  const applyTheme = (t: 'light' | 'dark') => {
    setTheme(t);
    localStorage.setItem('aida-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  const applyLang = (l: Lang) => {
    if (l === lang) return;
    setLangCookie(l);
    router.refresh();
  };

  return (
    <header className="header">
      <MobileNavToggle />
      <div className="header__title">
        <span className="header__crumb">{crumb}</span>
        <span className="header__h">{title}</span>
      </div>
      <div className="header__spacer" />
      <label className="search">
        <span style={{ display: 'flex' }}>
          <Search size={16} />
        </span>
        <input placeholder={search ?? L(['Hesap, otel, kullanıcı ara…', 'Search accounts, hotels, users…'], lang)} />
      </label>

      <div className="seg" id="langSeg">
        <button className={lang === 'tr' ? 'on' : ''} onClick={() => applyLang('tr')}>
          TR
        </button>
        <button className={lang === 'en' ? 'on' : ''} onClick={() => applyLang('en')}>
          EN
        </button>
      </div>

      <div className="seg">
        <button className={theme === 'light' ? 'on' : ''} onClick={() => applyTheme('light')}>
          <Sun size={16} />
        </button>
        <button className={theme === 'dark' ? 'on' : ''} onClick={() => applyTheme('dark')}>
          <Moon size={16} />
        </button>
      </div>

      <button className="icon-btn">
        <Bell size={18} />
        <span className="dot" />
      </button>
      <div className="avatar">{initials}</div>
    </header>
  );
}

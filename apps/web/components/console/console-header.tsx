'use client';

import { useEffect, useState } from 'react';
import { Bell, Moon, Search, Sun } from 'lucide-react';

export function ConsoleHeader({
  initials,
  crumb = 'AIDA Operations',
  title = 'Süper Yönetici',
  searchPlaceholder = 'Hesap, otel, kullanıcı ara…',
}: {
  initials: string;
  crumb?: string;
  title?: string;
  searchPlaceholder?: string;
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const t = (localStorage.getItem('aida-theme') as 'light' | 'dark') || 'light';
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  const apply = (t: 'light' | 'dark') => {
    setTheme(t);
    localStorage.setItem('aida-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  return (
    <header className="header">
      <div className="header__title">
        <span className="header__crumb">{crumb}</span>
        <span className="header__h">{title}</span>
      </div>
      <div className="header__spacer" />
      <label className="search">
        <span style={{ display: 'flex' }}>
          <Search size={16} />
        </span>
        <input placeholder={searchPlaceholder} />
        <span className="search__kbd">⌘K</span>
      </label>
      <div className="seg">
        <button className={theme === 'light' ? 'on' : ''} onClick={() => apply('light')}>
          <Sun size={16} />
        </button>
        <button className={theme === 'dark' ? 'on' : ''} onClick={() => apply('dark')}>
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

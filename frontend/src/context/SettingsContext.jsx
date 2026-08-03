import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const SettingsContext = createContext(null);
const STORAGE_KEY = 'ccs_settings';
const DEFAULT_LOGO = '/img/logo.jpg';

const FAVICON_MIME_TYPES = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  ico: 'image/x-icon',
  gif: 'image/gif',
  webp: 'image/webp',
};

function applyFavicon(settings) {
  const link = document.getElementById('app-favicon');
  if (!link) return;
  const href = settings?.store_logo || DEFAULT_LOGO;
  const ext = href.split('.').pop().toLowerCase();
  link.href = href;
  link.type = FAVICON_MIME_TYPES[ext] || 'image/x-icon';
}

function applyTheme(settings) {
  if (!settings) return;
  const root = document.documentElement;
  // Both the "accent" pair (wa-green/wa-green-dark, used for buttons, links,
  // text highlights) and the "header" pair (wa-teal/wa-teal-light, used for
  // the Navbar/AdminSidebar/Footer background and login hero gradients) need
  // to track the chosen colors - otherwise headers stay the old fixed teal
  // while only buttons re-theme.
  if (settings.theme_color_dark) {
    root.style.setProperty('--color-wa-green', settings.theme_color_dark);
    root.style.setProperty('--color-wa-teal-light', settings.theme_color_dark);
  }
  if (settings.theme_color_light) {
    root.style.setProperty('--color-wa-green-dark', settings.theme_color_light);
    root.style.setProperty('--color-wa-teal', settings.theme_color_light);
  }
}

function applyTitle(settings) {
  document.title = settings?.store_name || 'Soon';
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const cached = readCache();
    applyTheme(cached);
    applyTitle(cached);
    applyFavicon(cached);
    return cached;
  });

  function refreshSettings() {
    return api.get('/settings').then((res) => {
      setSettings(res.data);
      applyTheme(res.data);
      applyTitle(res.data);
      applyFavicon(res.data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    });
  }

  useEffect(() => {
    refreshSettings().catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

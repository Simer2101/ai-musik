import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { BACKGROUND_IDS, buildColors, type BackgroundId, type ThemeColors, type ThemeName } from '@/constants/Colors';
import { dictionaries, type Dictionary, type Language } from '@/lib/i18n';

const LANG_KEY = 'aimusik.language';
const THEME_KEY = 'aimusik.theme';
const BACKGROUND_KEY = 'aimusik.background';

type SettingsContextValue = {
  language: Language;
  themeName: ThemeName;
  background: BackgroundId;
  colors: ThemeColors;
  t: Dictionary;
  setLanguage: (language: Language) => void;
  setThemeName: (themeName: ThemeName) => void;
  setBackground: (background: BackgroundId) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function read(key: string) {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return null;
  return localStorage.getItem(key);
}

function write(key: string, value: string) {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  localStorage.setItem(key, value);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');
  const [themeName, setThemeState] = useState<ThemeName>('dark');
  const [background, setBackgroundState] = useState<BackgroundId>('classic');

  useEffect(() => {
    const savedLang = read(LANG_KEY);
    const savedTheme = read(THEME_KEY);
    const savedBackground = read(BACKGROUND_KEY);
    if (savedLang === 'ru' || savedLang === 'en') setLanguageState(savedLang);
    if (savedTheme === 'dark' || savedTheme === 'light') setThemeState(savedTheme);
    if (BACKGROUND_IDS.includes(savedBackground as BackgroundId)) {
      setBackgroundState(savedBackground as BackgroundId);
    }
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      language,
      themeName,
      background,
      colors: buildColors(themeName, background),
      t: dictionaries[language],
      setLanguage: (next) => {
        setLanguageState(next);
        write(LANG_KEY, next);
      },
      setThemeName: (next) => {
        setThemeState(next);
        write(THEME_KEY, next);
      },
      setBackground: (next) => {
        setBackgroundState(next);
        write(BACKGROUND_KEY, next);
      },
    }),
    [background, language, themeName]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

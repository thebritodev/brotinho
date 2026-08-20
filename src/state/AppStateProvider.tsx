import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Platform } from 'react-native';

import {
  cancelDailyReminder,
  cancelWeeklySummary,
  scheduleDailyReminder,
  scheduleWeeklySummary,
} from '../services/notifications';
import { clearAppData, loadAppData, saveAppData } from '../storage/appStorage';
import type { Mood } from '../theme';
import { renomear } from '../data/onboarding';
import { dayKey } from './derived';
import {
  INITIAL_APP_DATA,
  INITIAL_PROFILE,
  INITIAL_SETTINGS,
  type AppData,
  type Compost,
  type JournalEntry,
  type Profile,
  type Settings,
} from './types';

type AppStateValue = {
  /** false enquanto o AsyncStorage ainda não respondeu. */
  hydrated: boolean;
  data: AppData;
  updateProfile: (patch: Partial<Profile>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setTodayMood: (mood: Mood) => void;
  addJournalEntry: (text: string) => void;
  updateJournalEntry: (id: string, text: string) => void;
  removeJournalEntry: (id: string) => void;
  addCompost: (entry: Omit<Compost, 'id' | 'createdAt'>) => void;
  /** Registra que a pessoa já viu a comemoração deste estágio. */
  markStageSeen: (stage: number) => void;
  reset: () => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<AppData>(INITIAL_APP_DATA);

  // Evita gravar o estado inicial por cima do que acabou de ser lido do disco.
  const canPersist = useRef(false);

  useEffect(() => {
    let cancelled = false;

    loadAppData().then((stored) => {
      if (cancelled) return;
      const perfil = { ...INITIAL_PROFILE, ...stored?.profile };

      setData({
        profile: {
          ...perfil,
          // Rótulos de resposta mudaram; sem isto o que a pessoa marcou some
          // da seleção em Meus dados.
          checkin: perfil.checkin ? renomear(perfil.checkin) : null,
          tentou: perfil.tentou.map(renomear),
        },
        settings: { ...INITIAL_SETTINGS, ...stored?.settings },
        journal: stored?.journal ?? [],
        composts: stored?.composts ?? [],
        moodHistory: stored?.moodHistory ?? [],
        // Primeira abertura define a data de início de uso.
        startedAt: stored?.startedAt ?? dayKey(),
        // `null` em quem instalou antes do broto crescer: quem adota o estágio
        // atual é a Home, em silêncio, para não comemorar um passado inteiro.
        stageSeen: stored?.stageSeen ?? null,
      });
      canPersist.current = true;
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (canPersist.current) void saveAppData(data);
  }, [data]);

  // Mantém a notificação do sistema em sincronia com a preferência e o horário.
  // Web não tem agendamento de notificação local; ali só não faz nada.
  const { reminders, weeklySummary } = data.settings;
  const { reminder, onboarded } = data.profile;

  useEffect(() => {
    if (!hydrated || Platform.OS === 'web' || !onboarded) return;
    if (reminders) void scheduleDailyReminder(reminder);
    else void cancelDailyReminder();
  }, [hydrated, onboarded, reminders, reminder]);

  useEffect(() => {
    if (!hydrated || Platform.OS === 'web' || !onboarded) return;
    if (weeklySummary) void scheduleWeeklySummary();
    else void cancelWeeklySummary();
  }, [hydrated, onboarded, weeklySummary]);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setData((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const markStageSeen = useCallback((stage: number) => {
    setData((prev) => (prev.stageSeen === stage ? prev : { ...prev, stageSeen: stage }));
  }, []);

  /** Um registro por dia: escolher de novo hoje substitui o de hoje. */
  const setTodayMood = useCallback((mood: Mood) => {
    const today = dayKey();
    setData((prev) => ({
      ...prev,
      moodHistory: [{ date: today, mood }, ...prev.moodHistory.filter((m) => m.date !== today)],
    }));
  }, []);

  const addJournalEntry = useCallback((text: string) => {
    const entry: JournalEntry = {
      id: `${Date.now()}`,
      createdAt: Date.now(),
      text: text.trim(),
    };
    setData((prev) => ({ ...prev, journal: [entry, ...prev.journal] }));
  }, []);

  const updateJournalEntry = useCallback((id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      journal: prev.journal.map((e) => (e.id === id ? { ...e, text: text.trim() } : e)),
    }));
  }, []);

  const removeJournalEntry = useCallback((id: string) => {
    setData((prev) => ({ ...prev, journal: prev.journal.filter((e) => e.id !== id) }));
  }, []);

  const addCompost = useCallback((entry: Omit<Compost, 'id' | 'createdAt'>) => {
    const compost: Compost = { id: `${Date.now()}`, createdAt: Date.now(), ...entry };
    setData((prev) => ({ ...prev, composts: [compost, ...prev.composts] }));
  }, []);

  const reset = useCallback(() => {
    setData(INITIAL_APP_DATA);
    void clearAppData();
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      data,
      updateProfile,
      updateSettings,
      setTodayMood,
      addJournalEntry,
      updateJournalEntry,
      removeJournalEntry,
      addCompost,
      markStageSeen,
      reset,
    }),
    [
      hydrated,
      data,
      updateProfile,
      updateSettings,
      setTodayMood,
      addJournalEntry,
      updateJournalEntry,
      removeJournalEntry,
      addCompost,
      markStageSeen,
      reset,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState precisa estar dentro de <AppStateProvider>');
  return ctx;
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AppState, Platform } from 'react-native';

import {
  cancelDailyReminder,
  cancelWeeklySummary,
  scheduleDailyReminder,
  scheduleWeeklySummary,
} from '../services/notifications';
import { clearAppData, loadAppData, saveAppData } from '../storage/appStorage';
import type { Mood } from '../theme';
import { dayKey, daysCaredFor, diasSemAparecer } from './derived';
import { sanitizarDados } from './sanitize';
import type { Plant } from './types';
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
  /** Guarda a planta madura no jardim e começa um broto novo. */
  colherPlanta: (planta: Plant) => void;
  /** Anota uma prática concluída. */
  registrarPratica: (topic: string, practice: string) => void;
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

    loadAppData()
      .then((stored) => {
        if (cancelled) return;
        // Tudo que vem do disco passa pelo saneamento antes de virar estado.
        setData(sanitizarDados(stored, dayKey()));
      })
      .catch(() => {
        // Nem uma exceção aqui pode deixar o app preso na tela de carregamento:
        // sem `hydrated`, nada é renderizado e a pessoa fica olhando o vazio.
        if (!cancelled) setData(INITIAL_APP_DATA);
      })
      .finally(() => {
        if (cancelled) return;
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

  /**
   * Fica fora do efeito para não entrar `data` inteiro na lista de
   * dependências: ali, cada humor marcado cancelaria e reagendaria a
   * notificação. Este número muda no máximo uma vez por dia.
   */
  const ausencia = diasSemAparecer(data);
  const cuidados = daysCaredFor(data);

  /**
   * Muda quando o app volta do segundo plano, para a fila de lembretes ser
   * recomposta a partir de hoje.
   *
   * Sem isto, um app que fica semanas em segundo plano sem ser morto pelo
   * sistema continuaria tocando a fila antiga — que, a essa altura, já teria
   * entrado no espaçamento de quem sumiu, com a pessoa ali usando o app.
   */
  const [voltou, setVoltou] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setVoltou((n) => n + 1);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!hydrated || Platform.OS === 'web' || !onboarded) return;
    // Não é um agendamento só: é uma fila de dias, cada um com o seu texto.
    // O plano inteiro está em `data/lembretes.ts`.
    if (reminders) void scheduleDailyReminder(reminder, ausencia, cuidados);
    else void cancelDailyReminder();
  }, [hydrated, onboarded, reminders, reminder, ausencia, cuidados, voltou]);

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

  const colherPlanta = useCallback((planta: Plant) => {
    setData((prev) =>
      // Colher zera o ciclo, então o estágio visto volta ao começo junto.
      prev.garden.some((p) => p.id === planta.id)
        ? prev
        : { ...prev, garden: [...prev.garden, planta], stageSeen: 1 },
    );
  }, []);

  const registrarPratica = useCallback((topic: string, practice: string) => {
    setData((prev) => ({
      ...prev,
      practicesDone: [...prev.practicesDone, { topic, practice, at: Date.now() }],
    }));
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
      colherPlanta,
      registrarPratica,
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
      colherPlanta,
      registrarPratica,
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

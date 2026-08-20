import type { PlanKey } from '../data/onboarding';
import type { Mood } from '../theme';

/** Respostas do onboarding + estado da assinatura. */
export type Profile = {
  name: string;
  checkin: string | null;
  valores: string[];
  sleepTime: string;
  tentou: string[];
  reminder: string;
  idade: string | null;
  genero: string | null;
  canal: string | null;
  plan: PlanKey;
  /** true quando o usuário concluiu o paywall assinando. */
  subscribed: boolean;
  /** true depois de sair do onboarding, assinando ou não. */
  onboarded: boolean;
};

export type JournalEntry = {
  id: string;
  /** ISO timestamp de criação. */
  createdAt: number;
  text: string;
};

/** Uma sessão de Composta concluída. */
export type Compost = {
  id: string;
  createdAt: number;
  /** O pensamento compostado — fica guardado só no aparelho. */
  thought: string;
  reps: number;
  secs: number;
};

export type Settings = {
  reminders: boolean;
  weeklySummary: boolean;
  appLock: boolean;
  analysis: boolean;
};

/** Um humor por dia; `date` no formato YYYY-MM-DD. */
export type MoodLog = { date: string; mood: Mood };

export type AppData = {
  profile: Profile;
  /** Histórico de humor, mais recente primeiro. */
  moodHistory: MoodLog[];
  journal: JournalEntry[];
  composts: Compost[];
  settings: Settings;
  /** Data (YYYY-MM-DD) do primeiro uso — base para "cuidando de si desde...". */
  startedAt: string | null;
  /**
   * Último estágio do broto que a pessoa já viu comemorado. Serve só para não
   * repetir a comemoração; o estágio de verdade é calculado dos registros.
   * `null` em quem instalou antes disso existir — nesse caso o app adota o
   * estágio atual em silêncio, sem comemorar um crescimento antigo.
   */
  stageSeen: number | null;
};

export const INITIAL_PROFILE: Profile = {
  name: '',
  checkin: null,
  valores: [],
  sleepTime: '23:00',
  tentou: [],
  reminder: '21:00',
  idade: null,
  genero: null,
  canal: null,
  plan: 'anual',
  subscribed: false,
  onboarded: false,
};

export const INITIAL_SETTINGS: Settings = {
  reminders: true,
  weeklySummary: false,
  appLock: true,
  analysis: true,
};

export const INITIAL_APP_DATA: AppData = {
  profile: INITIAL_PROFILE,
  moodHistory: [],
  journal: [],
  composts: [],
  settings: INITIAL_SETTINGS,
  startedAt: null,
  stageSeen: null,
};

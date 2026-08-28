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
  /** Vibração curta nos momentos que confirmam algo. */
  vibracao: boolean;
  /**
   * Tom suave marcando as fases da respiração guiada.
   *
   * Só toca dentro do exercício, e obedece ao botão de silencioso do aparelho:
   * quem está no ônibus ou com alguém dormindo do lado não é surpreendido.
   */
  somDaRespiracao: boolean;
};

/** Um humor por dia; `date` no formato YYYY-MM-DD. */
export type MoodLog = { date: string; mood: Mood };

/**
 * Uma planta que amadureceu e foi para o jardim.
 *
 * O broto crescia até o estágio 3 e parava para sempre — dez dias de
 * crescimento numa assinatura anual. Agora cada broto amadurece, vira planta
 * guardada e um novo começa. O que se acumula é memória de um período, não
 * pontuação: cada planta carrega o valor e o humor que marcaram os dias dela.
 */
export type Plant = {
  id: string;
  /** Dia em que amadureceu (YYYY-MM-DD). */
  maturedAt: string;
  /** Dias cuidados que essa planta levou para crescer. */
  dias: number;
  /** O valor mais vivido no período, se houve algum. */
  valor: string | null;
  /** O humor predominante no período. */
  mood: Mood | null;
};

/** Uma prática concluída, para o app lembrar o que já foi feito. */
export type PracticeDone = { topic: string; practice: string; at: number };

export type AppData = {
  profile: Profile;
  /** Histórico de humor, mais recente primeiro. */
  moodHistory: MoodLog[];
  journal: JournalEntry[];
  composts: Compost[];
  settings: Settings;
  /** Data (YYYY-MM-DD) do primeiro uso — base para "cuidando de si desde...". */
  startedAt: string | null;
  /** Plantas que já amadureceram, da mais antiga para a mais nova. */
  garden: Plant[];
  /** Práticas concluídas, da mais antiga para a mais nova. */
  practicesDone: PracticeDone[];
  /**
   * Último estágio do broto que a pessoa já viu comemorado. Serve só para não
   * repetir a comemoração; o estágio de verdade é calculado dos registros.
   * `null` em quem instalou antes disso existir — nesse caso o app adota o
   * estágio atual em silêncio, sem comemorar um crescimento antigo.
   */
  stageSeen: number | null;
  /**
   * O maior número de dias cuidados que a pessoa já alcançou.
   *
   * Existe porque a contagem era derivada só do que está guardado agora: apagar
   * o único registro de um dia derrubava o total, e o broto podia **voltar** do
   * estágio 3 para o 2, ou deixar de estar pronto para colher.
   *
   * Apagar um registro é um ato legítimo — às vezes a pessoa escreveu algo de
   * que se arrependeu — e não pode vir com a punição de ver a planta encolher.
   * O app promete que o broto nunca regride; isto é o que torna a promessa
   * verdadeira também nesse caso.
   *
   * Some junto com "apagar meus dados", como todo o resto.
   */
  diasCuidadosMax: number;
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
  vibracao: true,
  somDaRespiracao: true,
};

export const INITIAL_APP_DATA: AppData = {
  profile: INITIAL_PROFILE,
  moodHistory: [],
  journal: [],
  composts: [],
  settings: INITIAL_SETTINGS,
  startedAt: null,
  diasCuidadosMax: 0,
  garden: [],
  practicesDone: [],
  stageSeen: null,
};

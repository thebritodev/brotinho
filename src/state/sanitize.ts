import { renomear } from '../data/onboarding';
import type { AppData, Compost, JournalEntry, MoodLog, PracticeDone, Plant, Profile, Settings } from './types';
import { INITIAL_APP_DATA, INITIAL_PROFILE, INITIAL_SETTINGS } from './types';

/**
 * Põe em forma o que veio do disco.
 *
 * O JSON gravado é confiável na maioria das vezes, e é justamente a minoria que
 * derruba o app: uma gravação interrompida, um backup restaurado de outra
 * versão, um campo que mudou de tipo entre versões. Sem isto, um `tentou` que
 * chegou como texto em vez de lista fazia `perfil.tentou.map` estourar dentro
 * da promessa de hidratação — e o app ficava em tela branca PARA SEMPRE, sem
 * mensagem e sem saída. A pessoa conclui que perdeu o diário inteiro.
 *
 * A regra aqui é uma só: campo que não está no formato esperado volta ao
 * padrão, e o resto do que dava para salvar é salvo. Perder uma preferência é
 * incomparavelmente melhor do que não abrir.
 */

const ehLista = (v: unknown): v is unknown[] => Array.isArray(v);
const texto = (v: unknown, padrao: string) => (typeof v === 'string' ? v : padrao);
const booleano = (v: unknown, padrao: boolean) => (typeof v === 'boolean' ? v : padrao);
const textoOuNulo = (v: unknown) => (typeof v === 'string' ? v : null);

/**
 * Só entram itens de texto; o resto da lista é descartado em silêncio.
 *
 * Um texto solto onde era esperada uma lista vira lista de um item. Uma versão
 * antiga podia guardar assim, e jogar a resposta fora quando dá para
 * aproveitá-la seria perder informação da pessoa à toa.
 */
const listaDeTextos = (v: unknown): string[] => {
  if (typeof v === 'string') return v.trim() ? [v] : [];
  return ehLista(v) ? v.filter((x): x is string => typeof x === 'string') : [];
};

/**
 * Formato E intervalo. Só o formato deixava passar "99:99", que atravessa o
 * app até virar um lembrete que nunca dispara e um texto sem sentido na tela.
 */
const HORA = /^(\d{2}):(\d{2})$/;
const hora = (v: unknown, padrao: string) => {
  if (typeof v !== 'string') return padrao;
  const m = HORA.exec(v);
  if (!m) return padrao;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h <= 23 && min <= 59 ? v : padrao;
};

const DIA = /^\d{4}-\d{2}-\d{2}$/;

const MOODS = ['feliz', 'leve', 'ansioso', 'triste', 'cansado', 'neutro'] as const;
const ehMood = (v: unknown): v is MoodLog['mood'] =>
  typeof v === 'string' && (MOODS as readonly string[]).includes(v);

function perfilLimpo(v: unknown): Profile {
  const p = (v ?? {}) as Record<string, unknown>;
  return {
    ...INITIAL_PROFILE,
    name: texto(p.name, INITIAL_PROFILE.name),
    // Cortado no tamanho porque ele vai para o título da notificação, onde o
    // sistema trunca sem avisar — melhor cortar aqui, com controle.
    nomeDoBroto: texto(p.nomeDoBroto, INITIAL_PROFILE.nomeDoBroto).slice(0, 24),
    // Rótulos de resposta mudaram entre versões; `renomear` traduz os antigos.
    checkin: p.checkin ? textoOuNulo(renomear(String(p.checkin))) : null,
    tentou: listaDeTextos(p.tentou).map(renomear),
    valores: listaDeTextos(p.valores),
    sleepTime: hora(p.sleepTime, INITIAL_PROFILE.sleepTime),
    reminder: hora(p.reminder, INITIAL_PROFILE.reminder),
    idade: textoOuNulo(p.idade),
    genero: textoOuNulo(p.genero),
    canal: textoOuNulo(p.canal),
    plan: (['semanal', 'mensal', 'anual', 'vitalicio'] as const).includes(p.plan as never)
      ? (p.plan as Profile['plan'])
      : INITIAL_PROFILE.plan,
    subscribed: booleano(p.subscribed, INITIAL_PROFILE.subscribed),
    onboarded: booleano(p.onboarded, INITIAL_PROFILE.onboarded),
  };
}

function ajustesLimpos(v: unknown): Settings {
  const s = (v ?? {}) as Record<string, unknown>;
  return {
    reminders: booleano(s.reminders, INITIAL_SETTINGS.reminders),
    weeklySummary: booleano(s.weeklySummary, INITIAL_SETTINGS.weeklySummary),
    appLock: booleano(s.appLock, INITIAL_SETTINGS.appLock),
    analysis: booleano(s.analysis, INITIAL_SETTINGS.analysis),
    vibracao: booleano(s.vibracao, INITIAL_SETTINGS.vibracao),
    somDaRespiracao: booleano(s.somDaRespiracao, INITIAL_SETTINGS.somDaRespiracao),
    // Valor desconhecido volta para "sistema": um tema inventado deixaria o app
    // sem cor nenhuma, e "siga o aparelho" nunca é uma escolha errada.
    tema: (['sistema', 'claro', 'escuro'] as const).includes(s.tema as never)
      ? (s.tema as Settings['tema'])
      : INITIAL_SETTINGS.tema,
  };
}

/**
 * Registros do diário. Um item quebrado é descartado; os outros ficam — o
 * diário é o que a pessoa mais teme perder, então nunca se joga a lista fora
 * por causa de uma entrada ruim.
 */
function diarioLimpo(v: unknown): JournalEntry[] {
  if (!ehLista(v)) return [];
  return v.flatMap((item) => {
    const e = (item ?? {}) as Record<string, unknown>;
    if (typeof e.text !== 'string') return [];
    const createdAt = typeof e.createdAt === 'number' && Number.isFinite(e.createdAt) ? e.createdAt : Date.now();
    return [{ id: typeof e.id === 'string' ? e.id : `${createdAt}`, createdAt, text: e.text }];
  });
}

function compostasLimpas(v: unknown): Compost[] {
  if (!ehLista(v)) return [];
  return v.flatMap((item) => {
    const c = (item ?? {}) as Record<string, unknown>;
    if (typeof c.thought !== 'string') return [];
    const createdAt = typeof c.createdAt === 'number' && Number.isFinite(c.createdAt) ? c.createdAt : Date.now();
    return [{
      id: typeof c.id === 'string' ? c.id : `${createdAt}`,
      createdAt,
      thought: c.thought,
      reps: typeof c.reps === 'number' && c.reps >= 0 ? c.reps : 0,
      secs: typeof c.secs === 'number' && c.secs >= 0 ? c.secs : 0,
    }];
  });
}

/** Um humor por dia: data fora do formato ou humor desconhecido saem fora. */
function humoresLimpos(v: unknown): MoodLog[] {
  if (!ehLista(v)) return [];
  const vistos = new Set<string>();
  return v.flatMap((item) => {
    const m = (item ?? {}) as Record<string, unknown>;
    if (typeof m.date !== 'string' || !DIA.test(m.date) || !ehMood(m.mood)) return [];
    if (vistos.has(m.date)) return [];
    vistos.add(m.date);
    return [{ date: m.date, mood: m.mood }];
  });
}

/** Plantas do jardim. Uma entrada torta é descartada; o jardim continua. */
function jardimLimpo(v: unknown): Plant[] {
  if (!ehLista(v)) return [];
  return v.flatMap((item) => {
    const g = (item ?? {}) as Record<string, unknown>;
    if (typeof g.maturedAt !== 'string' || !DIA.test(g.maturedAt)) return [];
    const dias = typeof g.dias === 'number' && g.dias > 0 ? Math.floor(g.dias) : 0;
    if (!dias) return [];
    return [{
      id: typeof g.id === 'string' ? g.id : `${g.maturedAt}-${dias}`,
      maturedAt: g.maturedAt,
      dias,
      valor: typeof g.valor === 'string' ? g.valor : null,
      mood: ehMood(g.mood) ? g.mood : null,
    }];
  });
}

function praticasLimpas(v: unknown): PracticeDone[] {
  if (!ehLista(v)) return [];
  return v.flatMap((item) => {
    const p = (item ?? {}) as Record<string, unknown>;
    if (typeof p.topic !== 'string' || typeof p.practice !== 'string') return [];
    const at = typeof p.at === 'number' && Number.isFinite(p.at) ? p.at : Date.now();
    return [{ topic: p.topic, practice: p.practice, at }];
  });
}

export function sanitizarDados(guardado: unknown, hoje: string): AppData {
  const g = (guardado ?? {}) as Record<string, unknown>;
  const stageSeen =
    typeof g.stageSeen === 'number' && [1, 2, 3].includes(g.stageSeen) ? g.stageSeen : null;

  return {
    ...INITIAL_APP_DATA,
    profile: perfilLimpo(g.profile),
    settings: ajustesLimpos(g.settings),
    journal: diarioLimpo(g.journal),
    composts: compostasLimpas(g.composts),
    moodHistory: humoresLimpos(g.moodHistory),
    startedAt: typeof g.startedAt === 'string' && DIA.test(g.startedAt) ? g.startedAt : hoje,
    garden: jardimLimpo(g.garden),
    practicesDone: praticasLimpas(g.practicesDone),
    stageSeen,
    // Um piso corrompido não pode inflar o jardim de ninguém: só vale número
    // finito e não negativo.
    diasCuidadosMax:
      typeof g.diasCuidadosMax === 'number' && Number.isFinite(g.diasCuidadosMax)
        ? Math.max(0, Math.floor(g.diasCuidadosMax))
        : 0,
  };
}

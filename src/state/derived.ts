import type { SproutStage, ValueKey } from '../components';
import type { Mood } from '../theme';
import type { AppData } from './types';

/**
 * Tudo o que o app mostra como número é calculado aqui, a partir do que a
 * pessoa realmente registrou. Nada de valor fixo: um app de saúde mental que
 * inventa "12 dias cuidados" para quem acabou de instalar quebra a confiança.
 */

/**
 * A data (YYYY-MM-DD) no fuso do aparelho.
 *
 * NÃO use `toISOString()` aqui: ele devolve UTC. No Brasil (UTC−3) isso faz
 * tudo que acontece das 21h à meia-noite contar como o dia SEGUINTE — e o
 * lembrete diário padrão é justamente às 21h. O efeito era escrever à noite e
 * de manhã e ganhar um dia cuidado em vez de dois.
 */
export const dayKey = (d: Date | number = new Date()) => {
  const x = new Date(d);
  const mes = String(x.getMonth() + 1).padStart(2, '0');
  const dia = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${mes}-${dia}`;
};

/** Dias distintos em que houve algum registro (humor, diário ou composta). */
export function daysCaredFor(data: AppData): number {
  const dias = new Set<string>();
  data.moodHistory.forEach((m) => dias.add(m.date));
  data.journal.forEach((e) => dias.add(dayKey(e.createdAt)));
  data.composts.forEach((c) => dias.add(dayKey(c.createdAt)));
  return dias.size;
}

/**
 * Dias cuidados que abrem cada estágio do broto.
 *
 * A conta é por DIA, não por registro: quem escreve dez vezes numa terça
 * cuidou de uma terça. Crescer por volume premiaria quem despeja tudo de uma
 * vez, que é o contrário do hábito que o app quer.
 */
export const STAGE_AT: Record<SproutStage, number> = { 1: 0, 2: 3, 3: 10 };

/** Em que estágio o broto está agora. */
export function sproutStage(data: AppData): SproutStage {
  const dias = daysCaredFor(data);
  if (dias >= STAGE_AT[3]) return 3;
  if (dias >= STAGE_AT[2]) return 2;
  return 1;
}

/** Quantos dias faltam para o próximo estágio, ou null se já está no último. */
export function daysToNextStage(data: AppData): number | null {
  const atual = sproutStage(data);
  if (atual === 3) return null;
  const proximo = (atual + 1) as SproutStage;
  return STAGE_AT[proximo] - daysCaredFor(data);
}

/**
 * Valores vividos: quantas vezes termos ligados a cada valor aparecem nos
 * textos do diário. Heurística simples, rodando no próprio aparelho — nenhum
 * texto sai daqui. Respeita o interruptor de análise em Privacidade.
 */
const VALUE_TERMS: Record<ValueKey, string[]> = {
  coragem: ['coragem', 'corajos', 'enfrent', 'encarei', 'medo'],
  conexao: ['amig', 'famíli', 'famili', 'convers', 'abraç', 'junt', 'compania'],
  curiosidade: ['aprend', 'descobr', 'curios', 'perguntei', 'novo'],
  autocuidado: ['descans', 'dormi', 'respir', 'cuidei', 'pausa', 'caminh'],
  criatividade: ['cri', 'escrev', 'desenh', 'ideia', 'imagin', 'toc'],
};

/** Minúsculas e sem acento: buscar "voce" precisa achar "você". */
export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function livedValues(data: AppData): { value: ValueKey; count: number }[] {
  // O interruptor "Análise dos meus registros" governa toda leitura de texto.
  if (!data.settings.analysis) return [];

  const texto = data.journal.map((e) => normalize(e.text)).join(' ');

  return (Object.keys(VALUE_TERMS) as ValueKey[])
    .map((value) => {
      const count = VALUE_TERMS[value].reduce((total, term) => {
        const matches = texto.match(new RegExp(normalize(term), 'g'));
        return total + (matches ? matches.length : 0);
      }, 0);
      return { value, count };
    })
    .filter((v) => v.count > 0)
    .sort((a, b) => b.count - a.count);
}

/** Padrões só aparecem com base suficiente; abaixo disso seria adivinhação. */
const MIN_ENTRIES_FOR_PATTERNS = 5;

const WEEKDAY_LABEL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export function patterns(data: AppData): string[] {
  if (data.journal.length + data.moodHistory.length < MIN_ENTRIES_FOR_PATTERNS) return [];

  const found: string[] = [];

  // Dia da semana com mais humores difíceis.
  const dificil: Record<number, number> = {};
  data.moodHistory.forEach((m) => {
    if (m.mood === 'ansioso' || m.mood === 'triste' || m.mood === 'cansado') {
      const dia = new Date(`${m.date}T12:00:00`).getDay();
      dificil[dia] = (dificil[dia] ?? 0) + 1;
    }
  });
  const pior = Object.entries(dificil).sort((a, b) => b[1] - a[1])[0];
  if (pior && Number(pior[1]) >= 2) {
    found.push(`Seus dias mais pesados costumam cair na ${WEEKDAY_LABEL[Number(pior[0])]}.`);
  }

  // Humor predominante.
  const contagem: Partial<Record<Mood, number>> = {};
  data.moodHistory.forEach((m) => {
    contagem[m.mood] = (contagem[m.mood] ?? 0) + 1;
  });
  const dominante = (Object.entries(contagem) as [Mood, number][]).sort((a, b) => b[1] - a[1])[0];
  if (dominante && dominante[1] >= 3) {
    found.push(`"${dominante[0]}" foi como você se sentiu na maior parte dos dias registrados.`);
  }

  // Constância na escrita.
  if (data.journal.length >= 3) {
    found.push(`Você já escreveu ${data.journal.length} vezes por aqui. Isso é constância.`);
  }

  return found;
}

export function stats(data: AppData) {
  return [
    { value: daysCaredFor(data), label: 'dias cuidados' },
    { value: data.composts.length, label: 'compostagens' },
    { value: patterns(data).length, label: 'padrões' },
  ];
}

/** Humor dos últimos 7 dias, do mais antigo ao mais recente. */
export function moodWeek(data: AppData): { day: string; mood: Mood | null }[] {
  const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const porDia = new Map(data.moodHistory.map((m) => [m.date, m.mood]));

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { day: LETRAS[d.getDay()], mood: porDia.get(dayKey(d)) ?? null };
  });
}

/** Temas dos desabafos, por palavras-chave nos textos. */
const THEME_TERMS: Record<string, string[]> = {
  Trabalho: ['trabalh', 'chefe', 'reuni', 'emprego', 'escritóri', 'escritori'],
  Sono: ['sono', 'dormi', 'insôni', 'insoni', 'cansa', 'acordei'],
  Família: ['famíli', 'famili', 'mãe', 'mae', 'pai', 'irmã', 'irma', 'irmão', 'irmao'],
  Relacionamentos: ['namor', 'relacion', 'amor', 'parceir'],
  Saúde: ['saúde', 'saude', 'corpo', 'médic', 'medic', 'dor'],
};

export function ventThemes(data: AppData): { theme: string; count: number }[] {
  if (!data.settings.analysis) return [];

  const texto = data.journal.map((e) => normalize(e.text)).join(' ');

  return Object.entries(THEME_TERMS)
    .map(([theme, terms]) => {
      const count = terms.reduce((total, term) => {
        const matches = texto.match(new RegExp(normalize(term), 'g'));
        return total + (matches ? matches.length : 0);
      }, 0);
      return { theme, count };
    })
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function caringSince(data: AppData): string | null {
  if (!data.startedAt) return null;
  const d = new Date(`${data.startedAt}T12:00:00`);
  return MESES[d.getMonth()];
}

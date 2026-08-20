import type { SproutStage, ValueKey } from '../components';
import type { Mood } from '../theme';
import type { AppData, Plant } from './types';

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

/**
 * Dias de cuidado até uma planta amadurecer e ir para o jardim.
 *
 * Antes o broto parava no estágio 3, aos dez dias, e nunca mais mudava — dez
 * dias de crescimento numa assinatura de um ano. Agora ele amadurece, vira
 * planta guardada, e um novo começa. O crescimento deixa de ter teto.
 */
export const MATURIDADE = 21;

/**
 * Dias cuidados desde que a última planta amadureceu.
 *
 * `daysCaredFor` conta a vida toda e nunca diminui; o que define o broto de
 * agora é só o ciclo atual.
 */
export function diasNoCiclo(data: AppData): number {
  const jaColhidos = data.garden.reduce((n, p) => n + p.dias, 0);
  return Math.max(0, daysCaredFor(data) - jaColhidos);
}

/** Em que estágio o broto está agora, dentro do ciclo atual. */
export function sproutStage(data: AppData): SproutStage {
  const dias = diasNoCiclo(data);
  if (dias >= STAGE_AT[3]) return 3;
  if (dias >= STAGE_AT[2]) return 2;
  return 1;
}

/** Quantos dias faltam para o próximo estágio, ou para amadurecer. */
export function daysToNextStage(data: AppData): number | null {
  const dias = diasNoCiclo(data);
  if (dias < STAGE_AT[2]) return STAGE_AT[2] - dias;
  if (dias < STAGE_AT[3]) return STAGE_AT[3] - dias;
  if (dias < MATURIDADE) return MATURIDADE - dias;
  return null;
}

/** A planta atual completou o ciclo e está pronta para ir ao jardim. */
export const prontoParaColher = (data: AppData) => diasNoCiclo(data) >= MATURIDADE;

/**
 * Monta a planta que vai para o jardim, com o que marcou o período.
 *
 * Guarda valor e humor predominantes para o jardim ser memória de fases, e
 * não uma fileira de troféus iguais.
 */
export function colheita(data: AppData): Plant {
  const dias = diasNoCiclo(data);
  const desde = data.garden.length ? data.garden[data.garden.length - 1].maturedAt : null;
  const noPeriodo = desde
    ? data.moodHistory.filter((m) => m.date > desde)
    : data.moodHistory;

  const contagem: Partial<Record<Mood, number>> = {};
  noPeriodo.forEach((m) => {
    contagem[m.mood] = (contagem[m.mood] ?? 0) + 1;
  });
  const mood =
    (Object.entries(contagem) as [Mood, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    id: `${dayKey()}-${data.garden.length + 1}`,
    maturedAt: dayKey(),
    dias,
    valor: livedValues(data)[0]?.value ?? null,
    mood,
  };
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

// --- Reencontro com o próprio passado ------------------------------------

/** Marcos que valem uma lembrança, em dias. */
const MARCOS = [365, 180, 90, 30];

export type Lembranca = { id: string; texto: string; quando: string; diasAtras: number };

const COMO_SE_DIZ: Record<number, string> = {
  365: 'Há um ano',
  180: 'Há seis meses',
  90: 'Há três meses',
  30: 'Há um mês',
};

/**
 * Um registro antigo para reencontrar hoje.
 *
 * O app guardava tudo e nunca devolvia nada. Reler o que se escreveu num
 * momento difícil, já do outro lado dele, é a coisa mais forte que um diário
 * faz — e o app tinha o dado sem nunca usá-lo.
 *
 * A escolha é estável dentro do mesmo dia: reabrir o app não sorteia outra
 * lembrança, o que faria a tela parecer instável.
 */
export function lembranca(data: AppData, hoje = new Date()): Lembranca | null {
  if (!data.journal.length) return null;

  for (const marco of MARCOS) {
    const alvo = hoje.getTime() - marco * 24 * 60 * 60 * 1000;
    // Vale o registro mais próximo do marco, com até uma semana de folga.
    const janela = 7 * 24 * 60 * 60 * 1000;
    const candidatos = data.journal.filter((e) => Math.abs(e.createdAt - alvo) <= janela);
    if (!candidatos.length) continue;

    const escolhido = candidatos.reduce((a, b) =>
      Math.abs(a.createdAt - alvo) <= Math.abs(b.createdAt - alvo) ? a : b,
    );
    return {
      id: escolhido.id,
      texto: escolhido.text,
      quando: COMO_SE_DIZ[marco],
      diasAtras: marco,
    };
  }
  return null;
}

// --- Humor ao longo do tempo ---------------------------------------------

/**
 * Humor de um período qualquer, do mais antigo ao mais recente.
 *
 * `moodWeek` só mostrava 7 dias. Quem registra há meses não tinha como ver o
 * próprio arco — que é justamente o motivo de registrar todo dia.
 */
export function moodRange(data: AppData, dias: number): { date: string; mood: Mood | null }[] {
  const porDia = new Map(data.moodHistory.map((m) => [m.date, m.mood]));
  return Array.from({ length: dias }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (dias - 1 - i));
    const date = dayKey(d);
    return { date, mood: porDia.get(date) ?? null };
  });
}

// --- Pensamentos que voltam ----------------------------------------------

/** Palavras curtas demais não dizem nada sobre o assunto. */
const IRRELEVANTES = new Set([
  'que', 'nao', 'com', 'sou', 'vou', 'ser', 'tudo', 'mais', 'meu', 'minha', 'para',
  'por', 'uma', 'dos', 'das', 'ele', 'ela', 'isso', 'esse', 'essa', 'sempre', 'nunca',
]);

const assinatura = (texto: string) =>
  new Set(
    normalize(texto)
      .split(/[^a-z0-9]+/)
      .filter((p) => p.length >= 3 && !IRRELEVANTES.has(p)),
  );

/**
 * Quantas vezes um pensamento parecido já foi compostado.
 *
 * Compara palavras significativas em comum, no próprio aparelho. Não é busca
 * exata: "nunca vou dar conta" e "não vou dar conta disso" são a mesma dor
 * voltando, e é isso que vale reconhecer.
 */
export function vezesQueVoltou(data: AppData, texto: string): number {
  const alvo = assinatura(texto);
  if (alvo.size < 2) return 0;

  return data.composts.filter((c) => {
    const outra = assinatura(c.thought);
    if (!outra.size) return false;
    let comuns = 0;
    alvo.forEach((p) => {
      if (outra.has(p)) comuns += 1;
    });
    // Metade das palavras significativas em comum já é o mesmo assunto.
    return comuns / Math.min(alvo.size, outra.size) >= 0.5;
  }).length;
}

// --- Práticas feitas ------------------------------------------------------

/** Quantas vezes cada prática foi concluída. */
export function vezesPorPratica(data: AppData): Record<string, number> {
  const conta: Record<string, number> = {};
  data.practicesDone.forEach((p) => {
    const chave = `${p.topic}/${p.practice}`;
    conta[chave] = (conta[chave] ?? 0) + 1;
  });
  return conta;
}

/** A prática concluída mais recentemente, para oferecer retomar. */
export function ultimaPratica(data: AppData) {
  if (!data.practicesDone.length) return null;
  return data.practicesDone.reduce((a, b) => (a.at >= b.at ? a : b));
}

/**
 * As práticas que a pessoa mais repete.
 *
 * O app não pergunta quais são as favoritas: ele repara. Marcar favorito com
 * uma estrelinha é mais um pedido de trabalho para quem já está cansado — e o
 * que se repete diz a mesma coisa, sem precisar perguntar.
 */
export function praticasMaisFeitas(data: AppData, quantas = 3) {
  const conta = vezesPorPratica(data);
  return Object.entries(conta)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, quantas)
    .map(([chave, vezes]) => {
      const [topic, practice] = chave.split('/');
      return { topic, practice, vezes };
    });
}

import type { SproutStage, ValueKey } from '../components';
import type { Mood } from '../theme';
import { TENTOU_TERAPIA } from '../data/onboarding';
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

/**
 * Dias distintos em que a pessoa apareceu — humor, diário, composta ou prática.
 *
 * **Nunca desce.** O piso guardado em `diasCuidadosMax` cobre o caso de alguém
 * apagar o único registro de um dia: sem ele a conta caía e o broto podia
 * voltar de estágio, punindo um ato legítimo. Ver o campo em `types.ts`.
 *
 * As práticas entram aqui desde 25/08/2026. Antes, fazer uma prática contava
 * como aparecer (em `diasSemAparecer`) mas não como cuidar — quem usasse o app
 * só pelas práticas nunca via o broto crescer, e nada justificava a diferença.
 */
export function daysCaredFor(data: AppData): number {
  return Math.max(diasComRegistro(data), data.diasCuidadosMax ?? 0);
}

/**
 * A contagem crua, sem o piso — o que existe guardado agora.
 *
 * Só quem mantém o piso usa isto: é comparando os dois que se sabe se há um
 * recorde novo para gravar.
 */
export function diasComRegistro(data: AppData): number {
  const dias = new Set<string>();
  data.moodHistory.forEach((m) => dias.add(m.date));
  data.journal.forEach((e) => dias.add(dayKey(e.createdAt)));
  data.composts.forEach((c) => dias.add(dayKey(c.createdAt)));
  data.practicesDone.forEach((p) => dias.add(dayKey(p.at)));
  return dias.size;
}

/**
 * Há quantos dias a pessoa não aparece.
 *
 * `null` para quem nunca registrou nada — ali não houve ausência, houve
 * começo, e são coisas diferentes.
 *
 * Este é o número mais importante do app para quem quase desistiu. Voltar
 * depois de nove dias era idêntico a voltar amanhã: o app não dizia nada, e o
 * silêncio no reencontro é exatamente onde a pessoa conclui que falhou e
 * desinstala. O app já é generoso por dentro — a contagem só soma os dias em
 * que ela apareceu, e o broto nunca regride nem morre de abandono. Faltava
 * contar isso a ela.
 */
export function diasSemAparecer(data: AppData, hoje = new Date()): number | null {
  const marcos: number[] = [];
  data.journal.forEach((e) => marcos.push(e.createdAt));
  data.composts.forEach((c) => marcos.push(c.createdAt));
  data.practicesDone.forEach((p) => marcos.push(p.at));
  // O humor é guardado por dia, não por instante; meio-dia evita que fuso
  // horário jogue a data para a véspera.
  data.moodHistory.forEach((m) => {
    const t = new Date(`${m.date}T12:00:00`).getTime();
    if (!Number.isNaN(t)) marcos.push(t);
  });

  if (!marcos.length) return null;

  const ultimo = new Date(Math.max(...marcos));
  const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((inicioDoDia(hoje) - inicioDoDia(ultimo)) / 86400000);

  return Math.max(0, dias);
}

/**
 * A partir de quantos dias sumidos vale dizer alguma coisa.
 *
 * Dois dias é vida normal — comentar seria cobrança disfarçada de acolhimento.
 */
export const AUSENCIA_LONGA = 3;

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

  /*
    O valor também precisa ser só do período.

    Ele saía de `livedValues`, que lê o diário **inteiro**. Da segunda planta em
    diante isso devolvia quase sempre o mesmo valor da primeira: quem escreveu
    muito sobre conexão no começo carrega esse peso para sempre, e o jardim
    virava a fileira de troféus iguais que este arquivo diz querer evitar.
  */
  const textosDoPeriodo = data.journal
    .filter((e) => (desde ? dayKey(e.createdAt) > desde : true))
    .map((e) => e.text);
  const valorDoPeriodo = data.settings.analysis ? (valoresEm(textosDoPeriodo)[0]?.value ?? null) : null;

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
    valor: valorDoPeriodo,
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

/** Os valores que aparecem num conjunto de textos. */
function valoresEm(textos: string[]): { value: ValueKey; count: number }[] {
  const texto = textos.map(normalize).join(' ');

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

export function livedValues(data: AppData): { value: ValueKey; count: number }[] {
  // O interruptor "Análise dos meus registros" governa toda leitura de texto.
  if (!data.settings.analysis) return [];
  return valoresEm(data.journal.map((e) => e.text));
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

/**
 * Os três números da Home.
 *
 * O rótulo concorda com o número: "1 dia cuidado", não "1 dias cuidados". Com
 * um só registro — que é o estado de todo mundo no primeiro dia — os três
 * rótulos ficavam no plural, e um app que erra o português na primeira tela
 * perde confiança antes de ganhar.
 */
export function stats(data: AppData) {
  const dias = daysCaredFor(data);
  const compostas = data.composts.length;
  const padroes = patterns(data).length;

  return [
    { value: dias, label: dias === 1 ? 'dia cuidado' : 'dias cuidados' },
    { value: compostas, label: compostas === 1 ? 'compostagem' : 'compostagens' },
    { value: padroes, label: padroes === 1 ? 'padrão' : 'padrões' },
  ];
}

/**
 * Se a pessoa disse, no onboarding, que faz terapia.
 *
 * Ela responde isso no passo "o que você tem feito com isso", e até agora essa
 * resposta não era usada em lugar nenhum: alimentava o espelho seguinte e
 * ficava parada em Meus dados para sempre. O resumo era anunciado como "para
 * a sua terapia" com o mesmo texto para quem faz terapia e para quem marcou
 * "nunca tentei nada específico" — o app sabia e não usava.
 *
 * O resumo **continua existindo para todo mundo**, e de propósito: numa análise
 * do Daylio, o que uma usuária mais destacou foi levar um PDF do diário para a
 * consulta. Quem nunca foi é justamente quem pode chegar na primeira com algo
 * na mão. O que muda é o texto, que para de pressupor um terapeuta.
 */
export function fazTerapia(data: AppData): boolean {
  return data.profile.tentou.includes(TENTOU_TERAPIA);
}

/**
 * O nome do broto, ou vazio quando ela não deu nenhum.
 *
 * Quem chama decide o que fazer com o vazio: na notificação vira "Brotinho",
 * no jardim some a linha inteira. Devolver um padrão aqui esconderia essa
 * escolha de quem lê o código.
 */
export function nomeDoBroto(data: AppData): string {
  return data.profile.nomeDoBroto.trim();
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
/**
 * Duas escritas são a mesma dor? Metade das palavras significativas em comum
 * já basta: "nunca vou dar conta" e "não vou dar conta disso" são a mesma coisa
 * voltando.
 */
function mesmaDor(alvo: Set<string>, texto: string): boolean {
  const outra = assinatura(texto);
  if (!outra.size) return false;
  let comuns = 0;
  alvo.forEach((p) => {
    if (outra.has(p)) comuns += 1;
  });
  return comuns / Math.min(alvo.size, outra.size) >= 0.5;
}

export function vezesQueVoltou(data: AppData, texto: string): number {
  /*
    Obedece ao interruptor, como toda leitura de texto.

    Ficava de fora: o interruptor promete "permite que o broto identifique
    padrões nos seus textos", e a Composta continuava dizendo "esta é a terceira
    vez que isto volta" com ele desligado — que é, literalmente, um padrão
    identificado nos textos da pessoa.

    `lembranca` continua fora desta regra de propósito: mostrar um registro
    antigo é o diário devolvendo o que a pessoa escreveu, escolhido por data.
    Não há leitura de conteúdo ali, e desligar a análise não deveria trancar o
    próprio diário.
  */
  if (!data.settings.analysis) return 0;

  const alvo = assinatura(texto);
  if (alvo.size < 2) return 0;

  return data.composts.filter((c) => mesmaDor(alvo, c.thought)).length;
}

// --- Pensamentos que não voltaram ----------------------------------------

export type Atravessado = { texto: string; quando: string; diasAtras: number };

/** Antes disso é cedo demais para dizer que passou. */
const DIAS_PARA_ATRAVESSAR = 30;

const HA_QUANTO_TEMPO = (dias: number): string => {
  const meses = Math.round(dias / 30);
  if (meses >= 12) return 'Há cerca de um ano';
  if (meses >= 6) return 'Há uns seis meses';
  if (meses >= 2) return `Há uns ${meses} meses`;
  return 'Há cerca de um mês';
};

/**
 * Um pensamento que a pessoa compostou e que **não voltou desde então**.
 *
 * É a promessa da Composta sendo verificada com o dado da própria pessoa. O app
 * já sabia dizer "esta é a terceira vez que isto volta" — o contrário, que é a
 * notícia boa, ele tinha como saber e nunca dizia.
 *
 * Três cuidados que não são estilo:
 *
 * 1. **Só afirma o que dá para verificar.** Vale se o mesmo assunto não
 *    reaparece em nenhuma composta nem em nenhum registro do diário posteriores.
 *    Se voltou uma vez que seja, este pensamento não entra.
 * 2. **Nunca no sentido contrário.** O app não diz "isto voltou mais vezes" nem
 *    "você piorou". Quando não há notícia boa verificável, ele fica calado.
 * 3. **Respeita o interruptor de análise**, como toda leitura de texto no app.
 *
 * A escolha é estável dentro do mesmo dia, pela mesma razão da lembrança:
 * reabrir o app não pode sortear outra coisa.
 */
export function atravessou(data: AppData, hoje = new Date()): Atravessado | null {
  if (!data.settings.analysis) return null;

  const limite = hoje.getTime() - DIAS_PARA_ATRAVESSAR * 24 * 60 * 60 * 1000;
  // Do mais antigo para o mais novo: "há seis meses" é prova mais forte de
  // travessia do que "há um mês".
  const antigos = data.composts
    .filter((c) => c.createdAt <= limite)
    .sort((a, b) => a.createdAt - b.createdAt);

  for (const c of antigos) {
    const alvo = assinatura(c.thought);
    if (alvo.size < 2) continue;

    const voltouNaComposta = data.composts.some(
      (o) => o.createdAt > c.createdAt && mesmaDor(alvo, o.thought),
    );
    if (voltouNaComposta) continue;

    const voltouNoDiario = data.journal.some(
      (e) => e.createdAt > c.createdAt && mesmaDor(alvo, e.text),
    );
    if (voltouNoDiario) continue;

    const dias = Math.round((hoje.getTime() - c.createdAt) / (24 * 60 * 60 * 1000));
    return { texto: c.thought, quando: HA_QUANTO_TEMPO(dias), diasAtras: dias };
  }

  return null;
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

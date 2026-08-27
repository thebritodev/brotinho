/**
 * O repertório do lembrete diário, e o plano de quando cada um aparece.
 *
 * Existe porque o lembrete anterior **não conseguia** variar. Ele era um
 * gatilho `DAILY` do sistema: o texto era decidido uma vez, na hora de agendar,
 * e o sistema repetia aquele mesmo texto todo dia. Quem abria o app com
 * frequência via o texto mudar; quem tinha sumido — justamente quem o lembrete
 * existe para acolher — recebia a frase idêntica, dia após dia, até desligar a
 * notificação. E quem desliga raramente volta a ligar.
 *
 * Aqui o app monta uma fila de dias, cada um com o seu texto, e o
 * `notifications.ts` agenda um por um.
 *
 * ---
 *
 * **As três regras do texto não mudaram, e são correção, não estilo:**
 *
 * 1. **Nada do que a pessoa escreveu.** Notificação aparece na tela bloqueada,
 *    à vista de quem estiver por perto. Um app cuja promessa é que o diário não
 *    sai do aparelho não pode publicá-lo no aviso. Aqui isso é estrutural: todo
 *    texto é constante deste arquivo.
 * 2. **Nenhum número.** O texto é escolhido no agendamento e pode aparecer dias
 *    depois. "Faz 3 dias" nasceria certo e estaria mentindo na manhã seguinte.
 * 3. **Nunca cobrar.** Quem voltou de uma semana ruim não precisa de um app
 *    dizendo que falhou. As faixas de ausência só acolhem.
 */

/** Onde a pessoa está em relação ao app, no dia em que o aviso vai aparecer. */
type Faixa = 'presente' | 'curta' | 'media' | 'longa';

function faixaDe(ausencia: number): Faixa {
  if (ausencia <= 1) return 'presente';
  if (ausencia <= 6) return 'curta';
  if (ausencia <= 13) return 'media';
  return 'longa';
}

// --- Quem está por perto: varia por hora do dia ---------------------------

const MANHA = [
  'Como você está começando o dia?',
  'O que está pesando antes de o dia começar?',
  'Como você acordou hoje?',
  'O que você quer levar para hoje?',
  'Um minuto para você, antes de todo o resto.',
  'Bom dia. Dá para parar um pouco?',
  'O que você faria hoje se ninguém cobrasse nada?',
];

const TARDE = [
  'Uma pausa no meio do dia?',
  'Como está indo até aqui?',
  'O que apertou hoje?',
  'Respira. Depois volta.',
  'O dia já mudou desde que você acordou?',
  'Se der, para um minuto.',
  'Nada urgente. Só um respiro.',
];

const NOITE = [
  'Como foi seu dia?',
  'O que ficou dando voltas na sua cabeça hoje?',
  'Que tal deixar o dia aqui antes de dormir?',
  'Alguma coisa boa aconteceu hoje. Nem que seja pequena.',
  'Descarrega aqui antes de deitar.',
  'O que você quer deixar no dia de hoje?',
  'Como o seu corpo está agora?',
];

const MADRUGADA = [
  'Se estiver difícil dormir, escrever ajuda a esvaziar a cabeça.',
  'Cabeça acelerada? Põe para fora.',
  'Ninguém precisa ler. Só escrever já solta.',
  'Se o pensamento não para, ele cansa mais rápido no papel.',
  'Insônia costuma vir acompanhada. Quer contar?',
];

/**
 * Alguns dias da semana pesam de um jeito próprio, e um lembrete que sabe disso
 * soa como alguém que presta atenção — não como um alarme.
 *
 * Entram no sorteio só no dia certo, e só de tarde ou de noite: de manhã cedo
 * ninguém quer ser lembrado de que é segunda.
 */
const POR_DIA_DA_SEMANA: Record<number, string[]> = {
  // 0 = domingo
  0: [
    'Domingo à noite pesa. Quer falar sobre isso?',
    'A semana começa amanhã, mas ainda não começou.',
  ],
  1: ['Segunda já passou. Como foi?', 'Primeiro dia vencido.'],
  3: ['Metade da semana. Como você está segurando?'],
  5: ['Sexta. O que você quer deixar nesta semana?', 'A semana acabou. E você?'],
  6: ['Sábado também vale parar um pouco.'],
};

/**
 * Para quem já vem cuidando há um tempo. Sem número e sem elogio inflado — só
 * o reconhecimento de que existe história ali.
 */
const VETERANO = [
  'Seu broto já tem história. Continua.',
  'Você tem cuidado disso faz um tempo.',
  'Tem bastante coisa sua guardada aqui.',
];

/** A partir de quantos dias cuidados as frases de veterano entram no sorteio. */
const DIAS_PARA_VETERANO = 21;

// --- Quem sumiu: nunca cobra, nunca conta dias ----------------------------

const AUSENCIA: Record<Exclude<Faixa, 'presente'>, string[]> = {
  curta: [
    'Sem pressa. Quando quiser, ele está aqui.',
    'Seu broto não regride. Ele só espera.',
    'Se hoje der, dá. Se não der, tudo bem.',
    'Nada se perdeu por aqui.',
    'Uma linha já conta.',
    'Você pode voltar do jeito que estiver.',
  ],
  media: [
    'Seu broto continua aqui, do mesmo jeito que você deixou.',
    'Nada foi apagado. Está tudo esperando você.',
    'Voltar não recomeça nada. É só continuar.',
    'Quando quiser, é só abrir.',
    'Ele não tem pressa nenhuma.',
  ],
  longa: [
    'Seu jardim continua seu.',
    'Sem cobrança nenhuma: só um oi.',
    'Se um dia fizer sentido de novo, ele está aqui.',
    'Nada aqui expira.',
    'A porta continua aberta.',
  ],
};

// --- O plano --------------------------------------------------------------

export type Lembrete = { quando: Date; texto: string };

/**
 * Quanto tempo o aviso espera, conforme a ausência cresce.
 *
 * Diário nas duas primeiras semanas; depois semanal; depois quinzenal. Nunca
 * para. Num app de saúde mental, sumir de vez pode ser lido como abandono — e
 * insistir todo dia, como cobrança. Espaçar não é nenhum dos dois.
 */
function deveAvisar(ausenciaProjetada: number): boolean {
  if (ausenciaProjetada <= 14) return true;
  if (ausenciaProjetada <= 35) return ausenciaProjetada % 7 === 0;
  return ausenciaProjetada % 15 === 0;
}

/** As frases candidatas para um dia específico. */
function repertorioDoDia(faixa: Faixa, hora: number, diaDaSemana: number, diasCuidados: number): string[] {
  if (faixa !== 'presente') return AUSENCIA[faixa];

  const daHora =
    hora >= 5 && hora < 12 ? MANHA : hora >= 12 && hora < 18 ? TARDE : hora >= 18 ? NOITE : MADRUGADA;

  const extras: string[] = [];
  // O tempero do dia da semana só de tarde e de noite — ver POR_DIA_DA_SEMANA.
  if (hora >= 12) extras.push(...(POR_DIA_DA_SEMANA[diaDaSemana] ?? []));
  if (diasCuidados >= DIAS_PARA_VETERANO) extras.push(...VETERANO);

  return daHora.concat(extras);
}

export type PlanoDeLembretes = {
  /** Agora. Existe como parâmetro para o teste não depender do relógio. */
  agora: Date;
  hora: number;
  minuto: number;
  /** Dias sem aparecer hoje; `null` para quem nunca registrou nada. */
  ausenciaHoje: number | null;
  /** Dias em que a pessoa apareceu — `daysCaredFor`. */
  diasCuidados: number;
  /** Quantos avisos agendar de uma vez. */
  quantidade: number;
};

/**
 * Monta a fila de avisos: um por dia enquanto a pessoa está por perto, cada vez
 * mais espaçados conforme a ausência cresce.
 *
 * Nenhuma frase se repete enquanto houver outra disponível na mesma faixa, então
 * quem abre o app todo dia não vê o mesmo texto duas vezes na mesma semana.
 */
export function planejarLembretes({
  agora,
  hora,
  minuto,
  ausenciaHoje,
  diasCuidados,
  quantidade,
}: PlanoDeLembretes): Lembrete[] {
  const base = ausenciaHoje ?? 0;
  const plano: Lembrete[] = [];

  const usadas = new Set<string>();
  // Um cursor por repertório, para o sorteio andar em vez de sempre começar do
  // mesmo lugar. A semente vem do dia do mês: dois agendamentos feitos em dias
  // diferentes não abrem com a mesma frase.
  const cursores = new Map<string, number>();
  const semente = agora.getDate();

  const escolher = (candidatas: string[], chave: string): string => {
    const inicio = cursores.get(chave) ?? semente % candidatas.length;
    for (let i = 0; i < candidatas.length; i += 1) {
      const escolhida = candidatas[(inicio + i) % candidatas.length];
      if (usadas.has(escolhida)) continue;
      cursores.set(chave, (inicio + i + 1) % candidatas.length);
      usadas.add(escolhida);
      return escolhida;
    }
    // Esgotou o repertório da faixa: recomeça, que é melhor do que não avisar.
    usadas.clear();
    const escolhida = candidatas[inicio % candidatas.length];
    usadas.add(escolhida);
    return escolhida;
  };

  // Hoje ainda conta se o horário não passou.
  const jaPassouHoje =
    agora.getHours() > hora || (agora.getHours() === hora && agora.getMinutes() >= minuto);

  for (let offset = jaPassouHoje ? 1 : 0; plano.length < quantidade && offset <= 400; offset += 1) {
    const projetada = base + offset;
    if (!deveAvisar(projetada)) continue;

    const quando = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + offset, hora, minuto, 0, 0);
    if (quando.getTime() <= agora.getTime()) continue;

    const faixa = faixaDe(projetada);
    const candidatas = repertorioDoDia(faixa, hora, quando.getDay(), diasCuidados);
    plano.push({ quando, texto: escolher(candidatas, `${faixa}-${quando.getDay()}`) });
  }

  return plano;
}

// --- O resumo da semana ---------------------------------------------------

/**
 * O convite de domingo de manhã.
 *
 * Tinha o mesmo defeito do lembrete diário, e pior: era um gatilho `WEEKLY` com
 * **uma** frase, então todo domingo da vida da pessoa trazia exatamente o mesmo
 * texto. Um convite que nunca muda deixa de ser convite e vira mobília.
 */
const RESUMO = [
  'Que tal olhar como foram seus últimos sete dias?',
  'A semana passou. Quer ver o que ficou dela?',
  'Sete dias de você, guardados aqui.',
  'Domingo de manhã é bom para olhar para trás sem pressa.',
  'O que se repetiu na sua semana?',
  'Uma olhada na semana, antes de a próxima começar.',
  'Sua semana está aqui, esperando ser lida.',
  'Nem toda semana tem conclusão. Mas tem registro.',
  'O que você atravessou nesses últimos dias?',
  'Antes de a semana virar, um olhar para a que passou.',
];

/**
 * Monta a fila de domingos, um texto por semana, sem repetir enquanto houver
 * frase nova. Mesma ideia da fila diária, e pelo mesmo motivo.
 */
export function planejarResumos({
  agora,
  diaDaSemana,
  hora,
  quantidade,
}: {
  agora: Date;
  /** 0 = domingo. */
  diaDaSemana: number;
  hora: number;
  quantidade: number;
}): Lembrete[] {
  const plano: Lembrete[] = [];

  // Quantos dias faltam até o próximo dia da semana desejado.
  let ate = (diaDaSemana - agora.getDay() + 7) % 7;
  const primeiro = new Date(
    agora.getFullYear(), agora.getMonth(), agora.getDate() + ate, hora, 0, 0, 0,
  );
  // Já passou da hora hoje: o próximo é só daqui a uma semana.
  if (primeiro.getTime() <= agora.getTime()) ate += 7;

  const inicio = agora.getDate() % RESUMO.length;
  for (let i = 0; i < quantidade; i += 1) {
    plano.push({
      quando: new Date(
        agora.getFullYear(), agora.getMonth(), agora.getDate() + ate + i * 7, hora, 0, 0, 0,
      ),
      texto: RESUMO[(inicio + i) % RESUMO.length],
    });
  }

  return plano;
}

/** Só para o teste conferir que nenhuma frase quebra as regras. */
export const TODAS_AS_FRASES: string[] = [
  ...MANHA,
  ...TARDE,
  ...NOITE,
  ...MADRUGADA,
  ...VETERANO,
  ...Object.values(POR_DIA_DA_SEMANA).flat(),
  ...Object.values(AUSENCIA).flat(),
  ...RESUMO,
];

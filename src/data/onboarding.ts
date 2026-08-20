/** Conteúdo do fluxo de onboarding — copy e opções em um só lugar. */

export const CHECKIN = [
  'As coisas andam pesadas',
  'Tenho dias bons e dias difíceis',
  'Por fora está tudo bem, por dentro nem tanto',
  'Estou bem, mas quero me conhecer melhor',
];

export const VALORES = [
  'Criatividade',
  'Conexão',
  'Calma',
  'Superação',
  'Gratidão',
  'Autoconhecimento',
  'Disciplina',
  'Coragem',
];

export const TENTOU = [
  'Guardo pra mim mesmo',
  'Converso com alguém próximo',
  'Faço terapia',
  'Já tentei meditação ou outros apps',
  'Nunca tentei nada específico',
];

export const IDADE = ['Menos de 18', '18–24', '25–34', '35 ou mais', 'Prefiro não responder'];

export const GENERO = ['Feminino', 'Masculino', 'Não-binário', 'Prefiro não responder'];

export const CANAL = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Indicação de amigo',
  'Busca na loja de apps',
  'Outro',
];

/** Passos de minuto na roda de horário. */
export const MIN_STEP = 5;

/**
 * Total de telas (0..10); a última é o paywall e não entra na contagem.
 *
 * Faixa etária, gênero e origem da instalação saíram daqui: eram três telas
 * de atrito antes do paywall cujas respostas o app guardava e nunca usava
 * para nada. Continuam editáveis em Configurações › Meus dados.
 *
 * O que entrou no lugar não é pergunta: é entrega. Experimentar a Composta,
 * entender a técnica, ver o que tem dentro e ler o próprio plano.
 */
export const TOTAL = 14;
export const STEPS = TOTAL - 1;

export const MAX_VALUES = 3;

export type PlanKey = 'semanal' | 'mensal' | 'anual' | 'vitalicio';

/**
 * Identificador de cada plano nas lojas. Precisa bater exatamente com o que
 * foi cadastrado na App Store, no Google Play e no RevenueCat — nos três.
 *
 * Na Apple um identificador nunca pode ser reaproveitado, nem depois de
 * apagado, então mudar qualquer um destes exige criar um produto novo.
 */
export const PRODUTO_DO_PLANO: Record<PlanKey, string> = {
  semanal: 'brotinho_semanal',
  mensal: 'brotinho_mensal',
  anual: 'brotinho_anual',
  vitalicio: 'brotinho_vitalicio',
};

export const PLANS: Record<
  PlanKey,
  { name: string; price: string; note: string; cta: string; fine: string }
> = {
  semanal: {
    name: 'Semanal',
    price: 'R$ 9,90',
    note: 'por semana',
    cta: 'Assinar por R$ 9,90/semana',
    fine: 'Cobrança semanal de R$ 9,90. Cancele quando quiser.',
  },
  mensal: {
    name: 'Mensal',
    price: 'R$ 29,90',
    note: 'por mês',
    cta: 'Assinar por R$ 29,90/mês',
    fine: 'Cobrança mensal de R$ 29,90. Cancele quando quiser.',
  },
  anual: {
    name: 'Anual',
    price: 'R$ 179,40',
    note: 'R$ 14,95 por mês · economize 50%',
    cta: 'Assinar por R$ 14,95/mês',
    fine: 'Cobrança única de R$ 179,40 por 12 meses. Cancele quando quiser.',
  },
  vitalicio: {
    name: 'Vitalício',
    price: 'R$ 399,90',
    note: 'pagamento único, para sempre',
    cta: 'Pagar R$ 399,90 uma vez',
    fine: 'Pagamento único de R$ 399,90. Acesso permanente.',
  },
};

export const pad = (n: number) => String(n).padStart(2, '0');

/** "21:00" vira "21h"; "21:30" vira "21h30". Ninguém fala "vinte e uma h zero zero". */
export const horaFalada = (hhmm: string) => {
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${h}h` : `${h}h${m}`;
};

// --- Respostas antigas ----------------------------------------------------

/**
 * Rótulos que existiam antes da reescrita das perguntas.
 *
 * Sem isto, quem respondeu "Terapia" veria a opção sumir da seleção em Meus
 * dados — o texto guardado no aparelho não bate mais com nenhuma opção da
 * lista, e o app teria mostrado o campo como se estivesse vazio.
 */
const RENOMEADOS: Record<string, string> = {
  Terapia: 'Faço terapia',
  'Meditação/apps': 'Já tentei meditação ou outros apps',
  'Conversar com amigos/família': 'Converso com alguém próximo',
  'Guardar pra mim mesmo': 'Guardo pra mim mesmo',
  'Estou bem, no geral, mas quero me conhecer melhor': 'Estou bem, mas quero me conhecer melhor',
};

export const renomear = (valor: string) => RENOMEADOS[valor] ?? valor;

// --- Telas de espelho -----------------------------------------------------

/**
 * O que o app devolve à pessoa depois que ela responde.
 *
 * A regra que segui ao escrever: nomear o que costuma estar por trás e o que
 * custa deixar quieto, sem diagnosticar ninguém e sem prometer cura. Nada aqui
 * afirma o que a pessoa TEM — só descreve o que ela mesma acabou de dizer.
 */
export type Espelho = { kicker: string; title: string; body: string; mood: MirrorMood };
export type MirrorMood = 'leve' | 'ansioso' | 'triste' | 'cansado' | 'neutro';

export const ESPELHO_CHECKIN: Record<string, Espelho> = {
  'As coisas andam pesadas': {
    kicker: 'Você disse que as coisas andam pesadas',
    title: 'Peso que não se nomeia não fica menor. Fica mais difícil de enxergar.',
    body: 'Quando o incômodo não vira palavra, ele não some — ele se espalha. Vira sono ruim, pavio curto, cansaço que dormir não resolve. Colocar em palavras não conserta o que aconteceu, mas devolve o contorno da coisa: dá para olhar para ela em vez de carregá-la sem saber o quê.',
    mood: 'cansado',
  },
  'Tenho dias bons e dias difíceis': {
    kicker: 'Você disse que tem dias bons e dias difíceis',
    title: 'Nos dias difíceis, a gente esquece que os bons existiram.',
    body: 'É assim que a cabeça funciona: no meio de um dia ruim, ele parece o único que já houve. Sem registro nenhum, você fica dependendo da memória justo quando ela está mais tendenciosa. Quem anota alguns dias começa a ver o desenho — e a perceber que a fase tem forma, começo e fim.',
    mood: 'neutro',
  },
  'Por fora está tudo bem, por dentro nem tanto': {
    kicker: 'Você disse que por fora está tudo bem',
    title: 'Segurar a aparência o dia inteiro cansa mais do que parece.',
    body: 'Funcionar bem por fora enquanto por dentro aperta é um trabalho invisível — e ninguém agradece porque ninguém vê. O problema não é fingir; é não ter nenhum lugar onde não precise. Aqui não tem plateia: o que você escrever não sai deste aparelho, nem para nós.',
    mood: 'ansioso',
  },
  'Estou bem, mas quero me conhecer melhor': {
    kicker: 'Você disse que quer se conhecer melhor',
    title: 'O melhor momento para criar o hábito é justamente quando não é urgência.',
    body: 'Quase todo mundo procura ajuda quando já está no limite — e é o pior momento para começar qualquer coisa nova. Construir o hábito agora, sem pressa, é o que faz ele estar de pé quando vier uma semana ruim. Nem todo cuidado nasce de um problema.',
    mood: 'leve',
  },
};

/**
 * A pessoa pode marcar várias. Esta ordem decide qual resposta o espelho
 * comenta — da que mais pede uma palavra para a que menos pede.
 */
export const PRIORIDADE_TENTOU = [
  'Guardo pra mim mesmo',
  'Nunca tentei nada específico',
  'Já tentei meditação ou outros apps',
  'Converso com alguém próximo',
  'Faço terapia',
];

export const ESPELHO_TENTOU: Record<string, Espelho> = {
  'Guardo pra mim mesmo': {
    kicker: 'Você disse que guarda pra si',
    title: 'Guardar tudo dá um alívio curto e uma conta longa.',
    body: 'Não contar evita a conversa difícil hoje. Só que o pensamento não fica parado esperando: ele volta na hora de dormir, no banho, no meio de outra coisa. Dizer em voz alta é o que tira ele do laço — mesmo sem ninguém para ouvir.',
    mood: 'triste',
  },
  'Nunca tentei nada específico': {
    kicker: 'Você disse que nunca tentou nada específico',
    title: 'Não ter tentado não é atraso. É que ninguém ensina isso.',
    body: 'Cuidar da cabeça não vem com manual, e quase tudo que existe parece grande demais para começar: marcar terapia, mudar a rotina, virar outra pessoa. O que funciona é o contrário — algo pequeno o bastante para caber num dia ruim.',
    mood: 'neutro',
  },
  'Já tentei meditação ou outros apps': {
    kicker: 'Você disse que já tentou meditação ou outros apps',
    title: 'Se não pegou, o problema provavelmente não foi você.',
    body: 'A maioria desses apps pede silêncio, concentração e vinte minutos parados — exatamente o que falta em quem está sobrecarregado. Aqui o caminho é outro: falar, não silenciar. Escrever mal e torto vale. Trinta segundos valem.',
    mood: 'cansado',
  },
  'Converso com alguém próximo': {
    kicker: 'Você disse que conversa com alguém próximo',
    title: 'Ter com quem falar é muita coisa. E ainda assim sobra o que não dá pra dizer.',
    body: 'Sempre tem a parte que a gente segura para não preocupar, para não repetir pela quinta vez, para não pesar. Essa parte precisa ir a algum lugar também. Aqui não tem ninguém do outro lado para se cansar de você.',
    mood: 'leve',
  },
  'Faço terapia': {
    kicker: 'Você disse que faz terapia',
    title: 'O Brotinho não substitui isso. Ele cuida do intervalo entre as sessões.',
    body: 'O que acontece na terça raramente chega inteiro na sessão de sexta. Registrar no dia guarda o que sua memória ia editar — e o app monta um resumo que você pode levar. Continue a terapia: nada aqui faz o trabalho dela.',
    mood: 'leve',
  },
};

/** Escolhe qual resposta do "já tentou" merece o espelho. */
export function espelhoDoTentou(marcados: string[]): Espelho | null {
  const escolhido = PRIORIDADE_TENTOU.find((op) => marcados.includes(op));
  return escolhido ? ESPELHO_TENTOU[escolhido] : null;
}

// --- Conteúdo das telas de entrega ---------------------------------------

/**
 * "Por que isso funciona" — a técnica por trás da Composta.
 *
 * Existia só na tela Sobre, que ninguém abre antes de assinar. Quem está
 * prestes a pagar merece saber que há método, e qual é o nome dele.
 */
export const METODO = {
  title: 'Isso que você acabou de fazer tem nome',
  /** Para quem pulou o experimento: afirmar que ela fez seria falso. */
  titleSemExperimento: 'Por que repetir uma frase funciona',
  passos: [
    {
      icon: 'sparkle' as const,
      title: 'Repetir esvazia',
      text: 'Diga qualquer palavra trinta vezes seguidas e ela vira som. O cérebro para de buscar o significado — é um efeito conhecido, e vale também para a frase que te persegue.',
    },
    {
      icon: 'leaf' as const,
      title: 'O objetivo não é parar de pensar',
      text: 'Tentar não pensar em algo dá mais força a esse algo. A saída é o contrário: chegar perto, olhar de frente, até a frase deixar de mandar em você.',
    },
    {
      icon: 'heart' as const,
      title: 'Chama-se defusão cognitiva',
      text: 'Vem da ACT, uma terapia com décadas de pesquisa. O Brotinho não inventou isso — só transformou numa coisa que cabe em trinta segundos do seu dia.',
    },
  ],
};

/** "O que você vai encontrar dentro" — as quatro áreas do app. */
export const AREAS = [
  {
    icon: 'book' as const,
    title: 'Diário',
    text: 'Escreva ou fale. A transcrição acontece no próprio aparelho.',
  },
  {
    icon: 'mic' as const,
    title: 'Composta',
    text: 'O que você acabou de experimentar, agora em voz alta.',
  },
  {
    icon: 'droplet' as const,
    title: 'Práticas guiadas',
    text: 'Quinze exercícios para ansiedade, insônia, autoestima e mais.',
  },
  {
    icon: 'star' as const,
    title: 'Resumo para a terapia',
    text: 'Suas semanas em PDF, para levar à sessão sem depender da memória.',
  },
];

// --- Plano pessoal --------------------------------------------------------

export type ItemDoPlano = { icon: 'bell' | 'lock' | 'leaf' | 'moon' | 'star'; text: string };

type RespostasDoPlano = {
  checkin: string | null;
  valores: string[];
  sleepTime: string;
  tentou: string[];
  reminder: string;
};

/** Considera madrugada a partir da meia-noite até as 5h. */
const dormeTarde = (hhmm: string) => {
  const h = Number(hhmm.split(':')[0]);
  return h >= 0 && h < 5;
};

/**
 * Transforma o que a pessoa respondeu em compromissos do app.
 *
 * A tela anterior a esta repetia as respostas de volta em forma de lista, o
 * que não diz nada — a pessoa já sabe o que respondeu. O que ela não sabe é o
 * que o app vai FAZER com aquilo.
 */
export function planoDe(r: RespostasDoPlano): ItemDoPlano[] {
  const itens: ItemDoPlano[] = [
    { icon: 'bell', text: `Vou te chamar todo dia às ${horaFalada(r.reminder)}. Se você não abrir, nada acontece.` },
  ];

  if (r.tentou.includes('Guardo pra mim mesmo')) {
    itens.push({
      icon: 'lock',
      text: 'Você disse que guarda tudo pra si. Aqui pode continuar guardando: nada do que escrever sai deste aparelho, nem para nós.',
    });
  } else {
    itens.push({
      icon: 'lock',
      text: 'Nada do que você escrever sai deste aparelho. Não há conta, não há servidor, e a análise roda aqui dentro.',
    });
  }

  if (r.valores.length) {
    const lista =
      r.valores.length === 1
        ? r.valores[0].toLowerCase()
        : `${r.valores.slice(0, -1).join(', ').toLowerCase()} e ${r.valores[r.valores.length - 1].toLowerCase()}`;
    itens.push({
      icon: 'leaf',
      text: `Vou procurar ${lista} no que você escrever, e mostrar quando esses valores aparecerem.`,
    });
  }

  if (dormeTarde(r.sleepTime)) {
    itens.push({
      icon: 'moon',
      text: `Você dorme por volta das ${horaFalada(r.sleepTime)}. Tenho práticas de insônia para as noites em que o sono não vem.`,
    });
  }

  if (r.tentou.includes('Faço terapia')) {
    itens.push({
      icon: 'star',
      text: 'Como você faz terapia, vou montar um resumo das suas semanas em PDF para você levar à sessão.',
    });
  }

  // Quatro é o que cabe na tela sem virar lista longa.
  return itens.slice(0, 4);
}

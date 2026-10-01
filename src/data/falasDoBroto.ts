import type { Pose } from '../components/brand/geometriaDoBroto';
import type { Mood } from '../theme/tokens';

/**
 * O que o broto diz, e quando.
 *
 * ## Por que um arquivo só
 *
 * Porque é uma voz só. Espalhadas pelas telas, as falas viravam quinze vozes
 * ligeiramente diferentes — foi o que aconteceu com o balão antes de
 * `BalaoDoBroto` existir, e o remédio é o mesmo: uma forma, um lugar.
 *
 * ## As regras da voz
 *
 * 1. **Primeira pessoa, sempre.** Quem fala é o broto, não o app. "Respira
 *    comigo?", nunca "Faça uma respiração".
 * 2. **Sem emoji.** A expressão está no rosto dele, que é desenhado.
 * 3. **Nada do que a pessoa escreveu.** O nome dela entra; o diário, nunca.
 * 4. **Curto.** O balão tem 170 de largura e não rola. Uma fala que não cabe
 *    em três linhas é um parágrafo disfarçado.
 * 5. **Nunca cobra.** Ele não sabe que você sumiu, não conta quantos dias
 *    faltam para nada que dependa de esforço, e não se decepciona.
 *
 * ## Por que ele repete quando tocam nele
 *
 * A tela inicial tem quatro falas em rodízio, e tocar no broto passa para a
 * seguinte. É o único lugar do app onde tocar em alguma coisa não leva a lugar
 * nenhum — e é de propósito: é o gesto de fazer carinho no bicho, que não tem
 * função e é metade do motivo de ter um bicho.
 */

export type HoraDoDia = 'manha' | 'tarde' | 'noite';

/**
 * A hora do dia da **cena** — três faixas, não quatro.
 *
 * `saudacao.ts` tem quatro, com madrugada à parte, porque ali a diferença
 * importa: quem abre o app às três da manhã precisa ouvir outra coisa. Aqui a
 * pergunta é se o céu tem sol ou lua, e a madrugada é noite.
 */
export function horaDaCena(agora: Date): HoraDoDia {
  const h = agora.getHours();
  if (h >= 5 && h < 12) return 'manha';
  if (h < 18) return 'tarde';
  return 'noite';
}

/** De noite o céu escurece e o broto cochila. Vale de dia também na madrugada. */
export function ehNoite(agora: Date): boolean {
  return horaDaCena(agora) === 'noite';
}

const SAUDACAO: Record<HoraDoDia, (nome: string) => string> = {
  manha: (nome) => `Bom dia, ${nome}. Acordei me espreguiçando.`,
  tarde: () => 'Boa tarde. Já bebeu água hoje? Eu já.',
  noite: () => 'Está ficando tarde. Vamos desacelerar juntos?',
};

const SOBRE_O_HUMOR: Record<Mood, string> = {
  feliz: 'Adoro quando você está assim. Até minhas folhas brilham.',
  leve: 'Hoje o vento está gostoso aqui.',
  ansioso: 'Percebi que o dia está pesado. Respira comigo?',
  cansado: 'Vamos com calma hoje. Eu também estou devagar.',
  triste: 'Estou aqui do seu lado.',
  neutro: 'Seja como for o dia, eu fico por aqui.',
};

/**
 * As quatro falas da tela inicial e da aba do broto, em rodízio.
 *
 * A terceira menciona folhas que faltam, e é o único número da lista. Ele pode
 * aparecer porque não depende de esforço nenhum: cada prática, cada registro e
 * cada pensamento compostado vale uma, e a contagem nunca desce.
 */
export function falasDaCasa({
  nome,
  humor,
  hora,
  folhasQueFaltam,
}: {
  nome: string;
  humor: Mood;
  hora: HoraDoDia;
  folhasQueFaltam: number;
}): string[] {
  return [
    SAUDACAO[hora](nome),
    SOBRE_O_HUMOR[humor],
    folhasQueFaltam > 0
      ? `Faltam ${folhasQueFaltam} ${folhasQueFaltam === 1 ? 'folha' : 'folhas'} para eu crescer.`
      : 'Já estou no meu tamanho. Agora é só companhia.',
    'Me toca de novo que eu conto outra coisa.',
  ];
}

/** A primeira fala de todas, na tela de boas-vindas. */
export const NA_CHEGADA = 'Oi! Que bom que você chegou.';

/** O que ele diz em cada passo do onboarding que tem balão. */
export const NO_ONBOARDING = {
  nome: 'Como posso te chamar?',
  nomeDoBroto: (nome: string) => `Prazer, ${nome || 'você'}. E eu, como me chamo?`,
  humor: 'Pode escolher o que mais parece com você.',
  humorEscolhido: {
    feliz: 'Que bom. Vamos cuidar para isso durar.',
    leve: 'Leveza é um ótimo lugar para começar.',
    ansioso: 'Obrigado por contar. Vamos respirar juntos, sem pressa.',
    cansado: 'Então vamos devagar. Eu também adoro descansar.',
    triste: 'Sinto muito. Estou aqui com você.',
    neutro: 'Tudo bem não saber. A gente descobre junto.',
  } satisfies Record<Mood, string>,
};

/**
 * Como o broto aparece em cada tema de prática: o que ele diz e o que faz.
 *
 * ## A fala é sobre **ele**
 *
 * E não sobre a pessoa — é o que evita que o balão vire um segundo subtítulo.
 * Ele conta o que aquilo tem a ver com a vida de um broto, e quem lê faz a
 * ponte sozinho. "Eu também cresço meio torto às vezes" diz mais sobre culpa
 * do que qualquer frase que começasse com "você".
 *
 * ## A pose não é o sintoma
 *
 * Ele **não** fica ansioso no tema da ansiedade nem triste no da tristeza.
 * Num app de saúde mental, o personagem que espelha o estado da pessoa a
 * deixa sozinha no estado; o que acompanha é o que faz companhia. Então ele
 * fica calmo onde dói, pensa onde falta foco, se espreguiça onde falta
 * começar — e dorme só no tema do sono, que é o único em que dormir é a coisa
 * certa a fazer.
 *
 * O `humor` aqui é o rosto dele, não o da pessoa: é o que pinta o céu da cena
 * do tema, e por isso é escolhido pelo assunto, não pelo registro de hoje.
 */
export type ComoEleAparece = {
  fala: string;
  pose: Pose;
  humor: Mood;
  /** Só a insônia: a cena do tema acontece de noite, seja qual for a hora. */
  noite?: boolean;
};

export const NO_TEMA: Record<string, ComoEleAparece> = {
  ansiedade: { fala: 'Essa respiração me ajuda quando fico agitado.', pose: 'calmo', humor: 'leve' },
  estresse: { fala: 'Solta os ombros comigo?', pose: 'parado', humor: 'cansado' },
  raiva: { fala: 'Pode sacudir. Minhas folhas aguentam.', pose: 'espreguica', humor: 'leve' },
  insonia: { fala: 'Bocejo só de pensar nisso.', pose: 'dorme', humor: 'leve', noite: true },
  tristeza: { fala: 'Posso ficar aqui do seu lado?', pose: 'calmo', humor: 'triste' },
  luto: { fala: 'Eu lembro de tudo que me regou.', pose: 'pensa', humor: 'leve' },
  solidao: { fala: 'Eu não saio daqui. Estou plantado.', pose: 'acena', humor: 'leve' },
  procrastinacao: { fala: 'Só dois minutinhos. Topa?', pose: 'espreguica', humor: 'leve' },
  foco: { fala: 'Uma coisa de cada vez.', pose: 'pensa', humor: 'leve' },
  autoestima: { fala: 'Você é importante para mim.', pose: 'parado', humor: 'feliz' },
  culpa: { fala: 'Eu também cresço meio torto às vezes.', pose: 'calmo', humor: 'leve' },
  comparacao: { fala: 'Cada planta tem o tempo dela. Eu demorei.', pose: 'pensa', humor: 'leve' },
  gratidao: { fala: 'Sou grato por você cuidar de mim.', pose: 'comemora', humor: 'feliz' },
};

/** Como ele aparece num tema — com um padrão para tema que ainda não tenha. */
export function noTema(chave: string): ComoEleAparece {
  return NO_TEMA[chave] ?? { fala: 'Estou aqui com você.', pose: 'parado', humor: 'leve' };
}

/** O que ele diz enquanto acompanha uma respiração. */
export const NA_RESPIRACAO = {
  inspira: 'Enche a barriga de ar, devagar.',
  segura: 'Segura comigo...',
  solta: 'Agora solta, bem devagarinho.',
  pausado: 'Estou te esperando.',
};

/** O que ele diz entre os passos de uma prática escrita ou de corpo. */
export const NOS_PASSOS = [
  'Sem pressa. Estou aqui.',
  'Isso. Pode levar o tempo que precisar.',
  'Última. Você está indo muito bem.',
];

/**
 * Depois de terminar uma prática.
 *
 * O documento faz ele dizer "ganhei uma folha nova", porque lá cada prática
 * vale uma folha e dez folhas viram um estágio. Aqui não: o broto cresce por
 * **dia cuidado**, e uma prática feita na terceira vez do mesmo dia não faz
 * ele crescer nada. A fala tinha de deixar de prometer o que não acontece —
 * não por rigor, mas porque uma recompensa que não chega é pior do que
 * recompensa nenhuma.
 *
 * O que é verdade: o dia passou a contar, e ele estava junto.
 */
export function noFim({ cresceu }: { cresceu: boolean }): string {
  return cresceu ? 'Olha! Eu cresci com você.' : 'Hoje já conta. Fiquei aqui o tempo todo.';
}

/** No diário, conforme a pessoa escreve. */
export function noDiario(rascunho: string): string {
  const palavras = rascunho.trim() ? rascunho.trim().split(/\s+/).length : 0;
  if (palavras > 12) return 'Estou lendo com carinho. Continua...';
  if (palavras > 0) return 'Isso, pode ir escrevendo.';
  return 'O que ficou com você hoje?';
}

/**
 * Na Composta: o convite e o agradecimento.
 *
 * O fim não promete folha, pelo mesmo motivo de `noFim`: o broto cresce por
 * dia cuidado, e a terceira composta do mesmo dia não faz ele crescer nada.
 * O que é verdade é que o pensamento virou adubo — que é literalmente o que a
 * tela acabou de desenhar.
 */
export const NA_COMPOSTA = {
  convite: 'Me dá esse pensamento. Eu transformo em adubo.',
  fim: 'Obrigado. Isso aí vira adubo bom.',
};

/** O que ele diz enquanto o pensamento é repetido. */
export function naComposta(repeticoes: number): string {
  if (repeticoes === 0) return 'Estou ouvindo. Pode começar.';
  if (repeticoes < 5) return 'Isso, continua.';
  if (repeticoes < 9) return 'Está virando só som...';
  return 'Adubo fresquinho.';
}

/**
 * Nas frases guardadas, quando ainda não há nenhuma.
 *
 * É a única tela do app em que o vazio é o estado **normal** de quem acabou
 * de chegar: guardar uma frase exige ter desenterrado uma, gostado dela e
 * tocado no coração. O texto da tela explica o que fazer; esta fala existe
 * para o lugar não parecer quebrado enquanto isso não acontece.
 */
export const NAS_GUARDADAS_VAZIO = 'Ainda não tem nenhuma aqui. Eu aviso quando achar uma boa.';

/** As quatro falas do jardim, em rodízio como as da casa. */
export const NO_JARDIM = [
  'Olha como eu cresci com você.',
  'Mais uma folha e eu mudo de fase.',
  'Cada cuidado seu vira raiz aqui.',
  'Estou com saudade do diário, sabia?',
];

/** Todas as falas fixas, para o conferidor ler sem executar o app. */
export const TODAS_AS_FALAS: string[] = [
  NA_CHEGADA,
  NO_ONBOARDING.nome,
  NO_ONBOARDING.humor,
  ...Object.values(NO_ONBOARDING.humorEscolhido),
  ...Object.values(SOBRE_O_HUMOR),
  ...Object.values(NO_TEMA).map((t) => t.fala),
  ...Object.values(NA_RESPIRACAO),
  ...NOS_PASSOS,
  ...Object.values(NA_COMPOSTA),
  ...NO_JARDIM,
  NAS_GUARDADAS_VAZIO,
  noFim({ cresceu: true }),
  noFim({ cresceu: false }),
  noDiario(''),
  noDiario('uma palavra'),
  noDiario('uma frase bem comprida que passa de doze palavras ao todo para valer o outro caso'),
  naComposta(0),
  naComposta(3),
  naComposta(7),
  naComposta(12),
];

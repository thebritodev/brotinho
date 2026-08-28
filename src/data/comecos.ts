/**
 * Uma pergunta de partida para o diário, quando a folha está vazia.
 *
 * A página em branco é o motivo mais citado de abandono em apps de diário — e
 * não por falta de assunto: a maioria desiste em um mês porque a caixa vazia
 * vence. A Composta já oferecia três frases prontas; o Diário abria com um
 * campo vazio e "Escreva livremente sobre o seu dia...", que é uma instrução,
 * não um começo.
 *
 * ---
 *
 * **A pergunta sai do que o app já sabe.** Uma lista genérica de perguntas é
 * fácil de escrever e fácil de ignorar. Aqui ela leva em conta o humor
 * registrado hoje, o horário e os valores que a pessoa escolheu no onboarding —
 * então soa como alguém que estava prestando atenção, não como um cartaz.
 *
 * **Três regras, as mesmas de sempre:**
 *
 * 1. **Nada do que ela escreveu.** Tudo aqui é constante deste arquivo. A
 *    pergunta reage ao humor tocado num botão, nunca a texto lido.
 * 2. **Nunca cobrar, nunca diagnosticar.** Uma pergunta não pode dizer à
 *    pessoa o que ela está sentindo — ela já disse.
 * 3. **É um começo, não um formulário.** A pessoa apaga e escreve o que quiser;
 *    a pergunta não fica na tela depois que ela começa a digitar.
 */

import type { Mood } from '../theme';

/** Quando a pessoa marcou como está se sentindo hoje. */
const POR_HUMOR: Record<Mood, string[]> = {
  feliz: [
    'O que fez hoje ser diferente?',
    'O que você quer lembrar deste dia?',
    'Quem participou disso com você?',
  ],
  leve: [
    'O que tirou o peso hoje?',
    'Como está seu corpo agora?',
    'O que você faria de novo amanhã?',
  ],
  ansioso: [
    'O que está te apertando agora?',
    'O que a sua cabeça fica repetindo?',
    'Do que você tem medo que aconteça?',
    'O que já aconteceu, e o que você só está imaginando?',
  ],
  triste: [
    'O que doeu hoje?',
    'Se a tristeza pudesse falar, o que ela diria?',
    'O que você precisava e não teve?',
  ],
  cansado: [
    'O que gastou você hoje?',
    'Faz quanto tempo que você não descansa de verdade?',
    'O que dá para tirar do seu dia de amanhã?',
  ],
  neutro: [
    'Como foi o seu dia?',
    'O que passou por aqui hoje?',
    'Tem alguma coisa que você não contou para ninguém?',
  ],
};

/** Sem humor marcado, o horário é o que se sabe. */
const POR_HORA = {
  manha: [
    'Com o que você acordou na cabeça?',
    'O que você quer para hoje?',
    'Como você dormiu?',
  ],
  tarde: [
    'Como está sendo o seu dia até aqui?',
    'O que apertou hoje?',
    'Aconteceu alguma coisa boa hoje?',
  ],
  noite: [
    'Como foi o seu dia?',
    'O que ficou dando voltas na sua cabeça hoje?',
    'O que você quer deixar no dia de hoje?',
  ],
  madrugada: [
    'O que está te mantendo acordado?',
    'O que não sai da sua cabeça?',
    'Escreve como se ninguém fosse ler. Porque ninguém vai.',
  ],
};

/**
 * Quando a pessoa escolheu valores no onboarding, eles entram no sorteio.
 *
 * É o único lugar do app em que aquelas escolhas voltam para ela como pergunta.
 * As chaves são os rótulos exatos de `VALORES` em `onboarding.ts`, porque é
 * assim que eles são guardados no perfil — com acento e maiúscula.
 */
const POR_VALOR: Record<string, string[]> = {
  Conexão: ['Quem você procurou hoje?', 'De quem você sentiu falta?'],
  Calma: ['Onde você encontrou sossego hoje?', 'O que te tirou do sério?'],
  Coragem: ['O que você fez hoje mesmo com medo?', 'O que você está adiando?'],
  Gratidão: ['O que valeu a pena hoje?', 'Quem facilitou o seu dia?'],
  Autoconhecimento: ['O que você descobriu sobre você hoje?', 'O que se repetiu de novo?'],
  Criatividade: ['O que você teve vontade de criar hoje?'],
  Disciplina: ['O que você manteve hoje, mesmo sem vontade?'],
  Superação: ['O que hoje foi mais difícil do que parecia?'],
};

export type ContextoDoComeco = {
  /** Existe como parâmetro para o teste não depender do relógio. */
  agora: Date;
  /** O humor marcado hoje, se houver. */
  humorDeHoje: Mood | null;
  /** Os valores escolhidos no onboarding — os rótulos de `VALORES`. */
  valores: string[];
};

/** Todas as perguntas, para o teste conferir que nenhuma quebra as regras. */
export const TODOS_OS_COMECOS: string[] = [
  ...Object.values(POR_HUMOR).flat(),
  ...Object.values(POR_HORA).flat(),
  ...Object.values(POR_VALOR).flat(),
];

/**
 * A pergunta de hoje. Estável dentro do mesmo dia, pelo mesmo motivo da
 * saudação: a folha não pode trocar de pergunta enquanto a pessoa a encara.
 */
export function comecoDoDia({ agora, humorDeHoje, valores }: ContextoDoComeco): string {
  const hora = agora.getHours();
  const faixa =
    hora >= 5 && hora < 12 ? 'manha' : hora >= 12 && hora < 18 ? 'tarde' : hora >= 18 ? 'noite' : 'madrugada';

  // O humor de hoje tem precedência: é a coisa mais recente que ela contou.
  const base = humorDeHoje ? POR_HUMOR[humorDeHoje] : POR_HORA[faixa];
  const dosValores = valores.flatMap((v) => POR_VALOR[v] ?? []);
  const candidatas = base.concat(dosValores);

  const semente = agora.getFullYear() * 372 + agora.getMonth() * 31 + agora.getDate();
  return candidatas[semente % candidatas.length];
}

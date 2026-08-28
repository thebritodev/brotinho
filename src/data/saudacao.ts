/**
 * A frase abaixo do "Oi, Fulano" na Home.
 *
 * Era uma constante: **"Vamos cuidar de você hoje?"**, em toda abertura, para
 * sempre. É o mesmo defeito das notificações, no lugar que a pessoa vê mais que
 * qualquer outro no app — e uma frase que nunca muda deixa de ser dita e vira
 * cabeçalho.
 *
 * As três regras continuam, e pelos mesmos motivos:
 *
 * 1. **Nada do que a pessoa escreveu.** Todo texto é constante deste arquivo.
 * 2. **Nenhum número.** Contagem que envelhece vira mentira, e aqui já existem
 *    os números de verdade logo abaixo, em "Seu crescimento".
 * 3. **Nunca cobrar.** Quem sumiu uma semana já encontra o `VoltaCard` — a
 *    saudação não precisa mencionar ausência, e não menciona.
 *
 * **Estável dentro do mesmo dia.** A escolha vem da data, não de sorteio: abrir
 * o app três vezes numa manhã não pode trocar a frase a cada vez, senão o app
 * parece nervoso. Muda quando o dia muda.
 */

const MANHA = [
  'Como você começa o dia hoje?',
  'Bom dia. Nada aqui tem pressa.',
  'O dia está começando. E você?',
  'Que bom te ver de manhã.',
  'Um momento seu, antes do resto.',
];

const TARDE = [
  'Como está indo o seu dia?',
  'Boa tarde. Dá para parar um pouco?',
  'No meio do dia também vale respirar.',
  'Que bom que você passou aqui.',
  'Vamos ver como você está?',
];

const NOITE = [
  'Como foi seu dia?',
  'Boa noite. O dia pode ficar aqui.',
  'Chegou a hora de esvaziar a cabeça?',
  'Que bom te ver antes de dormir.',
  'O que sobrou do dia de hoje?',
];

const MADRUGADA = [
  'A esta hora, devagar.',
  'Se o sono não vem, escrever ajuda.',
  'Estou acordado com você.',
  'Sem pressa nenhuma agora.',
];

/**
 * Alguns dias pedem outra coisa. Entram no sorteio só no dia certo, e só de
 * tarde ou de noite — de manhã cedo ninguém quer ser lembrado de que é segunda.
 */
const POR_DIA: Record<number, string[]> = {
  0: ['Domingo pede um ritmo mais lento.', 'Domingo também é seu.'],
  1: ['Segunda-feira. Um passo de cada vez.'],
  3: ['Metade da semana. Como você está?'],
  5: ['Sexta. A semana foi longa?'],
  6: ['Sábado. Sem cobrança nenhuma hoje.'],
};

/** Para quem já vem cuidando há um tempo. Sem elogio inflado. */
const VETERANO = [
  'Que bom continuar te vendo por aqui.',
  'Seu broto já tem história.',
];

const DIAS_PARA_VETERANO = 21;

export type ContextoDaSaudacao = {
  /** Existe como parâmetro para o teste não depender do relógio. */
  agora: Date;
  /** Dias em que a pessoa apareceu — `daysCaredFor`. */
  diasCuidados: number;
};

/** Todas as frases, para o teste conferir que nenhuma quebra as regras. */
export const TODAS_AS_SAUDACOES: string[] = [
  ...MANHA,
  ...TARDE,
  ...NOITE,
  ...MADRUGADA,
  ...VETERANO,
  ...Object.values(POR_DIA).flat(),
];

export function saudacaoDoDia({ agora, diasCuidados }: ContextoDaSaudacao): string {
  const hora = agora.getHours();

  const daHora =
    hora >= 5 && hora < 12 ? MANHA : hora >= 12 && hora < 18 ? TARDE : hora >= 18 ? NOITE : MADRUGADA;

  const candidatas = [...daHora];
  if (hora >= 12) candidatas.push(...(POR_DIA[agora.getDay()] ?? []));
  if (diasCuidados >= DIAS_PARA_VETERANO) candidatas.push(...VETERANO);

  /*
    A semente é a data — ano, mês e dia somados de um jeito que muda todo dia
    sem depender de fuso nem de biblioteca. O mesmo dia devolve a mesma frase; o
    dia seguinte devolve outra.
  */
  const semente = agora.getFullYear() * 372 + agora.getMonth() * 31 + agora.getDate();
  return candidatas[semente % candidatas.length];
}

import { saudacaoDoDia } from './saudacao';

/**
 * O que o broto fala no alto da tela inicial.
 *
 * ## Por que existe, e por que não é a saudação
 *
 * Ali havia uma linha em versalete — "VAMOS CUIDAR DE VOCÊ HOJE?" — que era
 * moldura, não fala: ninguém a dizia e ela não sabia de nada. Trocada pelo
 * broto com um balão, a primeira coisa da tela passa a ser o personagem
 * falando, que é a diferença entre uma tela de ferramentas e uma tela de um
 * app que tem alguém dentro.
 *
 * A `saudacaoDoDia` continua existindo e continua sendo o chão daqui: ela é
 * boa, varia por hora e por dia da semana, e é o que sobra quando não há nada
 * específico para dizer — que é a maioria dos dias.
 *
 * ## As regras, e elas são as mesmas da saudação
 *
 * 1. **Nada do que a pessoa escreveu.** Todo texto é constante deste arquivo.
 *    O que vem de fora são fatos do app — quantos dias faltam, se a frase já
 *    foi desenterrada —, nunca conteúdo dela.
 * 2. **Nunca cobrar.** Não existe aqui "faz três dias que você não escreve".
 *    Ausência já tem o `VoltaCard`, que recebe em vez de cobrar, e a fala do
 *    alto da tela não é lugar de dívida. O que falta aparece só quando é uma
 *    coisa **esperando** pela pessoa, não uma coisa que ela deixou de fazer.
 * 3. **Nenhum número que envelhece.** "Mais um dia" e "faltam dois dias" são
 *    contagens que o próprio broto cumpre amanhã. "Você veio nove vezes" não
 *    entra: é placar, e este app não tem placar.
 *
 * ## Por que é pura
 *
 * Recebe fatos prontos em vez de `AppData` para o teste conseguir montar cada
 * caso sem inventar um app inteiro — e para este arquivo não ter como tocar no
 * diário nem por acidente.
 */

export type ContextoDaFala = {
  /** Existe como parâmetro para o teste não depender do relógio. */
  agora: Date;
  /** Dias em que a pessoa apareceu — `daysCaredFor`. */
  diasCuidados: number;
  /**
   * Dias até o broto mudar de estágio — `daysToNextStage`. `null` quando não
   * há próximo estágio.
   */
  diasParaCrescer: number | null;
  /** A frase de hoje já foi desenterrada? */
  fraseAberta: boolean;
};

/** Todas as falas próprias, para o teste conferir que nenhuma quebra as regras. */
export const TODAS_AS_FALAS: string[] = [
  'Mais um dia e eu cresço.',
  'Faltam dois dias para eu crescer.',
  'A frase de hoje ainda está enterrada.',
];

export function falaDaHome({
  agora,
  diasCuidados,
  diasParaCrescer,
  fraseAberta,
}: ContextoDaFala): string {
  /*
    O crescimento vem primeiro porque é o que acontece com **ele**, e é a única
    coisa da tela que tem data marcada. Só a véspera e a antevéspera falam: três
    dias antes já não é notícia, é previsão do tempo.
  */
  if (diasParaCrescer === 1) return 'Mais um dia e eu cresço.';
  if (diasParaCrescer === 2) return 'Faltam dois dias para eu crescer.';

  /*
    A frase do dia é a única coisa do app que **espera** por alguém: ela já foi
    escolhida, está ali, e some à meia-noite sem ter sido lida. Dizer isso não é
    cobrar — é avisar que tem correspondência na caixa.
  */
  if (!fraseAberta) return 'A frase de hoje ainda está enterrada.';

  return saudacaoDoDia({ agora, diasCuidados });
}

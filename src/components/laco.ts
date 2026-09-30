import { Animated, Easing } from 'react-native';

/**
 * Os laços infinitos do app, e a armadilha que eles evitam.
 *
 * ## `Animated.loop` de um `timing` sozinho não roda no navegador
 *
 * E falha **em silêncio**: nenhum erro, nenhum aviso, o valor simplesmente
 * nunca sai de zero. Foi medido, não deduzido — a mesma animação, trocando só
 * o formato do laço:
 *
 * ```
 * Animated.loop(Animated.timing(v, { useNativeDriver: true }))   parada
 * Animated.loop(Animated.sequence([timing, timing]))             anda
 * ```
 *
 * O motivo está no `Animated.loop`: antes de rodar ele pergunta
 * `animation._isUsingNativeDriver()`, e um `timing` responde com o que lhe
 * **pediram**, não com o que dá para fazer — `true`, mesmo onde não existe
 * módulo nativo. O laço então delega para `_startNativeLoop`, que no navegador
 * não faz nada. Uma sequência responde `false` à mesma pergunta, ainda que
 * seus filhos peçam o driver nativo, e o laço toma o caminho comum: nativo no
 * aparelho, em JavaScript no navegador.
 *
 * Um `addListener` no valor também faz a animação voltar a andar, o que atrasou
 * o diagnóstico por um bom tempo: a sonda que eu usei para investigar era a
 * própria coisa que consertava o defeito.
 *
 * Isso importa porque o navegador é a única superfície em que este app
 * consegue ser conferido sem um aparelho na mão. Uma animação que só existe no
 * nativo é uma animação que ninguém viu.
 *
 * `scripts/confere-lacos.js` guarda a regra: nenhum `Animated.loop` direto em
 * `src`, fora daqui.
 */

/**
 * O laço de ida e volta: o formato de quase toda animação de ambiente daqui.
 *
 * Nuvem que passa, sol que pulsa, estrela que pisca, planta ao vento, zê que
 * sobe: todos vão de 0 a 1 e voltam, com a mesma duração nas duas metades.
 * Escrito à mão em cada lugar — e chegou a estar em cinco —, o erro que
 * aparecia era sempre o mesmo: a volta com metade da distância no mesmo tempo
 * da ida, e o movimento acelerando ao dobrar a esquina. A nota longa em
 * `AnimatedSprout`, sobre o bamboleio, conta essa história.
 *
 * `isInteraction: false` está aqui por dentro porque vale para todos: um laço
 * infinito registrado como interação faz o `InteractionManager` achar que a
 * tela nunca assentou, e tudo que espera por ele fica esperando para sempre.
 */
export function lacoDeIdaEVolta(
  valor: Animated.Value,
  {
    ms,
    /**
     * A volta, quando ela dura diferente da ida.
     *
     * Existe por causa da respiração do broto: inspirar é mais curto que
     * expirar, como numa respiração calma de verdade. Fora dela, as duas
     * metades são iguais, e é isso que tira a batida da emenda do laço.
     */
    msVolta,
    easing = Easing.inOut(Easing.sin),
  }: { ms: number; msVolta?: number; easing?: (t: number) => number },
) {
  const meia = (para: number, duracao: number) =>
    Animated.timing(valor, {
      toValue: para,
      duration: duracao,
      easing,
      useNativeDriver: true,
      isInteraction: false,
    });
  const ida = msVolta === undefined ? ms / 2 : ms;
  const volta = msVolta === undefined ? ms / 2 : msVolta;
  return Animated.loop(Animated.sequence([meia(1, ida), meia(0, volta)]));
}

/**
 * O laço que só vai: de 0 a 1, e recomeça do zero.
 *
 * Serve para as curvas que **terminam onde começaram** — o aceno, o pulo, o
 * espreguiçar. Ali a volta a zero cai num ponto que já era zero, e o recomeço
 * não aparece. Usar ida e volta nesses casos daria o movimento de trás para a
 * frente na segunda metade, que no aceno lê como gaguejar.
 */
export function lacoQueSoVai(
  valor: Animated.Value,
  {
    ms,
    easing = Easing.inOut(Easing.sin),
    /** Onde a volta termina. Quase sempre 1; a queda das palavras vai a 2. */
    ate = 1,
    /**
     * `false` para quem anima o que o driver nativo não sabe animar — largura,
     * cor, posição. Ver `cenasDoCarrossel`.
     */
    nativo = true,
  }: { ms: number; easing?: (t: number) => number; ate?: number; nativo?: boolean },
) {
  /*
    A sequência de um item só não é firula: é ela que faz o laço rodar no
    navegador. Ver a nota do alto do arquivo.
  */
  return Animated.loop(
    Animated.sequence([
      Animated.timing(valor, {
        toValue: ate,
        duration: ms,
        easing,
        useNativeDriver: nativo,
        isInteraction: false,
      }),
    ]),
  );
}

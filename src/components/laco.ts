import { Animated, Easing, Platform } from 'react-native';

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
 * ## E a sequência não pode valer no aparelho
 *
 * Porque ela conserta o navegador **cobrando o preço no celular**. Dizendo
 * `false` ao `_isUsingNativeDriver`, ela tira o laço do caminho nativo em
 * todo lugar — e o caminho comum reinicia a animação **pelo JavaScript** a
 * cada volta: `animation.reset()` e `animation.start()` outra vez, um
 * atravessamento da ponte por ciclo.
 *
 * No aparelho isso aparece. Pedro viu primeiro na frase que cai na tela
 * inicial: "dá uma travada no meio do caminho e reinicia". É exatamente isso
 * — as palavras congelam no instante da emenda, que cai no meio da queda
 * delas, e seguem. Quanto mais ocupado o JavaScript, maior a travada.
 *
 * Então a sequência é **só do navegador**. No aparelho o laço volta a ser
 * `Animated.loop(timing)`, que é o que o `_startNativeLoop` sabe rodar
 * sozinho, para sempre, sem passar por aqui nenhuma vez.
 *
 * `scripts/confere-lacos.js` guarda a regra: nenhum `Animated.loop` direto em
 * `src`, fora daqui.
 */

/**
 * Embrulha o passo do laço no formato que **esta** plataforma precisa.
 *
 * No navegador, uma sequência, para o laço não delegar a um driver nativo que
 * não existe. No aparelho, o passo cru, para o laço rodar inteiro do outro
 * lado da ponte. Ver a nota acima: as duas metades deste arquivo são a mesma
 * decisão vista de cada lado.
 */
function paraOLaco(passos: Animated.CompositeAnimation[]): Animated.CompositeAnimation {
  if (Platform.OS === 'web' || passos.length > 1) return Animated.sequence(passos);
  return passos[0];
}

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
 *
 * ## Este continua reiniciando pelo JavaScript, e por quê
 *
 * Duas metades são duas animações, e `Animated.sequence` responde `false` ao
 * `_isUsingNativeDriver` **qualquer que seja o tamanho** dela — está escrito
 * assim no `AnimatedImplementation` da versão que usamos. Não há como pedir
 * um laço nativo de ida e volta: o `_startNativeLoop` só existe no `timing`
 * cru.
 *
 * O preço é o mesmo do `lacoQueSoVai` de antes — uma travada por volta —, e a
 * diferença é onde ela cai. Aqui a emenda do laço acontece no ponto em que o
 * movimento **já está parado**, porque é o fim da volta: a nuvem no extremo
 * da passada, a planta no alto da vergada. Uma travada onde nada se mexe não
 * aparece. É por isso que ninguém viu em nenhuma destas, e viu na queda das
 * palavras, que emenda no meio do caminho.
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
    A sequência de um item só não é firula, e também não é de graça: no
    navegador é ela que faz o laço andar, e no aparelho é ela que faz o laço
    travar uma vez por volta. Por isso quem decide é a plataforma, em
    `paraOLaco`. Ver a nota do alto do arquivo.
  */
  return Animated.loop(
    paraOLaco([
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

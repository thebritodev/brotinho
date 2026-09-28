import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTema } from '../theme';
import {
  DURACAO_DA_TROCA,
  FRACAO_DO_DESLIZE,
  RECUO_DE_QUEM_SAI,
  ladoDaTroca,
} from './regrasDaTroca';

/**
 * A troca de uma tela por outra: as duas se mexem, e nenhuma some de um quadro
 * para o outro.
 *
 * ## O corte que estava aqui
 *
 * A versão anterior animava só **quem chega**. Trocar a chave desmontava o
 * conteúdo antigo no mesmo quadro do toque e esmaecia o novo por cima do fundo
 * do app. Medido no navegador com a CPU desacelerada quatro vezes, a camada
 * desenhava de nove a dezesseis quadros — ou seja, a animação existia e estava
 * fluida. O que faltava era a outra metade: a tela que sai **pisca para fora**
 * num quadro só, e é isso que o olho lê como corte seco, por mais suave que
 * seja a entrada.
 *
 * É o mesmo defeito que a `CamadaEmpilhada` e a `AbasVivas` já tinham
 * consertado cada uma no seu canto. Faltava aqui — e aqui é o resto do app
 * inteiro: o Root, a troca entre telas empilhadas, as práticas, as
 * configurações, a política, a Composta.
 *
 * ## As duas camadas são opacas, e se cruzam
 *
 * Nada dissolve. Dissolver mostra, por um quinto de segundo, duas telas
 * inteiras uma dentro da outra — dois cabeçalhos, dois textos —, e foi assim
 * que a troca de abas ganhou o "piscar" que levou um dia para ser entendido.
 * Ver `regrasDasAbas`.
 *
 * Então as duas andam, as duas com fundo próprio: a que chega entra inteira
 * pelo lado (ou por baixo, no modo `sobe`), e a que sai recua **um quarto** do
 * mesmo caminho, para o lado oposto. O recuo mais curto é o que faz as duas se
 * cruzarem em vez de se encostarem: encostadas, o arredondamento de pixel abre
 * um fio de fundo entre elas, e o fio atravessa a tela e pisca.
 *
 * ## A que sai não é redesenhada
 *
 * Ela continua sendo o **mesmo elemento** do quadro anterior, guardado numa
 * `ref`. Passando o mesmo objeto de elemento, o React nem entra na subárvore —
 * é a conta que a `CamadaEmpilhada` já fazia, e sem ela a saída custaria uma
 * renderização de tela cheia em cima da própria animação.
 *
 * E as duas camadas têm `key`: é a `key` que faz o React reconhecer a que sai
 * como aquela que já estava montada, em vez de montar uma cópia nova — montar
 * de novo, dentro do toque, seria trocar o corte por uma travada.
 */

/*
  Os números moram em `regrasDaTroca`, e não aqui.

  Porque a `CamadaEmpilhada` usa os mesmos, e eram dois conjuntos parecidos
  mas diferentes — 26 pontos de um lado, 20 de outro, 260 ms e 220 ms. Quatro
  gramáticas no mesmo app é o que se lê como "umas deslizam e outras só mudam".
*/

export type TransitionMode =
  /** Entra da direita: avancar para dentro de algo. */
  | 'forward'
  /** Entra da esquerda: voltar. */
  | 'back';

type Props = {
  transitionKey: string | number;
  /**
   * O lado da entrada. Ignorado quando `ordem` é dada — ali o lado sai da
   * posição das duas telas na sequência.
   */
  mode?: TransitionMode;
  /**
   * A sequência a que estas telas pertencem, da primeira à última.
   *
   * Com ela, avançar entra pela direita e voltar entra pela esquerda sem que
   * cada tela precise descobrir sozinha para que lado está indo — que era como
   * um passo acabava com o lado errado e a troca parecia outra transição.
   */
  ordem?: readonly (string | number)[];
  /** Substitui o `flex: 1` padrão — telas dentro de ScrollView precisam disso. */
  style?: StyleProp<ViewStyle>;
  /**
   * Não anima a primeira tela, só as trocas depois dela.
   *
   * Para quando quem está em volta já anima a chegada — a `CamadaEmpilhada`
   * desliza a tela para dentro, e esta, animando junto, somava um segundo
   * movimento por cima do primeiro.
   */
  semEntrada?: boolean;
  children: React.ReactNode;
};

export function ScreenTransition({
  transitionKey,
  mode = 'forward',
  ordem,
  style,
  semEntrada = false,
  children,
}: Props) {
  const { colors } = useTema();
  const { width } = useWindowDimensions();
  const t = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  /** Camada de hardware só enquanto anima: manter ligada custa memória à toa. */
  const [animando, setAnimando] = useState(false);
  /** A chave da tela que está saindo, ou `null` quando só há uma camada. */
  const [saindo, setSaindo] = useState<string | number | null>(null);

  useEffect(() => {
    let vivo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (vivo) setReduceMotion(on);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      vivo = false;
      sub.remove();
    };
  }, []);

  /**
   * O conteúdo do quadro anterior, para a camada de saída desenhar.
   *
   * Atualizado num efeito **passivo**, que roda depois da pintura: no commit
   * em que a chave muda, o efeito de layout logo abaixo ainda lê daqui o
   * conteúdo velho, que é justamente o que precisa continuar à vista.
   */
  const ultimo = useRef<React.ReactNode>(children);
  const noDeSaida = useRef<React.ReactNode>(null);
  useEffect(() => {
    ultimo.current = children;
  });

  /*
    `useLayoutEffect`, e nao `useEffect`.

    `useEffect` roda **depois** da pintura: existe um quadro em que a tela
    nova ja foi desenhada com o `t` que sobrou da transicao anterior, que e 1
    -- ou seja, no lugar -- e so entao ela salta para o comeco e anda. Num
    aparelho rapido isso e um piscar; num lento e a tela nova aparecendo antes
    de entrar.
  */
  /** A primeira chave já passou por aqui? Ver `semEntrada`. */
  const primeira = useRef(true);
  const chaveAnterior = useRef(transitionKey);
  /** A chave que a camada de saída leva quando a próxima troca acontece. */
  const chaveDaSaida = useRef<string | number>(transitionKey);
  /**
   * O lado desta troca, decidido **no instante dela**.
   *
   * Guardado numa ref e não recalculado no render: a chave anterior já virou a
   * atual quando o próximo render acontece, e o lado mudaria no meio da
   * animação — a tela daria meia-volta no ar.
   */
  const lado = useRef<TransitionMode>(mode);

  useLayoutEffect(() => {
    const estreia = primeira.current;
    primeira.current = false;
    const trocou = !estreia && chaveAnterior.current !== transitionKey;
    chaveAnterior.current = transitionKey;

    if (reduceMotion || (semEntrada && estreia)) {
      t.setValue(1);
      return;
    }

    /*
      Só há o que fazer sair numa troca de verdade. Na estreia a camada é uma
      só, e ela entra sozinha — não existe tela anterior para recuar.
    */
    if (trocou) {
      lado.current = ordem ? ladoDaTroca(chaveDaSaida.current, transitionKey, ordem) : mode;
      noDeSaida.current = ultimo.current;
      setSaindo(chaveDaSaida.current);
    } else {
      lado.current = mode;
    }
    chaveDaSaida.current = transitionKey;

    t.setValue(0);
    setAnimando(true);
    const animacao = Animated.timing(t, {
      toValue: 1,
      duration: DURACAO_DA_TROCA,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animacao.start(({ finished }) => {
      setAnimando(false);
      /*
        A camada de saída só é largada no **fim**, e é isso que mantém a
        animação sem trabalho de React pela frente. Interrompida por outra
        troca, quem manda é a troca nova: ela já pôs a sua própria saída.
      */
      if (finished) setSaindo(null);
    });

    // Rede de segurança: se a animação não completar, a tela não pode ficar
    // fora do lugar nem com a camada velha por cima.
    const seguranca = setTimeout(() => {
      t.setValue(1);
      setAnimando(false);
      setSaindo(null);
    }, DURACAO_DA_TROCA + 250);
    return () => {
      animacao.stop();
      clearTimeout(seguranca);
    };
  }, [transitionKey, reduceMotion]);

  /*
    A distância é fração da largura, e o sentido vem do lado desta troca.

    Toda troca do app anda na horizontal — ver `regrasDaTroca`. O que era um
    modo "sobe", de vinte pontos para cima, virou entrada pela direita como
    todas as outras: subir vinte pontos ao lado de uma aba que desliza a tela
    inteira não lê como a mesma coisa acontecendo.
  */
  const entrada = width * FRACAO_DO_DESLIZE * (lado.current === 'back' ? -1 : 1);

  /*
    As duas camadas são **absolutas**, sempre.

    Uma em fluxo e outra absoluta empilham diferente em cada lado: na web, o
    filho posicionado pinta por cima do filho em fluxo, então a tela que sai
    subiria na frente da que chega. Absolutas as duas, quem manda é a ordem em
    que aparecem aqui — igual no Android e no navegador.
  */
  const andaDe = (de: number, para: number) => [
    { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [de, para] }) },
  ];

  const fundo = { backgroundColor: colors.bg };

  return (
    <Animated.View
      /*
        A camada tem nome para poder ser medida.

        A queixa de "travada seca" só virou um número depois de dar para
        cravar esta view no navegador e ler a posição dela quadro a quadro.
        Sem o nome, a sonda pegava a sombra de um modal e media a coisa
        errada duas vezes seguidas.
      */
      testID="transicao-de-tela"
      style={[fundo, style ?? { flex: 1 }, { overflow: 'hidden' }]}
    >
      {saindo !== null && (
        <Animated.View
          key={String(saindo)}
          testID="transicao-que-sai"
          pointerEvents="none"
          renderToHardwareTextureAndroid={animando}
          style={[
            StyleSheet.absoluteFill,
            fundo,
            { transform: andaDe(0, -entrada * RECUO_DE_QUEM_SAI) },
          ]}
        >
          {noDeSaida.current}
        </Animated.View>
      )}
      <Animated.View
        key={String(transitionKey)}
        /* As duas camadas têm nome, e pelo mesmo motivo do `testID` de cima:
           é por ele que a sonda lê a posição quadro a quadro. Com o nome só
           na moldura, a medição dava zero quadros — a moldura não anda. */
        testID="transicao-que-entra"
        // Sem fundo próprio, o Android compõe a camada contra o vazio e os
        // elementos piscam pretos no primeiro quadro.
        // O hint de textura evita que o sistema recomponha a árvore a cada quadro.
        renderToHardwareTextureAndroid={animando}
        style={[StyleSheet.absoluteFill, fundo, { transform: andaDe(entrada, 0) }]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

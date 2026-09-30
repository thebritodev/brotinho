import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';

import { lacoDeIdaEVolta, lacoQueSoVai } from '../laco';
import { type Mood } from '../../theme';
import { ArDoBroto } from './ArDoBroto';
import {
  BULB_R,
  CX,
  LEAVES_BY_STAGE,
  POSES,
  STEM_TOP_Y,
  noQuadro,
  quadroDoBroto,
  type MexeAsFolhas,
  type Pose,
} from './geometriaDoBroto';
import {
  FolhaSolta,
  LADO_DA_FOLHA_SOLTA,
  Sprout,
  type Decoration,
  type SproutStage,
} from './Sprout';

/**
 * O broto reagindo à troca de humor: a planta dá uma balançada, como folha
 * pegando vento.
 *
 * **Havia um disco de fundo aqui, e ele foi embora.** Ele pintava a cor do
 * humor atrás do broto, e existia em duas camadas empilhadas justamente para
 * atravessar de uma cor à outra por opacidade — animar opacidade roda na
 * thread nativa; animar `fill` de SVG, não.
 *
 * O disco saiu depois de cinco tentativas de acertar a cor dele no tema
 * escuro, todas reprovadas por quem usa o app, e da constatação de que a cor
 * ali era o quarto lugar da mesma tela a dizer o humor — atrás da carinha do
 * broto, da carinha marcada e da palavra escolhida. Sem ele, some junto toda a
 * travessia: as duas camadas, a opacidade animada e o prazo de segurança que
 * garantia a cor certa se a animação não completasse.
 *
 * O que sobrou é o balanço, que nunca foi do disco: é a planta reagindo.
 */

/**
 * Respiração: uma escala lenta e contínua. O valor é de propósito quase
 * imperceptível — o objetivo é a tela não parecer congelada, não chamar
 * atenção para o broto.
 */
const BREATH_SCALE = 1.03;
const BREATH_IN_MS = 3400;
const BREATH_OUT_MS = 4200;

/** Oscilação que vai perdendo força, em graus. */
const SWAY = [0, 6, -4.5, 2.5, -1.2, 0];
const SWAY_STEP_MS = 110;

/**
 * A brisa: a planta viva, mexendo de leve o tempo todo.
 *
 * É outra coisa do balanço acima, e por isso mora noutro valor animado. Aquele
 * é **reação** — a planta levou um toque e responde, forte e amortecido. Este
 * é **estado**: ela está viva e o ar mexe com ela, sempre, quase nada.
 *
 * ## Os números são os do documento
 *
 * `@keyframes sway`: `0%,100% { rotate(-1.2deg) }`, `50% { rotate(1.2deg) }`,
 * nove segundos, `ease-in-out`, com origem em `50% 88%`.
 *
 * A amplitude e a origem são as do documento. **O ciclo não**: quatro
 * segundos em vez de nove, a pedido, depois de ver no aparelho — passou por
 * nove e por seis no caminho. Nove funciona numa página parada, onde a única
 * coisa que se move é o desenho; num telefone na mão, com o resto da tela
 * viva, lê como lentidão. Fica registrado que este é o único número aqui que
 * não vem do documento.
 *
 * São **±1,2 grau**. Eu tinha posto 2,5 e depois 3 — o dobro — porque estava
 * escolhendo no olho em vez de ler o documento.
 *
 * ## O laço, que estava quebrado
 *
 * A ida saía de 0 e chegava a 1; a volta ia de 1 a **-1**, na mesma duração.
 * Metade da distância no mesmo tempo da distância inteira: o movimento
 * acelerava de repente ao dobrar a esquina, toda vez. Era esse solavanco o
 * "cortado, sem laço perfeito" — e ele também explica por que nove segundos
 * pareceram arrasto: um movimento que engasga chama atenção para a lentidão.
 *
 * Agora vai de 0 a 1 e volta de 1 a 0, com a mesma distância nas duas metades
 * e as duas pontas no mesmo valor. A emenda deixa de existir, e a interpolação
 * faz 0 valer -1,2° e 1 valer +1,2°.
 */
const BAMBOLEIO_GRAUS = 1.2;
const BAMBOLEIO_MS = 4000;

/** Uma lista vazia, uma vez só — ver a nota homônima em `Sprout`. */
const VAZIO: number[] = [];

/**
 * Quais folhas da tabela do estágio entram no movimento de uma pose.
 *
 * As tabelas põem as folhas de baixo primeiro, nos índices 0 e 1, e as de cima
 * depois. Acenar é com a da frente; espreguiçar e comemorar são com as duas de
 * baixo, uma para cada lado.
 */
function folhasDaPose(quais: MexeAsFolhas['quais']): number[] {
  return quais === 'primeira' ? [0] : [0, 1];
}

/**
 * O giro de uma folha ao longo de um ciclo, em graus.
 *
 * `vaievem` é o aceno: duas idas por ciclo, porque uma ida só lê como folha
 * empurrada pelo vento em vez de cumprimento. Ver `POSES`.
 */
function giroDaFolha(folhas: MexeAsFolhas, indice: number) {
  const sentido = indice === 0 ? -1 : 1;
  const g = folhas.graus * sentido;
  return folhas.vaievem
    ? { entradas: [0, 0.25, 0.5, 0.75, 1], saidas: [0, g, -g * 0.14, g, 0] }
    : { entradas: [0, 0.5, 1], saidas: [0, g, 0] };
}

type Props = {
  mood: Mood;
  stage?: SproutStage;
  size?: number;
  decorations?: Decoration[];
  /** Balança uma vez ao aparecer, mesmo sem troca de humor. */
  swayOnMount?: boolean;
  /** Respiração contínua. Só faz sentido no broto grande, em tela parada. */
  breathe?: boolean;
  /**
   * Balança sempre que este valor muda (a primeira vez não conta).
   * Serve para o broto responder a um toque sem o pai precisar de timers.
   */
  swayOn?: string | number | null;
  /** A brisa contínua. Como a respiração, só no broto grande de tela parada. */
  bamboleia?: boolean;
  /**
   * O que ele está fazendo — ver `POSES`, em `geometriaDoBroto`.
   *
   * A pose traz o rosto (que o `Sprout` desenha) e o movimento (que é daqui):
   * a folha que acena, o pulo de quem comemora, o balanço lento de quem dorme
   * e o que flutua em volta.
   */
  pose?: Pose;
  /** Sem vaso: o broto plantado direto na terra das cenas. */
  showPot?: boolean;
};

export function AnimatedSprout({
  mood,
  stage = 2,
  size = 140,
  decorations = [],
  swayOnMount = false,
  breathe = false,
  swayOn = null,
  bamboleia = false,
  pose = 'parado',
  showPot = true,
}: Props) {
  const sway = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  /*
    A brisa tem valor próprio, e não divide o `sway`.

    Se dividissem, o balanço de reação zeraria a brisa no meio dela — ou pior,
    a brisa sobrescreveria a reação em curso. Separados, os dois giros se
    compõem na lista de `transform`, que é o que se quer: a planta responde ao
    toque **enquanto** continua ao vento.
  */
  const brisa = useRef(new Animated.Value(0)).current;
  /*
    O ciclo da pose: um valor só, de 0 a 1, para a folha e para o pulo.

    Os dois movimentos de uma pose são o mesmo movimento visto de dois lugares
    — o broto sobe **enquanto** as folhas batem —, e dois valores separados
    dariam a eles chance de sair de fase depois de alguns minutos rodando.
  */
  const cicloDaPose = useRef(new Animated.Value(0)).current;

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (alive) setReduceMotion(on);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  /** A oscilação amortecida, reutilizada pela troca de humor e pela entrada. */
  const balancar = () => {
    sway.setValue(0);
    Animated.sequence(
      SWAY.slice(1).map((_, i) =>
        Animated.timing(sway, {
          toValue: i + 1,
          duration: SWAY_STEP_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    ).start();
  };

  useEffect(() => {
    if (!breathe || reduceMotion) {
      breath.setValue(0);
      return;
    }
    // Inspirar é mais curto que expirar, como numa respiração calma de verdade.
    const laco = lacoDeIdaEVolta(breath, { ms: BREATH_IN_MS, msVolta: BREATH_OUT_MS });
    laco.start();
    return () => laco.stop();
  }, [breathe, reduceMotion]);

  const p = POSES[pose] ?? POSES.parado;
  const balancoDaPose = p.balanco ?? null;
  const grausDoBalanco = balancoDaPose?.graus ?? BAMBOLEIO_GRAUS;
  const msDoBalanco = balancoDaPose?.ms ?? BAMBOLEIO_MS;
  /*
    A pose que tem balanço próprio dispensa o pedido de brisa.

    Quem dorme pende devagar para um lado e volta — é o mesmo mecanismo da
    brisa com outros números, e não faz sentido a tela ter de pedir as duas
    coisas. `bamboleia` continua existindo para as poses que não trazem
    balanço nenhum.
  */
  const querBalanco = bamboleia || balancoDaPose !== null;

  const folhasDaAnimacao = p.folhas ? folhasDaPose(p.folhas.quais) : VAZIO;
  const temCicloDePose = (p.folhas || p.pulo) && !reduceMotion;

  useEffect(() => {
    if (!temCicloDePose) {
      cicloDaPose.setValue(0);
      return;
    }
    const ms = p.folhas?.ms ?? p.pulo?.ms ?? 1000;
    cicloDaPose.setValue(0);
    /*
      O ciclo vai de 0 a 1 e recomeça do zero, sem voltar animando.

      Cabe porque as duas curvas de folha terminam onde começaram — o aceno em
      cinco paradas, o resto em três —, então a volta a zero cai num ponto que
      já era zero e não aparece. Ver `giroDaFolha`.
    */
    const laco = lacoQueSoVai(cicloDaPose, { ms });
    laco.start();
    return () => laco.stop();
  }, [temCicloDePose, pose]);

  useEffect(() => {
    if (!querBalanco || reduceMotion) {
      brisa.setValue(0);
      return;
    }
    /*
      Meio segundo de atraso antes de começar: a tela ainda está entrando
      quando o componente monta, e duas animações estreando juntas fazem o
      broto parecer que tremeu em vez de que respirou.
    */
    const laco = lacoDeIdaEVolta(brisa, { ms: msDoBalanco });
    const id = setTimeout(() => laco.start(), 500);
    return () => {
      clearTimeout(id);
      laco.stop();
    };
  }, [querBalanco, msDoBalanco, reduceMotion]);

  /** Guarda o valor já visto, para não balançar na montagem. */
  const swayVisto = useRef(swayOn);
  useEffect(() => {
    if (swayVisto.current === swayOn) return;
    swayVisto.current = swayOn;
    if (swayOn === null || reduceMotion) return;
    balancar();
  }, [swayOn, reduceMotion]);

  useEffect(() => {
    if (!swayOnMount || reduceMotion) return;
    // Um respiro antes: a tela ainda está entrando quando o componente monta.
    const id = setTimeout(balancar, 260);
    return () => clearTimeout(id);
  }, [swayOnMount, reduceMotion]);

  /**
   * Balança quando o humor muda — e não na montagem.
   *
   * Era um `useState` com o humor anterior, porque a camada de baixo do disco
   * precisava dele para desaparecer. Sem disco, ninguém precisa do valor
   * antigo depois de comparar: uma referência basta, e não pede render.
   */
  const humorVisto = useRef(mood);
  useEffect(() => {
    if (humorVisto.current === mood) return;
    humorVisto.current = mood;
    if (reduceMotion) return;
    balancar();
  }, [mood, reduceMotion]);

  /*
    A moldura acompanha o quadro do broto.

    Ela reservava `size * 1,12` sempre, que é a altura da caixa com halo. Sem
    halo — o tema escuro, desde a correção do fundo — aquilo virava uma faixa
    vazia acima do broto, e ele descia para o meio da tela. Encolhendo a
    moldura junto, o broto sobe e continua do mesmo tamanho.
  */
  const quadro = quadroDoBroto(stage, size, {
    showPot,
    temEnfeite: decorations.length > 0,
  });

  const rotate = sway.interpolate({
    inputRange: SWAY.map((_, i) => i),
    outputRange: SWAY.map((deg) => `${deg}deg`),
  });

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, BREATH_SCALE] });

  /*
    O balanço de quem dorme pende para um lado só.

    A brisa vai de -1,2° a +1,2° porque é vento: ele empurra nas duas direções.
    Quem dorme não é empurrado, é quem pende — sai de zero, cai um pouco, e
    volta. Por isso a faixa começa em zero quando a pose traz balanço próprio.
  */
  const inclinacao = brisa.interpolate({
    inputRange: [0, 1],
    outputRange: balancoDaPose
      ? ['0deg', `${grausDoBalanco}deg`]
      : [`-${grausDoBalanco}deg`, `${grausDoBalanco}deg`],
  });

  /* O pulo de quem comemora, em pixels: a altura vem em unidades de desenho. */
  const pulo = p.pulo
    ? cicloDaPose.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, -p.pulo.altura * quadro.escala, 0],
      })
    : null;

  const centroDoBulbo = noQuadro(quadro, CX, STEM_TOP_Y[stage] - 4);
  /* O desenho é mais estreito que a moldura, e fica centrado dentro dela. */
  const recuo = (size - quadro.largura) / 2;

  /**
   * O corpo: uma passada só, ou três com a folha animada no meio.
   *
   * Quando nenhuma folha se mexe não há por que abrir o desenho em camadas —
   * são dois SVGs a mais para nada. A pose que mexe numa folha precisa dela
   * **entre** o corpo e a cabeça, porque é por trás da cabeça que ela passa.
   */
  const corpo =
    folhasDaAnimacao.length === 0 ? (
      <Sprout
        mood={mood}
        stage={stage}
        size={size}
        decorations={decorations}
        parte="planta"
        pose={pose}
        showPot={showPot}
      />
    ) : (
      <View style={{ width: quadro.largura, height: quadro.altura }}>
        <Sprout
          mood={mood}
          stage={stage}
          size={size}
          decorations={decorations}
          parte="atras"
          pose={pose}
          showPot={showPot}
          folhasSoltas={folhasDaAnimacao}
        />
        {folhasDaAnimacao.map((indice) => {
          const pe = noQuadro(quadro, LEAVES_BY_STAGE[stage][indice].x, LEAVES_BY_STAGE[stage][indice].y);
          const lado = LADO_DA_FOLHA_SOLTA * quadro.escala;
          const giro = giroDaFolha(p.folhas as MexeAsFolhas, indice);
          return (
            <Animated.View
              key={indice}
              testID="folha-que-mexe"
              style={{
                position: 'absolute',
                left: pe.x - lado / 2,
                top: pe.y - lado / 2,
                width: lado,
                height: lado,
                /*
                  O pé da folha está no centro deste quadro, que é a origem
                  padrão de rotação de uma `View` — é por isso que o quadro é
                  quadrado e centrado nela. Ver `FolhaSolta`.
                */
                transform: [
                  {
                    rotate: reduceMotion
                      ? '0deg'
                      : cicloDaPose.interpolate({
                          inputRange: giro.entradas,
                          outputRange: giro.saidas.map((g) => `${g}deg`),
                        }),
                  },
                ],
              }}
            >
              <FolhaSolta stage={stage} indice={indice} escala={quadro.escala} />
            </Animated.View>
          );
        })}
        <View style={{ position: 'absolute', left: 0, top: 0 }}>
          <Sprout
            mood={mood}
            stage={stage}
            size={size}
            decorations={decorations}
            parte="cabeca"
            pose={pose}
            showPot={showPot}
          />
        </View>
      </View>
    );

  return (
    <View style={{ width: size, height: quadro.altura }}>
      {/*
        A sombra sai antes, e fica de fora do giro.

        Ela é projetada pelo vaso no chão, e chão não balança. Desenhada junto
        com a planta, girava com ela: o vaso parado e a mancha embaixo indo de
        um lado para o outro.

        As duas passadas usam a mesma `viewBox` e o mesmo tamanho, então se
        sobrepõem exatamente — não há posição para acertar à mão.
      */}
      {showPot && (
        <View
          style={{ position: 'absolute', width: size, alignItems: 'center', pointerEvents: 'none' }}
        >
          <Sprout mood={mood} stage={stage} size={size} decorations={decorations} parte="sombra" />
        </View>
      )}

      <Animated.View
        style={{
          /*
            Centrado, porque o desenho é mais estreito que a moldura.

            A moldura tem a largura de `size`, que é o tamanho pedido por quem
            chama; o desenho fecha em volta da planta e do vaso, e sobra espaço
            dos lados. Sem centrar ele grudava na borda esquerda, com meio broto
            para fora da tela.
          */
          width: size,
          alignItems: 'center',
          /*
            Origem em `50% 88%`, como no documento — e não na base.

            Girar pelo pé faz a planta parecer presa ao chão, o que é certo;
            mas 100% da altura é a borda de baixo do **quadro**, que fica um
            pouco abaixo do vaso. Girando dali, o vaso descreve um arco visível
            em vez de ficar plantado. Em 88% o eixo cai dentro do próprio vaso.
          */
          transformOrigin: '50% 88%',
          // Girar e crescer a partir do pé: o vaso fica parado no chão.
          transform: pulo
            ? [{ translateY: pulo }, { rotate }, { rotate: inclinacao }, { scale }]
            : [{ rotate }, { rotate: inclinacao }, { scale }],
        }}
      >
        {corpo}
      </Animated.View>

      {/*
        O que flutua em volta fica **fora** do giro, e é de propósito.

        Os zês saem da cabeça de quem dorme, mas sobem retos: presos ao grupo
        que balança, eles iriam junto de um lado para o outro, como se o sono
        também pendesse. Os brilhos, pelo mesmo motivo, não pulam com o broto.
      */}
      {p.ar && (
        <ArDoBroto
          ar={p.ar}
          centro={{ x: recuo + centroDoBulbo.x, y: centroDoBulbo.y }}
          raio={BULB_R[stage]}
          escala={quadro.escala}
        />
      )}
    </View>
  );
}

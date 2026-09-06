import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';

import { type Mood } from '../../theme';
import { caixaDoMascote, medidasDoMascote } from './geometriaDoBroto';
import { Sprout, type Decoration, type SproutStage } from './Sprout';

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
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: BREATH_IN_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: BREATH_OUT_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    laco.start();
    return () => laco.stop();
  }, [breathe, reduceMotion]);

  useEffect(() => {
    if (!bamboleia || reduceMotion) {
      brisa.setValue(0);
      return;
    }
    /*
      Meio segundo de atraso antes de começar: a tela ainda está entrando
      quando o componente monta, e duas animações estreando juntas fazem o
      broto parecer que tremeu em vez de que respirou.
    */
    const meia = (para: number) =>
      Animated.timing(brisa, {
        toValue: para,
        duration: BAMBOLEIO_MS / 2,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const laco = Animated.loop(Animated.sequence([meia(1), meia(0)]));
    const id = setTimeout(() => laco.start(), 500);
    return () => {
      clearTimeout(id);
      laco.stop();
    };
  }, [bamboleia, reduceMotion]);

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
  const quadro = medidasDoMascote(caixaDoMascote(stage, decorations.length > 0), size);

  const rotate = sway.interpolate({
    inputRange: SWAY.map((_, i) => i),
    outputRange: SWAY.map((deg) => `${deg}deg`),
  });

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, BREATH_SCALE] });

  const inclinacao = brisa.interpolate({
    inputRange: [0, 1],
    outputRange: [`-${BAMBOLEIO_GRAUS}deg`, `${BAMBOLEIO_GRAUS}deg`],
  });

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
      <View
        style={{ position: 'absolute', width: size, alignItems: 'center', pointerEvents: 'none' }}
      >
        <Sprout mood={mood} stage={stage} size={size} decorations={decorations} parte="sombra" />
      </View>

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
          transform: [{ rotate }, { rotate: inclinacao }, { scale }],
        }}
      >
        <Sprout
          mood={mood}
          stage={stage}
          size={size}
          decorations={decorations}
          parte="planta"
        />
      </Animated.View>
    </View>
  );
}

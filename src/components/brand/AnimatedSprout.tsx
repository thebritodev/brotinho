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
};

export function AnimatedSprout({
  mood,
  stage = 2,
  size = 140,
  decorations = [],
  swayOnMount = false,
  breathe = false,
  swayOn = null,
}: Props) {
  const sway = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

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

  return (
    <View style={{ width: size, height: quadro.altura }}>
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
          // O caule nasce na base: girar pelo pé é o que faz parecer planta,
          // e não um adesivo rodando no meio.
          transformOrigin: 'center bottom',
          // Girar e crescer a partir do pé: o vaso fica parado no chão.
          transform: [{ rotate }, { scale }],
        }}
      >
        <Sprout mood={mood} stage={stage} size={size} decorations={decorations} />
      </Animated.View>
    </View>
  );
}

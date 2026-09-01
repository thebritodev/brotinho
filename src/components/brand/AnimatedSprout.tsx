import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';

import { type Mood, useTema } from '../../theme';
import { Sprout, type Decoration, type SproutStage } from './Sprout';

/**
 * Uma camada do halo. No escuro nao ha halo — ver o comentario de `Sprout`.
 */
function CamadaDoHalo({ mood, lado }: { mood: Mood; lado: number }) {
  const { moodColorsFundo, tema } = useTema();
  if (tema === 'escuro') return null;
  return (
    <View
      style={{
        width: lado,
        height: lado,
        borderRadius: lado / 2,
        backgroundColor: moodColorsFundo[mood],
      }}
    />
  );
}

/**
 * O broto reagindo à troca de humor: o disco de fundo faz a transição de cor
 * e a planta dá uma balançada, como folha pegando vento.
 *
 * O disco de fundo sai de dentro do SVG e vira duas Views empilhadas — a de
 * baixo com a cor anterior, a de cima com a nova aparecendo por opacidade.
 * Animar opacidade roda na thread nativa; animar `fill` de SVG, não.
 */

/** Proporções do círculo original dentro da viewBox 200x220 do Sprout. */
const CIRCLE_RATIO = 0.96;
const CIRCLE_OFFSET = 0.02;

const FADE_MS = 520;

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
  /** Desliga o disco de fundo, para telas que não querem a cor do humor. */
  showBg?: boolean;
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
  showBg = true,
  swayOnMount = false,
  breathe = false,
  swayOn = null,
}: Props) {
  /** Cor que fica por baixo enquanto a nova entra. */
  const [previous, setPrevious] = useState<Mood>(mood);
  const [current, setCurrent] = useState<Mood>(mood);

  const fade = useRef(new Animated.Value(1)).current;
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

  /**
   * Iguala as duas camadas na cor nova. Chamado no fim da transição e também
   * por um prazo de segurança: se a animação não completar, a cor certa
   * precisa aparecer do mesmo jeito.
   */
  const settle = () => {
    setPrevious(mood);
    fade.setValue(1);
  };

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

  useEffect(() => {
    if (mood === current) return;

    setPrevious(current);
    setCurrent(mood);
    fade.setValue(0);

    if (reduceMotion) {
      // Quem pediu menos movimento ainda vê a cor trocar, só que sem balanço.
      fade.setValue(1);
      return;
    }

    Animated.timing(fade, {
      toValue: 1,
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => settle());

    balancar();

    const seguranca = setTimeout(settle, FADE_MS + 300);
    return () => clearTimeout(seguranca);
  }, [mood]);

  const diameter = size * CIRCLE_RATIO;
  const offset = size * CIRCLE_OFFSET;

  const rotate = sway.interpolate({
    inputRange: SWAY.map((_, i) => i),
    outputRange: SWAY.map((deg) => `${deg}deg`),
  });

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, BREATH_SCALE] });

  return (
    <View style={{ width: size, height: size * 1.12 }}>
      {showBg && (
        /*
          Duas camadas, pela travessia entre humores: a de baixo é o humor
          anterior, a de cima entra por opacidade. O que cada camada desenha
          depende do tema — ver `CamadaDoHalo`, e o comentário longo em
          `Sprout`.
        */
        <View>
          <View style={{ position: 'absolute', left: offset, top: offset }}>
            <CamadaDoHalo mood={previous} lado={diameter} />
          </View>
          <Animated.View style={{ position: 'absolute', left: offset, top: offset, opacity: fade }}>
            <CamadaDoHalo mood={current} lado={diameter} />
          </Animated.View>
        </View>
      )}

      {/* A planta balança; o disco de fundo fica parado. */}
      <Animated.View
        style={{
          /*
            Centrado aqui, e não na moldura de fora.

            O desenho ficou mais estreito que a moldura onde não há halo — a
            caixa fecha em volta da planta e do vaso —, e sem centrar ele grudava
            na borda esquerda, com meio broto para fora da tela.

            A primeira tentativa pôs `alignItems: 'center'` na moldura, e isso
            empurrou o halo duzentos pixels para a direita: ele é filho absoluto
            com `left`, e no Yoga o alinhamento do pai ainda o alcança. Centrar
            só esta camada deixa o halo exatamente onde sempre esteve.
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
        {/*
          `showBg={false}` porque o halo é desenhado aqui em camadas, e
          `molduraDoHalo` para o enquadramento saber que ele existe mesmo
          assim — as duas coisas são diferentes, ver `Sprout`.
        */}
        <Sprout
          mood={current}
          stage={stage}
          size={size}
          decorations={decorations}
          showBg={false}
          molduraDoHalo={showBg}
        />
      </Animated.View>
    </View>
  );
}

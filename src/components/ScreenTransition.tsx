import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

import { useTema } from '../theme';

/**
 * Transicao entre telas: o conteudo novo entra suave em vez de aparecer seco.
 *
 * Trocar `transitionKey` dispara a animacao. Como o React remonta o conteudo
 * quando a chave muda, o componente pai deve passar a mesma chave que usa para
 * decidir o que renderizar.
 */

const DURATION = 260;

/** Distancia do deslize lateral, em pixels. */
const SLIDE = 26;

export type TransitionMode =
  /** Entra da direita: avancar para dentro de algo. */
  | 'forward'
  /** Entra da esquerda: voltar. */
  | 'back'
  /** So aparece, com um leve crescer. Bom para troca de abas. */
  | 'fade';

type Props = {
  transitionKey: string | number;
  mode?: TransitionMode;
  /** Substitui o `flex: 1` padrão — telas dentro de ScrollView precisam disso. */
  style?: StyleProp<ViewStyle>;
  /**
   * Não anima a primeira tela, só as trocas depois dela.
   *
   * Para quando quem está em volta já anima a chegada — a `CamadaEmpilhada`
   * desliza a tela para dentro, e esta, animando junto, somava um segundo
   * esmaecer por cima do primeiro.
   */
  semEntrada?: boolean;
  children: React.ReactNode;
};

export function ScreenTransition({
  transitionKey,
  mode = 'fade',
  style,
  semEntrada = false,
  children,
}: Props) {
  const { colors } = useTema();
  const t = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  /** Camada de hardware só enquanto anima: manter ligada custa memória à toa. */
  const [animando, setAnimando] = useState(false);

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

  /*
    `useLayoutEffect`, e nao `useEffect`.

    `useEffect` roda **depois** da pintura: existe um quadro em que a tela
    nova ja foi desenhada com o `t` que sobrou da transicao anterior, que e 1
    -- ou seja, inteira -- e so entao ela salta para zero e comeca a aparecer.
    Num aparelho rapido isso e um piscar; num lento e a tela nova piscando
    antes de entrar.
  */
  /** A primeira chave já passou por aqui? Ver `semEntrada`. */
  const primeira = useRef(true);

  useLayoutEffect(() => {
    const estreia = primeira.current;
    primeira.current = false;
    if (reduceMotion || (semEntrada && estreia)) {
      t.setValue(1);
      return;
    }

    t.setValue(0);
    setAnimando(true);
    Animated.timing(t, {
      toValue: 1,
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setAnimando(false));

    // Rede de segurança: se a animação não completar, a tela não pode ficar
    // invisível. O conteúdo aparece de qualquer jeito.
    const seguranca = setTimeout(() => {
      t.setValue(1);
      setAnimando(false);
    }, DURATION + 250);
    return () => clearTimeout(seguranca);
  }, [transitionKey, reduceMotion]);

  const inicio = mode === 'forward' ? SLIDE : mode === 'back' ? -SLIDE : 0;

  const transform =
    mode === 'fade'
      ? [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) }]
      : [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [inicio, 0] }) }];

  return (
    <Animated.View
      /*
        A camada tem nome para poder ser medida.

        A queixa de "travada seca" só virou um número depois de dar para
        cravar esta view no navegador e ler a opacidade dela quadro a quadro.
        Sem o nome, a sonda pegava a sombra de um modal e media a coisa
        errada duas vezes seguidas.
      */
      testID="transicao-de-tela"
      // Sem fundo próprio, o Android compõe a transparência contra o vazio e
      // os elementos piscam pretos no primeiro quadro. Com o creme do app,
      // qualquer artefato aparece na cor certa.
      // O hint de textura evita que o sistema recomponha a árvore a cada quadro.
      renderToHardwareTextureAndroid={animando}
      style={[{ backgroundColor: colors.bg }, style ?? { flex: 1 }, { opacity: t, transform }]}
    >
      {children}
    </Animated.View>
  );
}

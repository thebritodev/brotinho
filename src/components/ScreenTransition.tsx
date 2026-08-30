import React, { useEffect, useRef, useState } from 'react';
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
  children: React.ReactNode;
};

export function ScreenTransition({ transitionKey, mode = 'fade', style, children }: Props) {
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

  useEffect(() => {
    if (reduceMotion) {
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

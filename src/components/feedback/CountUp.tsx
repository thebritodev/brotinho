import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleProp, Text, TextStyle } from 'react-native';

/** Subida inicial, ao abrir a tela. */
const ENTRADA_MS = 900;
/** Ajuste depois, quando um novo registro muda o número. */
const AJUSTE_MS = 400;

/**
 * CountUp — o número sobe de zero até o valor ao aparecer.
 *
 * Usa o driver de JS de propósito: o texto precisa do número a cada quadro
 * para se redesenhar, e o driver nativo não devolve o valor ao JS. São três
 * números por tela durante menos de um segundo, então o custo é baixo.
 */
export function CountUp({
  value,
  style,
  maxFontSizeMultiplier,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
  /** Repassado ao Text: quem usa o CountUp sabe se o espaço é apertado. */
  maxFontSizeMultiplier?: number;
}) {
  const [shown, setShown] = useState(value);
  const progress = useRef(new Animated.Value(value)).current;
  const jaEntrou = useRef(false);

  useEffect(() => {
    const id = progress.addListener(({ value: v }) => setShown(Math.round(v)));
    return () => progress.removeListener(id);
  }, []);

  useEffect(() => {
    let vivo = true;
    let seguranca: ReturnType<typeof setTimeout> | undefined;

    const rodar = (menosMovimento: boolean) => {
      if (!vivo) return;

      // Contar de zero até zero não é animação nenhuma, só um piscar.
      if (menosMovimento || value === 0) {
        progress.setValue(value);
        setShown(value);
        return;
      }

      const primeira = !jaEntrou.current;
      jaEntrou.current = true;
      if (primeira) progress.setValue(0);

      const duracao = primeira ? ENTRADA_MS : AJUSTE_MS;

      Animated.timing(progress, {
        toValue: value,
        duration: duracao,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        // O número final é escrito à mão: se a animação parar no meio, o que
        // fica na tela tem que ser o valor certo, não onde ela parou.
        if (vivo) setShown(value);
      });

      // Rede de segurança: uma animação que não roda deixaria o número em
      // zero para sempre — e aqui zero é uma informação errada, não um enfeite
      // faltando. Passado o prazo, o valor certo aparece de qualquer jeito.
      seguranca = setTimeout(() => {
        if (!vivo) return;
        progress.setValue(value);
        setShown(value);
      }, duracao + 250);
    };

    // Se a consulta de acessibilidade falhar, anima — melhor que ficar em zero.
    AccessibilityInfo.isReduceMotionEnabled().then(rodar, () => rodar(false));

    return () => {
      vivo = false;
      if (seguranca) clearTimeout(seguranca);
    };
  }, [value]);

  return (
    <Text maxFontSizeMultiplier={maxFontSizeMultiplier} style={style}>
      {shown}
    </Text>
  );
}

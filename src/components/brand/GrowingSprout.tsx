import React, { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import type { SproutStage } from './Sprout';
import { AnimatedSprout } from './AnimatedSprout';

/**
 * GrowingSprout — o broto passa do estágio 1 ao 3 na frente da pessoa.
 *
 * É a promessa do app acontecendo uma vez, ao vivo, antes de ela pagar por
 * isso. Cada salto balança as folhas, então o crescimento tem peso em vez de
 * simplesmente trocar de desenho.
 */

/** Espera antes de começar, para a tela terminar de entrar. */
const ATRASO_INICIAL = 620;
/** Intervalo entre um estágio e o seguinte. */
const PASSO_MS = 900;

export function GrowingSprout({ size }: { size: number }) {
  const [stage, setStage] = useState<SproutStage>(1);

  useEffect(() => {
    let vivo = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    void AccessibilityInfo.isReduceMotionEnabled().then((menosMovimento) => {
      if (!vivo) return;
      // Quem pediu menos movimento vê o broto já crescido, sem a encenação.
      if (menosMovimento) return setStage(3);

      timers.push(setTimeout(() => vivo && setStage(2), ATRASO_INICIAL));
      timers.push(setTimeout(() => vivo && setStage(3), ATRASO_INICIAL + PASSO_MS));
    });

    return () => {
      vivo = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <AnimatedSprout
      mood="feliz"
      stage={stage}
      size={size}
      showBg={false}
      breathe
      // Cada salto de estágio dispara a balançada.
      swayOn={stage}
    />
  );
}

import React, { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import type { SproutStage } from './Sprout';
import { AnimatedSprout } from './AnimatedSprout';

/**
 * GrowingSprout — o broto cresce na frente da pessoa, um estágio por vez.
 *
 * É a promessa do app acontecendo ao vivo. Cada salto balança as folhas, então
 * o crescimento tem peso em vez de simplesmente trocar de desenho.
 *
 * Nasceu para o onboarding, onde vai até o estágio 3. Passou a servir também às
 * telas de conclusão da Composta e das práticas, que antes mostravam um desenho
 * parado entrando por fade — o broto **aparecia** pronto em vez de **chegar**.
 * A prática termina onde o desenho termina, e é o único instante do app em que
 * a recompensa pode ser vista acontecendo.
 *
 * As práticas param no estágio 2 de propósito: fazer um exercício de cinco
 * minutos não é a mesma conquista que compostar um pensamento, e o desenho não
 * deve dizer que é.
 */

/** Espera antes de começar, para a tela terminar de entrar. */
const ATRASO_INICIAL = 620;
/** Intervalo entre um estágio e o seguinte. */
const PASSO_MS = 900;

export function GrowingSprout({ size, ate = 3 }: { size: number; ate?: SproutStage }) {
  const [stage, setStage] = useState<SproutStage>(1);

  useEffect(() => {
    let vivo = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    void AccessibilityInfo.isReduceMotionEnabled().then((menosMovimento) => {
      if (!vivo) return;
      // Quem pediu menos movimento vê o broto já crescido, sem a encenação.
      if (menosMovimento) return setStage(ate);

      // Um passo por estágio até o alvo: 1→2→3, ou só 1→2 quando o alvo é 2.
      for (let s = 2; s <= ate; s += 1) {
        const destino = s as SproutStage;
        timers.push(
          setTimeout(() => vivo && setStage(destino), ATRASO_INICIAL + (s - 2) * PASSO_MS),
        );
      }
    });

    return () => {
      vivo = false;
      timers.forEach(clearTimeout);
    };
  }, [ate]);

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

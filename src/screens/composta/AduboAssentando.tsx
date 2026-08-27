import React, { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

import { palette, fonts } from '../../theme';

/**
 * As palavras da frase assentando na terra, na tela de conclusão.
 *
 * A tela diz, em texto, que "a frase perdeu o significado e virou adubo" — e
 * mostrava um desenho parado. Aqui a frase faz isso: as palavras que estavam
 * caindo durante a prática descem uma última vez, param no pé do vaso e viram
 * textura.
 *
 * **Elas terminam ilegíveis, e isso é o ponto.** O pensamento que a pessoa
 * repetiu até esvaziar é justamente o que não deve continuar legível na tela
 * que celebra tê-lo esvaziado. Por isso o repouso é em opacidade baixa,
 * sobrepostas e tortas: lê-se matéria orgânica, não texto.
 *
 * Nada aqui é anunciado por leitor de tela: é decoração, e o significado já
 * está dito na frase acima do desenho.
 */

/** Mais que isso vira sopa de letras em vez de terra. */
const MAX_PALAVRAS = 7;
/** Cada palavra sai um pouco depois da anterior. */
const ATRASO_ENTRE = 130;
const ATRASO_INICIAL = 420;
const QUEDA_MS = 900;
/** Onde a palavra descansa: baixa o bastante para ler como chão. */
const OPACIDADE_FINAL = 0.22;

type Semente = {
  texto: string;
  /** Posição horizontal, em % da largura. */
  x: number;
  giro: number;
  tamanho: number;
  atraso: number;
};

function Palavra({ semente, animar }: { semente: Semente; animar: boolean }) {
  const t = useRef(new Animated.Value(animar ? 0 : 1)).current;

  useEffect(() => {
    if (!animar) return;
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: QUEDA_MS,
      delay: semente.atraso,
      // Desacelera no fim: a palavra pousa, não bate.
      easing: Easing.bezier(0.22, 0.6, 0.3, 1),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [animar, semente.atraso, t]);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: `${semente.x}%`,
        bottom: 0,
        fontFamily: fonts.body.bold,
        fontSize: semente.tamanho,
        color: palette.brown400,
        opacity: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.5, OPACIDADE_FINAL] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-70, 0] }) },
          { rotate: `${semente.giro}deg` },
        ],
      }}
    >
      {semente.texto}
    </Animated.Text>
  );
}

export function AduboAssentando({ frase }: { frase: string }) {
  const [animar, setAnimar] = React.useState<boolean | null>(null);

  useEffect(() => {
    let vivo = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      // Quem pediu menos movimento vê o adubo já assentado, sem a queda.
      .then((menos) => vivo && setAnimar(!menos))
      .catch(() => vivo && setAnimar(false));
    return () => {
      vivo = false;
    };
  }, []);

  const sementes = useMemo<Semente[]>(() => {
    const palavras = frase.split(/\s+/).filter(Boolean).slice(0, MAX_PALAVRAS);
    return palavras.map((texto, i) => ({
      texto,
      // Espalha ao longo da largura sem encostar nas bordas, e sem sorteio: a
      // tela não pode mudar de desenho se ela for redesenhada.
      //
      // O teto é 72% e não 90% porque `left` posiciona o começo da palavra: a
      // última precisa caber inteira à direita dali, senão sai da tela.
      x: 6 + (i * 66) / Math.max(1, palavras.length - 1 || 1),
      giro: i % 2 === 0 ? -7 + (i % 3) * 4 : 6 - (i % 3) * 3,
      tamanho: 12 + (i % 3),
      atraso: ATRASO_INICIAL + i * ATRASO_ENTRE,
    }));
  }, [frase]);

  // Enquanto a preferência de movimento não respondeu, não desenha nada: meio
  // segundo sem adubo é melhor do que a queda começando duas vezes.
  if (animar === null || !sementes.length) return null;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {sementes.map((s) => (
        <Palavra key={`${s.texto}-${s.x}`} semente={s} animar={animar} />
      ))}
    </View>
  );
}

import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, Text, View } from 'react-native';

import { pedirAvaliacaoNaColheita } from '../../services/pedirAvaliacao';
import { toqueDeConclusao } from '../../services/toque';
import { useAppState } from '../../state/AppStateProvider';
import { fonts, radius, useTema } from '../../theme';
import type { Plant } from '../../state/types';
import { Button } from '../core/Button';
import { ehEnfeite, Sprout } from './Sprout';
import { VALUES, type ValueKey } from './ValueBadge';

/**
 * O momento em que uma planta amadurece e vai para o jardim.
 *
 * Sem isto a colheita acontecia em silêncio: a pessoa abria o app e o broto
 * que ela criou por três semanas tinha virado uma mudinha de novo, sem
 * explicação. Isso lê como perda de dado, não como conquista — e era
 * justamente o momento mais importante do ciclo.
 *
 * O tom não é de troféu. A planta não é prêmio por desempenho: é o registro de
 * um período, e o texto fala dele.
 */
export function HarvestNotice({
  planta,
  onClose,
}: {
  planta: Plant;
  onClose: () => void;
}) {
  const { colors, moodColors, palette, shadows } = useTema();
  const { data } = useAppState();
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Três semanas de cuidado terminando: se algo merece a vibração de
    // conclusão neste app, é isto.
    toqueDeConclusao(data.settings.vibracao);

    /*
      E é o único lugar do app onde cabe pedir uma avaliação na loja.

      A recomendação padrão — "peça depois de uma ação concluída" — não serve
      aqui: a Composta também termina em conclusão, e ali a pessoa acabou de
      dizer em voz alta o pensamento que mais a machuca. O porquê completo está
      em `services/pedirAvaliacao.ts`.

      Vai com atraso para não competir com a animação da planta chegando.
    */
    const id = setTimeout(() => void pedirAvaliacaoNaColheita(), 2600);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((menosMovimento) => {
      if (menosMovimento) return entrada.setValue(1);
      Animated.timing(entrada, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const valor = VALUES[planta.valor as ValueKey];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 26,
        backgroundColor: 'rgba(58, 54, 48, 0.45)',
        opacity: entrada,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        onPress={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Animated.View
        style={{
          width: '100%',
          alignItems: 'center',
          gap: 14,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          paddingVertical: 28,
          paddingHorizontal: 24,
          ...shadows.lg,
          transform: [
            { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
            { scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          ],
        }}
      >
        <View
          style={{
            width: 132,
            height: 132,
            borderRadius: 66,
            backgroundColor: planta.mood ? moodColors[planta.mood] : palette.cream200,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sprout
            mood={planta.mood ?? 'feliz'}
            stage={3}
            size={116}
            showBg={false}
            showPot={false}
            decorations={ehEnfeite(planta.valor) ? [planta.valor] : []}
          />
        </View>

        <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.bold, fontSize: 23, textAlign: 'center' }}>
          Esta planta cresceu
        </Text>

        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.55,
            color: palette.brown700,
            textAlign: 'center',
          }}
        >
          {planta.dias} dias em que você apareceu
          {valor ? `, e ${valor.label.toLowerCase()} foi o que mais apareceu no que você escreveu` : ''}.
          Ela fica guardada no seu jardim.
        </Text>

        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 14,
            lineHeight: 14 * 1.5,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Um broto novo começa agora. Não é recomeçar do zero — é a próxima estação.
        </Text>

        <Button onPress={onClose} style={{ marginTop: 4 }}>
          Ver meu jardim
        </Button>
      </Animated.View>
    </Animated.View>
  );
}

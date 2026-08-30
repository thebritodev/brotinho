import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { fonts, useTema, type Mood } from '../../theme';
import { MoodFace } from './MoodFace';

/**
 * A cor saiu daqui.
 *
 * A tabela guardava `tint: moodColors.feliz`, resolvido uma vez na carga do
 * módulo — o que congelaria a lista no tema com que o app abriu. Quem precisa
 * da cor lê `moodColors[key]`, que já é indexado por esta mesma chave.
 */
export const MOODS: { key: Mood; label: string }[] = [
  { key: 'feliz', label: 'Feliz' },
  { key: 'leve', label: 'Leve' },
  { key: 'ansioso', label: 'Ansioso' },
  { key: 'cansado', label: 'Cansado' },
  { key: 'triste', label: 'Triste' },
];

/** Quanto a carinha escolhida cresce em relacao as outras. */
const SELECTED_SCALE = 1.12;

type ItemProps = {
  mood: Mood;
  label: string;
  selected: boolean;
  size: number;
  onPress: () => void;
};

function MoodItem({ mood, label, selected, size, onPress }: ItemProps) {
  const { colors } = useTema();
  const escala = useRef(new Animated.Value(selected ? SELECTED_SCALE : 1)).current;

  /** Mola: cresce um pouco alem do alvo e assenta. Da vida ao toque. */
  const pular = (para: number) => {
    Animated.spring(escala, {
      toValue: para,
      friction: 4,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    pular(selected ? SELECTED_SCALE : 1);
  }, [selected]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => pular(0.88)}
      onPressOut={() => pular(selected ? SELECTED_SCALE : 1)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={{ alignItems: 'center', gap: 6, minWidth: 56 }}
    >
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <MoodFace mood={mood} size={size} selected={selected} />
      </Animated.View>
      <Text
        // Cinco colunas lado a lado: num aparelho estreito o rótulo ampliado
        // empurra os vizinhos para fora da tela.
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
        style={{
          fontFamily: selected ? fonts.body.extraBold : fonts.body.bold,
          fontSize: 12,
          color: selected ? colors.primaryStrong : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type Props = {
  value: Mood;
  onChange?: (mood: Mood) => void;
  /** Tamanho das carinhas; a Home usa maior que o resto do app. */
  faceSize?: number;
};

/** MoodSelector — as cinco carinhas; escolher uma muda o rosto do broto. */
export function MoodSelector({ value, onChange, faceSize = 48 }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
      }}
    >
      {MOODS.map((m) => (
        <MoodItem
          key={m.key}
          mood={m.key}
          label={m.label}
          selected={value === m.key}
          size={faceSize}
          onPress={() => onChange?.(m.key)}
        />
      ))}
    </View>
  );
}

import React, { useState } from 'react';
import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';

import { Button, Chip } from '../../components';
import { radius, fonts, useTema, type Cores, type Sombras } from '../../theme';
import { TimeWheel } from './TimeWheel';

/**
 * Cartão branco padrão das telas de onboarding.
 *
 * Virou função porque o objeto no topo do arquivo era montado uma vez, na
 * carga do módulo, e ficaria com a cor do tema de abertura para sempre.
 */
export const cardStyle = (colors: Cores, shadows: Sombras) =>
  ({
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.sm,
  }) as const;

type OptionListProps = {
  items: string[];
  /** string para escolha única, string[] para múltipla. */
  value: string | string[] | null;
  onPick: (label: string) => void;
  /** Layout em pílulas que quebram linha, em vez de linhas empilhadas. */
  wrap?: boolean;
  multi?: boolean;
};

export function OptionList({ items, value, onPick, wrap, multi }: OptionListProps) {
  const { colors } = useTema();
  const isSelected = (label: string) =>
    multi ? Array.isArray(value) && value.includes(label) : value === label;

  return (
    <View
      style={{
        flexDirection: wrap ? 'row' : 'column',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        gap: 6,
      }}
    >
      {items.map((label) => {
        const selected = isSelected(label);
        return (
          <Chip
            key={label}
            selected={selected}
            tint={selected ? colors.primarySoft : colors.surface}
            onPress={() => onPick(label)}
            // O tamanho vem daqui, e não do Chip: ele também é usado na
            // Composta e em Meus valores, que não querem botões desta altura.
            style={
              wrap
                ? { paddingVertical: 13, paddingHorizontal: 18 }
                : { width: '100%', alignItems: 'flex-start', paddingVertical: 18, paddingHorizontal: 18 }
            }
            textStyle={
              wrap ? { fontSize: 15 } : { fontSize: 16, lineHeight: 16 * 1.35 }
            }
          >
            {label}
          </Chip>
        );
      })}
    </View>
  );
}

/** Envolve o conteúdo centrado na vertical, com respiro entre os blocos. */
export function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', gap: 18, paddingVertical: 8 }}>{children}</View>
  );
}

type TimeFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
};

/** Linha "Lembrete diário — 21:00" que abre a roda de horário em um modal. */
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const { colors, shadows } = useTema();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={{
          ...cardStyle(colors, shadows),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          width: '100%',
          paddingVertical: 16,
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ fontFamily: fonts.body.bold, fontSize: 15 }}>{label}</Text>
        <Text
          style={{ fontFamily: fonts.display.bold, fontSize: 22, color: colors.primaryStrong }}
        >
          {value}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* Fundo como irmão: envolver a roda num Pressable roubaria o arrasto. */}
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => setOpen(false)}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.4)' }]}
          />
          <View style={{ gap: 12 }}>
            <TimeWheel value={value} onChange={onChange} />
            <Button variant="primary" onPress={() => setOpen(false)}>
              Pronto
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}

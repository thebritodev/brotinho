import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderWidth, useTema } from '../../theme';
import { BrotinhoMark, MARK_PEACH } from '../brand/BrotinhoMark';
import { Icon, type IconName } from '../core/Icon';

export type TabKey = 'home' | 'diario' | 'perfil';

/** Quanto o botão do meio sobe acima da faixa. */
const RAISE = 22;
const CENTER_SIZE = 64;

type SideTab = { key: Exclude<TabKey, 'home'>; label: string; icon: IconName };

const LEFT: SideTab = { key: 'diario', label: 'Diário', icon: 'book' };
const RIGHT: SideTab = { key: 'perfil', label: 'Perfil', icon: 'user' };

type Props = {
  active?: TabKey;
  onChange?: (tab: TabKey) => void;
};

/**
 * BottomNav — três destinos, só ícones.
 *
 * Sem rótulos, o único sinal de qual aba está aberta é a cor; por isso os
 * `accessibilityLabel` são obrigatórios, senão quem usa leitor de tela fica
 * sem nada para ouvir.
 */
export function BottomNav({ active = 'home', onChange }: Props) {
  const { colors, shadows } = useTema();
  const insets = useSafeAreaInsets();

  const lateral = (t: SideTab) => {
    const ativa = active === t.key;
    return (
      <Pressable
        key={t.key}
        accessibilityRole="tab"
        accessibilityLabel={t.label}
        accessibilityState={{ selected: ativa }}
        onPress={() => onChange?.(t.key)}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 }}
      >
        <Icon
          name={t.icon}
          size={26}
          color={ativa ? colors.primaryStrong : colors.textSecondary}
          strokeWidth={ativa ? 2.4 : 2}
        />
      </Pressable>
    );
  };

  return (
    // O espaço de cima é transparente e existe só para o botão central subir
    // sem sair dos limites do pai — no Android o que vaza pode ser cortado.
    <View style={{ paddingTop: RAISE }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 10,
          paddingBottom: 10 + insets.bottom,
          backgroundColor: colors.surface,
          borderTopWidth: borderWidth,
          borderTopColor: colors.border,
        }}
      >
        {lateral(LEFT)}
        {/* Lugar reservado para o botão central, que é posicionado por cima. */}
        <View style={{ width: CENTER_SIZE }} />
        {lateral(RIGHT)}
      </View>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}
      >
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Início"
          accessibilityState={{ selected: active === 'home' }}
          onPress={() => onChange?.('home')}
          style={({ pressed }) => ({
            width: CENTER_SIZE,
            height: CENTER_SIZE,
            borderRadius: CENTER_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            // O disco do símbolo cobre o botão inteiro. A cor por baixo é a
            // mesma dele: o desenho é um pouco menor que o quadrado do SVG, e
            // sem isso sobraria um fio branco na borda.
            backgroundColor: MARK_PEACH,
            overflow: 'hidden',
            // Aba fechada: o botão inteiro recua. Antes quem recuava era só o
            // desenho, e com o disco cobrindo tudo isso não apareceria mais.
            opacity: active === 'home' ? 1 : 0.55,
            transform: [{ scale: pressed ? 0.94 : 1 }],
            ...shadows.md,
          })}
        >
          <BrotinhoMark size={CENTER_SIZE} />
        </Pressable>
      </View>
    </View>
  );
}

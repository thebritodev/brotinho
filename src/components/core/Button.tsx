import React from 'react';
import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';

import { toqueLeve } from '../../services/toque';
import { useVibracaoLigada } from '../../state/AppStateProvider';
import { radius, borderWidth, fonts, useTema, type Cores } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

/**
 * Ver o comentário gêmeo no Badge: tabela de cor no topo do arquivo congela no
 * tema com que o app abriu.
 *
 * O `'#fff'` do botão principal virou `textInverse`, que é o que ele sempre
 * quis dizer: "a cor que se lê sobre o verde". No escuro essa cor é escura, e
 * escrever branco à mão deixaria o botão ilegível.
 */
const variantes = (colors: Cores) =>
  ({
    primary: { background: colors.primary, color: colors.textInverse, borderColor: 'transparent' },
    secondary: {
      background: colors.primarySoft,
      color: colors.primaryStrong,
      borderColor: 'transparent',
    },
    ghost: { background: 'transparent', color: colors.primaryStrong, borderColor: colors.border },
  }) as const;

const SIZE = {
  md: { paddingVertical: 13, paddingHorizontal: 22, fontSize: 15 },
  lg: { paddingVertical: 19, paddingHorizontal: 26, fontSize: 18 },
} as const;

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Button — ação principal, ação tingida secundária ou ação de contorno. */
export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  icon,
  onPress,
  style,
}: Props) {
  const { colors, botaoPrimario } = useTema();
  const VARIANT = variantes(colors);
  const v = VARIANT[variant] ?? VARIANT.primary;
  const s = SIZE[size] ?? SIZE.lg;
  /*
    Só o principal ganha o relevo.

    O secundário e o fantasma continuam chapados de propósito: o relevo é o
    que diz "é aqui", e numa tela com três botões levantados nenhum deles diz
    mais nada. Ver `botaoPrimario` em `tokens`.
  */
  const ehPrincipal = variant === 'primary';
  const { sombra, ...fundoDoPrincipal } = botaoPrimario;

  /*
    Só o principal vibra, pelo mesmo motivo de só ele ter relevo: é o "é
    aqui" da tela. Se todo toque vibrasse, a vibração deixaria de dizer que
    alguma coisa aconteceu — viraria ruído que a mão aprende a ignorar.

    Leve, e não médio: médio é para conclusão, e o `toque.ts` guarda o duplo
    para as conquistas de verdade. Apertar "Continuar" não é conquista.

    No `onPress`, e não no `onPressIn`: quem encosta e arrasta o dedo para fora
    está desistindo, e desistir não pode vibrar como se tivesse confirmado.
  */
  const vibracao = useVibracaoLigada();
  const aoTocar = () => {
    if (ehPrincipal) toqueLeve(vibracao);
    onPress?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      // Sem isto o leitor de tela anuncia um botão desabilitado como se
      // estivesse disponível, e a pessoa fica tentando.
      accessibilityState={{ disabled }}
      onPress={disabled || !onPress ? undefined : aoTocar}
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: radius.botao,
          borderWidth: variant === 'ghost' ? borderWidth : 0,
          borderColor: v.borderColor,
          ...(ehPrincipal
            ? { ...fundoDoPrincipal, ...(disabled ? null : sombra) }
            : { backgroundColor: v.background }),
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ fontFamily: fonts.body.bold, fontSize: s.fontSize, color: v.color }}>
        {children}
      </Text>
    </Pressable>
  );
}

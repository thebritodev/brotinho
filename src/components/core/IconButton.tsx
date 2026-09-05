import React from 'react';
import { Pressable } from 'react-native';

import { radius, useTema } from '../../theme';

/**
 * Como o botão se apresenta.
 *
 * `nu` é o de sempre: só o ícone, sem caixa. É o certo para voltar e para
 * qualquer ação dentro de um cartão, onde uma segunda caixa dentro da caixa
 * só acrescenta borda.
 *
 * `vidro` é a pastilha do cabeçalho — quadrado arredondado, branco translúcido,
 * com o anel de luz das outras superfícies. Ela existe porque o cabeçalho não
 * tem cartão nenhum: os dois ícones ficavam soltos sobre o papel, sem alvo
 * visível, e a pessoa tinha de adivinhar onde tocar.
 */
export type FormaDoBotao = 'nu' | 'vidro';

type Props = {
  icon: React.ReactNode;
  size?: number;
  onPress?: () => void;
  background?: string;
  accessibilityLabel?: string;
  forma?: FormaDoBotao;
};

/** IconButton — alvo de toque circular para uma única ação (voltar, ajustes, sino...). */
export function IconButton({
  icon,
  /*
    Quarenta e quatro, e não quarenta.

    É o mínimo confortável de toque, e a literatura de design para pessoas em
    sofrimento trata alvo pequeno como exclusão de acessibilidade, junto com
    contraste baixo e navegação só por gesto. O `Switch` já tinha um `hitSlop`
    corrigindo os 26 dele; este aqui tinha passado batido.
  */
  size = 44,
  onPress,
  background,
  accessibilityLabel,
  forma = 'nu',
}: Props) {
  const { shadows, tema } = useTema();
  const ehVidro = forma === 'vidro';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: size,
        height: size,
        /*
          O vidro é quadrado arredondado; o nu continua redondo.

          Não é gosto: a pastilha do cabeçalho fica ao lado de cartões de canto
          14, e um círculo entre eles lê como peça de outro conjunto.
        */
        borderRadius: ehVidro ? radius.md : size / 2,
        /*
          Translúcido, e não `colors.surface`.

          O cabeçalho fica sobre o papel, e o papel tem o brilho de ambiente
          por trás. Um branco opaco recortaria um retângulo nítido no meio
          dessa luz; deixando passar, a pastilha recebe a mesma luz do resto.
        */
        backgroundColor:
          background ?? (ehVidro ? (tema === 'claro' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.06)') : 'transparent'),
        ...(ehVidro ? shadows.sm : null),
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {icon}
    </Pressable>
  );
}

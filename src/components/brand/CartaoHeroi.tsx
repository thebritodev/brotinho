import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { fonts, radius, useTema } from '../../theme';

/**
 * O cartão grande do carrossel: a cena ocupa o cartão inteiro, e o convite vem
 * por cima dela.
 *
 * ## O que mudou, e por quê
 *
 * Antes o cartão era uma linha de lista com um desenho de 60 pontos no canto:
 * sete oitavos dele eram creme vazio, o desenho lia como ícone e o caminho para
 * dentro era uma setinha cinza de 20 pontos. Três ferramentas que são o app
 * inteiro anunciadas com a mesma ênfase de um item de menu.
 *
 * Agora a cena é o cartão. Ela cobre tudo, o título fica grande em cima dela e
 * o caminho para dentro é um botão da largura do cartão — dá para ver de longe
 * o que aquilo é e o que acontece ao tocar, que é o que a setinha nunca disse.
 *
 * ## O véu
 *
 * Texto sobre ilustração só funciona com alguma coisa entre os dois. Aqui esse
 * alguma coisa é desenhado **dentro da própria cena**, como um degradê que
 * termina na cor de fundo do cartão — ver `cenasDoCarrossel`. Fazer isso em
 * SVG, e não com uma camada por cima, evita uma dependência nova só para
 * pintar gradiente em `View`, e deixa cada cena escolher onde o véu começa:
 * a do Diário precisa dele mais cedo, porque a folha é clara e sobe mais.
 *
 * ## Um alvo de toque, não dois
 *
 * O botão é **desenho**, não `Pressable`: quem responde ao toque é o cartão
 * inteiro. Um botão de verdade dentro de um cartão tocável cria dois alvos
 * concêntricos que fazem a mesma coisa — e no leitor de tela viram dois
 * anúncios para uma ação só. O botão aqui diz o que vai acontecer; quem
 * executa é o cartão.
 */

type Props = {
  /** A cena, desenhada para cobrir o cartão inteiro. */
  cena: React.ReactNode;
  /** Cor de fundo do cartão — a mesma em que o véu da cena termina. */
  fundo: string;
  /** A etiqueta do alto, quando há um motivo verdadeiro para ela. */
  selo?: string | null;
  titulo: string;
  /** Uma linha, curta, sobre a ferramenta. */
  linha?: string;
  /** O texto do botão: o que acontece ao tocar. */
  acao: string;
  onPress: () => void;
  /** O que o leitor de tela anuncia. */
  label: string;
  /** Altura do cartão; o carrossel manda a mesma para todos. */
  altura: number;
};

export function CartaoHeroi({
  cena,
  fundo,
  selo,
  titulo,
  linha,
  acao,
  onPress,
  label,
  altura,
}: Props) {
  const { colors, palette, shadows } = useTema();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        height: altura,
        borderRadius: radius.lg,
        backgroundColor: fundo,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        opacity: pressed ? 0.9 : 1,
        ...shadows.md,
      })}
    >
      {/* A cena, atrás de tudo e do tamanho do cartão. */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>{cena}</View>

      {!!selo && (
        <View
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            backgroundColor: colors.surface,
            borderRadius: radius.pill,
            paddingVertical: 6,
            paddingHorizontal: 12,
            ...shadows.sm,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.body.extraBold,
              fontSize: 11,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: colors.primaryStrong,
            }}
          >
            {selo}
          </Text>
        </View>
      )}

      <View style={{ padding: 16, gap: 10 }}>
        <Text
          style={{
            fontFamily: fonts.display.extraBold,
            fontSize: 25,
            color: colors.textPrimary,
          }}
        >
          {titulo}
        </Text>

        {!!linha && (
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 14,
              lineHeight: 14 * 1.42,
              color: palette.brown700,
            }}
          >
            {linha}
          </Text>
        )}

        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            backgroundColor: colors.primary,
            borderRadius: radius.botao,
            paddingVertical: 15,
            alignItems: 'center',
            marginTop: 2,
          }}
        >
          <Text style={{ fontFamily: fonts.body.bold, fontSize: 16, color: colors.textInverse }}>
            {acao}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

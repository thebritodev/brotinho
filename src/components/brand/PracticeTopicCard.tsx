import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

import { fonts, radius, useTema } from '../../theme';
import { Icon, type IconName } from '../core/Icon';
import { DesenhoDoTema, ehTemaDesenhado } from './desenhosDosTemas';

type Props = {
  title: string;
  /**
   * Uma linha sobre o tema.
   *
   * Sem ela o cartão era uma palavra sozinha dentro de oitenta pontos de
   * altura — treze retângulos quase vazios, e nada que ajudasse a escolher
   * entre "Estresse" e "Ansiedade" a não ser o palpite. A frase já existia:
   * é o `intro` de cada tema, que só aparecia depois de a pessoa entrar.
   */
  subtitle?: string;
  icon: IconName;
  /** A chave do tema, que escolhe a cena desenhada — ver `desenhosDosTemas`. */
  chave?: string;
  tint: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /**
   * Duas colunas, em vez de uma linha larga.
   *
   * É o formato da tela inicial, onde os treze temas aparecem juntos: em
   * fileira única eles empurrariam tudo o mais para longe, e a variedade —
   * que é o argumento das práticas — só apareceria para quem rolasse muito.
   * Na grade, o ícone cresce e vira o que se lê primeiro, e a frase de cada
   * tema sai: ela não cabe em meia largura sem virar três linhas de sete
   * palavras. Ela continua inteira dentro do tema.
   */
  grade?: boolean;
};

/** PracticeTopicCard — leva a um tema de prática (ansiedade, sono...). */
export function PracticeTopicCard({
  title,
  subtitle,
  icon,
  chave,
  tint,
  onPress,
  style,
  grade = false,
}: Props) {
  const { colors, palette, shadows } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: grade ? 'column' : 'row',
          alignItems: grade ? 'flex-start' : 'center',
          gap: grade ? 10 : 16,
          width: grade ? undefined : '100%',
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: 14,
          opacity: pressed ? 0.85 : 1,
          ...shadows.sm,
        },
        style,
      ]}
    >
      <View
        style={{
          width: grade ? 58 : 52,
          height: grade ? 58 : 52,
          borderRadius: radius.md,
          backgroundColor: tint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/*
          A cena do tema, com o ícone de traço como recuo.

          O desenho é o que se lê primeiro, e ele existe para os treze temas —
          ver `desenhosDosTemas`. O `Icon` fica para um tema novo que ainda não
          tenha cena: melhor um ícone genérico do que um quadrado vazio.
        */}
        <DesenhoDoTema tema={chave ?? ''} size={grade ? 46 : 40} />
        {!ehTemaDesenhado(chave ?? '') && (
          <Icon name={icon} size={grade ? 30 : 26} color={palette.brown900} />
        )}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 16, color: palette.brown900 }}>
          {title}
        </Text>
        {!!subtitle && (
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 13,
              lineHeight: 13 * 1.4,
              color: colors.textSecondary,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* A seta diz que o cartão leva a algum lugar. Sem ela, treze retângulos
          iguais não se anunciam como caminho. Escondida do leitor de tela: o
          `Pressable` já se apresenta como botão, e a seta repetiria isso.

          Na grade ela sai. Ali o cartão é uma coluna, e a seta cairia numa
          linha própria embaixo do título, apontando para o nada — quem diz que
          aquilo leva a algum lugar passa a ser o ícone grande. */}
      {!grade && (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon name="chevronRight" size={20} color={palette.brown400} />
        </View>
      )}
    </Pressable>
  );
}

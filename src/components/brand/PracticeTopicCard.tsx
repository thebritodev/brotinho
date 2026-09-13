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

/** Altura do cartão da grade: fixa, para as fileiras baterem. */
const ALTURA_NA_GRADE = 108;

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

  /*
    Na grade, o tom do tema deixa de ser um quadradinho e vira o cartão.

    Antes o cartão era creme com um selo colorido de 58 pontos no canto: metade
    da área era vazio, e a cor do tema — que é o que faz "Insônia" e "Luto"
    serem distinguíveis de relance — aparecia num pedaço pequeno demais para
    isso funcionar. Agora a cor é o fundo, e a cena cresce até ser cortada pela
    borda de baixo à direita: o desenho continua para fora do cartão em vez de
    acabar dentro dele, que é o que o faz parecer ilustração e não ícone.
  */
  if (grade) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={({ pressed }) => [
          {
            height: ALTURA_NA_GRADE,
            backgroundColor: tint,
            borderRadius: radius.lg,
            overflow: 'hidden',
            padding: 13,
            opacity: pressed ? 0.85 : 1,
            ...shadows.sm,
          },
          style,
        ]}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={{ position: 'absolute', right: -14, bottom: -16 }}
        >
          {ehTemaDesenhado(chave ?? '') ? (
            <DesenhoDoTema tema={chave ?? ''} size={96} />
          ) : (
            /* Tema novo, ainda sem cena: o ícone de traço segura o lugar. */
            <View style={{ padding: 20 }}>
              <Icon name={icon} size={52} color={palette.brown900} />
            </View>
          )}
        </View>

        <Text
          numberOfLines={2}
          style={{
            fontFamily: fonts.body.extraBold,
            fontSize: 16,
            lineHeight: 16 * 1.2,
            color: palette.brown900,
            /* Larga o canto de baixo à direita para o desenho. */
            width: '68%',
          }}
        >
          {title}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          width: '100%',
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
          width: 52,
          height: 52,
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
        <DesenhoDoTema tema={chave ?? ''} size={40} />
        {!ehTemaDesenhado(chave ?? '') && <Icon name={icon} size={26} color={palette.brown900} />}
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

          Ela não existe na grade: lá o cartão é colorido por inteiro e a cena
          sangrando na borda já diz que tem coisa ali dentro. */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Icon name="chevronRight" size={20} color={palette.brown400} />
      </View>
    </Pressable>
  );
}

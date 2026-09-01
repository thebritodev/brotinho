import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { fonts, useTema } from '../../theme';
import { AnimatedSprout } from './AnimatedSprout';
import { BalaoDoBroto } from './BalaoDoBroto';

/**
 * AskingSprout — o broto fazendo a pergunta, com o balão de fala acima dele.
 *
 * O balão fica em cima e o bico aponta para baixo, para o broto ficar grande
 * e centrado no meio da tela. A primeira versão punha os dois lado a lado; o
 * mascote sobrava num canto com 62px, pequeno demais para ser o personagem.
 *
 * Ele está sempre no estágio 3 e feliz: é o mesmo rosto do começo ao fim do
 * onboarding, para a pessoa reconhecer quem está falando com ela.
 */

type Props = {
  title: string;
  sub?: string;
  kicker?: string;
  /** Muda a cada resposta escolhida; o broto balança confirmando. */
  reageA?: string | number | null;
  /**
   * Telas com muitas opções de resposta. O broto encolhe só nelas, em vez de
   * ficar pequeno no app inteiro por causa das duas mais cheias.
   */
  compacto?: boolean;
};

export function AskingSprout({ title, sub, kicker, reageA = null, compacto = false }: Props) {
  const { colors, palette } = useTema();
  const { width, height } = useWindowDimensions();
  /**
   * Largura e altura entram as duas: a largura define o quanto ele domina a
   * tela, e a altura impede que ele empurre as opções para fora dela.
   *
   * O termo de altura é o que segura telas pequenas. E ele foi baixando à
   * medida que os botões de resposta cresceram: numa tela de 690px os dois não
   * cabem grandes ao mesmo tempo, e entre mascote e alvo de toque quem cede é
   * o mascote.
   */
  const sproutSize = compacto
    ? Math.min(width * 0.30, height * 0.095)
    : Math.min(width * 0.44, height * 0.17);

  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      {/*
        O balão saiu daqui para `BalaoDoBroto`: ele era o único do app com bico,
        e o bico é justamente o que marca a fala do broto. Agora a saudação da
        tela inicial e o "Seu broto percebeu" usam o mesmo desenho.
      */}
      <BalaoDoBroto lado="baixo" tom="superficie" style={{ width: '100%' }}>
        {!!kicker && (
          <Text
            style={{
              fontFamily: fonts.body.bold,
              fontSize: 13,
              color: colors.primaryStrong,
              textAlign: 'center',
            }}
          >
            {kicker}
          </Text>
        )}
        <Text
          style={{
            fontFamily: fonts.display.bold,
            fontSize: 20,
            lineHeight: 20 * 1.26,
            color: colors.textPrimary,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        {!!sub && (
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 14,
              lineHeight: 14 * 1.5,
              color: palette.brown700,
              textAlign: 'center',
            }}
          >
            {sub}
          </Text>
        )}
      </BalaoDoBroto>

      <AnimatedSprout
        mood="feliz"
        stage={3}
        size={sproutSize}
        breathe
        swayOn={reageA}
      />
    </View>
  );
}

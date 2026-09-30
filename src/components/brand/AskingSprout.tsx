import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { fonts, useTema, type Mood } from '../../theme';
import { AnimatedSprout } from './AnimatedSprout';
import { BalaoDoBroto } from './BalaoDoBroto';
import { Cena, CRISTA_DO_MORRO } from './Cena';
import type { Pose } from './geometriaDoBroto';

/**
 * A margem lateral da tela de onboarding, que a faixa de céu precisa desfazer.
 *
 * Ela mora no `contentContainerStyle` do `ScrollView` de lá. Escrita aqui como
 * constante, e não como -20 solto no estilo, porque são dois números que têm
 * de bater: se a margem de lá mudar, esta linha é a que precisa mudar junto.
 */
const MARGEM_DA_TELA = 20;

/**
 * AskingSprout — o broto fazendo a pergunta, com o balão de fala acima dele.
 *
 * O balão fica em cima e o bico aponta para baixo, para o broto ficar grande
 * e centrado no meio da tela. A primeira versão punha os dois lado a lado; o
 * mascote sobrava num canto com 62px, pequeno demais para ser o personagem.
 *
 * Ele está sempre no estágio 3 e feliz: é o mesmo rosto do começo ao fim do
 * onboarding, para a pessoa reconhecer quem está falando com ela.
 *
 * ## O chão embaixo dele
 *
 * No redesenho ele deixa de flutuar sobre o creme e passa a **pisar em algum
 * lugar**: uma faixa de céu com um morro, que sangra para fora da margem da
 * tela. A margem é de 20, e a faixa a desfaz com `marginHorizontal: -20` —
 * negativa, e não posição absoluta, porque posição absoluta fora dos limites
 * do pai não desenha no Android.
 *
 * A cor do céu é a resposta da pessoa: enquanto ela não disse como tem estado,
 * é o azul de espera; depois, é o tom do humor que ela marcou. É a primeira
 * vez no app em que uma resposta muda o mundo em volta do broto, e é de
 * propósito que seja no onboarding.
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
  /** O que ele faz neste passo — acena na chegada, pensa quando pergunta. */
  pose?: Pose;
  /** O céu atrás dele. Antes do check-in, o azul de espera. */
  humor?: Mood | null;
  /** Depois do pôr do sol o céu escurece, mesmo no tema claro. */
  noite?: boolean;
};

export function AskingSprout({
  title,
  sub,
  kicker,
  reageA = null,
  compacto = false,
  pose = 'parado',
  humor = null,
  noite = false,
}: Props) {
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

  /*
    Sem vaso, o broto nasce da terra — e o pé dele precisa ficar **abaixo** da
    linha do morro, senão a haste parece pousada em cima do chão em vez de
    plantada nele. Uma fração do tamanho, e não um número fixo, porque ele
    encolhe nas telas compactas.
  */
  const RAIZ_ENTERRADA = Math.round(sproutSize * 0.06);
  /* A altura do desenho sem vaso é `size * 1,12` — ver `quadroDoBroto`. */
  const alturaDaFaixa = Math.round(sproutSize * 1.12) + CRISTA_DO_MORRO.grama + 10;

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

      {/*
        A faixa de céu tem a altura do broto mais o morro, e nada além disso.

        Uma faixa mais alta subiria atrás do balão e o balão branco sobre céu
        azul perderia o contorno; mais baixa, o broto ficaria com a cabeça
        fora do mundo dele.
      */}
      <View style={{ marginHorizontal: -MARGEM_DA_TELA, marginTop: 6 }}>
        <View style={{ height: alturaDaFaixa }}>
          <Cena
            largura={width}
            altura={alturaDaFaixa}
            humor={humor ?? undefined}
            ceu={humor ? undefined : palette.blue100}
            noite={noite}
            semAstro
            nuvens={false}
            chao="grama"
            capim
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: CRISTA_DO_MORRO.grama - RAIZ_ENTERRADA,
              alignItems: 'center',
            }}
          >
            <AnimatedSprout
              mood="feliz"
              stage={3}
              size={sproutSize}
              bamboleia
              swayOn={reageA}
              pose={pose}
              showPot={false}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

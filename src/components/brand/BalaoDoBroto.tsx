import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { radius, useTema } from '../../theme';

/**
 * BalaoDoBroto — a caixa com bico, para tudo que o broto diz.
 *
 * O app tinha quatro maneiras diferentes de mostrar a mesma coisa: a saudação
 * do dia era um parágrafo cinza solto embaixo do "Oi, Pedro"; o "Seu broto
 * percebeu", a resposta depois de salvar no diário e o próximo passo da
 * primeira semana eram um cartão verde com o desenho ao lado; e só o
 * onboarding tinha bico apontando para ele. Quatro formas para uma voz só —
 * e nenhuma delas dizia, sozinha, que quem fala ali é o broto e não o app.
 *
 * O bico é o que faz essa diferença. Ele não é enfeite: é a única marca que
 * distingue a fala do personagem do texto do sistema, e por isso vive num
 * componente e não copiado em quatro lugares.
 *
 * ## O bico é desenhado à parte
 *
 * Podia ser um triângulo em CSS com bordas, ou um `View` girado 45 graus
 * espiando por baixo. Os dois brigam com `borderRadius`: o balão tem cantos
 * redondos, e um filho girado precisa ser recortado para não vazar por eles —
 * `overflow: hidden` no pai recorta o bico junto. Um `Svg` irmão, encostado
 * com um pixel de sobreposição, resolve sem recorte nenhum. É como o
 * `AskingSprout` já fazia, e é de lá que este componente saiu.
 */

/** Quanto o bico avança e quanto ele ocupa na borda, em pixels. */
const BICO_ALTURA = 14;
const BICO_LARGURA = 26;

type Lado = 'baixo' | 'esquerda';

type Tom = 'superficie' | 'suave';

type Props = {
  children: React.ReactNode;
  /**
   * De que lado está o broto — é para lá que o bico aponta.
   *
   * `baixo` quando ele está embaixo do balão, que é o caso do onboarding e da
   * saudação da tela inicial. `esquerda` quando ele está ao lado, que é o caso
   * dos cartões em que o desenho pequeno divide a linha com o texto.
   */
  lado?: Lado;
  /**
   * `superficie` é o balão branco sobre o fundo creme — a fala em destaque.
   * `suave` é o verde claro dos cartões, para quando ele comenta algo em vez
   * de perguntar.
   */
  tom?: Tom;
  style?: StyleProp<ViewStyle>;
};

export function BalaoDoBroto({ children, lado = 'baixo', tom = 'superficie', style }: Props) {
  const { colors, shadows } = useTema();
  const fundo = tom === 'suave' ? colors.primarySoft : colors.surface;

  const corpo = (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: fundo,
          borderRadius: radius.lg,
          paddingVertical: 12,
          paddingHorizontal: 16,
        },
        tom === 'superficie' ? shadows.sm : null,
      ]}
    >
      {children}
    </View>
  );

  if (lado === 'esquerda') {
    return (
      <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
        {/* O bico sobrepõe um pixel: sem isso o antisserrilhado deixa um fio do
            fundo aparecendo entre ele e o balão. */}
        <Svg
          width={BICO_ALTURA}
          height={BICO_LARGURA}
          viewBox={`0 0 ${BICO_ALTURA} ${BICO_LARGURA}`}
          style={{ marginRight: -1 }}
        >
          <Path
            d={`M${BICO_ALTURA} 0 L0 ${BICO_LARGURA / 2} L${BICO_ALTURA} ${BICO_LARGURA} Z`}
            fill={fundo}
          />
        </Svg>
        {corpo}
      </View>
    );
  }

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <View style={{ width: '100%', flexDirection: 'row' }}>{corpo}</View>
      <Svg
        width={BICO_LARGURA}
        height={BICO_ALTURA}
        viewBox={`0 0 ${BICO_LARGURA} ${BICO_ALTURA}`}
        style={{ marginTop: -1 }}
      >
        <Path d={`M0 0 L${BICO_LARGURA / 2} ${BICO_ALTURA} L${BICO_LARGURA} 0 Z`} fill={fundo} />
      </Svg>
    </View>
  );
}

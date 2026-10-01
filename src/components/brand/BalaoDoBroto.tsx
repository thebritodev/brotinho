import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { radius, useTema } from '../../theme';
import { BALAO_NO_CEU } from './ceuDaComposta';

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

type Lado = 'baixo' | 'esquerda' | 'direita';

type Tom = 'superficie' | 'suave' | 'noCeu';

/**
 * A entrada do balão: ele **pula** para dentro, não aparece.
 *
 * É a diferença entre um cartão que carregou e alguém que abriu a boca. A
 * curva passa um pouco de 1 na volta — a ponta de elástico que faz o gesto ler
 * como fala em vez de transição.
 */
const POP_MS = 400;

type Props = {
  children: React.ReactNode;
  /**
   * De que lado está o broto — é para lá que o bico aponta.
   *
   * `baixo` quando ele está embaixo do balão, que é o caso do onboarding e da
   * saudação da tela inicial. `esquerda` quando ele está ao lado, que é o caso
   * dos cartões em que o desenho pequeno divide a linha com o texto.
   * `direita` é o espelho: o balão à esquerda e o broto à direita, que é como
   * ele fica nas cenas em que a planta nasce do lado direito da tela.
   */
  lado?: Lado;
  /**
   * `superficie` é o balão branco sobre o fundo creme — a fala em destaque.
   * `suave` é o verde claro dos cartões, para quando ele comenta algo em vez
   * de perguntar.
   *
   * `noCeu` é o `superficie` que não anoitece, para quando o balão fica em
   * cima da paisagem da tela inicial. Ali o céu é fixo e o texto é fixo
   * (`TEXTO_NO_CEU`); um balão que seguisse o tema ficaria quase preto com
   * texto quase preto dentro. Ver `BALAO_NO_CEU`.
   */
  tom?: Tom;
  style?: StyleProp<ViewStyle>;
  /**
   * Quando este valor muda, o balão entra de novo.
   *
   * Serve para o rodízio de falas: tocar no broto troca o texto, e sem isso a
   * troca seria uma substituição silenciosa de string — o balão ficaria parado
   * com outra frase dentro, que é exatamente o contrário de alguém falando.
   *
   * Quem não passa nada ganha a entrada só na montagem.
   */
  apareceEm?: string | number;
};

export function BalaoDoBroto({
  children,
  lado = 'baixo',
  tom = 'superficie',
  style,
  apareceEm,
}: Props) {
  const { colors, shadows } = useTema();
  const menosMovimento = useMenosMovimento();
  const fundo =
    tom === 'suave' ? colors.primarySoft : tom === 'noCeu' ? BALAO_NO_CEU : colors.surface;

  const pop = useRef(new Animated.Value(menosMovimento ? 1 : 0)).current;

  useEffect(() => {
    if (menosMovimento) {
      pop.setValue(1);
      return;
    }
    pop.setValue(0);
    const a = Animated.timing(pop, {
      toValue: 1,
      duration: POP_MS,
      easing: Easing.bezier(0.2, 0.9, 0.3, 1.2),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [apareceEm, menosMovimento]);

  const entrada = {
    opacity: pop,
    transform: [
      { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
      { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
    ],
  };

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
        tom === 'suave' ? null : shadows.sm,
      ]}
    >
      {children}
    </View>
  );

  /* O bico sobrepõe um pixel: sem isso o antisserrilhado deixa um fio do
     fundo aparecendo entre ele e o balão. */
  const bicoAoLado = (aponta: 'esquerda' | 'direita') => (
    <Svg
      width={BICO_ALTURA}
      height={BICO_LARGURA}
      viewBox={`0 0 ${BICO_ALTURA} ${BICO_LARGURA}`}
      style={aponta === 'esquerda' ? { marginRight: -1 } : { marginLeft: -1 }}
    >
      <Path
        d={
          aponta === 'esquerda'
            ? `M${BICO_ALTURA} 0 L0 ${BICO_LARGURA / 2} L${BICO_ALTURA} ${BICO_LARGURA} Z`
            : `M0 0 L${BICO_ALTURA} ${BICO_LARGURA / 2} L0 ${BICO_LARGURA} Z`
        }
        fill={fundo}
      />
    </Svg>
  );

  if (lado === 'esquerda' || lado === 'direita') {
    return (
      <Animated.View
        style={[{ flexDirection: 'row', alignItems: 'center' }, entrada, style]}
      >
        {lado === 'esquerda' && bicoAoLado('esquerda')}
        {corpo}
        {lado === 'direita' && bicoAoLado('direita')}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ alignItems: 'center' }, entrada, style]}>
      <View style={{ width: '100%', flexDirection: 'row' }}>{corpo}</View>
      <Svg
        width={BICO_LARGURA}
        height={BICO_ALTURA}
        viewBox={`0 0 ${BICO_LARGURA} ${BICO_ALTURA}`}
        style={{ marginTop: -1 }}
      >
        <Path d={`M0 0 L${BICO_LARGURA / 2} ${BICO_ALTURA} L${BICO_LARGURA} 0 Z`} fill={fundo} />
      </Svg>
    </Animated.View>
  );
}

import React, { useEffect, useId, useRef } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { useTema } from '../../theme';

/**
 * A luz que cai sobre o broto.
 *
 * ## O que isto substitui
 *
 * Havia um disco da cor do humor atrás do broto. Ele passou por seis versões e
 * nenhuma parou de pé, até a conclusão de que o problema não era o tom: numa
 * tela onde o humor já é dito pela carinha do broto, pela carinha marcada e
 * pela palavra escolhida, o disco era o quarto a dizer a mesma coisa.
 *
 * Isto **não é aquilo de volta**: esta mancha não codifica nada. É luz de
 * janela caindo numa planta, igual todo dia, qualquer que seja o humor.
 *
 * ## Os números vêm do documento, e são estes
 *
 * No documento, o bloco da tela inicial é um contêiner de 300 de altura com
 * três coisas centradas: o halo de 300 por 300, a sombra de chão, e o broto de
 * 215 por 300. Disso saem as duas regras que importam:
 *
 * - **o diâmetro do halo é a altura do desenho** — 300 e 300, não uma fração
 *   arbitrária dela;
 * - **o halo é mais largo que o broto** (300 contra 215) e ainda assim cabe,
 *   porque o contêiner é mais largo que o desenho.
 *
 * Quem calcula o diâmetro é `alturaDoMascote`, na geometria — a mesma tabela
 * que desenha o broto. E o quadro tem `minWidth`/`minHeight` do tamanho do
 * halo, então ele **nunca** transborda: ou o desenho é maior e manda no
 * tamanho, ou o halo é, e o quadro cresce até ele.
 *
 * Antes disso o halo foi, em ordem: 1,32 vez o desenho (transbordava e cobria
 * os vizinhos), a caixa inteira esticada (virou um oval, porque a caixa é mais
 * larga que alta), e o dobro da distância até o topo (ficou minúsculo, porque
 * essa distância não tem relação nenhuma com o desenho). Os três são o mesmo
 * erro: inventar o tamanho em vez de ler o do documento.
 *
 * A quarta versão media o quadro com `onLayout` — e `onLayout` **não dispara
 * no react-native-web**. O valor ficava no recuo justamente no navegador, que
 * era onde eu conferia: um número que só está certo onde não dá para olhar.
 *
 * ## Por que ele pulsa
 *
 * `@keyframes halo` no documento: `scale(1)`/`opacity .95` ↔ `scale(1.045)`/
 * `opacity 1`, sete segundos, ida e volta.
 *
 * Não é enfeite — é o que faz a mancha ser lida como **luz** em vez de forma.
 * Parada, ela vira um oval desenhado atrás do broto, que é exatamente o que o
 * disco de humor era. Luz respira um pouco.
 *
 * O diâmetro de base é dividido pelo pico da pulsação para que o **crescimento**
 * caiba na caixa, e não só o repouso.
 *
 * ## Por que SVG e não gradiente de CSS
 *
 * `experimental_backgroundImage` aceita `radial-gradient` no React Native, e o
 * nome diz o quanto dá para contar com ele. `react-native-svg` já é dependência
 * do app, desenha o broto inteiro, e faz gradiente radial nas duas plataformas.
 */

/** O halo nos dois temas e nos dois tons. Documento de redesenho, seções 3 e 13. */
const LUZ = {
  claro: {
    quente: ['rgba(255,252,240,0.95)', 'rgba(252,239,199,0.72)', 'rgba(252,239,199,0)'],
    verde: ['rgba(240,247,242,0.95)', 'rgba(227,237,230,0.62)', 'rgba(227,237,230,0)'],
  },
  escuro: {
    /*
      No escuro a luz não é mais fraca: é de outra hora do dia.

      Clarear o mesmo creme sobre `#211E1A` daria um holofote branco no meio da
      tela. O tom vira âmbar baixo — a mesma matiz, muito menos luz — que é o
      que uma lâmpada faz num quarto à noite, e é a lógica de toda a paleta
      escura deste app: papel à noite não vira carvão, vira marrom quente sob
      um abajur.
    */
    quente: ['rgba(215,185,95,0.3)', 'rgba(215,185,95,0.1)', 'rgba(33,30,26,0)'],
    verde: ['rgba(76,123,98,0.35)', 'rgba(76,123,98,0.12)', 'rgba(33,30,26,0)'],
  },
} as const;

/**
 * `quente` é a luz da tela inicial: sol de janela, creme, a mesma todo dia.
 *
 * `verde` é a da Composta. Ali o broto não está numa janela — está no meio de
 * um exercício, e a tela inteira é verde. Uma luz creme no meio disso
 * apareceria como uma segunda fonte, de outro ambiente.
 */
export type TomDaLuz = 'quente' | 'verde';

/** `@keyframes halo` do documento: sete segundos, ida e volta. */
const PULSO_MS = 7000;
const PULSO_ESCALA = 1.045;

export function LuzDeEstufa({
  diametro: diametroPedido,
  tom = 'quente',
  children,
  style,
}: {
  /**
   * O diâmetro do halo, em pixels de tela.
   *
   * Deve ser a **altura do desenho** — use `alturaDoMascote(stage, size)`, que
   * é a mesma tabela usada para desenhar. Passar o `size` do broto aqui seria
   * errado: `Sprout` trata `size` como escala sobre uma caixa de 200, então
   * `size={120}` desenha 53 por 80.
   */
  diametro: number;
  tom?: TomDaLuz;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { tema } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const cores = LUZ[tema][tom];

  /* O repouso encolhe para que o pico da pulsação caiba no que foi pedido. */
  const diametro = diametroPedido / PULSO_ESCALA;

  const pulso = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    /*
      Laço perfeito: sai de 0, vai a 1, volta a 0. As duas pontas são o mesmo
      valor, então a emenda não aparece.

      Vale registrar o erro gêmeo que estava no balanço do broto: lá a volta ia
      de 1 a **-1** com a mesma duração da ida de 0 a 1 — o dobro da distância
      no mesmo tempo. O movimento acelerava de repente ao dobrar a esquina, e
      foi isso, e não a lentidão, o "cortado" que apareceu no aparelho.
    */
    const meia = (para: number) =>
      Animated.timing(pulso, {
        toValue: para,
        duration: PULSO_MS / 2,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const laco = Animated.loop(Animated.sequence([meia(1), meia(0)]));
    laco.start();
    return () => laco.stop();
  }, []);

  const escala = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, PULSO_ESCALA] });
  const opacidade = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          /*
            O quadro nunca é menor que o halo.

            Com `minWidth`/`minHeight`, ou o desenho é maior e manda no
            tamanho, ou o halo é e o quadro cresce até ele. Nos dois casos o
            halo cabe — e halo que cabe não precisa de `overflow: visible`, que
            é a propriedade que o deixava pintar por cima dos vizinhos.
          */
          minWidth: diametroPedido,
          minHeight: diametroPedido,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={{ position: 'absolute', opacity: opacidade, transform: [{ scale: escala }] }}
      >
        <Svg width={diametro} height={diametro}>
          <Defs>
            {/*
              O centro do gradiente sobe para 38% da altura **do círculo**, que
              é onde fica a cabeça. Centrado no desenho inteiro, ele acenderia o
              vaso em vez do rosto.
            */}
            <RadialGradient id={`halo-${id}`} cx="50%" cy="38%" r="50%">
              <Stop offset="0" stopColor={cores[0]} />
              <Stop offset="0.4" stopColor={cores[1]} />
              <Stop offset="0.7" stopColor={cores[2]} />
            </RadialGradient>
          </Defs>
          <Ellipse
            cx={diametro / 2}
            cy={diametro / 2}
            rx={diametro / 2}
            ry={diametro / 2}
            fill={`url(#halo-${id})`}
          />
        </Svg>
      </Animated.View>
      {children}
    </View>
  );
}

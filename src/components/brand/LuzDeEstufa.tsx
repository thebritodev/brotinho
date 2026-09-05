import React, { useId, useState } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { useTema } from '../../theme';

/**
 * A luz que cai sobre o broto, e a sombra que ele projeta no chão.
 *
 * ## O que isto substitui
 *
 * Havia um disco da cor do humor atrás do broto. Ele passou por seis versões e
 * nenhuma parou de pé, até a conclusão de que o problema não era o tom: numa
 * tela onde o humor já é dito pela carinha do broto, pela carinha marcada e
 * pela palavra escolhida, o disco era o quarto a dizer a mesma coisa. Saiu, e
 * a tela ficou melhor.
 *
 * Isto **não é aquilo de volta**. A diferença é o que a mancha significa: ela
 * não codifica nada. É luz de janela caindo numa planta, igual todo dia,
 * qualquer que seja o humor — o mesmo papel do sol na cena da janela do
 * onboarding. Uma pessoa triste vê a mesma luz de uma pessoa contente.
 *
 * ## Por que SVG e não gradiente de CSS
 *
 * `experimental_backgroundImage` aceita `radial-gradient` no React Native, e o
 * nome diz o quanto se pode contar com ele. `react-native-svg` já é dependência
 * do app, desenha o broto inteiro, e faz gradiente radial há anos nas duas
 * plataformas. Entre uma API experimental e uma biblioteca que já está aqui, a
 * escolha é a chata.
 *
 * ## Só o halo, e por quê
 *
 * Houve aqui uma segunda camada: uma sombra difusa no chão, para o vaso pousar
 * na tela. Ela saiu porque **já havia uma** — o próprio `Sprout` desenha a
 * sombra de contato, colada na base do vaso. As duas somadas davam uma mancha
 * cinza chapada embaixo da planta, sem forma, que é o oposto do que sombra
 * nenhuma faz. Uma sombra boa é melhor que duas.
 *
 * O que sobrou é o halo: centro no terço de cima, que é onde fica a cabeça —
 * luz centrada no desenho inteiro acenderia o vaso em vez do rosto.
 */

/**
 * Dois tons de luz, e a diferença é de lugar, não de gosto.
 *
 * `quente` é a luz da tela inicial: sol de janela, creme, a mesma todo dia.
 *
 * `verde` é a da Composta e da respiração guiada. Ali o broto não está numa
 * janela — está no meio de um exercício, e a tela inteira é verde: o cartão, o
 * botão, o contador. Uma luz creme no meio disso apareceria como uma segunda
 * fonte, de outro ambiente. O verde some no conjunto, que é o que se quer de
 * luz: notar o que ela ilumina, não ela.
 */
export type TomDaLuz = 'quente' | 'verde';

/** As manchas, nos dois temas. Ver o documento de redesenho, seções 3, 4 e 13. */
const LUZ = {
  claro: {
    halo: ['rgba(255,252,240,0.95)', 'rgba(252,239,199,0.72)', 'rgba(252,239,199,0)'],
    haloVerde: ['rgba(240,247,242,0.95)', 'rgba(227,237,230,0.62)', 'rgba(227,237,230,0)'],
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
    halo: ['rgba(215,185,95,0.3)', 'rgba(215,185,95,0.1)', 'rgba(33,30,26,0)'],
    haloVerde: ['rgba(76,123,98,0.35)', 'rgba(76,123,98,0.12)', 'rgba(33,30,26,0)'],
  },
} as const;

export function LuzDeEstufa({
  tamanho,
  tom = 'quente',
  children,
  style,
}: {
  /**
   * O `size` que o broto recebeu — usado só até ele se medir.
   *
   * **Não é o tamanho em pixels do desenho**, e essa confusão custou uma
   * versão: `Sprout` trata `size` como escala sobre uma caixa de 200, então
   * `size={120}` desenha 53 por 80. O halo, calculado a partir de 120, saía
   * três vezes maior que o broto — uma mancha clara enorme em volta de uma
   * plantinha, com a borda cortada pela caixa.
   *
   * Por isso a medida real vem do `onLayout`. Isto aqui é só o palpite do
   * primeiro quadro, antes de haver medida.
   */
  tamanho: number;
  tom?: TomDaLuz;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { tema } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const doTema = LUZ[tema];
  const cores = tom === 'verde' ? doTema.haloVerde : doTema.halo;

  const [medida, setMedida] = useState<{ largura: number; altura: number } | null>(null);
  const aoMedir = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setMedida({ largura: width, altura: height });
  };

  /*
    O halo é um **círculo**, e cabe na caixa. As duas coisas custaram uma
    versão cada.

    Primeiro ele era 1,32 vez o desenho, para a luz escapar do objeto que
    ilumina. Um filho absoluto maior que o pai transborda, e transbordo exige
    `overflow: visible` para não virar retângulo cortado — que é a mesma
    propriedade que o deixa pintar por cima dos vizinhos. No aparelho ele
    cobria o balão de fala acima e a pergunta abaixo.

    Aí eu o fiz preencher a caixa e estiquei o gradiente até 100% do raio para
    compensar o tamanho perdido. Pior: a caixa do broto é mais alta que larga,
    então virou um **oval**, e a parada transparente lá na borda deixou de ter
    onde desbotar. Deixou de parecer luz e passou a parecer uma forma desenhada
    atrás do broto — que é exatamente o que o disco de humor era, e que já
    tinha sido removido uma vez.

    Luz não tem contorno. Então: círculo, não elipse; centrado na cabeça, que é
    onde ela bate; com diâmetro limitado pelo que cabe acima desse centro, para
    não voltar a transbordar; e apagando de volta em 70% do raio, como no
    documento. O resultado é uma mancha macia perto do rosto, sem borda.
  */
  const larguraDaCaixa = medida?.largura ?? tamanho;
  const alturaDaCaixa = medida?.altura ?? tamanho;
  /* A luz bate na cabeça, e a cabeça fica no terço de cima do desenho. */
  const centroY = alturaDaCaixa * 0.36;
  /*
    O diâmetro é o dobro da distância até o topo — é o maior círculo que cabe
    sem estourar por cima. Limitado também pela largura, para um broto largo e
    baixo não ganhar um halo que vaza pelos lados.
  */
  const diametro = Math.min(centroY * 2, larguraDaCaixa);


  return (
    <View
      onLayout={aoMedir}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Svg
        width={larguraDaCaixa}
        height={alturaDaCaixa}
        style={{ position: 'absolute' }}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id={`halo-${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={cores[0]} />
            <Stop offset="0.42" stopColor={cores[1]} />
            <Stop offset="0.7" stopColor={cores[2]} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={larguraDaCaixa / 2}
          cy={centroY}
          rx={diametro / 2}
          ry={diametro / 2}
          fill={`url(#halo-${id})`}
        />
      </Svg>

      {children}
    </View>
  );
}

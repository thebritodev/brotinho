import React, { useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
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
 * ## As duas peças
 *
 * O **halo** é quente e fica atrás; o centro sobe para 38% da altura porque é
 * onde fica a cabeça do broto, e luz centrada no desenho inteiro acenderia o
 * vaso em vez do rosto.
 *
 * A **sombra no chão** é larga e rasa — 210 por 26 — e existe para o vaso
 * pousar na tela em vez de flutuar. É diferente da elipse que o próprio `Sprout`
 * desenha: aquela é a sombra de contato, colada na base do vaso; esta é a
 * mancha difusa em volta, que só faz sentido quando há luz de ambiente.
 */

/** As duas manchas, nos dois temas. Ver o documento de redesenho, seção 3. */
const LUZ = {
  claro: {
    halo: ['rgba(255,252,240,0.95)', 'rgba(252,239,199,0.72)', 'rgba(252,239,199,0)'],
    chao: ['rgba(58,54,48,0.2)', 'rgba(58,54,48,0)'],
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
    chao: ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)'],
  },
} as const;

export function LuzDeEstufa({
  tamanho,
  children,
  style,
}: {
  /** A largura do broto — o halo é dimensionado a partir dela. */
  tamanho: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { tema } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const cores = LUZ[tema];

  /*
    O halo é maior que o broto de propósito.

    Em 1,0 ele viraria um contorno aceso rente ao desenho. A luz precisa
    escapar do objeto que ilumina — o desenho fica dentro dela, não do lado.
  */
  const halo = tamanho * 1.32;
  /*
    A sombra é larga e rasa, na proporção do documento: 210 por 26 num broto de
    300, ou seja 0,7 por 0,087. Mais alta que isso ela deixa de parecer sombra
    no chão e passa a parecer um buraco embaixo do vaso.
  */
  const larguraDoChao = tamanho * 0.7;
  const alturaDoChao = tamanho * 0.087;

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      {/*
        Duas camadas, e cada uma se ancora onde faz sentido.

        O **halo** é centrado no desenho: é luz caindo sobre ele.

        A **sombra** se ancora no rodapé do quadro, que é onde a base do vaso
        está. Na primeira versão as duas moravam no mesmo SVG centrado, e a
        sombra caía num ponto calculado do halo — 88% da altura dele. Como o
        halo é maior que o broto, aquilo pousava bem **abaixo** do vaso: virou
        uma mancha escura atravessando a pergunta "Como você está se sentindo
        hoje?", solta no meio da tela, sem nada por cima que a projetasse.

        Ancorar no rodapé acerta em qualquer tamanho de broto, sem depender de
        adivinhar a altura do desenho a partir da do halo.
      */}
      <Svg width={halo} height={halo} style={{ position: 'absolute' }} pointerEvents="none">
        <Defs>
          <RadialGradient id={`halo-${id}`} cx="50%" cy="38%" r="50%">
            <Stop offset="0" stopColor={cores.halo[0]} />
            <Stop offset="0.42" stopColor={cores.halo[1]} />
            <Stop offset="0.7" stopColor={cores.halo[2]} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={halo / 2} cy={halo / 2} rx={halo / 2} ry={halo / 2} fill={`url(#halo-${id})`} />
      </Svg>

      <Svg
        width={larguraDoChao}
        height={alturaDoChao}
        style={{ position: 'absolute', bottom: 0 }}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id={`chao-${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={cores.chao[0]} />
            <Stop offset="0.7" stopColor={cores.chao[1]} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={larguraDoChao / 2}
          cy={alturaDoChao / 2}
          rx={larguraDoChao / 2}
          ry={alturaDoChao / 2}
          fill={`url(#chao-${id})`}
        />
      </Svg>
      {children}
    </View>
  );
}

import React from 'react';
import { PixelRatio, View } from 'react-native';

import { borderWidth, radius, useTema } from '../../theme';

/**
 * A altura da pauta como o **texto** a declara.
 *
 * É este o número que vai em `lineHeight` de um estilo de texto, e só ele. O
 * React Native multiplica `fontSize` e `lineHeight` pela escala de fonte do
 * aparelho quando `allowFontScaling` está ligado, que é o padrão — ver
 * `TextAttributes.kt`, `effectiveLineHeight`. Passar aqui um valor já
 * multiplicado seria multiplicar duas vezes.
 */
export const PAUTA_EM_SP = 35;

/**
 * A mesma altura já em pixels de tela — a que a pauta **desenhada** usa.
 *
 * Aqui estava o desencontro que três correções de `paddingTop` não alcançaram.
 * Um `<View>` mede em dp e ignora a escala de fonte; o texto em cima dele não.
 * Com a fonte do sistema no padrão os dois coincidem e o defeito não existe.
 * Com a fonte aumentada, a faixa do texto cresce e a pauta não, e a escrita
 * desencontra **um pouco mais a cada linha** — o que nenhum deslocamento
 * conserta, porque o errado é o passo, não a posição.
 *
 * Papel pautado de verdade tem a pauta feita para a letra de quem escreve.
 * Aqui é a mesma ideia: quem aumentou a fonte do celular ganha um caderno de
 * pauta larga, em vez de um caderno onde a letra não cabe na linha.
 *
 * Lido uma vez, na importação. Mudar o tamanho de fonte do sistema reinicia a
 * atividade no Android, então o módulo é avaliado de novo com o valor novo.
 */
export const PAUTA = PAUTA_EM_SP * PixelRatio.getFontScale();

const LINE_COUNT = 14;
const TOP_PADDING = 6;

/**
 * Folha de caderno: pauta horizontal, margem vermelha e cantos arredondados.
 * Serve tanto para a folha que está sendo escrita quanto para a folha de baixo,
 * que aparece durante a animação de virar a página.
 */
export function RuledPaper({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: React.ComponentProps<typeof View>['style'];
}) {
  const { colors, palette, shadows } = useTema();
  return (
    <View
      style={[
        {
          /*
            A folha acompanha o tema.

            Era `palette.cream100` fixo, e no escuro virava a coisa mais clara
            da tela: uma página branca acesa num diário aberto de madrugada.
            `surface` é o papel de cada tema — creme no claro, marrom quente no
            escuro — e a tinta em cima dela já vinha de `brown900`, que
            acompanha junto.
          */
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth,
          borderColor: palette.brown200,
          paddingVertical: TOP_PADDING,
          paddingLeft: 44,
          minHeight: 260,
          overflow: 'hidden',
          ...shadows.sm,
        },
        style,
      ]}
    >
      {Array.from({ length: LINE_COUNT }).map((_, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: TOP_PADDING + (i + 1) * PAUTA,
            height: 1,
            backgroundColor: palette.brown200,
          }}
        />
      ))}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 30,
          width: 1.5,
          backgroundColor: palette.terracotta100,
        }}
      />
      {children}
    </View>
  );
}

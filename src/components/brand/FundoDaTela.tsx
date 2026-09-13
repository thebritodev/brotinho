import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTema } from '../../theme';

/**
 * O fundo da tela inicial: luz entrando por cima, assentando embaixo.
 *
 * ## Por que não uma cor só
 *
 * Creme chapado de ponta a ponta é o que mais faz uma tela parecer lista de
 * conteúdo em vez de tela inicial. A diferença entre as duas coisas quase nunca
 * está no conteúdo — está em ter ou não ter um lugar para onde o olho vai
 * primeiro. Uma superfície plana não tem; uma com luz vindo de algum lugar tem.
 *
 * ## O que exatamente está desenhado
 *
 * Duas camadas, as duas muito discretas — se der para apontar "tem um degradê
 * aqui", passou do ponto:
 *
 * 1. Um **clarão verde** atrás do cabeçalho, no tom do `primarySoft`. É a
 *    mesma ideia da `LuzDeEstufa` que envolve o broto: luz de estufa entrando
 *    pelo alto. Ele é o que dá o ponto de partida para o olho, logo onde está o
 *    nome da pessoa.
 * 2. Uma **descida** do tom da superfície para o tom afundado, de cima para
 *    baixo. Ela não é decoração: é o que faz os cartões claros do meio da tela
 *    terem de onde se destacar, e o que fecha a tela embaixo em vez de deixá-la
 *    escorrer para fora.
 *
 * ## Por que os dois temas saem de graça
 *
 * Nada aqui é cor escrita à mão: as três vêm de `useTema`. No claro,
 * `surface` é branco e `surfaceSunken` é o creme mais fundo — luz em cima,
 * peso embaixo. No escuro, `surface` é mais **claro** que o fundo e
 * `surfaceSunken` é mais escuro, então a mesma conta produz a mesma leitura
 * sem nenhum caso especial.
 *
 * ## Por que SVG
 *
 * `View` não pinta gradiente, e a alternativa seria o `expo-linear-gradient` —
 * uma dependência nova, com módulo nativo, para desenhar dois retângulos. O
 * `react-native-svg` já está em todos os binários do app desde o começo.
 * `preserveAspectRatio="none"` é de propósito: o desenho é vertical, esticar na
 * horizontal não deforma nada.
 */
export function FundoDaTela() {
  const { colors } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`desce-${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.surface} stopOpacity={0.72} />
            <Stop offset="0.32" stopColor={colors.surface} stopOpacity={0.2} />
            <Stop offset="0.58" stopColor={colors.surfaceSunken} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.surfaceSunken} stopOpacity={0.92} />
          </LinearGradient>
          <RadialGradient id={`luz-${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.primarySoft} stopOpacity={0.85} />
            <Stop offset="0.6" stopColor={colors.primarySoft} stopOpacity={0.26} />
            <Stop offset="1" stopColor={colors.primarySoft} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect x={0} y={0} width={1} height={1} fill={colors.bg} />
        {/*
          O clarão é largo e baixo — mais largo que a tela — para não ter
          contorno visível. Um círculo que cabe na tela vira uma bolha; um que
          transborda vira luz.
        */}
        <Ellipse cx={0.5} cy={0.02} rx={0.95} ry={0.3} fill={`url(#luz-${id})`} />
        <Rect x={0} y={0} width={1} height={1} fill={`url(#desce-${id})`} />
      </Svg>
    </View>
  );
}

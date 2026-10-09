import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTema } from '../../theme';
import { palette } from '../../theme/tokens';

/**
 * A textura da tela inicial: folhinhas soltas no papel, e o sol entrando pelo
 * canto de cima.
 *
 * ## Por que o fundo ganhou desenho
 *
 * O fundo desta tela já tinha duas camadas — o clarão verde atrás do cabeçalho
 * e a descida para o tom afundado, ver `FundoDaTela` — e as duas são luz. Luz
 * dá profundidade e não dá **matéria**: o creme continua sendo uma superfície
 * sem nada dentro, e é por isso que a tela lia como painel mesmo com o
 * degradê.
 *
 * O que o documento do redesenho acrescenta é matéria. Folhinhas e pontinhos,
 * fraquíssimos, ladrilhados a cada 220 pontos. Não são decoração para ser
 * vista: a 7% e a 6% de opacidade ninguém aponta uma folha. O que elas fazem é
 * dar ao olho uma escala de referência no vazio, que é o que separa papel de
 * plástico — o mesmo trabalho do `GraoDePapel`, numa frequência mais baixa.
 *
 * O grão continua existindo e vem de lá: ele é do app inteiro, ladrilhado em
 * PNG porque `feTurbulence` não existe no `react-native-svg`. Aqui só entra o
 * que é desta tela.
 *
 * ## Por que `Pattern`, e não uma lista de folhas
 *
 * Porque a tela inicial é mais alta que a janela e cresce com o conteúdo:
 * espalhar folhas à mão exigiria saber a altura antes de desenhar, que é
 * justamente o que não dá para saber sem medir — e medir não funciona na web.
 * Ver o `Veu` do `CartaoHeroi`. `Pattern` com `patternUnits="userSpaceOnUse"`
 * resolve isso no próprio SVG: o ladrilho se repete até onde o retângulo for.
 *
 * ## O sol
 *
 * Um clarão de 320 no canto superior direito, metade dele para fora da tela.
 * Ele não é o mesmo que o clarão verde do `FundoDaTela`: aquele é luz de
 * estufa, difusa, atrás do nome; este é **direção** — a luz vem de um lugar, e
 * é de lá que vêm as sombras dos cartões logo abaixo. Dois clarões porque são
 * duas coisas; se fosse um só, a tela perderia o lado de onde amanhece.
 *
 * No tema escuro ele cai para um quinto da força, como no documento: um sol de
 * 45% sobre fundo quase preto não é madrugada, é um holofote.
 */
export function TexturaDaHome() {
  const { tema } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const claro = tema === 'claro';

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%">
        <Defs>
          {/*
            O ladrilho do documento, ponto a ponto: cinco folhas e sete grãos
            numa caixa de 220. As posições são as de lá — elas foram escolhidas
            para o ladrilho não mostrar fileira nem diagonal, que é o defeito
            que aparece em qualquer distribuição regular e some com uma
            irregular. Mexer numa delas é refazer essa conta.
          */}
          <Pattern
            id={`folhas-${id}`}
            patternUnits="userSpaceOnUse"
            width={220}
            height={220}
            viewBox="0 0 220 220"
          >
            <Path
              d="M30 40c6-10 18-12 22-8-2 9-12 14-22 8z"
              fill={palette.green500}
              opacity={0.07}
            />
            <Path
              d="M150 26c-8-6-8-17-4-20 8 2 10 13 4 20z"
              fill={palette.green500}
              opacity={0.07}
            />
            <Path
              d="M96 120c8-8 20-7 23-2-4 8-15 10-23 2z"
              fill={palette.green500}
              opacity={0.07}
            />
            <Path
              d="M188 150c-2-10 5-19 10-18 3 8-2 16-10 18z"
              fill={palette.green500}
              opacity={0.07}
            />
            <Path
              d="M40 176c-9-5-11-16-7-19 8 1 12 11 7 19z"
              fill={palette.green500}
              opacity={0.07}
            />
            {[
              [70, 80, 1.6],
              [128, 70, 1.2],
              [176, 96, 1.5],
              [20, 110, 1.2],
              [140, 196, 1.6],
              [92, 200, 1.1],
              [206, 18, 1.3],
            ].map(([cx, cy, r]) => (
              <Circle
                key={`${cx}:${cy}`}
                cx={cx}
                cy={cy}
                r={r}
                /*
                  O grão escuro clareia no tema escuro: o ponto é o mesmo
                  acidente do papel, e papel escuro mostra acidente por luz, não
                  por sombra. Mesma troca do `GraoDePapel`.
                */
                fill={claro ? palette.brown900 : '#FFFFFF'}
                opacity={claro ? 0.06 : 0.05}
              />
            ))}
          </Pattern>
        </Defs>

        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#folhas-${id})`} />
      </Svg>

      {/*
        O sol fica fora do SVG das folhas, e numa `View` própria, porque ele é
        ancorado na direita: dentro do SVG ele precisaria da largura da tela
        para saber onde o canto está, e aqui `right: -90` resolve sem medida
        nenhuma.
      */}
      <View style={{ position: 'absolute', right: -90, top: -110, width: 320, height: 320 }}>
        <Svg width={320} height={320} viewBox="0 0 320 320">
          <Defs>
            <RadialGradient id={`sol-${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.yellow300} stopOpacity={claro ? 0.45 : 0.12} />
              <Stop offset="0.68" stopColor={palette.yellow300} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {/*
            O nome aqui tem de ser **o mesmo** do `id` logo acima.

            Quando não é, o `react-native-svg` não acha o gradiente e preenche
            de preto — não avisa, não erra, só pinta. No navegador o mesmo
            engano não desenha nada, então ele atravessa a conferência e só
            aparece no aparelho. Foi o que aconteceu: um disco preto de 320 no
            canto de cima da tela inicial.
          */}
          <Circle cx={160} cy={160} r={160} fill={`url(#sol-${id})`} />
        </Svg>
      </View>
    </View>
  );
}

import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { palette, tracos } from '../../theme/tokens';
import { cresce, curva, desloca, gira } from './movimentoDaCena';
import { Sprout } from './Sprout';

/**
 * A cena do Diário: o caderno aberto sobre a mesa, com o lápis ao lado.
 *
 * ## Por que o arquivo encolheu, e mudou de nome
 *
 * Ele se chamava `cenasDoCarrossel` e tinha quatro cenas — prática, diário,
 * composta e frase —, uma para cada cartão de um carrossel que não existe
 * mais. O redesenho da tela inicial levou as outras três embora: a Composta
 * virou cartão com cena própria (`CartaoDaComposta`), a frase virou canteiro
 * (`CartaoDaFrase`), e a prática deixou de ter cartão.
 *
 * Sobrou o Diário, que mora na aba do broto. Um arquivo chamado "cenas do
 * carrossel" com uma cena só, de uma tela que não é carrossel, é um nome que
 * mente — e nome que mente é o que faz alguém procurar no lugar errado daqui a
 * seis meses.
 */

/** O brilho de quatro pontas do documento. */
const BRILHO = 'M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z';

/**
 * Diário — um caderno aberto sobre a mesa, com um lápis pousado ao lado.
 *
 * Caderno, e não tela: a promessa do diário é que aquilo não sai do aparelho, e
 * papel é o objeto que diz isso sem escrever. O caderno está **aberto** e não
 * fechado porque a ação é escrever agora, não guardar.
 */
/**
 * Diário — o caderno de espiral fechado, o lápis e o broto olhando.
 *
 * ## O que havia aqui, e por que mudou
 *
 * Havia um caderno **aberto** sobre a mesa, visto de frente, com um lápis
 * pousado ao lado. O argumento era bom: papel é o objeto que diz "isto não sai
 * do aparelho" sem precisar escrever. O argumento continua bom, e o caderno
 * continua sendo papel.
 *
 * O que mudou é que o documento desenha a cena, e desenha outra: o caderno
 * **fechado**, de espiral, tombado alguns graus, com o lápis atravessando por
 * cima e o broto espiando do lado. A diferença não é de gosto. Caderno aberto
 * em branco é o convite para preencher — é a imagem de uma tarefa. Caderno
 * fechado com alguém ao lado é a imagem de uma coisa guardada, que é o que o
 * diário deste app promete.
 *
 * E o broto tinha de estar aqui. Em todas as outras telas ele acompanha; no
 * cartão que convida a escrever o que doeu, ele era o único ausente.
 *
 * ## A geometria é a do documento
 *
 * Caixa de 342 por 150, e os números saem de lá sem arredondar: o caderno em
 * 128/36, as cinco argolas de quinze em quinze, o lápis girado 28 graus. O que
 * é nosso é a maneira de animar — `curva(p, ...)` no toque, como as outras
 * cenas, em vez do `<animate>` do SVG, que não chega no `react-native-web`.
 */
const DIARIO = { largura: 342, altura: 150 };

export function CenaDoDiario({
  passo = 0,
  altura,
  largura,
}: {
  passo?: number;
  /** A altura do cartão: a arte ocupa a faixa de cima dela. */
  altura: number;
  /** A largura do cartão, para a caixa do documento ser escalada inteira. */
  largura: number;
}) {
  const p = passo;

  /* O caderno endireita no toque, e o lápis sobe para a página. */
  const giroDoCaderno = curva(p, [-4, -3.2, -2.2, -1.4, -1]);
  const subidaDoLapis = curva(p, [0, -3, -7, -10, -12]);

  /*
    A arte é uma **faixa** no alto do cartão, e não o cartão inteiro.

    A caixa do documento é 342 por 150 — larga e rasa. Esticada na altura de um
    cartão de 330, com `slice`, ela amplia até o caderno sair pelos quatro
    lados: foi o que aconteceu na primeira tentativa, e o que sobrava na tela
    era um pedaço de argola. A faixa mantém a proporção de lá.
  */
  const faixa = altura * 0.52;

  /*
    A caixa inteira é escalada de uma vez, e esse é o ponto.

    A versão anterior deixava o `Svg` se virar com `preserveAspectRatio` e
    punha o broto por fora dele, posicionado em **porcentagem do contentor**.
    As duas coisas crescem por réguas diferentes: o `slice` amplia o desenho
    para cobrir a caixa, e a porcentagem não amplia nada. O caderno ficava
    grande e o broto ficava pequeno ao lado dele — exatamente a diferença que
    sobrava entre o nosso cartão e o do documento.

    Agora existe uma caixa de 342 por 150, do tamanho exato do documento, com
    o `Svg` e o broto dentro dela nas coordenadas de lá. Ela inteira recebe um
    `scale`. O que cresce, cresce junto.
  */
  const escala = Math.max(largura / DIARIO.largura, faixa / DIARIO.altura);
  const sobraX = (largura - DIARIO.largura * escala) / 2;
  const sobraY = faixa - DIARIO.altura * escala;

  return (
    <View style={{ flex: 1 }} pointerEvents="none">
      <View style={{ height: faixa, overflow: 'hidden' }}>
      <View
        style={{
          position: 'absolute',
          left: sobraX,
          top: sobraY,
          width: DIARIO.largura,
          height: DIARIO.altura,
          transform: [{ scale: escala }],
          transformOrigin: 'top left',
        }}
      >
      <Svg
        width={DIARIO.largura}
        height={DIARIO.altura}
        viewBox={`0 0 ${DIARIO.largura} ${DIARIO.altura}`}
      >
        {/* O chão claro em que tudo pousa: uma lombada rasa, sem contorno. */}
        <Path
          d="M 0 128 C 90 112 250 112 342 126 L 342 150 L 0 150 Z"
          fill="#FFFFFF"
          opacity={0.55}
        />

        <G transform={gira(giroDoCaderno, 185, 90)}>
          {/* A sombra do caderno é uma segunda capa, deslocada — o jeito do
              documento de dar espessura sem desfoque. */}
          <Rect
            x={133}
            y={41}
            width={112}
            height={90}
            rx={8}
            fill={palette.terracotta400}
            stroke={tracos.contorno}
            strokeWidth={3.5}
          />
          <Rect
            x={128}
            y={36}
            width={112}
            height={90}
            rx={8}
            fill={palette.cream100}
            stroke={tracos.contorno}
            strokeWidth={3.5}
          />
          {[0, 1, 2, 3].map((i) => (
            <Path
              key={`ln${i}`}
              d={`M 150 ${62 + i * 14} L ${i === 3 ? 196 : 222} ${62 + i * 14}`}
              stroke={palette.brown200}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <Circle
              key={`rg${i}`}
              cx={134}
              cy={52 + i * 15}
              r={4.5}
              fill={palette.yellow100}
              stroke={tracos.contorno}
              strokeWidth={2.5}
            />
          ))}
          {/* A folhinha desenhada na capa: a marca de quem é o caderno. */}
          <Path
            d="M 208 104 C 214 96 222 100 218 108 C 214 114 206 110 208 104 Z"
            fill={tracos.folha}
            stroke={tracos.contornoFolha}
            strokeWidth={2}
          />
        </G>

        <G transform={`${desloca(236, 20 + subidaDoLapis)} ${gira(28, 0, 0)}`}>
          <Rect
            x={0}
            y={0}
            width={12}
            height={70}
            rx={3}
            fill={palette.amber400}
            stroke={tracos.contorno}
            strokeWidth={2.5}
          />
          <Path
            d="M 0 70 L 6 84 L 12 70 Z"
            fill={palette.cream200}
            stroke={tracos.contorno}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <Rect
            x={0}
            y={0}
            width={12}
            height={10}
            rx={3}
            fill={palette.terracotta100}
            stroke={tracos.contorno}
            strokeWidth={2.5}
          />
        </G>

        {/* Os brilhos do documento, nos três cantos livres. */}
        {[
          { x: 282, y: 40, escala: 1, cor: palette.amber400 },
          { x: 300, y: 92, escala: 0.7, cor: palette.terracotta400 },
          { x: 104, y: 30, escala: 0.6, cor: palette.amber400 },
        ].map((b) => (
          <G key={`sk${b.x}`} transform={`${desloca(b.x, b.y)} scale(${b.escala})`}>
            <Path d={BRILHO} fill={b.cor} />
          </G>
        ))}
      </Svg>

      {/*
        O broto fica fora do `Svg` porque ele **é** um `Svg`, e `Svg` dentro de
        `Svg` não é caminho no `react-native-svg`. A posição sai da mesma caixa
        de 342 por 150 do documento, em fração, para acompanhar o corte.
      */}
      <View style={{ position: 'absolute', left: 30, top: 30 }}>
        {/* As coordenadas são as do documento: `translate(34 44) scale(.47)`
            sobre um broto de 200 de largura dá 94 aqui. */}
        {/*
          O mesmo rosto da tela do Diário, e pelo mesmo motivo.

          Era `feliz` com a pose `pensa`. A pose põe o olhar em cima e à
          direita e torce a boca, e o que ela entrega é alguém olhando para
          outro lugar — num convite para escrever o que doeu, olhar para outro
          lugar é a coisa errada. Agora é o rosto do humor `leve`, parado:
          olhos no meio, sorriso simétrico pequeno, bochecha.

          E é o **mesmo** rosto que a tela que este cartão abre mostra. O
          cartão é a porta; o personagem não pode trocar de cara ao atravessá-la.
        */}
        <Sprout mood="leve" stage={2} size={94} pose="parado" />
      </View>
      </View>
      </View>
    </View>
  );
}



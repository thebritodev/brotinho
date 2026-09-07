import React, { useId } from 'react';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { entreAspas } from '../../data/conselhos';
import { fonts } from '../../theme';
import { ABERTO, EIXO, MIOLO, PETALA } from './geometriaDaFlor';
import { corpoDaFrase, linhasDaFrase } from './quebraDeLinha';

/**
 * A frase virada em imagem, para o story.
 *
 * ## Por que este é o único conteúdo do app que pode sair do aparelho
 *
 * Porque **não é da pessoa**. O diário não sai, a Composta não sai, o humor não
 * sai — está na política de privacidade e na ficha da loja, e vale. A frase é
 * do app, escrita antes de qualquer pessoa instalar. É o único material que dá
 * para compartilhar sem furar a promessa central.
 *
 * O que ela revela é outra coisa, e é escolha de quem posta: quem publica "não
 * acredite em tudo que a sua ansiedade te conta" está contando algo sobre o
 * próprio dia. Por isso compartilhar nunca é o botão mais gritante da tela, e
 * nunca é sugerido — é oferecido.
 *
 * ## Por que é um SVG, e não componentes fotografados
 *
 * A primeira versão montava o card com `View` e `Text` de verdade e tirava uma
 * foto com o `react-native-view-shot`. Era melhor num ponto — quebra de linha
 * automática — e pior num que acabou decidindo: **dependia de um módulo nativo
 * novo**. Duas builds depois, o módulo estava dentro do APK, autolinkado, com
 * `packageInstance` correto na configuração, e mesmo assim não era encontrado
 * em execução.
 *
 * O `react-native-svg` já está em todos os binários do app desde o começo, e
 * sabe exportar PNG sozinho (`toDataURL`). Trocar para ele tirou o compartilhar
 * da fila de "só funciona depois de instalar alguma coisa".
 *
 * O preço é a quebra de linha, que passou a ser nossa — `<Text>` de SVG não
 * quebra sozinho. Ver `quebraDeLinha.ts` e `scripts/confere-story.js`, que mede
 * as vinte frases com a fonte de verdade e quebra se alguma vazar.
 *
 * ## O tamanho e as cores
 *
 * 1080 × 1920 é o story do Instagram. O fundo é o verde da marca, não o
 * terracota do ícone, por contraste: creme sobre terracota dá 2,5:1 — ilegível
 * em miniatura, que é como a maioria das pessoas vai ver isto. Sobre o verde
 * escuro dá 9:1. O terracota entra do mesmo jeito, no ícone lá embaixo, onde é
 * um detalhe e não o fundo do texto.
 *
 * Story não tem link clicável. Quem gostou da frase precisa saber **o que
 * procurar** — e "Brotinho" sozinho pode ser qualquer coisa. Um quadrado
 * arredondado com um ícone dentro diz "isto é um aplicativo" sem gastar uma
 * palavra, e o nome ao lado diz qual.
 */

export const STORY = { largura: 1080, altura: 1920 };

/* Cores fixas: isto vira arquivo e sai do aparelho, então não segue o tema de
   quem exportou. Uma frase postada de noite não pode sair diferente da mesma
   frase postada de dia. */
const FUNDO = '#2E4A3B';
const TINTA = '#FBF6EC';
const PETALA_FILL = '#A9C0B0';
const BRILHO = '#FCEFC7';
const ARO = '#E8B65A';

const ENTRELINHA = 1.42;
const FLOR = 330;
/** Espaço entre a flor e a primeira linha. */
const RESPIRO = 92;

/** A flor aberta, com halo — o mesmo desenho que abre na tela. */
function Flor({ x, y, tamanho, id }: { x: number; y: number; tamanho: number; id: string }) {
  const escala = tamanho / 120;
  return (
    <G transform={`translate(${x - tamanho / 2} ${y - tamanho / 2}) scale(${escala})`}>
      <Circle cx={MIOLO.cx} cy={MIOLO.cy} r={58} fill={`url(#halo-${id})`} />
      {ABERTO.map((a) => (
        <G key={a} transform={`rotate(${a} ${EIXO.x} ${EIXO.y})`}>
          <Path
            d={PETALA}
            fill={`url(#petala-${id})`}
            stroke={TINTA}
            strokeWidth={3.4}
            strokeLinejoin="round"
          />
          <Path
            d="M59 64 C 52 56, 51 45, 58 33"
            stroke={TINTA}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
            opacity={0.5}
          />
        </G>
      ))}
      <Circle cx={MIOLO.cx} cy={MIOLO.cy} r={13} fill={BRILHO} stroke={ARO} strokeWidth={2.4} />
      <Circle cx={MIOLO.cx} cy={MIOLO.cy - 1.2} r={7.5} fill={TINTA} />
    </G>
  );
}

export const CardDoStory = React.forwardRef<Svg, { texto: string }>(function CardDoStory(
  { texto },
  ref,
) {
  /* Id por instância: `url(#...)` não tem escopo em SVG. */
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  const frase = entreAspas(texto);
  const corpo = corpoDaFrase(texto);
  const linhas = linhasDaFrase(frase, corpo);
  const alturaDaLinha = corpo * ENTRELINHA;

  /*
    A flor e a frase são um bloco só, centrado na altura; a marca fica fixa
    embaixo. Com os três espalhados, sobrava um vão morto entre a flor e o
    texto, e a flor parecia de outro cartaz.
  */
  const alturaDoBloco = FLOR + RESPIRO + linhas.length * alturaDaLinha;
  const topoDoBloco = (STORY.altura - alturaDoBloco) / 2;
  /*
    `alignmentBaseline` não se comporta igual entre Android, iOS e web, então a
    posição da linha é calculada a partir do topo: 0,74 do corpo é onde a linha
    de base da Baloo 2 cai.
  */
  const primeiraLinhaY = topoDoBloco + FLOR + RESPIRO + corpo * 0.74;

  /*
    A marca a 270 do fundo, não no rodapé: o Instagram desenha a barra de
    responder por cima dos ~250px de baixo, e a única parte do card que diz de
    onde a frase veio era justamente a que ficaria escondida.
  */
  const marcaY = STORY.altura - 270;
  const iconeLado = 104;
  const nome = 'Brotinho';
  const larguraDaMarca = iconeLado + 26 + 50 * 0.58 * nome.length;
  const marcaX = (STORY.largura - larguraDaMarca) / 2;

  return (
    <Svg
      ref={ref}
      width={STORY.largura}
      height={STORY.altura}
      viewBox={`0 0 ${STORY.largura} ${STORY.altura}`}
    >
      <Defs>
        <LinearGradient id={`petala-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C6D8CB" />
          <Stop offset="1" stopColor={PETALA_FILL} />
        </LinearGradient>
        <RadialGradient id={`halo-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={BRILHO} stopOpacity={0.5} />
          <Stop offset="0.5" stopColor={BRILHO} stopOpacity={0.14} />
          <Stop offset="1" stopColor={BRILHO} stopOpacity={0} />
        </RadialGradient>
        <ClipPath id={`icone-${id}`}>
          <Rect
            x={marcaX}
            y={marcaY - iconeLado / 2}
            width={iconeLado}
            height={iconeLado}
            rx={24}
          />
        </ClipPath>
      </Defs>

      <Rect x={0} y={0} width={STORY.largura} height={STORY.altura} fill={FUNDO} />

      <Flor x={STORY.largura / 2} y={topoDoBloco + FLOR / 2} tamanho={FLOR} id={id} />

      {linhas.map((linha, i) => (
        <SvgText
          key={`${i}-${linha}`}
          x={STORY.largura / 2}
          y={primeiraLinhaY + i * alturaDaLinha}
          fill={TINTA}
          fontSize={corpo}
          fontFamily={fonts.display.semiBold}
          textAnchor="middle"
        >
          {linha}
        </SvgText>
      ))}

      <SvgImage
        x={marcaX}
        y={marcaY - iconeLado / 2}
        width={iconeLado}
        height={iconeLado}
        href={require('../../../assets/icon.png')}
        clipPath={`url(#icone-${id})`}
        preserveAspectRatio="xMidYMid slice"
      />
      <SvgText
        x={marcaX + iconeLado + 26}
        y={marcaY + 18}
        fill={TINTA}
        fontSize={50}
        fontFamily={fonts.display.bold}
      >
        {nome}
      </SvgText>
    </Svg>
  );
});

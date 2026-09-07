import React from 'react';
import { Circle, G, Path, Rect } from 'react-native-svg';

/**
 * A marca do Brotinho desenhada em vetor, para viver dentro de outro SVG.
 *
 * ## Por que não é o `assets/icon.png`
 *
 * Porque no card do story ele **não aparecia**. Um `<Image>` de SVG carrega o
 * arquivo de forma assíncrona, e o card é fotografado um quadro depois de ser
 * montado: quando o `toDataURL` roda, a imagem ainda não chegou, e o que sai é
 * um buraco. Não dava para consertar esperando — não há como saber quando o
 * `react-native-svg` terminou de carregar um `href`.
 *
 * Vetor não tem esse problema: ele já **é** o desenho. Desenha junto com o
 * resto, no mesmo quadro, sempre.
 *
 * ## De onde vêm estes caminhos
 *
 * Do `exports/svg/marca-principal-transparente.svg`, o arquivo do designer —
 * não de um redesenho meu. Só saiu o bloco de metadados C2PA, que ocupava 90%
 * do arquivo e não desenha nada. As proporções, as cores e o sorriso são os
 * mesmos do ícone que está na App Store.
 */

/* As cores da marca. Fixas: isto vira arquivo e sai do aparelho. */
const CONTORNO = '#2E4A3B';
const FOLHA = '#5B8A72';
const ROSTO = '#9EBBAA';
const TRACO_DO_ROSTO = '#3A3630';
/** O barro do ícone da loja — é ele que faz o desenho ler como "app". */
export const FUNDO_DA_MARCA = '#D98866';

/** Uma folha, com a nervura. Espelhada para o outro lado. */
function Folha({ espelhada }: { espelhada?: boolean }) {
  const giro = espelhada
    ? 'translate(100,147) scale(-1,1) rotate(8) scale(1.31)'
    : 'translate(100,147) rotate(8) scale(1.34)';
  return (
    <G transform={giro}>
      <Path
        d="M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z"
        fill={FOLHA}
        stroke={CONTORNO}
        strokeWidth={3.85}
        strokeLinejoin="round"
      />
      <Path
        d="M -2 -2 C -10 -8 -18 -14 -26 -18"
        stroke={CONTORNO}
        strokeWidth={1.72}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
    </G>
  );
}

/**
 * O broto: caule, duas folhas e a carinha. Desenhado numa caixa de 200×200.
 *
 * `x`, `y` e `lado` posicionam a caixa; `comFundo` acrescenta o quadrado
 * arredondado de barro, que é o que faz o conjunto ler como ícone de aplicativo
 * em vez de ilustração solta.
 */
export function MarcaEmSvg({
  x,
  y,
  lado,
  comFundo = true,
}: {
  x: number;
  y: number;
  lado: number;
  comFundo?: boolean;
}) {
  const escala = lado / 200;
  return (
    <G transform={`translate(${x} ${y}) scale(${escala})`}>
      {comFundo && <Rect x={0} y={0} width={200} height={200} rx={46} fill={FUNDO_DA_MARCA} />}
      <G transform="translate(100,100) scale(1.28) translate(-99.4,-109.5)">
        <Path
          d="M100,172 C94,150 106,136 100,86"
          stroke={CONTORNO}
          strokeWidth={7.5}
          strokeLinecap="round"
          fill="none"
        />
        <Folha />
        <Folha espelhada />
        <Circle cx={100} cy={78} r={31} fill={ROSTO} stroke={CONTORNO} strokeWidth={4.5} />
        <G transform="translate(100,78) scale(1.65)">
          <Circle cx={-9} cy={0} r={2.6} fill={TRACO_DO_ROSTO} />
          <Circle cx={9} cy={0} r={2.6} fill={TRACO_DO_ROSTO} />
          <Path
            d="M -8 6 Q 0 11 8 6"
            stroke={TRACO_DO_ROSTO}
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </G>
    </G>
  );
}

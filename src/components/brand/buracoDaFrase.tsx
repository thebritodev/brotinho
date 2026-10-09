import React, { useId } from 'react';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { tracos } from '../../theme/tokens';
import { TERRA, TERRA_FUNDA, TERRA_SOMBRA } from './terraDoCanteiro';

/**
 * O buraco da Frase do dia: a cova, a folha enterrada e a terra que a tampa.
 *
 * ## Por que isto é um arquivo
 *
 * Porque o mecanismo e a moldura dele têm tempos de vida diferentes. A moldura
 * já foi faixa de tela inteira e agora é cartão (ver `CartaoDaFrase`); o
 * mecanismo — a cova que cede em três estágios, a folha que não sai do lugar, a
 * terra recortada por cima dela — não mudou em nenhuma das versões, e não tem
 * por que ser reescrito quando a moldura mudar de novo.
 *
 * Aqui mora o que é **desenho e medida**. O que é encenação — quando cada
 * estágio dispara, o tremor, os farelos que caem pela tela — continua em quem
 * usa, porque isso depende da tela em volta.
 */

/**
 * A folha, em pontos.
 *
 * Em retrato, e inteira à vista: no corte não há o que esconder, a terra
 * já foi fatiada e a gente vê o que está dentro dela.
 */
export const PAPEL = { largura: 88, altura: 104 };

/** Onde o papel fica, em fração da largura. */
export const COLUNA_DO_PAPEL = 0.5;

/**
 * O buraco, fechado e aberto.
 *
 * ## Fechado, ele é menor que a folha
 *
 * Uns dois terços da largura dela e menos da metade da altura. A terra em
 * volta é desenhada **por cima** da folha, com o buraco recortado — então
 * as bordas do buraco tampam as bordas da folha, e o que aparece é só o
 * miolo, com a escrita.
 *
 * ## Aberto, ele é maior que ela
 *
 * Desenterrar é o buraco se abrir e revelar a folha inteira, e não a folha
 * sair dele. A folha fica onde sempre esteve; muda só o tamanho da boca.
 *
 * A versão anterior fazia o contrário — a folha subia para fora — e
 * precisava de um recorte para esconder só a metade de baixo dela. O
 * `react-native-svg` no Android ignorava esse recorte: sobrava uma fatia da
 * folha boiando acima da terra, solta. Com o buraco abrindo não há recorte
 * nenhum, e nada para o Android errar.
 *
 * `cy` é o centro contando do topo da faixa; as meias-medidas são do
 * contorno.
 */
export const COVA = {
  cy: 96,
  fechado: { meiaLargura: 34, meiaAltura: 24 },
  aberto: { meiaLargura: 62, meiaAltura: 68 },
};

/** A folha, centrada no buraco: fechado ele mostra o miolo, aberto, tudo. */
export const TOPO_DO_PAPEL = COVA.cy - PAPEL.altura / 2;

/**
 * A terra por cima da folha, em volta do buraco — relativa ao centro dele.
 *
 * Cabe o buraco aberto com folga, inclusive o passo a mais que ele dá antes
 * de assentar. Se o buraco passasse da borda disto, a regra que recorta o
 * buraco pintaria de terra o pedaço que ficou de fora.
 */
export const TAMPA = {
  meiaLargura: COVA.aberto.meiaLargura + 26,
  meiaAltura: COVA.aberto.meiaAltura + 18,
};

/** A altura do canteiro: até onde a terra em volta do buraco vai. */
export const ALTURA_DO_CANTEIRO = COVA.cy + TAMPA.meiaAltura;

/**
 * As fases da abertura, em milissegundos.
 *
 * A terra treme e a folha dá um tranco lá dentro; depois o buraco cede em
 * **três estágios**, e não de uma vez. Cada um é um estalo curto — a boca
 * alarga, passa um pouco do ponto, assenta — seguido de uma pausa, e cada
 * um solta uma leva de farelos que cai pela tela. O último é o maior e é o
 * que revela a folha inteira; a pausa depois dele é para vê-la antes de o
 * cartão abrir.
 *
 * Somado, pouco menos de três segundos. É mais que a versão de um estalo
 * só, de propósito: terra cedendo aos poucos é o que faz a abertura parecer
 * física, e isto acontece uma vez por dia.
 */
export const CAVA = 620;
export const PUXA = 420;

/**
 * Os três estágios: até quanto o buraco abre, em quanto tempo, e a pausa
 * depois. O `passa` é quanto ele ultrapassa antes de assentar — a terra
 * cedendo com um pouco de sobra, e não uma porta de correr.
 */
export const ETAPAS = [
  { ate: 0.34, dura: 400, pausa: 240, passa: 1.9 },
  { ate: 0.68, dura: 400, pausa: 240, passa: 1.9 },
  { ate: 1, dura: 540, pausa: 520, passa: 1.3 },
] as const;

/** De `a` a `b`, na fração `f`. */
export const entreDois = (a: number, b: number, f: number) => a + (b - a) * f;

/** Os torrões que caem para dentro do buraco: onde nascem, tamanho e queda. */
export const TORROES = [
  { x: -20, r: 3.2, cai: 26, anda: -3 },
  { x: -4, r: 2.6, cai: 34, anda: 1 },
  { x: 10, r: 3, cai: 22, anda: 2 },
  { x: 22, r: 2.4, cai: 30, anda: -1 },
] as const;

/**
 * O contorno do buraco, em volta do centro da coluna.
 *
 * Irregular de propósito: uma elipse perfeita lê como furo de máquina, e
 * buraco cavado à mão tem um lado mais cheio que o outro. As duas camadas
 * que usam o buraco — o fundo e a tampa — desenham **este** contorno, e é
 * por isso que ele mora numa função: se cada uma tivesse o seu, a menor
 * diferença abriria uma fresta entre o fundo e a terra.
 */
function contornoDoBuraco(cx: number, W: number, H: number): string {
  const { cy } = COVA;
  return [
    `M${cx - W} ${cy - 2}`,
    `C${cx - W} ${cy - H + 4} ${cx - W * 0.5} ${cy - H - 2} ${cx - 2} ${cy - H}`,
    `C${cx + W * 0.45} ${cy - H + 1} ${cx + W + 2} ${cy - H + 6} ${cx + W} ${cy - 4}`,
    `C${cx + W - 1} ${cy + H * 0.6} ${cx + W * 0.5} ${cy + H + 1} ${cx + 2} ${cy + H}`,
    `C${cx - W * 0.5} ${cy + H - 1} ${cx - W - 1} ${cy + H * 0.55} ${cx - W} ${cy - 2}`,
    'Z',
  ].join(' ');
}

/**
 * O fundo do buraco: o que aparece em volta da folha quando ele se abre.
 *
 * Fechado, a folha cobre o buraco inteiro e isto não se vê. Aberto, ele
 * aparece em volta dela — terra mais escura, o fundo da cova de onde ela
 * estava sendo guardada.
 */
export function FundoDoBuraco({
  largura,
  id,
  W,
  H,
}: {
  largura: number;
  id: string;
  W: number;
  H: number;
}) {
  const cx = largura * COLUNA_DO_PAPEL;
  return (
    <>
      <Defs>
        <LinearGradient id={`fundo-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2A241D" />
          <Stop offset="1" stopColor={TERRA_FUNDA} />
        </LinearGradient>
      </Defs>
      <Path d={contornoDoBuraco(cx, W, H)} fill={`url(#fundo-${id})`} />
    </>
  );
}

/**
 * A terra por cima da folha, com o buraco recortado.
 *
 * ## Como o recorte é feito
 *
 * Um retângulo da cor da terra e o contorno do buraco no **mesmo** caminho,
 * com `fillRule="evenodd"`: a regra pinta o que está dentro do retângulo e
 * fora do buraco. Não há máscara nem recorte de SVG — é um caminho só, e a
 * cor é a mesma da terra de baixo, então a tampa não tem borda visível.
 *
 * ## O que faz o buraco parecer fundo
 *
 * Três coisas, de fora para dentro: um lábio de terra remexida em volta, o
 * contorno grosso, e uma sombra entrando pela parte de cima da abertura,
 * por cima da folha — a borda fazendo sombra no que está lá dentro. Sem a
 * sombra a folha lê como colada na frente da terra, e não afundada nela.
 *
 * A sombra é o próprio contorno do buraco pintado com um degradê que vai do
 * escuro ao transparente, e não um retângulo recortado pelo buraco: recorte
 * de SVG é justamente o que o Android não aplicou na versão anterior.
 */
export function Tampa({
  largura,
  id,
  W,
  H,
}: {
  largura: number;
  id: string;
  W: number;
  H: number;
}) {
  const cx = largura * COLUNA_DO_PAPEL;
  const { cy } = COVA;
  const buraco = contornoDoBuraco(cx, W, H);
  const retangulo = `M${cx - TAMPA.meiaLargura} ${cy - TAMPA.meiaAltura} H${cx + TAMPA.meiaLargura} V${cy + TAMPA.meiaAltura} H${cx - TAMPA.meiaLargura} Z`;

  return (
    <>
      <Defs>
        <LinearGradient id={`sombra-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1F1A15" stopOpacity={0.7} />
          <Stop offset="0.45" stopColor="#1F1A15" stopOpacity={0.1} />
          <Stop offset="1" stopColor="#1F1A15" stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* A terra, com o buraco recortado. */}
      <Path d={`${retangulo} ${buraco}`} fill={TERRA_SOMBRA} fillRule="evenodd" />

      {/* A sombra que a borda faz para dentro, por cima da folha. */}
      <Path d={buraco} fill={`url(#sombra-${id})`} />

      {/* O lábio: terra remexida em volta da boca, mais clara e grossa. */}
      <Path d={buraco} fill="none" stroke={TERRA_FUNDA} strokeWidth={15} strokeLinejoin="round" />
      <Path
        d={buraco}
        fill="none"
        stroke={TERRA}
        strokeWidth={3}
        strokeLinejoin="round"
        opacity={0.45}
        transform="translate(0 -2)"
      />
      <Path d={buraco} fill="none" stroke={tracos.contorno} strokeWidth={3} strokeLinejoin="round" />

      {/*
        Torrõezinhos redondos na metade de baixo da borda. Ficam presos à
        borda por ângulo, e não por posição fixa: quando o buraco abre, eles
        vão junto com ela, como terra que foi empurrada para fora.
      */}
      {BORDA.map((b, i) => {
        const a = (b.graus * Math.PI) / 180;
        return (
          <Ellipse
            key={i}
            cx={cx + Math.cos(a) * (W + 9)}
            cy={cy + Math.sin(a) * (H + 7)}
            rx={b.r}
            ry={b.r * 0.8}
            fill={TERRA_FUNDA}
            stroke={tracos.contorno}
            strokeWidth={1.8}
          />
        );
      })}
    </>
  );
}

/**
 * Os torrões da borda: em que ângulo dela cada um fica, e o tamanho.
 * Ângulos entre 0 e 180 graus caem na metade de baixo, onde a terra
 * empurrada se acumula.
 */
const BORDA = [
  { graus: 168, r: 5 },
  { graus: 146, r: 3.4 },
  { graus: 112, r: 3 },
  { graus: 44, r: 3.6 },
  { graus: 14, r: 4.4 },
] as const;

/**
 * A folha.
 *
 * Enterrada, só o miolo dela aparece, pelo buraco; desenterrada, o buraco
 * se abre e ela aparece inteira, com a ponta dobrada, lá no fundo. A
 * escrita nunca se lê — são traços —, porque a frase não aparece sem ser
 * buscada.
 */
export function Papel({ largura, altura }: { largura: number; altura: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  /* A ponta dobrada, no canto de cima à direita. */
  const orelha = largura * 0.2;

  return (
    <Svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`}>
      <Defs>
        <LinearGradient id={`folha-${id}`} x1="0.1" y1="0" x2="0.9" y2="1">
          <Stop offset="0" stopColor="#FFFDF6" />
          <Stop offset="1" stopColor="#E8DFC8" />
        </LinearGradient>
        <LinearGradient id={`orelha-${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E0D6BD" />
          <Stop offset="1" stopColor="#F5EFDE" />
        </LinearGradient>
      </Defs>

      {/*
        A folha, com a ponta de cima à direita dobrada.

        A primeira versão era um trapézio com um vinco em V perto do topo, e
        no aparelho ela lia como **envelope** — o V é exatamente a aba de um.
        Aqui não há vinco atravessando: o que diz que é papel é a ponta
        dobrada, que é a marca de folha e de nenhuma outra coisa.

        O corpo é quase reto, com uma inclinação de dois pontos: folha enfiada
        na terra não está prumada, mas também não está tombada.
      */}
      <Path
        d={`M${largura * 0.08} ${altura} L${largura * 0.11} 10 L${largura * 0.9 - orelha} 5 L${largura * 0.9} ${5 + orelha * 0.86} L${largura * 0.95} ${altura} Z`}
        fill={`url(#folha-${id})`}
        stroke={tracos.contorno}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/*
        Três linhas escritas, no miolo da folha.

        Não deixam ler nada — são traços — e são o que faz o pedaço claro que
        aparece no buraco ser **papel escrito**, e não um retalho qualquer.
        Ficam no meio porque é por onde o buraco olha: as bordas da folha
        estão todas debaixo da terra.
      */}
      {[
        { y: 0.32, fim: 0.78, op: 0.3 },
        { y: 0.44, fim: 0.7, op: 0.26 },
        { y: 0.56, fim: 0.62, op: 0.22 },
      ].map((l) => (
        <Path
          key={l.y}
          d={`M${largura * 0.2} ${altura * l.y} L${largura * l.fim} ${altura * (l.y - 0.02)}`}
          stroke={tracos.contorno}
          strokeWidth={2.6}
          strokeLinecap="round"
          opacity={l.op}
        />
      ))}
      <Path
        d={`M${largura * 0.88 - orelha} 4 L${largura * 0.88 - orelha * 0.18} ${4 + orelha * 0.72} L${largura * 0.88} ${4 + orelha * 0.82} Z`}
        fill={`url(#orelha-${id})`}
        stroke={tracos.contorno}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * O cartão que a folha vira.
 *
 * Ele nasce pequeno e cresce até o tamanho final — o texto entra depois, já no
 * lugar. Ver o cabeçalho deste arquivo.
 */

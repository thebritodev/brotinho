import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

/**
 * As seis flores do jardim da Composta.
 *
 * ## O que elas são, e por que são seis
 *
 * Cada frase compostada deixa uma flor no solo. A flor é o registro: o jardim
 * é o histórico da ferramenta, e cada canteiro é um pensamento que a pessoa
 * repetiu até ele virar só som.
 *
 * Seis tipos em rotação, pelo índice da compostagem — a primeira é margarida,
 * a sétima também. Seis é o número do documento, e ele acerta por um motivo
 * que vale escrever: com uma flor só, o jardim é uma fileira de cópias e não
 * conta nada; com uma por frase, ninguém reconhece nada. Seis dá para
 * reconhecer "a minha margarida" e ainda assim ver variedade num solo de
 * quinze.
 *
 * ## Por que as cores são escritas à mão
 *
 * Porque o jardim é paisagem, e **paisagem tem luz própria** — a mesma regra
 * de `ceuDaComposta` e de `terraDoCanteiro`. Vindo de `useTema`, o miolo da
 * margarida clarearia à noite e o caule viraria um verde quase preto sobre um
 * céu que não anoitece. Aqui os tons são literais, e o escuro começa abaixo da
 * folha de conteúdo.
 *
 * ## A origem do desenho
 *
 * O pé da flor é o ponto (0, 0), e ela cresce para o **y negativo**. É assim
 * que a paisagem a planta: `translate(x, crista)` e nada mais. Mudar isso
 * obrigaria quem posiciona a saber a altura de cada tipo, que é o contrário do
 * que esta forma garante.
 */

/** O contorno de tudo que é desenhado aqui — o `brown900` do tema claro. */
const CONTORNO = '#3A3630';

const VERDE_CAULE = '#3E6B54';
const VERDE_FOLHA_CLARA = '#9EBBAA';
const VERDE_FOLHA = '#5B8A72';

const CREME_PETALA = '#FFFDF8';
const MIOLO_AMARELO = '#F2C14E';
const TERRACOTA = '#D98866';
const LAVANDA = '#B9AEC7';
const PAPOULA = '#E07A5F';
const CAMPANULA = '#A9C4D6';
const MIOLO_GIRASSOL = '#5B5548';

/** As seis, na ordem em que o jardim as distribui. */
export const FLORES = [
  { chave: 'margarida', nome: 'Margarida' },
  { chave: 'tulipa', nome: 'Tulipa' },
  { chave: 'lavanda', nome: 'Lavanda' },
  { chave: 'papoula', nome: 'Papoula' },
  { chave: 'girassol', nome: 'Girassol' },
  { chave: 'campanula', nome: 'Campânula' },
] as const;

export type TipoDeFlor = (typeof FLORES)[number]['chave'];

/**
 * Qual flor cabe à enésima compostagem, contando da primeira.
 *
 * O índice entra como ele é — quem chama passa a posição na ordem de criação,
 * da mais antiga para a mais nova. Isso importa: contando da mais recente, a
 * flor de uma frase **mudaria** a cada nova compostagem, e o jardim deixaria
 * de ser um histórico. A flor de uma frase é dela para sempre.
 */
export function florDoIndice(indice: number): (typeof FLORES)[number] {
  return FLORES[((indice % FLORES.length) + FLORES.length) % FLORES.length];
}

/** O traço comum: mesma espessura e mesmos cantos em todas as pétalas. */
const TRACO = {
  stroke: CONTORNO,
  strokeWidth: 2.2,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};

/** O brilho de porcelana que levanta a pétala do fundo. */
function Brilho({ cx, cy }: { cx: number; cy: number }) {
  return (
    <Ellipse
      cx={cx}
      cy={cy}
      rx={2.4}
      ry={1.4}
      fill="#fff"
      opacity={0.75}
      transform={`rotate(-30 ${cx} ${cy})`}
    />
  );
}

/**
 * Sombra, caule e duas folhas — iguais nas seis.
 *
 * As folhas são de verdes diferentes de propósito: duas folhas do mesmo tom
 * leem como uma forma só quando a flor está a 0,85 de escala no fundo do
 * jardim, que é o tamanho em que ela aparece na maioria das telas.
 */
function Caule() {
  return (
    <>
      <Ellipse cx={0} cy={1} rx={12} ry={2.4} fill={CONTORNO} opacity={0.18} />
      <Path d="M 0 0 C 2 -12 -2 -24 0 -36" fill="none" stroke={VERDE_CAULE} strokeWidth={2.6} strokeLinecap="round" />
      <Path
        d="M 0 -12 C 8 -20 15 -16 15 -11 C 9 -9 4 -9 0 -12 Z"
        fill={VERDE_FOLHA_CLARA}
        {...TRACO}
        strokeWidth={1.8}
      />
      <Path
        d="M 0 -20 C -7 -27 -13 -23 -13 -19 C -8 -17 -4 -17 0 -20 Z"
        fill={VERDE_FOLHA}
        {...TRACO}
        strokeWidth={1.8}
      />
    </>
  );
}

function Margarida() {
  return (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <Ellipse
          key={a}
          cx={0}
          cy={-47}
          rx={3.6}
          ry={7.5}
          fill={CREME_PETALA}
          transform={`rotate(${a} 0 -40)`}
          {...TRACO}
          strokeWidth={1.6}
        />
      ))}
      <Circle cx={0} cy={-40} r={4.8} fill={MIOLO_AMARELO} {...TRACO} strokeWidth={1.8} />
      <Brilho cx={-1.5} cy={-41.5} />
    </>
  );
}

function Tulipa() {
  return (
    <>
      <Path
        d="M -9 -50 C -11 -38 -7 -32 0 -32 C 7 -32 11 -38 9 -50 L 4.5 -43 L 0 -51 L -4.5 -43 Z"
        fill={TERRACOTA}
        {...TRACO}
      />
      <Path d="M 0 -51 L 0 -34" fill="none" stroke={CONTORNO} strokeWidth={1.4} opacity={0.4} />
      <Brilho cx={-5} cy={-44} />
    </>
  );
}

function Lavanda() {
  return (
    <>
      <Path d="M 0 -36 L 0 -58" fill="none" stroke={VERDE_CAULE} strokeWidth={2} strokeLinecap="round" />
      {[-36, -41, -46, -51, -56].map((y, i) => (
        <Circle
          key={y}
          cx={i % 2 ? 2.6 : -2.6}
          cy={y}
          r={3.6 - i * 0.25}
          fill={LAVANDA}
          {...TRACO}
          strokeWidth={1.5}
        />
      ))}
      <Circle cx={0} cy={-60} r={2.4} fill={LAVANDA} {...TRACO} strokeWidth={1.4} />
    </>
  );
}

function Papoula() {
  return (
    <>
      {[0, 72, 144, 216, 288].map((a) => {
        const r = (a * Math.PI) / 180;
        return (
          <Circle
            key={a}
            cx={Math.sin(r) * 5.5}
            cy={-41 - Math.cos(r) * 5.5}
            r={6.4}
            fill={PAPOULA}
            {...TRACO}
            strokeWidth={1.6}
          />
        );
      })}
      <Circle cx={0} cy={-41} r={3} fill={CONTORNO} />
      <Brilho cx={-4} cy={-46} />
    </>
  );
}

function Girassol() {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => (
        <Ellipse
          key={i}
          cx={0}
          cy={-51}
          rx={2.8}
          ry={6}
          fill={MIOLO_AMARELO}
          transform={`rotate(${i * 30} 0 -42)`}
          {...TRACO}
          strokeWidth={1.4}
        />
      ))}
      <Circle cx={0} cy={-42} r={6} fill={MIOLO_GIRASSOL} {...TRACO} strokeWidth={1.8} />
      <Circle cx={-2} cy={-44} r={1} fill="#fff" opacity={0.5} />
    </>
  );
}

function Campanula() {
  return (
    <>
      <Path d="M 0 -36 C 0 -46 6 -52 12 -50" fill="none" stroke={VERDE_CAULE} strokeWidth={2} strokeLinecap="round" />
      <Path d="M 0 -40 C -2 -48 -8 -52 -12 -50" fill="none" stroke={VERDE_CAULE} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M 6 -50 C 6 -42 9 -38 12 -38 L 20 -38 C 18 -40 18 -46 16 -50 C 14 -54 8 -54 6 -50 Z"
        fill={CAMPANULA}
        {...TRACO}
        strokeWidth={1.6}
      />
      <Path
        d="M -6 -48 C -6 -40 -9 -36 -12 -36 L -20 -36 C -18 -38 -18 -44 -16 -48 C -14 -52 -8 -52 -6 -48 Z"
        fill={CAMPANULA}
        {...TRACO}
        strokeWidth={1.6}
      />
    </>
  );
}

const CABECAS: Record<TipoDeFlor, () => React.ReactElement> = {
  margarida: Margarida,
  tulipa: Tulipa,
  lavanda: Lavanda,
  papoula: Papoula,
  girassol: Girassol,
  campanula: Campanula,
};

/**
 * Uma flor, para ser plantada dentro de um `Svg` que já existe.
 *
 * Devolve nós de SVG, e não um `Svg` próprio: a paisagem desenha dez delas, e
 * dez `Svg` aninhados são dez superfícies de composição em vez de dez grupos.
 */
export function FlorDaComposta({ tipo }: { tipo: TipoDeFlor }) {
  const Cabeca = CABECAS[tipo] ?? Margarida;
  return (
    <G>
      <Caule />
      <Cabeca />
    </G>
  );
}

/**
 * A mesma flor como ícone solto, com a caixa em volta dela.
 *
 * A caixa `-26 -66 52 70` é a do documento: a mais larga das seis é a
 * campânula, com os dois sininhos abertos, e a mais alta é a lavanda, com a
 * espiga até -60. Uma caixa por tipo deixaria os ícones em tamanhos
 * diferentes dentro do mesmo quadrado âmbar.
 */
export function IconeDaFlor({ tipo, tamanho }: { tipo: TipoDeFlor; tamanho: number }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="-26 -66 52 70">
      <FlorDaComposta tipo={tipo} />
    </Svg>
  );
}

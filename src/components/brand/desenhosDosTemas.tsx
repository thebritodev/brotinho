import React, { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { palette, tracos } from '../../theme/tokens';
import { BRASA, TERRA, TERRA_CLARA, TERRA_SOMBRA } from './terraDoCanteiro';

/**
 * Uma cena para cada tema de prática, no lugar do ícone de traço.
 *
 * ## Por que trocar
 *
 * Os treze temas usavam ícones de traço dentro de um quadrado colorido, e três
 * deles emprestavam o ícone de outro destino do app — "Luto" usava a ampulheta,
 * "Comparação" usava a lupa da busca. Ícone emprestado não é neutro: ele diz
 * que aquilo é a mesma coisa que o outro lugar.
 *
 * Com o Diário, a Composta e a Frase do dia virando cena desenhada, os temas
 * ficaram sendo a única parte da tela inicial falando por ícone. Agora falam a
 * mesma língua: forma cheia, contorno fino, um detalhe de luz, tudo num
 * quadrado de 60.
 *
 * ## O quadrado colorido continua
 *
 * A cor de cada tema (`tintsDosTemas`) é o que separa treze cartões iguais numa
 * grade, e ela segue o tema claro/escuro. A cena mora **dentro** dele: o
 * desenho diz o assunto, a cor diz qual é qual.
 *
 * ## As metáforas
 *
 * Todas saem do mesmo mundo do app — jardim, papel, terra, tempo —, e nenhuma
 * ilustra a pessoa. Desenhar alguém triste seria dizer como ela deveria se
 * parecer triste; um objeto deixa o assunto ser o assunto.
 */

type Tema =
  | 'ansiedade'
  | 'tristeza'
  | 'luto'
  | 'insonia'
  | 'estresse'
  | 'solidao'
  | 'raiva'
  | 'procrastinacao'
  | 'autoestima'
  | 'culpa'
  | 'comparacao'
  | 'foco'
  | 'gratidao';

const CONTORNO = tracos.contorno;
const TRACO = 1.8;

/*
  Estas cenas não têm sombra de chão, e é decisão, não esquecimento.

  Cada uma teve uma elipse cinza embaixo do objeto — a sombra existia para ele
  não flutuar dentro do quadradinho de 46 pontos em que a cena vivia. Esse
  quadradinho acabou: hoje o desenho é grande e **atravessa a borda de baixo do
  cartão**, e o que era apoio virou defeito. A sombra caía fora do cartão, sobre
  o creme da página, e ficava sendo a única parte da ilustração pousada no nada
  — treze manchas cinzas soltas entre uma fileira e outra.

  Sem ela o objeto não flutua: quem o apoia agora é a borda do cartão que ele
  cruza. Ver `SOBRA_DO_DESENHO`, em `PracticeTopicCard`.
*/

/** A folha do broto, para reaproveitar nas cenas que têm planta. */
const FOLHA = 'M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z';

function Ansiedade() {
  return (
    <>
      {/* Três rajadas e uma folha levada: agitação, sem desenhar ninguém. */}
      {[
        'M7 21 Q21 15 33 21',
        'M11 31 Q27 24 43 31',
        'M9 41 Q23 35 35 41',
      ].map((d) => (
        <Path key={d} d={d} stroke={palette.brown400} strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.5} />
      ))}
      <Path
        d={FOLHA}
        fill={tracos.folhaClara}
        stroke={tracos.contornoFolha}
        strokeWidth={2.4}
        transform="translate(48 17) rotate(-34) scale(0.3)"
      />
    </>
  );
}

function Tristeza() {
  return (
    <>
      {/* Nuvem, chuva fina e uma poça: o dia que não passa. */}
      <Path
        d="M19 30 C14 30 11 27 11 23.5 C11 20 14 17 18 17.5 C19 12 24 9 29 10 C34 11 37 15 37 19.5 C41 19 45 22 45 26 C45 28.5 43 30 40 30 Z"
        fill={palette.cream100}
        stroke={CONTORNO}
        strokeWidth={TRACO}
        strokeLinejoin="round"
      />
      {[
        [20, 36],
        [30, 39],
        [40, 36],
      ].map(([x, y]) => (
        <Path
          key={x}
          d={`M${x} ${y} L${x - 2} ${y + 7}`}
          stroke={palette.blue300}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      ))}
      <Ellipse cx={30} cy={50} rx={13} ry={3} fill={palette.blue100} />
    </>
  );
}

function Luto() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <>
      <Defs>
        <LinearGradient id={`terra-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA_CLARA} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} />
        </LinearGradient>
      </Defs>
      {/*
        Uma folha caída, grande, e o galho de onde ela veio.

        Antes era um montinho de terra com uma folha pequena em cima, e no
        tamanho real a folha sumia — sobrava uma pedra marrom. Aqui o assunto é
        a folha: ela ocupa o meio do quadrado, deitada no chão, e o galho vazio
        acima diz de onde ela caiu sem precisar de mais nada.
      */}
      <Path
        d="M8 20 C16 22 22 24 27 27"
        stroke={tracos.haste}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.75}
      />
      <Path d="M9 45 C9 42 17 40 30 40 C43 40 51 42 51 45 Z" fill={`url(#terra-${id})`} opacity={0.9} />
      <Path
        d={FOLHA}
        fill={tracos.folha}
        stroke={tracos.contornoFolha}
        strokeWidth={2}
        transform="translate(45 33) rotate(163) scale(0.45)"
      />
    </>
  );
}

function Insonia() {
  return (
    <>
      {/* Lua e duas estrelas: a noite acordada. */}
      <Path
        d="M34 11 C25 13 18 21 18 30 C18 39 25 47 34 48 C28 43 25 37 25 30 C25 23 28 16 34 11 Z"
        fill={palette.yellow100}
        stroke={CONTORNO}
        strokeWidth={TRACO}
        strokeLinejoin="round"
      />
      {[
        { x: 42, y: 20, r: 3.2 },
        { x: 46, y: 34, r: 2.2 },
      ].map((e) => (
        <Path
          key={e.x}
          d={`M${e.x} ${e.y - e.r} L${e.x + e.r * 0.34} ${e.y - e.r * 0.34} L${e.x + e.r} ${e.y} L${e.x + e.r * 0.34} ${e.y + e.r * 0.34} L${e.x} ${e.y + e.r} L${e.x - e.r * 0.34} ${e.y + e.r * 0.34} L${e.x - e.r} ${e.y} L${e.x - e.r * 0.34} ${e.y - e.r * 0.34} Z`}
          fill={palette.amber400}
        />
      ))}
    </>
  );
}

function Estresse() {
  return (
    <>
      {/*
        Uma pedra pesada, e uma folha que continua saindo debaixo dela.

        A primeira versão era uma cúpula lisa com um brilho curvo em cima, e no
        tamanho real lia como tampa de travessa. Pedra tem quina: a silhueta
        agora é quebrada, e a face clara é um plano, não um reflexo.
      */}
      <Path
        d="M11 46 L15 31 L24 23 L37 26 L47 38 L48 46 Z"
        fill={palette.slate300}
        stroke={CONTORNO}
        strokeWidth={TRACO}
        strokeLinejoin="round"
      />
      <Path d="M15 31 L24 23 L31 33 L19 39 Z" fill={palette.slate100} opacity={0.85} />
      <Path d="M31 33 L47 38 L48 46 L33 46 Z" fill={CONTORNO} opacity={0.12} />
      <Path
        d={FOLHA}
        fill={tracos.folha}
        stroke={tracos.contornoFolha}
        strokeWidth={2.6}
        transform="translate(53 45) rotate(-28) scale(0.26)"
      />
    </>
  );
}

function Solidao() {
  return (
    <>
      {/* Um vaso com broto e o contorno vazio de outro: a falta, desenhada. */}
      <G>
        <Path
          d="M13 34 L29 34 L27 47 C27 48.6 25.6 49.5 21 49.5 C16.4 49.5 15 48.6 15 47 Z"
          fill={tracos.vaso}
          stroke={CONTORNO}
          strokeWidth={TRACO}
          strokeLinejoin="round"
        />
        <Path d="M21 34 L21 26" stroke={tracos.haste} strokeWidth={2.4} strokeLinecap="round" />
        <Path d={FOLHA} fill={tracos.folha} stroke={tracos.contornoFolha} strokeWidth={2.8} transform="translate(21 26) rotate(-50) scale(0.2)" />
        <Path d={FOLHA} fill={tracos.folhaClara} stroke={tracos.contornoFolha} strokeWidth={2.8} transform="translate(21 26) rotate(230) scale(0.17)" />
      </G>
      <Path
        d="M35 36 L49 36 L47.5 47 C47.5 48.4 46.3 49.2 42 49.2 C37.7 49.2 36.5 48.4 36.5 47 Z"
        fill="none"
        stroke={palette.brown400}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeDasharray="3.5 3.5"
      />
    </>
  );
}

function Raiva() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <>
      <Defs>
        <RadialGradient id={`brasa-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={BRASA} stopOpacity={0.5} />
          <Stop offset="1" stopColor={BRASA} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={30} cy={44} rx={16} ry={9} fill={`url(#brasa-${id})`} />
      {/* Chama: o corpo antes da palavra. */}
      <Path
        d="M30 10 C34 19 42 23 42 32 C42 41 36 47 30 47 C24 47 18 41 18 32 C18 27 22 23 25 18 C26 22 28 23 30 10 Z"
        fill={palette.terracotta400}
        stroke={CONTORNO}
        strokeWidth={TRACO}
        strokeLinejoin="round"
      />
      <Path
        d="M30 26 C32 30 35 32 35 36 C35 40 33 43 30 43 C27 43 25 40 25 36 C25 33 28 30 30 26 Z"
        fill={palette.amber400}
      />
    </>
  );
}

function Procrastinacao() {
  return (
    <>
      {/* Ampulheta: o tempo que passa enquanto se adia. */}
      <Path
        d="M19 15 L41 15 L32 30 L41 45 L19 45 L28 30 Z"
        fill={palette.cream100}
        stroke={CONTORNO}
        strokeWidth={TRACO}
        strokeLinejoin="round"
      />
      <Path d="M22 18 L38 18 L31.5 29 Z" fill={palette.amber400} />
      <Path d="M24 42 L36 42 L33 37 C32 35.5 28 35.5 27 37 Z" fill={palette.amber400} />
      <Path d="M30 30 L30 36" stroke={palette.amber400} strokeWidth={1.6} strokeLinecap="round" />
      {[13, 47].map((y) => (
        <Path key={y} d={`M15 ${y} L45 ${y}`} stroke={palette.brown700} strokeWidth={3.4} strokeLinecap="round" />
      ))}
    </>
  );
}

function Autoestima() {
  return (
    <>
      {/* Espelho: olhar para si sem inventar um rosto para a pessoa. */}
      <Path d="M27 44 L33 44 L34 50 L26 50 Z" fill={palette.brown700} stroke={CONTORNO} strokeWidth={1.4} strokeLinejoin="round" />
      <Ellipse cx={30} cy={27} rx={14} ry={17} fill={palette.amber100} stroke={palette.brown700} strokeWidth={3.4} />
      <Path d="M24 34 C21 29 22 21 27 16" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.75} />
    </>
  );
}

function Culpa() {
  return (
    <>
      {/* Uma trouxa amarrada: o peso que se carrega sem abrir. */}
      <Path
        d="M20 28 C20 23 24 21 30 21 C36 21 40 23 40 28 L44 45 C44 48 39 49.5 30 49.5 C21 49.5 16 48 16 45 Z"
        fill={palette.cream200}
        stroke={CONTORNO}
        strokeWidth={TRACO}
        strokeLinejoin="round"
      />
      <Path d="M17 33 C24 36 36 36 43 33" stroke={palette.brown400} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <Path
        d="M25 21 C27 16 33 16 35 21 C33 19 27 19 25 21 Z"
        fill={palette.cream300}
        stroke={CONTORNO}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </>
  );
}

function Comparacao() {
  return (
    <>
      {/* Dois brotos de tamanhos diferentes, na mesma terra. */}
      <Path d="M8 46 C8 42 15 40 30 40 C45 40 52 42 52 46 Z" fill={TERRA} />
      <G>
        <Path d="M19 41 L19 31" stroke={tracos.haste} strokeWidth={2.4} strokeLinecap="round" />
        <Path d={FOLHA} fill={tracos.folha} stroke={tracos.contornoFolha} strokeWidth={2.8} transform="translate(19 31) rotate(-52) scale(0.19)" />
        <Path d={FOLHA} fill={tracos.folhaClara} stroke={tracos.contornoFolha} strokeWidth={2.8} transform="translate(19 31) rotate(232) scale(0.16)" />
      </G>
      <G>
        <Path d="M41 41 L41 19" stroke={tracos.haste} strokeWidth={2.6} strokeLinecap="round" />
        <Path d={FOLHA} fill={tracos.folha} stroke={tracos.contornoFolha} strokeWidth={2.4} transform="translate(41 19) rotate(-52) scale(0.3)" />
        <Path d={FOLHA} fill={tracos.folhaClara} stroke={tracos.contornoFolha} strokeWidth={2.4} transform="translate(41 19) rotate(232) scale(0.26)" />
      </G>
    </>
  );
}

function Foco() {
  return (
    <>
      {/* Lupa sobre uma folha: uma coisa por vez, de perto. */}
      <Path
        d={FOLHA}
        fill={tracos.folhaClara}
        stroke={tracos.contornoFolha}
        strokeWidth={2.6}
        transform="translate(48 44) rotate(-20) scale(0.26)"
      />
      <Path d="M35 35 L47 47" stroke={palette.brown700} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={26} cy={26} r={13} fill={palette.blue100} stroke={CONTORNO} strokeWidth={2.4} />
      <Path d="M19 22 C20 18 23 15 27 14" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.8} />
    </>
  );
}

function Gratidao() {
  return (
    <>
      {/* Cesta com o que foi colhido: o que já está aqui. */}
      <Path d="M18 33 C18 24 42 24 42 33" stroke={palette.brown700} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      {[
        { x: 23, y: 29, c: palette.terracotta400 },
        { x: 30, y: 26, c: palette.amber400 },
        { x: 37, y: 29, c: palette.terracotta400 },
      ].map((f) => (
        <Circle key={f.x} cx={f.x} cy={f.y} r={4.6} fill={f.c} stroke={CONTORNO} strokeWidth={1.5} />
      ))}
      <Path
        d="M13 32 L47 32 L43 46 C43 48.4 38 49.5 30 49.5 C22 49.5 17 48.4 17 46 Z"
        fill={tracos.vaso}
        stroke={CONTORNO}
        strokeWidth={TRACO}
        strokeLinejoin="round"
      />
      {[22, 30, 38].map((x) => (
        <Path key={x} d={`M${x} 34 L${x - 1} 46`} stroke={tracos.vasoSombra} strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
      ))}
    </>
  );
}

const CENAS: Record<Tema, () => React.JSX.Element> = {
  ansiedade: Ansiedade,
  tristeza: Tristeza,
  luto: Luto,
  insonia: Insonia,
  estresse: Estresse,
  solidao: Solidao,
  raiva: Raiva,
  procrastinacao: Procrastinacao,
  autoestima: Autoestima,
  culpa: Culpa,
  comparacao: Comparacao,
  foco: Foco,
  gratidao: Gratidao,
};

export function ehTemaDesenhado(chave: string): chave is Tema {
  return chave in CENAS;
}

/**
 * O desenho de um tema. `tema` é a chave de `PRACTICE_TOPICS` — chave
 * desconhecida devolve `null`, para um tema novo não derrubar a tela enquanto
 * o desenho dele não existe.
 */
export function DesenhoDoTema({ tema, size = 46 }: { tema: string; size?: number }) {
  if (!ehTemaDesenhado(tema)) return null;
  const Cena = CENAS[tema];
  return (
    <Svg viewBox="0 0 60 60" width={size} height={size}>
      <Cena />
    </Svg>
  );
}

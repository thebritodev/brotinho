import React, { useId } from 'react';
import Svg, {
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { palette, tracos } from '../../theme/tokens';
import { cresce, curva, gira } from './movimentoDaCena';
import { TERRA, TERRA_CLARA, TERRA_FUNDA } from './terraDoCanteiro';

/**
 * O tema de prática como **lugar**, ocupando o cartão inteiro.
 *
 * ## O que muda em relação a `desenhosDosTemas`
 *
 * Lá cada tema é um **objeto** de 118 pontos, encostado no canto de baixo à
 * direita e atravessando a borda do cartão. Funciona, e tem um defeito que só
 * aparece quando se olha a grade inteira: os objetos **flutuam**. O lago da
 * ansiedade é uma elipse no ar, a pedra do estresse não está apoiada em nada.
 * Cada cartão tem um canto colorido vazio e um objeto sem chão.
 *
 * Aqui o desenho é a cena toda: o tom do grupo vira o céu, o céu encontra um
 * horizonte, e da linha d'água para baixo existe um lugar. É o mesmo movimento
 * que a faixa da Composta já fez — de objeto para lugar.
 *
 * ## As regras que valem para as treze
 *
 * 1. **A mesma estrutura de luz.** Claro no horizonte, escurecendo até a borda
 *    de baixo. É isso que faz treze cenas diferentes lerem como treze vistas do
 *    mesmo mundo, em vez de um álbum de figurinhas — e é o que mantém o título
 *    fácil de achar em qualquer cartão.
 * 2. **Paleta do app, um acento por cena.** Cremes, marrons e verdes de sempre;
 *    o azul da água é o acento da ansiedade, e cada tema tem o seu.
 * 3. **Perspectiva atmosférica.** O que está longe perde contorno e contraste;
 *    o que está perto mantém o traço grosso. A mesma conta de `FaixaDaComposta`,
 *    e a razão é a mesma: filtro de SVG no Android é caro e não dá para
 *    conferir daqui.
 * 4. **O céu começa no tom do grupo.** O degradê é o próprio céu da cena, e não
 *    uma camada por cima — assim não existe costura, e o alto do cartão fica
 *    chapado o bastante para o título pousar nele.
 * 5. **Nada atravessa a borda.** O cartão é uma janela, e o que se vê por ela
 *    acaba nela. A primeira versão deixava um tufo de capim escapar por baixo,
 *    herdando a assinatura do desenho antigo, que cruzava a borda de propósito.
 *    Com a cena ocupando o cartão inteiro, o pedaço solto embaixo deixou de ler
 *    como "apoiado na tela" e passou a ler como sobra — a moldura da janela
 *    quebrada num ponto só.
 *
 * ## A cena não segue o tema; o tom do grupo segue
 *
 * Mesma regra de `ceuDaComposta` e `terraDoCanteiro`: a paisagem tem luz
 * própria. Quem muda com o tema é o `tom` que entra no alto do céu — no escuro
 * o cartão vira tom escuro em cima descendo para um lugar iluminado embaixo, o
 * que lê como amanhecer. O título continua seguindo o tema, porque ele está
 * pousado no tom, e não dentro da paisagem.
 *
 * ## Uma por vez
 *
 * As treze estão sendo refeitas uma a uma, cada uma aprovada antes da
 * seguinte. Quem ainda não tem cenário continua com o objeto de
 * `desenhosDosTemas`, e o `PracticeTopicCard` escolhe qual dos dois desenhar.
 */

/* ---------- As cores da paisagem, fixas como as do céu da Composta ---------- */

const CONTORNO = tracos.contorno;
/** O creme do app: é ele que acende o horizonte em todas as cenas. */
const CREME = palette.cream100;
const FOLHA = tracos.folha;
const FOLHA_CLARA = tracos.folhaClara;
const CONTORNO_FOLHA = tracos.contornoFolha;

/** O acento da ansiedade: água parada. */
const AGUA = palette.blue300;
const AGUA_CLARA = palette.blue100;

/* ---------- As proporções, iguais para todas as cenas ---------- */

/**
 * Onde cai o horizonte, em fração da altura do cartão.
 *
 * Abaixo do título de duas linhas com folga: o título acaba em 50, e num cartão
 * de 175 o horizonte cai em 93 — quarenta e três pontos de céu livre entre um e
 * outro. Acima dele é só o degradê, e é por isso que o texto pode pousar ali sem
 * disputar com nada.
 *
 * A fração baixou de 0,586 para 0,53 quando os temas viraram carrossel: o cartão
 * cresceu em altura, e mantendo a fração antiga o que crescia era o **céu
 * vazio** — cinquenta pontos de nada entre o título e a paisagem. O que tinha de
 * crescer era o chão.
 */
const HORIZONTE = 0.53;

type CenarioProps = {
  /** A largura do cartão, em pontos. A paisagem é desenhada 1:1, sem escala. */
  l: number;
  /** A altura do cartão. */
  a: number;
  /** O passo da animação de toque: 0 parada, 1 no fim. */
  p: number;
  /** O identificador único deste desenho, para os `id` do `Defs`. */
  id: string;
};

/** Um tufo de capim de três lâminas, com a base em `y`. */
function Capim({ x, y, alto, cor, balanco }: { x: number; y: number; alto: number; cor: string; balanco: number }) {
  return (
    <G transform={gira(balanco, x, y)}>
      <Path
        d={`M${x} ${y} C${x - 1} ${y - alto * 0.5} ${x - 3.5} ${y - alto * 0.8} ${x - 5} ${y - alto}`}
        stroke={cor}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M${x + 1.5} ${y} C${x + 1.5} ${y - alto * 0.55} ${x + 1.5} ${y - alto * 0.85} ${x + 1} ${y - alto * 1.15}`}
        stroke={cor}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M${x + 3} ${y} C${x + 4} ${y - alto * 0.5} ${x + 6} ${y - alto * 0.75} ${x + 7.5} ${y - alto * 0.9}`}
        stroke={cor}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

/* ---------- Ansiedade: a margem ---------- */

/**
 * Você está de pé na beira de uma água parada.
 *
 * Três planos: morros ao longe sem contorno, a água entre as margens, e a
 * margem de cá com o traço grosso do app. É a profundidade que o objeto sozinho
 * não tinha.
 *
 * ## Por que água, e por que parada
 *
 * Vem da cena antiga e continua valendo: o cartão diz "Acalmar a ansiedade", e
 * imagem de agitação embaixo de uma palavra de calma faz a pessoa acreditar na
 * imagem. Água é o oposto exato de vento, e não se repete em nenhum dos outros
 * doze temas.
 *
 * ## Por que a margem não tem traço preto
 *
 * Tinha, no primeiro rascunho, e a linha atravessava o cartão inteiro cortando
 * a cena em duas. Quem separa a água da terra agora é um **raso claro** — a
 * faixa de água baixa que existe em qualquer margem de verdade — e o degrau de
 * valor entre o azul e o marrom. O traço grosso ficou para o que está perto o
 * bastante para tê-lo: o capim.
 */
function Ansiedade({ l, a, p, id }: CenarioProps) {
  const h = a * HORIZONTE;
  /** Onde a água encosta na margem de cá. */
  const margem = a * 0.855;
  const centro = l * 0.46;
  const naAgua = a * 0.74;

  return (
    <>
      <Defs>
        <LinearGradient id={`agua-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={AGUA_CLARA} />
          <Stop offset="1" stopColor={AGUA} />
        </LinearGradient>
        <LinearGradient id={`margem-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA} />
          <Stop offset="0.35" stopColor={TERRA_CLARA} />
          <Stop offset="1" stopColor={TERRA_FUNDA} />
        </LinearGradient>
        {/*
          Um gradiente por morro, terminando em opacidade zero.

          Duas elipses chapadas com a mesma opacidade se cruzam e acendem uma
          lente clara no meio do horizonte — o desenho denuncia que são duas
          formas e não uma paisagem. Com a borda caindo a zero, elas se
          encontram sem emenda. É a mesma conta de `FaixaDaComposta`, e existe
          pelo mesmo motivo: filtro de SVG no Android é caro e não dá para
          conferir daqui.
        */}
        <RadialGradient id={`morroA-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={FOLHA} stopOpacity={0.62} />
          <Stop offset="0.58" stopColor={FOLHA} stopOpacity={0.52} />
          <Stop offset="1" stopColor={FOLHA} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`morroB-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={FOLHA_CLARA} stopOpacity={0.72} />
          <Stop offset="0.58" stopColor={FOLHA_CLARA} stopOpacity={0.6} />
          <Stop offset="1" stopColor={FOLHA_CLARA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/*
        Os morros ao longe, afastados um do outro e em dois tons: o de trás mais
        escuro, o da frente mais claro. Sem esse degrau eles empilham numa
        mancha só e o horizonte volta a ser uma linha reta.
      */}
      <Ellipse cx={l * 0.16} cy={h - 1} rx={l * 0.32} ry={a * 0.105} fill={`url(#morroA-${id})`} />
      <Ellipse cx={l * 0.82} cy={h + 3} rx={l * 0.32} ry={a * 0.088} fill={`url(#morroB-${id})`} />

      {/* A margem de lá: uma faixa fina, porque está longe. */}
      <Path
        d={`M0 ${h + 4} C${l * 0.25} ${h} ${l * 0.74} ${h} ${l} ${h + 3} L${l} ${h + 8} L0 ${h + 8} Z`}
        fill={TERRA_CLARA}
        opacity={0.62}
      />

      {/* A água, da margem de lá até a de cá. */}
      <Path
        d={`M0 ${h + 7} L${l} ${h + 7} L${l} ${margem + 2} C${l * 0.68} ${margem + 7} ${l * 0.31} ${margem + 7} 0 ${margem + 2} Z`}
        fill={`url(#agua-${id})`}
      />
      {/* Três riscos de luz deitados: é o que faz a água parecer lisa. */}
      <Path
        d={`M${l * 0.09} ${a * 0.66} C${l * 0.2} ${a * 0.646} ${l * 0.33} ${a * 0.646} ${l * 0.43} ${a * 0.66}`}
        stroke={CREME}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
      <Path
        d={`M${l * 0.58} ${a * 0.705} C${l * 0.69} ${a * 0.698} ${l * 0.8} ${a * 0.698} ${l * 0.89} ${a * 0.712}`}
        stroke={CREME}
        strokeWidth={1.3}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      <Path
        d={`M${l * 0.2} ${a * 0.79} C${l * 0.3} ${a * 0.784} ${l * 0.41} ${a * 0.784} ${l * 0.5} ${a * 0.796}`}
        stroke={CREME}
        strokeWidth={1.1}
        strokeLinecap="round"
        fill="none"
        opacity={0.35}
      />

      {/*
        Um anel só, abrindo devagar até sumir.

        Dois ou três viram chuva caindo na poça, que é outra cena. Um anel que
        abre e some diz o contrário: alguma coisa encostou uma vez, e a água
        voltou a ficar lisa.
      */}
      <G
        transform={cresce(curva(p, [0.34, 0.6, 0.85, 1.05, 1.2]), centro + 10, naAgua)}
        opacity={curva(p, [0.6, 0.5, 0.34, 0.16, 0])}
      >
        <Ellipse cx={centro + 10} cy={naAgua} rx={l * 0.13} ry={a * 0.047} fill="none" stroke={CREME} strokeWidth={1.6} />
      </G>

      {/* A folha pousada, balançando de leve com o anel que passou. */}
      <G transform={gira(curva(p, [0, -2.4, -3.6, -1.8, 0]), centro, naAgua)}>
        <Path
          d={`M${centro - 12} ${naAgua} C${centro - 4} ${naAgua - 6.5} ${centro + 7} ${naAgua - 6.5} ${centro + 12} ${naAgua} C${centro + 7} ${naAgua + 6.5} ${centro - 4} ${naAgua + 6.5} ${centro - 12} ${naAgua} Z`}
          fill={FOLHA_CLARA}
          stroke={CONTORNO_FOLHA}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <Path
          d={`M${centro - 10} ${naAgua} C${centro - 3} ${naAgua - 1} ${centro + 5} ${naAgua - 1} ${centro + 10} ${naAgua}`}
          stroke={CONTORNO_FOLHA}
          strokeWidth={0.9}
          fill="none"
          opacity={0.7}
        />
      </G>

      {/*
        O raso: um fio de água baixa encostado na margem.

        Ele é o conserto do traço preto que atravessava o cartão no primeiro
        rascunho. Margem de verdade não tem aresta — tem um degrau de
        profundidade, e a água clareia pouco antes de acabar. Um **fio**, e não
        uma faixa: a faixa larga virava um segundo horizonte e achatava a cena.
      */}
      <Path
        d={`M0 ${margem + 1} C${l * 0.31} ${margem + 6} ${l * 0.68} ${margem + 6} ${l} ${margem + 1}`}
        stroke={CREME}
        strokeWidth={2}
        fill="none"
        opacity={0.6}
      />

      {/*
        A pedra meio submersa, encostada na margem.

        Ela vem da cena antiga e é o que dá **âncora escura** ao cartão. Sem
        ela a cena inteira é feita de tons pálidos, e na grade, ao lado de um
        cartão com contorno preto grosso, ela lia como desenho de outro app. A
        parte de baixo fica escondida pela margem, que é desenhada depois.
      */}
      <Path
        d={`M${l * 0.7} ${margem + 3} C${l * 0.705} ${margem - 6} ${l * 0.79} ${margem - 10} ${l * 0.845} ${margem - 5} C${l * 0.885} ${margem - 1} ${l * 0.885} ${margem + 2} ${l * 0.87} ${margem + 4} Z`}
        fill={TERRA_CLARA}
        stroke={CONTORNO}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d={`M${l * 0.735} ${margem - 2} C${l * 0.75} ${margem - 6} ${l * 0.785} ${margem - 7.5} ${l * 0.805} ${margem - 6}`}
        stroke={CREME}
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />

      {/*
        A margem de cá, e é ela que sustenta o olho.

        O fio escuro no alto dela é o contorno do app, e não uma linha preta
        atravessando o cartão: ele acompanha a curva da beira e some nas duas
        pontas, porque a beira continua para fora da janela.
      */}
      <Path
        d={`M0 ${margem + 2} C${l * 0.31} ${margem + 7} ${l * 0.68} ${margem + 7} ${l} ${margem + 2} L${l} ${a + 20} L0 ${a + 20} Z`}
        fill={`url(#margem-${id})`}
      />
      <Path
        d={`M0 ${margem + 2} C${l * 0.31} ${margem + 7} ${l * 0.68} ${margem + 7} ${l} ${margem + 2}`}
        stroke={CONTORNO}
        strokeWidth={1.6}
        fill="none"
        opacity={0.75}
      />
      <Capim x={l * 0.12} y={margem + 11} alto={16} cor={FOLHA} balanco={curva(p, [0, -2, -3, -1.4, 0])} />
      {/* Fora da pedra: nela, o capim virava cabelo em cima de um pão. */}
      <Capim x={l * 0.92} y={margem + 10} alto={12} cor={FOLHA_CLARA} balanco={curva(p, [0, 1.6, 2.6, 1.2, 0])} />
      <Ellipse cx={l * 0.4} cy={a * 0.955} rx={1.6} ry={1.4} fill={TERRA_FUNDA} opacity={0.6} />
      <Ellipse cx={l * 0.63} cy={a * 0.93} rx={1.2} ry={1} fill={TERRA_FUNDA} opacity={0.45} />

      {/*
        O tufo do primeiro plano, com o pé na borda de baixo.

        É o que está mais perto do olho, e por isso é o mais alto e o de traço
        mais forte. Ele chegava a atravessar a borda; hoje encosta nela, que é o
        limite da janela.
      */}
      <Capim
        x={l * 0.28}
        y={a - 1}
        alto={21}
        cor={FOLHA}
        balanco={curva(p, [0, -2.6, -3.8, -1.6, 0])}
      />
    </>
  );
}

/* ---------- O mapa, que cresce a cada cartão aprovado ---------- */

const CENARIOS: Record<string, (props: CenarioProps) => React.JSX.Element> = {
  ansiedade: Ansiedade,
};

export function ehTemaComCenario(chave: string): boolean {
  return chave in CENARIOS;
}

type Props = {
  tema: string;
  largura: number;
  altura: number;
  /** O tom do grupo: é ele que entra no alto do céu. Segue o tema claro/escuro. */
  tom: string;
  passo?: number;
};

/**
 * A cena dentro do cartão, cortada pelos cantos arredondados dele.
 *
 * O corte é feito **no SVG**, com `ClipPath`, e não por `overflow` da `View`.
 * Não é preciosismo: o cartão tem sombra, e no Android sombra é `elevation`,
 * que já recorta o que os filhos desenham fora dos limites. Cortando aqui, o
 * desenho sai igual no Android e no navegador — que é onde ele é conferido.
 */
export function CenarioDoTema({ tema, largura, altura, tom, passo = 0 }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const Cena = CENARIOS[tema];
  if (!Cena || largura <= 0) return null;

  return (
    <Svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`}>
      <Defs>
        {/*
          O céu: começa no tom do grupo e assenta no creme do app.

          A parada do meio é o mesmo tom com opacidade — sem ela, um tom escuro
          caindo direto no creme fazia uma faixa dura no meio do cartão.
        */}
        <LinearGradient id={`ceu-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={tom} stopOpacity={1} />
          <Stop offset="0.62" stopColor={tom} stopOpacity={0.35} />
          <Stop offset="1" stopColor={CREME} stopOpacity={1} />
        </LinearGradient>
        <ClipPath id={`corte-${id}`}>
          <Rect x={0} y={0} width={largura} height={altura} rx={16} ry={16} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#corte-${id})`}>
        <Rect x={0} y={0} width={largura} height={altura} fill={`url(#ceu-${id})`} />
        <Cena l={largura} a={altura} p={passo} id={id} />
      </G>
    </Svg>
  );
}

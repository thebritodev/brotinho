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
import { BRASA, TERRA, TERRA_CLARA, TERRA_FUNDA, TERRA_SOMBRA } from './terraDoCanteiro';

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

/** O acento do estresse: pedra. */
const PEDRA = palette.slate300;
const PEDRA_CLARA = palette.slate100;

/** O acento da raiva: o que sobra de quente depois da chama. */
const CARVAO = palette.terracotta400;
const BRASA_VIVA = palette.amber400;
const FUMACA = palette.brown400;

/** O acento da tristeza: a claridade que a neblina espalha no fim da trilha. */
const SOL = palette.yellow300;
const NUVEM_BRANCA = '#FFFFFF';

/** O acento da insônia: a lua, e o ar entre ela e quem olha. */
const LUA = palette.yellow100;
const CRATERA = palette.amber100;
const ESTRELA = palette.amber400;
const NUVEM = palette.lavender100;
const NUVEM_SOMBRA = palette.lavender300;

/** A haste do broto, para as cenas que têm planta de pé. */
const HASTE = tracos.haste;

/**
 * A folha do broto, a mesma que `desenhosDosTemas` usa.
 *
 * Copiada e não importada de propósito: lá ela é uma constante de módulo sem
 * `export`, e abrir um buraco na outra só para isto amarraria os dois arquivos
 * — o antigo vai encolhendo a cada tema refeito, e o dia em que ele sumir não
 * pode levar nada daqui junto.
 */
const FOLHA_DO_BROTO =
  'M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z';

/* ---------- As proporções, iguais para todas as cenas ---------- */

/**
 * Onde acaba um título de duas linhas, contado do topo do cartão.
 *
 * Treze pontos de recuo mais duas linhas de 18,6: `PracticeTopicCard` decide
 * esses números, e a paisagem tem de caber abaixo deles. Não é a maioria dos
 * títulos — vários cabem numa linha —, mas é o pior caso, e é o pior caso que
 * decide onde a cena pode começar.
 */
const TITULO_DE_DUAS_LINHAS = 50;

/** O respiro entre o pé do título e o alto da paisagem. */
const FOLGA_DO_TITULO = 24;

/** O quanto os morros sobem acima da linha do horizonte. */
const MORROS_ACIMA_DO_HORIZONTE = 8;

/**
 * Onde cai o horizonte, em pontos, num cartão desta altura.
 *
 * ## Por que deixou de ser uma fração
 *
 * Era 0,53 da altura, e fração funciona enquanto o cartão só cresce. Encolhendo
 * o cartão, ela puxa a paisagem **para cima do título**: o título acaba sempre
 * em 50, não importa o tamanho do cartão, enquanto o horizonte sobe junto com a
 * altura. Num cartão de 130, meia altura são 69 pontos, e os morros começam em
 * 61 — onze pontos abaixo da segunda linha do texto, o que na prática é
 * encavalar.
 *
 * Agora ele é o que for **mais baixo**: a metade do cartão, ou o primeiro ponto
 * em que a paisagem ainda passa longe do título. Em cartão alto manda a
 * metade, e a cena fica equilibrada; em cartão baixo manda o título, e o que
 * encolhe é o chão — que é a parte que aguenta encolher.
 */
/** Onde o horizonte cai por padrão: na metade do cartão. */
const HORIZONTE_PADRAO = 0.5;

/**
 * O ponto mais alto em que a paisagem pode começar sem encostar no título.
 *
 * É este número que impede o horizonte de subir: seja qual for a fração que a
 * cena peça, ela nunca passa daqui para cima.
 */
const HORIZONTE_MAIS_ALTO =
  TITULO_DE_DUAS_LINHAS + FOLGA_DO_TITULO + MORROS_ACIMA_DO_HORIZONTE;

export function horizonteDaCena(a: number, fracao = HORIZONTE_PADRAO) {
  return Math.max(HORIZONTE_MAIS_ALTO, a * fracao);
}

/**
 * Onde o **pé** do título tem de cair, para ficar à mesma distância da
 * paisagem em todo cartão.
 *
 * O horizonte é calculado para o pior caso — um título de duas linhas. Só que
 * vários títulos cabem numa linha: "Baixar o estresse", "Recuperar o foco". Com
 * o texto preso no topo, esses cartões ficam com o vão da segunda linha
 * sobrando entre a palavra e a paisagem, e a cena parece ter descido.
 *
 * Prendendo o **pé** do texto neste ponto em vez do topo, um título de uma
 * linha desce e um de duas sobe, e os dois acabam à mesma distância do
 * horizonte. O que varia passa a ser o céu vazio acima do texto, que é onde
 * ninguém repara.
 */
/*
  O pé do título não acompanha a cena que baixa o horizonte.

  A tristeza pede o céu tomando o cartão, e o horizonte dela desce para quatro
  quintos da altura. Se o título descesse junto, ele iria parar no meio do
  cartão naquela cena e só nela — e o que faz a grade ler como grade é o texto
  cair sempre na mesma linha. Por isso esta conta usa o horizonte **padrão**, e
  não o que a cena pediu.
*/
export function peDoTituloNaCena(a: number) {
  return horizonteDaCena(a) - MORROS_ACIMA_DO_HORIZONTE - FOLGA_DO_TITULO;
}

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

/**
 * Um torrão de terra: a mancha e a luz que bate no alto dela.
 *
 * ## Por que duas formas, e não uma
 *
 * Uma elipse chapada na terra lê como sujeira no desenho. Com a segunda,
 * menor e clara, encostada no alto à esquerda, ela vira um **volume** — e é a
 * mesma luz que bate no alto à esquerda em todo desenho deste app.
 *
 * Isto existe porque a terra das cenas era um degradê liso, e degradê liso ao
 * lado da água da ansiedade — que tem risco de luz, anel, folha e pedra
 * acontecendo nela — lia como cena pela metade. O que enche a terra não é um
 * objeto grande: é repetição de coisa pequena.
 */
function Torrao({ x, y, r, cor = TERRA_CLARA }: { x: number; y: number; r: number; cor?: string }) {
  return (
    <>
      <Ellipse cx={x} cy={y} rx={r} ry={r * 0.72} fill={cor} opacity={0.45} />
      <Ellipse cx={x - r * 0.22} cy={y - r * 0.24} rx={r * 0.5} ry={r * 0.34} fill={CREME} opacity={0.2} />
    </>
  );
}

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
  const h = horizonteDaCena(a);
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

/* ---------- Estresse: a clareira depois que a pedra desceu ---------- */

/**
 * A pedra está no chão, ao lado, e o broto está de pé.
 *
 * ## A metáfora vem inteira da cena antiga, e ela é boa demais para se perder
 *
 * A pedra já esteve **em cima** do broto, com a folha escapando por baixo:
 * peso, e alguém passando apesar dele. O cartão diz "Baixar o estresse", e
 * baixar é exatamente o que a pedra faz — ela saiu de cima e foi posta no chão.
 * Continua ali, e continua pedra: o estresse não evapora, sai de cima.
 *
 * O broto é o mais alto da cena, e é de propósito: quem está mais alto numa
 * cena é quem manda nela.
 *
 * ## Por que o lugar é campo aberto, e não outra água
 *
 * Este tema divide o grupo com a ansiedade, e os dois cartões ficam lado a
 * lado na mesma fileira. Se o meio da cena fosse água nos dois, eles leriam
 * como o mesmo lugar em duas cores. Aqui o meio é chão: um campo subindo até a
 * crista, com a mata escura ao longe.
 *
 * ## O movimento
 *
 * O mesmo da cena antiga, porque ele já dizia a coisa certa: a pedra assenta um
 * fio de ponto — peso que acaba de ser posto no chão ainda acomoda — e o broto
 * estica, sem pressa, como talo que perdeu o que o dobrava.
 */
function Estresse({ l, a, p, id }: CenarioProps) {
  const h = horizonteDaCena(a);
  /** Onde o campo encontra a terra do primeiro plano. */
  const chao = a * 0.8;
  /** O pé da pedra e o do broto: os dois no mesmo chão. */
  const pe = a * 0.9;

  return (
    <>
      <Defs>
        {/*
          O campo é seco, e não verde.

          Verde do horizonte até a pedra fazia do meio da cena uma massa só: a
          mata ao longe, o campo e o capim eram o mesmo tom em três opacidades,
          e o olho não achava onde uma coisa acabava e a outra começava. Em tom
          seco o campo separa da mata por matiz, e não por opacidade — e é o
          creme do próprio app, que já é a cor do papel de todas as telas.
        */}
        <LinearGradient id={`campo-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.cream300} stopOpacity={0.95} />
          <Stop offset="1" stopColor={TERRA_CLARA} stopOpacity={0.9} />
        </LinearGradient>
        {/*
          A terra do primeiro plano começa já no tom médio, e não no claro.

          Com o campo seco logo acima, começar no `TERRA_CLARA` emendava os
          dois num marrom só e o chão perdia a borda. O degrau de valor entre
          campo e terra é o que diz onde a pessoa está de pé.
        */}
        <LinearGradient id={`terra-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA} />
          <Stop offset="0.45" stopColor={TERRA_FUNDA} />
          <Stop offset="1" stopColor={TERRA_FUNDA} />
        </LinearGradient>
        {/* A mata ao longe: sem contorno, e caindo a zero nas bordas. */}
        <RadialGradient id={`mata-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={FOLHA} stopOpacity={0.9} />
          <Stop offset="0.58" stopColor={FOLHA} stopOpacity={0.78} />
          <Stop offset="1" stopColor={FOLHA} stopOpacity={0} />
        </RadialGradient>

      </Defs>

      {/* A mata ao longe, baixa e comprida: é o pé da paisagem. */}
      <Ellipse cx={l * 0.3} cy={h} rx={l * 0.42} ry={a * 0.062} fill={`url(#mata-${id})`} />
      <Ellipse cx={l * 0.86} cy={h + 2} rx={l * 0.3} ry={a * 0.05} fill={`url(#mata-${id})`} />

      {/*
        A cerca viva na crista: uma borda **com aresta**, logo abaixo da mata
        que não tem nenhuma.

        Sem ela, tudo entre o céu e a pedra é verde sem contorno, e o meio da
        cena lê como névoa em vez de chão. Uma linha definida ali diz onde o
        campo começa, e dá ao olho de onde descer até o primeiro plano.
      */}
      <Path
        d={`M0 ${h + 6} C${l * 0.14} ${h + 1} ${l * 0.27} ${h + 3} ${l * 0.42} ${h + 2} C${l * 0.6} ${h + 1} ${l * 0.78} ${h + 5} ${l} ${h + 2} L${l} ${h + 13} L0 ${h + 13} Z`}
        fill={FOLHA}
        opacity={0.8}
      />

      {/* O campo, subindo até a crista. */}
      <Path
        d={`M0 ${h + 3} C${l * 0.28} ${h - 2} ${l * 0.72} ${h - 2} ${l} ${h + 3} L${l} ${chao + 3} C${l * 0.7} ${chao - 2} ${l * 0.3} ${chao - 2} 0 ${chao + 3} Z`}
        fill={`url(#campo-${id})`}
      />
      {/* Dois riscos de luz deitados no campo: o vento que passou e parou. */}
      <Path
        d={`M${l * 0.12} ${a * 0.63} C${l * 0.24} ${a * 0.622} ${l * 0.38} ${a * 0.622} ${l * 0.48} ${a * 0.632}`}
        stroke={CREME}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.45}
      />
      <Path
        d={`M${l * 0.56} ${a * 0.7} C${l * 0.68} ${a * 0.693} ${l * 0.8} ${a * 0.693} ${l * 0.9} ${a * 0.703}`}
        stroke={CREME}
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
        opacity={0.32}
      />

      {/*
        Capim espalhado pelo campo, menor e mais apagado quanto mais longe.

        O que faz o campo é a repetição, não o detalhe de cada tufo.

        ## O que já esteve aqui, e por que saiu

        Um rastro de terra aberta descendo a encosta, contando de onde a pedra
        tinha vindo. A ideia servia à metáfora e o desenho não servia à ideia:
        num vão de sessenta pontos de altura, a faixa que estreita subindo vira
        um triângulo com ponta no horizonte, e triângulo com ponta lê como
        tenda. O que conta a história aqui é a própria pedra, no chão, com o
        broto de pé e mais alto que ela.
      */}
      {[
        { x: 0.16, y: 0.655, alto: 7, op: 0.42 },
        { x: 0.38, y: 0.665, alto: 7, op: 0.42 },
        { x: 0.62, y: 0.65, alto: 6, op: 0.38 },
        { x: 0.8, y: 0.685, alto: 9, op: 0.5 },
        { x: 0.28, y: 0.72, alto: 10, op: 0.55 },
        { x: 0.55, y: 0.745, alto: 11, op: 0.6 },
        { x: 0.09, y: 0.75, alto: 11, op: 0.6 },
      ].map((t, i) => (
        <G key={i} opacity={t.op}>
          <Path
            d={`M${l * t.x} ${a * t.y} C${l * t.x - 1} ${a * t.y - t.alto * 0.6} ${l * t.x - 2.5} ${a * t.y - t.alto * 0.85} ${l * t.x - 3.5} ${a * t.y - t.alto}`}
            stroke={HASTE}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={`M${l * t.x + 1.5} ${a * t.y} C${l * t.x + 1.5} ${a * t.y - t.alto * 0.6} ${l * t.x + 2} ${a * t.y - t.alto * 0.9} ${l * t.x + 2.5} ${a * t.y - t.alto * 1.1}`}
            stroke={HASTE}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      ))}

      {/* A terra do primeiro plano. */}
      <Path
        d={`M0 ${chao} C${l * 0.3} ${chao - 5} ${l * 0.7} ${chao - 5} ${l} ${chao} L${l} ${a + 20} L0 ${a + 20} Z`}
        fill={`url(#terra-${id})`}
      />

      {/*
        A pedra, com as faces que ela sempre teve: a quina clara em cima, a
        rachadura descendo e a face escura à direita. Sem elas o bloco lê como
        uma mancha cinza com um brilho.
      */}
      <G transform={`translate(0 ${curva(p, [0, 0.5, 0.9, 1.1, 1.2])})`}>
        <Path
          d={`M${l * 0.09} ${pe} L${l * 0.13} ${pe - 21} L${l * 0.23} ${pe - 32} L${l * 0.37} ${pe - 27} L${l * 0.44} ${pe - 12} L${l * 0.46} ${pe} Z`}
          fill={PEDRA}
          stroke={CONTORNO}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <Path
          d={`M${l * 0.13} ${pe - 21} L${l * 0.23} ${pe - 32} L${l * 0.3} ${pe - 18} L${l * 0.18} ${pe - 13} Z`}
          fill={PEDRA_CLARA}
          opacity={0.85}
        />
        <Path
          d={`M${l * 0.3} ${pe - 18} L${l * 0.35} ${pe - 7} L${l * 0.335} ${pe}`}
          stroke={CONTORNO}
          strokeWidth={1.2}
          strokeLinecap="round"
          fill="none"
          opacity={0.45}
        />
        <Path
          d={`M${l * 0.37} ${pe - 27} L${l * 0.44} ${pe - 12} L${l * 0.35} ${pe - 7} Z`}
          fill={PEDRA}
          opacity={0.6}
        />
      </G>
      {/* A lasca caída ao lado: o que saiu de cima não foi uma peça só. */}
      <Path
        d={`M${l * 0.48} ${pe} C${l * 0.488} ${pe - 5.5} ${l * 0.535} ${pe - 8} ${l * 0.572} ${pe - 6} C${l * 0.6} ${pe - 3.6} ${l * 0.605} ${pe - 1.5} ${l * 0.596} ${pe} Z`}
        fill={PEDRA}
        stroke={CONTORNO}
        strokeWidth={1.3}
        strokeLinejoin="round"
        opacity={0.92}
      />

      {/*
        O broto de pé, mais alto que a pedra. Ele estica no toque: talo que
        perdeu o que o dobrava não salta, ele se desenrola.
      */}
      <G transform={cresce(curva(p, [1, 1.04, 1.08, 1.11, 1.12]), l * 0.74, pe)}>
        <Path
          d={`M${l * 0.74} ${pe} L${l * 0.74} ${pe - 58}`}
          stroke={HASTE}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/*
          A folha vem do desenho de 60 pontos, onde ela ia a 0,27. Aqui a caixa
          é o cartão inteiro — cento e oitenta por duzentos e dez —, e a mesma
          escala devolvia uma folha de doze pontos com três de contorno: um
          risco fechado, que na tela lia como uma argola no alto da haste.
        */}
        <Path
          d={FOLHA_DO_BROTO}
          fill={FOLHA}
          stroke={CONTORNO_FOLHA}
          strokeWidth={1.8}
          transform={`translate(${l * 0.74} ${pe - 58}) rotate(-52) scale(0.62)`}
        />
        {/*
          As duas folhas abrem do **mesmo ponto** da haste, uma para cada lado,
          e a segunda é um pouco menor. É a relação do broto antigo, copiada
          número a número: com origens diferentes elas empilham, e o que aparece
          no alto da haste é uma argola em vez de um par de folhas.
        */}
        <Path
          d={FOLHA_DO_BROTO}
          fill={FOLHA_CLARA}
          stroke={CONTORNO_FOLHA}
          strokeWidth={1.8}
          transform={`translate(${l * 0.74} ${pe - 58}) rotate(230) scale(0.53)`}
        />
      </G>

      <Capim x={l * 0.13} y={pe + 13} alto={15} cor={FOLHA} balanco={curva(p, [0, -1.8, -2.8, -1.2, 0])} />
      <Capim x={l * 0.85} y={pe + 11} alto={12} cor={FOLHA_CLARA} balanco={curva(p, [0, 1.6, 2.4, 1, 0])} />
      <Ellipse cx={l * 0.6} cy={a * 0.975} rx={1.6} ry={1.3} fill={TERRA_FUNDA} opacity={0.55} />
    </>
  );
}

/* ---------- Raiva: a cova de fogo depois que a chama passou ---------- */

/**
 * A brasa no chão, e um fio de fumaça subindo.
 *
 * ## A metáfora, herdada e intacta
 *
 * Já foi uma chama inteira, tremendo. O cartão diz "Descarregar a raiva", e
 * descarregar tem um **depois**: o que sobra quando o corpo já gastou o que
 * tinha para gastar. É o que o intro do tema promete — descarregar o corpo
 * primeiro é o que deixa ver o que tem embaixo.
 *
 * Ela não apaga. Fogo apagado diria que a raiva foi embora, e ela não vai:
 * baixa de temperatura e fica olhável. Por isso a brasa continua quente no
 * meio, com o halo por baixo.
 *
 * A silhueta do monte é quebrada, e não um arco: com a borda lisa, uma forma
 * cor de fogo subindo do chão lê como sol nascendo, que é quase o contrário do
 * tema. Carvão tem quina.
 *
 * ## Por que esta cena é de perto
 *
 * A ansiedade olha a água de longe e o estresse olha o campo de longe. Se a
 * raiva também fosse paisagem larga, os três seriam a mesma foto com objetos
 * diferentes. Aqui quem olha está **agachado ao lado da cova**: o horizonte é
 * uma tira no alto, a terra ocupa quase tudo, e a brasa tem o tamanho que uma
 * coisa tem quando se está perto dela.
 *
 * Variar a distância é o que faz treze cenas do mesmo mundo não virarem treze
 * repetições dele.
 */
function Raiva({ l, a, p, id }: CenarioProps) {
  const h = horizonteDaCena(a);
  /** A cova fica baixa: quem olha está agachado ao lado dela. */
  const cova = a * 0.82;
  const centro = l * 0.47;

  /*
    O comprimento da fumaça sai do céu que sobrou, e não de um número fixo.

    Ela mora na faixa entre a brasa e o pé do título, e essa faixa muda de
    tamanho com o cartão: num cartão alto sobram quase sessenta pontos de céu,
    num de cento e trinta sobram vinte e poucos. Com comprimento fixo, o fio
    subia direto para cima da palavra no cartão baixo — e fumaça atravessando
    texto não é cena, é defeito.

    A subida da animação entra na conta: o fio anda para cima enquanto some, e
    é o fim dessa subida que não pode encostar no título.
  */
  const teto = peDoTituloNaCena(a) + 14;
  const pe = cova - 22;
  const fio = Math.max(10, pe - teto);
  const subida = Math.min(10, fio * 0.3);

  return (
    <>
      <Defs>
        <LinearGradient id={`chao-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA_CLARA} />
          <Stop offset="0.35" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_FUNDA} />
        </LinearGradient>
        {/* O calor que escapa da brasa, caindo a zero: halo não tem borda. */}
        <RadialGradient id={`calor-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={BRASA} stopOpacity={0.85} />
          <Stop offset="0.5" stopColor={BRASA} stopOpacity={0.4} />
          <Stop offset="1" stopColor={BRASA} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`mataR-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={FOLHA} stopOpacity={0.8} />
          <Stop offset="0.58" stopColor={FOLHA} stopOpacity={0.66} />
          <Stop offset="1" stopColor={FOLHA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* A mata ao longe, baixa: daqui de baixo ela é só uma tira. */}
      <Ellipse cx={l * 0.34} cy={h + 1} rx={l * 0.4} ry={a * 0.05} fill={`url(#mataR-${id})`} />
      <Ellipse cx={l * 0.84} cy={h + 3} rx={l * 0.3} ry={a * 0.04} fill={`url(#mataR-${id})`} />

      {/* A terra, que daqui ocupa quase tudo. */}
      <Path
        d={`M0 ${h + 5} C${l * 0.3} ${h} ${l * 0.7} ${h} ${l} ${h + 5} L${l} ${a + 20} L0 ${a + 20} Z`}
        fill={`url(#chao-${id})`}
      />

      {/*
        O chão indo embora: tufos e pedrinhas minguando até a mata.

        Sem eles a faixa entre o horizonte e a cova é um marrom liso de
        cinquenta pontos, e o olho não tem como medir a distância — a cova
        poderia estar a um metro ou a cem. Cada marca é menor e mais apagada
        que a anterior, que é a única régua que uma cena desenhada tem.
      */}
      {[
        { x: 0.13, y: 0.6, r: 1.2, op: 0.3 },
        { x: 0.56, y: 0.59, r: 1.1, op: 0.26 },
        { x: 0.83, y: 0.615, r: 1.4, op: 0.32 },
        { x: 0.32, y: 0.655, r: 1.9, op: 0.36 },
        { x: 0.72, y: 0.68, r: 2.2, op: 0.4 },
        { x: 0.06, y: 0.71, r: 2.6, op: 0.42 },
      ].map((m, i) => (
        <Ellipse
          key={i}
          cx={l * m.x}
          cy={a * m.y}
          rx={m.r}
          ry={m.r * 0.8}
          fill={TERRA_FUNDA}
          opacity={m.op}
        />
      ))}
      {[
        { x: 0.22, y: 0.63, alto: 6, op: 0.32 },
        { x: 0.66, y: 0.645, alto: 7, op: 0.34 },
        { x: 0.43, y: 0.7, alto: 10, op: 0.4 },
        { x: 0.92, y: 0.72, alto: 11, op: 0.42 },
      ].map((t, i) => (
        <G key={i} opacity={t.op}>
          <Path
            d={`M${l * t.x} ${a * t.y} C${l * t.x - 1} ${a * t.y - t.alto * 0.6} ${l * t.x - 2.5} ${a * t.y - t.alto * 0.85} ${l * t.x - 3.5} ${a * t.y - t.alto}`}
            stroke={HASTE}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={`M${l * t.x + 1.5} ${a * t.y} C${l * t.x + 1.5} ${a * t.y - t.alto * 0.6} ${l * t.x + 2} ${a * t.y - t.alto * 0.9} ${l * t.x + 2.5} ${a * t.y - t.alto * 1.1}`}
            stroke={HASTE}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      ))}

      {/* A cova: a terra rebaixada e escurecida em volta da brasa. */}
      <Ellipse cx={centro} cy={cova} rx={l * 0.33} ry={a * 0.1} fill={TERRA_FUNDA} opacity={0.55} />
      <Ellipse cx={centro} cy={cova + 1} rx={l * 0.27} ry={a * 0.075} fill={TERRA_FUNDA} opacity={0.5} />

      {/*
        O calor, por baixo de tudo o que é sólido.

        Dois halos e não um: o de fora é o que esquenta a terra da cova, o de
        dentro é o que diz que ainda tem fogo no meio do monte. Com um só, a
        cena inteira ficava do mesmo marrom da terra e a brasa não parecia
        quente — que é a única coisa que ela tem de parecer.
      */}
      <G transform={cresce(curva(p, [1, 1.1, 1.18, 1.1, 1.04]), centro, cova - 2)}>
        <Ellipse cx={centro} cy={cova - 2} rx={l * 0.3} ry={a * 0.1} fill={`url(#calor-${id})`} />
        <Ellipse cx={centro} cy={cova - 4} rx={l * 0.15} ry={a * 0.055} fill={`url(#calor-${id})`} />
      </G>

      {/*
        As pedras da roda, só as de trás: as da frente esconderiam a brasa, e a
        roda de fogueira se lê inteira pela metade dela.
      */}
      {[
        { x: 0.17, y: 0.795, rx: 0.052, ry: 0.029 },
        { x: 0.29, y: 0.762, rx: 0.036, ry: 0.019 },
        { x: 0.68, y: 0.768, rx: 0.044, ry: 0.026 },
        { x: 0.8, y: 0.792, rx: 0.038, ry: 0.021 },
      ].map((s, i) => (
        <Ellipse
          key={i}
          cx={l * s.x}
          cy={a * s.y}
          rx={l * s.rx}
          ry={a * s.ry}
          fill={PEDRA}
          stroke={CONTORNO}
          strokeWidth={1.4}
          opacity={0.92}
        />
      ))}

      {/* O fio de fumaça: o único movimento que sobe na cena. */}
      <G
        transform={`translate(0 ${curva(p, [0, -subida * 0.2, -subida * 0.5, -subida * 0.8, -subida])})`}
        opacity={curva(p, [0.5, 0.45, 0.34, 0.18, 0])}
      >
        <Path
          d={`M${centro - 1} ${pe} C${centro - 7} ${pe - fio * 0.3} ${centro + 6} ${pe - fio * 0.45} ${centro + 1} ${pe - fio * 0.62}`}
          stroke={FUMACA}
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
        />
        <Path
          d={`M${centro + 1} ${pe - fio * 0.62} C${centro - 2} ${pe - fio * 0.76} ${centro + 5} ${pe - fio * 0.88} ${centro + 2} ${pe - fio}`}
          stroke={FUMACA}
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
          opacity={0.35}
        />
      </G>

      {/* O monte de carvão: baixo e largo, o oposto da chama que subia. */}
      <G transform={cresce(curva(p, [1, 1.02, 1.01, 0.99, 1]), centro, cova)}>
        {/*
          Três bossas desiguais, e não um arco.

          Com a borda lisa, uma forma cor de fogo subindo do chão lê como sol
          nascendo — que é quase o contrário do tema. Carvão tem quina, e as
          três bossas têm de ter alturas diferentes: iguais, elas viram uma
          coroa.
        */}
        <Path
          d={`M${centro - 31} ${cova} C${centro - 29} ${cova - 9} ${centro - 22} ${cova - 15} ${centro - 16} ${cova - 13} L${centro - 13} ${cova - 21} C${centro - 7} ${cova - 28} ${centro + 3} ${cova - 26} ${centro + 6} ${cova - 18} L${centro + 12} ${cova - 21} C${centro + 21} ${cova - 20} ${centro + 27} ${cova - 11} ${centro + 29} ${cova} Z`}
          fill={CARVAO}
          stroke={CONTORNO}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <Path
          d={`M${centro - 16} ${cova} C${centro - 13} ${cova - 9} ${centro - 6} ${cova - 14} ${centro} ${cova - 12} C${centro + 6} ${cova - 14} ${centro + 13} ${cova - 9} ${centro + 16} ${cova} Z`}
          fill={BRASA_VIVA}
        />
        {/* As fendas: é por elas que a brasa mostra que ainda está quente. */}
        <Path
          d={`M${centro - 11} ${cova} L${centro - 8} ${cova - 10}`}
          stroke={CONTORNO}
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.3}
        />
        <Path
          d={`M${centro + 11} ${cova} L${centro + 8} ${cova - 10}`}
          stroke={CONTORNO}
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.3}
        />
      </G>

      <Capim x={l * 0.07} y={a * 0.95} alto={13} cor={FOLHA} balanco={curva(p, [0, -1.6, -2.6, -1.2, 0])} />
      <Capim x={l * 0.89} y={a * 0.93} alto={11} cor={FOLHA_CLARA} balanco={curva(p, [0, 1.4, 2.2, 1, 0])} />
    </>
  );
}

/* ---------- Um banco de nuvem, para a cena que é só céu ---------- */

/**
 * Uma faixa de nuvem de fundo chato e alto em quatro corcovas.
 *
 * ## O tamanho dela decide se é nuvem ou morro
 *
 * A primeira versão era sempre mais larga que o cartão, para que as pontas
 * ficassem de fora. Deu no contrário do esperado: uma corcova só, atravessando
 * a janela inteira com o fundo reto na borda de baixo, é exatamente o desenho
 * de um morro nevado.
 *
 * Nuvem tem ponta, e é a ponta que diz que aquilo flutua. Então elas são um
 * pouco mais estreitas que o cartão, com o fundo já fora da janela: vê-se o
 * corpo inteiro, com os dois lados descendo, e o que está embaixo fica cortado
 * pela borda — que é como se vê um banco de nuvem de dentro dele.
 *
 * ## As três partes
 *
 * O corpo, a barriga e a luz. A barriga é um tom abaixo, encostada no fundo
 * chato: sem ela, uma nuvem clara sobre céu claro é uma silhueta vazia. A luz é
 * um risco branco na corcova maior, do lado que a lua ilumina. É a mesma
 * anatomia da nuvem do desenho antigo da insônia — o que muda é que aqui ela é
 * calculada, e não desenhada à mão, porque são cinco.
 *
 * `contorno` separa o que está perto do que está longe: a de perto leva traço
 * grosso, as de longe nenhum. Mesma regra de perspectiva atmosférica das outras
 * doze cenas, só que de pé.
 */
function BancoDeNuvem({
  x,
  y,
  l: larg,
  alt,
  cor,
  opacidade,
  contorno = false,
}: {
  x: number;
  y: number;
  l: number;
  alt: number;
  cor: string;
  opacidade: number;
  contorno?: boolean;
}) {
  const topo =
    `M${x - larg / 2} ${y}` +
    ` C${x - larg * 0.47} ${y - alt * 0.34} ${x - larg * 0.4} ${y - alt * 0.62} ${x - larg * 0.3} ${y - alt * 0.56}` +
    ` C${x - larg * 0.26} ${y - alt * 0.92} ${x - larg * 0.08} ${y - alt} ${x - larg * 0.02} ${y - alt * 0.66}` +
    ` C${x + larg * 0.04} ${y - alt * 0.95} ${x + larg * 0.24} ${y - alt * 0.86} ${x + larg * 0.26} ${y - alt * 0.5}` +
    ` C${x + larg * 0.34} ${y - alt * 0.56} ${x + larg * 0.45} ${y - alt * 0.32} ${x + larg / 2} ${y}`;

  return (
    <>
      <Path
        d={`${topo} Z`}
        fill={cor}
        opacity={opacidade}
        stroke={contorno ? CONTORNO : 'none'}
        strokeWidth={contorno ? 1.6 : 0}
        strokeLinejoin="round"
      />
      <Path
        d={
          `M${x - larg * 0.42} ${y - alt * 0.24}` +
          ` C${x - larg * 0.2} ${y - alt * 0.08} ${x + larg * 0.2} ${y - alt * 0.08} ${x + larg * 0.42} ${y - alt * 0.24}` +
          ` L${x + larg * 0.42} ${y} L${x - larg * 0.42} ${y} Z`
        }
        fill={NUVEM_SOMBRA}
        opacity={opacidade * 0.5}
      />
      <Path
        d={`M${x - larg * 0.25} ${y - alt * 0.7} C${x - larg * 0.2} ${y - alt * 0.91} ${x - larg * 0.09} ${y - alt * 0.96} ${x - larg * 0.03} ${y - alt * 0.78}`}
        stroke={NUVEM_BRANCA}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
        opacity={opacidade * 0.85}
      />
    </>
  );
}

/* ---------- Insônia: a lua entre as nuvens, e nenhum chão ---------- */

/**
 * A lua no meio do cartão, com bancos de nuvem passando atrás e na frente dela.
 * É a única das treze cenas que não tem chão.
 *
 * ## Por que o chão saiu
 *
 * A versão anterior tinha lua, campo e névoa deitada, e a névoa era boa — só
 * que o cartão continuava sendo um lugar visto de fora, com a mesma armação dos
 * vizinhos: céu em cima, horizonte no meio, terra embaixo. Doze cenas com a
 * mesma armação e um objeto diferente em cada uma é uma coleção de figurinhas.
 *
 * Aqui não existe horizonte. O cartão é céu do topo à borda de baixo, e quem
 * olha está **dentro** dele — que é onde a cabeça está na hora de dormir, e não
 * num campo olhando a paisagem.
 *
 * A estrutura de luz da família continua de pé: o banco mais claro é o de
 * baixo, e o cartão escurece na borda pela barriga dele. O que mudou é que o
 * claro do meio virou nuvem, e não horizonte.
 *
 * ## Entre as nuvens, e não do lado delas
 *
 * O banco escuro passa **atrás** da lua e o de traço grosso passa na
 * **frente**, cobrindo o pé dela. Sem esse cruzamento a cena seria "uma lua e
 * umas nuvens"; com ele, existe ar entre ela e quem olha. É o mesmo truque de
 * profundidade da mata das outras cenas, de pé em vez de deitado.
 *
 * O banco de trás tem uma segunda função, e é ela que decide se a cena existe:
 * a lua é creme-amarelada e o céu do cartão acaba em creme. Lua clara sobre céu
 * claro é uma forma que ninguém acha. Com o banco atrás, ela tem contra o que
 * aparecer — e o halo em volta dela fecha o resto.
 *
 * ## O movimento
 *
 * As nuvens escorregam de lado, cada banco no seu passo, o de perto mais que o
 * de longe — que é como paralaxe funciona, e é o que faz o céu ter camadas. A
 * lua pende um grau e fica. As estrelas baixam juntas até um brilho fraco, como
 * já baixavam: o cartão diz "Preparar o sono", e o que ele tem de mostrar é
 * tudo indo parando.
 */
function Insonia({ l, a, p, id }: CenarioProps) {
  /** O céu livre: do pé do título até a borda de baixo. Aqui, o cartão todo. */
  const alto = peDoTituloNaCena(a);
  const ceu = a - alto;
  const luaX = l * 0.48;
  const luaY = alto + ceu * 0.42;
  const luaR = Math.min(29, ceu * 0.37);

  /** As estrelas ficam nos vãos entre os bancos, e por isso vêm antes deles. */
  const estrelas = [
    { x: 0.11, y: 0.06, r: 2.8 },
    { x: 0.3, y: 0.12, r: 2 },
    { x: 0.63, y: 0.05, r: 2.4 },
    { x: 0.83, y: 0.15, r: 1.8 },
    { x: 0.92, y: 0.34, r: 1.5 },
    { x: 0.2, y: 0.28, r: 1.6 },
  ] as const;

  return (
    <>
      <Defs>
        {/*
          O luar: um halo que cai a zero. Ele não é enfeite — é o que separa a
          lua do céu claro nos dois temas, junto com o banco escuro atrás dela.
        */}
        {/*
          A bruma atrás da lua: um borrão escuro de bordas em nada.

          Ela começou como mais um banco de nuvem, e o cartão virou paisagem de
          morro — quatro fundos chatos empilhados leem como serra, não como
          céu. Sem fundo nenhum, ela só escurece o ar onde a lua está, que é
          tudo o que ela precisava fazer.
        */}
        <RadialGradient id={`brumaI-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={NUVEM_SOMBRA} stopOpacity={0.62} />
          <Stop offset="0.5" stopColor={NUVEM_SOMBRA} stopOpacity={0.4} />
          <Stop offset="1" stopColor={NUVEM_SOMBRA} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`luarI-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={LUA} stopOpacity={0.5} />
          <Stop offset="0.45" stopColor={LUA} stopOpacity={0.26} />
          <Stop offset="1" stopColor={LUA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <G opacity={curva(p, [1, 0.86, 0.7, 0.56, 0.45])}>
        {estrelas.map((e, i) => {
          const ex = l * e.x;
          const ey = alto + ceu * e.y;
          return (
            <Path
              key={i}
              d={`M${ex} ${ey - e.r} L${ex + e.r * 0.34} ${ey - e.r * 0.34} L${ex + e.r} ${ey} L${ex + e.r * 0.34} ${ey + e.r * 0.34} L${ex} ${ey + e.r} L${ex - e.r * 0.34} ${ey + e.r * 0.34} L${ex - e.r} ${ey} L${ex - e.r * 0.34} ${ey - e.r * 0.34} Z`}
              fill={ESTRELA}
            />
          );
        })}
      </G>

      {/* Duas nuvens altas e longe: quase só um tom no céu. */}
      <BancoDeNuvem
        x={l * 0.26 + curva(p, [0, 0.6, 1.2, 1.7, 2])}
        y={alto + ceu * 0.22}
        l={l * 0.66}
        alt={ceu * 0.15}
        cor={NUVEM}
        opacidade={0.5}
      />
      <BancoDeNuvem
        x={l * 0.88 + curva(p, [0, 0.4, 0.8, 1.1, 1.3])}
        y={alto + ceu * 0.33}
        l={l * 0.5}
        alt={ceu * 0.12}
        cor={NUVEM}
        opacidade={0.4}
      />

      {/* A bruma de trás: é contra ela que a lua clara aparece. */}
      <Ellipse
        cx={luaX + l * 0.06 - curva(p, [0, 0.5, 1, 1.4, 1.7])}
        cy={luaY + luaR * 0.1}
        rx={l * 0.4}
        ry={luaR * 1.15}
        fill={`url(#brumaI-${id})`}
      />

      <Ellipse
        cx={luaX}
        cy={luaY}
        rx={luaR * 1.9}
        ry={luaR * 1.7}
        fill={`url(#luarI-${id})`}
      />

      {/* A lua, pendendo um fio de grau — o único movimento dela. */}
      <G transform={gira(curva(p, [0, -1, -2, -2.6, -3]), luaX, luaY)}>
        <Path
          d={`M${luaX + luaR * 0.32} ${luaY - luaR} C${luaX - luaR * 0.16} ${luaY - luaR * 0.9} ${luaX - luaR * 0.53} ${luaY - luaR * 0.47} ${luaX - luaR * 0.53} ${luaY} C${luaX - luaR * 0.53} ${luaY + luaR * 0.47} ${luaX - luaR * 0.16} ${luaY + luaR * 0.9} ${luaX + luaR * 0.32} ${luaY + luaR} C${luaX - luaR * 0.05} ${luaY + luaR * 0.63} ${luaX - luaR * 0.21} ${luaY + luaR * 0.32} ${luaX - luaR * 0.21} ${luaY} C${luaX - luaR * 0.21} ${luaY - luaR * 0.32} ${luaX - luaR * 0.05} ${luaY - luaR * 0.63} ${luaX + luaR * 0.32} ${luaY - luaR} Z`}
          fill={LUA}
          stroke={CONTORNO}
          strokeWidth={1.7}
          strokeLinejoin="round"
        />
        {/* Três crateras, do lado de dentro da foice. */}
        <Ellipse cx={luaX - luaR * 0.12} cy={luaY - luaR * 0.45} rx={luaR * 0.14} ry={luaR * 0.12} fill={CRATERA} opacity={0.85} />
        <Ellipse cx={luaX - luaR * 0.3} cy={luaY + luaR * 0.06} rx={luaR * 0.1} ry={luaR * 0.085} fill={CRATERA} opacity={0.7} />
        <Ellipse cx={luaX - luaR * 0.06} cy={luaY + luaR * 0.48} rx={luaR * 0.075} ry={luaR * 0.065} fill={CRATERA} opacity={0.6} />
        <Path
          d={`M${luaX + luaR * 0.1} ${luaY - luaR * 0.88} C${luaX - luaR * 0.24} ${luaY - luaR * 0.68} ${luaX - luaR * 0.44} ${luaY - luaR * 0.36} ${luaX - luaR * 0.44} ${luaY}`}
          stroke={NUVEM_BRANCA}
          strokeWidth={1.3}
          strokeLinecap="round"
          fill="none"
          opacity={0.6}
        />
      </G>

      {/*
        O banco da frente: o único com traço grosso, porque é o que está perto.

        Ele cobre o pé da lua, e é esse cruzamento que põe a lua **entre** as
        nuvens. Também é o que mais escorrega no toque — quanto mais perto,
        mais anda.
      */}
      <BancoDeNuvem
        x={l * 0.3 + curva(p, [0, 1.6, 3.2, 4.6, 5.5])}
        y={a + 5}
        l={l * 0.98}
        alt={ceu * 0.44}
        cor={NUVEM}
        opacidade={0.95}
        contorno
      />

      {/*
        E a de baixo à direita, mais clara e sem traço: ela fecha o banco e é o
        ponto mais claro da cena — o lugar onde as outras doze têm horizonte.
      */}
      <BancoDeNuvem
        x={l * 0.94 - curva(p, [0, 0.9, 1.8, 2.6, 3.2])}
        y={a + 8}
        l={l * 0.66}
        alt={ceu * 0.3}
        cor={CREME}
        opacidade={0.95}
      />
    </>
  );
}

/* ---------- Tristeza: a neblina, e o caminho que passa por ela ---------- */

/**
 * O campo tomado de neblina, e uma trilha de terra clara atravessando até
 * desaparecer dentro dela.
 *
 * ## O nome do cartão é o desenho
 *
 * "Atravessar a tristeza" — e atravessar é uma trilha. A versão anterior era um
 * céu enorme com nuvens, e dizia o que a tristeza **é**: pesada, ocupando tudo.
 * Só que o cartão não é sobre estar triste, é sobre passar por dentro. Um
 * caminho que entra na neblina diz isso numa olhada, sem metáfora que precise
 * ser explicada.
 *
 * E ele diz a coisa honesta: a trilha **não** mostra a saída. Ela some na
 * neblina ainda larga, sem afinar até virar ponta. Prometer o outro lado à
 * vista seria mentira, e o que a prática promete é só que existe caminho.
 *
 * ## O que a neblina esconde
 *
 * A mata e a linha do horizonte estão desenhadas embaixo dela, e é por isso que
 * ela lê como neblina e não como uma faixa branca: névoa só existe pelo que
 * cobre. A claridade atrás, no fim da trilha, é o sol que a neblina espalha —
 * sem disco, porque disco de sol atravessando névoa não se vê.
 *
 * No toque a neblina sobe um fio e as manchas da frente afinam, e a claridade
 * do fundo cresce: aparece um pouco mais de caminho do que antes. É o
 * movimento mais ligado ao assunto das treze — o cartão faz, em meio segundo, o
 * que a prática faz.
 *
 * ## Por que esta trilha não é o rastro que foi descartado
 *
 * A cena do luto já teve um rastro na terra, e ele virou uma barraca com ponta
 * no horizonte. Aqui são três diferenças: a trilha é clara contra o capim
 * escuro dos dois lados, ela curva em vez de ir reta, e a neblina corta o fim
 * dela **antes** da ponta. O que fazia a outra ler como forma geométrica era o
 * bico; sem bico, ela lê como chão.
 */
function Tristeza({ l, a, p, id }: CenarioProps) {
  const h = horizonteDaCena(a);
  /** O alto da neblina: logo abaixo do pé do título. */
  const alto = peDoTituloNaCena(a) + 8;

  return (
    <>
      <Defs>
        <LinearGradient id={`campoT-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={FOLHA_CLARA} />
          <Stop offset="0.45" stopColor={FOLHA} />
          <Stop offset="1" stopColor={CONTORNO_FOLHA} stopOpacity={0.85} />
        </LinearGradient>
        {/* A trilha: clara no fundo, onde a luz está, e terrosa perto. */}
        <LinearGradient id={`trilhaT-${id}`} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={TERRA} />
          <Stop offset="0.5" stopColor={TERRA_CLARA} />
          <Stop offset="1" stopColor={CREME} />
        </LinearGradient>
        <RadialGradient id={`mataT-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={FOLHA} stopOpacity={0.55} />
          <Stop offset="0.58" stopColor={FOLHA} stopOpacity={0.45} />
          <Stop offset="1" stopColor={FOLHA} stopOpacity={0} />
        </RadialGradient>
        {/* A claridade do fundo: sol espalhado, sem disco. */}
        <RadialGradient id={`solT-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={SOL} stopOpacity={0.55} />
          <Stop offset="0.5" stopColor={SOL} stopOpacity={0.24} />
          <Stop offset="1" stopColor={SOL} stopOpacity={0} />
        </RadialGradient>
        {/* Cada mancha de névoa cai a zero na borda: névoa não tem contorno. */}
        <RadialGradient id={`nevoaT-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={CREME} stopOpacity={1} />
          <Stop offset="0.5" stopColor={CREME} stopOpacity={0.82} />
          <Stop offset="1" stopColor={CREME} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* A mata, que a neblina vai cobrir quase toda. */}
      <Ellipse cx={l * 0.22} cy={h - 2} rx={l * 0.38} ry={a * 0.06} fill={`url(#mataT-${id})`} />
      <Ellipse cx={l * 0.8} cy={h} rx={l * 0.34} ry={a * 0.05} fill={`url(#mataT-${id})`} />

      {/* O campo, do horizonte até a borda de baixo. */}
      <Path
        d={`M0 ${h + 2} C${l * 0.3} ${h - 3} ${l * 0.7} ${h - 3} ${l} ${h + 2} L${l} ${a + 8} L0 ${a + 8} Z`}
        fill={`url(#campoT-${id})`}
      />

      {/*
        A trilha, torta de propósito.

        A primeira versão era simétrica, e simétrico com as duas beiras retas é
        uma rampa, não um caminho — o mesmo defeito do rastro que o luto já teve.
        Aqui a beira da esquerda sobe quase a prumo e a da direita varre para
        dentro: o caminho dobra para a esquerda enquanto se afasta, que é o que
        trilha de pé na terra faz.

        O fundo dela fica em `h + 2`, ainda com um sétimo da largura do cartão e
        embaixo da neblina mais fechada: é a névoa que acaba com ela, e não a
        perspectiva. Trilha que afina até virar bico promete o outro lado.
      */}
      <Path
        d={
          `M${l * 0.24} ${a + 8}` +
          ` C${l * 0.28} ${a * 0.92} ${l * 0.24} ${a * 0.8} ${l * 0.255} ${h + 2}` +
          ` L${l * 0.405} ${h + 2}` +
          ` C${l * 0.44} ${a * 0.78} ${l * 0.6} ${a * 0.88} ${l * 0.72} ${a + 8} Z`
        }
        fill={`url(#trilhaT-${id})`}
      />
      {/* As duas beiras, para o capim não encostar na terra sem emenda. */}
      <Path
        d={`M${l * 0.24} ${a + 8} C${l * 0.28} ${a * 0.92} ${l * 0.24} ${a * 0.8} ${l * 0.255} ${h + 2}`}
        stroke={CONTORNO_FOLHA}
        strokeWidth={1.2}
        fill="none"
        opacity={0.35}
      />
      <Path
        d={`M${l * 0.72} ${a + 8} C${l * 0.6} ${a * 0.88} ${l * 0.44} ${a * 0.78} ${l * 0.405} ${h + 2}`}
        stroke={CONTORNO_FOLHA}
        strokeWidth={1.2}
        fill="none"
        opacity={0.35}
      />

      {/* Torrões na trilha, minguando com a distância. */}
      {[
        { x: 0.46, y: 0.96, r: 2.6 },
        { x: 0.38, y: 0.89, r: 2.1 },
        { x: 0.45, y: 0.83, r: 1.7 },
        { x: 0.33, y: 0.77, r: 1.4 },
        { x: 0.37, y: 0.72, r: 1.1 },
      ].map((t, i) => (
        <Torrao key={i} x={l * t.x} y={a * t.y} r={t.r} cor={TERRA_SOMBRA} />
      ))}

      {/*
        O capim dos dois lados, mais alto e mais escuro perto, mais baixo e mais
        claro ao longe: é ele que dá a distância da trilha.
      */}
      {[
        { x: 0.09, y: 0.99, alto: 14, perto: true, para: -1 },
        { x: 0.18, y: 0.9, alto: 11, perto: true, para: 1 },
        { x: 0.17, y: 0.8, alto: 8, perto: false, para: -1 },
        { x: 0.19, y: 0.72, alto: 6, perto: false, para: 1 },
        { x: 0.82, y: 0.98, alto: 14, perto: true, para: 1 },
        { x: 0.7, y: 0.88, alto: 11, perto: true, para: -1 },
        { x: 0.57, y: 0.79, alto: 8, perto: false, para: 1 },
        { x: 0.47, y: 0.71, alto: 6, perto: false, para: -1 },
        { x: 0.94, y: 0.9, alto: 10, perto: true, para: -1 },
      ].map((c, i) => (
        <Capim
          key={i}
          x={l * c.x}
          y={a * c.y}
          alto={c.alto}
          cor={c.perto ? CONTORNO_FOLHA : FOLHA}
          balanco={curva(p, c.para > 0 ? [0, 1.4, 2.2, 0.9, 0] : [0, -1.4, -2.2, -0.9, 0])}
        />
      ))}

      {/* A claridade no fim da trilha, que cresce um fio no toque. */}
      <G transform={cresce(curva(p, [1, 1.04, 1.09, 1.13, 1.16]), l * 0.5, h - 6)}>
        <Ellipse cx={l * 0.5} cy={h - 6} rx={l * 0.3} ry={a * 0.13} fill={`url(#solT-${id})`} />
      </G>

      {/*
        A neblina. As de trás são fixas — é o horizonte que elas apagam; as da
        frente afinam no toque, e é aí que aparece mais um trecho de caminho.
      */}
      <G transform={`translate(0 ${curva(p, [0, -0.5, -1, -1.4, -1.7])})`}>
        <Ellipse cx={l * 0.32} cy={alto + 2} rx={l * 0.46} ry={a * 0.08} fill={`url(#nevoaT-${id})`} opacity={0.55} />
        <Ellipse cx={l * 0.78} cy={alto + 8} rx={l * 0.4} ry={a * 0.072} fill={`url(#nevoaT-${id})`} opacity={0.5} />
        {/*
          A faixa que apaga o horizonte. Ela é a mais fechada de todas e vem
          larga a ponto de sair pelas duas bordas: onde a névoa afina, a linha
          do campo reaparece, e uma linha reta atravessando o cartão desfaz a
          cena inteira.
        */}
        <Ellipse cx={l * 0.4} cy={h} rx={l * 0.72} ry={a * 0.075} fill={`url(#nevoaT-${id})`} opacity={0.88} />
        <Ellipse cx={l * 0.33} cy={h + 5} rx={l * 0.4} ry={a * 0.06} fill={`url(#nevoaT-${id})`} opacity={0.8} />
        <Ellipse cx={l * 0.88} cy={h + 3} rx={l * 0.34} ry={a * 0.07} fill={`url(#nevoaT-${id})`} opacity={0.7} />
        <G opacity={curva(p, [1, 0.86, 0.72, 0.58, 0.48])}>
          <Ellipse cx={l * 0.24} cy={a * 0.77} rx={l * 0.34} ry={a * 0.055} fill={`url(#nevoaT-${id})`} opacity={0.5} />
          <Ellipse cx={l * 0.78} cy={a * 0.83} rx={l * 0.32} ry={a * 0.05} fill={`url(#nevoaT-${id})`} opacity={0.42} />
        </G>
      </G>
    </>
  );
}

/**
 * A folha seca do tapete: bico, talo, nervura e duas veias.
 *
 * ## Por que ela não usa a folha do broto
 *
 * A folha do broto é gorda e arredondada nas duas pontas — é uma folha nova,
 * e é assim que ela tem de ser no broto. Repetida vinte e quatro vezes num
 * chão de terra, ela vira **pedregulho**: a primeira tentativa deste tapete
 * ficou um calçamento de paralelepípedo, e não um chão de folha.
 *
 * Três coisas separam folha de pedra, e as três estão aqui. O **bico**, que
 * pedra não tem. O **talo**, que é o sinal mais barato de todos: um risquinho
 * saindo da base e a forma inteira passa a ter vindo de um galho. E as
 * **veias**, num tom que contrasta com a lâmina em vez de acompanhar o
 * contorno — nervura escura sobre folha escura não existe de longe.
 */
const LAMINA_SECA = 'M-22 0 C-14 -13 6 -14 22 0 C6 14 -14 13 -22 0 Z';

function FolhaSeca({
  x,
  y,
  giro,
  escala,
  cor,
  veia,
}: {
  x: number;
  y: number;
  giro: number;
  escala: number;
  cor: string;
  veia: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`}>
      <Path
        d={`M-21 1 C-26 2.5 -31 3.5 -35 3`}
        stroke={TERRA_SOMBRA}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
      />
      <Path d={LAMINA_SECA} fill={cor} stroke={TERRA_SOMBRA} strokeWidth={2.6} strokeLinejoin="round" />
      <Path
        d="M-18 0 C-6 1.5 8 1.5 19 0"
        stroke={veia}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      <Path
        d="M-8 0.8 L-1 -6"
        stroke={veia}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.45}
      />
      <Path
        d="M3 0.9 L9 -4.6"
        stroke={veia}
        strokeWidth={1.3}
        strokeLinecap="round"
        fill="none"
        opacity={0.4}
      />
    </G>
  );
}

/* ---------- Luto: o toco cortado e o tapete de folhas ---------- */

/**
 * O chão coberto de folha seca, um toco de árvore cortado no meio dele, e um
 * broto novo ao lado.
 *
 * ## O toco, e por que ele diz a coisa certa
 *
 * A cena já teve um tronco inteiro entrando pela borda esquerda, e o tronco
 * tinha um problema: árvore de pé com as folhas no chão é outono, e outono
 * volta. Um toco cortado não volta. Foi cortado, e a data disso está desenhada
 * nele.
 *
 * É o **corte** que faz a cena ser sobre memória. A face cortada é a parte mais
 * clara do cartão de propósito: é madeira aberta, e é onde estão os anéis. Os
 * anéis são os anos que a árvore viveu, e eles só ficaram à vista porque ela
 * caiu. É bem o que a saudade é — o que a pessoa foi, visível agora de um jeito
 * que não era antes.
 *
 * ## O tapete é a superfície, e ele cobre tudo
 *
 * O chão inteiro é folha caída, em tom de terra: caiu muita coisa, e faz tempo.
 * Foram vinte e quatro folhas grandes, e não quarenta miúdas, porque folha
 * pequena demais vira pedrinha — ver `FolhaSeca`.
 *
 * Sobre esse chão seco, uma folha ainda **verde**, um pouco separada das
 * outras. Ela não é maior nem está em destaque; é a única que não secou. É a
 * lembrança que continua fresca enquanto o resto já virou chão.
 *
 * ## O broto não substitui nada
 *
 * Ele é pequeno, nasce na terra ao lado e **não** sai do toco. Broto saindo do
 * tronco cortado é a frase "a perda virou outra coisa", que é a frase que
 * ninguém enlutado suporta ouvir. Nascendo do lado, ele só diz que a vida
 * seguiu no mesmo lugar — que é o "seguir" do nome do cartão.
 *
 * As duas folhas que ainda descem no ar são o acontecimento da cena: sem nada
 * em movimento, o tapete é um estado, e o cartão diria que tudo já aconteceu.
 * Com elas, ainda está acontecendo.
 */
function Luto({ l, a, p, id }: CenarioProps) {
  const h = horizonteDaCena(a);
  /** Onde a terra começa. O campo fica entre ela e a mata, e dá a distância. */
  const chao = a * 0.74;
  /** O toco: a base fica enterrada no tapete, e a face cortada é o alto. */
  const tocoX = l * 0.28;
  const tocoTopo = h + 9;
  const tocoPe = a * 0.95;
  const tocoRaio = l * 0.1;
  const folhaX = l * 0.55;
  const folhaY = a * 0.9;
  const brotoX = l * 0.87;
  const brotoY = a * 0.93;

  /** O tapete: quatro fileiras, cada uma maior que a de trás. */
  const tapete = [
    { x: 0.03, y: 0.785, g: 16, e: 0.3, c: 0 },
    { x: 0.16, y: 0.775, g: -24, e: 0.28, c: 1 },
    { x: 0.3, y: 0.79, g: 6, e: 0.31, c: 0 },
    { x: 0.44, y: 0.775, g: -40, e: 0.29, c: 1 },
    { x: 0.58, y: 0.785, g: 22, e: 0.3, c: 0 },
    { x: 0.72, y: 0.775, g: -12, e: 0.28, c: 1 },
    { x: 0.86, y: 0.79, g: 32, e: 0.31, c: 0 },
    { x: 0.99, y: 0.78, g: -30, e: 0.29, c: 1 },
    { x: 0.07, y: 0.85, g: -32, e: 0.37, c: 1 },
    { x: 0.22, y: 0.865, g: 12, e: 0.39, c: 0 },
    { x: 0.37, y: 0.85, g: -8, e: 0.36, c: 1 },
    { x: 0.52, y: 0.87, g: 34, e: 0.38, c: 0 },
    { x: 0.67, y: 0.855, g: -20, e: 0.37, c: 1 },
    { x: 0.82, y: 0.87, g: 8, e: 0.39, c: 0 },
    { x: 0.96, y: 0.855, g: -36, e: 0.36, c: 1 },
    { x: 0.02, y: 0.94, g: 8, e: 0.46, c: 1 },
    { x: 0.18, y: 0.955, g: -18, e: 0.49, c: 0 },
    { x: 0.34, y: 0.935, g: 28, e: 0.45, c: 1 },
    { x: 0.5, y: 0.96, g: -6, e: 0.48, c: 0 },
    { x: 0.66, y: 0.94, g: 40, e: 0.46, c: 1 },
    { x: 0.81, y: 0.955, g: -22, e: 0.48, c: 0 },
    { x: 0.96, y: 0.935, g: 14, e: 0.45, c: 1 },
    { x: 0.06, y: 1.03, g: -14, e: 0.56, c: 0 },
    { x: 0.24, y: 1.045, g: 10, e: 0.58, c: 1 },
    { x: 0.42, y: 1.025, g: -26, e: 0.55, c: 0 },
    { x: 0.6, y: 1.05, g: 18, e: 0.57, c: 1 },
    { x: 0.78, y: 1.025, g: -10, e: 0.55, c: 0 },
    { x: 0.95, y: 1.045, g: 26, e: 0.57, c: 1 },
  ] as const;
  /** Cada tom leva a sua veia: a veia tem de contrastar com a lâmina. */
  const tomDaFolha = [TERRA_CLARA, TERRA, FOLHA_CLARA];
  const veiaDaFolha = [TERRA_SOMBRA, CREME, CONTORNO_FOLHA];

  return (
    <>
      <Defs>
        <LinearGradient id={`terraL-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_FUNDA} />
        </LinearGradient>
        {/* O toco: iluminado à esquerda, na sombra à direita. */}
        <LinearGradient id={`tocoL-${id}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={TERRA_CLARA} />
          <Stop offset="0.38" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} />
        </LinearGradient>
        <RadialGradient id={`mataL-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={FOLHA} stopOpacity={0.5} />
          <Stop offset="0.58" stopColor={FOLHA} stopOpacity={0.42} />
          <Stop offset="1" stopColor={FOLHA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Ellipse cx={l * 0.48} cy={h - 1} rx={l * 0.46} ry={a * 0.05} fill={`url(#mataL-${id})`} />
      <Ellipse cx={l * 0.92} cy={h + 2} rx={l * 0.26} ry={a * 0.04} fill={`url(#mataL-${id})`} />

      {/* O campo raso entre a mata e o tapete: é ele que dá a distância. */}
      <Path
        d={`M0 ${h + 3} C${l * 0.3} ${h - 2} ${l * 0.7} ${h - 2} ${l} ${h + 3} L${l} ${chao} C${l * 0.7} ${chao - 4} ${l * 0.3} ${chao - 4} 0 ${chao} Z`}
        fill={FOLHA_CLARA}
        opacity={0.5}
      />
      <Path
        d={`M0 ${chao - 1} C${l * 0.3} ${chao - 5} ${l * 0.7} ${chao - 5} ${l} ${chao - 1} L${l} ${a + 20} L0 ${a + 20} Z`}
        fill={`url(#terraL-${id})`}
      />

      {/* Torrões, para a terra não ser um degradê liso onde o tapete abre. */}
      {[
        { x: 0.33, y: 0.8, r: 1.6 },
        { x: 0.92, y: 0.81, r: 2 },
        { x: 0.16, y: 0.89, r: 2.2 },
        { x: 0.46, y: 0.88, r: 1.8 },
        { x: 0.8, y: 0.97, r: 2.4 },
      ].map((t, i) => (
        <Torrao key={i} x={l * t.x} y={a * t.y} r={t.r} />
      ))}

      {/*
        O toco. A base é mais larga que o alto e ainda abre em duas raízes: é
        isso que o faz ler como árvore que estava plantada, e não como poste.
      */}
      <Path
        d={`M${tocoX - tocoRaio * 1.18} ${tocoPe} C${tocoX - tocoRaio * 1.5} ${tocoPe + 1} ${tocoX - tocoRaio * 1.9} ${tocoPe + 4} ${tocoX - tocoRaio * 2.3} ${tocoPe + 6}`}
        stroke={TERRA_SOMBRA}
        strokeWidth={4.2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M${tocoX + tocoRaio * 1.1} ${tocoPe - 1} C${tocoX + tocoRaio * 1.6} ${tocoPe + 1} ${tocoX + tocoRaio * 2} ${tocoPe + 3} ${tocoX + tocoRaio * 2.4} ${tocoPe + 6}`}
        stroke={TERRA_SOMBRA}
        strokeWidth={3.6}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={
          `M${tocoX - tocoRaio} ${tocoTopo}` +
          ` C${tocoX - tocoRaio * 1.06} ${tocoTopo + (tocoPe - tocoTopo) * 0.45} ${tocoX - tocoRaio * 1.02} ${tocoPe - 7} ${tocoX - tocoRaio * 1.2} ${tocoPe}` +
          ` C${tocoX - tocoRaio * 0.5} ${tocoPe + 3} ${tocoX + tocoRaio * 0.5} ${tocoPe + 3} ${tocoX + tocoRaio * 1.12} ${tocoPe}` +
          ` C${tocoX + tocoRaio * 0.98} ${tocoPe - 7} ${tocoX + tocoRaio * 1.02} ${tocoTopo + (tocoPe - tocoTopo) * 0.45} ${tocoX + tocoRaio} ${tocoTopo} Z`
        }
        fill={`url(#tocoL-${id})`}
        stroke={CONTORNO}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {/* Três fibras na casca: é a fibra que dá a idade. */}
      <Path
        d={`M${tocoX - tocoRaio * 0.52} ${tocoTopo + 4} C${tocoX - tocoRaio * 0.6} ${tocoTopo + 12} ${tocoX - tocoRaio * 0.62} ${tocoPe - 8} ${tocoX - tocoRaio * 0.68} ${tocoPe - 2}`}
        stroke={TERRA_SOMBRA}
        strokeWidth={1.3}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
      <Path
        d={`M${tocoX - tocoRaio * 0.05} ${tocoTopo + 5} C${tocoX - tocoRaio * 0.08} ${tocoTopo + 13} ${tocoX - tocoRaio * 0.1} ${tocoPe - 9} ${tocoX - tocoRaio * 0.12} ${tocoPe - 3}`}
        stroke={TERRA_SOMBRA}
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
        opacity={0.32}
      />
      <Path
        d={`M${tocoX + tocoRaio * 0.5} ${tocoTopo + 5} C${tocoX + tocoRaio * 0.56} ${tocoTopo + 13} ${tocoX + tocoRaio * 0.58} ${tocoPe - 9} ${tocoX + tocoRaio * 0.62} ${tocoPe - 3}`}
        stroke={TERRA_SOMBRA}
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
        opacity={0.4}
      />
      {/*
        A face cortada: a parte mais clara do cartão, porque é madeira aberta.
        Os anéis são o que ela tem para dizer, e a racha atravessa todos.
      */}
      <Ellipse
        cx={tocoX}
        cy={tocoTopo}
        rx={tocoRaio}
        ry={tocoRaio * 0.26}
        fill={TERRA_CLARA}
        stroke={CONTORNO}
        strokeWidth={1.6}
      />
      <Ellipse cx={tocoX} cy={tocoTopo} rx={tocoRaio * 0.72} ry={tocoRaio * 0.185} fill="none" stroke={TERRA_SOMBRA} strokeWidth={1} opacity={0.5} />
      <Ellipse cx={tocoX} cy={tocoTopo} rx={tocoRaio * 0.46} ry={tocoRaio * 0.12} fill="none" stroke={TERRA_SOMBRA} strokeWidth={0.9} opacity={0.42} />
      <Ellipse cx={tocoX} cy={tocoTopo} rx={tocoRaio * 0.2} ry={tocoRaio * 0.055} fill="none" stroke={TERRA_SOMBRA} strokeWidth={0.8} opacity={0.35} />
      <Path
        d={`M${tocoX - tocoRaio * 0.08} ${tocoTopo - tocoRaio * 0.05} L${tocoX + tocoRaio * 0.92} ${tocoTopo + tocoRaio * 0.1}`}
        stroke={TERRA_SOMBRA}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.5}
      />

      {/* O tapete de folhas secas: é ele a superfície desta cena. */}
      {tapete.map((f, i) => (
        <FolhaSeca
          key={i}
          x={l * f.x}
          y={a * f.y}
          giro={f.g}
          escala={f.e}
          cor={tomDaFolha[f.c]}
          veia={veiaDaFolha[f.c]}
        />
      ))}

      {/*
        A folha que ainda está verde, um pouco à parte das outras. Nem maior,
        nem em destaque: só é a única que não secou.
      */}
      <G
        transform={[
          `translate(0 ${curva(p, [0, 0.4, 0.9, 1.1, 1.2])})`,
          gira(curva(p, [0, -3, -4.5, -3, 0]), folhaX, folhaY),
        ].join(' ')}
      >
        <FolhaSeca x={folhaX} y={folhaY} giro={-8} escala={0.52} cor={FOLHA} veia={FOLHA_CLARA} />
      </G>

      {/* Duas folhas ainda no ar, cada uma no seu tempo. */}
      <G
        transform={[
          `translate(0 ${curva(p, [0, 1.6, 3.4, 5, 6])})`,
          gira(curva(p, [4, 8, 13, 17, 20]), l * 0.52, a * 0.6),
        ].join(' ')}
        opacity={0.9}
      >
        <FolhaSeca x={l * 0.52} y={a * 0.6} giro={-28} escala={0.34} cor={TERRA_CLARA} veia={TERRA_SOMBRA} />
      </G>
      <G
        transform={[
          `translate(0 ${curva(p, [0, 1, 2.2, 3.4, 4.4])})`,
          gira(curva(p, [-3, -7, -11, -15, -18]), l * 0.93, a * 0.66),
        ].join(' ')}
        opacity={0.8}
      >
        <FolhaSeca x={l * 0.93} y={a * 0.66} giro={34} escala={0.28} cor={TERRA} veia={CREME} />
      </G>

      {/* O broto novo sobe um fio, devagar, e para. */}
      <G transform={cresce(curva(p, [1, 1.05, 1.1, 1.14, 1.16]), brotoX, brotoY)}>
        <Path
          d={`M${brotoX} ${brotoY} L${brotoX} ${brotoY - 17}`}
          stroke={HASTE}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <Path
          d={FOLHA_DO_BROTO}
          fill={FOLHA_CLARA}
          stroke={CONTORNO_FOLHA}
          strokeWidth={2}
          transform={`translate(${brotoX} ${brotoY - 17}) rotate(-54) scale(0.3)`}
        />
        <Path
          d={FOLHA_DO_BROTO}
          fill={FOLHA}
          stroke={CONTORNO_FOLHA}
          strokeWidth={2}
          transform={`translate(${brotoX} ${brotoY - 17}) rotate(234) scale(0.25)`}
        />
      </G>
    </>
  );
}

/* ---------- Solidão: a planta, e o lugar da que falta ---------- */

/**
 * Uma planta no canteiro e, ao lado dela, a mesma planta tracejada num lugar
 * vazio da terra.
 *
 * ## A falta desenhada
 *
 * Duas plantas separadas leem como duas plantas. Uma planta e o **contorno** de
 * outra leem como falta — e é a falta que o cartão trata. O tracejado é o
 * desenho mais direto disso que existe: a forma está ali, o preenchimento não.
 *
 * A cova rasa embaixo do tracejado é o que impede a cena de virar fantasma. Ela
 * diz que aquele lugar **é** um lugar: terra aberta, do tamanho certo, à espera.
 * O intro do tema define solidão como "a distância entre o que você sente e o
 * que os outros sabem" — e um lugar guardado é o oposto exato disso.
 *
 * ## O que faz o cartão ser "diminuir", e não "solidão"
 *
 * O movimento, e só ele. No toque os tracinhos se aproximam e o contorno fica
 * mais forte: a planta que falta chega mais perto de existir. E a planta de pé
 * se inclina um grau para o lado dela.
 *
 * Nenhuma das duas coisas completa a outra, de propósito. O tracejado nunca
 * fecha, porque o que a prática faz é encurtar a distância, não apagá-la;
 * contorno virando planta cheia seria outra promessa, e seria mentira.
 *
 * ## Por que esta cena não se parece com nenhuma outra
 *
 * É a única com terra de canteiro à mostra — superfície trabalhada, com crista,
 * torrão e cova —, e a única em que parte do desenho não é desenho cheio. As
 * vizinhas têm água, campo seco, cova de fogo, céu de nuvem, neblina e tapete
 * de folha; nenhuma tem chão de plantio.
 */
function Solidao({ l, a, p, id }: CenarioProps) {
  const h = horizonteDaCena(a);
  /** A crista do canteiro: daqui para baixo é terra trabalhada. */
  const crista = a * 0.7;
  /** As duas plantas ficam à frente, na mesma linha de terra. */
  const pe = a * 0.87;
  const plantaX = l * 0.3;
  const vagaX = l * 0.66;
  const haste = 32;

  /**
   * A planta, cheia ou tracejada.
   *
   * É a mesma geometria nas duas, e tem de ser: o que diz que ali falta
   * **aquela** planta é o contorno ser o mesmo.
   *
   * As três folhas saem de alturas diferentes da haste e para lados
   * alternados. Saindo todas do topo, como no broto, elas se empilham numa
   * roseta — que é broto, e não planta feita. O que faz uma planta ler como
   * planta é a haste aparecer **entre** as folhas.
   */
  const planta = (cx: number, vazia: boolean, vazio: number) => {
    /*
      Os ângulos foram medidos, e não escolhidos no olho: a folha se prende
      pela ponta direita, então girar 0 a deita para a esquerda, 90 a põe de
      pé e 145 a deita para a direita. Entre 200 e 300 ela cai por cima da
      haste, e o desenho vira uma argola — que foi o que aconteceu na primeira
      tentativa.
    */
    const folhas = [
      { altura: 1, escala: 0.42, giro: 105, tom: FOLHA_CLARA },
      { altura: 0.62, escala: 0.36, giro: 40, tom: FOLHA },
      { altura: 0.3, escala: 0.28, giro: 150, tom: FOLHA },
    ];
    const risco = vazia
      ? { stroke: CREME, strokeWidth: 2, strokeDasharray: `3.4 ${vazio}`, strokeLinecap: 'round' as const }
      : { stroke: CONTORNO_FOLHA, strokeWidth: 2.2 };
    return (
      <>
        <Path
          d={`M${cx} ${pe} C${cx - 2} ${pe - haste * 0.4} ${cx - 1.4} ${pe - haste * 0.75} ${cx} ${pe - haste}`}
          stroke={vazia ? CREME : HASTE}
          strokeWidth={vazia ? 2 : 2.6}
          strokeLinecap="round"
          strokeDasharray={vazia ? `3.4 ${vazio}` : undefined}
          fill="none"
        />
        {folhas.map((f, i) => (
          <Path
            key={i}
            d={FOLHA_DO_BROTO}
            fill={vazia ? 'none' : f.tom}
            transform={`translate(${cx} ${pe - haste * f.altura}) rotate(${f.giro}) scale(${f.escala})`}
            {...risco}
          />
        ))}
      </>
    );
  };

  return (
    <>
      <Defs>
        <LinearGradient id={`canteiroS-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA_CLARA} />
          <Stop offset="0.35" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_FUNDA} />
        </LinearGradient>
        <RadialGradient id={`mataS-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={FOLHA} stopOpacity={0.5} />
          <Stop offset="0.58" stopColor={FOLHA} stopOpacity={0.42} />
          <Stop offset="1" stopColor={FOLHA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Ellipse cx={l * 0.2} cy={h} rx={l * 0.4} ry={a * 0.045} fill={`url(#mataS-${id})`} />
      <Ellipse cx={l * 0.82} cy={h + 2} rx={l * 0.32} ry={a * 0.04} fill={`url(#mataS-${id})`} />

      {/* O campo raso entre o horizonte e a crista do canteiro. */}
      <Path
        d={`M0 ${h + 3} C${l * 0.3} ${h - 2} ${l * 0.7} ${h - 2} ${l} ${h + 3} L${l} ${crista} L0 ${crista} Z`}
        fill={FOLHA_CLARA}
        opacity={0.55}
      />

      {/* O canteiro: terra trabalhada, com a crista clara na beira de cima. */}
      <Path
        d={`M0 ${crista} C${l * 0.28} ${crista - 4} ${l * 0.66} ${crista - 3} ${l} ${crista + 1} L${l} ${a + 20} L0 ${a + 20} Z`}
        fill={`url(#canteiroS-${id})`}
      />
      <Path
        d={`M0 ${crista} C${l * 0.28} ${crista - 4} ${l * 0.66} ${crista - 3} ${l} ${crista + 1}`}
        stroke={TERRA_CLARA}
        strokeWidth={2.6}
        fill="none"
        opacity={0.5}
      />

      {/* Capim na beira de cima do canteiro: o de lá também é lugar. */}
      <Capim x={l * 0.06} y={crista} alto={9} cor={FOLHA} balanco={curva(p, [0, -1.2, -1.8, -0.8, 0])} />
      <Capim x={l * 0.52} y={crista - 1} alto={7} cor={FOLHA_CLARA} balanco={curva(p, [0, 1, 1.5, 0.6, 0])} />
      <Capim x={l * 0.93} y={crista + 1} alto={8} cor={FOLHA} balanco={curva(p, [0, 1.2, 1.8, 0.8, 0])} />

      {/* Torrões na terra do canteiro. */}
      {[
        { x: 0.12, y: 0.79, r: 2.2 },
        { x: 0.46, y: 0.775, r: 1.7 },
        { x: 0.84, y: 0.8, r: 2 },
        { x: 0.21, y: 0.93, r: 2.6 },
        { x: 0.44, y: 0.89, r: 1.9 },
        { x: 0.58, y: 0.98, r: 2.3 },
        { x: 0.78, y: 0.92, r: 2.1 },
        { x: 0.93, y: 0.99, r: 2.4 },
        { x: 0.34, y: 1, r: 2.2 },
      ].map((t, i) => (
        <Torrao key={i} x={l * t.x} y={a * t.y} r={t.r} />
      ))}

      {/*
        A cova rasa: a sombra por dentro e a luz na beira de trás. É esse par
        que faz o buraco ler como buraco, e não como mancha.
      */}
      <Ellipse cx={vagaX} cy={pe} rx={l * 0.07} ry={a * 0.028} fill={TERRA_SOMBRA} opacity={0.28} />
      <Path
        d={`M${vagaX - l * 0.07} ${pe} C${vagaX - l * 0.046} ${pe - a * 0.03} ${vagaX + l * 0.046} ${pe - a * 0.03} ${vagaX + l * 0.07} ${pe}`}
        stroke={CREME}
        strokeWidth={1.4}
        fill="none"
        opacity={0.4}
      />
      {/* A terra que saiu da cova, amontoada na beira de baixo. */}
      <Ellipse cx={vagaX} cy={pe + a * 0.03} rx={l * 0.055} ry={a * 0.016} fill={TERRA_CLARA} opacity={0.38} />

      {/*
        A planta que falta. Os tracinhos se aproximam no toque e o contorno
        ganha corpo — é aqui que o cartão deixa de dizer "solidão" e passa a
        dizer "diminuir".
      */}
      <G opacity={curva(p, [0.62, 0.7, 0.78, 0.86, 0.92])}>
        {planta(vagaX, true, curva(p, [4.8, 4.2, 3.6, 3, 2.6]))}
      </G>

      {/* A planta de pé, inclinando um grau para o lado da outra. */}
      <G transform={gira(curva(p, [0, 0.8, 1.6, 2.2, 2.6]), plantaX, pe)}>
        <Ellipse cx={plantaX} cy={pe} rx={l * 0.055} ry={a * 0.022} fill={TERRA_SOMBRA} opacity={0.35} />
        {planta(plantaX, false, 0)}
        <Capim x={plantaX - 11} y={pe + 1} alto={7} cor={FOLHA} balanco={curva(p, [0, -1, -1.6, -0.7, 0])} />
        <Capim x={plantaX + 9} y={pe + 2} alto={6} cor={FOLHA_CLARA} balanco={curva(p, [0, 1, 1.4, 0.6, 0])} />
      </G>
    </>
  );
}

/* ---------- Procrastinação: o barranco e o primeiro degrau ---------- */

/**
 * Um barranco de terra alto demais para se ver o topo, e um degrau cortado no
 * pé dele. Acima, os próximos degraus estão só marcados.
 *
 * ## A frase do tema é o desenho
 *
 * O intro diz: "Procrastinar raramente é preguiça. É quase sempre uma tarefa
 * grande demais para o estado em que você está." O barranco é a tarefa, e ele
 * **sai pela borda de cima à esquerda** de propósito — não se vê onde acaba,
 * porque o tamanho dele não é o assunto e não vai mudar.
 *
 * O que muda é o degrau. Ele é pequeno, é do tamanho do estado em que a pessoa
 * está, e é a única coisa acesa no cartão: terra recém-aberta é mais clara que
 * a terra velha, e os farelos ainda estão caindo dele. Acabou de acontecer.
 *
 * ## Por que os de cima são tracejados
 *
 * Porque eles não existem ainda. Se estivessem cortados, a cena diria que a
 * subida já está pronta e a pessoa só não andou — que é a leitura de preguiça,
 * a única que o intro desmente.
 *
 * O tracejado é o mesmo idioma da solidão: ali ele é a planta que falta, aqui
 * é o degrau que falta. Duas cenas dividindo um idioma é vocabulário, e não
 * repetição — elas não se parecem em mais nada, uma é canteiro plano e a outra
 * é barranco de pé.
 *
 * ## A superfície
 *
 * É a única cena com **desnível**: em todas as outras o chão é horizontal e a
 * vista é para o horizonte. Aqui a terra sobe na frente de quem olha e tapa
 * metade do céu. A estrutura de luz da família continua: o claro fica na fresta
 * de campo à direita, onde o horizonte aparece, e escurece descendo pela face
 * do barranco.
 */
function Procrastinacao({ l, a, p, id }: CenarioProps) {
  const h = horizonteDaCena(a);
  /** Onde a crista do barranco sai pela borda esquerda. */
  const crista = Math.max(peDoTituloNaCena(a) + 10, a * 0.46);
  /** O degrau: a quina de cima à esquerda da pisada. */
  const pisadaX = l * 0.38;
  const pisadaY = a * 0.7;
  /** A quina de fora, onde a pisada acaba e o espelho começa a descer. */
  const quinaX = l * 0.68;
  const quinaY = a * 0.74;
  /** O pé do espelho, onde a terra solta se junta. */
  const peX = l * 0.71;
  const peY = a * 0.96;

  /**
   * A silhueta do barranco, com o degrau **dentro dela**.
   *
   * Esta é a decisão inteira da cena. Desenhado por cima da face, o degrau vira
   * uma tábua clara encostada no morro — foi o que aconteceu na primeira
   * tentativa. Recortado na silhueta, ele tem céu do outro lado: a pisada vira
   * uma linha horizontal e o espelho uma queda a prumo, e não existe outra
   * coisa no mundo com esse contorno.
   */
  const crestaComGrama =
    `M0 ${crista} C${l * 0.12} ${crista + a * 0.05} ${l * 0.26} ${a * 0.6} ${pisadaX} ${pisadaY}`;
  const barranco =
    `${crestaComGrama}` +
    ` L${quinaX} ${quinaY}` +
    ` L${peX} ${peY}` +
    ` C${l * 0.76} ${a * 0.97} ${l * 0.88} ${a} ${l} ${a * 1.01}`;

  return (
    <>
      <Defs>
        {/* O barranco: crista clara, pé fundo. */}
        <LinearGradient id={`barrancoP-${id}`} x1="0" y1="0" x2="0.3" y2="1">
          <Stop offset="0" stopColor={TERRA_CLARA} />
          <Stop offset="0.3" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_FUNDA} />
        </LinearGradient>
        <LinearGradient id={`campoP-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={FOLHA_CLARA} />
          <Stop offset="1" stopColor={FOLHA} />
        </LinearGradient>
        <RadialGradient id={`mataP-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={FOLHA} stopOpacity={0.5} />
          <Stop offset="0.58" stopColor={FOLHA} stopOpacity={0.42} />
          <Stop offset="1" stopColor={FOLHA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* A fresta de distância à direita: é ela que dá o claro da cena. */}
      <Ellipse cx={l * 0.9} cy={h - 1} rx={l * 0.3} ry={a * 0.05} fill={`url(#mataP-${id})`} />
      <Path
        d={`M0 ${h + 2} C${l * 0.3} ${h - 3} ${l * 0.7} ${h - 3} ${l} ${h + 2} L${l} ${a + 10} L0 ${a + 10} Z`}
        fill={`url(#campoP-${id})`}
      />

      <Path d={`${barranco} L${l} ${a + 10} L0 ${a + 10} Z`} fill={`url(#barrancoP-${id})`} />
      {/* A grama da crista: é ela que diz que aquilo é terra, e não parede. */}
      <Path d={crestaComGrama} stroke={FOLHA} strokeWidth={3.4} fill="none" opacity={0.85} strokeLinejoin="round" />
      <Capim x={l * 0.05} y={crista + 3} alto={10} cor={FOLHA} balanco={curva(p, [0, -1.2, -1.8, -0.8, 0])} />
      <Capim x={l * 0.2} y={a * 0.56} alto={8} cor={FOLHA_CLARA} balanco={curva(p, [0, 1, 1.5, 0.6, 0])} />
      <Capim x={l * 0.34} y={a * 0.66} alto={7} cor={FOLHA} balanco={curva(p, [0, 1.2, 1.8, 0.8, 0])} />

      {/* Torrões na face: terra aberta tem grão. */}
      {[
        { x: 0.08, y: 0.68, r: 2 },
        { x: 0.26, y: 0.76, r: 1.7 },
        { x: 0.14, y: 0.87, r: 2.4 },
        { x: 0.38, y: 0.86, r: 2 },
        { x: 0.06, y: 0.97, r: 2.6 },
        { x: 0.5, y: 0.94, r: 2.2 },
        { x: 0.3, y: 0.99, r: 1.8 },
      ].map((t, i) => (
        <Torrao key={i} x={l * t.x} y={a * t.y} r={t.r} />
      ))}

      {/*
        A terra do degrau é mais clara que a do barranco: terra recém-aberta é
        sempre mais clara que a terra velha, e é esse degrau de tom que diz que
        o corte é de agora. Sem ele, o degrau podia estar ali há dez anos.
      */}
      <Path
        d={
          `M${pisadaX} ${pisadaY} L${quinaX} ${quinaY} L${peX} ${peY}` +
          ` L${peX - 10} ${peY + 1} L${quinaX - 11} ${quinaY + 12} L${pisadaX + 4} ${pisadaY + 13} Z`
        }
        fill={TERRA_CLARA}
        opacity={curva(p, [0.62, 0.7, 0.78, 0.86, 0.9])}
      />
      {/* Duas raspagens no espelho do degrau: corte feito à mão tem marca. */}
      <Path
        d={`M${quinaX - 7} ${quinaY + 8} L${peX - 7} ${peY - 9}`}
        stroke={CREME}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.3}
      />
      <Path
        d={`M${quinaX - 2} ${quinaY + 11} L${peX - 2} ${peY - 5}`}
        stroke={TERRA_SOMBRA}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.3}
      />
      {/* O lábio de luz na quina da pisada. */}
      <Path
        d={`M${pisadaX + 1} ${pisadaY + 0.6} L${quinaX - 1} ${quinaY - 0.6}`}
        stroke={CREME}
        strokeWidth={1.8}
        strokeLinecap="round"
        opacity={curva(p, [0.55, 0.66, 0.78, 0.88, 0.94])}
      />

      {/*
        Os farelos caindo da quina, e o montinho de terra solta no pé.

        São eles que dizem "isto acabou de ser cortado". Sem eles o degrau é uma
        coisa que sempre esteve ali, e o cartão volta a dizer preguiça — que é a
        única leitura que o intro do tema desmente.
      */}
      <Ellipse cx={peX - 2} cy={peY + 2} rx={11} ry={3.4} fill={TERRA_CLARA} opacity={0.5} />
      <Torrao x={peX - 8} y={peY + 1} r={2.4} />
      <Torrao x={peX + 4} y={peY + 3} r={1.9} />
      <G transform={`translate(0 ${curva(p, [0, 2.6, 5.8, 9, 11.5])})`} opacity={curva(p, [0.9, 0.8, 0.6, 0.34, 0])}>
        <Ellipse cx={quinaX + 2} cy={quinaY + 7} rx={1.7} ry={1.4} fill={TERRA_CLARA} />
        <Ellipse cx={quinaX + 4} cy={quinaY + 15} rx={1.2} ry={1} fill={TERRA_CLARA} />
      </G>
      <G transform={`translate(0 ${curva(p, [0, 1.4, 3.2, 5.2, 7])})`} opacity={curva(p, [0.7, 0.62, 0.48, 0.28, 0])}>
        <Ellipse cx={quinaX + 6} cy={quinaY + 10} rx={1.1} ry={0.9} fill={TERRA_CLARA} />
      </G>

      {/* Capim no chão de cá, ao pé do barranco: é onde a pessoa está. */}
      <Capim x={l * 0.82} y={a * 0.99} alto={12} cor={CONTORNO_FOLHA} balanco={curva(p, [0, 1.4, 2.2, 0.9, 0])} />
      <Capim x={l * 0.95} y={a * 0.93} alto={9} cor={FOLHA} balanco={curva(p, [0, -1.2, -1.8, -0.8, 0])} />
    </>
  );
}

/* ---------- O mapa, que cresce a cada cartão aprovado ---------- */

const CENARIOS: Record<string, (props: CenarioProps) => React.JSX.Element> = {
  ansiedade: Ansiedade,
  estresse: Estresse,
  raiva: Raiva,
  insonia: Insonia,
  tristeza: Tristeza,
  luto: Luto,
  solidao: Solidao,
  procrastinacao: Procrastinacao,
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

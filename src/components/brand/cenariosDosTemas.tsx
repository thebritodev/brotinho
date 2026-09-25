import React, { useId } from 'react';
import Svg, {
  Circle,
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

/** O acento da solidão: o barro dos dois vasos. */
const VASO = tracos.vaso;
const VASO_LUZ = tracos.vasoLuz;

/** O acento da tristeza: o sol que estava atrás o tempo todo. */
const SOL = palette.yellow300;
const NUVEM_BRANCA = '#FFFFFF';

/** O acento da insônia: a última luz do dia, e a lua. */
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
export function horizonteDaCena(a: number) {
  return Math.max(TITULO_DE_DUAS_LINHAS + FOLGA_DO_TITULO + MORROS_ACIMA_DO_HORIZONTE, a * 0.5);
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

/* ---------- Insônia: o campo no fim da luz ---------- */

/**
 * A lua baixa, duas estrelas quietas e uma nuvem assentando embaixo dela.
 *
 * ## A metáfora, herdada e intacta
 *
 * As estrelas já piscaram fora de compasso, de propósito, para dar "a noite
 * acordada" — e noite acordada era o tema quando o cartão se chamava "Insônia".
 * Hoje ele diz "Preparar o sono", e a cena precisa mostrar o contrário: **nada
 * se mexendo quando você quer que tudo pare**. Então elas baixam juntas até um
 * brilho fraco, e a nuvem desce e se acomoda embaixo da lua, como travesseiro
 * recebendo peso.
 *
 * ## Por que é o fim da tarde, e não a noite fechada
 *
 * O céu de toda cena começa no tom do grupo e assenta no creme do app — é o que
 * emenda a paisagem com o cartão, e o que faz o escuro virar amanhecer sozinho.
 * Uma noite fechada precisaria romper com isso, e romperia por um cartão só.
 *
 * O fim da luz resolve igual e é mais fiel ao que a prática faz: ela não é
 * dormir, é **preparar** o sono. A lua já subiu, as estrelas já apareceram, e o
 * horizonte ainda tem a última claridade do dia. É a hora em que se começa a
 * desacelerar, não a hora em que já se está dormindo.
 *
 * ## Onde a lua cabe
 *
 * Abaixo do pé do título e acima do horizonte: é a única faixa de céu que não é
 * do texto. Por isso ela é baixa — e lua baixa é lua que acabou de subir, que é
 * exatamente a hora da cena.
 */
function Insonia({ l, a, p, id }: CenarioProps) {
  const h = horizonteDaCena(a);
  /** A faixa de céu livre: entre o pé do título e a linha do horizonte. */
  const ceuLivre = h - peDoTituloNaCena(a);
  const luaX = l * 0.78;
  const luaY = peDoTituloNaCena(a) + ceuLivre * 0.5;
  const luaR = Math.min(20, ceuLivre * 0.47);
  /** A nuvem fica deitada no horizonte, à esquerda da lua. */
  const nuvemX = l * 0.42;
  const nuvemAlto = Math.min(15, ceuLivre * 0.4);

  return (
    <>
      <Defs>
        <LinearGradient id={`noite-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA} />
          <Stop offset="0.35" stopColor={TERRA_FUNDA} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} />
        </LinearGradient>
        <RadialGradient id={`mataI-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={FOLHA} stopOpacity={0.95} />
          <Stop offset="0.58" stopColor={FOLHA} stopOpacity={0.8} />
          <Stop offset="1" stopColor={FOLHA} stopOpacity={0} />
        </RadialGradient>
        {/*
          A claridade no chão cai a zero na borda, como o halo de calor da
          raiva. Com opacidade chapada ela vira uma poça: aparece a aresta da
          elipse, e luz não tem aresta.
        */}
        <RadialGradient id={`luar-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={CREME} stopOpacity={0.22} />
          <Stop offset="0.5" stopColor={CREME} stopOpacity={0.11} />
          <Stop offset="1" stopColor={CREME} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/*
        A mata ao longe é a mais fechada das quatro cenas, e é o que diz a hora.

        No fim da luz, o que está entre você e o horizonte perde a cor antes de
        perder a forma. Nas outras cenas a mata é um verde apagado; aqui ela é
        quase opaca, e o que sobra de claro fica por conta da faixa de última
        claridade logo abaixo dela.
      */}
      <Ellipse cx={l * 0.26} cy={h - 1} rx={l * 0.4} ry={a * 0.055} fill={`url(#mataI-${id})`} />
      <Ellipse cx={l * 0.86} cy={h + 2} rx={l * 0.3} ry={a * 0.045} fill={`url(#mataI-${id})`} />

      {/* A última claridade do dia, deitada na linha do horizonte. */}
      <Path
        d={`M0 ${h + 2} C${l * 0.3} ${h - 3} ${l * 0.7} ${h - 3} ${l} ${h + 2} L${l} ${h + 6} L0 ${h + 6} Z`}
        fill={CREME}
        opacity={0.55}
      />

      <Path
        d={`M0 ${h + 4} C${l * 0.3} ${h - 1} ${l * 0.7} ${h - 1} ${l} ${h + 4} L${l} ${a + 20} L0 ${a + 20} Z`}
        fill={`url(#noite-${id})`}
      />

      {/*
        A luz da lua deitada no chão, embaixo dela.

        O chão desta cena é o mais escuro das quatro — é noite — e sem nada
        acontecendo nele o cartão virava uma faixa preta com dois tufos. A
        claridade no chão resolve os dois: dá o que olhar, e diz que a lua está
        acesa. É a mesma peça que o halo de calor é na cova da raiva.
      */}
      <Ellipse cx={luaX - l * 0.04} cy={a * 0.88} rx={l * 0.34} ry={a * 0.12} fill={`url(#luar-${id})`} />

      {/* O chão indo embora, como na cova da raiva: é o que dá distância. */}
      {[
        { x: 0.16, y: 0.76, r: 1.5, op: 0.22 },
        { x: 0.5, y: 0.8, r: 1.9, op: 0.2 },
        { x: 0.9, y: 0.85, r: 2.3, op: 0.18 },
      ].map((m, i) => (
        <Ellipse key={i} cx={l * m.x} cy={a * m.y} rx={m.r} ry={m.r * 0.8} fill={CREME} opacity={m.op} />
      ))}

      {/*
        As duas estrelas, baixando **juntas**. Fora de compasso elas dizem
        "ainda acordado", que é o tema anterior deste cartão.
      */}
      <G opacity={curva(p, [1, 0.86, 0.7, 0.56, 0.45])}>
        {[
          { x: 0.09, y: 0.28, r: 3.2 },
          { x: 0.2, y: 0.62, r: 2.2 },
          { x: 0.62, y: 0.2, r: 2 },
        ].map((e, i) => {
          const ex = l * e.x;
          const ey = peDoTituloNaCena(a) + ceuLivre * e.y;
          return (
            <Path
              key={i}
              d={`M${ex} ${ey - e.r} L${ex + e.r * 0.34} ${ey - e.r * 0.34} L${ex + e.r} ${ey} L${ex + e.r * 0.34} ${ey + e.r * 0.34} L${ex} ${ey + e.r} L${ex - e.r * 0.34} ${ey + e.r * 0.34} L${ex - e.r} ${ey} L${ex - e.r * 0.34} ${ey - e.r * 0.34} Z`}
              fill={ESTRELA}
            />
          );
        })}
      </G>

      {/*
        A nuvem, deitada no horizonte e à esquerda da lua.

        Ela já esteve **embaixo** da lua, como travesseiro recebendo o peso
        dela. Num cartão de 130 a faixa de céu livre tem trinta e dois pontos, e
        as duas empilhadas ali viravam uma coisa só: a nuvem cobria a lua e
        sobrava uma foice espiando por cima. Lado a lado, a nuvem continua
        cedendo — ela desce e alarga um fio, do jeito que travesseiro cede — e a
        lua continua inteira.
      */}
      <G
        transform={[
          `translate(0 ${curva(p, [0, 0.7, 1.3, 1.7, 2])})`,
          cresce(curva(p, [1, 1.01, 1.02, 1.03, 1.04]), nuvemX, h - 1),
        ].join(' ')}
      >
        <Path
          d={`M${nuvemX - 27} ${h - 1} C${nuvemX - 33} ${h - 1} ${nuvemX - 36} ${h - nuvemAlto * 0.4} ${nuvemX - 36} ${h - nuvemAlto * 0.64} C${nuvemX - 36} ${h - nuvemAlto * 0.92} ${nuvemX - 31} ${h - nuvemAlto * 1.05} ${nuvemX - 26} ${h - nuvemAlto} C${nuvemX - 23} ${h - nuvemAlto * 1.5} ${nuvemX - 13} ${h - nuvemAlto * 1.62} ${nuvemX - 6} ${h - nuvemAlto * 1.32} C${nuvemX + 1} ${h - nuvemAlto * 1.16} ${nuvemX + 6} ${h - nuvemAlto * 0.85} ${nuvemX + 7} ${h - nuvemAlto * 0.6} C${nuvemX + 16} ${h - nuvemAlto * 0.84} ${nuvemX + 25} ${h - nuvemAlto * 0.5} ${nuvemX + 25} ${h - nuvemAlto * 0.2} C${nuvemX + 25} ${h - 1.6} ${nuvemX + 22} ${h - 1} ${nuvemX + 18} ${h - 1} Z`}
          fill={NUVEM}
          stroke={CONTORNO}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {/* A barriga da nuvem, um tom abaixo: peso recebido tem sombra. */}
        <Path
          d={`M${nuvemX - 32} ${h - nuvemAlto * 0.42} C${nuvemX - 23} ${h - 2.6} ${nuvemX - 8} ${h - 2} ${nuvemX + 6} ${h - 2} C${nuvemX + 13} ${h - 2} ${nuvemX + 20} ${h - 2.4} ${nuvemX + 23} ${h - 3.4} C${nuvemX + 22.5} ${h - 1.8} ${nuvemX + 21} ${h - 1.3} ${nuvemX + 18} ${h - 1.3} L${nuvemX - 27} ${h - 1.3} C${nuvemX - 30} ${h - 1.3} ${nuvemX - 31.4} ${h - nuvemAlto * 0.28} ${nuvemX - 32} ${h - nuvemAlto * 0.42} Z`}
          fill={NUVEM_SOMBRA}
          opacity={0.45}
        />
      </G>

      {/* A lua, pendendo um fio de grau — o único movimento dela. */}
      <G transform={gira(curva(p, [0, -1, -2, -2.6, -3]), luaX, luaY)}>
        <Path
          d={`M${luaX + luaR * 0.32} ${luaY - luaR} C${luaX - luaR * 0.16} ${luaY - luaR * 0.9} ${luaX - luaR * 0.53} ${luaY - luaR * 0.47} ${luaX - luaR * 0.53} ${luaY} C${luaX - luaR * 0.53} ${luaY + luaR * 0.47} ${luaX - luaR * 0.16} ${luaY + luaR * 0.9} ${luaX + luaR * 0.32} ${luaY + luaR} C${luaX - luaR * 0.05} ${luaY + luaR * 0.63} ${luaX - luaR * 0.21} ${luaY + luaR * 0.32} ${luaX - luaR * 0.21} ${luaY} C${luaX - luaR * 0.21} ${luaY - luaR * 0.32} ${luaX - luaR * 0.05} ${luaY - luaR * 0.63} ${luaX + luaR * 0.32} ${luaY - luaR} Z`}
          fill={LUA}
          stroke={CONTORNO}
          strokeWidth={1.7}
          strokeLinejoin="round"
        />
        {/*
          Três crateras, do lado de dentro da foice: é o detalhe que faz a lua
          parar de ser uma fatia de melão.
        */}
        <Ellipse cx={luaX - luaR * 0.12} cy={luaY - luaR * 0.45} rx={luaR * 0.14} ry={luaR * 0.12} fill={CRATERA} opacity={0.85} />
        <Ellipse cx={luaX - luaR * 0.3} cy={luaY + luaR * 0.06} rx={luaR * 0.1} ry={luaR * 0.085} fill={CRATERA} opacity={0.7} />
        <Ellipse cx={luaX - luaR * 0.06} cy={luaY + luaR * 0.48} rx={luaR * 0.075} ry={luaR * 0.065} fill={CRATERA} opacity={0.6} />
        <Path
          d={`M${luaX + luaR * 0.1} ${luaY - luaR * 0.88} C${luaX - luaR * 0.24} ${luaY - luaR * 0.68} ${luaX - luaR * 0.44} ${luaY - luaR * 0.36} ${luaX - luaR * 0.44} ${luaY}`}
          stroke="#FFFFFF"
          strokeWidth={1.3}
          strokeLinecap="round"
          fill="none"
          opacity={0.6}
        />
      </G>

      <Capim x={l * 0.1} y={a * 0.96} alto={12} cor={CONTORNO_FOLHA} balanco={curva(p, [0, -1.2, -1.8, -0.8, 0])} />
      <Capim x={l * 0.72} y={a * 0.93} alto={10} cor={CONTORNO_FOLHA} balanco={curva(p, [0, 1, 1.6, 0.7, 0])} />
    </>
  );
}

/* ---------- Tristeza: o campo quando a nuvem sai da frente ---------- */

/**
 * O sol que estava atrás o tempo todo, e a nuvem saindo da frente dele.
 *
 * ## A metáfora, herdada e intacta
 *
 * A cena já foi nuvem, chuva fina e poça — o dia que não passa. O cartão diz
 * "Atravessar a tristeza", e atravessar tem um outro lado; aquela cena não
 * mostrava nenhum.
 *
 * O sol não **chega**: ele estava ali desde o começo, e o que se move é o que
 * estava na frente. É a diferença entre prometer que a tristeza acaba e dizer
 * que ela passa na frente de alguma coisa que continua existindo.
 *
 * Os raios aparecem conforme a nuvem sai, e não antes: parados, a cena
 * entregaria o outro lado de graça.
 *
 * ## O enquadramento
 *
 * Esta é a única cena do app em que **o céu é o assunto**. As outras usam o
 * céu como fundo para o título; aqui é lá que a coisa acontece, e o chão é só o
 * lugar de onde se olha. Por isso o campo é raso e sem evento: quem disputasse
 * com o sol tiraria dele o que ele tem de único.
 */
function Tristeza({ l, a, p, id }: CenarioProps) {
  const h = horizonteDaCena(a);
  const ceuLivre = h - peDoTituloNaCena(a);
  const solX = l * 0.72;
  const solY = peDoTituloNaCena(a) + ceuLivre * 0.4;
  const solR = Math.min(16, ceuLivre * 0.4);
  /** A nuvem anda para a esquerda conforme o passo corre. */
  const nuvemX = l * 0.55 - curva(p, [0, 6, 13, 19, 24]);
  const nuvemAlto = Math.min(17, ceuLivre * 0.46);

  return (
    <>
      <Defs>
        <LinearGradient id={`campoT-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={FOLHA_CLARA} stopOpacity={0.9} />
          <Stop offset="1" stopColor={FOLHA} stopOpacity={0.95} />
        </LinearGradient>
        <LinearGradient id={`terraT-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_FUNDA} />
        </LinearGradient>
        <RadialGradient id={`mataT-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={FOLHA} stopOpacity={0.6} />
          <Stop offset="0.58" stopColor={FOLHA} stopOpacity={0.5} />
          <Stop offset="1" stopColor={FOLHA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/*
        Os raios aparecem conforme a nuvem sai, e não antes. A opacidade deles é
        a mesma conta do passo, para que a recompensa seja do movimento.
      */}
      <G opacity={curva(p, [0, 0.15, 0.45, 0.75, 1])}>
        {[
          [1, 0],
          [0.71, -0.71],
          [0.71, 0.71],
          [0.26, -0.97],
          [0.26, 0.97],
        ].map(([dx, dy], i) => (
          <Path
            key={i}
            d={`M${solX + dx * solR * 1.25} ${solY + dy * solR * 1.25} L${solX + dx * solR * 1.6} ${solY + dy * solR * 1.6}`}
            stroke={SOL}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
      </G>
      <Circle cx={solX} cy={solY} r={solR} fill={SOL} stroke={CONTORNO} strokeWidth={1.8} />
      {/* A luz bate no alto à esquerda, como em todo desenho do app. */}
      <Path
        d={`M${solX - solR * 0.5} ${solY - solR * 0.4} C${solX - solR * 0.36} ${solY - solR * 0.64} ${solX - solR * 0.09} ${solY - solR * 0.77} ${solX + solR * 0.18} ${solY - solR * 0.73}`}
        stroke={CREME}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.75}
      />

      {/*
        A nuvem que sai da frente. Ela começa cobrindo um terço do sol e anda
        para a esquerda: o que se move é o que estava na frente, e não o sol.
      */}
      <G>
        <Path
          d={`M${nuvemX - 25} ${h - 4} C${nuvemX - 31} ${h - 4} ${nuvemX - 34} ${h - nuvemAlto * 0.45} ${nuvemX - 34} ${h - nuvemAlto * 0.7} C${nuvemX - 34} ${h - nuvemAlto} ${nuvemX - 29} ${h - nuvemAlto * 1.12} ${nuvemX - 24} ${h - nuvemAlto * 1.06} C${nuvemX - 21} ${h - nuvemAlto * 1.56} ${nuvemX - 11} ${h - nuvemAlto * 1.7} ${nuvemX - 4} ${h - nuvemAlto * 1.38} C${nuvemX + 3} ${h - nuvemAlto * 1.22} ${nuvemX + 8} ${h - nuvemAlto * 0.9} ${nuvemX + 9} ${h - nuvemAlto * 0.64} C${nuvemX + 18} ${h - nuvemAlto * 0.88} ${nuvemX + 27} ${h - nuvemAlto * 0.54} ${nuvemX + 27} ${h - nuvemAlto * 0.24} C${nuvemX + 27} ${h - 4.6} ${nuvemX + 24} ${h - 4} ${nuvemX + 20} ${h - 4} Z`}
          fill={NUVEM_BRANCA}
          stroke={CONTORNO}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {/* A barriga da nuvem, um tom abaixo. */}
        <Path
          d={`M${nuvemX - 30} ${h - nuvemAlto * 0.46} C${nuvemX - 21} ${h - 5.6} ${nuvemX - 6} ${h - 5} ${nuvemX + 8} ${h - 5} C${nuvemX + 15} ${h - 5} ${nuvemX + 22} ${h - 5.4} ${nuvemX + 25} ${h - 6.4} C${nuvemX + 24.5} ${h - 4.8} ${nuvemX + 23} ${h - 4.3} ${nuvemX + 20} ${h - 4.3} L${nuvemX - 25} ${h - 4.3} C${nuvemX - 28} ${h - 4.3} ${nuvemX - 29.4} ${h - nuvemAlto * 0.32} ${nuvemX - 30} ${h - nuvemAlto * 0.46} Z`}
          fill={NUVEM_SOMBRA}
          opacity={0.3}
        />
      </G>

      {/* A mata ao longe, e o campo raso: o chão aqui é só de onde se olha. */}
      <Ellipse cx={l * 0.24} cy={h + 1} rx={l * 0.38} ry={a * 0.05} fill={`url(#mataT-${id})`} />
      <Ellipse cx={l * 0.82} cy={h + 3} rx={l * 0.3} ry={a * 0.042} fill={`url(#mataT-${id})`} />
      <Path
        d={`M0 ${h + 4} C${l * 0.3} ${h - 1} ${l * 0.7} ${h - 1} ${l} ${h + 4} L${l} ${a * 0.86} C${l * 0.7} ${a * 0.82} ${l * 0.3} ${a * 0.82} 0 ${a * 0.86} Z`}
        fill={`url(#campoT-${id})`}
      />
      <Path
        d={`M0 ${a * 0.85} C${l * 0.3} ${a * 0.81} ${l * 0.7} ${a * 0.81} ${l} ${a * 0.85} L${l} ${a + 20} L0 ${a + 20} Z`}
        fill={`url(#terraT-${id})`}
      />

      {/*
        A luz voltando ao chão, no mesmo compasso dos raios: é ela que liga o
        que acontece no céu ao lugar onde a pessoa está.
      */}
      <Ellipse
        cx={solX - l * 0.06}
        cy={a * 0.92}
        rx={l * 0.32}
        ry={a * 0.1}
        fill={SOL}
        opacity={curva(p, [0, 0.03, 0.08, 0.13, 0.18])}
      />

      {/* Capim pelo campo, minguando com a distância — como no estresse. */}
      {[
        { x: 0.2, y: 0.71, alto: 6, op: 0.4 },
        { x: 0.45, y: 0.72, alto: 6, op: 0.4 },
        { x: 0.68, y: 0.735, alto: 7, op: 0.45 },
        { x: 0.32, y: 0.79, alto: 9, op: 0.5 },
        { x: 0.9, y: 0.78, alto: 8, op: 0.45 },
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

      <Capim x={l * 0.11} y={a * 0.95} alto={13} cor={FOLHA} balanco={curva(p, [0, -1.6, -2.4, -1, 0])} />
      <Capim x={l * 0.83} y={a * 0.97} alto={11} cor={FOLHA_CLARA} balanco={curva(p, [0, 1.4, 2.2, 0.9, 0])} />
    </>
  );
}

/* ---------- Luto: a terra onde a folha caiu ---------- */

/**
 * A folha caída fica, e ao lado dela um broto novo.
 *
 * ## A metáfora, herdada e intacta — e é a mais delicada das treze
 *
 * A cena já foi só a perda: o galho vazio e a folha no chão. O cartão passou a
 * dizer "Seguir com a saudade", e seguir é a segunda metade que faltava
 * desenhar — a mesma que a prática "O que ficou de herança" trabalha.
 *
 * O broto é pequeno de propósito, e **não substitui a folha**: ele nasce do
 * lado, na mesma terra. Se tomasse o lugar dela, a cena diria que a perda virou
 * outra coisa — que é a frase que ninguém enlutado suporta ouvir.
 *
 * O galho continua vazio. Ele não rebrota no canto da tela: o que voltou a
 * crescer veio da terra, e não do lugar de onde a folha saiu.
 *
 * ## O enquadramento e o movimento
 *
 * É a cena mais perto das treze: a folha ocupa um quinto da largura do cartão,
 * e o horizonte está lá em cima só para dizer que existe um lugar em volta.
 * Perto é o enquadramento de quem está agachado olhando uma coisa pequena, que
 * é o que esta prática pede.
 *
 * O movimento é o mais contido de todos, e tem de ser: a folha se ajeita — gira
 * pouco e assenta — e o broto sobe um fio e para. Luto não pede animação
 * animada.
 */
function Luto({ l, a, p, id }: CenarioProps) {
  const h = horizonteDaCena(a);
  const chao = a * 0.84;
  const folhaX = l * 0.58;
  const folhaY = a * 0.89;
  const brotoX = l * 0.26;
  const brotoY = a * 0.9;

  return (
    <>
      <Defs>
        <LinearGradient id={`terraL-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA_CLARA} />
          <Stop offset="0.4" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_FUNDA} />
        </LinearGradient>
        <RadialGradient id={`mataL-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={FOLHA} stopOpacity={0.5} />
          <Stop offset="0.58" stopColor={FOLHA} stopOpacity={0.42} />
          <Stop offset="1" stopColor={FOLHA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Ellipse cx={l * 0.3} cy={h} rx={l * 0.42} ry={a * 0.05} fill={`url(#mataL-${id})`} />
      <Ellipse cx={l * 0.88} cy={h + 2} rx={l * 0.28} ry={a * 0.042} fill={`url(#mataL-${id})`} />

      <Path
        d={`M0 ${h + 3} C${l * 0.3} ${h - 2} ${l * 0.7} ${h - 2} ${l} ${h + 3} L${l} ${chao} C${l * 0.7} ${chao - 4} ${l * 0.3} ${chao - 4} 0 ${chao} Z`}
        fill={FOLHA_CLARA}
        opacity={0.5}
      />
      <Path
        d={`M0 ${chao - 1} C${l * 0.3} ${chao - 5} ${l * 0.7} ${chao - 5} ${l} ${chao - 1} L${l} ${a + 20} L0 ${a + 20} Z`}
        fill={`url(#terraL-${id})`}
      />

      {/* Torrõezinhos na terra, para ela não ser uma faixa chapada. */}
      {[
        { x: 0.12, y: 0.94, r: 2 },
        { x: 0.42, y: 0.97, r: 1.5 },
        { x: 0.78, y: 0.95, r: 1.8 },
        { x: 0.92, y: 0.89, r: 1.3 },
      ].map((t, i) => (
        <Ellipse key={i} cx={l * t.x} cy={a * t.y} rx={t.r} ry={t.r * 0.72} fill={TERRA_CLARA} opacity={0.45} />
      ))}

      {/*
        O galho vazio, entrando pela esquerda.

        Dois galhinhos saindo dele é o que o faz ler como galho, e não como um
        cabo. Nenhum tem folha — é esse o assunto. Ele entra pela lateral e não
        pelo alto porque o alto do cartão é do título.
      */}
      <Path
        d={`M0 ${h - 16} C${l * 0.14} ${h - 13} ${l * 0.26} ${h - 8} ${l * 0.36} ${h - 1}`}
        stroke={HASTE}
        strokeWidth={3.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.95}
      />
      <Path
        d={`M${l * 0.13} ${h - 13.4} C${l * 0.15} ${h - 18.6} ${l * 0.19} ${h - 21.4} ${l * 0.24} ${h - 23}`}
        stroke={HASTE}
        strokeWidth={2.1}
        strokeLinecap="round"
        fill="none"
        opacity={0.9}
      />
      <Path
        d={`M${l * 0.24} ${h - 8.6} C${l * 0.27} ${h - 13} ${l * 0.31} ${h - 15.2} ${l * 0.37} ${h - 16.4}`}
        stroke={HASTE}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />

      {/*
        A folha caída se ajeita: gira pouco e assenta. É o movimento mais
        contido dos treze.
      */}
      <G
        transform={[
          `translate(0 ${curva(p, [0, 0.4, 0.9, 1.1, 1.2])})`,
          gira(curva(p, [0, -3, -4.5, -3, 0]), folhaX, folhaY),
        ].join(' ')}
      >
        {/*
          A folha e a nervura dela andam no **mesmo** sistema de coordenadas.

          Desenhada por fora, a nervura vira um risco solto ao lado da folha —
          e um risco saindo de uma forma redonda faz ela ler como pedra com um
          graveto encostado, não como folha. Dentro do grupo transformado, ela é
          a linha que percorre a folha de ponta a ponta, que é o que dá a ela o
          desenho de folha.
        */}
        <G transform={`translate(${folhaX + 14} ${folhaY - 4}) rotate(163) scale(0.72)`}>
          <Path d={FOLHA_DO_BROTO} fill={FOLHA} stroke={CONTORNO_FOLHA} strokeWidth={3.2} />
          <Path
            d="M-3 -1 C-12 -6 -24 -10 -33 -9"
            stroke={CONTORNO_FOLHA}
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
            opacity={0.55}
          />
        </G>
      </G>

      {/* O broto novo sobe um fio, devagar, e para. */}
      <G transform={cresce(curva(p, [1, 1.05, 1.1, 1.14, 1.16]), brotoX, brotoY)}>
        <Path
          d={`M${brotoX} ${brotoY} L${brotoX} ${brotoY - 26}`}
          stroke={HASTE}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <Path
          d={FOLHA_DO_BROTO}
          fill={FOLHA_CLARA}
          stroke={CONTORNO_FOLHA}
          strokeWidth={2}
          transform={`translate(${brotoX} ${brotoY - 26}) rotate(-54) scale(0.48)`}
        />
        <Path
          d={FOLHA_DO_BROTO}
          fill={FOLHA}
          stroke={CONTORNO_FOLHA}
          strokeWidth={2}
          transform={`translate(${brotoX} ${brotoY - 26}) rotate(234) scale(0.41)`}
        />
      </G>
    </>
  );
}

/* ---------- Solidão: dois vasos no mesmo chão ---------- */

/**
 * Dois vasos com broto, inclinados um para o outro. Sem encostar.
 *
 * ## A metáfora, herdada e intacta
 *
 * O segundo vaso já foi um contorno tracejado e vazio, e o broto do primeiro se
 * inclinava **sem alcançar** — a falta, desenhada. Estava certo quando o cartão
 * dizia "Solidão".
 *
 * Ele diz "Diminuir a solidão", e diminuir é o que a cena faz: o vaso de lá tem
 * alguém, e os dois se inclinam um para o outro.
 *
 * **Sem encostar, e em vasos separados.** O intro do tema define solidão como
 * "a distância entre o que você sente e o que os outros sabem", e o que as
 * práticas fazem é encurtar essa distância, não apagá-la. Duas plantas no mesmo
 * vaso seria outra promessa — e seria mentira.
 *
 * ## O enquadramento
 *
 * Meia distância: perto o bastante para os dois vasos serem objetos com barro,
 * luz e terra na boca, e longe o bastante para o vão entre eles aparecer. O vão
 * é o assunto, então ele precisa de espaço para existir.
 */
function Solidao({ l, a, p, id }: CenarioProps) {
  const h = horizonteDaCena(a);
  const chao = a * 0.86;
  const peDoVaso = a * 0.95;
  const vasoA = l * 0.28;
  const vasoB = l * 0.72;
  const larguraDoVaso = l * 0.1;
  const altoDoVaso = a * 0.17;

  /** Cada vaso inclina para o lado do outro, e nenhum dos dois chega lá. */
  const inclina = curva(p, [0, 2.5, 4.5, 6, 6.5]);

  const vaso = (cx: number, lado: 1 | -1, graus: number, chave: string) => (
    <G key={chave} transform={gira(graus * lado, cx, peDoVaso)}>
      <Path
        d={`M${cx - larguraDoVaso} ${peDoVaso - altoDoVaso} L${cx + larguraDoVaso} ${peDoVaso - altoDoVaso} L${cx + larguraDoVaso * 0.78} ${peDoVaso} C${cx + larguraDoVaso * 0.78} ${peDoVaso + 1.6} ${cx + larguraDoVaso * 0.4} ${peDoVaso + 2.2} ${cx} ${peDoVaso + 2.2} C${cx - larguraDoVaso * 0.4} ${peDoVaso + 2.2} ${cx - larguraDoVaso * 0.78} ${peDoVaso + 1.6} ${cx - larguraDoVaso * 0.78} ${peDoVaso} Z`}
        fill={VASO}
        stroke={CONTORNO}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {/* A terra na boca do vaso, e a listra de luz no barro. */}
      <Ellipse cx={cx} cy={peDoVaso - altoDoVaso + 0.6} rx={larguraDoVaso * 0.92} ry={2} fill={TERRA_SOMBRA} opacity={0.85} />
      <Path
        d={`M${cx - larguraDoVaso * 0.55} ${peDoVaso - altoDoVaso + 4} L${cx - larguraDoVaso * 0.62} ${peDoVaso - 2}`}
        stroke={VASO_LUZ}
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.8}
      />
      {/* O broto, inclinado para o lado do outro vaso. */}
      <G transform={gira(graus * lado * 1.6, cx, peDoVaso - altoDoVaso)}>
        <Path
          d={`M${cx} ${peDoVaso - altoDoVaso} L${cx} ${peDoVaso - altoDoVaso - 17}`}
          stroke={HASTE}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <Path
          d={FOLHA_DO_BROTO}
          fill={FOLHA_CLARA}
          stroke={CONTORNO_FOLHA}
          strokeWidth={2.2}
          transform={`translate(${cx} ${peDoVaso - altoDoVaso - 17}) rotate(${lado > 0 ? -50 : 230}) scale(${lado > 0 ? 0.3 : -0.3} 0.3)`}
        />
        <Path
          d={FOLHA_DO_BROTO}
          fill={FOLHA}
          stroke={CONTORNO_FOLHA}
          strokeWidth={2.2}
          transform={`translate(${cx} ${peDoVaso - altoDoVaso - 17}) rotate(${lado > 0 ? 230 : -50}) scale(${lado > 0 ? 0.25 : -0.25} 0.25)`}
        />
      </G>
    </G>
  );

  return (
    <>
      <Defs>
        <LinearGradient id={`terraS-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_FUNDA} />
        </LinearGradient>
        <RadialGradient id={`mataS-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={FOLHA} stopOpacity={0.5} />
          <Stop offset="0.58" stopColor={FOLHA} stopOpacity={0.42} />
          <Stop offset="1" stopColor={FOLHA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Ellipse cx={l * 0.2} cy={h} rx={l * 0.4} ry={a * 0.05} fill={`url(#mataS-${id})`} />
      <Ellipse cx={l * 0.8} cy={h + 2} rx={l * 0.34} ry={a * 0.044} fill={`url(#mataS-${id})`} />

      <Path
        d={`M0 ${h + 3} C${l * 0.3} ${h - 2} ${l * 0.7} ${h - 2} ${l} ${h + 3} L${l} ${chao} C${l * 0.7} ${chao - 4} ${l * 0.3} ${chao - 4} 0 ${chao} Z`}
        fill={FOLHA_CLARA}
        opacity={0.5}
      />
      <Path
        d={`M0 ${chao - 1} C${l * 0.3} ${chao - 5} ${l * 0.7} ${chao - 5} ${l} ${chao - 1} L${l} ${a + 20} L0 ${a + 20} Z`}
        fill={`url(#terraS-${id})`}
      />

      {/*
        As duas sombras no chão, separadas.

        Elas são o que mais depressa diz que os vasos estão no mesmo lugar, e
        não colados num fundo — e o vão entre as duas é o mesmo vão que a cena
        inteira é sobre.
      */}
      <Ellipse cx={vasoA} cy={peDoVaso + 3} rx={larguraDoVaso * 1.25} ry={2.6} fill={TERRA_FUNDA} opacity={0.4} />
      <Ellipse cx={vasoB} cy={peDoVaso + 3} rx={larguraDoVaso * 1.25} ry={2.6} fill={TERRA_FUNDA} opacity={0.4} />

      {vaso(vasoA, 1, inclina, 'a')}
      {vaso(vasoB, -1, inclina, 'b')}

      <Capim x={l * 0.07} y={a * 0.97} alto={11} cor={FOLHA} balanco={curva(p, [0, -1.4, -2, -0.9, 0])} />
      <Capim x={l * 0.93} y={a * 0.95} alto={9} cor={FOLHA_CLARA} balanco={curva(p, [0, 1.2, 1.8, 0.8, 0])} />
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

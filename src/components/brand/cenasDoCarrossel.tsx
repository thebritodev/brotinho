import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, {
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
import { DesenhoDoTema } from './desenhosDosTemas';
import { curva, desloca, estica, gira } from './movimentoDaCena';
import { BRASA, TERRA, TERRA_CLARA, TERRA_FUNDA, TERRA_SOMBRA } from './terraDoCanteiro';

/**
 * As cenas grandes dos cartões do carrossel: uma por ferramenta, cobrindo o
 * cartão inteiro.
 *
 * ## Por que elas são compostas do zero, e não são ícones ampliados
 *
 * Antes destas havia desenhinhos quadrados de 60 pontos, compostos para serem
 * lidos do tamanho de um ícone: objeto no meio, sombra embaixo, nada em volta.
 * Esticados para 350 × 300 eles não viram ilustração — viram um ícone grande no
 * meio de um vazio grande, que é exatamente o problema que o cartão novo existe
 * para resolver. Saíram do projeto junto com o cartão pequeno que os usava.
 *
 * Estas são compostas na proporção do cartão: o assunto ocupa a metade de cima,
 * o chão atravessa a largura toda, e há coisa nas beiradas — folhas, torrões,
 * um lápis — para a cena continuar depois da borda em vez de acabar nela.
 *
 * ## O véu, e por que ele mora aqui
 *
 * O título e o botão ficam **em cima** da cena. Sem nada entre os dois, texto
 * escuro sobre folha clara é ilegível em metade das linhas. O véu é um degradê
 * que vai do transparente até a cor de fundo do cartão, cobrindo a parte de
 * baixo — a parte que o texto ocupa.
 *
 * Ele é SVG, e não uma camada com gradiente de `View`, porque gradiente em
 * `View` pediria uma dependência nova (`expo-linear-gradient`) só para isto. E
 * é uma peça separada da cena, com `preserveAspectRatio="none"`, porque a cena
 * usa `slice` para preencher o cartão sem distorcer — e com `slice` a borda de
 * baixo do desenho pode ser cortada, o que levaria o véu junto.
 *
 * ## Os ids
 *
 * `url(#id)` não tem escopo por componente: dois cartões na mesma tela
 * disputariam o mesmo nome de gradiente e um deles apareceria sem preenchimento.
 * Por isso cada instância gera o seu com `useId`.
 */

/** A proporção em que as cenas são compostas. O cartão corta o excedente. */
const LARGURA = 300;
const ALTURA = 290;

/** Quanto da altura do cartão o véu cobre. É onde o texto mora. */
const VEU = '62%';

/**
 * O degradê que vai do nada até a cor do cartão.
 *
 * `preserveAspectRatio="none"` é de propósito: o desenho é um gradiente
 * puramente vertical, então esticar na horizontal não deforma nada, e é o que
 * garante que ele cubra a largura inteira em qualquer aparelho.
 */
function Veu({ fundo }: { fundo: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: VEU }}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`veu-${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={fundo} stopOpacity={0} />
            <Stop offset="0.26" stopColor={fundo} stopOpacity={0.86} />
            <Stop offset="0.42" stopColor={fundo} stopOpacity={1} />
            <Stop offset="0.68" stopColor={fundo} stopOpacity={1} />
            <Stop offset="1" stopColor={fundo} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={1} height={1} fill={`url(#veu-${id})`} />
      </Svg>
    </View>
  );
}

/** O casco de toda cena: preenche o cartão, corta o que sobra, põe o véu. */
function Cena({ fundo, children }: { fundo: string; children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        preserveAspectRatio="xMidYMid slice"
      >
        {children}
      </Svg>
      <Veu fundo={fundo} />
    </View>
  );
}

/**
 * Um raminho entrando pela borda: haste mais duas folhas na ponta.
 *
 * As folhas já estiveram soltas nos cantos, e soltas elas liam como manchas
 * verdes largadas na ilustração — o olho procura de onde a folha vem, não acha,
 * e aquilo vira sujeira. Com dois centímetros de haste saindo da borda, a mesma
 * folha passa a ser uma planta que continua fora do cartão.
 */
function Ramo({
  d,
  x,
  y,
  giro,
  escala,
}: {
  /** A haste, em coordenadas da cena, começando fora da borda. */
  d: string;
  /** A ponta da haste, onde as folhas nascem. */
  x: number;
  y: number;
  giro: number;
  escala: number;
}) {
  return (
    <G>
      <Path
        d={d}
        stroke={tracos.haste}
        strokeWidth={3.4}
        strokeLinecap="round"
        fill="none"
      />
      <Folha x={x} y={y} giro={giro} escala={escala} />
      <Folha x={x} y={y + 6} giro={giro + 284} escala={escala * 0.8} clara />
    </G>
  );
}

/** Uma folha do broto, no traço do mascote, para pousar nas beiradas. */
function Folha({
  x,
  y,
  giro,
  escala,
  clara = false,
}: {
  x: number;
  y: number;
  giro: number;
  escala: number;
  clara?: boolean;
}) {
  return (
    <Path
      d="M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z"
      fill={clara ? tracos.folhaClara : tracos.folha}
      stroke={tracos.contornoFolha}
      strokeWidth={2.6}
      transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`}
    />
  );
}

/**
 * Prática de hoje — a cena do tema dela, grande, com o véu por baixo.
 *
 * Esta não desenha nada próprio: reaproveita a cena do tema
 * (`desenhosDosTemas`) no tamanho de cartão. É de propósito — a pessoa vê a
 * mesma cena de "Insônia" no cartão grande, na grade de treze e na fileira de
 * recentes, e é essa repetição que faz a lua virar o sinal de um lugar em vez
 * de mais um desenho.
 *
 * Por isso ela também não usa o casco `Cena`: aquele monta um `Svg` próprio, e
 * o desenho do tema já vem com o dele. SVG dentro de SVG não é caminho no
 * `react-native-svg`. O que se aproveita aqui é só o véu, que é uma peça à
 * parte justamente para poder ser usada solta assim.
 */
export function CenaDaPratica({
  fundo,
  tema,
  altura,
}: {
  fundo: string;
  tema: string;
  /** A altura do cartão; a cena ocupa a parte de cima dela. */
  altura: number;
}) {
  return (
    <View style={{ flex: 1 }} pointerEvents="none">
      {/*
        A cena é maior que a janela, e a janela corta.

        Desenhada inteira e centralizada, ela ficava perdida: as cenas do tema
        põem o objeto entre 12 e 48 de uma caixa de 60, então um terço da altura
        é folga — e, num cartão de 330, um terço de folga é o objeto flutuando
        no meio de cem pontos de nada. Grande e cortada nas beiradas, ela ocupa
        a faixa de cima do cartão como as outras três cenas ocupam.
      */}
      <View
        style={{
          height: altura * 0.6,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <DesenhoDoTema tema={tema} size={altura * 0.92} />
      </View>
      <Veu fundo={fundo} />
    </View>
  );
}

/**
 * Diário — um caderno aberto sobre a mesa, com um lápis pousado ao lado.
 *
 * Caderno, e não tela: a promessa do diário é que aquilo não sai do aparelho, e
 * papel é o objeto que diz isso sem escrever. O caderno está **aberto** e não
 * fechado porque a ação é escrever agora, não guardar.
 */
/**
 * A cena do Diário.
 *
 * ## O que ela faz ao ser tocada
 *
 * O lápis sai da mesa e sobe até a página, endireitando; e a última pauta da
 * esquerda — a curta, que é onde a escrita parou — cresce.
 *
 * As duas coisas contam a mesma frase, que é a frase do cartão: *a página está
 * começada, e agora você continua*. Nenhuma das duas termina o serviço: o lápis
 * não chega a encostar e a linha não alcança o comprimento das outras, porque
 * quem escreve é a pessoa, do outro lado do toque.
 */
export function CenaDoDiario({ fundo, passo = 0 }: { fundo: string; passo?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const p = passo;

  return (
    <Cena fundo={fundo}>
      <Defs>
        <LinearGradient id={`papel-${id}`} x1="0" y1="0" x2="0.25" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.6" stopColor={palette.cream100} />
          <Stop offset="1" stopColor={palette.cream300} />
        </LinearGradient>
        <RadialGradient id={`chao-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={TERRA_SOMBRA} stopOpacity={0.2} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* A sombra do caderno na mesa: sem ela o objeto flutua. */}
      <Ellipse cx={150} cy={140} rx={104} ry={17} fill={`url(#chao-${id})`} />

      <G transform="translate(150 80)">
        {/*
          A folha de trás, espiando — e sem contorno.

          Com traço ela virava um segundo retângulo inteiro atravessando o
          cartão, que lia como erro de desenho e não como caderno. Preenchida e
          sem linha, ela faz o que devia fazer desde o começo: dar espessura à
          pilha e sumir.
        */}
        <Rect
          x={-84}
          y={-54}
          width={168}
          height={106}
          rx={7}
          fill={palette.cream300}
          opacity={0.75}
          transform="rotate(3)"
        />

        <G transform="rotate(-2)">
          {/* As duas páginas abertas, com o vinco no meio. */}
          <Path
            d="M-82 -50 C-82 -53.3 -79.3 -56 -76 -56 L76 -56 C79.3 -56 82 -53.3 82 -50 L82 34 L68 48 L-76 48 C-79.3 48 -82 45.3 -82 42 Z"
            fill={`url(#papel-${id})`}
            stroke={tracos.contorno}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          {/* O canto virado, a mesma aresta dobrada para dentro. */}
          <Path
            d="M82 34 L68 34 L68 48 Z"
            fill={palette.cream300}
            stroke={tracos.contorno}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* O vinco central. */}
          <Path d="M0 -54 L0 46" stroke={palette.brown200} strokeWidth={2.2} strokeLinecap="round" />

          {/*
            As pautas. A última da esquerda é curta: é onde a escrita parou, e
            é o convite — a página está começada, não em branco.
          */}
          {[
            [-32, -16],
            [-14, -16],
            [4, -16],
            [22, -44],
          ].map(([y, fim], i) => {
            /*
              Só a última cresce, e só ao longo do próprio eixo.

              Por isso `estica` e não `cresce`: uma pauta que engordasse junto
              com o comprimento viraria um borrão, não uma frase sendo escrita.
              A origem é a margem esquerda, que é de onde se escreve.
            */
            const escrevendo = i === 3;
            return (
              <G
                key={`e${y}`}
                transform={escrevendo ? estica(curva(p, [1, 1.3, 1.6, 1.8, 1.9]), 1, -68, y) : undefined}
              >
                <Path
                  d={`M-68 ${y} L${fim} ${y}`}
                  stroke={palette.brown200}
                  strokeWidth={2.8}
                  strokeLinecap="round"
                />
              </G>
            );
          })}
          {[-32, -14, 4, 22].map((y) => (
            <Path
              key={`d${y}`}
              d={`M16 ${y} L68 ${y}`}
              stroke={palette.cream300}
              strokeWidth={2.8}
              strokeLinecap="round"
            />
          ))}
        </G>
      </G>

      {/*
        O lápis, pousado na mesa ao lado do caderno — e, no toque, subindo até
        a página e endireitando, como quem o pega para escrever.

        O deslocamento vem antes do giro na lista de transformações porque a
        ordem importa em SVG: girar primeiro giraria também o caminho que ele
        ainda vai percorrer, e o lápis subiria de lado.
      */}
      <G
        transform={[
          desloca(204 + curva(p, [0, -5, -11, -15, -17]), 132 + curva(p, [0, -6, -13, -17, -19])),
          gira(curva(p, [18, 15, 11, 8, 7]), 0, 0),
        ].join(' ')}
      >
        <Rect
          x={-38}
          y={-4.4}
          width={64}
          height={8.8}
          rx={2.6}
          fill={tracos.vaso}
          stroke={tracos.contorno}
          strokeWidth={2}
        />
        <Path
          d="M26 -4.4 L38 0 L26 4.4 Z"
          fill={palette.cream200}
          stroke={tracos.contorno}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Path d="M34.6 -1.4 L38 0 L34.6 1.4 Z" fill={tracos.contorno} />
      </G>

      {/* Um raminho entrando pelo canto: a cena continua depois da borda. */}
      <Ramo d="M306 8 C288 12 274 22 264 38" x={264} y={38} giro={-58} escala={0.52} />
    </Cena>
  );
}

/**
 * Composta — o pensamento dito em voz alta caindo na terra, e o broto saindo
 * do outro lado.
 *
 * É literalmente o que a ferramenta faz, e é a única das três cenas que conta
 * uma história em vez de mostrar um objeto: balão entrando de um lado, broto
 * saindo do outro.
 */
export function CenaDaComposta({ fundo }: { fundo: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <Cena fundo={fundo}>
      <Defs>
        <LinearGradient id={`terra-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA_CLARA} />
          <Stop offset="0.5" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} />
        </LinearGradient>
        <RadialGradient id={`brasa-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={BRASA} stopOpacity={0.5} />
          <Stop offset="1" stopColor={BRASA} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`chao-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={TERRA_SOMBRA} stopOpacity={0.24} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/*
        O balão grande, inclinado, entrando na terra pelo canto de cima. As duas
        linhas dizem "palavras" sem dizer quais — o que a pessoa escreve nunca
        vira desenho.
      */}
      <G transform="translate(98 56) rotate(-11)">
        <Path
          d="M-60 -32 C-60 -37.5 -55.5 -42 -50 -42 L50 -42 C55.5 -42 60 -37.5 60 -32 L60 10 C60 15.5 55.5 20 50 20 L-18 20 L-36 37 L-32 20 L-50 20 C-55.5 20 -60 15.5 -60 10 Z"
          fill={palette.cream100}
          stroke={tracos.contorno}
          strokeWidth={2.8}
          strokeLinejoin="round"
        />
        <Path d="M-42 -21 L42 -21" stroke={palette.brown200} strokeWidth={4.2} strokeLinecap="round" />
        <Path d="M-42 -3 L18 -3" stroke={palette.brown200} strokeWidth={4.2} strokeLinecap="round" />
      </G>

      {/* O calor de dentro do monte, e a sombra dele no chão. */}
      <Ellipse cx={150} cy={136} rx={80} ry={38} fill={`url(#brasa-${id})`} />
      <Ellipse cx={150} cy={168} rx={130} ry={20} fill={`url(#chao-${id})`} />

      {/*
        O monte de terra — e ele desce até o fim da cena, em vez de acabar numa
        linha no meio do cartão. Assim a terra vira o chão do cartão inteiro; o
        véu apaga o excesso na parte de baixo, onde mora o texto.
      */}
      <Path
        d="M-6 290 L-6 158 C-6 130 56 108 150 108 C244 108 306 130 306 158 L306 290 Z"
        fill={`url(#terra-${id})`}
      />
      <Path
        d="M20 144 Q150 106 280 144"
        stroke={TERRA_CLARA}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      {[
        { x: 46, y: 152, r: 4 },
        { x: 92, y: 166, r: 3.2 },
        { x: 196, y: 158, r: 3.6 },
        { x: 252, y: 148, r: 4.2 },
        { x: 274, y: 166, r: 2.8 },
      ].map((g) => (
        <Ellipse
          key={`${g.x}:${g.y}`}
          cx={g.x}
          cy={g.y}
          rx={g.r}
          ry={g.r * 0.8}
          fill={TERRA_FUNDA}
          opacity={0.5}
        />
      ))}

      {/*
        O broto que sai do adubo — o fim da história.

        A haste começa **dentro** do monte, e não na crista: nascendo na
        superfície, o broto ficava pousado ali como um objeto largado.
      */}
      <G transform="translate(232 136)">
        <Path
          d="M0 0 L0 -44"
          stroke={tracos.haste}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
        <Folha x={0} y={-44} giro={-52} escala={0.76} />
        <Folha x={0} y={-38} giro={232} escala={0.62} clara />
      </G>
    </Cena>
  );
}

/**
 * Frase do dia — o canteiro fechado, com um calor escapando de baixo da
 * saliência.
 *
 * A frase está enterrada e não aparece: a saliência e o brilho são a única
 * pista de que tem alguma coisa ali, e é isso que faz "desenterrar" ser um
 * gesto e não um botão de carregar texto.
 */
export function CenaDaFrase({ fundo }: { fundo: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <Cena fundo={fundo}>
      <Defs>
        <LinearGradient id={`terra-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA_CLARA} />
          <Stop offset="0.5" stopColor={TERRA} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} />
        </LinearGradient>
        <RadialGradient id={`brasa-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={BRASA} stopOpacity={0.55} />
          <Stop offset="1" stopColor={BRASA} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`chao-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={TERRA_SOMBRA} stopOpacity={0.22} />
          <Stop offset="1" stopColor={TERRA_SOMBRA} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Ordem: brilho por trás, sombra no chão, terra, luz na crista, grãos. */}
      <Ellipse cx={150} cy={98} rx={84} ry={54} fill={`url(#brasa-${id})`} />
      <Ellipse cx={150} cy={166} rx={142} ry={22} fill={`url(#chao-${id})`} />
      {/* O canteiro desce até o fim da cena pelo mesmo motivo da Composta: ele
          é o chão do cartão, e o véu apaga o que sobra embaixo do texto. */}
      <Path
        d="M-6 290 L-6 126 C-6 100 60 84 150 84 C240 84 306 100 306 126 L306 290 Z"
        fill={`url(#terra-${id})`}
      />

      {/* A saliência: o volume do que está enterrado ali embaixo. */}
      <Path
        d="M108 112 Q150 84 192 112"
        stroke={TERRA_FUNDA}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M26 116 Q150 78 274 116"
        stroke={TERRA_CLARA}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      {[
        { x: 52, y: 132, r: 4 },
        { x: 88, y: 148, r: 3 },
        { x: 150, y: 154, r: 3.6 },
        { x: 214, y: 142, r: 4.2 },
        { x: 252, y: 128, r: 3 },
      ].map((g) => (
        <Ellipse
          key={`${g.x}:${g.y}`}
          cx={g.x}
          cy={g.y}
          rx={g.r}
          ry={g.r * 0.8}
          fill={TERRA_FUNDA}
          opacity={0.5}
        />
      ))}

      {/* A quina de papel espiando da terra: o bastante para dar vontade de puxar. */}
      <G transform="translate(150 96) rotate(-8)">
        <Path
          d="M-20 14 L-14 -8 L18 -2 L14 16 Z"
          fill={palette.cream100}
          stroke={tracos.contorno}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
        <Path d="M-11 1 L12 5" stroke={palette.brown200} strokeWidth={2.6} strokeLinecap="round" />
      </G>

      <Ramo d="M-6 16 C14 20 28 30 38 46" x={38} y={46} giro={-128} escala={0.5} />
      <Ramo d="M306 22 C288 26 274 36 266 50" x={266} y={50} giro={-54} escala={0.46} />
    </Cena>
  );
}

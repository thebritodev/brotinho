import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { lacoDeIdaEVolta, lacoQueSoVai } from '../laco';
import { useTema } from '../../theme';
import { palette, tracos } from '../../theme/tokens';
import { quadroDoBroto } from './geometriaDoBroto';
import { Sprout, type Pose, type SproutStage } from './Sprout';

/**
 * As cenas dos treze temas de prática: **o broto no vaso, e o objeto do tema**.
 *
 * ## O que isto substitui, e por quê
 *
 * `artesDosTemas` — um objeto grande, sozinho, no meio de um cartão de 176 por
 * 140. Aquilo foi escrito para uma fileira que anda, onde o cartão é pequeno e
 * precisa se reconhecer de relance; e, para aquele cartão, estava certo.
 *
 * O redesenho troca a fileira por uma **grade de cartões quadrados**, e o
 * tamanho muda a pergunta. Num cartão quadrado, um objeto sozinho boiando no
 * meio não se lê melhor — se lê como ícone ampliado, que é o erro que as cenas
 * grandes do carrossel já tinham cometido antes. Com o dobro de área dá para
 * ter **cena**: chão, luz, o objeto, e o broto ali dentro.
 *
 * E o broto ali dentro é o ponto. Quem guia as quarenta e uma práticas é ele;
 * uma grade de dez objetos sem ninguém dentro é um catálogo. Com ele plantado
 * em cada uma, a grade passa a dizer *"ele faz isto com você"* treze vezes.
 *
 * ## Por que o movimento é contínuo aqui, e no cartão da fileira não era
 *
 * A regra escrita em `artesDosTemas` era: nada se mexe sozinho, porque treze
 * laços rodando ao mesmo tempo fazem a lista engasgar ao rolar. A regra estava
 * certa e o motivo estava incompleto.
 *
 * O que engasga é laço que **passa pelo JavaScript**. Animar atributo de SVG
 * pede um render por quadro, porque o `react-native-web` não implementa
 * `setNativeProps` em nó de SVG — é a mesma limitação que obriga as cenas do
 * carrossel a converter `Animated.Value` em `useState`.
 *
 * Aqui nada disso acontece: o que se mexe é sempre uma `View` em volta de um
 * SVG parado, movida por `transform` ou `opacity` com `useNativeDriver`. Treze
 * dessas rodam na thread da interface, sem tocar no JavaScript, e a rolagem
 * continua lisa. Por isso o documento pôde pedir cata-vento girando, chuva
 * caindo e estrela piscando — e por isso eles estão aqui.
 *
 * Quem pediu menos movimento recebe as cenas paradas, com os objetos no lugar
 * em que estariam no repouso.
 *
 * ## O enquadramento
 *
 * Tudo é desenhado numa caixa de 170 por 150 e encaixado no cartão como
 * `xMidYMax slice`: centrado na horizontal, **preso embaixo**, cobrindo e
 * cortando o que sobra. Preso embaixo porque o chão é a única linha que não
 * pode se mexer entre um cartão e outro — é ela que faz treze desenhos
 * diferentes parecerem o mesmo mundo.
 *
 * `naCena` repete essa conta em JavaScript, para as peças animadas — que são
 * `View`, e não SVG — caírem exatamente onde cairiam se estivessem dentro dele.
 */

/** A caixa do desenho, do documento. */
const L = 170;
const A = 150;

/** A linha do chão, dentro da caixa. */
const GY = 132;

/** Onde o broto fica em cada cena, e o tamanho dele na caixa de 170. */
const BROTO_NA_CAIXA = 100;

const CONTORNO = tracos.contorno;

/**
 * Onde um ponto da caixa cai dentro do cartão, em pixels.
 *
 * É `xMidYMax slice` refeito à mão: a escala é a maior das duas, o desenho é
 * centrado na horizontal e encostado embaixo. Mudar um sem mudar o outro faz
 * as peças animadas descolarem do desenho parado — e ninguém descobre isso por
 * teste, só olhando.
 */
function naCena(largura: number, altura: number) {
  const escala = Math.max(largura / L, altura / A);
  const dx = (largura - L * escala) / 2;
  const dy = altura - A * escala;
  return {
    escala,
    x: (v: number) => dx + v * escala,
    y: (v: number) => dy + v * escala,
  };
}

/**
 * A faixa que sobrevive ao corte.
 *
 * O cartão é quadrado menos a faixa branca do pé, então a área da cena é bem
 * mais larga que alta: num aparelho de 390, 168 por 114. Com `slice`, a escala
 * sai da largura e o desenho é encostado embaixo — o que corta é o **alto**, e
 * corta quase um quarto: tudo acima de `y ≈ 35` fica fora da tela.
 *
 * O documento convive com isso, e nas cenas dele o guarda-chuva e a luminária
 * aparecem pela metade. Aqui não: o objeto do tema é a única coisa que o
 * cartão **precisa** mostrar, e um guarda-chuva cortado na altura do cabo não
 * é um guarda-chuva. Nada essencial é desenhado acima desta linha.
 */
const TETO = 38;

/* ------------------------------------------------------------------ *
 *  Peças comuns a todas as cenas                                       *
 * ------------------------------------------------------------------ */

/**
 * Quanto o branco vale em cada tema.
 *
 * O clarão e o chão das cenas são branco translúcido — sobre um tom pastel
 * claro isso é luz; sobre o mesmo tom escurecido, é um disco cinza no meio do
 * cartão. O documento resolve o mesmo problema trocando `--bt-glow2` e
 * `--bt-hill` no tema escuro, e estes são os números de lá.
 */
function useVidro() {
  const { tema } = useTema();
  const claro = tema === 'claro';
  return {
    /** O clarão atrás do assunto. */
    brilho: claro ? 1 : 0.35,
    /** O chão da cena. */
    chao: claro ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.07)',
  };
}

/** O clarão branco atrás do assunto: a luz que todas as cenas têm. */
const Brilho = ({ cx, cy, r, op = 0.25, cor = '#FFFFFF', forca = 1 }: {
  cx: number; cy: number; r: number; op?: number; cor?: string; forca?: number;
}) => <Circle cx={cx} cy={cy} r={r} fill={cor} opacity={op * forca} />;

/** A sombra de chão, a mesma elipse rasa embaixo de tudo o que se apoia. */
const Sombra = ({ cx, rx, cy = GY + 2 }: { cx: number; rx: number; cy?: number }) => (
  <Ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.18} fill={CONTORNO} opacity={0.16} />
);

/** O chão: um morro branco translúcido atravessando a cena inteira. */
const Chao = ({ cor }: { cor: string }) => (
  <G>
    <Path
      d={`M -4 ${GY - 6} C 40 ${GY - 14} 120 ${GY - 12} 174 ${GY - 4} L 174 154 L -4 154 Z`}
      fill={cor}
    />
    <Path
      d={`M -4 ${GY - 6} C 40 ${GY - 14} 120 ${GY - 12} 174 ${GY - 4}`}
      fill="none"
      stroke={CONTORNO}
      strokeWidth={2.4}
      opacity={0.18}
    />
  </G>
);

/** Um tufo de grama: três riscos saindo do chão. */
const Tufo = ({ x, y = GY - 6 }: { x: number; y?: number }) => (
  <Path
    d={`M ${x} ${y} q -2 -8 -6 -12 M ${x} ${y} q 1 -9 1 -14 M ${x} ${y} q 3 -7 7 -10`}
    fill="none"
    stroke={palette.green700}
    strokeWidth={2}
    strokeLinecap="round"
  />
);

/** Uma florzinha de quatro pétalas, para as beiradas. */
const Flor = ({ x, y = GY - 2, cor }: { x: number; y?: number; cor: string }) => (
  <G transform={`translate(${x} ${y})`}>
    <Path d="M 0 0 L 0 -10" stroke={palette.green700} strokeWidth={2} strokeLinecap="round" />
    {[0, 90, 180, 270].map((a) => (
      <Circle
        key={a}
        cx={Math.cos((a * Math.PI) / 180) * 3.4}
        cy={-12 + Math.sin((a * Math.PI) / 180) * 3.4}
        r={3}
        fill={cor}
        stroke={CONTORNO}
        strokeWidth={1.4}
      />
    ))}
    <Circle cy={-12} r={2} fill={palette.yellow300} />
  </G>
);

/** Uma nuvem parada, do desenho do app. */
const Nuvem = ({ x, y, s, cor = palette.cream100 }: {
  x: number; y: number; s: number; cor?: string;
}) => (
  <G transform={`translate(${x} ${y}) scale(${s})`}>
    <Path
      d="M 0 20 C -2 10 8 4 16 8 C 20 -2 36 -4 42 6 C 52 4 58 12 54 20 Z"
      fill={cor}
    />
    <Path d="M 8 12 C 12 8 18 8 20 11 C 16 10 12 11 8 12 Z" fill="#FFFFFF" opacity={0.8} />
  </G>
);

/** O brilho de quatro pontas, o mesmo do broto e dos enfeites. */
const FAISCA = 'M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z';
const Faisca = ({ x, y, s, cor = palette.amber400 }: {
  x: number; y: number; s: number; cor?: string;
}) => <Path d={FAISCA} fill={cor} transform={`translate(${x} ${y}) scale(${s})`} />;

/* ------------------------------------------------------------------ *
 *  O laço nativo que move as peças                                     *
 * ------------------------------------------------------------------ */

/**
 * Um valor de 0 a 1 em laço, no driver nativo.
 *
 * `ida` manda ele voltar pelo mesmo caminho em vez de saltar do fim para o
 * começo — é a diferença entre uma coisa que balança e uma coisa que se
 * teletransporta. Giro e queda usam `ida` falso, porque neles o fim **é** o
 * começo; balanço e pulsação usam verdadeiro.
 */
function useLaco(ms: number, { parado, ida = true, atraso = 0 }: {
  parado: boolean; ida?: boolean; atraso?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const menosMovimento = useMenosMovimento();

  useEffect(() => {
    v.setValue(0);
    if (parado || menosMovimento) return;
    /*
      Os dois laços vêm de `components/laco`, e não de um `Animated.loop`
      escrito aqui. A regra tem guarda automática (`confere-lacos`) e um
      motivo que custou caro: `Animated.loop` de um `timing` sozinho **não
      roda no navegador**, e falha calado. Treze cenas paradas no único lugar
      em que dá para conferi-las seria o pior resultado possível deste
      arquivo. A explicação inteira está lá.
    */
    const anim = ida
      ? lacoDeIdaEVolta(v, { ms, easing: Easing.bezier(0.45, 0, 0.55, 1) })
      : lacoQueSoVai(v, { ms, easing: Easing.linear });
    const t = setTimeout(() => anim.start(), atraso);
    return () => {
      clearTimeout(t);
      anim.stop();
    };
  }, [v, ms, parado, menosMovimento, ida, atraso]);

  return v;
}

/** Uma peça animada da cena, posicionada pelo ponto dela na caixa de 170×150. */
function Peca({
  cena,
  x,
  y,
  largura,
  altura,
  style,
  children,
}: {
  cena: ReturnType<typeof naCena>;
  /** O canto superior esquerdo da peça, em coordenadas da caixa. */
  x: number;
  y: number;
  /** O tamanho dela, em coordenadas da caixa. */
  largura: number;
  altura: number;
  style?: Animated.AnimatedProps<{ transform?: unknown; opacity?: unknown }>;
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: cena.x(x),
          top: cena.y(y),
          width: largura * cena.escala,
          height: altura * cena.escala,
        },
        style as never,
      ]}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${largura} ${altura}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ *
 *  As cenas                                                            *
 * ------------------------------------------------------------------ */

type CenaProps = {
  largura: number;
  altura: number;
  estagio: SproutStage;
  parado: boolean;
};

/** Onde o broto se planta nesta cena, e com que cara. */
type Plantio = { x: number; pose: Pose; humor: 'leve' | 'feliz' | 'triste' | 'cansado' };

const PLANTIO: Record<string, Plantio> = {
  ansiedade: { x: 56, pose: 'calmo', humor: 'leve' },
  estresse: { x: 56, pose: 'calmo', humor: 'cansado' },
  tristeza: { x: 62, pose: 'calmo', humor: 'triste' },
  luto: { x: 56, pose: 'pensa', humor: 'leve' },
  solidao: { x: 56, pose: 'acena', humor: 'leve' },
  raiva: { x: 54, pose: 'espreguica', humor: 'leve' },
  procrastinacao: { x: 48, pose: 'espreguica', humor: 'leve' },
  foco: { x: 48, pose: 'pensa', humor: 'leve' },
  autoestima: { x: 52, pose: 'parado', humor: 'feliz' },
  culpa: { x: 50, pose: 'calmo', humor: 'leve' },
  comparacao: { x: 52, pose: 'pensa', humor: 'leve' },
  insonia: { x: 70, pose: 'dorme', humor: 'leve' },
  gratidao: { x: 52, pose: 'comemora', humor: 'feliz' },
};

/**
 * O broto plantado na cena.
 *
 * Fica fora do SVG porque ele **é** um SVG: `react-native-svg` não aninha um
 * `Svg` dentro de outro, e é a mesma razão pela qual a cena da prática do
 * cartão grande também monta o broto por fora. Ver `CenaDaPratica`.
 */
function BrotoNaCena({
  cena,
  plantio,
  estagio,
}: {
  cena: ReturnType<typeof naCena>;
  plantio: Plantio;
  estagio: SproutStage;
}) {
  /*
    O broto ocupa cem das cento e setenta unidades da caixa — é a medida do
    documento, onde ele é desenhado a metade da escala do mascote inteiro. Em
    pixels isso é a mesma conta do resto da cena.

    Quem diz o tamanho real é `quadroDoBroto`, e não este número: `size` é a
    largura que o desenho teria se a caixa dele fosse a de referência, e a do
    mascote é mais estreita. Sem perguntar a ele, o pé do broto cairia uns
    quinze pontos abaixo do chão, que foi exatamente o que aconteceu na
    primeira versão.
  */
  const size = BROTO_NA_CAIXA * cena.escala;
  const quadro = quadroDoBroto(estagio, size, { showPot: true });
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: cena.x(plantio.x) - quadro.largura / 2,
        top: cena.y(GY + 4) - quadro.altura,
        width: quadro.largura,
        height: quadro.altura,
      }}
    >
      <Sprout mood={plantio.humor} stage={estagio} size={size} pose={plantio.pose} />
    </View>
  );
}

/* ---------- Acalmar a ansiedade: anéis de respiração e cata-vento ---------- */

function Ansiedade({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const giro = useLaco(9000, { parado, ida: false });
  const volta = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const respira = useLaco(5200, { parado });
  const abre = respira.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.08] });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        <Nuvem x={110} y={40} s={0.7} />
        <Nuvem x={6} y={48} s={0.45} />
        <Path d="M 94 62 C 106 56 116 66 126 60" fill="none" stroke={CONTORNO} strokeWidth={2} opacity={0.45} strokeLinecap="round" />
        <Path d="M 98 74 C 108 70 114 76 122 72" fill="none" stroke={CONTORNO} strokeWidth={2} opacity={0.35} strokeLinecap="round" />
        <Chao cor={vidro.chao} />
        <Sombra cx={56} rx={30} />
        <Sombra cx={124} rx={12} />
        <Tufo x={18} />
        <Flor x={150} cor={palette.terracotta400} />
        <Path d={`M 124 ${GY} L 124 62`} fill="none" stroke={CONTORNO} strokeWidth={3} strokeLinecap="round" />
      </Svg>

      {/* Os anéis da respiração: três círculos que incham e esvaziam juntos. */}
      <Peca cena={cena} x={0} y={14} largura={112} altura={112} style={{ transform: [{ scale: abre }] }}>
        <Brilho cx={56} cy={56} r={52} op={0.22} forca={vidro.brilho} />
        <Brilho cx={56} cy={56} r={38} op={0.28} forca={vidro.brilho} />
        <Brilho cx={56} cy={56} r={24} op={0.3} forca={vidro.brilho} />
      </Peca>

      <BrotoNaCena cena={cena} plantio={PLANTIO.ansiedade} estagio={estagio} />

      {/* O cata-vento, girando devagar na ponta da haste. */}
      <Peca cena={cena} x={104} y={40} largura={40} altura={40} style={{ transform: [{ rotate: volta }] }}>
        <G transform="translate(20 20)">
          <Path d="M 0 0 C -4 -10 4 -20 14 -18 Z" fill={palette.terracotta400} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
          <Path d="M 0 0 C 10 -4 20 4 18 14 Z" fill={palette.amber400} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
          <Path d="M 0 0 C 4 10 -4 20 -14 18 Z" fill={palette.green300} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
          <Path d="M 0 0 C -10 4 -20 -4 -18 -14 Z" fill={palette.lavender300} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
          <Circle r={3.2} fill={palette.cream100} stroke={CONTORNO} strokeWidth={2.4} />
        </G>
      </Peca>
    </>
  );
}

/* ---------- Baixar o estresse: almofada e caneca fumegando ---------- */

function Estresse({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const vapor = useLaco(3600, { parado, ida: false });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        <Brilho cx={130} cy={46} r={34} op={0.2} forca={vidro.brilho} />
        <Brilho cx={130} cy={46} r={22} op={0.5} forca={vidro.brilho} />
        <Nuvem x={10} y={44} s={0.55} />
        <Chao cor={vidro.chao} />
        {/*
          A almofada saiu.

          Ela era um monte lilás atravessando metade da cena, e o vaso ficava
          plantado no meio dele — de longe não lia como almofada, lia como uma
          sombra grande e colorida atrás do broto. O tema já tem o seu objeto, e
          é a caneca fumegando: um objeto grande, no chão, do lado. Dois
          volumes competindo pelo mesmo cartão era o que tirava a leitura dos
          dois.
        */}
        <Sombra cx={56} rx={32} />
        <Sombra cx={132} rx={22} />
        <Path d="M 116 104 L 148 104 L 146 130 C 145 133 142 134 139 134 L 125 134 C 122 134 119 133 118 130 Z" fill={palette.cream100} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
        <Path d="M 148 110 C 158 110 158 124 146 123" fill="none" stroke={CONTORNO} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M 116 104 L 148 104" stroke={CONTORNO} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M 119 108 L 124 108 L 123 128" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        <Path d="M 120 112 L 144 112" stroke={palette.terracotta400} strokeWidth={4} strokeLinecap="round" />
        <Tufo x={160} y={GY - 2} />
      </Svg>

      <BrotoNaCena cena={cena} plantio={PLANTIO.estresse} estagio={estagio} />

      {/* Três fios de vapor subindo da caneca, um atrás do outro. */}
      {[124, 132, 140].map((x, i) => {
        const sobe = vapor.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10 * cena.escala],
        });
        const some = vapor.interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: [0, 0.5, 0.5, 0],
        });
        return (
          <Peca
            key={x}
            cena={cena}
            x={x - 8}
            y={72}
            largura={16}
            altura={28}
            style={{ transform: [{ translateY: sobe }], opacity: some }}
          >
            <Path
              d={`M 8 26 C 3 18 13 12 8 4`}
              fill="none"
              stroke={CONTORNO}
              strokeWidth={2}
              strokeLinecap="round"
              transform={`translate(${(i - 1) * 0.6} 0)`}
            />
          </Peca>
        );
      })}
    </>
  );
}

/* ---------- Atravessar a tristeza: chuva, guarda-chuva e poça ---------- */

function Tristeza({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const chuva = useLaco(2400, { parado, ida: false });
  const onda = useLaco(2400, { parado, ida: false });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        <Brilho cx={138} cy={48} r={16} op={0.7} cor={palette.amber400} />
        <Nuvem x={96} y={38} s={1} cor={palette.slate100} />
        <Nuvem x={6} y={44} s={0.7} cor={palette.slate100} />
        <Chao cor={vidro.chao} />
        <Ellipse cx={128} cy={GY + 4} rx={26} ry={5} fill={palette.blue300} opacity={0.8} />
        <Sombra cx={62} rx={30} />
        {/*
          O guarda-chuva é **plantado ao lado**, inclinado por cima do broto, e
          não centrado nele.

          Centrado, a copa encosta na cabeça e as duas pontas leem como asas —
          o broto vira um bichinho em vez de alguém abrigado. De lado, com o
          cabo descendo até o chão atrás dele, a cena volta a ser a que o tema
          pede: está chovendo, e tem onde ficar.
        */}
        <Path d={`M 88 ${GY - 2} L 88 54`} stroke={CONTORNO} strokeWidth={3} strokeLinecap="round" />
        <Path
          d="M 44 76 C 46 48 130 48 132 76 C 123 70 113 70 107 76 C 101 70 77 70 71 76 C 64 70 52 70 44 76 Z"
          fill={palette.terracotta400}
          stroke={CONTORNO}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
        <Path d="M 56 68 C 63 58 75 55 82 55 C 72 59 63 64 56 68 Z" fill="#FFFFFF" opacity={0.6} />
        <Circle cx={88} cy={53} r={2.5} fill={CONTORNO} />
      </Svg>

      <BrotoNaCena cena={cena} plantio={PLANTIO.tristeza} estagio={estagio} />

      {/* As gotas, caindo das duas nuvens em tempos diferentes. */}
      {[[146, 0], [158, 0.25], [134, 0.5], [122, 0.75], [24, 0.12], [38, 0.42], [16, 0.67]].map(
        ([x, atraso]) => {
          const cai = chuva.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 60 * cena.escala],
          });
          const some = chuva.interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, 0.9, 0.9, 0],
          });
          return (
            <Peca
              key={x}
              cena={cena}
              x={x - 4}
              y={34 + atraso * 10}
              largura={8}
              altura={10}
              style={{ transform: [{ translateY: cai }], opacity: some }}
            >
              <Path d="M 5 1 l -2 7" stroke={palette.blue300} strokeWidth={2.4} strokeLinecap="round" />
            </Peca>
          );
        },
      )}

      {/* A onda na poça: um anel que abre e some, sem parar. */}
      <Peca
        cena={cena}
        x={102}
        y={GY - 6}
        largura={52}
        altura={20}
        style={{
          transform: [{ scaleX: onda.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.6] }) }],
          opacity: onda.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        }}
      >
        <Ellipse cx={26} cy={10} rx={10} ry={2} fill="none" stroke="#FFFFFF" strokeWidth={1.6} />
      </Peca>
    </>
  );
}

/* ---------- Seguir com a saudade: varal de retratos e carta ---------- */

function Luto({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const balanco = useLaco(5000, { parado });

  const retrato = (i: number) =>
    balanco.interpolate({ inputRange: [0, 1], outputRange: [`${-2 + i}deg`, `${2 + i}deg`] });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        <Brilho cx={84} cy={62} r={60} op={0.25} forca={vidro.brilho} />
        <Path d="M -4 44 C 40 60 130 60 174 42" fill="none" stroke={CONTORNO} strokeWidth={1.8} />
        <Chao cor={vidro.chao} />
        <Sombra cx={56} rx={30} />
        <Sombra cx={130} rx={24} />
        {/* A carta com o selo, pousada ao lado. */}
        <G transform="translate(130 116) rotate(-8)">
          <Path d="M -22 -14 L 22 -14 L 22 14 L -22 14 Z" fill={palette.cream100} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
          <Path d="M -22 -14 L 0 2 L 22 -14" fill="none" stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
          <Path d="M -18 10 L 18 10 L 18 12 L -18 12 Z" fill="#FFFFFF" opacity={0.5} />
          <Circle cx={0} cy={2} r={6} fill={palette.terracotta400} stroke={CONTORNO} strokeWidth={2} />
        </G>
        <Tufo x={14} y={GY - 4} />
        <Tufo x={160} y={GY - 2} />
      </Svg>

      {/*
        Os dois retratos pendurados, balançando fora de fase — e **atrás** do
        broto.

        Eles vinham depois dele e o da esquerda passava por cima da cabeça
        dele: o broto aparecia espiando de trás de uma foto, como se a cena
        fosse sobre a foto. É o contrário — o varal é lembrança pendurada no
        fundo, e quem está no primeiro plano é ele. Ordem de desenho é tudo o
        que separa as duas leituras.
      */}
      {[[44, 50, -6], [112, 50, 5]].map(([x, y, incl], i) => (
        <Peca
          key={x}
          cena={cena}
          x={x - 16}
          y={y}
          largura={32}
          altura={40}
          style={{ transform: [{ rotate: retrato(incl) }] }}
        >
          <G transform="translate(16 2)">
            <Path d="M -15 0 L 15 0 L 15 36 L -15 36 Z" fill="#FFFFFF" stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
            <Path d="M -11 4 L 11 4 L 11 26 L -11 26 Z" fill={palette.blue100} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
            <Path
              d="M 0 12 C -3 7 -9 10 -6 15 L 0 20 L 6 15 C 9 10 3 7 0 12 Z"
              fill={i ? palette.green300 : palette.terracotta400}
              stroke={CONTORNO}
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          </G>
        </Peca>
      ))}

      <BrotoNaCena cena={cena} plantio={PLANTIO.luto} estagio={estagio} />
    </>
  );
}

/* ---------- Diminuir a solidão: o recado que chega ---------- */

function Solidao({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const chega = useLaco(3400, { parado });
  /*
    Um laço por pontinho, declarado aqui e não dentro do `map`.

    Hook em laço é a regra que todo mundo conhece; o que importa é o motivo, e
    aqui ele é concreto: se um dia o número de pontinhos virar dado, a ordem
    dos hooks muda entre dois desenhos e o React passa a devolver o valor
    errado para cada um. Três constantes não têm como escorregar assim.
  */
  const ponto1 = useLaco(1400, { parado, atraso: 0 });
  const ponto2 = useLaco(1400, { parado, atraso: 220 });
  const ponto3 = useLaco(1400, { parado, atraso: 440 });
  const pontinhos = [ponto1, ponto2, ponto3];

  const sobe = chega.interpolate({ inputRange: [0, 1], outputRange: [0, -6 * cena.escala] });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        <Brilho cx={118} cy={56} r={48} op={0.26} forca={vidro.brilho} />
        <Nuvem x={6} y={44} s={0.5} />
        <Chao cor={vidro.chao} />
        <Sombra cx={56} rx={30} />
        <Sombra cx={124} rx={20} />
        {/*
          Um segundo broto, menor, do outro lado — e é ele o objeto do tema.

          Nas outras doze cenas o objeto é uma coisa; aqui o assunto é
          companhia, e companhia não é objeto. Ele é desenhado à mão, e não
          montado com o `Sprout`, justamente para ficar **diferente**: é outra
          pessoa, não o espelho do broto dela.
        */}
        <Path d={`M 124 ${GY} L 124 108`} stroke={palette.green700} strokeWidth={4} strokeLinecap="round" />
        <Path
          d="M 124 116 C 116 110 108 112 108 120 C 110 126 120 124 124 116 Z"
          fill={palette.green500}
          stroke={palette.green900}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
        <Circle cx={124} cy={98} r={14} fill={palette.green300} stroke={palette.green900} strokeWidth={2.8} />
        <Path d="M 119 96 q 2 -3 4 0 M 127 96 q 2 -3 4 0" fill="none" stroke={CONTORNO} strokeWidth={2} strokeLinecap="round" />
        <Path d="M 120 103 q 4 4 8 0" fill="none" stroke={CONTORNO} strokeWidth={2} strokeLinecap="round" />
        <Tufo x={18} />
        <Flor x={156} cor={palette.lavender300} />
      </Svg>

      <BrotoNaCena cena={cena} plantio={PLANTIO.solidao} estagio={estagio} />

      {/* O balãozinho de recado, subindo entre os dois. */}
      <Peca cena={cena} x={74} y={40} largura={44} altura={34} style={{ transform: [{ translateY: sobe }] }}>
        <Path
          d="M 4 4 L 40 4 C 42 4 42 6 42 8 L 42 22 C 42 24 42 26 40 26 L 18 26 L 10 32 L 11 26 L 4 26 C 2 26 2 24 2 22 L 2 8 C 2 6 2 4 4 4 Z"
          fill="#FFFFFF"
          stroke={CONTORNO}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
      </Peca>
      {pontinhos.map((ponto, i) => (
        <Peca
          key={i}
          cena={cena}
          x={82 + i * 9}
          y={51}
          largura={7}
          altura={7}
          style={{
            transform: [{ translateY: sobe }],
            opacity: ponto.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
          }}
        >
          <Circle cx={3.5} cy={3.5} r={2.4} fill={palette.green700} />
        </Peca>
      ))}
    </>
  );
}

/* ---------- Descarregar a raiva: o papel amassado na cesta ---------- */

function Raiva({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const arremesso = useLaco(2600, { parado, ida: false });

  /* A bola sobe, passa do alto e cai dentro da cesta — um arco, não uma reta. */
  const anda = arremesso.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 62 * cena.escala],
  });
  const salta = arremesso.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, -30 * cena.escala, 6 * cena.escala],
  });
  const roda = arremesso.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '300deg'] });
  const some = arremesso.interpolate({
    inputRange: [0, 0.08, 0.86, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        <Brilho cx={118} cy={64} r={46} op={0.26} forca={vidro.brilho} />
        <Faisca x={152} y={48} s={0.6} cor={palette.terracotta400} />
        <Faisca x={92} y={44} s={0.45} />
        <Chao cor={vidro.chao} />
        <Sombra cx={54} rx={30} />
        <Sombra cx={128} rx={24} />
        {/* A cesta: aro, corpo e as três ripas. */}
        <Path
          d="M 108 104 L 148 104 L 143 130 C 142 133 139 134 136 134 L 120 134 C 117 134 114 133 113 130 Z"
          fill={palette.cream200}
          stroke={CONTORNO}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
        <Path d="M 120 108 L 122 130 M 128 108 L 128 130 M 136 108 L 134 130" stroke={CONTORNO} strokeWidth={1.8} opacity={0.4} strokeLinecap="round" />
        <Path d="M 106 104 L 150 104" stroke={CONTORNO} strokeWidth={3} strokeLinecap="round" />
        <Tufo x={20} />
        <Flor x={162} cor={palette.terracotta400} />
      </Svg>

      <BrotoNaCena cena={cena} plantio={PLANTIO.raiva} estagio={estagio} />

      {/*
        A bola de papel, do broto para a cesta — e é isto que o tema faz.

        Não é uma almofada apanhando nem nada que se quebre: raiva aqui se
        **descarrega**, amassa e vai embora. O papel é o mesmo do diário, o que
        liga o gesto a escrever o que incomoda antes de jogar fora.
      */}
      <Peca
        cena={cena}
        x={70}
        y={88}
        largura={22}
        altura={22}
        style={{ transform: [{ translateX: anda }, { translateY: salta }, { rotate: roda }], opacity: some }}
      >
        <Path
          d="M 11 1 L 18 4 L 21 11 L 17 18 L 10 21 L 3 17 L 1 10 L 5 4 Z"
          fill={palette.cream100}
          stroke={CONTORNO}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
        <Path d="M 8 7 L 13 11 L 9 15" fill="none" stroke={palette.brown200} strokeWidth={1.6} strokeLinecap="round" />
      </Peca>
    </>
  );
}

/* ---------- Começar o que você adia: a prancheta que se marca ---------- */

function Procrastinacao({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const marca = useLaco(4000, { parado, ida: false });
  const risco = marca.interpolate({ inputRange: [0, 0.3, 0.45, 1], outputRange: [0, 0, 1, 1] });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        <Brilho cx={48} cy={60} r={44} op={0.25} forca={vidro.brilho} />
        <Faisca x={154} y={48} s={0.7} />
        <Faisca x={88} y={44} s={0.45} cor={palette.terracotta400} />
        <Chao cor={vidro.chao} />
        <Sombra cx={48} rx={30} />
        <Sombra cx={124} rx={30} />
        <G transform="translate(124 88) rotate(4)">
          <Path d="M -28 -40 L 28 -40 L 28 48 L -28 48 Z" fill={palette.amber100} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
          <Path d="M -22 -32 L 22 -32 L 22 42 L -22 42 Z" fill="#FFFFFF" stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
          <Path d="M -10 -46 L 10 -46 L 10 -34 L -10 -34 Z" fill={palette.green500} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
          <Path d="M -26 -38 L -24 -38 L -24 46 L -26 46 Z" fill="#FFFFFF" opacity={0.5} />
          {[-18, 0, 18].map((y, i) => (
            <G key={y}>
              <Path
                d={`M -16 ${y - 4} L -8 ${y - 4} L -8 ${y + 4} L -16 ${y + 4} Z`}
                fill={i < 2 ? palette.green100 : '#FFFFFF'}
                stroke={CONTORNO}
                strokeWidth={1.8}
                strokeLinejoin="round"
              />
              <Path d={`M -3 ${y} L 16 ${y}`} stroke={CONTORNO} strokeWidth={2} opacity={i < 2 ? 0.35 : 1} strokeLinecap="round" />
            </G>
          ))}
          <Path d="M -15 -18 L -12 -15 L -6 -24" fill="none" stroke={palette.green700} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </G>
        <Tufo x={88} y={GY - 4} />
        <Flor x={160} cor={palette.lavender300} />
      </Svg>

      <BrotoNaCena cena={cena} plantio={PLANTIO.procrastinacao} estagio={estagio} />

      {/*
        O segundo item se marcando sozinho — o tema inteiro num gesto.

        Em vez de desenhar o risco crescendo (que pediria animar o caminho do
        SVG, e isso passa pelo JavaScript), o tique inteiro aparece de uma vez
        com um empurrãozinho de escala. O que se lê é o mesmo: a tarefa que
        estava parada acabou de ser feita.
      */}
      <Peca
        cena={cena}
        x={106}
        y={82}
        largura={16}
        altura={14}
        style={{
          opacity: risco,
          transform: [{ scale: risco.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }}
      >
        <Path d="M 2 7 L 6 11 L 14 2" fill="none" stroke={palette.green700} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </Peca>
    </>
  );
}

/* ---------- Recuperar o foco: a luminária e a flecha no alvo ---------- */

function Foco({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const tiro = useLaco(4000, { parado, ida: false });
  const anda = tiro.interpolate({
    inputRange: [0, 0.3, 0.42, 1],
    outputRange: [30 * cena.escala, 30 * cena.escala, 0, 0],
  });
  const sobe = tiro.interpolate({
    inputRange: [0, 0.3, 0.42, 1],
    outputRange: [-16 * cena.escala, -16 * cena.escala, 0, 0],
  });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        <Path d={`M 34 70 L 6 ${GY} L 92 ${GY} Z`} fill={palette.amber400} opacity={0.22} />
        <Path d="M 22 54 L 46 54 L 42 70 L 26 70 Z" fill={palette.green500} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
        <Path d="M 34 42 L 34 54" stroke={CONTORNO} strokeWidth={2.4} strokeLinecap="round" />
        <Circle cx={34} cy={72} r={3.5} fill={palette.amber400} stroke={CONTORNO} strokeWidth={1.8} />
        <Chao cor={vidro.chao} />
        <Sombra cx={48} rx={30} />
        <Sombra cx={126} rx={18} />
        <Path d={`M 120 ${GY} L 126 100 L 132 ${GY}`} fill="none" stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
        <Circle cx={126} cy={74} r={28} fill="#FFFFFF" stroke={CONTORNO} strokeWidth={2.4} />
        <Circle cx={126} cy={74} r={20} fill={palette.terracotta400} stroke={CONTORNO} strokeWidth={2.4} />
        <Circle cx={126} cy={74} r={12} fill="#FFFFFF" stroke={CONTORNO} strokeWidth={2.4} />
        <Circle cx={126} cy={74} r={5} fill={palette.terracotta400} stroke={CONTORNO} strokeWidth={2.4} />
        <Path d="M 106 62 C 110 54 118 49 124 48 C 116 52 110 57 106 62 Z" fill="#FFFFFF" opacity={0.7} />
        <Tufo x={160} y={GY - 2} />
      </Svg>

      <BrotoNaCena cena={cena} plantio={PLANTIO.foco} estagio={estagio} />

      {/* A flecha, que chega e crava no meio. */}
      <Peca
        cena={cena}
        x={120}
        y={44}
        largura={46}
        altura={36}
        style={{ transform: [{ translateX: anda }, { translateY: sobe }] }}
      >
        {/*
          A ponta vai na **frente**, e a frente é o alvo.

          Ela estava na outra extremidade: a flecha viajava do canto de cima
          para o meio do alvo com a farpa apontando para trás, como se tivesse
          sido cuspida de dentro dele. Quem manda aqui é o movimento — a peça
          anda de (30, −16) até (0, 0), ou seja, para baixo e para a esquerda —,
          e a ponta tem de apontar para onde ela está indo.

          Na cauda ficam as penas, que é o que acabou de sair da corda.
        */}
        <Path d="M 10 27 L 36 9" stroke={CONTORNO} strokeWidth={2.6} strokeLinecap="round" />
        <Path d="M 12 20 L 2 34 L 18 31 Z" fill={palette.green500} stroke={CONTORNO} strokeWidth={1.8} strokeLinejoin="round" />
        {/*
          O entalhe: duas penas em volta da haste, e não dois riscos soltos.

          Eram dois traços tortos saindo do nada — de longe liam como sujeira
          no desenho. Pena de flecha tem **forma**: ela encosta na haste de um
          lado, abre para fora e volta a fechar na ponta de trás. Duas, uma de
          cada lado, desenhadas ao longo do próprio eixo da haste, que é o que
          faz as duas parecerem a mesma peça vista de frente.

          A quina atrás delas é onde a corda encaixa. Ela não precisa de
          desenho próprio neste tamanho: o encontro das duas penas já faz o
          vinco.
        */}
        <Path
          d="M 36 9 L 27 15 L 23 9 L 32 3 Z"
          fill={palette.amber400}
          stroke={CONTORNO}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <Path
          d="M 36 9 L 27 15 L 31 21 L 40 15 Z"
          fill={palette.amber400}
          stroke={CONTORNO}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </Peca>
    </>
  );
}

/* ---------- Melhorar a autoestima: o espelho e os corações ---------- */

function Autoestima({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const coracao = useLaco(3400, { parado, ida: false });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        <Brilho cx={122} cy={66} r={50} op={0.3} forca={vidro.brilho} />
        <Faisca x={20} y={52} s={0.7} />
        <Faisca x={90} y={44} s={0.5} cor={palette.terracotta400} />
        <Faisca x={156} y={48} s={0.8} />
        <Chao cor={vidro.chao} />
        <Sombra cx={52} rx={30} />
        <Sombra cx={124} rx={22} />
        <Path d={`M 112 ${GY} L 118 120 L 130 120 L 136 ${GY} Z`} fill={palette.amber100} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
        <Ellipse cx={124} cy={82} rx={24} ry={32} fill={palette.amber400} stroke={CONTORNO} strokeWidth={2.4} />
        <Ellipse cx={124} cy={82} rx={17} ry={25} fill={palette.blue100} stroke={CONTORNO} strokeWidth={1.8} />
        {/* O reflexo: a cara do broto dentro do espelho. */}
        <Circle cx={124} cy={82} r={9} fill={palette.green300} stroke={CONTORNO} strokeWidth={1.8} />
        <Circle cx={120.5} cy={81} r={1.4} fill={CONTORNO} />
        <Circle cx={127.5} cy={81} r={1.4} fill={CONTORNO} />
        <Path d="M 120 86 Q 124 90 128 86" fill="none" stroke={CONTORNO} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M 112 70 C 114 64 118 60 122 59 C 118 63 115 67 112 70 Z" fill="#FFFFFF" opacity={0.9} />
        <Path d="M 132 98 L 136 92 L 137 94 L 134 99 Z" fill="#FFFFFF" opacity={0.7} />
      </Svg>

      <BrotoNaCena cena={cena} plantio={PLANTIO.autoestima} estagio={estagio} />

      {/* Um coraçãozinho subindo entre o broto e o espelho, sem parar. */}
      <Peca
        cena={cena}
        x={80}
        y={58}
        largura={18}
        altura={16}
        style={{
          transform: [
            { translateY: coracao.interpolate({ inputRange: [0, 1], outputRange: [6 * cena.escala, -18 * cena.escala] }) },
          ],
          opacity: coracao.interpolate({ inputRange: [0, 0.25, 0.7, 1], outputRange: [0, 1, 1, 0] }),
        }}
      >
        <Path
          d="M 9 14 C 7 10 2 12 4 6 C 5 3 8 3 9 6 C 10 3 13 3 14 6 C 16 12 11 10 9 14 Z"
          fill={palette.terracotta400}
          stroke={CONTORNO}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </Peca>
    </>
  );
}

/* ---------- Aliviar a culpa: o coração com curativo ---------- */

function Culpa({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const bate = useLaco(3200, { parado });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        <Brilho cx={118} cy={72} r={52} op={0.28} forca={vidro.brilho} />
        <Faisca x={152} y={48} s={0.6} />
        <Faisca x={24} y={50} s={0.45} cor={palette.terracotta400} />
        <Chao cor={vidro.chao} />
        <Sombra cx={50} rx={30} />
        <Sombra cx={120} rx={28} />
        <Flor x={82} y={GY - 4} cor={palette.lavender300} />
        <Tufo x={160} y={GY - 2} />
      </Svg>

      <BrotoNaCena cena={cena} plantio={PLANTIO.culpa} estagio={estagio} />

      {/*
        O coração batendo, e o curativo atravessado nele.

        O curativo é o tema: não é um coração partido nem um coração perfeito —
        é um que foi cuidado. Ele pulsa de leve, porque continua vivo.
      */}
      <Peca
        cena={cena}
        x={84}
        y={54}
        largura={72}
        altura={76}
        style={{ transform: [{ scale: bate.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] }}
      >
        <G transform="translate(36 38)">
          <Path
            d="M 0 -16 C -10 -34 -38 -28 -34 -6 C -32 8 -14 22 0 34 C 14 22 32 8 34 -6 C 38 -28 10 -34 0 -16 Z"
            fill={palette.terracotta400}
            stroke={CONTORNO}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          <Path d="M -26 -14 C -26 -22 -20 -26 -14 -25 C -20 -22 -24 -18 -26 -14 Z" fill="#FFFFFF" opacity={0.7} />
          <G transform="rotate(-30)">
            <Path d="M -24 -6 L 24 -6 C 28 -6 28 6 24 6 L -24 6 C -28 6 -28 -6 -24 -6 Z" fill={palette.amber100} stroke={CONTORNO} strokeWidth={2} strokeLinejoin="round" />
            <Path d="M -8 -6 L 8 -6 L 8 6 L -8 6 Z" fill={palette.cream100} stroke={CONTORNO} strokeWidth={1.6} strokeLinejoin="round" />
            {[[-3, -2], [3, -2], [-3, 2], [3, 2]].map(([cx, cy]) => (
              <Circle key={`${cx}:${cy}`} cx={cx} cy={cy} r={0.9} fill={CONTORNO} />
            ))}
          </G>
        </G>
      </Peca>
    </>
  );
}

/* ---------- Parar de se comparar: a régua que não serve ---------- */

function Comparacao({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const cede = useLaco(4200, { parado });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        <Brilho cx={118} cy={58} r={48} op={0.26} forca={vidro.brilho} />
        <Nuvem x={4} y={42} s={0.5} />
        <Chao cor={vidro.chao} />
        <Sombra cx={52} rx={30} />
        <Sombra cx={126} rx={26} />
        {/*
          A planta do vizinho: maior, mais vistosa, e **sem rosto**.

          É o que o tema diz. A comparação nunca é com uma pessoa inteira; é
          com a parte de fora dela, que a gente preenche de longe. Dar uma
          carinha a esta planta faria dela um personagem, e aí o cartão
          passaria a ser sobre inveja de alguém em vez de sobre a medida.
        */}
        <Path d={`M 126 ${GY} L 126 56`} stroke={palette.green700} strokeWidth={5} strokeLinecap="round" />
        {[[-1, 70], [1, 86], [-1, 102]].map(([lado, y], i) => (
          <Path
            key={y}
            d={`M 126 ${y} C ${126 + lado * 14} ${y - 10} ${126 + lado * 26} ${y - 2} ${126 + lado * 22} ${y + 8} C ${126 + lado * 14} ${y + 12} ${126 + lado * 4} ${y + 6} 126 ${y} Z`}
            fill={i % 2 ? palette.green300 : palette.green500}
            stroke={palette.green900}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
        ))}
        <Circle cx={126} cy={48} r={11} fill={palette.terracotta400} stroke={CONTORNO} strokeWidth={2.4} />
        <Circle cx={126} cy={48} r={4} fill={palette.yellow300} />
        <Tufo x={18} />
      </Svg>

      <BrotoNaCena cena={cena} plantio={PLANTIO.comparacao} estagio={estagio} />

      {/*
        A fita métrica entre os dois — e ela despenca.

        Sobe reta, dá uma barriga e cai: a medida que não para em pé. É o único
        movimento da grade que **falha** de propósito, e é o argumento do tema
        inteiro num gesto de quatro segundos.
      */}
      <Peca
        cena={cena}
        x={66}
        y={40}
        largura={56}
        altura={70}
        style={{
          transform: [
            { rotate: cede.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '10deg'] }) },
          ],
        }}
      >
        <Path
          d="M 8 66 C 10 40 26 28 48 22"
          fill="none"
          stroke={palette.amber400}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <Path
          d="M 8 66 C 10 40 26 28 48 22"
          fill="none"
          stroke={CONTORNO}
          strokeWidth={1.4}
          strokeDasharray="3 7"
          strokeLinecap="round"
          opacity={0.55}
        />
      </Peca>
    </>
  );
}

/* ---------- Preparar o sono: a lua e o cobertor ---------- */

function Insonia({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const pisca = useLaco(2600, { parado });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        {/* A noite é desenhada por cima do tom do cartão: é a única cena que
            troca a hora do dia, e por isso a única que precisa de um fundo. */}
        <Rect x={-10} y={-10} width={L + 20} height={A + 20} fill={palette.night700} opacity={0.9} />
        <Brilho cx={132} cy={56} r={30} op={0.16} cor={palette.yellow300} />
        <Brilho cx={132} cy={56} r={20} op={0.2} cor={palette.yellow300} />
        <Path d="M 140 38 C 124 38 116 56 124 68 C 132 78 148 76 154 66 C 142 68 132 58 140 38 Z" fill={palette.yellow300} />
        {/* O chão da noite é fraco nos dois temas: a cena já é escura, e o
            branco do dia vira um banco cinza atravessando o cartão. */}
        <Chao cor="rgba(255,255,255,0.12)" />
        <Sombra cx={70} rx={30} />
      </Svg>

      {/*
        O cobertor saiu.

        Ele era desenhado **por cima** do broto, e por cima de um vaso um
        cobertor não assenta: tapava o vaso inteiro e metade das folhas, e o que
        sobrava era uma barra lilás com uma cabecinha em pé atrás. Quem diz que
        ele está dormindo é a pose — olhos fechados, o balanço lento, os zês
        subindo —, e isso já aparece inteiro. A noite, a lua e as estrelas fazem
        o resto.
      */}
      <BrotoNaCena cena={cena} plantio={PLANTIO.insonia} estagio={estagio} />

      {/* As estrelas, piscando fora de fase umas das outras. */}
      {[[22, 48, 0.5], [62, 42, 0.4], [92, 60, 0.55], [40, 74, 0.35], [160, 86, 0.4], [104, 84, 0.3]].map(
        ([x, y, s], i) => (
          <Peca
            key={`${x}:${y}`}
            cena={cena}
            x={x - 10}
            y={y - 10}
            largura={20}
            altura={20}
            style={{
              opacity: pisca.interpolate({
                inputRange: [0, 1],
                /* Cada uma começa num ponto diferente da mesma curva: sem isso
                   as seis piscariam juntas, que lê como a tela inteira
                   oscilando. */
                outputRange: i % 2 ? [1, 0.25] : [0.25, 1],
              }),
            }}
          >
            <Path d={FAISCA} fill={palette.cream100} transform={`translate(10 10) scale(${s})`} />
          </Peca>
        ),
      )}
    </>
  );
}

/* ---------- Praticar gratidão: o sol, as bandeirinhas e o presente ---------- */

function Gratidao({ largura, altura, estagio, parado }: CenaProps) {
  const cena = naCena(largura, altura);
  const vidro = useVidro();
  const raios = useLaco(40000, { parado, ida: false });
  const confete = useLaco(2400, { parado });

  return (
    <>
      <Svg width={largura} height={altura} viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice">
        <Brilho cx={124} cy={74} r={30} op={0.35} forca={vidro.brilho} />
        <Path d="M -4 42 C 40 60 130 60 174 40" fill="none" stroke={CONTORNO} strokeWidth={1.6} />
        {[[16, palette.terracotta400], [44, palette.green300], [72, palette.amber400], [100, palette.lavender300], [128, palette.terracotta400], [154, palette.green300]].map(
          ([x, cor]) => {
            const px = x as number;
            const y = 42 + 18 * Math.sin((Math.PI * (px + 4)) / 178) * 0.95;
            return (
              <Path
                key={px}
                d={`M ${px - 7} ${y} L ${px + 7} ${y} L ${px} ${y + 13} Z`}
                fill={cor as string}
                stroke={CONTORNO}
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
            );
          },
        )}
        <Chao cor={vidro.chao} />
        <Sombra cx={52} rx={30} />
        <Sombra cx={124} rx={26} />
        <Path d={`M 104 102 L 144 102 L 142 ${GY} L 106 ${GY} Z`} fill={palette.green300} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
        <Path d="M 100 92 L 148 92 L 148 104 L 100 104 Z" fill={palette.green300} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
        <Path d={`M 120 92 L 128 92 L 128 ${GY} L 120 ${GY} Z`} fill={palette.terracotta400} stroke={CONTORNO} strokeWidth={1.8} strokeLinejoin="round" />
        <Path d="M 104 95 L 116 95 L 116 98 L 104 98 Z" fill="#FFFFFF" opacity={0.6} />
        <Path d="M 124 92 C 112 76 102 86 124 92 C 146 86 136 76 124 92 Z" fill={palette.terracotta400} stroke={CONTORNO} strokeWidth={2.4} strokeLinejoin="round" />
      </Svg>

      {/* Os raios do sol, girando muito devagar atrás do presente. */}
      <Peca
        cena={cena}
        x={64}
        y={10}
        largura={120}
        altura={120}
        style={{ transform: [{ rotate: raios.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}
      >
        <G transform="translate(60 60)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <Path key={a} d="M -4 -30 L 4 -30 L 1 -54 L -1 -54 Z" fill={palette.amber400} opacity={0.35} transform={`rotate(${a})`} />
          ))}
        </G>
      </Peca>

      <BrotoNaCena cena={cena} plantio={PLANTIO.gratidao} estagio={estagio} />

      {/* Os confetes: quadradinhos que acendem e apagam em tempos diferentes. */}
      {[[96, 70, palette.amber400], [150, 64, palette.terracotta400], [90, 92, palette.lavender300], [158, 92, palette.amber400]].map(
        ([x, y, cor], i) => (
          <Peca
            key={`${x}:${y}`}
            cena={cena}
            x={x as number}
            y={y as number}
            largura={6}
            altura={6}
            style={{
              opacity: confete.interpolate({
                inputRange: [0, 1],
                outputRange: i % 2 ? [1, 0.3] : [0.3, 1],
              }),
            }}
          >
            <Rect x={0.5} y={0.5} width={5} height={5} rx={1} fill={cor as string} transform={`rotate(${i * 30} 3 3)`} />
          </Peca>
        ),
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

const CENAS: Record<string, React.ComponentType<CenaProps>> = {
  ansiedade: Ansiedade,
  estresse: Estresse,
  tristeza: Tristeza,
  luto: Luto,
  solidao: Solidao,
  raiva: Raiva,
  procrastinacao: Procrastinacao,
  foco: Foco,
  autoestima: Autoestima,
  culpa: Culpa,
  comparacao: Comparacao,
  insonia: Insonia,
  gratidao: Gratidao,
};

export const TEMAS_COM_CENA = Object.keys(CENAS);

export function ehTemaComCena(chave: string): boolean {
  return chave in CENAS;
}

type Props = {
  tema: string;
  largura: number;
  altura: number;
  estagio: SproutStage;
  /** A grade saiu de vista: o movimento para. */
  parado?: boolean;
};

/** A cena de um tema, encaixada na área que o cartão der a ela. */
export function CenaDoTema({ tema, largura, altura, estagio, parado = false }: Props) {
  const Cena = CENAS[tema] ?? Ansiedade;
  if (largura <= 0 || altura <= 0) return null;
  return (
    <View style={{ width: largura, height: altura, overflow: 'hidden' }} pointerEvents="none">
      <Cena largura={largura} altura={altura} estagio={estagio} parado={parado} />
    </View>
  );
}

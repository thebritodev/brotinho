import React, { useId } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { tracos, type Mood, useTema } from '../../theme';
import {
  BULB_R,
  CARAS,
  CX,
  type Decoration,
  ehEnfeite,
  LEAVES_BY_STAGE,
  POT_TOP_Y,
  type SproutStage,
  STEM_TOP_Y,
  TRACO_DA_FOLHA,
  caixaDaPlanta,
  caixaDoMascote,
  comoViewBox,
  medidasDoMascote,
} from './geometriaDoBroto';

export { ehEnfeite };
export type { Decoration, SproutStage };

/**
 * Os três gradientes que dão volume ao broto.
 *
 * ## Por que os ids são gerados
 *
 * `fill="url(#bulbo)"` procura o gradiente por id, e id em SVG não tem escopo
 * por documento aqui: a tela do jardim desenha um broto por planta, a de
 * valores desenha cinco, e todos declarariam `#bulbo`. Vence um, e qual é
 * indefinido — o tipo de falha que aparece numa tela só, depois de meses.
 * `useId` dá um sufixo estável por instância, e cada broto passa a referenciar
 * o seu.
 *
 * ## Por que não são tokens de tema
 *
 * Pela mesma razão que `tracos` existe: o personagem não segue o tema. A luz
 * em volta dele muda entre claro e escuro — o halo, o papel, o céu —, mas o
 * broto é o mesmo de dia e de noite. Um bulbo que clareasse no tema escuro
 * viraria um negativo de si mesmo.
 */
function Gradientes({ id }: { id: string }) {
  return (
    <Defs>
      {/* A luz vem de cima à esquerda, e é ela que define os três centros. */}
      <RadialGradient id={`bulbo-${id}`} cx="34%" cy="28%" r="78%">
        <Stop offset="0" stopColor={tracos.bulboLuz} />
        <Stop offset="0.62" stopColor={tracos.folhaClara} />
        <Stop offset="1" stopColor={tracos.bulboSombra} />
      </RadialGradient>
      <LinearGradient id={`folha-${id}`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={tracos.folhaLuz} />
        <Stop offset="1" stopColor={tracos.folhaSombra} />
      </LinearGradient>
      <LinearGradient id={`vaso-${id}`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={tracos.vasoLuz} />
        <Stop offset="0.55" stopColor={tracos.vaso} />
        <Stop offset="1" stopColor={tracos.vasoSombra} />
      </LinearGradient>
    </Defs>
  );
}

function Face({ mood, cx, cy }: { mood: Mood; cx: number; cy: number }) {
  const f = CARAS[mood] ?? CARAS.neutro;

  /*
    Não há mais caso especial para o `feliz`.

    Havia um: ele desenhava dois arcos no lugar dos olhos. Trocar a tabela
    `FACES` sozinha não teria efeito nenhum, porque este ramo passava por cima
    dela — o tipo de sobra que faz uma mudança parecer que não pegou.
  */
  const eye = (x: number) =>
    f.eye === 'circle' ? (
      <Circle cx={cx + x} cy={cy} r={f.r} fill={tracos.contorno} />
    ) : (
      <Path
        d={f.eye}
        transform={`translate(${cx + x} ${cy})${x < 0 ? '' : ' scale(-1,1)'}`}
        stroke={tracos.contorno}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    );

  return (
    <G>
      {eye(-9)}
      {eye(9)}
      {/*
        O brilho do olho, e por que ele fica fora da função `eye`.

        `eye` desenha os dois casos que a tabela `CARAS` conhece: o ponto e o
        arco. O arco é um olho fechado — sono, alívio —, e olho fechado não
        reflete luz. Desenhar o brilho aqui, condicionado ao tipo, mantém a
        função com uma responsabilidade e evita um ponto branco boiando sobre
        uma pálpebra.

        Ele fica **acima e à esquerda** da pupila nos dois olhos, e não
        espelhado: reflexo aponta para a fonte de luz, e a luz do desenho vem
        de um lugar só. Espelhar daria dois olhos de vidro olhando para fora.
      */}
      {f.eye === 'circle' && (
        <G fill="#FFFFFF" opacity={0.8}>
          <Circle cx={cx - 8.2} cy={cy - 3} r={0.9} />
          <Circle cx={cx + 9.8} cy={cy - 3} r={0.9} />
        </G>
      )}
      <Path
        d={f.mouth}
        transform={`translate(${cx} ${cy})`}
        stroke={tracos.contorno}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
      {/*
        As bochechas.

        São o único calor do personagem — todo o resto dele é verde, marrom e
        barro. A 30% de opacidade não leem como maquiagem: leem como sangue
        sob a pele, que é a diferença entre um personagem vivo e um ícone.

        Ficam em `±16`, fora do raio dos olhos e dentro do bulbo mesmo no
        estágio 1, onde ele tem 20 de raio.
      */}
      <G fill={tracos.bochecha} opacity={0.3}>
        <Ellipse cx={cx - 16} cy={cy + 4} rx={4.4} ry={3} />
        <Ellipse cx={cx + 16} cy={cy + 4} rx={4.4} ry={3} />
      </G>
    </G>
  );
}

/**
 * Uma folha.
 *
 * `iluminada` diz se ela pega o gradiente ou fica no tom de sombra chapado —
 * e a distinção não é enfeite. A folha de trás do broto está **atrás** dele:
 * dar a ela o mesmo gradiente da da frente apaga a profundidade que o desenho
 * inteiro está tentando construir. Ela fica no tom escuro, sem nervura fina e
 * sem brilho de borda, que é como uma folha na sombra se comporta.
 */
function Leaf({
  x,
  y,
  rotate,
  scale = 1,
  color,
  gradiente,
  iluminada = false,
}: {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
  color?: string;
  gradiente?: string;
  iluminada?: boolean;
}) {
  // O padrão saiu da assinatura: valor de parâmetro é avaliado antes do corpo,
  // e ali o gancho ainda não rodou.
  const preenchimento =
    color ?? (iluminada && gradiente ? `url(#${gradiente})` : tracos.folhaSombra);
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <Path
        d="M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z"
        fill={preenchimento}
        stroke={tracos.contornoFolha}
        strokeWidth={TRACO_DA_FOLHA}
        strokeLinejoin="round"
      />{/* TRACO_DA_FOLHA afinou junto com o resto — ver `geometriaDoBroto`. */}
      {/* A nervura principal, que já existia. */}
      <Path
        d="M -2 -2 C -12 -9 -22 -15 -31 -18"
        stroke={tracos.contornoFolha}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        opacity={iluminada ? 0.45 : 0.4}
      />
      {iluminada && (
        <G>
          {/* Uma nervura secundária: uma só, saindo da principal. */}
          <Path
            d="M -10 -6 C -14 -12 -17 -16 -19 -19"
            stroke={tracos.contornoFolha}
            strokeWidth={1}
            opacity={0.25}
            fill="none"
          />
          {/*
            O brilho na borda de baixo.

            É o que faz a folha parecer ter espessura em vez de ser um recorte
            de papel: a luz que passa raspando pega a quina virada para cima.
          */}
          <Path
            d="M -18 3 C -26 2 -33 -2 -36 -7"
            stroke="#FFFFFF"
            strokeWidth={1.6}
            opacity={0.3}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      )}
    </G>
  );
}

function Decorations({ list, cx, cy }: { list: Decoration[]; cx: number; cy: number }) {
  const { palette } = useTema();
  return (
    <G>
      {list.includes('criatividade') && (
        <Path
          d={`M ${cx - 34} ${cy - 46} l 3 7 l 7 1 l -5 5 l 1 7 l -6 -3 l -6 3 l 1 -7 l -5 -5 l 7 -1 z`}
          fill={tracos.vaso}
        />
      )}
      {list.includes('curiosidade') && (
        <G fill={palette.amber400}>
          <Path d={`M ${cx + 40} ${cy - 30} l 2 5 l 5 2 l -5 2 l -2 5 l -2 -5 l -5 -2 l 5 -2 z`} />
          <Circle cx={cx + 30} cy={cy - 44} r={2.4} />
        </G>
      )}
      {list.includes('autocuidado') && (
        <G fill={palette.yellow300} opacity={0.9}>
          <Circle cx={cx - 46} cy={cy + 6} r={4} />
          <Circle cx={cx + 44} cy={cy + 16} r={3} />
        </G>
      )}
      {/*
        Coragem: a flor.

        As outras quatro são marcas em volta — estrela, brilho, gotas, a
        plantinha companheira. A flor é a única que sai da própria planta, e é
        essa a diferença que interessa: coragem não é algo que aconteceu perto
        dela, é ela tendo se aberto. É também a primeira coisa deste vocabulário
        que uma planta faz por conta própria, e ele não tinha nenhuma.

        Cinco pétalas redondas contra a estrela de cinco pontas da criatividade:
        as duas são quentes e ficam em lados opostos, e o que as separa aos 56
        pixels da tela de valores é o contorno, não a cor.

        Ela fica em `cy + 26`, e não em `cy + 18` como desenhei primeiro: ali a
        pétala de cima encostava na gota esquerda do autocuidado, que mora em
        `cy + 6`. Os cinco enfeites aparecem juntos na tela de valores, então
        cada um precisa do seu canto — a estrela em cima à esquerda, o brilho em
        cima à direita, as gotas nos lados, a plantinha embaixo à direita, a
        flor embaixo à esquerda.
      */}
      {list.includes('coragem') && (
        <G>
          {[0, 1, 2, 3, 4].map((i) => {
            const angulo = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            return (
              <Circle
                key={i}
                cx={cx - 33 + Math.cos(angulo) * 5.4}
                cy={cy + 14 + Math.sin(angulo) * 5.4}
                r={3.8}
                fill={palette.terracotta600}
              />
            );
          })}
          <Circle cx={cx - 33} cy={cy + 14} r={2.6} fill={palette.amber400} />
        </G>
      )}
      {list.includes('conexao') && (
        <G transform={`translate(${cx + 46} ${cy + 30}) scale(0.42)`}>
          <Ellipse
            cx={0}
            cy={10}
            rx={30}
            ry={34}
            fill={tracos.folhaClara}
            stroke={tracos.contornoFolha}
            strokeWidth={4}
          />
          <Leaf x={-4} y={-22} rotate={-25} scale={0.9} color={tracos.folhaClara} />
        </G>
      )}
    </G>
  );
}

/**
 * Qual parte do desenho sair.
 *
 * Existe por causa do balanço: a sombra de chão é projetada pelo vaso **no
 * chão**, e chão não balança. Desenhada junto, ela girava com a planta — o
 * vaso ficava parado e a mancha embaixo dele ia de um lado para o outro, que é
 * o oposto do que sombra faz.
 *
 * Separar em duas passadas do mesmo componente, em vez de mover a elipse para
 * fora, mantém a geometria única: as duas usam a mesma `viewBox` e o mesmo
 * tamanho, então se sobrepõem exatamente sem ninguém precisar recalcular onde
 * fica a base do vaso.
 */
export type ParteDoBroto = 'tudo' | 'planta' | 'sombra';

type Props = {
  mood?: Mood;
  stage?: SproutStage;
  decorations?: Decoration[];
  size?: number;
  showPot?: boolean;
  parte?: ParteDoBroto;
};

/**
 * Sprout — o mascote Brotinho.
 * `mood` define rosto + cor de fundo; `stage` define o tamanho do crescimento.
 */
export function Sprout({
  mood = 'neutro',
  stage = 2,
  decorations = [],
  size = 160,
  showPot = true,
  parte = 'tudo',
}: Props) {
  /* Um sufixo por instância — ver `Gradientes`. */
  const idDoGradiente = useId().replace(/[^a-zA-Z0-9]/g, '');
  const stemTopY = STEM_TOP_Y[stage];
  const bulbR = BULB_R[stage];
  const midY = (POT_TOP_Y + stemTopY) / 2;

  /*
    Sem vaso, a viewBox se fecha em volta da planta.

    A caixa `0 0 200 224` inclui o vaso, que vai de 164 a 220. Escondendo o
    vaso, um terço da caixa fica vazio — e o desenho, que continua sendo
    encaixado nela, aparece com metade do tamanho, flutuando com um buraco
    embaixo. Era isso, e não o valor de `size`, que fazia o broto dos cartões
    parecer pequeno: aumentar o número aumentava a caixa junto com o vazio.

    O primeiro recorte eu escrevi à mão, e ele cortava as folhas: elas caem bem
    abaixo da boca do vaso, e eu tinha fechado a caixa doze unidades depois
    dela. Agora a caixa é calculada das mesmas tabelas que desenham — ver
    `geometriaDoBroto`.
  */
  /*
    Três enquadramentos, e o que decide é o que está desenhado atrás.

    Com halo, a caixa é a de sempre — ela foi feita em volta do disco, e
    reserva uns 53 de altura acima da planta que é exatamente o que o disco
    ocupa. Sem halo, aquele espaço reservado vira um vazio no topo da tela, e o
    broto parece pequeno e caído no meio dela.

    Por isso o tema escuro, que não tem halo desde a correção do fundo, passa a
    usar a caixa fechada em volta de planta e vaso. Mesmo espaço na tela, cerca
    de um terço a mais de desenho.
  */
  const temEnfeite = decorations.length > 0;
  const caixa = showPot
    ? caixaDoMascote(stage, temEnfeite)
    : caixaDaPlanta(stage, temEnfeite);

  /*
    Duas regras de quadro, porque são dois trabalhos diferentes.

    **O mascote** — com vaso — mantém a escala fixa de `size / 200`: o mesmo
    desenho, do mesmo tamanho, em qualquer tema. Sem halo o quadro encolhe e
    abraça o desenho, e é isso que sobe o broto sem aumentá-lo. Ver
    `medidasDoMascote`.

    **O broto dos cartões** — sem vaso — faz o contrário: preenche o espaço que
    lhe deram. Ali `size` é o tamanho pedido pelo cartão, não a escala do
    desenho, e encolher o quadro seria devolver o defeito do broto pequeno.
  */
  const { largura, altura } = showPot
    ? medidasDoMascote(caixa, size)
    : { altura: size * 1.12, largura: size * 1.12 * (caixa.largura / caixa.altura) };

  return (
    <Svg viewBox={comoViewBox(caixa)} width={largura} height={altura}>
      <Gradientes id={idDoGradiente} />
      {/*
        Não há fundo de humor atrás do broto, e isso é decisão, não falta.

        Havia um disco da cor do humor aqui. Ele passou por seis versões — tom
        escurecido, tom médio saturado, tom escuro próprio, gradiente
        dissolvido, luz de trás, e enfim ausência no tema escuro — e nenhuma
        parou de pé. O que resolveu foi olhar o conjunto das reclamações em vez
        de cada uma: todas eram sobre a cor do fundo, e nenhuma sobre a falta
        dela.

        Numa tela onde o humor já é dito pela carinha do próprio broto, pela
        carinha marcada e pela palavra escolhida, o fundo era o quarto a dizer a
        mesma coisa — o único que dava trabalho, e o único que ninguém pediu.

        `moodColorsFundo` continua existindo, para o disco pequeno do jardim e
        da colheita: ali ele é uma pastilha sobre cartão, do tamanho de um
        ícone, e nunca foi o problema.
      */}

      {/*
        A sombra no chão.

        Sem ela o vaso não pousa em lugar nenhum — fica um objeto recortado
        boiando sobre o fundo. É uma elipse achatada, larga e fraca: sombra de
        luz difusa de ambiente, não de holofote.

        Sai numa passada própria (`parte`) para poder ficar parada enquanto a
        planta balança.
      */}
      {showPot && parte !== 'planta' && (
        <Ellipse cx={100} cy={219} rx={40} ry={7} fill={tracos.contorno} opacity={0.13} />
      )}

      {parte === 'sombra' ? null : (
        <>
      {showPot && (
        <G>
          <Path
            d="M 62 170 C 62 166 66 164 70 164 L 130 164 C 134 164 138 166 138 170 L 128 210 C 127 216 121 220 113 220 L 87 220 C 79 220 73 216 72 210 Z"
            fill={`url(#vaso-${idDoGradiente})`}
            stroke={tracos.contorno}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/*
            As duas listras do barro trocaram de papel.

            Eram dois riscos escuros horizontais, paralelos, a 178 e 192 — que
            liam como frisos decorativos do vaso. Agora são **verticais** e
            fazem volume: uma faixa de luz no lado que pega o sol, uma de
            sombra no lado que não pega. É a mesma quantidade de traço, dizendo
            que o vaso é redondo em vez de dizendo que ele é listrado.
          */}
          <Path
            d="M 121 166 L 112 219"
            stroke="#FFFFFF"
            strokeWidth={5}
            opacity={0.16}
            strokeLinecap="round"
          />
          <Path
            d="M 76 168 C 78 190 82 208 86 218"
            stroke={tracos.vasoRisco}
            strokeWidth={4}
            opacity={0.18}
            strokeLinecap="round"
            fill="none"
          />

          <Rect
            x={58}
            y={156}
            width={84}
            height={15}
            rx={7.5}
            fill={`url(#vaso-${idDoGradiente})`}
            stroke={tracos.contorno}
            strokeWidth={2}
          />
          {/* A luz na aresta de cima da borda. */}
          <Path
            d="M 66 159.5 L 132 159.5"
            stroke="#FFFFFF"
            strokeWidth={2.4}
            opacity={0.3}
            strokeLinecap="round"
          />
          {/*
            A terra.

            Era o contorno a 15% e lia como uma sombra qualquer dentro do vaso.
            Agora é marrom de terra, mais escura e mais opaca: o broto está
            plantado em alguma coisa, e dá para ver o quê.
          */}
          <Ellipse cx={100} cy={164} rx={33} ry={4.2} fill={tracos.terra} opacity={0.28} />
        </G>
      )}

      {/*
        A haste ficou mais clara que o contorno das folhas.

        Era `contornoFolha`, o mesmo verde-escuro do traço — e uma haste da cor
        do contorno não lê como caule, lê como um vinco entre as folhas. Em
        `green700` ela vira uma peça com cor própria, atrás das folhas.
      */}
      <Path
        d={`M ${CX} ${POT_TOP_Y} C ${CX - 6} ${midY} ${CX + 6} ${midY - 10} ${CX} ${stemTopY}`}
        stroke={tracos.haste}
        strokeWidth={3.8}
        strokeLinecap="round"
        fill="none"
      />

      {/*
        Quais folhas pegam luz: as que apontam para a esquerda, de onde ela vem.

        As tabelas guardam a rotação de cada folha, e uma virada para 215° está
        de costas para a fonte. Em vez de marcar folha por folha na tabela — o
        tipo de dado que se desatualiza quando alguém mexe num ângulo —, a
        pergunta é feita ao próprio ângulo, e continua certa se as posições
        mudarem.
      */}
      {LEAVES_BY_STAGE[stage].map((l, i) => {
        const voltadaParaALuz = Math.cos(((l.rotate + 90) * Math.PI) / 180) <= 0;
        return (
          <Leaf
            key={i}
            {...l}
            gradiente={`folha-${idDoGradiente}`}
            iluminada={voltadaParaALuz}
          />
        );
      })}

      <Circle
        cx={CX}
        cy={stemTopY - 4}
        r={bulbR}
        fill={`url(#bulbo-${idDoGradiente})`}
        stroke={tracos.contornoFolha}
        strokeWidth={2.2}
      />
      {/*
        A curva sob o queixo.

        Um arco fraco no terço de baixo do bulbo, do lado da sombra. É o que
        separa uma esfera de um círculo: sem ele o gradiente sozinho ainda lê
        como um disco com degradê. Escala com o raio, porque o bulbo cresce
        entre os estágios e um arco fixo escorregaria para fora dele.
      */}
      <Path
        d={`M ${CX - bulbR * 0.78} ${stemTopY - 4 + bulbR * 0.3} `
          + `C ${CX - bulbR * 0.6} ${stemTopY - 4 + bulbR * 0.74} `
          + `${CX - bulbR * 0.15} ${stemTopY - 4 + bulbR * 0.96} `
          + `${CX + bulbR * 0.3} ${stemTopY - 4 + bulbR * 0.89}`}
        stroke={tracos.bulboCurva}
        strokeWidth={3}
        opacity={0.3}
        strokeLinecap="round"
        fill="none"
      />

      <Face mood={mood} cx={CX} cy={stemTopY - 4} />
      <Decorations list={decorations} cx={CX} cy={stemTopY - 4} />
        </>
      )}
    </Svg>
  );
}

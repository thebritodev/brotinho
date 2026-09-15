import React, { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { palette, tracos } from '../../theme/tokens';
import { cresce, curva, desloca, gira } from './movimentoDaCena';
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

/*
  ## A animação de toque

  Tocar num tema faz a cena dele se mexer antes de a tela trocar. Não é enfeite
  solto: cada movimento é o que *aquele objeto* faria — a ampulheta escorre, a
  chama treme, as gotas caem. É o que separa treze cartões coloridos de treze
  coisas.

  ### O passo é um número comum, e isso foi aprendido apanhando

  A primeira versão animava um `Animated.createAnimatedComponent(G)` e passava
  valores interpolados direto para as propriedades do SVG. **Não funciona no
  react-native-web**: o Animated entrega valor novo chamando `setNativeProps`,
  que os nós do `react-native-svg` não implementam ali. O cronômetro rodava — a
  navegação esperava os 350 ms certinhos — e o desenho ficava parado.

  Como a versão web é a única superfície em que este app consegue ser conferido
  sem um aparelho na mão, uma animação que só existe no nativo é uma animação
  que ninguém verificou. Então o `Animated.Value` agora só alimenta um número, e
  a cena inteira é função dele: `transform` sai como texto comum, do mesmo jeito
  em toda plataforma.

  O custo é re-renderizar a cena a cada quadro, em vez de empurrar propriedade.
  São vinte e um quadros de um SVG de uma dúzia de formas, num cartão só — nada
  perto do que custa montar a tela seguinte.

  ### Quem manda no tempo

  Todas as cenas recebem o mesmo `p`, de 0 a 1, e decidem sozinhas o que fazer
  com ele. Cena nenhuma controla duração, curva ou repetição — isso é do cartão,
  em `PracticeTopicCard`, e por isso as treze duram o mesmo e param juntas.
*/

type CenaProps = {
  /** O passo da animação de toque: 0 parada, 1 no fim. */
  p: number;
};

function Ansiedade({ p }: CenaProps) {
  return (
    <>
      {/* Três rajadas e uma folha levada: agitação, sem desenhar ninguém. */}
      {/* No toque o vento passa: as rajadas varrem para a direita e somem na
          borda, e a folha é levada junto, girando. */}
      <G transform={desloca(curva(p, [0, 5, 9, 11, 12]), 0)} opacity={curva(p, [0.5, 0.5, 0.36, 0.16, 0])}>
        {[
          'M7 21 Q21 15 33 21',
          'M11 31 Q27 24 43 31',
          'M9 41 Q23 35 35 41',
        ].map((d) => (
          <Path key={d} d={d} stroke={palette.brown400} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        ))}
      </G>
      <G
        transform={[
          desloca(curva(p, [0, 2, 5, 7, 8]), curva(p, [0, -2, -1, 1, 3])),
          gira(curva(p, [0, -14, -26, -34, -40]), 48, 17),
        ].join(' ')}
      >
        <Path
          d={FOLHA}
          fill={tracos.folhaClara}
          stroke={tracos.contornoFolha}
          strokeWidth={2.4}
          transform="translate(48 17) rotate(-34) scale(0.3)"
        />
      </G>
    </>
  );
}

function Tristeza({ p }: CenaProps) {
  return (
    <>
      {/* Nuvem, chuva fina e uma poça: o dia que não passa. */}
      {/* A nuvem afunda um pouco no toque, como quem solta o peso. */}
      <G transform={desloca(0, curva(p, [0, 0.6, 1.2, 1.6, 1.8]))}>
        <Path
          d="M19 30 C14 30 11 27 11 23.5 C11 20 14 17 18 17.5 C19 12 24 9 29 10 C34 11 37 15 37 19.5 C41 19 45 22 45 26 C45 28.5 43 30 40 30 Z"
          fill={palette.cream100}
          stroke={CONTORNO}
          strokeWidth={TRACO}
          strokeLinejoin="round"
        />
      </G>
      {/*
        As gotas caem e desaparecem antes de encostar na poça.

        Sumir no meio do caminho é de propósito: gota que chega até a água teria
        de espirrar, e espirro num desenho de doze pontos de altura vira sujeira.
      */}
      <G transform={desloca(0, curva(p, [0, 3, 6, 9, 11]))} opacity={curva(p, [1, 1, 0.8, 0.4, 0])}>
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
      </G>
      {/* A poça recebe o que caiu e se espalha. */}
      <G transform={cresce(curva(p, [1, 1.06, 1.14, 1.2, 1.24]), 30, 50)}>
        <Ellipse cx={30} cy={50} rx={13} ry={3} fill={palette.blue100} />
      </G>
    </>
  );
}

function Luto({ p }: CenaProps) {
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
      {/*
        A folha caída se ajeita: gira pouco e assenta.

        É o movimento mais contido dos treze, e tem de ser. Luto não pede
        animação animada — pede que a coisa se mexa uma vez e pare.
      */}
      <G
        transform={[
          desloca(0, curva(p, [0, 0.4, 0.9, 1.1, 1.2])),
          gira(curva(p, [0, -3, -4.5, -3, 0]), 34, 38),
        ].join(' ')}
      >
        <Path
          d={FOLHA}
          fill={tracos.folha}
          stroke={tracos.contornoFolha}
          strokeWidth={2}
          transform="translate(45 33) rotate(163) scale(0.45)"
        />
      </G>
    </>
  );
}

function Insonia({ p }: CenaProps) {
  const estrelas = [
    { x: 42, y: 20, r: 3.2 },
    { x: 46, y: 34, r: 2.2 },
  ];
  /*
    As duas estrelas piscam fora de compasso.

    Juntas viravam um pisca-pisca de árvore de Natal. Defasadas, a cena fica
    com a inquietação que o tema pede: alguma coisa sempre se mexendo quando
    você queria que tudo parasse.
  */
  const brilho: [number, number, number, number, number][] = [
    [1, 0.35, 1, 0.5, 1],
    [1, 1, 0.3, 1, 0.45],
  ];
  return (
    <>
      {/* Lua e duas estrelas: a noite acordada. */}
      {/* A lua inclina devagar, como quem vira na cama. */}
      <G transform={gira(curva(p, [0, -3, -6, -8, -9]), 28, 30)}>
        <Path
          d="M34 11 C25 13 18 21 18 30 C18 39 25 47 34 48 C28 43 25 37 25 30 C25 23 28 16 34 11 Z"
          fill={palette.yellow100}
          stroke={CONTORNO}
          strokeWidth={TRACO}
          strokeLinejoin="round"
        />
      </G>
      {estrelas.map((e, i) => (
        <G key={e.x} opacity={curva(p, brilho[i])}>
          <Path
            d={`M${e.x} ${e.y - e.r} L${e.x + e.r * 0.34} ${e.y - e.r * 0.34} L${e.x + e.r} ${e.y} L${e.x + e.r * 0.34} ${e.y + e.r * 0.34} L${e.x} ${e.y + e.r} L${e.x - e.r * 0.34} ${e.y + e.r * 0.34} L${e.x - e.r} ${e.y} L${e.x - e.r * 0.34} ${e.y - e.r * 0.34} Z`}
            fill={palette.amber400}
          />
        </G>
      ))}
    </>
  );
}

function Estresse({ p }: CenaProps) {
  return (
    <>
      {/*
        Uma pedra pesada, e uma folha que continua saindo debaixo dela.

        A primeira versão era uma cúpula lisa com um brilho curvo em cima, e no
        tamanho real lia como tampa de travessa. Pedra tem quina: a silhueta
        agora é quebrada, e a face clara é um plano, não um reflexo.
      */}
      {/*
        No toque a pedra afunda, e a folha escapa por baixo.

        Os dois movimentos são o mesmo gesto visto de dois lados: a pedra
        desce um ponto e meio, a folha sai. Se só a pedra afundasse, seria peso;
        se só a folha saísse, seria fuga. Juntos é o que o tema diz — apertado,
        e ainda assim passando.
      */}
      <G transform={desloca(0, curva(p, [0, 0.7, 1.3, 1.6, 1.5]))}>
        <Path
          d="M11 46 L15 31 L24 23 L37 26 L47 38 L48 46 Z"
          fill={palette.slate300}
          stroke={CONTORNO}
          strokeWidth={TRACO}
          strokeLinejoin="round"
        />
        <Path d="M15 31 L24 23 L31 33 L19 39 Z" fill={palette.slate100} opacity={0.85} />
        <Path d="M31 33 L47 38 L48 46 L33 46 Z" fill={CONTORNO} opacity={0.12} />
      </G>
      <G
        transform={[
          desloca(curva(p, [0, 1.4, 2.8, 3.8, 4.4]), 0),
          gira(curva(p, [0, -3, -6, -8, -9]), 53, 45),
        ].join(' ')}
      >
        <Path
          d={FOLHA}
          fill={tracos.folha}
          stroke={tracos.contornoFolha}
          strokeWidth={2.6}
          transform="translate(53 45) rotate(-28) scale(0.26)"
        />
      </G>
    </>
  );
}

function Solidao({ p }: CenaProps) {
  return (
    <>
      {/* Um vaso com broto e o contorno vazio de outro: a falta, desenhada. */}
      {/*
        O broto se inclina na direção do vaso vazio — e não alcança.

        O giro sai da boca do vaso, não do meio da planta: é de lá que um caule
        verga de verdade. E ele volta quase todo no fim, porque o tema é a
        falta, não a companhia: se ficasse inclinado, a cena passaria a contar
        outra história.
      */}
      <G transform={gira(curva(p, [0, 5, 9, 11, 10]), 21, 34)}>
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
      {/* O vaso vazio respira de leve, como se ainda houvesse alguém nele. */}
      <G opacity={curva(p, [1, 0.8, 0.62, 0.8, 1])}>
        <Path
          d="M35 36 L49 36 L47.5 47 C47.5 48.4 46.3 49.2 42 49.2 C37.7 49.2 36.5 48.4 36.5 47 Z"
          fill="none"
          stroke={palette.brown400}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeDasharray="3.5 3.5"
        />
      </G>
    </>
  );
}

function Raiva({ p }: CenaProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <>
      <Defs>
        <RadialGradient id={`brasa-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={BRASA} stopOpacity={0.5} />
          <Stop offset="1" stopColor={BRASA} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* A brasa pulsa por baixo, um tempo atrás da chama. */}
      <G transform={cresce(curva(p, [1, 1.16, 1.28, 1.14, 1]), 30, 44)}>
        <Ellipse cx={30} cy={44} rx={16} ry={9} fill={`url(#brasa-${id})`} />
      </G>
      {/* Chama: o corpo antes da palavra. */}
      {/*
        Ela treme esticando, e não girando.

        Fogo que balança para os lados vira bandeira. O que faz uma chama
        parecer chama é subir e encolher — por isso a escala é só no eixo Y, e
        com origem na base: a ponta se mexe, o pé fica onde está.
      */}
      <G transform={cresce(curva(p, [1, 1.1, 0.95, 1.06, 1]), 30, 47)}>
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
      </G>
    </>
  );
}

function Procrastinacao({ p }: CenaProps) {
  return (
    /*
      Ampulheta: o tempo que passa enquanto se adia.

      No toque ela pende para um lado, passa do ponto para o outro e assenta —
      e, enquanto isso, a areia escorre: o triângulo de cima encolhe na direção
      do próprio bico, o monte de baixo cresce, e o fio entre os dois aparece.

      Os três movimentos são um só relógio. A areia não espera a balançada
      acabar, porque o tempo não espera ninguém se decidir — que é o assunto
      do tema.
    */
    <G transform={gira(curva(p, [0, -7, 4, -2, 0]), 30, 30)}>
      <Path
        d="M19 15 L41 15 L32 30 L41 45 L19 45 L28 30 Z"
        fill={palette.cream100}
        stroke={CONTORNO}
        strokeWidth={TRACO}
        strokeLinejoin="round"
      />
      {/*
        A areia de cima some **para dentro do bico**, e não para o meio dela.

        A origem da escala é o vértice de baixo do triângulo (31,5 · 29), que é
        justamente onde fica o estrangulamento do vidro. Encolhendo para lá, a
        borda de cima desce enquanto a ponta fica parada — que é como areia
        escoa. Com origem no centro, ela encolheria por todos os lados ao mesmo
        tempo, e pareceria sumir por mágica em vez de escorrer.
      */}
      <G transform={cresce(curva(p, [1, 0.82, 0.58, 0.36, 0.2]), 31.5, 29)}>
        <Path d="M22 18 L38 18 L31.5 29 Z" fill={palette.amber400} />
      </G>
      {/* O monte de baixo cresce a partir do chão do vidro. */}
      <G transform={cresce(curva(p, [1, 1.08, 1.16, 1.24, 1.3]), 30, 42)}>
        <Path d="M24 42 L36 42 L33 37 C32 35.5 28 35.5 27 37 Z" fill={palette.amber400} />
      </G>
      {/* O fio de areia caindo: quase invisível parado, nítido enquanto escorre. */}
      <G opacity={curva(p, [0.35, 1, 1, 0.9, 0.5])}>
        <Path d="M30 30 L30 36" stroke={palette.amber400} strokeWidth={1.6} strokeLinecap="round" />
      </G>
      {[13, 47].map((y) => (
        <Path key={y} d={`M15 ${y} L45 ${y}`} stroke={palette.brown700} strokeWidth={3.4} strokeLinecap="round" />
      ))}
    </G>
  );
}

function Autoestima({ p }: CenaProps) {
  return (
    <>
      {/* Espelho: olhar para si sem inventar um rosto para a pessoa. */}
      <Path d="M27 44 L33 44 L34 50 L26 50 Z" fill={palette.brown700} stroke={CONTORNO} strokeWidth={1.4} strokeLinejoin="round" />
      <Ellipse cx={30} cy={27} rx={14} ry={17} fill={palette.amber100} stroke={palette.brown700} strokeWidth={3.4} />
      {/*
        O brilho corre pelo vidro, de cima a baixo.

        É o único movimento da cena, e é o certo: espelho não balança nem
        pulsa — ele pega a luz. O reflexo entra fraco, ganha força no meio da
        travessia e sai, como quem passa na frente de uma janela.
      */}
      <G
        transform={desloca(curva(p, [-2, -1, 0, 1, 2]), curva(p, [-7, -3.5, 0, 3.5, 7]))}
        opacity={curva(p, [0.75, 0.95, 1, 0.8, 0.55])}
      >
        <Path d="M24 34 C21 29 22 21 27 16" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none" />
      </G>
    </>
  );
}

function Culpa({ p }: CenaProps) {
  return (
    /*
      A trouxa balança pendurada pelo nó.

      A origem do giro é o nó, no alto — é de lá que uma trouxa pende. E o
      balanço é lento e curto: peso grande oscila devagar. Se fosse rápido, a
      cena diria que a trouxa está vazia, que é o contrário do tema.
    */
    <G transform={gira(curva(p, [0, 4, -3, 1.5, 0]), 30, 19)}>
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
    </G>
  );
}

function Comparacao({ p }: CenaProps) {
  return (
    <>
      {/* Dois brotos de tamanhos diferentes, na mesma terra. */}
      <Path d="M8 46 C8 42 15 40 30 40 C45 40 52 42 52 46 Z" fill={TERRA} />
      {/*
        O broto pequeno estica — e para bem antes de alcançar o grande.

        Ele cresce 16% e o outro não se mexe. É o tema inteiro num gesto: o
        esforço é real, acontece, e mesmo assim a distância continua lá. Se ele
        chegasse ao mesmo tamanho, a cena viraria uma promessa que o app não
        tem como cumprir.
      */}
      <G transform={cresce(curva(p, [1, 1.05, 1.09, 1.12, 1.1]), 19, 41)}>
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

function Foco({ p }: CenaProps) {
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
      {/*
        A lupa aproxima.

        Cabo e lente crescem juntos, a partir do punho lá embaixo à direita —
        que é o ponto que fica parado quando alguém chega uma lupa para perto
        dos olhos. Crescer a partir do centro da lente faria o cabo esticar
        para os dois lados, e lupa não tem cabo dos dois lados.
      */}
      <G transform={cresce(curva(p, [1, 1.05, 1.1, 1.13, 1.12]), 47, 47)}>
        <Path d="M35 35 L47 47" stroke={palette.brown700} strokeWidth={5} strokeLinecap="round" />
        <Circle cx={26} cy={26} r={13} fill={palette.blue100} stroke={CONTORNO} strokeWidth={2.4} />
        <Path d="M19 22 C20 18 23 15 27 14" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.8} />
      </G>
    </>
  );
}

function Gratidao({ p }: CenaProps) {
  /*
    As três frutas quicam na cesta, uma atrás da outra.

    A defasagem é o ponto: subindo juntas, a cesta inteira pareceria um bloco
    saltando. Escalonadas, cada fruta é uma coisa — que é o que se quer num
    tema sobre reparar em três coisas boas, uma de cada vez.
  */
  const quique: [number, number, number, number, number][] = [
    [0, -4, -1.5, 0, 0],
    [0, -1.5, -4.5, -1, 0],
    [0, 0, -2, -4, 0],
  ];
  return (
    <>
      {/* Cesta com o que foi colhido: o que já está aqui. */}
      <Path d="M18 33 C18 24 42 24 42 33" stroke={palette.brown700} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      {[
        { x: 23, y: 29, c: palette.terracotta400 },
        { x: 30, y: 26, c: palette.amber400 },
        { x: 37, y: 29, c: palette.terracotta400 },
      ].map((f, i) => (
        <G key={f.x} transform={desloca(0, curva(p, quique[i]))}>
          <Circle cx={f.x} cy={f.y} r={4.6} fill={f.c} stroke={CONTORNO} strokeWidth={1.5} />
        </G>
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

const CENAS: Record<Tema, (props: CenaProps) => React.JSX.Element> = {
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
 *
 * `passo` é opcional: sem ele a cena fica parada, que é o que se quer em todo
 * lugar onde o desenho é só ilustração — o carrossel, a fileira de recentes, o
 * cabeçalho de um tema aberto. Quem anima é quem pode ser tocado.
 */
export function DesenhoDoTema({
  tema,
  size = 46,
  passo = 0,
}: {
  tema: string;
  size?: number;
  /** O passo da animação de toque, de 0 a 1. Ver `useToqueAnimado`. */
  passo?: number;
}) {
  if (!ehTemaDesenhado(tema)) return null;
  const Cena = CENAS[tema];
  return (
    <Svg viewBox="0 0 60 60" width={size} height={size}>
      <Cena p={passo} />
    </Svg>
  );
}

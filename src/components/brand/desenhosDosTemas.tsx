import React, { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { palette, tracos } from '../../theme/tokens';
import { cresce, curva, desloca, estica, gira } from './movimentoDaCena';
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
      {/*
        Água parada, dois juncos e uma folha pousada nela.

        Era o oposto: três rajadas varrendo a cena e uma folha sendo levada,
        girando. Aquilo desenhava a ansiedade — e o cartão hoje diz "Acalmar a
        ansiedade". Imagem de agitação embaixo de uma palavra de calma faz a
        pessoa ler duas coisas e acreditar na imagem.

        Água porque é o oposto exato de vento, e porque não se repete em
        nenhuma das outras doze cenas. As práticas deste tema começam pelo
        corpo — é isso que está desenhado: o corpo depois que desacelerou.
      */}

      {/*
        Os juncos ficam **atrás** da água, e é o que dá profundidade à cena:
        eles entram nela em vez de pousarem por cima. Balançam um fio de
        ponto no toque, cada um no seu tempo, como o broto da Composta.
      */}
      <G transform={gira(curva(p, [0, -1.4, -2.2, -1.2, 0]), 14, 36)}>
        <Path
          d="M14 36 C12.6 30 13 25 14.6 19.5"
          stroke={tracos.haste}
          strokeWidth={1.7}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={FOLHA}
          fill={tracos.folhaClara}
          stroke={tracos.contornoFolha}
          strokeWidth={3.4}
          transform="translate(14.8 20.4) rotate(-122) scale(0.12)"
        />
      </G>
      <G transform={gira(curva(p, [0, 1, 2.1, 1.6, 0]), 18.5, 36)}>
        <Path
          d="M18.5 36 C17.9 32 18.3 27.6 19.6 24"
          stroke={tracos.haste}
          strokeWidth={1.4}
          strokeLinecap="round"
          fill="none"
        />
      </G>

      {/*
        A água tem contorno, e o tom dela é o médio, não o claro.

        A primeira versão usava `blue100` sem traço nenhum — e o tom do cartão
        da ansiedade é justamente um azul claro. Ficavam duas manchas quase
        iguais uma sobre a outra: sobrava uma folha pousada no nada.

        As outras doze cenas todas têm contorno; esta não tinha. Era a única
        coisa a consertar.
      */}
      <Ellipse
        cx={30}
        cy={35}
        rx={20}
        ry={7.5}
        fill={palette.blue300}
        stroke={CONTORNO}
        strokeWidth={TRACO}
      />
      <Ellipse cx={30} cy={33.4} rx={14} ry={4} fill={palette.blue100} opacity={0.75} />
      {/* Dois riscos de luz deitados na água: é o que faz ela parecer lisa. */}
      <Path
        d="M20 32.4 C23 31.6 26 31.5 29 32"
        stroke={palette.cream100}
        strokeWidth={1.3}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
      <Path
        d="M33 36.4 C35.5 36 38 35.9 40 36.2"
        stroke={palette.cream100}
        strokeWidth={1.1}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />

      {/*
        A pedra meio submersa, encostada na borda de trás.

        Ela é o que estava faltando para a água ter margem: sem nada dentro
        dela, a elipse lia como um prato. A parte de baixo fica escondida pela
        própria água, que é desenhada antes dela.
      */}
      <Path
        d="M41 33.6 C41.6 30.6 44.4 29.4 46.4 30.6 C48.2 31.7 48.4 33.4 47.8 34.4 Z"
        fill={TERRA_CLARA}
        stroke={CONTORNO}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path
        d="M43 32.6 C43.6 31.4 45 31 45.8 31.5"
        stroke={palette.cream100}
        strokeWidth={0.9}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />

      {/*
        Um anel só, abrindo devagar até sumir na borda.

        Dois ou três anéis viram chuva caindo na poça, que era a cena da
        tristeza. Um anel que abre e some diz o contrário: alguma coisa
        encostou uma vez, e a água voltou a ficar lisa.
      */}
      <G
        transform={cresce(curva(p, [0.34, 0.6, 0.85, 1.05, 1.2]), 30, 35)}
        opacity={curva(p, [0.7, 0.55, 0.38, 0.18, 0])}
      >
        <Ellipse cx={30} cy={35} rx={16} ry={6} fill="none" stroke={palette.cream100} strokeWidth={1.8} />
      </G>

      {/* A folha sobe e desce um fio de ponto, como quem boia. */}
      <G transform={desloca(0, curva(p, [0, -0.7, -1, -0.5, 0]))}>
        {/* A sombra dela na água, que é o que a pousa de verdade. */}
        <Ellipse cx={31.4} cy={35.8} rx={5.4} ry={1.7} fill={palette.blue300} opacity={0.55} />
        <Path
          d={FOLHA}
          fill={tracos.folha}
          stroke={tracos.contornoFolha}
          strokeWidth={2.4}
          transform="translate(37 33) rotate(-14) scale(0.3)"
        />
        {/* A nervura, o mesmo detalhe que as folhas do broto ganharam. */}
        <Path
          d="M35.8 33.4 C33.6 32.6 31.6 31.6 30.2 30.4"
          stroke={tracos.contornoFolha}
          strokeWidth={0.9}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
      </G>
    </>
  );
}

function Tristeza({ p }: CenaProps) {
  return (
    <>
      {/*
        O sol que estava atrás o tempo todo, e a nuvem saindo da frente dele.

        Era nuvem, chuva fina e poça — o dia que não passa. O cartão diz
        "Atravessar a tristeza", e atravessar tem um outro lado; a cena não
        mostrava nenhum.
      */}

      {/*
        Os raios aparecem conforme a nuvem sai, e não antes.

        Eles são a recompensa do movimento: parados, a cena já entregaria o
        outro lado de graça. A opacidade deles é a mesma conta do passo.
      */}
      <G opacity={curva(p, [0, 0.15, 0.45, 0.75, 1])}>
        {[
          'M54.5 21 L58 21',
          'M52.6 13.6 L55 11',
          'M52.6 28.4 L55 31',
          'M47.5 9 L49 6',
          'M47.5 33 L49 36',
        ].map((d) => (
          <Path key={d} d={d} stroke={palette.yellow300} strokeWidth={2} strokeLinecap="round" />
        ))}
      </G>
      <Circle cx={43} cy={21} r={11} fill={palette.yellow300} stroke={CONTORNO} strokeWidth={TRACO} />
      {/* A luz bate no alto à esquerda, como em todo desenho do app. */}
      <Path
        d="M37.5 16.6 C39 14 42 12.6 45 13"
        stroke={palette.cream100}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.75}
      />

      {/*
        Uma segunda nuvem, menor e atrás, andando menos.

        Ela é profundidade barata e honesta: duas camadas a velocidades
        diferentes leem como céu, e não como adesivo colado no fundo. Sem
        contorno, de propósito — contorno a traria para a frente.
      */}
      <G transform={desloca(curva(p, [0, -0.8, -1.8, -2.6, -3.4]), 0)}>
        <Path
          d="M13 22.5 C9.6 22.5 7.6 20.6 7.6 18.2 C7.6 15.8 9.8 14 12.4 14.4 C13.4 11.4 16.4 9.8 19.4 10.6 C22.4 11.4 24 13.6 24 16"
          fill={palette.cream200}
          opacity={0.9}
        />
      </G>

      {/*
        A nuvem continua na cena, e continua inteira.

        Apagá-la diria que a tristeza foi embora, e o intro deste tema diz o
        contrário com todas as letras: "não é um problema a resolver". Ela sai
        da frente do sol — oito pontos, no toque — e para. O que muda é o que
        ela está tapando, não que ela exista.
      */}
      <G transform={desloca(curva(p, [0, -2, -4.5, -6.5, -8]), 0)}>
        <Path
          d="M19 31 C14 31 11 28 11 24.5 C11 21 14 18 18 18.5 C19 13 24 10 29 11 C34 12 37 16 37 20.5 C41 20 45 23 45 27 C45 29.5 43 31 40 31 Z"
          fill={palette.cream100}
          stroke={CONTORNO}
          strokeWidth={TRACO}
          strokeLinejoin="round"
        />
        {/*
          A barriga da nuvem, um tom abaixo: é o que dá volume a ela.

          Fica **dentro** do contorno, encostada na base, e não é uma segunda
          forma por cima — nuvem com dois contornos vira duas nuvens.
        */}
        <Path
          d="M16 27.6 C19.4 29.2 24 29.6 29 29.6 C33 29.6 36.6 29.2 40 28.2 C39.4 29.4 38 29.9 36 29.9 L19.6 29.9 C18 29.9 16.8 29.2 16 27.6 Z"
          fill={palette.cream200}
          opacity={0.75}
        />
        {/* E um risco de luz na borda de cima, do lado onde o sol bate. */}
        <Path
          d="M22.6 13.6 C25.6 12 29.6 12.2 32.4 14.4"
          stroke="#FFFFFF"
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
          opacity={0.85}
        />
      </G>

      {/*
        A poça do que já choveu saiu daqui.

        Ela ficava em y=47, e a borda do cartão corta o desenho em y=40: a
        poça inteira caía fora, sozinha sobre o creme da página. É a mancha
        solta que a nota do topo deste arquivo proíbe — a mesma razão que
        tirou as sombras de chão das treze cenas.

        Não fez falta. O sol saindo de trás da nuvem já é a frase inteira, e
        uma poça embaixo dele voltava a falar de chuva.
      */}
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
        A folha caída fica, e ao lado dela um broto novo.

        A cena era só a perda: o galho vazio e a folha no chão. O cartão passou
        a dizer "Seguir com a saudade", e seguir é a segunda metade que faltava
        desenhar — a mesma que a prática "O que ficou de herança" trabalha.

        O broto é pequeno de propósito, e não substitui a folha: nasce **do
        lado**, na mesma terra. Se ele tomasse o lugar dela, a cena diria que a
        perda virou outra coisa, que é a frase que ninguém enlutado suporta
        ouvir.
      */}
      <Path
        d="M8 20 C16 22 22 24 27 27"
        stroke={tracos.haste}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.75}
      />
      {/*
        Dois galhinhos saindo do galho: é o que o faz ler como galho, e não
        como um cabo. Nenhum deles tem folha — é esse o assunto.
      */}
      <Path
        d="M15 21.2 C16.4 18.6 17.6 17.4 19.6 16.4"
        stroke={tracos.haste}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
      <Path
        d="M22 23.4 C23.6 21.6 25.4 20.8 27.4 20.6"
        stroke={tracos.haste}
        strokeWidth={1.3}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      <Path d="M9 45 C9 42 17 40 30 40 C43 40 51 42 51 45 Z" fill={`url(#terra-${id})`} opacity={0.9} />
      {/* Torrõezinhos na terra, para ela não ser uma faixa chapada. */}
      {[
        { x: 14, y: 43, r: 1.5 },
        { x: 24, y: 44, r: 1.1 },
        { x: 39, y: 43.4, r: 1.3 },
      ].map((t) => (
        <Ellipse key={t.x} cx={t.x} cy={t.y} rx={t.r} ry={t.r * 0.72} fill={TERRA_CLARA} opacity={0.5} />
      ))}
      {/*
        A folha caída se ajeita: gira pouco e assenta. É o movimento mais
        contido dos treze, e tem de ser — luto não pede animação animada.
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
        {/* A nervura da folha caída, o mesmo detalhe das folhas do broto. */}
        <Path
          d="M43.6 34.6 C40.2 36.2 36.4 37.4 33 37.6"
          stroke={tracos.contornoFolha}
          strokeWidth={0.9}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
      </G>
      {/* O broto novo sobe um fio, devagar, e para. */}
      <G transform={cresce(curva(p, [1, 1.05, 1.1, 1.14, 1.16]), 16, 41)}>
        <Path d="M16 41 L16 31" stroke={tracos.haste} strokeWidth={2.2} strokeLinecap="round" />
        <Path
          d={FOLHA}
          fill={tracos.folhaClara}
          stroke={tracos.contornoFolha}
          strokeWidth={3}
          transform="translate(16 31) rotate(-54) scale(0.16)"
        />
        <Path
          d={FOLHA}
          fill={tracos.folha}
          stroke={tracos.contornoFolha}
          strokeWidth={3}
          transform="translate(16 31) rotate(234) scale(0.13)"
        />
      </G>
    </>
  );
}

function Insonia({ p }: CenaProps) {
  const estrelas = [
    { x: 44, y: 18, r: 3 },
    { x: 48, y: 31, r: 2 },
  ];
  return (
    <>
      {/*
        A lua, duas estrelas quietas e uma nuvem baixa assentando.

        As estrelas piscavam fora de compasso de propósito, para dar "a noite
        acordada" — e a noite acordada era o tema quando ele se chamava
        "Insônia". Hoje o cartão diz "Preparar o sono", e o que a cena precisa
        mostrar é o contrário: nada se mexendo quando você quer que tudo pare.

        Agora elas baixam juntas, as duas, até um brilho fraco — e a nuvem desce
        e se acomoda embaixo da lua, como travesseiro recebendo peso.
      */}
      <G transform={gira(curva(p, [0, -1, -2, -2.6, -3]), 28, 28)}>
        <Path
          d="M34 9 C25 11 18 19 18 28 C18 37 25 45 34 46 C28 41 25 35 25 28 C25 21 28 14 34 9 Z"
          fill={palette.yellow100}
          stroke={CONTORNO}
          strokeWidth={TRACO}
          strokeLinejoin="round"
        />
        {/*
          Três crateras, do lado de dentro da foice.

          É o detalhe que faz a lua parar de ser uma fatia de melão: sem elas,
          a forma sozinha não diz que aquilo é pedra iluminada.
        */}
        <Ellipse cx={27.5} cy={19} rx={2.4} ry={2} fill={palette.amber100} opacity={0.85} />
        <Ellipse cx={24.2} cy={29} rx={1.7} ry={1.4} fill={palette.amber100} opacity={0.7} />
        <Ellipse cx={28.6} cy={37} rx={1.3} ry={1.1} fill={palette.amber100} opacity={0.6} />
        {/* A borda iluminada, do lado de fora. */}
        <Path
          d="M32.6 11 C26.4 14.6 22.6 20.8 22.6 27.6"
          stroke="#FFFFFF"
          strokeWidth={1.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.6}
        />
      </G>
      <G opacity={curva(p, [1, 0.86, 0.7, 0.56, 0.45])}>
        {estrelas.map((e) => (
          <Path
            key={e.x}
            d={`M${e.x} ${e.y - e.r} L${e.x + e.r * 0.34} ${e.y - e.r * 0.34} L${e.x + e.r} ${e.y} L${e.x + e.r * 0.34} ${e.y + e.r * 0.34} L${e.x} ${e.y + e.r} L${e.x - e.r * 0.34} ${e.y + e.r * 0.34} L${e.x - e.r} ${e.y} L${e.x - e.r * 0.34} ${e.y - e.r * 0.34} Z`}
            fill={palette.amber400}
          />
        ))}
      </G>
      {/* A nuvem desce e alarga um fio, do jeito que travesseiro cede. */}
      <G
        transform={[
          desloca(0, curva(p, [0, 0.7, 1.3, 1.7, 2])),
          cresce(curva(p, [1, 1.01, 1.02, 1.03, 1.04]), 30, 50),
        ].join(' ')}
      >
        <Path
          d="M14 50 C10 50 8 47.6 8 45 C8 42.2 10.6 40 13.8 40.4 C15 36.6 19 34.4 23 35.4 C26.4 36.2 28.8 39 29.2 42 C33 41.2 37 43.6 37 47 C37 48.8 35.6 50 33 50 Z"
          fill={palette.lavender100}
          stroke={CONTORNO}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {/* A barriga da nuvem, um tom abaixo: peso recebido tem sombra. */}
        <Path
          d="M11.4 46.4 C15 48.4 20 49 25 49 C28.6 49 32 48.6 35 47.8 C34.6 49 33.4 49.6 31.6 49.6 L15.6 49.6 C13.6 49.6 12.2 48.4 11.4 46.4 Z"
          fill={palette.lavender300}
          opacity={0.45}
        />
        {/* E a luz da lua batendo no alto dela. */}
        <Path
          d="M16.6 38.6 C19 37 22.4 37.2 24.6 39"
          stroke="#FFFFFF"
          strokeWidth={1.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.8}
        />
      </G>
    </>
  );
}

function Estresse({ p }: CenaProps) {
  return (
    <>
      {/*
        A pedra no chão, ao lado, e o broto de pé.

        Ela estava **em cima** do broto, e a folha escapava por baixo: peso, e
        alguém passando apesar dele. O cartão diz "Baixar o estresse", e baixar
        é exatamente o que a pedra faz agora — saiu de cima e foi posta no chão.
        Continua ali, e continua pedra: o estresse não evapora, sai de cima.

        Ela foi para a esquerda e encolheu, e o broto ocupa o lugar que era
        dela. Quem está mais alto numa cena é quem manda nela.
      */}
      <G transform={desloca(0, curva(p, [0, 0.5, 0.9, 1.1, 1.2]))}>
        <Path
          d="M8 47 L11 38 L17 33 L26 35 L31 42 L32 47 Z"
          fill={palette.slate300}
          stroke={CONTORNO}
          strokeWidth={TRACO}
          strokeLinejoin="round"
        />
        <Path d="M11 38 L17 33 L21 39 L14 42 Z" fill={palette.slate100} opacity={0.85} />
        {/*
          A rachadura e a segunda quina escura: pedra tem face, e face tem
          aresta. Sem elas o bloco lê como uma mancha cinza com um brilho.
        */}
        <Path
          d="M21 39 L24 43.6 L23 47"
          stroke={CONTORNO}
          strokeWidth={1.2}
          strokeLinecap="round"
          fill="none"
          opacity={0.45}
        />
        <Path d="M26 35 L31 42 L24 43.6 Z" fill={palette.slate300} opacity={0.6} />
      </G>
      {/* Uma lasca menor, caída ao lado: o que saiu de cima não foi só uma peça. */}
      <Path
        d="M33 47 C33.4 44.6 35.6 43.6 37.2 44.4 C38.6 45.2 38.8 46.2 38.4 47 Z"
        fill={palette.slate300}
        stroke={CONTORNO}
        strokeWidth={1.2}
        strokeLinejoin="round"
        opacity={0.9}
      />
      {/* O broto estica, sem pressa, como talo que perdeu o que o dobrava. */}
      <G transform={cresce(curva(p, [1, 1.05, 1.09, 1.12, 1.13]), 41, 48)}>
        <Path d="M41 48 L41 26" stroke={tracos.haste} strokeWidth={2.6} strokeLinecap="round" />
        <Path
          d={FOLHA}
          fill={tracos.folha}
          stroke={tracos.contornoFolha}
          strokeWidth={2.4}
          transform="translate(41 26) rotate(-50) scale(0.27)"
        />
        <Path
          d={FOLHA}
          fill={tracos.folhaClara}
          stroke={tracos.contornoFolha}
          strokeWidth={2.4}
          transform="translate(41 26) rotate(230) scale(0.23)"
        />
      </G>
    </>
  );
}

function Solidao({ p }: CenaProps) {
  return (
    <>
      {/*
        Dois vasos com broto, inclinados um para o outro.

        O segundo vaso era um contorno tracejado e vazio, e o broto do primeiro
        se inclinava **sem alcançar** — a falta, desenhada. Estava certo quando
        o cartão dizia "Solidão".

        Ele diz "Diminuir a solidão", e diminuir é o que a cena faz: o vaso de
        lá agora tem alguém, e os dois se inclinam um para o outro. **Sem
        encostar**, e em vasos separados — o intro do tema define solidão como
        "a distância entre o que você sente e o que os outros sabem", e o que as
        práticas fazem é encurtar essa distância, não apagá-la. Duas plantas no
        mesmo vaso seria outra promessa.
      */}
      <G transform={gira(curva(p, [0, 2.5, 4.5, 6, 6.5]), 19, 35)}>
        <Path
          d="M11 35 L27 35 L25 48 C25 49.6 23.6 50.5 19 50.5 C14.4 50.5 13 49.6 13 48 Z"
          fill={tracos.vaso}
          stroke={CONTORNO}
          strokeWidth={TRACO}
          strokeLinejoin="round"
        />
        {/* A terra na boca do vaso, e a listra de luz no barro. */}
        <Ellipse cx={19} cy={35.4} rx={7.4} ry={2} fill={tracos.terra} opacity={0.85} />
        <Path
          d="M15 38 L14.4 46"
          stroke={tracos.vasoLuz}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.7}
        />
        <Path d="M19 35 L19 27" stroke={tracos.haste} strokeWidth={2.4} strokeLinecap="round" />
        <Path d={FOLHA} fill={tracos.folha} stroke={tracos.contornoFolha} strokeWidth={2.8} transform="translate(19 27) rotate(-50) scale(0.2)" />
        <Path d={FOLHA} fill={tracos.folhaClara} stroke={tracos.contornoFolha} strokeWidth={2.8} transform="translate(19 27) rotate(230) scale(0.17)" />
      </G>
      {/*
        O de lá se inclina na mesma medida, e para junto.

        Ninguém se estica mais do que o outro: a cena é de encontro, não de
        resgate.
      */}
      <G transform={gira(curva(p, [0, -2.5, -4.5, -6, -6.5]), 42, 35)}>
        <Path
          d="M34 35 L50 35 L48 48 C48 49.6 46.6 50.5 42 50.5 C37.4 50.5 36 49.6 36 48 Z"
          fill={tracos.vaso}
          stroke={CONTORNO}
          strokeWidth={TRACO}
          strokeLinejoin="round"
        />
        <Ellipse cx={42} cy={35.4} rx={7.4} ry={2} fill={tracos.terra} opacity={0.85} />
        <Path
          d="M38 38 L37.4 46"
          stroke={tracos.vasoLuz}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.7}
        />
        <Path d="M42 35 L42 28" stroke={tracos.haste} strokeWidth={2.4} strokeLinecap="round" />
        <Path d={FOLHA} fill={tracos.folhaClara} stroke={tracos.contornoFolha} strokeWidth={2.8} transform="translate(42 28) rotate(130) scale(0.18)" />
        <Path d={FOLHA} fill={tracos.folha} stroke={tracos.contornoFolha} strokeWidth={2.8} transform="translate(42 28) rotate(50) scale(0.15)" />
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
          <Stop offset="0" stopColor={BRASA} stopOpacity={0.55} />
          <Stop offset="1" stopColor={BRASA} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/*
        A brasa depois da chama, e um fio de fumaça subindo.

        Era uma chama inteira, tremendo. O cartão diz "Descarregar a raiva", e
        descarregar tem um depois: o que sobra quando o corpo já gastou o que
        tinha para gastar. A brasa é isso, e é o que o intro do tema promete —
        "descarregar o corpo primeiro é o que deixa ver o que tem embaixo".

        Ela não apaga. Fogo apagado diria que a raiva foi embora, e ela não vai:
        baixa de temperatura e fica olhável. Por isso a brasa continua quente no
        meio, com o halo por baixo.
      */}
      <G transform={cresce(curva(p, [1, 1.1, 1.18, 1.1, 1.04]), 30, 38)}>
        <Ellipse cx={30} cy={38} rx={18} ry={10} fill={`url(#brasa-${id})`} />
      </G>
      {/* O fio de fumaça sobe e se desfaz: o único movimento que sobe na cena. */}
      <G transform={desloca(0, curva(p, [0, -2, -4, -6, -8]))} opacity={curva(p, [0.5, 0.45, 0.34, 0.18, 0])}>
        <Path
          d="M30 25 C27 21 33 17 30 12"
          stroke={palette.brown400}
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
        />
      </G>
      {/* O monte de brasa: forma baixa e larga, o oposto da chama que subia. */}
      <G transform={cresce(curva(p, [1, 1.02, 1.01, 0.99, 1]), 30, 41)}>
        {/*
          A silhueta é quebrada, e não um arco.

          Com a borda lisa, um monte cor de fogo subindo do pé do quadrado lê
          como sol nascendo — que é quase o contrário do tema. Carvão tem
          quina: três bossas desiguais, e duas fendas escuras entre elas. É a
          mesma correção que a pedra do estresse já tinha recebido.
        */}
        <Path
          d="M16 41 C17 35 21 31.5 24 32.6 C26 28.6 32 28.6 34 31.8 C38 30 43 34 44 41 Z"
          fill={palette.terracotta400}
          stroke={CONTORNO}
          strokeWidth={TRACO}
          strokeLinejoin="round"
        />
        <Path d="M23 41 C24 37 27 34.8 30 35.6 C33 34.8 36 37 37 41 Z" fill={palette.amber400} />
        {/* As fendas: é por elas que a brasa mostra que ainda está quente. */}
        <Path d="M25 41 L26.5 36.5" stroke={CONTORNO} strokeWidth={1.4} strokeLinecap="round" opacity={0.3} />
        <Path d="M35 41 L33.5 36.5" stroke={CONTORNO} strokeWidth={1.4} strokeLinecap="round" opacity={0.3} />
        {/* O miolo mais quente, bem no meio do monte. */}
        <Path d="M27.6 41 C28.4 38.6 30 37.6 32.4 38 C33.4 39 33.6 40 33.4 41 Z" fill={palette.yellow300} opacity={0.9} />
        {/* Dois torrões de carvão apagado, na frente: o que já queimou. */}
        <Path
          d="M14 41 C14.4 38.8 16.4 37.8 18 38.6 C19.2 39.2 19.4 40.2 19.2 41 Z"
          fill={palette.brown700}
          stroke={CONTORNO}
          strokeWidth={1.2}
          strokeLinejoin="round"
          opacity={0.85}
        />
        <Path
          d="M44 41 C44.4 39.4 46 38.6 47.4 39.2 C48.4 39.8 48.6 40.4 48.4 41 Z"
          fill={palette.brown700}
          stroke={CONTORNO}
          strokeWidth={1.2}
          strokeLinejoin="round"
          opacity={0.7}
        />
      </G>
      {/*
        Duas faíscas subindo com a fumaça, uma atrás da outra.

        Elas sobem mais rápido que o fio de fumaça e apagam antes — brasa
        solta esfria no caminho. É o único movimento rápido da cena, e dura
        pouco de propósito: a raiva aqui já está baixando.
      */}
      <G
        transform={desloca(curva(p, [0, 1, 1.6, 2, 2.2]), curva(p, [0, -5, -10, -15, -19]))}
        opacity={curva(p, [0, 0.9, 0.7, 0.3, 0])}
      >
        <Circle cx={27} cy={30} r={1.3} fill={palette.amber400} />
      </G>
      <G
        transform={desloca(curva(p, [0, -0.8, -1.4, -1.8, -2]), curva(p, [0, -3, -7, -11, -15]))}
        opacity={curva(p, [0, 0.6, 0.8, 0.4, 0])}
      >
        <Circle cx={34} cy={32} r={1} fill={palette.yellow300} />
      </G>
    </>
  );
}

function Procrastinacao({ p }: CenaProps) {
  return (
    /*
      A ampulheta já virada, com areia correndo e monte no fundo.

      Ela pendia para um lado e para o outro antes de assentar — hesitação
      desenhada, que era o tema quando ele se chamava "Procrastinação". Hoje o
      cartão diz "Começar o que você adia", e começar não balança: acontece.

      Então a cena parada já é o depois. O triângulo de cima está pela metade, o
      monte de baixo tem tamanho, e o fio entre os dois está nítido — alguém
      virou isto faz um tempo. No toque só continua: mais areia desce.

      O vidro ficou imóvel. Era ele que balançava, e a ampulheta parada com a
      areia correndo diz a coisa certa: o que se move é o trabalho, não o móvel.
    */
    <G>
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
        escoa.
      */}
      <G transform={cresce(curva(p, [0.62, 0.55, 0.46, 0.36, 0.28]), 31.5, 29)}>
        <Path d="M22 18 L38 18 L31.5 29 Z" fill={palette.amber400} />
      </G>
      {/* O monte de baixo cresce a partir do chão do vidro. */}
      <G transform={cresce(curva(p, [1.3, 1.36, 1.42, 1.47, 1.5]), 30, 42)}>
        <Path d="M24 42 L36 42 L33 37 C32 35.5 28 35.5 27 37 Z" fill={palette.amber400} />
      </G>
      {/* O fio de areia caindo: já nítido parado, porque já começou. */}
      <G opacity={curva(p, [0.9, 1, 1, 0.95, 0.85])}>
        <Path d="M30 30 L30 36" stroke={palette.amber400} strokeWidth={1.6} strokeLinecap="round" />
      </G>
      {/*
        Dois grãos soltos no fio, caindo em tempos diferentes.

        Um fio contínuo é um traço; grão que desce é areia. Eles voltam ao
        alto quando chegam embaixo, dentro do mesmo passo — como todo grão
        que cai numa ampulheta enquanto se olha.
      */}
      <Circle cx={30.6} cy={31} r={0.9} fill={palette.amber700} opacity={0.8} transform={desloca(0, curva(p, [0, 2, 4, 1, 3]))} />
      <Circle cx={29.4} cy={34} r={0.7} fill={palette.amber700} opacity={0.7} transform={desloca(0, curva(p, [0, 1.4, 2.8, 4, 1.4]))} />
      {/*
        O brilho do vidro: uma diagonal no bojo de cima.

        Sem ele o vidro é um contorno vazio; com ele, é vidro. Fica do mesmo
        lado de onde a luz vem em todo desenho do app.
      */}
      <Path
        d="M23.4 17.6 C24.6 20.4 26.4 23.4 28.4 26"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.75}
      />
      {[13, 47].map((y) => (
        <Path key={y} d={`M15 ${y} L45 ${y}`} stroke={palette.brown700} strokeWidth={3.4} strokeLinecap="round" />
      ))}
      {/* Um fio claro em cada tampa de madeira: elas ganham espessura. */}
      {[11.8, 45.8].map((y) => (
        <Path
          key={y}
          d={`M17 ${y} L43 ${y}`}
          stroke={palette.brown400}
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.75}
        />
      ))}
    </G>
  );
}

function Autoestima({ p }: CenaProps) {
  return (
    <>
      {/*
        O espelho, e no vidro um broto.

        Ele estava vazio, com um brilho correndo pelo nada. O cartão diz
        "Melhorar a autoestima", e o intro do tema diz como: "se constrói
        reparando no que já está lá". Então o espelho devolve uma planta, e ela
        está ali antes de qualquer toque — não é recompensa, é o que já havia.

        Continua sem rosto: desenhar alguém seria dizer com que cara a pessoa
        deveria se ver. O broto é o mesmo do app inteiro, e quem olha se
        reconhece nele porque já o viu crescer.
      */}
      <Path d="M27 44 L33 44 L34 50 L26 50 Z" fill={palette.brown700} stroke={CONTORNO} strokeWidth={1.4} strokeLinejoin="round" />
      {/* O lado iluminado do pé, para ele ter volume como o vaso tem. */}
      <Path d="M28 44.6 L27.4 49.4" stroke={palette.brown400} strokeWidth={1.2} strokeLinecap="round" opacity={0.8} />
      <Ellipse cx={30} cy={26} rx={14} ry={17} fill={palette.amber100} stroke={palette.brown700} strokeWidth={3.4} />
      {/*
        O aro de dentro, um fio mais claro por dentro da moldura.

        É o que separa moldura de vidro. Sem ele, a elipse grossa lê como um
        ovo, e não como um espelho.
      */}
      <Ellipse
        cx={30}
        cy={26}
        rx={11.6}
        ry={14.6}
        fill="none"
        stroke={palette.amber400}
        strokeWidth={1.2}
        opacity={0.55}
      />
      {/* O reflexo cresce um fio no toque: reparar em si mesmo por um segundo a
          mais já muda o tamanho do que se vê. */}
      <G transform={cresce(curva(p, [1, 1.03, 1.06, 1.08, 1.09]), 30, 37)}>
        <Path d="M30 37 L30 26" stroke={tracos.haste} strokeWidth={2.2} strokeLinecap="round" />
        <Path d={FOLHA} fill={tracos.folha} stroke={tracos.contornoFolha} strokeWidth={3} transform="translate(30 26) rotate(-52) scale(0.17)" />
        <Path d={FOLHA} fill={tracos.folhaClara} stroke={tracos.contornoFolha} strokeWidth={3} transform="translate(30 26) rotate(232) scale(0.14)" />
      </G>
      {/* O brilho do vidro continua, e agora passa por cima do reflexo. */}
      <G
        transform={desloca(curva(p, [-2, -1, 0, 1, 2]), curva(p, [-7, -3.5, 0, 3.5, 7]))}
        opacity={curva(p, [0.5, 0.7, 0.8, 0.6, 0.4])}
      >
        <Path d="M22 32 C19 27 20 19 25 14" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none" />
      </G>
    </>
  );
}

function Culpa({ p }: CenaProps) {
  return (
    <>
      {/*
        A trouxa desamarrada e aberta, com o que estava dentro à vista.

        Ela estava pendurada pelo nó, balançando devagar — o peso que se carrega
        sem abrir. O cartão diz "Aliviar a culpa e a vergonha", e a prática que
        dá nome a isto se chama "Tirar a vergonha do escuro". Escuro é o
        assunto; abrir é o remédio. A cena mostra o remédio.

        ## A primeira tentativa não deu, e o motivo vale ficar escrito

        Ela tinha as quatro pontas do pano caídas para fora e um facho de luz
        descendo de cima. No tamanho real as pontas viraram asas e o facho virou
        um abajur: três objetos que ninguém pediu, e nenhum deles a trouxa.

        Um desenho de doze pontos de altura não comporta encenação. O que
        sobrou é o essencial — a boca aberta, o que havia lá dentro, e o cordão
        solto ao lado, que é a única peça que diz *desamarrada* sem precisar de
        mais nada.

        O pano fica. Não some e não vira outra coisa: continua ali, aberto. O
        que mudou é que dá para ver o que tem dentro.
      */}
      <Path
        d="M11 32 C11 42 18 47 30 47 C42 47 49 42 49 32 Z"
        fill={palette.cream200}
        stroke={CONTORNO}
        strokeWidth={TRACO}
        strokeLinejoin="round"
      />
      {/*
        Dois vincos no pano, descendo da boca.

        Pano aberto cai em prega; sem elas a forma é uma tigela. Ficam curtos
        e desencontrados — vinco simétrico vira costura.
      */}
      <Path
        d="M18.6 35 C19.6 39 21 41.8 22.6 43.6"
        stroke={palette.cream300}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M40 34.6 C39.4 38.6 38.4 41.4 37 43.4"
        stroke={palette.cream300}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />
      {/* A boca do pano. No toque ela abre um fio, só na largura: pano cede
          para os lados, não para cima. */}
      <G transform={estica(curva(p, [1, 1.02, 1.04, 1.06, 1.07]), 1, 30, 32)}>
        <Ellipse cx={30} cy={32} rx={19} ry={6.5} fill={palette.cream300} stroke={CONTORNO} strokeWidth={TRACO} />
        {/* O claro de dentro: é ele que cresce, e é o assunto inteiro. */}
        <G opacity={curva(p, [0.55, 0.7, 0.84, 0.94, 1])}>
          <Ellipse cx={30} cy={32} rx={13} ry={4.2} fill={palette.yellow100} />
        </G>
      </G>
      {/*
        O que estava guardado: um papel dobrado, e não uma bolinha.

        Era um círculo âmbar dentro do claro amarelo, e no tamanho real virava
        gema de ovo numa tigela. Papel resolve duas coisas de uma vez: não se
        parece com comida, e é o que as três práticas deste tema pedem — "O
        tamanho real da culpa", "Tirar a vergonha do escuro" e "De quem é essa
        régua" são todas de escrever.
      */}
      <G transform={gira(-8, 30, 31)}>
        <Path
          d="M24 27 L36 27 L36 35 L24 35 Z"
          fill={palette.cream100}
          stroke={CONTORNO}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <Path d="M26.5 30 L33.5 30" stroke={palette.brown400} strokeWidth={1.3} strokeLinecap="round" />
        <Path d="M26.5 32.5 L31.5 32.5" stroke={palette.brown400} strokeWidth={1.3} strokeLinecap="round" />
        {/* A dobra do canto: papel guardado no escuro volta amassado. */}
        <Path d="M36 27 L32.6 27 L36 30.4 Z" fill={palette.cream300} stroke={CONTORNO} strokeWidth={1.2} strokeLinejoin="round" />
      </G>
      {/* O cordão que amarrava, largado ao lado e no chão. Ele não se mexe: já
          fez o que tinha de fazer. */}
      <Path
        d="M44 37 C47 34.5 50 38 53 35.5"
        stroke={palette.brown400}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

function Comparacao({ p }: CenaProps) {
  return (
    <>
      {/*
        Os dois brotos continuam de tamanhos diferentes. O que mudou é para onde
        o pequeno olha.

        A versão anterior tinha ele esticando 16% e parando bem antes de
        alcançar o grande — "o esforço é real, acontece, e mesmo assim a
        distância continua lá". Essa honestidade fica: igualar os dois seria uma
        promessa que o app não tem como cumprir, e o cartão não pede isso. Ele
        diz "Parar de se comparar", e parar de comparar não é alcançar — é
        deixar de usar o outro como régua.

        Então o pequeno ganhou um sol só dele, fora do eixo entre os dois, e é
        para lá que ele se vira no toque: para longe do grande. A distância não
        muda um ponto. O que muda é que ela deixou de ser o assunto.
      */}
      <Path d="M8 46 C8 42 15 40 30 40 C45 40 52 42 52 46 Z" fill={TERRA} />
      {/* Torrões na terra, os mesmos da cena do luto: é o mesmo canteiro. */}
      {[
        { x: 13, y: 43.6, r: 1.4 },
        { x: 30, y: 44.4, r: 1.1 },
        { x: 47, y: 43.8, r: 1.2 },
      ].map((t) => (
        <Ellipse key={t.x} cx={t.x} cy={t.y} rx={t.r} ry={t.r * 0.72} fill={TERRA_CLARA} opacity={0.5} />
      ))}
      <G transform={cresce(curva(p, [1, 1.04, 1.08, 1.12, 1.14]), 10, 25)} opacity={curva(p, [0.85, 0.9, 0.95, 1, 1])}>
        {/* Os raios curtos, do lado de quem olha para ele. */}
        {['M19.4 25 L22 25', 'M17.4 19.6 L19.2 17.8', 'M17.4 30.4 L19.2 32.2'].map((d) => (
          <Path key={d} d={d} stroke={palette.yellow300} strokeWidth={1.8} strokeLinecap="round" />
        ))}
        <Circle cx={10} cy={25} r={7.5} fill={palette.yellow300} stroke={palette.amber400} strokeWidth={1.4} />
        <Path
          d="M5.6 21.6 C6.6 19.6 8.6 18.4 10.8 18.4"
          stroke="#FFFFFF"
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
        />
      </G>
      {/* O pequeno se vira para o sol dele. Gira a partir da terra, que é de
          onde um caule verga. */}
      <G transform={gira(curva(p, [0, -3, -6, -8, -9]), 19, 41)}>
        <Path d="M19 41 L19 31" stroke={tracos.haste} strokeWidth={2.4} strokeLinecap="round" />
        <Path d={FOLHA} fill={tracos.folha} stroke={tracos.contornoFolha} strokeWidth={2.8} transform="translate(19 31) rotate(-52) scale(0.19)" />
        <Path d={FOLHA} fill={tracos.folhaClara} stroke={tracos.contornoFolha} strokeWidth={2.8} transform="translate(19 31) rotate(232) scale(0.16)" />
      </G>
      {/* O grande não se mexe, e não é castigo: ele nunca esteve fazendo nada. */}
      <G>
        <Path d="M41 41 L41 19" stroke={tracos.haste} strokeWidth={2.6} strokeLinecap="round" />
        {/* Uma terceira folha, mais baixa: é o que faz ele ler como o maior. */}
        <Path d={FOLHA} fill={tracos.folhaClara} stroke={tracos.contornoFolha} strokeWidth={2.8} transform="translate(41 28) rotate(206) scale(0.19)" />
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
        {/* A empunhadura: dois anéis no cabo, onde a mão segura. */}
        <Path d="M41.4 41.4 L44 44" stroke={palette.brown400} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        <Circle cx={26} cy={26} r={13} fill={palette.blue100} stroke={CONTORNO} strokeWidth={2.4} />
        {/*
          O que a lupa mostra: um pedaço de folha, grande.

          É o assunto do tema — uma coisa por vez, de perto. A folha de fora
          continua pequena; dentro do vidro ela aparece no tamanho de quem
          está prestando atenção nela.
        */}
        <Path
          d={FOLHA}
          fill={tracos.folha}
          stroke={tracos.contornoFolha}
          strokeWidth={2.2}
          transform="translate(34 30) rotate(-24) scale(0.42)"
          opacity={0.95}
        />
        <Path
          d="M32.4 28.6 C28.6 27 24.6 25.4 21.6 23.4"
          stroke={tracos.contornoFolha}
          strokeWidth={1}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
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
          {/* Um brilho em cada uma, no alto à esquerda, como em tudo no app. */}
          <Ellipse cx={f.x - 1.6} cy={f.y - 1.8} rx={1.3} ry={1} fill="#FFFFFF" opacity={0.55} />
          {/* E um cabinho, que é o que separa fruta de bolinha. */}
          <Path
            d={`M${f.x + 0.6} ${f.y - 4.4} C${f.x + 1.6} ${f.y - 6.4} ${f.x + 2.6} ${f.y - 6.8} ${f.x + 3.4} ${f.y - 6.6}`}
            stroke={tracos.haste}
            strokeWidth={1.2}
            strokeLinecap="round"
            fill="none"
          />
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
      {/*
        A trama: duas voltas cruzando as varas verticais.

        Com só as verticais, a cesta lia como um vaso listrado. Duas
        horizontais e ela vira cesta — é o cruzamento que diz trançado.
      */}
      {[
        { y: 37, r: 16.6 },
        { y: 42, r: 14.6 },
      ].map((v) => (
        <Path
          key={v.y}
          d={`M${30 - v.r} ${v.y} C${30 - v.r * 0.4} ${v.y + 1.6} ${30 + v.r * 0.4} ${v.y + 1.6} ${30 + v.r} ${v.y}`}
          stroke={tracos.vasoSombra}
          strokeWidth={1.3}
          strokeLinecap="round"
          fill="none"
          opacity={0.45}
        />
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

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
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

import { entreAspas } from '../../data/conselhos';
import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { fonts, radius, useTema } from '../../theme';
import { tracos } from '../../theme/tokens';
import { Icon } from '../core/Icon';
import { GraoDePapel } from './GraoDePapel';
import {
  TERRA,
  TERRA_CLARA,
  TERRA_FUNDA,
  TERRA_SOMBRA,
  TEXTO_NA_TERRA,
  TEXTO_NA_TERRA_FRACO,
} from './terraDoCanteiro';

/**
 * A Frase do dia, na mesma terra da Composta.
 *
 * ## O que isto substitui
 *
 * Era um cartão dentro de um carrossel: para chegar nele era preciso arrastar,
 * e o desenho fechado era um canteiro de onde brotava uma flor. A flor tinha um
 * motivo documentado — evitar a gramática de *crescer*, que neste app significa
 * "você fez alguma coisa" e é medida em dias cuidados — mas resolvia o problema
 * pelo lado errado. Frase é **palavra escrita**, e palavra escrita mora em
 * papel.
 *
 * Aqui ela deixa de ser um cartão e passa a ser um lugar, logo abaixo da
 * Composta e **na mesma terra**. Em cima se enterra um pensamento; embaixo se
 * desenterra uma frase. É a metáfora do app inteiro dita sem uma linha de texto.
 *
 * ## A emenda com a faixa de cima
 *
 * A `FaixaDaComposta` recebe `continua` e para de se dissolver no fim; esta
 * começa com a terra cheia, no mesmo `TERRA_SOMBRA` em que aquela termina, e é
 * ela que dissolve lá embaixo. Quem olha não vê duas faixas: vê um terreno.
 *
 * ## A encenação é uma vez por dia
 *
 * Aberto o dia, o papel fica **fora da terra** e tocar reabre o cartão na hora,
 * sem cavar de novo. A regra vem do cartão antigo e continua valendo: *"a
 * encenação é para a primeira vez do dia; repetir a cada relance transformaria
 * um momento em pedágio"*.
 *
 * E o papel fora da terra não mostra a frase. Ele fica de costas, dobrado: a
 * frase nunca aparece sem ser buscada, porque esta é a tela que qualquer um lê
 * por cima do ombro da pessoa no ônibus.
 *
 * ## Por que o cartão cresce em vez de entrar por cima
 *
 * A folha que sai da terra é a **mesma** que se abre e toma a tela. Um modal
 * chegando depois da animação seria uma emenda visível entre duas coisas
 * diferentes; crescendo, cavar, sair e abrir viram um gesto só.
 *
 * O que cresce é o **papel vazio** — o texto entra depois, já no tamanho final.
 * Escalar texto junto o deixa borrado e do tamanho errado no caminho todo, e
 * além disso a ordem certa é essa mesmo: primeiro a folha se abre, depois dá
 * para ler.
 */


/**
 * O convite: o título, a linha que diz o gesto, e a porta das guardadas.
 *
 * Encolheu de 146 para 96 quando o botão saiu. Ver o cabeçalho: aqui quem
 * se toca é o papel.
 */
const ALTURA_DO_CONVITE = 96;

/** A zona em que a terra se dissolve no fundo da tela. Ver `FaixaDaComposta`. */
const DISSOLUCAO = 66;
const TERRA_COMECA_A_SUMIR = 0.74;

/**
 * A folha, em pontos.
 *
 * Em retrato, e inteira à vista: no corte não há o que esconder, a terra
 * já foi fatiada e a gente vê o que está dentro dela.
 */
const PAPEL = { largura: 88, altura: 104 };

/** Onde o papel fica, em fração da largura. */
const COLUNA_DO_PAPEL = 0.5;

/**
 * O buraco por onde se vê a folha — menor que ela, dos quatro lados.
 *
 * ## A folha é maior que o buraco, e isso é o desenho inteiro
 *
 * A versão anterior era um bolsão grande com a folha inteira dentro, à
 * vista. Lia como um objeto guardado numa caverna, não como coisa
 * enterrada: dava para ver onde a folha terminava.
 *
 * Aqui o buraco tem uns dois terços da largura da folha e menos da metade
 * da altura. A terra em volta é desenhada **por cima** dela, com o buraco
 * recortado — então as bordas do buraco tampam as bordas da folha, e o que
 * aparece é só o miolo, com a escrita. É o jeito de dizer que ela continua
 * para dentro da terra sem precisar mostrar até onde.
 *
 * `cy` é o centro contando do topo da faixa; as meias-medidas são do
 * contorno, e a forma é um pouco mais larga que alta.
 */
const COVA = { cy: 100, meiaLargura: 34, meiaAltura: 24 };

/**
 * Onde a folha fica, atrás da terra.
 *
 * O buraco cai um pouco acima do meio dela, que é onde está a escrita: é
 * ela que diz que aquilo é papel escrito, e não um retalho claro.
 */
const TOPO_DO_PAPEL = COVA.cy - 44;

/**
 * A tampa de terra: cobre a folha inteira, menos o buraco.
 *
 * Relativa ao centro da coluna. É mais larga que a folha para a folha
 * poder tremer lá embaixo sem uma ponta escapar pela lateral.
 */
const TAMPA = {
  meiaLargura: PAPEL.largura / 2 + 18,
  topo: TOPO_DO_PAPEL - 14,
  base: TOPO_DO_PAPEL + PAPEL.altura + 8,
};

/**
 * Quanto a folha sobe quando é desenterrada.
 *
 * Ela sai pela boca do buraco e fica de pé, com o pé ainda lá dentro — o
 * "já foi desenterrada hoje" dito pelo desenho. Não sobe mais que isto
 * porque, acima, ela encostaria no botão da Composta.
 */
const SUBIDA = 44;

/** A altura do canteiro: até onde a tampa precisa cobrir a folha. */
const ALTURA_DO_CANTEIRO = TAMPA.base;

export function alturaDaFaixaDaFrase(): number {
  return ALTURA_DO_CANTEIRO + ALTURA_DO_CONVITE + DISSOLUCAO;
}

/**
 * As quatro fases da abertura, em milissegundos acumulados.
 *
 * Elas são curtas de propósito. A encenação inteira cabe em pouco mais de um
 * segundo e meio: o bastante para ser um momento, pouco o bastante para não
 * virar espera — e é a mesma pessoa que vai ver isto todo dia.
 */
const CAVA = 620;
const SOBE = 520;
const ABRE = 420;

type Props = {
  largura: number;
  recuo: number;
  /**
   * Quanto a faixa sobe por cima da de cima, para as duas terras emendarem.
   *
   * Existe para a emenda ser feita **aqui**, na raiz da faixa, e não por uma
   * `View` a mais em volta dela na tela inicial. Aquele embrulho era a única
   * diferença de estrutura entre esta faixa e a da Composta — e a risca na
   * borda esquerda só aparecia nesta. Ver `HomeScreen`.
   */
  emenda?: number;
  /** A frase de hoje. Só é lida depois de desenterrada. */
  texto: string;
  /** A pessoa já desenterrou hoje. */
  aberto: boolean;
  guardada: boolean;
  totalGuardadas: number;
  /** Chamado no primeiro toque do dia, quando a cavação começa. */
  onDesenterrar: () => void;
  onGuardar: () => void;
  onVerGuardadas: () => void;
  onCompartilhar: () => void;
  compartilhando?: boolean;
  aviso?: string | null;
};

export function FaixaDaFrase({
  largura,
  recuo,
  emenda = 0,
  texto,
  aberto,
  guardada,
  totalGuardadas,
  onDesenterrar,
  onGuardar,
  onVerGuardadas,
  onCompartilhar,
  compartilhando = false,
  aviso = null,
}: Props) {
  const { colors } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const menosMovimento = useMenosMovimento();

  const altura = alturaDaFaixaDaFrase();

  /**
   * O passo da encenação, de 0 a 1.
   *
   * Um valor só para as três fases, e não um por fase: assim elas não podem
   * sair de ordem nem se atropelar, e a interrupção no meio — a pessoa fecha
   * antes de acabar — é um `stop` só.
   */
  const passo = useRef(new Animated.Value(0)).current;
  /** O papel já está fora da terra? Começa fora em quem já abriu hoje. */
  const [fora, setFora] = useState(aberto);
  const [lendo, setLendo] = useState(false);

  useEffect(() => {
    if (aberto) setFora(true);
  }, [aberto]);

  /*
    A abertura, do toque até o cartão legível.

    Sem movimento, o caminho é o mesmo menos a encenação: o estado final chega
    de uma vez. Quem pediu menos movimento não perde a ferramenta, perde o
    espetáculo — que é a troca certa.
  */
  const abrir = useCallback(() => {
    if (fora) {
      setLendo(true);
      return;
    }
    onDesenterrar();
    if (menosMovimento) {
      setFora(true);
      setLendo(true);
      return;
    }
    passo.setValue(0);
    Animated.timing(passo, {
      toValue: 1,
      duration: CAVA + SOBE + ABRE,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setFora(true);
      setLendo(true);
      passo.setValue(0);
    });
  }, [fora, menosMovimento, onDesenterrar, passo]);

  const total = CAVA + SOBE + ABRE;
  /** As fronteiras das fases, já em fração do passo. */
  const fimDaCava = CAVA / total;
  const fimDaSubida = (CAVA + SOBE) / total;

  /*
    O tremor da terra: vai e volta três vezes durante a cavação e para.

    É `translateX` de dois pontos, não mais: terra que se desloca muito lê como
    a tela inteira balançando. O que se quer é a sensação de alguma coisa
    empurrando por baixo.
  */
  const tremor = passo.interpolate({
    inputRange: [0, fimDaCava * 0.2, fimDaCava * 0.4, fimDaCava * 0.6, fimDaCava * 0.8, fimDaCava, 1],
    outputRange: [0, -2, 2, -2, 1.2, 0, 0],
  });

  /*
    O puxão: a folha dá um tranco para cima e volta, lá embaixo da terra.

    Ela não sai durante a encenação. Com a terra por cima, subir de verdade
    a esconderia atrás do chão; o que se vê pelo buraco é ela sendo puxada
    e resistindo — e aí o cartão abre. Quando ele fecha, ela já está do lado
    de fora. As amplitudes são pequenas de propósito: dez pontos de folga
    entre a borda do buraco e a da folha, e nenhuma ponta pode aparecer.
  */
  const subida = passo.interpolate({
    inputRange: [0, fimDaCava, fimDaCava + (fimDaSubida - fimDaCava) * 0.4, fimDaSubida, 1],
    outputRange: [0, 0, -7, 2, 0],
  });

  const balanco = passo.interpolate({
    inputRange: [0, fimDaCava, fimDaCava + (fimDaSubida - fimDaCava) * 0.45, fimDaSubida, 1],
    outputRange: ['0deg', '0deg', '-4deg', '2deg', '0deg'],
  });

  /** Os torrões que saltam enquanto ele cava. */
  const torroes = passo.interpolate({
    inputRange: [0, fimDaCava * 0.35, fimDaCava, 1],
    outputRange: [0, 1, 0, 0],
  });



  return (
    <View style={{ height: altura, marginHorizontal: -recuo, marginTop: -emenda }}>
      {/*
        A terra por baixo de tudo — e primeiro uma `View` chapada, não SVG.

        A risca branca na borda esquerda sobreviveu à sangria no desenho. Ela
        não aparece no navegador em nenhuma das sete combinações de largura e
        densidade de Android que testei, então o que falha é o desenho nativo:
        o `react-native-svg` no Android encaixa o `viewBox` na caixa com
        `meet`, e quando a proporção não bate por fração de pixel ele deixa uma
        tira vazia nas laterais — e recorta o que eu desenhei para fora.

        Uma `View` com cor de fundo não passa por nada disso: o Android pinta a
        caixa inteira, pixel por pixel. Ela vai de fora a fora e para onde a
        terra começa a se dissolver; o SVG por cima cuida da dissolução, e
        agora com `preserveAspectRatio="none"`, que estica em vez de encaixar.
      */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -4,
          right: -4,
          top: 0,
          height: altura * TERRA_COMECA_A_SUMIR,
          backgroundColor: TERRA_SOMBRA,
        }}
      />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${largura} ${altura}`}
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id={`terra-${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={TERRA_SOMBRA} />
              <Stop offset={TERRA_COMECA_A_SUMIR} stopColor={TERRA_SOMBRA} stopOpacity={1} />
              <Stop offset="1" stopColor={TERRA_SOMBRA} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={`M-8 0 H${largura + 8} V${altura} H-8 Z`} fill={`url(#terra-${id})`} />

          {/* Torrõezinhos soltos na terra em volta, para ela não ser chapada. */}
          {[0.07, 0.19, 0.83, 0.93, 0.12, 0.88].map((f, i) => (
            <Ellipse
              key={f}
              cx={largura * f}
              cy={30 + i * 26}
              rx={3.4}
              ry={2.6}
              fill={TERRA}
              opacity={0.34}
            />
          ))}
        </Svg>
      </View>

      {/*
        O buraco, a folha e a terra que a tampa. Tudo treme junto na cavação.

        Três camadas, e a ordem é o desenho: o fundo do buraco, depois a
        folha, depois a terra com o buraco recortado. A folha fica sempre no
        meio — o que muda entre enterrada e desenterrada é só até onde a
        terra de cima chega. Ver `Tampa`.

        Nada aqui estica: são desenhos com curva. A caixa tem o tamanho
        exato do canteiro, e nada encosta nas bordas da tela.
      */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: ALTURA_DO_CANTEIRO,
          transform: [{ translateX: tremor }],
        }}
      >
        <Svg style={{ position: 'absolute' }} width="100%" height="100%" viewBox={`0 0 ${largura} ${ALTURA_DO_CANTEIRO}`}>
          <FundoDoBuraco largura={largura} id={`${id}f`} />
        </Svg>

        <Animated.View
          style={{
            position: 'absolute',
            left: largura * COLUNA_DO_PAPEL - PAPEL.largura / 2,
            top: TOPO_DO_PAPEL,
            width: PAPEL.largura,
            height: PAPEL.altura,
            transform: fora
              ? [{ translateY: -SUBIDA }, { rotate: '4deg' }]
              : [{ translateY: subida }, { rotate: balanco }],
          }}
        >
          <Papel largura={PAPEL.largura} altura={PAPEL.altura} />
        </Animated.View>

        <Svg style={{ position: 'absolute' }} width="100%" height="100%" viewBox={`0 0 ${largura} ${ALTURA_DO_CANTEIRO}`}>
          <Tampa largura={largura} id={`${id}t`} desenterrada={fora} />
        </Svg>

        {/*
          Os torrões que caem da boca do buraco enquanto ela é cavada.

          Ficam por cima da tampa para serem vistos, e por isso nascem e
          caem dentro da largura do buraco: fora dela eles pareceriam cair
          por cima da terra, e não para dentro dela.
        */}
        {!fora &&
          TORROES.map((q, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: largura * COLUNA_DO_PAPEL + q.x - q.r,
                top: COVA.cy - COVA.meiaAltura - 4,
                width: q.r * 2,
                height: q.r * 1.7,
                borderRadius: q.r,
                backgroundColor: TERRA_FUNDA,
                borderWidth: 1.4,
                borderColor: tracos.contorno,
                opacity: torroes,
                transform: [
                  { translateY: torroes.interpolate({ inputRange: [0, 1], outputRange: [0, q.cai] }) },
                  { translateX: torroes.interpolate({ inputRange: [0, 1], outputRange: [0, q.anda] }) },
                ],
              }}
            />
          ))}
      </Animated.View>

      {/*
        O convite — e ele não tem botão.

        Tinha: um botão cheio, de largura inteira, igualzinho ao "Compostar
        agora" a cento e poucos pontos acima. Duas ferramentas diferentes com
        o mesmo objeto verde na mesma tela leem como repetição, e a segunda
        perde o que tem de próprio.

        Aqui quem se toca é **o papel**. A coisa que está enterrada é a coisa
        que se puxa — não há tradução melhor do gesto, e some um botão de uma
        tela que já tinha vários. O alvo continua sendo a faixa inteira, então
        ninguém precisa acertar a folha; a linha embaixo do título diz o que
        fazer, em texto, que é peso visual de outra ordem.
      */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={aberto ? 'Ler a frase de hoje de novo' : 'Desenterrar a frase de hoje'}
        onPress={abrir}
        style={({ pressed }) => ({
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: ALTURA_DO_CANTEIRO + ALTURA_DO_CONVITE,
          paddingHorizontal: recuo,
          paddingBottom: 16,
          justifyContent: 'flex-end',
          gap: 6,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
          <Text
            style={{ fontFamily: fonts.display.extraBold, fontSize: 25, color: TEXTO_NA_TERRA }}
          >
            A frase de hoje
          </Text>

          <View style={{ flex: 1 }} />

          {/*
            A porta das guardadas é um alvo de toque separado, dentro do
            outro: guardar e reler são coisas diferentes de desenterrar, e o
            leitor de tela precisa dos dois anúncios.
          */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              totalGuardadas > 0
                ? `Ver as ${totalGuardadas} frases guardadas`
                : 'Ver as frases guardadas'
            }
            onPress={onVerGuardadas}
            hitSlop={12}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 13,
                color: TEXTO_NA_TERRA_FRACO,
                textDecorationLine: 'underline',
              }}
            >
              {totalGuardadas > 0 ? `Guardadas · ${totalGuardadas}` : 'Guardadas'}
            </Text>
          </Pressable>
        </View>

        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 14,
            lineHeight: 14 * 1.4,
            color: TEXTO_NA_TERRA_FRACO,
          }}
        >
          {aberto ? 'Toque no papel para ler de novo.' : 'Toque no papel para desenterrar.'}
        </Text>
      </Pressable>
      <CartaoDePapel
        visivel={lendo}
        texto={texto}
        guardada={guardada}
        onGuardar={onGuardar}
        onCompartilhar={onCompartilhar}
        compartilhando={compartilhando}
        aviso={aviso}
        onFechar={() => setLendo(false)}
      />
    </View>
  );
}

/** Os torrões que caem para dentro do buraco: onde nascem, tamanho e queda. */
const TORROES = [
  { x: -20, r: 3.2, cai: 26, anda: -3 },
  { x: -4, r: 2.6, cai: 34, anda: 1 },
  { x: 10, r: 3, cai: 22, anda: 2 },
  { x: 22, r: 2.4, cai: 30, anda: -1 },
] as const;

/**
 * O contorno do buraco, em volta do centro da coluna.
 *
 * Irregular de propósito: uma elipse perfeita lê como furo de máquina, e
 * buraco cavado à mão tem um lado mais cheio que o outro. As duas camadas
 * que usam o buraco — o fundo e a tampa — desenham **este** contorno, e é
 * por isso que ele mora numa função: se cada uma tivesse o seu, a menor
 * diferença abriria uma fresta entre o fundo e a terra.
 */
function contornoDoBuraco(cx: number): string {
  const { cy, meiaLargura: W, meiaAltura: H } = COVA;
  return [
    `M${cx - W} ${cy - 2}`,
    `C${cx - W} ${cy - H + 4} ${cx - W * 0.5} ${cy - H - 2} ${cx - 2} ${cy - H}`,
    `C${cx + W * 0.45} ${cy - H + 1} ${cx + W + 2} ${cy - H + 6} ${cx + W} ${cy - 4}`,
    `C${cx + W - 1} ${cy + H * 0.6} ${cx + W * 0.5} ${cy + H + 1} ${cx + 2} ${cy + H}`,
    `C${cx - W * 0.5} ${cy + H - 1} ${cx - W - 1} ${cy + H * 0.55} ${cx - W} ${cy - 2}`,
    'Z',
  ].join(' ');
}

/**
 * O fundo do buraco: o que aparece quando a folha não o ocupa.
 *
 * Enterrada, a folha cobre o buraco inteiro e isto não se vê. Desenterrada,
 * ela sobe e deixa à mostra a parte de baixo — terra mais escura, que é o
 * lugar de onde ela saiu.
 */
function FundoDoBuraco({ largura, id }: { largura: number; id: string }) {
  const cx = largura * COLUNA_DO_PAPEL;
  return (
    <>
      <Defs>
        <LinearGradient id={`fundo-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TERRA_FUNDA} />
          <Stop offset="1" stopColor="#2A241D" />
        </LinearGradient>
      </Defs>
      <Path d={contornoDoBuraco(cx)} fill={`url(#fundo-${id})`} />
    </>
  );
}

/**
 * A terra por cima da folha, com o buraco recortado.
 *
 * ## Como o recorte é feito
 *
 * Um retângulo da cor da terra e o contorno do buraco no **mesmo** caminho,
 * com `fillRule="evenodd"`: a regra pinta o que está dentro do retângulo e
 * fora do buraco. Não há máscara nem imagem — é um caminho só, e a cor é a
 * mesma da terra de baixo, então a tampa não tem borda visível: ela só
 * existe onde tampa a folha.
 *
 * ## Enterrada e desenterrada
 *
 * Enterrada, a tampa cobre a folha de cima a baixo. Desenterrada, ela só
 * vale **da boca do buraco para baixo**: acima dela a folha está do lado de
 * fora, na frente da terra; abaixo, ela continua entrando no buraco, e só
 * aparece pela abertura. É a mesma folha e a mesma tampa — muda só até
 * onde a tampa chega.
 *
 * ## O que faz o buraco parecer fundo
 *
 * Três coisas, de fora para dentro: um lábio de terra mais clara em volta,
 * que é a borda remexida; o contorno grosso; e uma sombra entrando pela
 * parte de cima da abertura, por cima da folha — a terra da borda fazendo
 * sombra no que está lá dentro. Sem a sombra, a folha lê como colada na
 * frente da terra, e não afundada nela.
 */
function Tampa({
  largura,
  id,
  desenterrada,
}: {
  largura: number;
  id: string;
  desenterrada: boolean;
}) {
  const cx = largura * COLUNA_DO_PAPEL;
  const { cy, meiaLargura: W, meiaAltura: H } = COVA;
  const buraco = contornoDoBuraco(cx);
  const retangulo = `M${cx - TAMPA.meiaLargura} ${TAMPA.topo} H${cx + TAMPA.meiaLargura} V${TAMPA.base} H${cx - TAMPA.meiaLargura} Z`;
  /*
    Desenterrada, a tampa só existe da linha do meio do buraco para baixo.

    É a linha do meio, e não um pouco acima, por um motivo de desenho: é ali
    que o buraco é mais largo, e o lábio em volta dele cobre exatamente a
    passagem entre a folha inteira, em cima, e a folha vista só pela
    abertura, embaixo. Cortando mais alto, sobrava um degrau reto
    atravessando a folha — lia como se ela tivesse sido cortada, e não
    enfiada no buraco.
  */
  const deOnde = desenterrada ? cy : 0;

  return (
    <>
      <Defs>
        <ClipPath id={`ate-${id}`}>
          <Rect x={0} y={deOnde} width={largura} height={ALTURA_DO_CANTEIRO} />
        </ClipPath>
        <ClipPath id={`dentro-${id}`}>
          <Path d={buraco} />
        </ClipPath>
        <LinearGradient id={`sombra-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1F1A15" stopOpacity={0.7} />
          <Stop offset="0.5" stopColor="#1F1A15" stopOpacity={0.12} />
          <Stop offset="1" stopColor="#1F1A15" stopOpacity={0} />
        </LinearGradient>
      </Defs>

      <G clipPath={`url(#ate-${id})`}>
        {/* A terra, com o buraco recortado. */}
        <Path d={`${retangulo} ${buraco}`} fill={TERRA_SOMBRA} fillRule="evenodd" />

        {/* A sombra que a borda faz para dentro, por cima da folha. */}
        <G clipPath={`url(#dentro-${id})`}>
          <Rect
            x={cx - W - 4}
            y={cy - H - 4}
            width={W * 2 + 8}
            height={H * 2 + 8}
            fill={`url(#sombra-${id})`}
          />
        </G>

        {/* O lábio: terra remexida em volta da boca, mais clara e grossa. */}
        <Path
          d={buraco}
          fill="none"
          stroke={TERRA_FUNDA}
          strokeWidth={15}
          strokeLinejoin="round"
        />
        <Path
          d={buraco}
          fill="none"
          stroke={TERRA}
          strokeWidth={3}
          strokeLinejoin="round"
          opacity={0.45}
          transform={`translate(0 -2)`}
        />
        <Path
          d={buraco}
          fill="none"
          stroke={tracos.contorno}
          strokeWidth={3}
          strokeLinejoin="round"
        />

        {/*
          Torrõezinhos redondos na borda: o que faz a terra em volta
          parecer fofa, remexida, e não um recorte limpo de tesoura.
        */}
        {BORDA.map((b, i) => (
          <Ellipse
            key={i}
            cx={cx + b.x}
            cy={cy + b.y}
            rx={b.r}
            ry={b.r * 0.8}
            fill={TERRA_FUNDA}
            stroke={tracos.contorno}
            strokeWidth={1.8}
          />
        ))}
      </G>
    </>
  );
}

/** Os torrões da borda do buraco, relativos ao centro dele. */
const BORDA = [
  { x: -44, y: 10, r: 5 },
  { x: -40, y: 22, r: 3.4 },
  { x: 42, y: 14, r: 4.4 },
  { x: 30, y: 28, r: 3.6 },
  { x: -18, y: 30, r: 3 },
] as const;

/**
 * A folha.
 *
 * Enterrada, só o miolo dela aparece, pelo buraco; desenterrada, ela fica
 * de pé do lado de fora e aparece quase inteira, com a ponta dobrada. A
 * escrita nunca se lê — são traços —, porque a frase não aparece sem ser
 * buscada.
 */
function Papel({ largura, altura }: { largura: number; altura: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  /* A ponta dobrada, no canto de cima à direita. */
  const orelha = largura * 0.2;

  return (
    <Svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`}>
      <Defs>
        <LinearGradient id={`folha-${id}`} x1="0.1" y1="0" x2="0.9" y2="1">
          <Stop offset="0" stopColor="#FFFDF6" />
          <Stop offset="1" stopColor="#E8DFC8" />
        </LinearGradient>
        <LinearGradient id={`orelha-${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E0D6BD" />
          <Stop offset="1" stopColor="#F5EFDE" />
        </LinearGradient>
      </Defs>

      {/*
        A folha, com a ponta de cima à direita dobrada.

        A primeira versão era um trapézio com um vinco em V perto do topo, e
        no aparelho ela lia como **envelope** — o V é exatamente a aba de um.
        Aqui não há vinco atravessando: o que diz que é papel é a ponta
        dobrada, que é a marca de folha e de nenhuma outra coisa.

        O corpo é quase reto, com uma inclinação de dois pontos: folha enfiada
        na terra não está prumada, mas também não está tombada.
      */}
      <Path
        d={`M${largura * 0.08} ${altura} L${largura * 0.11} 10 L${largura * 0.9 - orelha} 5 L${largura * 0.9} ${5 + orelha * 0.86} L${largura * 0.95} ${altura} Z`}
        fill={`url(#folha-${id})`}
        stroke={tracos.contorno}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/*
        Três linhas escritas, no miolo da folha.

        Não deixam ler nada — são traços — e são o que faz o pedaço claro que
        aparece no buraco ser **papel escrito**, e não um retalho qualquer.
        Ficam no meio porque é por onde o buraco olha: as bordas da folha
        estão todas debaixo da terra.
      */}
      {[
        { y: 0.32, fim: 0.78, op: 0.3 },
        { y: 0.44, fim: 0.7, op: 0.26 },
        { y: 0.56, fim: 0.62, op: 0.22 },
      ].map((l) => (
        <Path
          key={l.y}
          d={`M${largura * 0.2} ${altura * l.y} L${largura * l.fim} ${altura * (l.y - 0.02)}`}
          stroke={tracos.contorno}
          strokeWidth={2.6}
          strokeLinecap="round"
          opacity={l.op}
        />
      ))}
      <Path
        d={`M${largura * 0.88 - orelha} 4 L${largura * 0.88 - orelha * 0.18} ${4 + orelha * 0.72} L${largura * 0.88} ${4 + orelha * 0.82} Z`}
        fill={`url(#orelha-${id})`}
        stroke={tracos.contorno}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * O cartão que a folha vira.
 *
 * Ele nasce pequeno e cresce até o tamanho final — o texto entra depois, já no
 * lugar. Ver o cabeçalho deste arquivo.
 */
function CartaoDePapel({
  visivel,
  texto,
  guardada,
  onGuardar,
  onCompartilhar,
  compartilhando,
  aviso,
  onFechar,
}: {
  visivel: boolean;
  texto: string;
  guardada: boolean;
  onGuardar: () => void;
  onCompartilhar: () => void;
  compartilhando: boolean;
  aviso: string | null;
  onFechar: () => void;
}) {
  const { colors, shadows } = useTema();
  const menosMovimento = useMenosMovimento();
  const cresce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visivel) {
      cresce.setValue(0);
      return;
    }
    if (menosMovimento) {
      cresce.setValue(1);
      return;
    }
    Animated.timing(cresce, {
      toValue: 1,
      duration: 460,
      /* Um pouco de sobra no fim: papel que assenta, e não caixa que encaixa. */
      easing: Easing.bezier(0.16, 1.2, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [visivel, menosMovimento, cresce]);

  const escala = cresce.interpolate({ inputRange: [0, 1], outputRange: [0.34, 1] });
  const giro = cresce.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '0deg'] });
  /* O texto entra depois de a folha ter tamanho, não junto. */
  const tinta = cresce.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 0, 1] });

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar a frase"
        onPress={onFechar}
        style={{
          flex: 1,
          backgroundColor: 'rgba(28, 24, 20, 0.62)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Animated.View
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: radius.xl,
            /*
              `colors.surface`, e não `palette.cream100`.

              O creme da paleta inverte com o tema: no escuro ele deixa de ser
              fundo e vira **cor de texto** (#F1EBDD). Usado aqui, o cartão
              nasceria claro à noite com o texto da mesma cor em cima — 1,0 de
              contraste, ilegível. É o mesmo erro que a terra já me ensinou.
            */
            backgroundColor: colors.surface,
            overflow: 'hidden',
            ...shadows.md,
            transform: [{ scale: escala }, { rotate: giro }],
          }}
        >
          <GraoDePapel />
          <View style={{ padding: 26, gap: 22 }}>
            <Animated.Text
              style={{
                opacity: tinta,
                fontFamily: fonts.display.bold,
                fontSize: 23,
                lineHeight: 23 * 1.42,
                color: colors.textPrimary,
                textAlign: 'center',
              }}
            >
              {entreAspas(texto)}
            </Animated.Text>

            <Animated.View
              style={{ opacity: tinta, flexDirection: 'row', justifyContent: 'center', gap: 26 }}
            >
              <Acao
                icone="heart"
                rotulo={guardada ? 'Guardada' : 'Guardar'}
                acessivel={guardada ? 'Tirar das guardadas' : 'Guardar esta frase'}
                selecionado={guardada}
                onPress={onGuardar}
              />
              <Acao
                icone="compartilhar"
                rotulo={compartilhando ? 'Preparando…' : 'Compartilhar'}
                acessivel="Compartilhar esta frase como imagem"
                selecionado={false}
                desabilitado={compartilhando}
                onPress={onCompartilhar}
              />
            </Animated.View>

            {!!aviso && (
              <Text
                accessibilityLiveRegion="polite"
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 13,
                  lineHeight: 13 * 1.45,
                  color: colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                {aviso}
              </Text>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function Acao({
  icone,
  rotulo,
  acessivel,
  selecionado,
  onPress,
  desabilitado = false,
}: {
  icone: 'heart' | 'compartilhar';
  rotulo: string;
  acessivel: string;
  selecionado: boolean;
  onPress: () => void;
  desabilitado?: boolean;
}) {
  const { colors } = useTema();
  const cor = selecionado ? colors.primaryStrong : colors.textSecondary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      accessibilityState={{ selected: selecionado, disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        opacity: pressed || desabilitado ? 0.6 : 1,
      })}
    >
      <Icon name={icone} color={cor} size={20} />
      <Text style={{ fontFamily: fonts.body.bold, fontSize: 14, color: cor }}>{rotulo}</Text>
    </Pressable>
  );
}

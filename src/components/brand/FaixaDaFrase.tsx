import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

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

/** A altura do bloco onde o papel espia, acima do convite. */
const ALTURA_DO_CANTEIRO = 134;

/** O convite: selo, título e botão. */
const ALTURA_DO_CONVITE = 146;

/** A zona em que a terra se dissolve no fundo da tela. Ver `FaixaDaComposta`. */
const DISSOLUCAO = 66;
const TERRA_COMECA_A_SUMIR = 0.74;

/**
 * O papel espiando, em pontos. Metade dele está enterrada.
 *
 * Começou em 96 por 76 e sumia: do tamanho de um torrão, no meio de uma
 * terra de cem pontos de altura, ele lia como pedra. Papel precisa de
 * tamanho para ser papel — é pela proporção entre a folha e o chão que se
 * entende que tem alguma coisa enterrada ali, e não uma pedrinha.
 */
const PAPEL = { largura: 104, altura: 124 };

/** Onde o papel fica, em fração da largura — à esquerda do broto da Composta. */
const COLUNA_DO_PAPEL = 0.5;

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

  /** O papel sobe da terra e passa um pouco do ponto antes de assentar. */
  const subida = passo.interpolate({
    inputRange: [0, fimDaCava, fimDaSubida * 0.82, fimDaSubida, 1],
    outputRange: [0, 0, -PAPEL.altura * 0.58, -PAPEL.altura * 0.46, -PAPEL.altura * 0.46],
  });

  /** A mexida: ele sai torto e se endireita. */
  const balanco = passo.interpolate({
    inputRange: [0, fimDaCava, fimDaCava + (fimDaSubida - fimDaCava) * 0.45, fimDaSubida, 1],
    outputRange: ['0deg', '0deg', '-7deg', '2deg', '2deg'],
  });

  /** Os torrões que saltam enquanto ele cava. */
  const torroes = passo.interpolate({
    inputRange: [0, fimDaCava * 0.35, fimDaCava, 1],
    outputRange: [0, 1, 0, 0],
  });

  const soloDoPapel = ALTURA_DO_CANTEIRO - 22;

  return (
    <View style={{ height: altura, marginHorizontal: -recuo }}>
      {/* A terra, de sangria a sangria, começando cheia onde a de cima acabou. */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox={`0 0 ${largura} ${altura}`}>
          <Defs>
            <LinearGradient id={`terra-${id}`} x1="0" y1="0" x2="0" y2="1">
              {/*
                Uma cor só, do começo até a dissolução.

                A primeira versão clareava para `TERRA_FUNDA` no primeiro sexto e
                voltava a escurecer. A intenção era dar volume; o efeito foi o
                contrário — o clarão desenhava uma faixa horizontal logo abaixo
                da emenda, e as duas terras liam como duas lajes empilhadas em
                vez de um terreno.

                O relevo vem do monte em volta do papel, que é desenhado à parte
                num tom mais claro. Aqui embaixo, chapado é o certo: é o fundo
                da cova, e fundo de cova não pega luz.
              */}
              <Stop offset="0" stopColor={TERRA_SOMBRA} />
              <Stop offset={TERRA_COMECA_A_SUMIR} stopColor={TERRA_SOMBRA} stopOpacity={1} />
              <Stop offset="1" stopColor={TERRA_SOMBRA} stopOpacity={0} />
            </LinearGradient>
            <RadialGradient id={`cova-${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={TERRA_SOMBRA} stopOpacity={0.55} />
              <Stop offset="1" stopColor={TERRA_SOMBRA} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          <Path d={`M0 0 H${largura} V${altura} H0 Z`} fill={`url(#terra-${id})`} />

          {/* Torrõezinhos, para a terra não ser uma mancha lisa. */}
          {[0.08, 0.2, 0.36, 0.62, 0.78, 0.9].map((f, i) => (
            <Ellipse
              key={f}
              cx={largura * f}
              cy={18 + (i % 3) * 22}
              rx={3.6}
              ry={2.8}
              fill={TERRA}
              opacity={0.3}
            />
          ))}

          {/* A cova de onde ele sai: uma sombra funda em volta do papel. */}
          <Ellipse
            cx={largura * COLUNA_DO_PAPEL}
            cy={soloDoPapel}
            rx={PAPEL.largura * 0.92}
            ry={26}
            fill={`url(#cova-${id})`}
          />
        </Svg>
      </View>

      {/*
        O papel, e a terra que o esconde pela metade.

        A ordem importa: papel primeiro, monte depois. É o monte por cima que
        faz metade da folha estar **enterrada** em vez de pousada — e é ele que
        continua escondendo o pé dela depois que ela sobe.
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
        <Animated.View
          style={{
            position: 'absolute',
            left: largura * COLUNA_DO_PAPEL - PAPEL.largura / 2,
            top: soloDoPapel - PAPEL.altura + 26,
            width: PAPEL.largura,
            height: PAPEL.altura,
            transform: fora
              ? [{ translateY: -PAPEL.altura * 0.46 }, { rotate: '2deg' }]
              : [{ translateY: subida }, { rotate: balanco }],
          }}
        >
          <Papel largura={PAPEL.largura} altura={PAPEL.altura} />
        </Animated.View>

        {/*
          A pilha de terra em volta do papel, por cima dele.

          Ela era uma faixa da largura inteira, com o topo em linha reta nas
          duas pontas. Medindo os pixels, era **ela** o degrau que eu estava
          lendo como emenda mal-feita entre as duas faixas: as terras batiam
          exatamente, e o que cortava a tela era este topo achatado, que lia
          como um segundo nível de chão.

          Agora é uma pilha local, com as bordas dissolvendo no terreno. Além
          de não ter aresta, é mais verdadeiro: quem cava um buraco empilha a
          terra em volta do buraco, não de ponta a ponta da paisagem.

          O miolo é opaco de propósito — é ele que esconde o pé da folha e faz
          ela estar **enterrada** em vez de pousada.
        */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: soloDoPapel - 24, height: 84 }}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${largura} 84`}>
            <Defs>
              <RadialGradient id={`pilha-${id}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={TERRA_FUNDA} stopOpacity={1} />
                <Stop offset="0.52" stopColor={TERRA_FUNDA} stopOpacity={1} />
                <Stop offset="1" stopColor={TERRA_FUNDA} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Ellipse
              cx={largura * COLUNA_DO_PAPEL}
              cy={52}
              rx={PAPEL.largura * 1.34}
              ry={32}
              fill={`url(#pilha-${id})`}
            />
            {/* A luz na crista da pilha, só no meio: ponta acesa vira aresta. */}
            <Path
              d={`M${largura * COLUNA_DO_PAPEL - PAPEL.largura * 0.86} 32 Q${largura * COLUNA_DO_PAPEL} 16 ${largura * COLUNA_DO_PAPEL + PAPEL.largura * 0.86} 32`}
              stroke={TERRA}
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
              opacity={0.34}
            />
          </Svg>
        </View>

        {/* Os torrões que saltam da cova enquanto ele cava. */}
        {!fora &&
          TORROES.map((t, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: largura * COLUNA_DO_PAPEL + t.x,
                top: soloDoPapel - 6,
                width: t.r * 2,
                height: t.r * 1.6,
                borderRadius: t.r,
                backgroundColor: TERRA_SOMBRA,
                opacity: torroes,
                transform: [
                  {
                    translateY: torroes.interpolate({ inputRange: [0, 1], outputRange: [0, t.sobe] }),
                  },
                  {
                    translateX: torroes.interpolate({ inputRange: [0, 1], outputRange: [0, t.anda] }),
                  },
                ],
              }}
            />
          ))}
      </Animated.View>

      {/* O convite, pousado na terra. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={aberto ? 'Ler a frase de hoje de novo' : 'Desenterrar a frase de hoje'}
        onPress={abrir}
        style={({ pressed }) => ({
          position: 'absolute',
          left: 0,
          right: 0,
          top: ALTURA_DO_CANTEIRO,
          height: ALTURA_DO_CONVITE,
          paddingHorizontal: recuo,
          paddingBottom: 18,
          justifyContent: 'flex-end',
          gap: 9,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        {/*
          O selo e a porta das guardadas dividem a mesma fileira.

          A porta era absoluta e caía por cima do título. Aqui ela tem lugar
          próprio, e continua sendo um alvo de toque separado: guardar e
          reler são coisas diferentes de desenterrar, e o leitor de tela
          precisa dos dois anúncios.
        */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.pill,
              paddingVertical: 5,
              paddingHorizontal: 11,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.extraBold,
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: colors.primaryStrong,
              }}
            >
              {aberto ? 'lida hoje' : 'uma por dia'}
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              totalGuardadas > 0
                ? `Ver as ${totalGuardadas} frases guardadas`
                : 'Ver as frases guardadas'
            }
            onPress={onVerGuardadas}
            hitSlop={10}
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

        <Text style={{ fontFamily: fonts.display.extraBold, fontSize: 25, color: TEXTO_NA_TERRA }}>
          A frase de hoje
        </Text>

        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            backgroundColor: colors.primary,
            borderRadius: radius.botao,
            paddingVertical: 15,
            alignItems: 'center',
            marginTop: 2,
          }}
        >
          <Text style={{ fontFamily: fonts.body.bold, fontSize: 16, color: colors.textInverse }}>
            {aberto ? 'Ler de novo' : 'Desenterrar'}
          </Text>
        </View>
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

/** Os torrões que saltam da cova: posição, tamanho e para onde vão. */
const TORROES = [
  { x: -46, r: 3.4, sobe: -26, anda: -14 },
  { x: -22, r: 2.6, sobe: -34, anda: -6 },
  { x: 10, r: 3, sobe: -38, anda: 6 },
  { x: 34, r: 2.4, sobe: -28, anda: 16 },
  { x: 52, r: 3.2, sobe: -22, anda: 22 },
] as const;

/**
 * A folha, de costas.
 *
 * Ela é um trapézio, e não um retângulo: papel enfiado na terra não está de
 * frente para ninguém. As duas dobras são o que diz que tem coisa escrita do
 * outro lado sem mostrar nada — e é a promessa da ferramenta, que a frase não
 * aparece sem ser buscada.
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
        Duas linhas escritas, fracas, perto do topo.

        Elas não deixam ler nada — são dois traços — e são o que diferencia a
        folha de um pedaço de papel em branco. Ficam só no alto porque é a
        parte que sai da terra: o resto está enterrado, e papel enterrado não
        mostra o que tem escrito.
      */}
      <Path
        d={`M${largura * 0.24} ${altura * 0.36} L${largura * 0.74} ${altura * 0.33}`}
        stroke={tracos.contorno}
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={0.22}
      />
      <Path
        d={`M${largura * 0.24} ${altura * 0.5} L${largura * 0.6} ${altura * 0.48}`}
        stroke={tracos.contorno}
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={0.16}
      />
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

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { fonts, useTema } from '../../theme';
import { tracos } from '../../theme/tokens';
import { Button } from '../core/Button';
import { BalaoDoBroto } from './BalaoDoBroto';
import { alturaDoMascote } from './geometriaDoBroto';
import { Sprout, type SproutStage } from './Sprout';
import { curvaDaAltura, soltarFarelos, type Farelo } from './quedaDosFarelos';

/**
 * A cena de quando o broto passa de estágio.
 *
 * ## O que acontece
 *
 * A tela escurece e tudo o mais some de vista; o broto aparece no meio, ainda
 * do tamanho de antes; ele dá duas balançadas soltando farelos de folha, que
 * caem com peso até sumirem embaixo da tela; na segunda ele **cresce**, e aí
 * fala.
 *
 * O crescimento acontece no pico da segunda balançada, escondido no
 * movimento. Trocar o desenho com a planta parada leria como uma imagem
 * substituindo a outra; no meio do balanço, lê como a planta esticando.
 *
 * ## Ela sai de onde o broto está
 *
 * A cena abre na **aba do Brotinho**, e não quando o app abre: quem chega na
 * tela inicial chega para usar o app, e uma comemoração na cara de entrada é
 * um pedágio. Aqui ela espera a pessoa ir ver o broto — que é o assunto dela.
 *
 * O desenho parte do lugar exato em que ele estava na tela (`origem`, medida
 * na hora) e viaja até o meio enquanto o fundo cobre o resto. Aparecer já no
 * centro faria a cena parecer outra tela; viajando, é o **mesmo** broto.
 *
 * ## Some de ver, não de existir
 *
 * A aba continua montada e intacta por baixo — o que cobre é um fundo em
 * gradiente da paleta. Desmontar e remontar a tela para uma comemoração
 * custaria o mesmo engasgo que já foi medido em 440 ms ao voltar de uma
 * prática. Ver `CamadaEmpilhada`.
 *
 * ## Ninguém fica preso
 *
 * Um toque em qualquer lugar pula para o fim: o broto já crescido, o balão e
 * o botão. Com "reduzir movimento" ligado, a cena **começa** assim.
 */

/** O roteiro, em milissegundos desde o começo. */
const ROTEIRO = {
  /** O fundo cobrindo a tela, e o broto indo do lugar dele até o meio. */
  viagem: 700,
  balanco1: { comeca: 900, dura: 760 },
  balanco2: { comeca: 1760, dura: 900 },
  /** O instante exato em que o desenho troca de estágio. */
  cresce: 2100,
  fala: 2700,
  fim: 3300,
};

/**
 * O tamanho pedido ao `Sprout`.
 *
 * Não é altura: o desenho trata `size` como escala sobre uma caixa de 200, e
 * a altura de verdade sai de `alturaDoMascote`. Pedir 190 desenhava 127 —
 * pequeno demais para uma cena que ocupa a tela inteira.
 */
const TAMANHO_DO_BROTO = 340;

/** As três cores das folhas que caem. */
const TONS = [tracos.folha, tracos.folhaClara, tracos.folhaSombra] as const;

/** A folha da marca, a mesma do broto e das cenas dos temas. */
const FOLHA = 'M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z';

type Rajada = { id: number; folhas: Farelo[] };

/**
 * Uma leva de folhas caindo, com um relógio só para todas.
 *
 * A física é a mesma dos farelos de terra da Frase do dia — gravidade de
 * verdade, amostrada em pontos, no driver nativo. O que muda é o desenho e o
 * giro: folha é leve, então ela roda mais e cai mais devagar. Ver
 * `quedaDosFarelos`.
 */
function ChuvaDeFolhas({ rajada, aoTerminar }: { rajada: Rajada; aoTerminar: () => void }) {
  const relogio = useRef(new Animated.Value(0)).current;
  const maior = Math.max(1, ...rajada.folhas.map((f) => f.duracaoMs));

  useEffect(() => {
    const animacao = Animated.timing(relogio, {
      toValue: maior,
      duration: maior,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animacao.start(({ finished }) => {
      if (finished) aoTerminar();
    });
    return () => animacao.stop();
    // A rajada nasce, cai uma vez e some: não reinicia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {rajada.folhas.map((f, i) => {
        const fim = f.duracaoMs;
        const tamanho = f.raio * 9;
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: -tamanho / 2,
              top: -tamanho / 2,
              width: tamanho,
              height: tamanho,
              opacity: relogio.interpolate({
                inputRange: [0, fim * 0.08, fim * 0.8, fim],
                outputRange: [0, 1, 1, 0.5],
                extrapolate: 'clamp',
              }),
              transform: [
                { translateX: relogio.interpolate({ inputRange: [0, fim], outputRange: [f.x0, f.x0 + (f.vx * fim) / 1000], extrapolate: 'clamp' }) },
                { translateY: relogio.interpolate({ ...curvaDaAltura(f), extrapolate: 'clamp' }) },
                { rotate: relogio.interpolate({ inputRange: [0, fim], outputRange: ['0deg', `${(f.giro * fim) / 1000}deg`], extrapolate: 'clamp' }) },
              ],
            }}
          >
            <Svg width={tamanho} height={tamanho} viewBox="-48 -30 56 50">
              <Path d={FOLHA} fill={TONS[f.tom]} stroke={tracos.contornoFolha} strokeWidth={3} />
            </Svg>
          </Animated.View>
        );
      })}
    </>
  );
}

/** De onde o broto parte: onde ele estava na tela, em coordenadas da janela. */
export type OrigemDoBroto = { x: number; y: number; largura: number; altura: number };

type Props = {
  /** O estágio a que ele acabou de chegar. */
  estagio: SproutStage;
  /** Dias em que a pessoa apareceu — o número que o broto diz. */
  dias: number;
  /** Onde o broto está na tela quando a cena começa. Sem isso, ele só aparece. */
  origem?: OrigemDoBroto | null;
  aoFechar: () => void;
};

export function CenaDeCrescimento({ estagio, dias, origem = null, aoFechar }: Props) {
  const { colors } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const menosMovimento = useMenosMovimento();
  const { width: largura, height: altura } = useWindowDimensions();

  /* O relógio da cena, em milissegundos. Um só, como a queda das palavras. */
  const tempo = useRef(new Animated.Value(0)).current;
  /* Antes de crescer, ele ainda é o desenho do estágio anterior. */
  const anterior = (estagio === 3 ? 2 : 1) as SproutStage;
  const [desenho, setDesenho] = useState<SproutStage>(menosMovimento ? estagio : anterior);
  const [falando, setFalando] = useState(menosMovimento);
  const [rajadas, setRajadas] = useState<Rajada[]>([]);
  const contador = useRef(0);

  /* A altura desenhada de verdade, que é o que posiciona a cena. */
  const alturaDoBroto = alturaDoMascote(desenho, TAMANHO_DO_BROTO);
  const topoDoBroto = altura * 0.24;

  /* O pé do broto na tela: é de lá que as folhas se soltam. */
  const pe = { x: largura / 2, y: topoDoBroto + alturaDoBroto };

  const soltarFolhas = (quantas: number, semente: number) => {
    const folhas = soltarFarelos({
      cx: pe.x,
      cy: pe.y - alturaDoBroto * 0.66,
      meiaLargura: alturaDoBroto * 0.24,
      meiaAltura: alturaDoBroto * 0.12,
      fim: altura,
      largura,
      quantos: quantas,
      semente,
    }).map((f) => ({
      ...f,
      /* Folha cai mais devagar que terra, e roda muito mais. */
      vy: f.vy * 0.5,
      giro: f.giro * 2.2,
      duracaoMs: Math.round(f.duracaoMs * 1.5),
      raio: Math.max(3, f.raio * 1.3),
    }));
    const id = (contador.current += 1);
    setRajadas((agora) => [...agora, { id, folhas }]);
  };

  const pular = () => {
    tempo.stopAnimation();
    tempo.setValue(ROTEIRO.fim);
    setDesenho(estagio);
    setFalando(true);
  };

  useEffect(() => {
    if (menosMovimento) {
      tempo.setValue(ROTEIRO.fim);
      return;
    }
    const animacao = Animated.timing(tempo, {
      toValue: ROTEIRO.fim,
      duration: ROTEIRO.fim,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animacao.start();

    /*
      Três marcações de tempo, e só elas passam pelo JavaScript: as duas levas
      de folhas e a troca do desenho. Tudo o mais — véu, entrada, balanços,
      balão — é interpolação do relógio, no nativo.
    */
    const marcas = [
      setTimeout(() => soltarFolhas(9, 101), ROTEIRO.balanco1.comeca + ROTEIRO.balanco1.dura * 0.3),
      setTimeout(() => {
        setDesenho(estagio);
        soltarFolhas(13, 202);
      }, ROTEIRO.cresce),
      setTimeout(() => setFalando(true), ROTEIRO.fala),
    ];

    return () => {
      animacao.stop();
      marcas.forEach(clearTimeout);
    };
    // A cena roda uma vez, do começo ao fim.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

/**
   * O fundo da cena: um gradiente da própria paleta, cobrindo a tela.
   *
   * Era um véu preto translúcido, e ele resolvia o "sumir os outros
   * recursos" pelo caminho mais pobre: escurecer tudo. O gradiente cobre do
   * mesmo jeito e ainda é do app — verde suave em cima, o creme do fundo no
   * meio, verde de novo embaixo. Os três tons vêm do tema, então ele vira o
   * gradiente escuro à noite sem nenhuma conta a mais.
   */
  const fundo = tempo.interpolate({
    inputRange: [0, ROTEIRO.viagem * 0.8],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  /**
   * A viagem: do lugar onde o broto estava até o meio da tela.
   *
   * `origem` é medida no instante em que a cena começa, então ela vale mesmo
   * que a pessoa tenha rolado a tela. Sem ela — quando não dá para medir — o
   * broto só aparece, crescendo de 0,86, que é o que a cena fazia antes.
   */
  const viagem = useMemo(() => {
    const destino = {
      x: largura / 2,
      y: topoDoBroto + alturaDoBroto / 2,
    };
    const de = origem
      ? { x: origem.x + origem.largura / 2, y: origem.y + origem.altura / 2 }
      : destino;
    const escalaInicial = origem ? Math.max(0.2, origem.altura / alturaDoBroto) : 0.86;
    const passos = [0, ROTEIRO.viagem];
    return {
      x: tempo.interpolate({
        inputRange: passos,
        outputRange: [de.x - destino.x, 0],
        extrapolate: 'clamp',
      }),
      y: tempo.interpolate({
        inputRange: passos,
        outputRange: [de.y - destino.y, 0],
        extrapolate: 'clamp',
      }),
      escala: tempo.interpolate({
        inputRange: [0, ROTEIRO.viagem, ROTEIRO.cresce, ROTEIRO.cresce + 220, ROTEIRO.cresce + 420],
        outputRange: [escalaInicial, 1, 1, 1.1, 1],
        extrapolate: 'clamp',
      }),
      opacidade: tempo.interpolate({
        inputRange: [0, ROTEIRO.viagem * 0.35],
        outputRange: [origem ? 1 : 0, 1],
        extrapolate: 'clamp',
      }),
    };
  }, [tempo, origem, largura, topoDoBroto, alturaDoBroto]);

  /** As duas balançadas, em graus, pelo pé do vaso. */
  const balanco = useMemo(() => {
    const b1 = ROTEIRO.balanco1;
    const b2 = ROTEIRO.balanco2;
    const pontos: [number, number][] = [
      [0, 0],
      [b1.comeca, 0],
      [b1.comeca + b1.dura * 0.3, -7],
      [b1.comeca + b1.dura * 0.65, 4.5],
      [b1.comeca + b1.dura, 0],
      [b2.comeca, 0],
      [b2.comeca + b2.dura * 0.34, -8.5],
      [b2.comeca + b2.dura * 0.7, 5],
      [b2.comeca + b2.dura, 0],
      [ROTEIRO.fim, 0],
    ];
    return tempo.interpolate({
      inputRange: pontos.map(([t]) => t),
      outputRange: pontos.map(([, g]) => `${g}deg`),
    });
  }, [tempo]);

  const caixa = { largura: alturaDoBroto * 1.2, altura: alturaDoBroto };

  return (
    <View style={{ flex: 1 }}>
      {/* O véu, e o alvo que pula a cena: um toque em qualquer lugar. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={falando ? 'Fechar' : 'Ver o fim da cena'}
        onPress={falando ? aoFechar : pular}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <Animated.View
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: fundo }}
        >
          <Svg width="100%" height="100%">
            <Defs>
              {/*
                Claro no meio, verde nas pontas: a luz cai onde o broto está.

                Com o creme do fundo no meio em vez do branco, o gradiente
                quase não aparecia — três tons vizinhos demais. `surface` é o
                tom mais claro do tema (branco no claro, o cinza-quente no
                escuro), e é ele que abre o vão de luz.
              */}
              <LinearGradient id={`fundo-${id}`} x1="0.1" y1="0" x2="0.6" y2="1">
                <Stop offset="0" stopColor={colors.primarySoft} />
                <Stop offset="0.24" stopColor={colors.bg} />
                <Stop offset="0.52" stopColor={colors.surface} />
                <Stop offset="0.8" stopColor={colors.bg} />
                <Stop offset="1" stopColor={colors.primarySoft} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width="100%" height="100%" fill={`url(#fundo-${id})`} />
          </Svg>
        </Animated.View>
      </Pressable>

      {/*
        O broto, girando pelo pé do vaso.

        A caixa tem o pivô no meio; as duas translações em volta do giro o
        levam para a base, que é onde uma planta se dobra.
      */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: largura / 2 - caixa.largura / 2,
          top: topoDoBroto,
          width: caixa.largura,
          height: caixa.altura,
          alignItems: 'center',
          justifyContent: 'flex-end',
          opacity: viagem.opacidade,
          transform: [
            { translateX: viagem.x },
            { translateY: viagem.y },
            { translateY: caixa.altura / 2 },
            { rotate: balanco },
            { scale: viagem.escala },
            { translateY: -caixa.altura / 2 },
          ],
        }}
      >
        {/*
          Sem halo atrás dele.

          A `LuzDeEstufa` é feita para fundo claro: contra o véu escuro ela
          vira um disco branco que engole a planta inteira — foi o que
          aconteceu na primeira tentativa. O que separa o broto do fundo aqui
          é o próprio véu.
        */}
        <Sprout mood="feliz" stage={desenho} size={TAMANHO_DO_BROTO} />
      </Animated.View>

      {/* As folhas caídas, por cima de tudo e até o fim da tela. */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
        {rajadas.map((r) => (
          <ChuvaDeFolhas
            key={r.id}
            rajada={r}
            aoTerminar={() => setRajadas((agora) => agora.filter((x) => x.id !== r.id))}
          />
        ))}
      </View>

      {/* O que ele diz, e a saída. */}
      {falando && (
        <View style={{ position: 'absolute', left: 24, right: 24, top: altura * 0.64 }}>
          <BalaoDoBroto lado="baixo">
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 16,
                lineHeight: 16 * 1.45,
                color: colors.textPrimary,
              }}
            >
              Cresci. Você apareceu <Text style={{ fontFamily: fonts.body.bold }}>{dias} dias</Text> — foi
              só isso que eu precisei.
            </Text>
          </BalaoDoBroto>
          <View style={{ marginTop: 18 }}>
            <Button onPress={aoFechar}>Continuar</Button>
          </View>
        </View>
      )}
    </View>
  );
}

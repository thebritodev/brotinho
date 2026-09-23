import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
 * ## Some de ver, não de existir
 *
 * A tela inicial continua montada e intacta por baixo — esta cena é um véu
 * escuro por cima dela. Desmontar e remontar a Home para uma comemoração
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
  entrada: 520,
  balanco1: { comeca: 700, dura: 760 },
  balanco2: { comeca: 1560, dura: 900 },
  /** O instante exato em que o desenho troca de estágio. */
  cresce: 1900,
  fala: 2500,
  fim: 3100,
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

type Props = {
  /** O estágio a que ele acabou de chegar. */
  estagio: SproutStage;
  /** Dias em que a pessoa apareceu — o número que o broto diz. */
  dias: number;
  aoFechar: () => void;
};

export function CenaDeCrescimento({ estagio, dias, aoFechar }: Props) {
  const { colors } = useTema();
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

  /** O véu que escurece a tela inteira. */
  const veu = tempo.interpolate({
    inputRange: [0, ROTEIRO.entrada],
    outputRange: [0, 0.82],
    extrapolate: 'clamp',
  });

  /** A entrada do broto: aparece e assenta. */
  const entrada = useMemo(
    () => ({
      opacidade: tempo.interpolate({
        inputRange: [0, ROTEIRO.entrada * 0.7],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
      escala: tempo.interpolate({
        inputRange: [0, ROTEIRO.entrada, ROTEIRO.cresce, ROTEIRO.cresce + 220, ROTEIRO.cresce + 420],
        outputRange: [0.86, 1, 1, 1.1, 1],
        extrapolate: 'clamp',
      }),
    }),
    [tempo],
  );

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
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#17130F', opacity: veu }}
        />
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
          opacity: entrada.opacidade,
          transform: [
            { translateY: caixa.altura / 2 },
            { rotate: balanco },
            { scale: entrada.escala },
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

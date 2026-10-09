import React, { useEffect, useId, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { fraseQueODiaDemonstra } from '../../data/composta';
import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { fonts, useTema } from '../../theme';
import { palette, type Mood } from '../../theme/tokens';
import { useAbaAVista } from '../AbasVivas';
import { useCoberta } from '../CamadaEmpilhada';
import { lacoQueSoVai } from '../laco';
import { Button } from '../core/Button';
import { AnimatedSprout } from './AnimatedSprout';
import { Nuvem } from './Cena';
import { ceuDoHumor } from './ceuDoHumor';
import { NUVEM, TEXTO_NO_CEU } from './ceuDaComposta';
import {
  CX,
  POT_TOP_Y,
  noQuadro,
  quadroDoBroto,
  type Pose,
  type SproutStage,
} from './geometriaDoBroto';
import {
  OPACIDADE_NA_QUEDA,
  TOMBO,
  curvaDaPalavra,
  planejarQueda,
} from './planoDaQueda';
import { TERRA, TEXTO_NA_TERRA, TEXTO_NA_TERRA_FRACO } from './terraDoCanteiro';

/**
 * A Composta como **cartão de destaque** — a única oferta grande da tela.
 *
 * ## A volta ao cartão, e por que não é um retrocesso
 *
 * A Composta já foi cartão de carrossel, depois `CartaoHeroi`, depois a faixa
 * que ocupava a tela inteira (`FaixaDaComposta`). Cada passo resolvia o
 * problema do anterior: o carrossel a escondia, o herói a igualava às outras
 * ofertas, e a faixa finalmente dizia "isto aqui não é mais um item".
 *
 * O preço da faixa era a tela: ela tomava os primeiros seiscentos pontos, e
 * tudo o mais — a semana, o humor, as práticas — começava abaixo da primeira
 * dobra. Numa tela inicial que precisa responder *"o que eu faço agora?"*, uma
 * ferramenta só ocupando a dobra inteira é a resposta certa dada alto demais.
 *
 * O redesenho devolve o cartão, mas **um só**. É essa a diferença que faz o
 * argumento antigo não valer: o problema nunca foi o cartão, foi ser um cartão
 * **entre cartões**. Aqui não há com quem se comparar — nada mais nesta tela
 * tem 22 de raio, fundo escuro e ilustração de 250 pontos. A hierarquia que a
 * faixa comprava com a tela inteira, este cartão compra sendo o único do seu
 * tamanho.
 *
 * ## A emenda invisível
 *
 * A camada mais funda da terra é **exatamente** a cor do corpo do cartão. Não
 * é economia de cor: é o que faz a ilustração não acabar numa borda. O chão em
 * que as palavras somem é o mesmo marrom em que o convite está escrito, então
 * não existe linha entre a cena e o texto — existe uma coisa só, que no alto é
 * paisagem e embaixo é frase.
 *
 * ## O que é do documento e o que é do app
 *
 * O documento pinta o céu com a cor chapada do humor. Aqui ele vem de
 * `ceuDoHumor`, que é a mesma pergunta respondida com as três paradas que o
 * app já usa em toda paisagem — inclusive o anoitecer, que o chapado não tem.
 * O desenho é o mesmo; o que muda é que este céu já sabe envelhecer com o dia.
 *
 * ## A animação não passa pelo JavaScript
 *
 * As palavras são `Text` de verdade, movidas por um `Animated.Value` só, com
 * `useNativeDriver`. É a mesma arquitetura da faixa e pelo mesmo motivo: um
 * relógio por palavra desencontra quando o JavaScript trava, e um laço que
 * depende do JavaScript a cada volta engasga na tela que abre o app. Ver
 * `planoDaQueda`.
 */

/** A proporção da cena, do documento: 350 por 250. */
const PROPORCAO_DA_CENA = 250 / 350;

/** Onde a crista da terra cruza a cena, em fração da altura dela. */
const CRISTA = 0.8;

/** Quanto a palavra afunda na terra antes de sumir de vez. */
const AFUNDA = 16;

/** Pontos por segundo da queda — o mesmo ritmo da faixa. */
const VELOCIDADE = 34;

/** O tempo parado antes da primeira queda, para o cartão chegar antes dela. */
const ESPERA_PARA_LER = 500;

/** A coluna do broto, em fração da largura: do documento, 236 de 350. */
const COLUNA_DO_BROTO = 236 / 350;

/**
 * Quanto abaixo da crista o pé do broto fica, em fração da altura da cena.
 *
 * Treze pontos numa cena de 250, do documento. Ele não fica **em cima** da
 * linha da terra: fica um pouco dentro dela, como fica quem está plantado. Na
 * crista exata o broto parece apoiado no chão, e não nascido dele.
 */
const PE_DO_BROTO = 13 / 250;

type Props = {
  /** A largura do cartão. A cena é desenhada nela, 1:1. */
  largura: number;
  /** O humor de hoje, que pinta o céu. `null` enquanto ninguém respondeu. */
  humor: Mood | null;
  noite: boolean;
  estagio: SproutStage;
  pose: Pose;
  /** Tocar no broto o faz se mexer. Sem balão — ver a nota no corpo. */
  aoTocarNoBroto?: () => void;
  rotuloDoBroto?: string;
  /** O cartão está à vista na rolagem? Fora dele o laço para. */
  ativa: boolean;
  titulo: string;
  /** O custo, escrito curto: "30 s". */
  custo: string;
  linha: string;
  acao: string;
  onPress: () => void;
};

export function CartaoDaComposta({
  largura,
  humor,
  noite,
  estagio,
  pose,
  aoTocarNoBroto,
  rotuloDoBroto,
  ativa,
  titulo,
  custo,
  linha,
  acao,
  onPress,
}: Props) {
  const { shadows } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const menosMovimento = useMenosMovimento();
  const coberta = useCoberta();
  const abaAVista = useAbaAVista();
  const rodando = ativa && abaAVista && !coberta;

  const alturaDaCena = Math.round(largura * PROPORCAO_DA_CENA);
  const crista = Math.round(alturaDaCena * CRISTA);
  const ceu = ceuDoHumor(humor, noite);

  /*
    O broto mede um quinto da largura do cartão.

    É a medida do documento, convertida — e a conversão é onde eu errei duas
    vezes. Lá o broto é desenhado numa tela de 200 por 224 com escala 1,05, e é
    tentador ler isso como "o broto tem 210 de largura". Não tem: a **planta**
    ocupa uns noventa daqueles duzentos, e o resto da tela é o vaso, que esta
    cena não desenha. O `size` do `Sprout` fala na mesma moeda da tela de 200,
    então o número que importa é o da planta, não o da tela.

    Na faixa que isto substitui ele era 40% da largura da tela, porque dividia
    aquilo com o cabeçalho e com o balão de fala. Aqui ele divide a cena com as
    palavras caindo, que é outra conta.
  */
  const tamanhoDoBroto = Math.round(largura * 0.22);
  const quadro = quadroDoBroto(estagio, tamanhoDoBroto, { showPot: false });
  const peDoBroto = noQuadro(quadro, CX, POT_TOP_Y);
  const xDoBroto = Math.min(largura - quadro.largura / 2 - 6, largura * COLUNA_DO_BROTO);

  const palavras = useMemo(
    () => fraseQueODiaDemonstra().split(/\s+/).filter(Boolean),
    [],
  );

  /** Do alto da cena até um tanto abaixo da crista, onde a palavra some. */
  const distancia = crista + AFUNDA;

  const plano = useMemo(
    () =>
      planejarQueda({
        palavras,
        larguraDaTela: largura,
        distancia,
        velocidade: VELOCIDADE,
        /* As palavras param antes do broto — ver `limiteDireito`. */
        /*
          As palavras param na coluna do broto, e não na borda dele.

          Parar na borda esquerda das folhas deixaria noventa pontos de céu
          para uma palavra como "demitido", e `planejarQueda` encolheria a
          letra até caber — a frase ficaria legível só de perto. Elas podem
          roçar as folhas de fora; o que não podem é cair em cima da cara dele.
        */
        limiteDireito: xDoBroto - 10,
      }),
    [palavras, largura, distancia, xDoBroto, quadro.largura],
  );

  const tempo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    tempo.setValue(0);
    if (!rodando || menosMovimento) return;
    const volta = (ate: number) =>
      Animated.timing(tempo, {
        toValue: ate,
        duration: plano.cicloMs,
        easing: Easing.linear,
        useNativeDriver: true,
      });
    const animacao = Animated.sequence([
      volta(1),
      lacoQueSoVai(tempo, { ms: plano.cicloMs, easing: Easing.linear, ate: 2 }),
    ]);
    const espera = setTimeout(() => animacao.start(), ESPERA_PARA_LER);
    return () => {
      clearTimeout(espera);
      animacao.stop();
    };
  }, [rodando, menosMovimento, tempo, plano.cicloMs]);

  return (
    <View
      style={{
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: palette.brown700,
        ...shadows.md,
      }}
    >
      {/* ---------------- A cena ---------------- */}
      <View style={{ height: alturaDaCena }}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${largura} ${alturaDaCena}`}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <Defs>
            <LinearGradient id={`ceu-${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={ceu.alto} />
              <Stop offset="0.55" stopColor={ceu.meio} />
              <Stop offset="1" stopColor={ceu.baixo} />
            </LinearGradient>
          </Defs>

          <Rect x={0} y={0} width={largura} height={alturaDaCena} fill={`url(#ceu-${id})`} />

          {/*
            As estrelas só existem de noite, e piscam por conta própria — são
            `Circle` com opacidade fixa, e quem as faz piscar é o céu que
            escurece em volta. Um laço por estrela seria seis laços a mais numa
            tela que já tem um.
          */}
          {noite &&
            [
              [0.1, 0.28],
              [0.34, 0.2],
              [0.86, 0.36],
              [0.71, 0.24],
              [0.22, 0.6],
              [0.94, 0.56],
            ].map(([fx, fy]) => (
              <Circle
                key={`${fx}:${fy}`}
                cx={largura * fx}
                cy={alturaDaCena * fy}
                r={1.8}
                fill="#FFFFFF"
                opacity={0.8}
              />
            ))}

          {/*
            A terra, em três camadas — e a de baixo é a cor do cartão.

            A primeira é o morro claro ao fundo, quase translúcido: é ele que
            dá distância entre a crista e o horizonte. A segunda é o barro
            iluminado. A terceira é o cartão, subindo até encontrar as outras
            duas — ver a nota da emenda invisível, no alto do arquivo.
          */}
          <Path
            d={
              `M0 ${crista - 22} C ${largura * 0.3} ${crista - 50} ${largura * 0.7} ${crista - 20} ` +
              `${largura} ${crista - 42} L ${largura} ${alturaDaCena} L 0 ${alturaDaCena} Z`
            }
            fill="#FFFFFF"
            opacity={0.4}
          />
          <Path
            d={
              `M0 ${crista} C ${largura * 0.3} ${crista - 22} ${largura * 0.7} ${crista - 22} ` +
              `${largura} ${crista} L ${largura} ${alturaDaCena} L 0 ${alturaDaCena} Z`
            }
            fill={TERRA}
          />
          <Path
            d={
              `M0 ${crista + 8} C ${largura * 0.3} ${crista - 14} ${largura * 0.7} ${crista - 14} ` +
              `${largura} ${crista + 8} L ${largura} ${alturaDaCena} L 0 ${alturaDaCena} Z`
            }
            fill={palette.brown700}
          />
        </Svg>

        {/*
          As nuvens ficam fora do SVG do céu porque elas andam, e quem as faz
          andar é `Animated` — ver `Nuvem`. Dentro do SVG elas precisariam de um
          render por quadro, que é exatamente o que esta tela não pode pagar.
        */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
          <Nuvem x={largura * 0.57} y={alturaDaCena * 0.28} escala={0.9} ms={14000} cor={NUVEM} k={1} parado={!rodando} />
          <Nuvem x={largura * 0.26} y={alturaDaCena * 0.6} escala={0.6} ms={11000} cor={NUVEM} k={2} parado={!rodando} />
          <Nuvem x={largura * 0.8} y={alturaDaCena * 0.68} escala={0.5} ms={9000} cor={NUVEM} k={3} parado={!rodando} />
        </View>

        {/* As palavras caindo, cada uma na coluna dela. Ver `planoDaQueda`. */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, width: largura, height: alturaDaCena }}
        >
          {plano.palavras.map((p, i) => {
            const curva = (pontos: readonly (readonly [number, number])[]) =>
              curvaDaPalavra(p.inicio, plano.janela, pontos);
            const andar = tempo.interpolate(curva([[0, 0], [1, distancia]]));
            const opacidade = tempo.interpolate(curva(OPACIDADE_NA_QUEDA));
            const graus = curva([[0, 0], [1, p.lado * TOMBO]]);
            const giro = tempo.interpolate({
              inputRange: graus.inputRange,
              outputRange: graus.outputRange.map((g) => `${g}deg`),
            });
            const coluna = p.centro - largura / 2;
            return (
              <Animated.Text
                key={`${i}-${p.palavra}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontFamily: fonts.body.bold,
                  fontSize: p.fonte,
                  lineHeight: p.linha,
                  /* Não segue o tema, porque o céu por onde elas caem também
                     não segue. Ver `TEXTO_NO_CEU`. */
                  color: TEXTO_NO_CEU,
                  opacity: opacidade,
                  transform: [{ translateX: coluna }, { translateY: andar }, { rotate: giro }],
                }}
              >
                {p.palavra}
              </Animated.Text>
            );
          })}
        </View>

        {/*
          O broto, plantado na terra — e tocável.

          Sem balão de fala, ao contrário da faixa que isto substitui, e é
          escolha do documento: num cartão de 250 de altura, um balão ocuparia a
          metade do céu por onde as palavras caem, e a demonstração — que é a
          razão de o cartão existir — perderia para uma frase. Ele continua
          respondendo ao toque com o corpo, que é o que um personagem faz quando
          não está falando.
        */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rotuloDoBroto ?? 'Mexer com o broto'}
          onPress={aoTocarNoBroto}
          disabled={!aoTocarNoBroto}
          style={{
            position: 'absolute',
            left: xDoBroto - quadro.largura / 2,
            top: crista + alturaDaCena * PE_DO_BROTO - peDoBroto.y,
          }}
        >
          <AnimatedSprout
            mood={humor ?? 'neutro'}
            stage={estagio}
            size={tamanhoDoBroto}
            showPot={false}
            pose={pose}
            bamboleia={rodando}
          />
        </Pressable>

        {/* A etiqueta: o nome da ferramenta, para quem não conhece o desenho. */}
        <View
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 9,
            backgroundColor: '#FFFFFF',
          }}
        >
          <Text
            style={{
              fontFamily: fonts.body.extraBold,
              fontSize: 12,
              letterSpacing: 0.96,
              color: palette.green700,
            }}
          >
            COMPOSTA
          </Text>
        </View>
      </View>

      {/* ---------------- O convite ---------------- */}
      <View style={{ paddingTop: 6, paddingHorizontal: 20, paddingBottom: 20, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              flex: 1,
              fontFamily: fonts.display.bold,
              fontSize: 25,
              lineHeight: 25 * 1.15,
              color: TEXTO_NA_TERRA,
            }}
          >
            {titulo}
          </Text>
          <View
            style={{
              paddingVertical: 4,
              paddingHorizontal: 9,
              borderRadius: 8,
              /* Vidro sobre a terra, e não uma cor da paleta: ele precisa
                 funcionar sobre o marrom do cartão nos dois temas, e o marrom
                 do cartão é o mesmo nos dois. */
              backgroundColor: 'rgba(251,246,236,0.12)',
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.extraBold,
                fontSize: 12.5,
                color: TEXTO_NA_TERRA_FRACO,
              }}
            >
              {custo}
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.45,
            color: TEXTO_NA_TERRA_FRACO,
          }}
        >
          {linha}
        </Text>

        <View style={{ marginTop: 6 }}>
          <Button onPress={onPress}>{acao}</Button>
        </View>
      </View>
    </View>
  );
}

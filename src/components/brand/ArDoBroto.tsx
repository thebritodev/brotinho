import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { lacoDeIdaEVolta, lacoQueSoVai } from '../laco';
import { palette } from '../../theme/tokens';
import { AR_DO_BROTO, noAr, type LugarNoAr } from './geometriaDoBroto';

/**
 * O ar em volta do broto: os zês de quem dorme, os brilhos de quem comemora.
 *
 * ## Por que fica fora do SVG
 *
 * No protótipo os dois são `<animate>` dentro do desenho. O `react-native-svg`
 * não roda SMIL, e animar propriedade de nó de SVG pelo `Animated` não pega no
 * `react-native-web` — a nota longa em `components/laco` conta o episódio.
 *
 * Cada zê e cada brilho é pequeno e independente, então sai barato dar a cada
 * um a sua `Animated.View`: opacidade e deslocamento são exatamente as duas
 * coisas que o driver nativo aceita, e o desenho lá dentro fica parado.
 *
 * ## Por que a posição vem do raio do bulbo
 *
 * O broto muda de tamanho entre os três estágios — o bulbo vai de 20 a 33 de
 * raio. Um deslocamento fixo grudaria os zês na cabeça do menor e os soltaria
 * longe da do maior. Ver `AR_DO_BROTO`, que guarda cada lugar como uma conta
 * sobre o raio em vez de um par de números.
 */

/** O ciclo de um zê, e o atraso entre um e o seguinte. */
const ZZZ_MS = 3000;
const ZZZ_ATRASO_MS = 600;

/** O ciclo do brilho mais rápido; cada um seguinte é um pouco mais lento. */
const BRILHO_MS = 1400;
const BRILHO_PASSO_MS = 300;

/**
 * O zê, desenhado e não escrito.
 *
 * Escrever a letra pedia `<Text>` de SVG com a família Baloo 2, e fonte
 * customizada dentro de SVG no Android é justamente o lugar onde ela falha em
 * silêncio e vira a fonte do sistema. Três traços resolvem, e ficam iguais em
 * todo aparelho.
 */
const ZE = 'M -4 -4 H 4 L -4 4 H 4';

/** O brilho de quatro pontas, o mesmo de `Decorations` e das cenas. */
const BRILHO = 'M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z';

/** O tamanho de referência de um zê e de um brilho, em unidades de desenho. */
const LADO_DO_ZE = 12;
const LADO_DO_BRILHO = 20;

type Props = {
  ar: 'zzz' | 'brilhos';
  /** O centro do bulbo, em pixels, dentro do quadro de quem chama. */
  centro: { x: number; y: number };
  /** O raio do bulbo, em unidades de desenho. */
  raio: number;
  /** Quantos pixels vale uma unidade de desenho. */
  escala: number;
};

export function ArDoBroto({ ar, centro, raio, escala }: Props) {
  const menosMovimento = useMenosMovimento();
  const itens = AR_DO_BROTO[ar];

  return (
    /*
      A caixa ocupa a moldura do broto inteira — e não pode ter tamanho zero.

      Ela era `left: 0, top: 0` e mais nada: como os zês dentro dela são todos
      absolutos, ela media zero por zero. No navegador isso não muda nada. No
      iPhone, era o contorno em forma de pílula em cima do broto dormindo, que
      o Pedro viu de novo a cada build.

      O mecanismo é do iOS. A arquitetura nova recicla as `View` nativas: a de
      uma opção que sai de tela é guardada e reaproveitada para a próxima
      `View` que precisar. Ao reaproveitar, quem apaga as camadas de sombra da
      dona antiga é o `invalidateLayer` — e a primeira linha dele é
      `if (bounds == zero) return`. Uma `View` de tamanho zero nunca chega a
      apagar nada. Então, quando a peça reaproveitada para esta caixa tinha
      sido uma opção do onboarding — 44 de altura, cantos redondos e o anel de
      luz da sombra `sm` —, o anel continuava desenhado, do tamanho da opção,
      a partir do canto do broto. Por isso havia um zê dentro do contorno: a
      caixa é a dos zês.

      Com tamanho de verdade, o `invalidateLayer` roda e refaz as camadas a
      partir das propriedades desta caixa, que não tem sombra nenhuma. As
      posições dos zês não mudam: continuam contadas do mesmo canto.

      Ver `confere-caixa-sem-tamanho`, que impede o mesmo formato de voltar.
    */
    <View
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      {itens.map((lugar, i) => (
        <Pedaco
          key={i}
          ar={ar}
          lugar={lugar}
          indice={i}
          centro={centro}
          raio={raio}
          escala={escala}
          parado={menosMovimento}
        />
      ))}
    </View>
  );
}

function Pedaco({
  ar,
  lugar,
  indice,
  centro,
  raio,
  escala,
  parado,
}: {
  ar: 'zzz' | 'brilhos';
  lugar: LugarNoAr;
  indice: number;
  centro: { x: number; y: number };
  raio: number;
  escala: number;
  parado: boolean;
}) {
  const passo = useRef(new Animated.Value(0)).current;

  const ms = ar === 'zzz' ? ZZZ_MS : BRILHO_MS + indice * BRILHO_PASSO_MS;
  const atraso = ar === 'zzz' ? indice * ZZZ_ATRASO_MS : 0;

  useEffect(() => {
    if (parado) {
      /*
        Parado não quer dizer invisível.

        Quem pediu menos movimento continua precisando de saber que o broto
        está dormindo. O valor fica no meio do ciclo, que é onde os dois
        desenhos estão à mostra e em repouso.
      */
      passo.setValue(0.5);
      return;
    }
    passo.setValue(0);
    /*
      O zê sobe e some numa passada só; o brilho pisca e volta.

      São os dois formatos de laço, e a escolha não é de gosto: um zê que
      voltasse animando desceria de volta para a cabeça do broto.
    */
    const laco =
      ar === 'zzz'
        ? lacoQueSoVai(passo, { ms, easing: Easing.linear })
        : lacoDeIdaEVolta(passo, { ms });
    const id = setTimeout(() => laco.start(), atraso);
    return () => {
      clearTimeout(id);
      laco.stop();
    };
  }, [ar, ms, atraso, parado]);

  const onde = noAr(lugar, raio);
  const lado = (ar === 'zzz' ? LADO_DO_ZE : LADO_DO_BRILHO) * lugar.escala;
  const ladoPx = lado * escala;

  const opacity =
    ar === 'zzz'
      ? passo.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 0] })
      : passo.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.25, 1] });

  /* O zê sobe e escorrega para o lado enquanto sobe; o brilho fica no lugar. */
  const translateY =
    ar === 'zzz'
      ? passo.interpolate({ inputRange: [0, 1], outputRange: [6 * escala, -8 * escala] })
      : 0;
  const translateX =
    ar === 'zzz'
      ? passo.interpolate({ inputRange: [0, 1], outputRange: [0, 4 * escala] })
      : 0;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: centro.x + onde.x * escala - ladoPx / 2,
        top: centro.y + onde.y * escala - ladoPx / 2,
        width: ladoPx,
        height: ladoPx,
        opacity,
        transform: [{ translateX }, { translateY }],
      }}
    >
      <Svg width={ladoPx} height={ladoPx} viewBox={`${-lado / 2} ${-lado / 2} ${lado} ${lado}`}>
        {ar === 'zzz' ? (
          <Path
            d={ZE}
            transform={`scale(${lugar.escala})`}
            stroke={palette.lavender300}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : (
          <Path
            d={BRILHO}
            transform={`scale(${lugar.escala})`}
            fill={indice % 2 === 0 ? palette.amber400 : palette.terracotta400}
          />
        )}
      </Svg>
    </Animated.View>
  );
}

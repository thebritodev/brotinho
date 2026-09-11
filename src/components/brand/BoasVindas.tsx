import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { fonts, useTema } from '../../theme';
import { GrowingSprout } from './GrowingSprout';
import { LuzDeEstufa } from './LuzDeEstufa';
import {
  FOLGA_DA_CAIXA,
  LARGURA_DE_REFERENCIA,
  POT_TOP_Y,
  VASO_ALCANCA,
  alturaDoMascote,
} from './geometriaDoBroto';

/**
 * BoasVindas — a chegada, na primeira vez que a Home abre depois da assinatura.
 *
 * ## Por que existe
 *
 * O onboarding termina numa compra: a loja, o Face ID, "Assinatura
 * confirmada". O que vinha depois era a Home, direto, igual a qualquer outra
 * abertura do app. O momento em que alguém decide cuidar de si — e paga por
 * isso — passava sem nenhuma marca, e a primeira impressão de dentro do app
 * ficava sendo a de um formulário que acabou.
 *
 * ## A encenação
 *
 * O vaso chega, a terra espirra da boca dele e o broto cresce as três fases na
 * frente dela, balançando a cada salto. Só então aparecem as palavras. A ordem
 * é a de sempre neste app: primeiro o broto faz, depois o texto diz.
 *
 * O toque que fecha só vale depois que as palavras apareceram. Antes disso um
 * dedo ainda apoiado na tela — de quem acabou de confirmar a compra — fecharia
 * tudo antes de ela ver alguma coisa.
 *
 * Quem pediu menos movimento no sistema vê tudo já pronto, sem a encenação, e
 * pode fechar na hora.
 */

/** Tons da terra, os mesmos do canteiro da Frase do dia (`Desenterrar`). */
const TERRA = '#8A7A63';
const TERRA_FUNDA = '#5F5443';

/** Quando cada coisa acontece, em ms desde a abertura. */
const VASO_EM = 150;
const VASO_MS = 460;
const TERRA_EM = 540;
const TERRA_MS = 720;
/**
 * O broto termina de crescer por volta de 1,5 s (ver `GrowingSprout`): as
 * palavras vêm logo depois do último salto, não durante ele.
 */
const PALAVRAS_EM = 1850;
const PALAVRAS_MS = 520;
const CONVITE_EM = 2700;
const SAIDA_MS = 320;

/**
 * Os torrões que espirram do vaso: deslocamento lateral e altura do pulo, em
 * unidades do desenho do broto (as mesmas da caixa de 200 de largura).
 */
const TORROES = [
  { dx: -64, alto: 22, r: 3.4, cor: TERRA },
  { dx: -48, alto: 34, r: 2.6, cor: TERRA_FUNDA },
  { dx: -34, alto: 26, r: 3, cor: TERRA },
  { dx: 36, alto: 30, r: 2.4, cor: TERRA_FUNDA },
  { dx: 50, alto: 36, r: 3.2, cor: TERRA },
  { dx: 66, alto: 18, r: 2.6, cor: TERRA_FUNDA },
];

type Props = {
  visivel: boolean;
  /** O nome dela. Vazio, o título fica só "Boas-vindas". */
  nome: string;
  /** Chamado depois que a tela terminou de sair. */
  aoFechar: () => void;
};

export function BoasVindas({ visivel, nome, aoFechar }: Props) {
  const { colors, palette } = useTema();
  const { width } = useWindowDimensions();

  const tamanho = Math.min(width * 0.56, 240);
  /*
    O palco tem a altura do broto já crescido, e o broto fica encostado no pé
    dele. Sem isso, cada fase — que é mais alta que a anterior — empurraria o
    vaso para baixo, e o que devia parecer crescer pareceria escorregar.
  */
  const alturaDoPalco = alturaDoMascote(3, tamanho);
  const escala = tamanho / LARGURA_DE_REFERENCIA;
  /** A boca do vaso, medida do pé do palco — a mesma em qualquer fase. */
  const bocaDoVaso = (VASO_ALCANCA.baixo + FOLGA_DA_CAIXA - POT_TOP_Y) * escala;

  const fundo = useRef(new Animated.Value(0)).current;
  const vaso = useRef(new Animated.Value(0)).current;
  const terra = useRef(new Animated.Value(0)).current;
  const palavras = useRef(new Animated.Value(0)).current;
  const convite = useRef(new Animated.Value(0)).current;

  const [podeFechar, setPodeFechar] = useState(false);
  const saindo = useRef(false);

  useEffect(() => {
    if (!visivel) return;
    let vivo = true;
    let animacao: Animated.CompositeAnimation | null = null;
    let liberar: ReturnType<typeof setTimeout> | undefined;

    void AccessibilityInfo.isReduceMotionEnabled().then((menosMovimento) => {
      if (!vivo) return;
      if (menosMovimento) {
        [fundo, vaso, palavras, convite].forEach((v) => v.setValue(1));
        setPodeFechar(true);
        return;
      }

      const aos = (ms: number, a: Animated.CompositeAnimation) =>
        Animated.sequence([Animated.delay(ms), a]);

      animacao = Animated.parallel([
        Animated.timing(fundo, { toValue: 1, duration: 260, useNativeDriver: true }),
        aos(
          VASO_EM,
          Animated.timing(vaso, {
            toValue: 1,
            duration: VASO_MS,
            easing: Easing.out(Easing.back(1.6)),
            useNativeDriver: true,
          }),
        ),
        aos(
          TERRA_EM,
          // Linear: a curva do pulo já está desenhada nas interpolações.
          Animated.timing(terra, {
            toValue: 1,
            duration: TERRA_MS,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ),
        aos(
          PALAVRAS_EM,
          Animated.timing(palavras, {
            toValue: 1,
            duration: PALAVRAS_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
        aos(
          CONVITE_EM,
          Animated.timing(convite, { toValue: 1, duration: 420, useNativeDriver: true }),
        ),
      ]);
      animacao.start();
      liberar = setTimeout(() => vivo && setPodeFechar(true), PALAVRAS_EM);
    });

    return () => {
      vivo = false;
      animacao?.stop();
      clearTimeout(liberar);
    };
  }, [visivel, fundo, vaso, terra, palavras, convite]);

  const fechar = () => {
    if (!podeFechar || saindo.current) return;
    saindo.current = true;
    Animated.timing(fundo, {
      toValue: 0,
      duration: SAIDA_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => aoFechar());
  };

  const titulo = nome.trim() ? `Boas-vindas, ${nome.trim()}` : 'Boas-vindas';

  return (
    <Modal visible={visivel} transparent animationType="none" statusBarTranslucent onRequestClose={fechar}>
      <Animated.View style={{ flex: 1, opacity: fundo, backgroundColor: colors.bg }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${titulo}. Seu jardim começa hoje. Toque para começar.`}
          onPress={fechar}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 28 }}
        >
          <LuzDeEstufa diametro={Math.round(width * 0.9)}>
            <Animated.View
              style={{
                width: tamanho,
                height: alturaDoPalco,
                justifyContent: 'flex-end',
                opacity: vaso.interpolate({ inputRange: [0, 0.4], outputRange: [0, 1], extrapolate: 'clamp' }),
                transformOrigin: '50% 100%',
                transform: [
                  { translateY: vaso.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                  { scale: vaso.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) },
                ],
              }}
            >
              {/*
                A terra que espirra da boca do vaso quando o broto rompe.

                Vai para os lados, e desenhada antes do broto — atrás dele.
                Na primeira versão os torrões subiam pelo meio e passavam por
                cima da carinha: parecia sujeira no rosto, não terra se abrindo.
              */}
              {TORROES.map((t, i) => {
                const alto = t.alto * escala;
                return (
                  <Animated.View
                    key={i}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: tamanho / 2 - t.r * escala,
                      bottom: bocaDoVaso - t.r * escala,
                      width: t.r * 2 * escala,
                      height: t.r * 2 * escala,
                      borderRadius: t.r * escala,
                      backgroundColor: t.cor,
                      opacity: terra.interpolate({
                        inputRange: [0, 0.06, 0.7, 1],
                        outputRange: [0, 1, 1, 0],
                      }),
                      transform: [
                        { translateX: terra.interpolate({ inputRange: [0, 1], outputRange: [0, t.dx * escala] }) },
                        {
                          // Um arco de pulo: sobe depressa, para no alto, cai de volta.
                          translateY: terra.interpolate({
                            inputRange: [0, 0.25, 0.5, 0.75, 1],
                            outputRange: [0, -alto * 0.75, -alto, -alto * 0.7, -alto * 0.05],
                          }),
                        },
                      ],
                    }}
                  />
                );
              })}

              {visivel && <GrowingSprout size={tamanho} />}
            </Animated.View>
          </LuzDeEstufa>

          <Animated.View
            style={{
              alignItems: 'center',
              gap: 8,
              /*
                O quadro da luz é bem maior que o brilho que se vê — o
                gradiente precisa de espaço para apagar —, e sem isto as
                palavras ficavam lá embaixo, soltas do broto a quem dão voz.
              */
              marginTop: -44,
              opacity: palavras,
              transform: [{ translateY: palavras.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
            }}
          >
            <Text
              style={{
                fontFamily: fonts.display.bold,
                fontSize: 32,
                lineHeight: 32 * 1.25,
                color: colors.textPrimary,
                textAlign: 'center',
              }}
            >
              {titulo}
            </Text>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 17,
                lineHeight: 17 * 1.5,
                color: palette.brown700,
                textAlign: 'center',
              }}
            >
              Seu jardim começa hoje.
            </Text>
          </Animated.View>

          <Animated.Text
            style={{
              opacity: convite,
              fontFamily: fonts.body.bold,
              fontSize: 13,
              color: colors.textSecondary,
            }}
          >
            Toque para começar
          </Animated.Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

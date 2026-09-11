import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTema } from '../../theme';

/**
 * ProgressStem — o progresso do onboarding como um caule que ganha folhas.
 *
 * Eram dez pontinhos iguais. Trocar por um broto que cresce faz a barra de
 * progresso contar a mesma história do app: você avança, ele cresce.
 *
 * ## O que o redesenho mudou aqui
 *
 * Quase nada de forma, e é o resultado que interessa: o documento desenha este
 * caule com a **mesma** folha, a mesma altura de 22, a mesma margem de 8 e o
 * mesmo espaçamento. O que ele muda é o verde do trecho percorrido, de
 * `green600` para `green700`.
 *
 * Não é preciosismo. Este é o único indicador de progresso do app, e ele fica
 * num fundo creme, em traço de 3 pixels: no tom mais claro, "o que já foi" e
 * "o que falta" se separavam por pouco mais do que a diferença entre um bege e
 * um verde acinzentado. Um tom mais fundo é o que faz a distinção sobreviver a
 * uma tela ao sol.
 *
 * ## A folha nova brota
 *
 * A metáfora pedia movimento e não tinha: a folha trocava de bege para verde
 * de um quadro para o outro, e ninguém lê isso como crescer. Agora o caule
 * avança primeiro até o passo novo, e só então a folha nasce ali — do zero,
 * a partir do ponto em que encosta no caule, passando um pouco do tamanho e
 * voltando, e desenrolando de um ângulo fechado. A ordem importa: é o caule
 * que leva a seiva até a folha, e a folha que aparece antes do caule chegar
 * parece colada, não crescida.
 *
 * Só o passo que acabou de ser alcançado cresce. Quem volta de uma interrupção
 * no passo nove vê as nove folhas já prontas — nove folhas brotando em fila a
 * cada abertura do app seriam uma cerimônia, não um progresso. Voltar um passo
 * recolhe a folha, mais depressa do que ela nasceu: desfazer não é evento.
 */

const ALTURA = 22;
/** Folha desenhada na origem, apontando para a direita e para cima. */
const FOLHA = 'M0 0 C 3 -6 9 -8 13 -6 C 12 -1 7 2 0 0 Z';
/**
 * Lado da caixa de cada folha. A folha nasce no centro dela, e é em torno do
 * centro que o React Native escala e gira — então o centro tem de ser a base
 * da folha, o ponto em que ela encosta no caule.
 */
const CAIXA = 30;
const TRACO = 3;

/** O caule chega primeiro; a folha espera ele encostar. */
const CAULE_MS = 260;
const FOLHA_MS = 560;
const RECOLHE_MS = 200;

type Props = {
  /** Passo atual, começando em zero. */
  step: number;
  total: number;
  width: number;
};

export function ProgressStem({ step, total, width }: Props) {
  const { colors, palette } = useTema();
  // Margem nas pontas: a primeira e a última folha não encostam na borda.
  const margem = 8;
  // Largura negativa ou zero gera um SVG inválido. Quem chama já se protege,
  // mas um componente reutilizável não deveria depender disso.
  const largura = Math.max(1, width);
  const util = Math.max(1, largura - margem * 2);
  const passo = util / Math.max(1, total - 1);
  const y = ALTURA / 2;
  const xDe = (i: number) => margem + passo * i;

  /**
   * Quanto cada folha já cresceu: 0 é o botão bege, 1 é a folha verde pronta.
   * Nasce no estado final do passo em que o componente abriu — ver o topo.
   */
  const folhas = useRef<Animated.Value[]>([]);
  if (folhas.current.length !== total) {
    folhas.current = Array.from(
      { length: total },
      (_, i) => folhas.current[i] ?? new Animated.Value(i <= step ? 1 : 0),
    );
  }
  /** Até onde vai o verde do caule, em passos (fracionário durante o avanço). */
  const caule = useRef(new Animated.Value(step)).current;
  const anterior = useRef(step);

  const [menosMovimento, setMenosMovimento] = useState(false);
  useEffect(() => {
    let vivo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((ligado) => {
      if (vivo) setMenosMovimento(ligado);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setMenosMovimento);
    return () => {
      vivo = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    const de = anterior.current;
    anterior.current = step;
    if (de === step) return;

    const avancou = step > de;
    const mudadas = folhas.current.filter((_, i) =>
      avancou ? i > de && i <= step : i > step && i <= de,
    );

    if (menosMovimento) {
      caule.setValue(step);
      mudadas.forEach((v) => v.setValue(avancou ? 1 : 0));
      return;
    }

    const animacao = avancou
      ? Animated.sequence([
          Animated.timing(caule, {
            toValue: step,
            duration: CAULE_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.stagger(
            90,
            mudadas.map((v) =>
              Animated.timing(v, {
                toValue: 1,
                duration: FOLHA_MS,
                // O "passar do ponto e voltar" é o que lê como vivo.
                easing: Easing.out(Easing.back(1.8)),
                useNativeDriver: true,
              }),
            ),
          ),
        ])
      : Animated.parallel([
          ...mudadas.map((v) =>
            Animated.timing(v, {
              toValue: 0,
              duration: RECOLHE_MS,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ),
          Animated.timing(caule, {
            toValue: step,
            duration: RECOLHE_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ]);

    animacao.start();
    return () => animacao.stop();
  }, [step, menosMovimento, caule]);

  return (
    <View style={{ width: largura, height: ALTURA }}>
      {/* O caule inteiro, apagado. */}
      <Svg width={largura} height={ALTURA} style={{ position: 'absolute' }}>
        <Path
          d={`M${margem} ${y} L${largura - margem} ${y}`}
          stroke={palette.brown200}
          strokeWidth={TRACO}
          strokeLinecap="round"
        />
      </Svg>

      {/*
        O trecho percorrido, por cima. É uma View e não um traço do SVG porque
        precisa crescer animado, e animar o `d` de um Path exigiria refazer o
        desenho a cada quadro. Borda arredondada pelo mesmo raio do traço, para
        a ponta continuar igual à do `strokeLinecap`.
      */}
      <Animated.View
        style={{
          position: 'absolute',
          left: margem - TRACO / 2,
          top: y - TRACO / 2,
          height: TRACO,
          borderRadius: TRACO / 2,
          backgroundColor: colors.primaryStrong,
          width: caule.interpolate({
            inputRange: [0, Math.max(1, total - 1)],
            outputRange: [TRACO, passo * Math.max(1, total - 1) + TRACO],
            extrapolate: 'clamp',
          }),
        }}
      />

      {folhas.current.map((v, i) => {
        // Alterna para cima e para baixo, como folhas num caule de verdade.
        const inverte = i % 2 === 0;
        const folha = `translate(${CAIXA / 2} ${CAIXA / 2}) scale(1 ${inverte ? -1 : 1})`;
        return (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: xDe(i) - CAIXA / 2,
              top: y - CAIXA / 2,
              width: CAIXA,
              height: CAIXA,
            }}
          >
            {/* O botão bege some logo no começo: quem cresce ali é a folha nova. */}
            <Animated.View
              style={{
                position: 'absolute',
                opacity: v.interpolate({ inputRange: [0, 0.3], outputRange: [0.7, 0], extrapolate: 'clamp' }),
              }}
            >
              <Svg width={CAIXA} height={CAIXA}>
                <Path d={FOLHA} transform={folha} fill={palette.brown200} />
              </Svg>
            </Animated.View>

            <Animated.View
              style={{
                position: 'absolute',
                opacity: v.interpolate({ inputRange: [0, 0.05], outputRange: [0, 1], extrapolate: 'clamp' }),
                transform: [
                  // A folha desenrola: nasce deitada rente ao caule e abre.
                  // Horário deita a de cima; anti-horário, a de baixo.
                  {
                    rotate: v.interpolate({
                      inputRange: [0, 1],
                      outputRange: [inverte ? '-28deg' : '28deg', '0deg'],
                    }),
                  },
                  { scale: v },
                ],
              }}
            >
              <Svg width={CAIXA} height={CAIXA}>
                <Path d={FOLHA} transform={folha} fill={colors.primaryStrong} />
              </Svg>
            </Animated.View>
          </View>
        );
      })}
    </View>
  );
}

import React, { useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { tracos } from '../../theme';

/**
 * Desenterrar — a terra racha, um botão sobe e desabrocha.
 *
 * ## Por que não é o broto crescendo
 *
 * O primeiro desenho deste recurso era o `GrowingSprout`: três fases, do chão,
 * exatamente como foi imaginado. Ele já existe e faz isso muito bem — o problema
 * é que **já quer dizer outra coisa**. O comentário dele é explícito:
 *
 * > As práticas param no estágio 2 de propósito: fazer um exercício de cinco
 * > minutos não é a mesma conquista que compostar um pensamento, e o desenho
 * > não deve dizer que é.
 *
 * Crescer, no Brotinho, quer dizer *você fez alguma coisa*, e o tamanho do
 * crescimento é medido: o broto da Home sai de `daysCaredFor`, a Composta vai
 * até o estágio 3, as práticas param no 2. Se tocar um botão também fizesse um
 * broto crescer em três fases, crescer passaria a querer dizer *você tocou num
 * botão* — e isso não estragaria esta tela, estragaria as outras três.
 *
 * Então o movimento é parecido e a gramática é oposta: não é uma planta que a
 * pessoa criou, é uma coisa que estava enterrada e ela desenterrou. Casa com a
 * Composta, que é onde se enterra pensamento.
 *
 * ## As fases
 *
 * 1. **A terra racha.** Duas abas se erguem, o canteiro estremece e saltam
 *    torrões.
 * 2. **Sobe.** O botão vem de trás da terra, passa um pouco do ponto e assenta.
 * 3. **Entreabre.** As pétalas se soltam do botão sem abrir de vez.
 * 4. **Abre.** Elas se espalham e o miolo acende.
 *
 * O estágio 3 existe por um motivo só: sem ele a flor **estala** em vez de
 * desabrochar. Trocar o botão fechado direto pela flor aberta é troca de figura,
 * não abertura, por mais suave que seja a transição de opacidade entre os dois.
 *
 * ## Por que tudo é opacidade e transformação
 *
 * Porque são as duas coisas que rodam na thread nativa. Animar `d` ou `fill` de
 * SVG obrigaria a atravessar a ponte a cada quadro, e o `AnimatedSprout` já
 * documenta essa mesma escolha por ter perdido um disco de fundo para ela. Nada
 * aqui muda de forma: as pétalas dos dois estágios abertos são o **mesmo**
 * desenho em ângulos diferentes, empilhados, e o que muda é qual está visível.
 */

/*
  As cores não vêm do tema, e isso é regra da casa: `tracos` existe para o
  desenho não seguir a interface. Terra é terra no claro e no escuro.
*/
const TERRA = '#8A7A63';
const TERRA_FUNDA = '#5F5443';
/* A terra não é uma cor chapada: o topo pega luz e a barriga afunda. */
const TERRA_CLARA = '#A3927A';
const TERRA_SOMBRA = '#4B4237';
const LUZ = tracos.papel;
/* O miolo aceso. Quente, mas seco: o `tokens.ts` anota que saturação alta é o
   que mais denuncia brinquedo neste app. */
const BRILHO = '#FCEFC7';
const ARO = '#E8B65A';

/**
 * Onde o botão fica em repouso.
 *
 * O valor não é estético: com 74, o topo do botão cai em y=96, e nessa altura a
 * elipse do canteiro tem meia-largura de 51 — bem mais que os 20 do botão. Ou
 * seja, ele fica coberto. Diminuir isto faz a ponta espiar por cima da terra
 * antes da hora, e a fase 1 perde a graça inteira.
 */
const ESCONDIDA = 74;

const ATRASO = 140;
const RACHAR_MS = 380;
const SUBIR_MS = 760;
const ENTREABRIR_MS = 300;
const ABRIR_MS = 480;

/** O canteiro: uma elipse que cabe inteira no `viewBox`, terminando em y=120. */
const CANTEIRO = { cx: 60, cy: 102, rx: 54, ry: 18 };
/**
 * Onde a máscara corta o que sobe — e por que não é no pé do desenho.
 *
 * A máscara cortava em y=120, o fundo do palco. Só que o canteiro é uma
 * **elipse**, e a barriga dela sobe conforme se afasta do centro: em x=40 o
 * fundo da terra está em 118,7, não em 120. Entre uma linha reta de corte e uma
 * borda curva sobrava uma fresta de pouco mais de um ponto — e era por ela que
 * aparecia uma lasca do botão, parada embaixo do monte, antes de ele subir.
 *
 * Cortar na altura do centro da elipse acaba com a fresta: daqui para baixo a
 * terra é mais larga que tudo o que passa por trás dela, em qualquer x. E não
 * custa nada ao movimento — na posição final a flor inteira está acima de 92.
 */
const CORTE = CANTEIRO.cy + 2;
/** As duas abas de terra que se erguem de cada lado de onde o botão sobe. */
const TALHO = 'M50 94 L57 87 M70 94 L63 87';
/**
 * O caule, curto de propósito: desce só até o canteiro, nunca além.
 *
 * Comprido, ele aparecia pendurado **embaixo** do monte durante a subida — o
 * SVG aqui não recorta no `viewBox`, então tudo que passa de y=120 continua
 * desenhado. Quem garante isso agora são duas coisas juntas: este comprimento e
 * a máscara parada lá embaixo.
 */
const CAULE = 'M60 92 L60 62';
/** O botão fechado. */
const BOTAO = 'M60 70 C 44 60, 40 42, 60 22 C 80 42, 76 60, 60 70 Z';
/** Uma pétala, com a base no ponto em que todas se encontram. */
const PETALA = 'M60 70 C 48 60, 45 44, 60 26 C 75 44, 72 60, 60 70 Z';
/**
 * O brilho que corre pela dobra de dentro da pétala.
 *
 * É um traço, e não uma forma preenchida: pétala tem uma nervura, não uma
 * mancha, e um traço fino acompanha a curva sem competir com o contorno.
 */
const PETALA_LUZ = 'M59 64 C 52 56, 51 45, 58 33';

/**
 * Os mesmos cinco ângulos, duas aberturas.
 *
 * Cinco, e não quatro: com um número par não há pétala no eixo, e a flor fica
 * com um vinco no meio em vez de um centro.
 */
const ENTREABERTO = [-30, -15, 0, 15, 30];
const ABERTO = [-76, -38, 0, 38, 76];

/**
 * Os torrões que saltam quando a terra rompe.
 *
 * Cada um com o seu deslocamento, senão os quatro voam iguais e parecem uma
 * peça só. São `View`s com fundo, e não círculos de SVG, porque assim cada um
 * anda com a sua própria interpolação na thread nativa.
 */
const TORROES = [
  { x: -26, y: -20, tam: 6 },
  { x: -13, y: -30, tam: 4.5 },
  { x: 15, y: -28, tam: 5.5 },
  { x: 27, y: -17, tam: 4 },
];

export function Desenterrar({
  size,
  /** Chamado quando a flor terminou de abrir — é a deixa da frase entrar. */
  onAberto,
}: {
  size: number;
  onAberto?: () => void;
}) {
  const subida = useRef(new Animated.Value(ESCONDIDA)).current;
  const tremor = useRef(new Animated.Value(0)).current;
  const rachadura = useRef(new Animated.Value(0)).current;
  const torroes = useRef(new Animated.Value(0)).current;
  const fechado = useRef(new Animated.Value(1)).current;
  const entreaberto = useRef(new Animated.Value(0)).current;
  const aberto = useRef(new Animated.Value(0)).current;
  const pulo = useRef(new Animated.Value(1)).current;

  /*
    Guardado numa ref, e não em `useEffect` com `onAberto` na lista de
    dependências: quem usa isto costuma passar uma função anônima, e ela muda a
    cada render — a animação recomeçaria do zero no meio, sozinha.
  */
  const avisar = useRef(onAberto);
  avisar.current = onAberto;

  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let vivo = true;

    const encerrar = () => {
      if (!vivo) return;
      setPronto(true);
      avisar.current?.();
    };

    void AccessibilityInfo.isReduceMotionEnabled().then((menosMovimento) => {
      if (!vivo) return;

      // Quem pediu menos movimento recebe a flor já aberta, sem encenação — e
      // recebe a frase junto, que é o que ela veio buscar.
      if (menosMovimento) {
        subida.setValue(0);
        rachadura.setValue(1);
        fechado.setValue(0);
        entreaberto.setValue(0);
        aberto.setValue(1);
        return encerrar();
      }

      Animated.sequence([
        Animated.delay(ATRASO),
        // 1. A terra racha, estremece e cospe torrões.
        Animated.parallel([
          Animated.timing(rachadura, {
            toValue: 1,
            duration: RACHAR_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(torroes, {
            toValue: 1,
            duration: RACHAR_MS + SUBIR_MS * 0.5,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence(
            [1.6, -1.3, 0.8, -0.4, 0].map((ate) =>
              Animated.timing(tremor, {
                toValue: ate,
                duration: RACHAR_MS / 5,
                useNativeDriver: true,
              }),
            ),
          ),
        ]),
        // 2. Sobe passando um pouco do ponto, e assenta. `back` é o que dá peso:
        //    frear e parar exatamente no lugar é movimento de máquina.
        Animated.timing(subida, {
          toValue: 0,
          duration: SUBIR_MS,
          easing: Easing.out(Easing.back(1.15)),
          useNativeDriver: true,
        }),
        // 3. Entreabre: as pétalas se soltam sem abrir de vez.
        Animated.parallel([
          Animated.timing(fechado, {
            toValue: 0,
            duration: ENTREABRIR_MS * 0.7,
            useNativeDriver: true,
          }),
          Animated.timing(entreaberto, {
            toValue: 1,
            duration: ENTREABRIR_MS,
            useNativeDriver: true,
          }),
        ]),
        // 4. Abre, com um pulinho.
        Animated.parallel([
          Animated.timing(entreaberto, {
            toValue: 0,
            duration: ABRIR_MS * 0.55,
            useNativeDriver: true,
          }),
          Animated.timing(aberto, {
            toValue: 1,
            duration: ABRIR_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(pulo, {
              toValue: 1.08,
              duration: ABRIR_MS * 0.45,
              useNativeDriver: true,
            }),
            Animated.timing(pulo, {
              toValue: 1,
              duration: ABRIR_MS * 0.55,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(({ finished }) => finished && encerrar());
    });

    return () => {
      vivo = false;
    };
  }, [subida, tremor, rachadura, torroes, fechado, entreaberto, aberto, pulo]);

  /*
    Um sufixo por instância. `fill="url(#terra)"` procura o gradiente por id, e
    id de SVG não tem escopo aqui — dois `Desenterrar` na mesma árvore
    declarariam o mesmo, venceria um, e qual é indefinido. É a mesma armadilha
    que o `Sprout` já documenta.
  */
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  const camada = { position: 'absolute' as const, width: size, height: size };
  /** O desenho vive num 120×120; isto leva as medidas dele para o `size` pedido. */
  const proporcao = size / 120;

  const petalas = (angulos: number[]) =>
    angulos.map((a) => (
      <G key={a} transform={`rotate(${a} 60 70)`}>
        <Path
          d={PETALA}
          fill={`url(#petala-${id})`}
          stroke={tracos.contornoFolha}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <Path
          d={PETALA_LUZ}
          stroke={LUZ}
          strokeWidth={2.6}
          strokeLinecap="round"
          fill="none"
          opacity={0.45}
        />
      </G>
    ));

  /**
   * O miolo aceso, desenhado por cima das pétalas como centro de flor.
   *
   * São três camadas e cada uma faz uma coisa: o halo espalha a luz para fora
   * do disco, o disco com aro é o corpo, e o núcleo claro é o ponto quente. Só
   * o disco, o miolo virava um adesivo colado na flor.
   */
  const miolo = (r: number) => (
    <>
      <Circle cx={60} cy={60} r={r * 3.4} fill={`url(#halo-${id})`} />
      <Circle cx={60} cy={60} r={r * 1.75} fill={BRILHO} stroke={ARO} strokeWidth={2.4} />
      <Circle cx={60} cy={58.6} r={r} fill={LUZ} />
    </>
  );

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="image"
      accessibilityLabel={pronto ? 'Uma flor aberta.' : 'Desenterrando.'}
    >
      {/*
        A máscara: parada, e é isso que a faz funcionar.

        O recorte de `overflow: 'hidden'` acontece no espaço do próprio elemento
        — e esse espaço **anda junto com o `translateY`**. Posto na camada que se
        move, ele cortava 33px abaixo do chão, e o caule aparecia pendurado
        embaixo do canteiro no meio da subida (medido no app rodando, não
        deduzido). Numa caixa parada, o corte fica na linha de baixo do palco,
        que é onde o canteiro termina.
      */}
      <View
        style={[camada, { height: CORTE * proporcao, overflow: 'hidden' }]}
      >
        <Animated.View
          style={[
            camada,
            {
              transform: [
                { translateY: Animated.multiply(subida, proporcao) },
                { scale: pulo },
              ],
            },
          ]}
        >
          <Svg viewBox="0 0 120 120" width={size} height={size}>
            <Defs>
              {/* A pétala tem volume: clara na ponta, mais funda na base. */}
              <LinearGradient id={`petala-${id}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#C2D4C6" />
                <Stop offset="1" stopColor={tracos.folhaClara} />
              </LinearGradient>
              {/* O halo do miolo: forte no centro, some antes da borda. */}
              <RadialGradient id={`halo-${id}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={BRILHO} stopOpacity={0.55} />
                <Stop offset="0.55" stopColor={BRILHO} stopOpacity={0.18} />
                <Stop offset="1" stopColor={BRILHO} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Path
              d={CAULE}
              stroke={tracos.folha}
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
            />
            <AnimatedG opacity={fechado}>
              <Path
                d={BOTAO}
                fill={tracos.folhaClara}
                stroke={tracos.contornoFolha}
                strokeWidth={4}
                strokeLinejoin="round"
              />
            </AnimatedG>
            <AnimatedG opacity={entreaberto}>
              {petalas(ENTREABERTO)}
              {miolo(3.5)}
            </AnimatedG>
            <AnimatedG opacity={aberto}>
              {petalas(ABERTO)}
              {miolo(7.5)}
            </AnimatedG>
          </Svg>
        </Animated.View>
      </View>

      {/* A terra, por cima: é ela que esconde o botão até a hora de subir. */}
      <Animated.View
        style={[camada, { transform: [{ translateX: tremor }] }]}
        pointerEvents="none"
      >
        <Svg viewBox="0 0 120 120" width={size} height={size}>
          <Defs>
            {/* A luz vem de cima: o topo do canteiro clareia, a barriga afunda. */}
            <LinearGradient id={`terra-${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={TERRA_CLARA} />
              <Stop offset="0.45" stopColor={TERRA} />
              <Stop offset="1" stopColor={TERRA_SOMBRA} />
            </LinearGradient>
            {/* A sombra que o monte deita no chão: densa embaixo dele, some nas pontas. */}
            <RadialGradient id={`sombra-${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#3A3630" stopOpacity={0.3} />
              <Stop offset="1" stopColor="#3A3630" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/*
            A sombra vem antes do monte e é mais larga que ele: é o que tira o
            canteiro de cima do papel e o põe **sobre** alguma coisa. Sem ela a
            elipse boiava, como um adesivo no meio do cartão.

            Cabe inteira no `viewBox` de propósito. Este SVG não recorta no
            `viewBox`, então uma sombra que passasse de y=120 seria desenhada
            para fora do palco, por cima do que estivesse embaixo do desenho.
          */}
          <Ellipse cx={60} cy={110} rx={56} ry={9} fill={`url(#sombra-${id})`} />

          <Ellipse
            cx={CANTEIRO.cx}
            cy={CANTEIRO.cy}
            rx={CANTEIRO.rx}
            ry={CANTEIRO.ry}
            fill={`url(#terra-${id})`}
          />

          {/* O fio de luz na crista, onde a terra encontra o ar. */}
          <Path
            d="M14 99 Q60 82 106 99"
            stroke={TERRA_CLARA}
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
            opacity={0.55}
          />

          <AnimatedPath
            d={TALHO}
            stroke={TERRA_FUNDA}
            strokeWidth={3.6}
            strokeLinecap="round"
            fill="none"
            opacity={rachadura}
          />
        </Svg>
      </Animated.View>

      {/* Os torrões, na frente de tudo: eles saltam para fora do buraco. */}
      <View style={[camada, { overflow: 'hidden' }]} pointerEvents="none">
        {TORROES.map((t) => (
          <Animated.View
            key={`${t.x}:${t.y}`}
            style={{
              position: 'absolute',
              left: size * 0.5 - (t.tam * proporcao) / 2,
              // y=88 no desenho: a linha em que a terra se abre.
              top: 88 * proporcao,
              width: t.tam * proporcao,
              height: t.tam * proporcao,
              borderRadius: (t.tam * proporcao) / 2,
              backgroundColor: TERRA_FUNDA,
              opacity: torroes.interpolate({
                inputRange: [0, 0.12, 0.75, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateX: torroes.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, t.x * proporcao],
                  }),
                },
                {
                  // Sobe e volta a cair um pouco: é o arco de uma coisa jogada
                  // para cima, e não uma coisa que desliza para o lado.
                  translateY: torroes.interpolate({
                    inputRange: [0, 0.45, 1],
                    outputRange: [0, t.y * proporcao, t.y * 0.45 * proporcao],
                  }),
                },
              ],
            }}
          />
        ))}
      </View>
    </View>
  );
}

/*
  `react-native-svg` aceita valores animados nas suas props, mas só depois de
  passar pelo `createAnimatedComponent` — sem isso o valor chega como objeto e o
  elemento simplesmente não aparece, sem erro nenhum.
*/
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

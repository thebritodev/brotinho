import React, { useEffect, useId, useRef } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTema } from '../../theme';

/**
 * A luz que cai sobre o broto.
 *
 * ## O que isto substitui
 *
 * Havia um disco da cor do humor atrás do broto. Ele passou por seis versões e
 * nenhuma parou de pé, até a conclusão de que o problema não era o tom: numa
 * tela onde o humor já é dito pela carinha do broto, pela carinha marcada e
 * pela palavra escolhida, o disco era o quarto a dizer a mesma coisa.
 *
 * Isto **não é aquilo de volta**: esta mancha não codifica nada. É luz de
 * janela caindo numa planta, igual todo dia, qualquer que seja o humor.
 *
 * ## Os números vêm do documento, e são estes
 *
 * No documento, o bloco da tela inicial é um contêiner de 300 de altura com
 * três coisas centradas: o halo de 300 por 300, a sombra de chão, e o broto de
 * 215 por 300. Disso saem as duas regras que importam:
 *
 * - **o diâmetro do halo é a altura do desenho** — 300 e 300, não uma fração
 *   arbitrária dela;
 * - **o halo é mais largo que o broto** (300 contra 215) e ainda assim cabe,
 *   porque o contêiner é mais largo que o desenho.
 *
 * Quem calcula o diâmetro é `alturaDoMascote`, na geometria — a mesma tabela
 * que desenha o broto. E o quadro tem `minWidth`/`minHeight` do tamanho do
 * halo, então ele **nunca** transborda: ou o desenho é maior e manda no
 * tamanho, ou o halo é, e o quadro cresce até ele.
 *
 * Antes disso o halo foi, em ordem: 1,32 vez o desenho (transbordava e cobria
 * os vizinhos), a caixa inteira esticada (virou um oval, porque a caixa é mais
 * larga que alta), e o dobro da distância até o topo (ficou minúsculo, porque
 * essa distância não tem relação nenhuma com o desenho). Os três são o mesmo
 * erro: inventar o tamanho em vez de ler o do documento.
 *
 * A quarta versão media o quadro com `onLayout` — e `onLayout` **não dispara
 * no react-native-web**. O valor ficava no recuo justamente no navegador, que
 * era onde eu conferia: um número que só está certo onde não dá para olhar.
 *
 * ## Por que ele pulsa
 *
 * `@keyframes halo` no documento: `scale(1)`/`opacity .95` ↔ `scale(1.045)`/
 * `opacity 1`, sete segundos, ida e volta.
 *
 * Não é enfeite — é o que faz a mancha ser lida como **luz** em vez de forma.
 * Parada, ela vira um oval desenhado atrás do broto, que é exatamente o que o
 * disco de humor era. Luz respira um pouco.
 *
 * O diâmetro de base é dividido pelo pico da pulsação para que o **crescimento**
 * caiba na caixa, e não só o repouso.
 *
 * ## Por que SVG e não gradiente de CSS
 *
 * `experimental_backgroundImage` aceita `radial-gradient` no React Native, e o
 * nome diz o quanto dá para contar com ele. `react-native-svg` já é dependência
 * do app, desenha o broto inteiro, e faz gradiente radial nas duas plataformas.
 */

/**
 * A luz, guardada como o documento a escreve: **cor e opacidade**.
 *
 * Estes são os valores de lá, sem tradução. O que muda é como eles chegam ao
 * SVG — ver `paradasOpacas` logo abaixo.
 */
const LUZ = {
  claro: {
    quente: [['#FFFCF0', 0.95], ['#FCEFC7', 0.72], ['#FCEFC7', 0.2], ['#FCEFC7', 0]],
    verde: [['#F0F7F2', 0.95], ['#E3EDE6', 0.62], ['#E3EDE6', 0.18], ['#E3EDE6', 0]],
  },
  escuro: {
    /*
      No escuro a luz não é mais fraca: é de outra hora do dia.

      Clarear o mesmo creme sobre `#211E1A` daria um holofote branco no meio da
      tela. O tom vira âmbar baixo — a mesma matiz, muito menos luz — que é o
      que uma lâmpada faz num quarto à noite, e é a lógica de toda a paleta
      escura deste app: papel à noite não vira carvão, vira marrom quente sob
      um abajur.
    */
    quente: [['#D7B95F', 0.3], ['#D7B95F', 0.1], ['#D7B95F', 0.035], ['#D7B95F', 0]],
    verde: [['#4C7B62', 0.35], ['#4C7B62', 0.12], ['#4C7B62', 0.04], ['#4C7B62', 0]],
  },
} as const;

/**
 * As paradas, já compostas sobre o fundo — **sem canal alfa nenhum**.
 *
 * ## Por que não dá para usar transparência aqui
 *
 * A primeira versão escreveu as paradas como `rgba(…, 0.72)`. No Android o
 * `stopColor` do `react-native-svg` **descarta o alfa**, e as quatro paradas
 * do mesmo creme viraram quatro tons opacos: um disco chapado.
 *
 * A segunda passou o alfa em `stopOpacity`, que é a forma correta em SVG. No
 * aparelho a luz **sumiu**.
 *
 * As duas falharam do mesmo jeito e por baixo é o mesmo motivo: nesta
 * biblioteca, neste Android, a transparência dentro de gradiente não é
 * confiável. Insistir nela é apostar de novo.
 *
 * ## O que isto faz em vez disso
 *
 * A luz não apaga por alfa: ela **termina na cor do fundo**. Cada parada é a
 * cor do documento já misturada com `colors.bg` na opacidade que ele pede, e
 * o resultado vai para o SVG opaco. Sobre um fundo liso — que é o caso aqui,
 * na tela inicial e na Composta — o que se vê é exatamente o mesmo.
 *
 * A conta acontece no tema, então trocar o fundo continua acertando as
 * paradas. O que isto não suporta é a luz sobre algo que não seja `colors.bg`:
 * ali a borda apareceria, porque ela é a cor do fundo e não o nada.
 */
const canais = (h: string) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
const paraHex = (c: number[]) =>
  `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** A cor do documento composta sobre o fundo, na opacidade que ele pede. */
const misturar = (cor: string, alfa: number, fundo: string) => {
  const [f, c] = [canais(fundo), canais(cor)];
  return paraHex(c.map((v, i) => v * alfa + f[i] * (1 - alfa)));
};

/**
 * A luz desenhada como **anéis concêntricos opacos**, e não como gradiente.
 *
 * ## Por que não gradiente
 *
 * Três tentativas de `<RadialGradient>` deram três resultados errados no
 * aparelho, todas certas no navegador:
 *
 * 1. alfa dentro de `rgba()` no `stopColor` — o Android descarta o alfa, e as
 *    paradas viram opacas: um disco chapado;
 * 2. alfa em `stopOpacity`, que é a forma correta em SVG — a luz sumiu;
 * 3. paradas opacas terminando na cor do fundo — a luz sumiu de novo.
 *
 * A terceira não tem alfa em lugar nenhum, então o problema deixou de poder
 * ser transparência. O que sobra em comum entre as três é a **geometria do
 * gradiente em porcentagem** (`cx`, `cy` e `r` como `'45%'`), que resolve
 * contra a caixa do elemento — e isso é território de bug antigo no
 * `react-native-svg` do Android. Quando não resolve, o preenchimento colapsa
 * para uma cor só: opaca na tentativa 1 (disco visível) e igual ao fundo nas
 * tentativas 2 e 3 (invisível). É a única explicação que cobre as três.
 *
 * ## O que isto faz
 *
 * Desenha a mesma curva com círculos: do maior ao menor, cada um numa cor
 * interpolada entre as paradas do documento, todos opacos, todos com raio em
 * **pixel absoluto**. Não há gradiente, porcentagem, alfa nem unidade de
 * caixa — só a primitiva mais simples que o SVG tem.
 *
 * Com 48 anéis num raio de ~135, cada faixa tem menos de 3 pixels, e a maior
 * diferença entre duas cores vizinhas é de um ponto por canal. Não há degrau
 * para ver.
 */
const ANEIS = 48;

/**
 * Quanto a luz é mais forte aqui do que no documento. **É o único botão.**
 *
 * O documento foi desenhado numa maquete de navegador, e ali os valores dele
 * bastam. Num telefone não: no tema claro o núcleo é `#FFFCF0` sobre um fundo
 * `#FBF6EC` — quatro pontos de diferença por canal, o mesmo creme. A parada
 * mais visível, a de 30%, separava-se do fundo por 27 pontos num canal só.
 *
 * Isso ficou provado, e não suposto: um marcador de diagnóstico no lugar da
 * luz apareceu no aparelho, o que descartou montagem, geometria e recorte de
 * uma vez. Sobrou intensidade.
 *
 * Multiplicando as opacidades por 1,8, a parada de 30% passa de 27 para 37
 * pontos de diferença no claro, e de 18/16/7 para 33/28/12 no escuro. A curva
 * e as cores continuam sendo as de lá; só a força muda.
 *
 * Se ainda estiver fraca ou já estiver forte demais, é este número.
 */
const FORCA = 1.8;

/** A cor da luz a `t` do centro (0 a 1), pelas paradas do documento. */
const corEm = (t: number, paradas: string[], posicoes: readonly number[]) => {
  const i = posicoes.findIndex((p, k) => k > 0 && t <= p);
  const fim = i === -1 ? posicoes.length - 1 : i;
  const ini = Math.max(0, fim - 1);
  const vao = posicoes[fim] - posicoes[ini];
  const f = vao === 0 ? 0 : (t - posicoes[ini]) / vao;
  const [a, b] = [canais(paradas[ini]), canais(paradas[fim])];
  return paraHex(a.map((v, k) => v + (b[k] - v) * f));
};

/**
 * `quente` é a luz da tela inicial: sol de janela, creme, a mesma todo dia.
 *
 * `verde` é a da Composta. Ali o broto não está numa janela — está no meio de
 * um exercício, e a tela inteira é verde. Uma luz creme no meio disso
 * apareceria como uma segunda fonte, de outro ambiente.
 */
export type TomDaLuz = 'quente' | 'verde';

/** `@keyframes halo` do documento: sete segundos, ida e volta. */
const PULSO_MS = 7000;
const PULSO_ESCALA = 1.045;

/**
 * Uma luz só, com cauda longa — e por que não são duas.
 *
 * ## O que o documento faz, e por que copiar não deu
 *
 * Lá há **duas** camadas de luz: um brilho de ambiente de 470 e o halo do
 * broto de 300. Elas funcionam juntas porque os centros ficam a uns 110
 * pixels um do outro — o broto vem logo depois da saudação, e as duas manchas
 * se sobrepõem tanto que leem como um campo só.
 *
 * Na nossa tela inicial há o balão de fala entre a saudação e o broto. Ele
 * empurra o desenho para baixo, e os dois centros passam a ficar a uns 370
 * pixels de distância: longe demais para se fundirem. O resultado foram **dois
 * círculos** atrás do broto, cada um com o seu centro visível.
 *
 * Em vez de acertar a posição de duas luzes numa tela cujo layout é diferente
 * do documento, esta faz o mesmo trabalho com uma: o que as duas camadas dão
 * é **duas escalas** — um núcleo definido e um campo largo e fraco. Isso cabe
 * numa curva só, com uma parada a mais.
 *
 * As paradas são 0, 30%, 62% e 100%: o núcleo com a opacidade do documento,
 * uma cauda longa a 20% dela, e o zero na borda. Um centro, nenhuma emenda.
 *
 * ## Por que a luz apaga exatamente na borda
 *
 * Copiar o CSS ao pé da letra deixava uma **borda circular dura**: o padrão do
 * CSS é `farthest-corner`, então a luz do documento só apaga a 0,56 do lado,
 * mas o círculo dele termina a 0,38 acima do centro — e ali ela ainda tem
 * quase 40% de opacidade. Lá isso some debaixo do brilho de ambiente; aqui não
 * havia o que esconder.
 *
 * Com a parada final em 100% do raio, basta o raio ser menor que a distância
 * do centro até a borda mais próxima, que é a de cima. Daí `cy` 45% e raio
 * 45%: a luz zera exatamente no topo e antes das outras três bordas.
 *
 * ## A sobra
 *
 * A luz visível é um círculo de 0,9 do lado da tela, então a tela é 1,112 vez
 * a luz. Essa margem é transparente: se o quadro do broto a cortar, corta
 * pixel vazio.
 */
/** Onde o centro da luz cai na tela, e até onde ela vai. */
const CENTRO_Y = 0.45;
const RAIO = 0.45;
/** Núcleo, meio, cauda longa e a cor do fundo na borda. */
const PARADAS = [0, 0.3, 0.62, 1] as const;
/** A tela do SVG dividida pela luz visível — ver acima. */
const SOBRA = 1.112;

export function LuzDeEstufa({
  diametro: diametroPedido,
  tom = 'quente',
  children,
  style,
}: {
  /**
   * O diâmetro do halo, em pixels de tela.
   *
   * Deve ser a **altura do desenho** — use `alturaDoMascote(stage, size)`, que
   * é a mesma tabela usada para desenhar. Passar o `size` do broto aqui seria
   * errado: `Sprout` trata `size` como escala sobre uma caixa de 200, então
   * `size={120}` desenha 53 por 80.
   */
  diametro: number;
  tom?: TomDaLuz;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { tema, colors } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const cores = LUZ[tema][tom].map(([cor, alfa]) =>
    misturar(cor, Math.min(1, alfa * FORCA), colors.bg),
  );

  /*
    Dois tamanhos, e é importante não confundi-los.

    `luz` é o que se vê — o diâmetro pedido, encolhido para que o **pico** da
    pulsação caiba nele, e não o repouso.

    `tela` é a caixa do SVG, maior, porque o gradiente precisa de espaço para
    apagar. A diferença é anel transparente.
  */
  const luz = diametroPedido / PULSO_ESCALA;
  const tela = luz * SOBRA;

  const pulso = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    /*
      Laço perfeito: sai de 0, vai a 1, volta a 0. As duas pontas são o mesmo
      valor, então a emenda não aparece.

      Vale registrar o erro gêmeo que estava no balanço do broto: lá a volta ia
      de 1 a **-1** com a mesma duração da ida de 0 a 1 — o dobro da distância
      no mesmo tempo. O movimento acelerava de repente ao dobrar a esquina, e
      foi isso, e não a lentidão, o "cortado" que apareceu no aparelho.
    */
    const meia = (para: number) =>
      Animated.timing(pulso, {
        toValue: para,
        duration: PULSO_MS / 2,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const laco = Animated.loop(Animated.sequence([meia(1), meia(0)]));
    laco.start();
    return () => laco.stop();
  }, []);

  const escala = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, PULSO_ESCALA] });

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          /*
            O quadro nunca é menor que o halo.

            Com `minWidth`/`minHeight`, ou o desenho é maior e manda no
            tamanho, ou o halo é e o quadro cresce até ele. Nos dois casos o
            halo cabe — e halo que cabe não precisa de `overflow: visible`, que
            é a propriedade que o deixava pintar por cima dos vizinhos.
          */
          minWidth: diametroPedido,
          minHeight: diametroPedido,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        /*
          Largura e altura explícitas.

          Uma `View` absoluta sem dimensão pega o tamanho do filho na web, mas
          no Android o resultado depende do Yoga e do `overflow` — e uma caixa
          de zero por zero recorta o SVG inteiro. Como a luz sumiu no aparelho
          e apareceu no navegador, esta era uma das duas suspeitas; custa uma
          linha eliminá-la.
        */
        style={{
          position: 'absolute',
          width: tela,
          height: tela,
          transform: [{ scale: escala }],
        }}
      >
        <Svg width={tela} height={tela}>
          {/*
            Do maior para o menor: o de fora é a cor do fundo, o de dentro é o
            núcleo. Desenhados nesta ordem, cada um cobre o anterior e o que
            sobra de cada é o anel.
          */}
          {Array.from({ length: ANEIS }, (_, i) => {
            const t = 1 - i / (ANEIS - 1);
            return (
              <Circle
                key={i}
                cx={tela / 2}
                cy={tela * CENTRO_Y}
                r={tela * RAIO * t}
                fill={corEm(t, cores, PARADAS)}
              />
            );
          })}
        </Svg>
      </Animated.View>
      {children}
    </View>
  );
}

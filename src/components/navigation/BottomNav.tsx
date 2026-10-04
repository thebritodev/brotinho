import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { fonts, useTema } from '../../theme';
import { lacoQueSoVai } from '../laco';
import { BrotinhoMark, MARK_DISCO } from '../brand/BrotinhoMark';
import { Icon, type IconName } from '../core/Icon';

export type TabKey = 'home' | 'broto' | 'perfil';

/** Quanto o botão do meio sobe acima da faixa. */
const RAISE = 22;

/**
 * A altura que o botão central ocupa **acima** da barra.
 *
 * Exportada porque uma tela com barra de ação no rodapé precisa saber que há
 * um disco de 64 pontos pairando ali — hoje só a Composta.
 */
export const ALTURA_ERGUIDA = RAISE;

/**
 * O arredondamento do topo da barra — 28, do documento.
 *
 * Ele só faz sentido agora. Enquanto a barra reservava espaço no layout, o
 * canto arredondado não tinha o que revelar: atrás dele havia a mesma faixa
 * lisa da cor do fundo, e curvar um retângulo contra outro retângulo da mesma
 * cor não desenha nada. Com a tela passando por trás, o canto passa a mostrar
 * o conteúdo — que é o que faz a barra ler como um painel apoiado sobre a
 * página em vez de uma tarja colada na base.
 *
 * O documento arredonda também os cantos de baixo, em 44. Aquilo é o canto do
 * aparelho no mockup, não da barra: no celular ela encosta na borda da tela, e
 * arredondar ali abriria dois buracos de fundo nos cantos inferiores.
 */
const RAIO_DO_TOPO = 28;

/**
 * Quanto da tela fica **por trás** da barra: a altura do canto arredondado.
 *
 * A tela termina esse tanto abaixo do topo da barra, e não exatamente nele.
 * Sem isso não havia nada atrás das duas curvas do topo além do fundo liso
 * do app, e quando o que estava rente à barra tinha outra cor — a terra da
 * tela inicial, uma foto, um cartão — o canto recortava uma faixa do fundo
 * que não pertencia a nada.
 *
 * Exportada porque quem rola precisa de folga no fim para o último item não
 * parar escondido atrás da barra.
 */
export const POR_TRAS_DA_BARRA = RAIO_DO_TOPO;

/** O fio do documento: recuado 40 de cada lado, e não uma borda de ponta a ponta. */
const RECUO_DO_FIO = 40;
const CENTER_SIZE = 64;

type SideTab = { key: Exclude<TabKey, 'home'>; label: string; icon: IconName };

/**
 * A aba da esquerda era o Diário e passou a ser o broto.
 *
 * O Diário não perdeu nada: ele é o primeiro cartão do carrossel da tela
 * inicial, que abre no lugar onde a barra abria. O que ele não era é uma
 * *seção* — entrar no diário é fazer uma coisa, e coisas de fazer agora moram
 * juntas agora. O broto, sim, é um lugar: é onde ela está, com o humor, o
 * jardim e o que o app percebeu.
 *
 * O broto em vez da marca: a marca já é o botão do meio, e duas marcas na
 * mesma barra não dizem qual é qual. Ver o desenho em `Icon`.
 */
const LEFT: SideTab = { key: 'broto', label: 'Brotinho', icon: 'broto' };
const RIGHT: SideTab = { key: 'perfil', label: 'Perfil', icon: 'user' };

type Props = {
  active?: TabKey;
  onChange?: (tab: TabKey) => void;
  /**
   * Onde o dedo encostou, em pixels da tela — para a tela nova abrir dali.
   *
   * A barra mede e entrega; quem usa é a `AbasVivas`, duas camadas acima,
   * porque o círculo da revelação recorta a aba inteira e daqui ele ficaria
   * preso dentro da barra. Ver `regrasDasAbas`.
   */
  aoTocar?: (tab: TabKey, onde: { x: number; y: number }) => void;
};

/**
 * As três animações da barra, e por que elas existem.
 *
 * Trocar de aba era instantâneo e mudo: o ícone mudava de cor e pronto. Num app
 * cujo personagem é uma planta, a barra é o único lugar que se toca em toda
 * sessão — e era o mais parado de todos.
 *
 * Cada uma diz uma coisa diferente sobre o destino:
 *
 * - **Brotinho** nasce ao toque: a planta cresce do pé do caule até o tamanho
 *   cheio. O desenho do botão é um broto, e brotar é o que um broto faz. A
 *   origem é o pé (`transformOrigin`), e não o meio, senão ele incha em vez de
 *   crescer. Ver `brotar`.
 * - **Início** enche como um copo de água. O disco fica num verde apagado com a
 *   aba fechada, e ao abrir o verde cheio **sobe** por dentro dele, com a
 *   superfície ondulando de um lado para o outro. É a única das três que muda o
 *   estado de repouso, e por isso a única que não precisa que ninguém esteja
 *   olhando na hora.
 * - **Perfil** dá um tranco curto **ao toque**, não ao abrir: não há nada de
 *   vivo naquele ícone para justificar movimento contínuo, e o que ele confirma
 *   é o toque.
 *
 * ## Movimento reduzido
 *
 * Nenhuma delas roda para quem pediu menos movimento no sistema. A troca de cor
 * continua acontecendo — ela é informação, não enfeite —, só que de uma vez.
 */

/** O tranco do perfil é mais curto e mais rápido: é resposta a toque. */
const TRANCO = 9;

/**
 * A crista da água, e por que ela é um quadrado girando.
 *
 * A superfície precisava ondular de um lado para o outro enquanto sobe, e não
 * subir como uma régua. Desenhar uma senoide em SVG e animar o `d` do caminho
 * resolveria — e sairia do driver nativo, recalculando o traçado a cada quadro
 * no JavaScript, no botão que a pessoa mais toca no app.
 *
 * O que faz o mesmo de graça é um **quadrado de cantos muito arredondados**
 * girando devagar, com o centro exatamente na linha da água. Ele não é um
 * círculo: a distância do centro até a borda varia conforme o giro, mais longa
 * na diagonal e mais curta no meio do lado. Girando, essa diferença passa pela
 * superfície como uma crista que vai de um lado ao outro — e é só `rotate`, que
 * roda no driver nativo.
 *
 * São duas, em tamanhos e sentidos diferentes, porque uma sozinha bate sempre
 * no mesmo ritmo e o olho percebe o compasso. Duas em desacordo não fecham
 * ciclo à vista.
 */
const ONDA = { lado: 1.8, canto: 0.32, giro: 2600, sentido: 1 };
const ONDA_DE_TRAS = { lado: 1.7, canto: 0.26, giro: 3500, sentido: -1 };

/**
 * Onde encostar a crista para ela ondular **em volta** da linha da água.
 *
 * A primeira tentativa pôs o centro do quadrado na linha — e o quadrado tem
 * mais de cinquenta pontos de raio num botão de sessenta e quatro: ele cobria o
 * disco inteiro, cheio ou vazio, e a animação virou um círculo verde liso.
 *
 * O que precisa encostar na linha é a **borda de cima**, não o centro. Num
 * quadrado de lado `L` com canto `r`, a distância do centro à borda vai de
 * `L/2` no meio do lado até `(L/2 - r)·√2 + r` na diagonal; a diferença entre as
 * duas é a altura da onda. Baixando a caixa por metade dessa diferença, a
 * superfície passa a oscilar metade para cima e metade para baixo da linha, que
 * é o que faz a água parecer balançar em vez de subir e descer inteira.
 */
function ondaEncostada(lado: number, canto: number) {
  const meio = lado / 2;
  const raio = lado * canto;
  const naDiagonal = (meio - raio) * Math.SQRT2 + raio;
  return (naDiagonal - meio) / 2;
}

/**
 * Um vai-e-vem que morre no zero, no ritmo de folha ao vento.
 *
 * O valor anda de 1 a -1 e volta; quantos graus isso vira é decisão de quem
 * desenha, não daqui. Assim o mesmo movimento serve para o broto vergando sete
 * graus e para o tranco de nove do perfil.
 */
function balancar(valor: Animated.Value, duracao: number) {
  valor.setValue(0);
  Animated.sequence([
    Animated.timing(valor, { toValue: 1, duration: duracao * 0.3, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    Animated.timing(valor, { toValue: -1, duration: duracao * 0.34, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    Animated.timing(valor, { toValue: 0.45, duration: duracao * 0.22, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    Animated.timing(valor, { toValue: 0, duration: duracao * 0.14, easing: Easing.out(Easing.quad), useNativeDriver: true }),
  ]).start();
}

/**
 * O ícone da aba do broto: a planta no vaso, do documento.
 *
 * ## Por que não é mais um traço só
 *
 * Era um caule com duas folhas, desenhado como os outros ícones do app: um
 * `d` só, sem preenchimento. Lado a lado com o documento, faltava a metade que
 * identifica o personagem — o **vaso**. O broto do app mora num vaso de barro
 * em toda tela em que ele aparece de corpo inteiro; o ícone que o representa
 * sem vaso vira "uma plantinha", que é o que qualquer app de jardinagem tem.
 *
 * ## Por que são dois `Svg`, e não um
 *
 * Porque só a planta cresce. No documento o `scale` está no grupo da planta e
 * o vaso fica parado — faz sentido: o que brota é o que estava plantado, e
 * vaso não brota. Um `Animated.View` não entra dentro de um `Svg`, então a
 * planta tem o `Svg` dela, por cima do vaso, dentro da `View` que anima.
 *
 * A origem do crescimento é o pé do caule, em 17,5 de 28 — 62,5% da altura.
 * É por isso que ele cresce **do vaso para cima** em vez de inchar do meio.
 *
 * ## Selecionado muda o traço, e só o traço
 *
 * No documento a aba escolhida preenche o desenho: o vaso de terracota, as
 * folhas e a cabeça de verde. Aqui não, e o pedido foi do Pedro — no aparelho,
 * a vinte e seis pontos, os preenchimentos fecham os vãos entre a cabeça e as
 * duas folhas, e o que sobra é uma mancha verde com um tijolinho embaixo. O
 * desenho que identifica o personagem são os vãos.
 *
 * Então selecionado troca a tinta do traço — de `textSecondary` para
 * `primaryStrong` — e engrossa de 2 para 2,4. É a mesma leitura dos outros
 * dois ícones da barra, que também nunca se preenchem, e é o que deixa o
 * crescimento da planta visível: um broto cheio de verde crescendo dentro de
 * outro verde não cresce à vista de ninguém.
 */
const BROTO_DA_ABA = {
  vaso: 'M8.5 17.5h11l-1.4 6.2a1.6 1.6 0 0 1-1.6 1.3h-5a1.6 1.6 0 0 1-1.6-1.3z',
  borda: 'M7.5 17.5h13',
  caule: 'M14 17.5v-5',
  folhaEsquerda: 'M14 14.2c-1.2-2.6-3.6-3.6-6.2-3.2.3 2.7 2.8 4 6.2 3.2z',
  folhaDireita: 'M14 14.2c1.2-2.6 3.6-3.6 6.2-3.2-.3 2.7-2.8 4-6.2 3.2z',
  cabeca: { cx: 14, cy: 7.2, r: 3.6 },
  /** O pé do caule, em fração da caixa: é daqui que ele cresce. */
  pe: `${(17.5 / 28) * 100}%`,
};

function IconeDoBroto({
  ativa,
  cor,
  tamanho,
  cresce,
}: {
  ativa: boolean;
  cor: string;
  tamanho: number;
  cresce: Animated.Value;
}) {
  const { colors } = useTema();
  const traco = ativa ? colors.primaryStrong : cor;
  const largura = ativa ? 2.4 : 2;
  const comum = {
    stroke: traco,
    strokeWidth: largura,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <View style={{ width: tamanho, height: tamanho }}>
      <Svg width={tamanho} height={tamanho} viewBox="0 0 28 28" fill="none">
        <Path d={BROTO_DA_ABA.vaso} fill="none" {...comum} />
        <Path d={BROTO_DA_ABA.borda} fill="none" {...comum} />
      </Svg>

      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: tamanho,
          height: tamanho,
          transformOrigin: `50% ${BROTO_DA_ABA.pe}`,
          opacity: cresce.interpolate({
            inputRange: [...CRESCIMENTO.entrada],
            outputRange: [...CRESCIMENTO.opacidade],
          }),
          transform: [
            {
              scaleX: cresce.interpolate({
                inputRange: [...CRESCIMENTO.passaDe.entrada],
                outputRange: [...CRESCIMENTO.passaDe.largura],
              }),
            },
            {
              scaleY: cresce.interpolate({
                inputRange: [...CRESCIMENTO.passaDe.entrada],
                outputRange: [...CRESCIMENTO.passaDe.altura],
              }),
            },
          ],
        }}
      >
        <Svg width={tamanho} height={tamanho} viewBox="0 0 28 28" fill="none">
          <Path d={BROTO_DA_ABA.caule} fill="none" {...comum} />
          <Path d={BROTO_DA_ABA.folhaEsquerda} fill="none" {...comum} />
          <Path d={BROTO_DA_ABA.folhaDireita} fill="none" {...comum} />
          <Circle
            cx={BROTO_DA_ABA.cabeca.cx}
            cy={BROTO_DA_ABA.cabeca.cy}
            r={BROTO_DA_ABA.cabeca.r}
            fill="none"
            {...comum}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * O broto nascendo: do nada ao tamanho cheio, a partir do pé do caule.
 *
 * ## O que ele é, e o que substituiu
 *
 * É a animação do documento, traduzida quadro a quadro: a planta sai de
 * `scale(.15, 0)` invisível, chega a `(.6, .7)` no meio do caminho já opaca,
 * passa de 1 perto do fim e assenta. Em tela: um broto brotando, no botão que
 * tem o desenho de um broto.
 *
 * No lugar dela havia uma balançada ao vento, que acontecia **ao abrir a aba**
 * e não ao toque. Ela não estava errada — uma planta responde ao ar —, mas
 * respondia à navegação, e não ao dedo: quem tocava na aba já aberta não via
 * nada. E havia a explosão de folhas, que respondia ao dedo cobrindo a tela
 * inteira de confete a cada troca. O crescimento faz o trabalho das duas no
 * lugar certo, que é dentro do próprio ícone.
 *
 * ## Por que os quatro trechos, e não uma mola
 *
 * Porque uma mola (`spring`) com repique passa de 1 e volta **em todos os
 * eixos ao mesmo tempo**, e o que faz isto ler como crescer é a diferença
 * entre eles: no começo o broto é mais largo que alto — `(.15, 0)` —, como
 * uma semente abrindo, e só depois ele sobe. Essa diferença some numa mola.
 *
 * O `scaleY` sai de zero e a origem é o pé: é isso que faz o desenho crescer
 * do chão em vez de inchar do meio.
 */
function brotar(valor: Animated.Value) {
  valor.setValue(0);
  Animated.timing(valor, {
    toValue: 1,
    duration: 700,
    easing: Easing.bezier(0.3, 0.7, 0.4, 1),
    useNativeDriver: true,
  }).start();
}

/** Os quadros do crescimento, lidos do documento. */
const CRESCIMENTO = {
  entrada: [0, 0.45, 1],
  opacidade: [0, 1, 1],
  largura: [0.15, 0.6, 1],
  altura: [0, 0.7, 1],
  passaDe: { entrada: [0, 0.45, 0.8, 1], largura: [0.15, 0.6, 1.06, 1], altura: [0, 0.7, 1.06, 1] },
} as const;

/**
 * BottomNav — três destinos, só ícones.
 *
 * Sem rótulos, o único sinal de qual aba está aberta é a cor; por isso os
 * `accessibilityLabel` são obrigatórios, senão quem usa leitor de tela fica
 * sem nada para ouvir.
 */
export function BottomNav({ active = 'home', onChange, aoTocar }: Props) {
  const { colors, palette, shadows } = useTema();
  const insets = useSafeAreaInsets();

  const [menosMovimento, setMenosMovimento] = useState(false);
  useEffect(() => {
    let vivo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((r) => vivo && setMenosMovimento(r));
    const ouvinte = AccessibilityInfo.addEventListener('reduceMotionChanged', setMenosMovimento);
    return () => {
      vivo = false;
      ouvinte.remove();
    };
  }, []);

  /** Um valor por ícone que se mexe: -1 a 1, convertido em graus abaixo. */
  const tranco = useRef(new Animated.Value(0)).current;
  /** De 0 a 1: o broto da aba nascendo. Ver `brotar`. */
  const cresce = useRef(new Animated.Value(1)).current;
  /**
   * O nível da água, em pontos a partir do topo do disco.
   *
   * `CENTER_SIZE` é o copo vazio — a água inteira abaixo da borda de baixo — e
   * `0` é o copo cheio. Fica em pontos, e não de 0 a 1, porque quem anima é um
   * `translateY`: o disco verde é uma peça do tamanho do botão que **sobe**, e
   * o arredondamento do botão a recorta em círculo no caminho.
   */
  const nivel = useRef(new Animated.Value(active === 'home' ? 0 : CENTER_SIZE)).current;

  /*
    Ele também nasce quando a aba passa a ser a dele por outro caminho — um
    botão de dentro de uma tela, o voltar do sistema. Sem isto, chegar na aba
    do broto sem tocar na barra deixaria o ícone trocando de cor em silêncio.

    A guarda no `active` é o que impede a folha de tremer sozinha a cada
    mudança de estado do app.
  */
  useEffect(() => {
    if (active !== 'broto' || menosMovimento) return cresce.setValue(1);
    brotar(cresce);
  }, [active, menosMovimento, cresce]);

  /**
   * O giro de cada crista. Só rodam enquanto a água está se mexendo.
   *
   * São dois valores, e não um com sinal trocado, porque as duas precisam de
   * **velocidades** diferentes. Com o mesmo valor elas fechariam ciclo juntas a
   * cada volta, e a superfície repetiria o mesmo desenho de dois em dois
   * segundos e meio — que é justamente o compasso que o olho pega.
   */
  const marola = useRef(new Animated.Value(0)).current;
  const marolaDeTras = useRef(new Animated.Value(0)).current;

  /*
    A água sobe devagar e para sem repique — é líquido entrando num copo, não
    um elemento chegando na tela.

    `inOut(cubic)` em 1100ms: com curva de mola ela saía pela borda de cima e
    voltava, que é coisa de bolha. E devagar porque a onda precisa de tempo para
    atravessar a superfície — enchendo em meio segundo, a crista mal saía de um
    lado. Esvaziar continua rápido: ninguém fica olhando a aba que fechou.

    A marola gira em laço **junto** com a subida e para quando ela acaba. Deixar
    girando para sempre custaria um quadro por quadro a vida inteira do app para
    desenhar uma onda que, com o copo cheio, está inteira fora do recorte.
  */
  useEffect(() => {
    const cheio = active === 'home';
    if (menosMovimento) return nivel.setValue(cheio ? 0 : CENTER_SIZE);

    const lacos = [
      [marola, ONDA.giro] as const,
      [marolaDeTras, ONDA_DE_TRAS.giro] as const,
    ].map(([valor, duracao]) => {
      valor.setValue(0);
      return lacoQueSoVai(valor, { ms: duracao, easing: Easing.linear });
    });
    lacos.forEach((l) => l.start());
    const pararMarola = () => lacos.forEach((l) => l.stop());

    const subida = Animated.timing(nivel, {
      toValue: cheio ? 0 : CENTER_SIZE,
      duration: cheio ? 1100 : 320,
      easing: cheio ? Easing.inOut(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    subida.start(pararMarola);

    return () => {
      subida.stop();
      pararMarola();
    };
  }, [active, menosMovimento, nivel, marola, marolaDeTras]);

  const giro = (valor: Animated.Value, graus: number) =>
    valor.interpolate({ inputRange: [-1, 1], outputRange: [`-${graus}deg`, `${graus}deg`] });

  const lateral = (t: SideTab) => {
    const ativa = active === t.key;
    const doBroto = t.key === 'broto';
    return (
      <Pressable
        key={t.key}
        accessibilityRole="tab"
        accessibilityLabel={t.label}
        accessibilityState={{ selected: ativa }}
        onPress={(e) => {
          /*
            `pageX`/`pageY` é a posição na tela, e não no botão: é a mesma
            coordenada em que o círculo da revelação é desenhado.
          */
          aoTocar?.(t.key, { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
          /* Os dois respondem ao toque, inclusive quando a aba já está
             aberta: é confirmação do gesto, não anúncio de destino novo. */
          if (menosMovimento) {
            onChange?.(t.key);
            return;
          }
          if (doBroto) brotar(cresce);
          else balancar(tranco, 420);
          onChange?.(t.key);
        }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48, gap: 3 }}
      >
        {doBroto ? (
          /* Só a planta cresce; o vaso fica parado. Ver `IconeDoBroto`. */
          <IconeDoBroto
            ativa={ativa}
            cor={colors.textSecondary}
            tamanho={28}
            cresce={cresce}
          />
        ) : (
          <Animated.View
            /* O perfil gira no meio, que é onde fica o pescoço do bonequinho. */
            style={{ transform: [{ rotate: giro(tranco, TRANCO) }] }}
          >
            <Icon
              name={t.icon}
              size={26}
              color={ativa ? colors.primaryStrong : colors.textSecondary}
              strokeWidth={ativa ? 2.4 : 2}
            />
          </Animated.View>
        )}
        {/*
          O rótulo é visível, e não só para o leitor de tela.

          Os três ícones viviam sozinhos, e o nome de cada aba existia apenas em
          `accessibilityLabel`. Ícone sem rótulo obriga a adivinhar, e adivinhar
          é caro justamente para quem abre o app mal — a literatura de design
          para pessoas em sofrimento lista isso entre os atritos que mais pesam.
          Catorze pixels de altura resolvem.
        */}
        <Text
          style={{
            fontFamily: ativa ? fonts.body.bold : fonts.body.regular,
            fontSize: 11,
            color: ativa ? colors.primaryStrong : colors.textSecondary,
          }}
        >
          {t.label}
        </Text>
      </Pressable>
    );
  };

  return (
    /*
      A barra paira sobre a tela; não empurra uma faixa na frente dela.

      O espaço de cima é transparente e existe para o botão central subir sem
      sair dos limites do pai — no Android o que vaza pode ser cortado. Só que
      ele também era **reservado no layout**: a tela terminava 22 pontos acima
      da barra, e esses 22 pontos viravam uma faixa lisa da cor do fundo,
      cobrindo o que a tela tinha ali e passando por trás da metade de cima do
      broto. Era o que se via na tela inicial: os chips de palavra cortados,
      uma tira bege, e só então a barra.

      A margem negativa devolve esse espaço à tela: a barra continua ocupando
      no layout só a altura dela mesma, e a parte erguida passa a ficar **por
      cima** do conteúdo, não na frente de um vazio. `box-none` é o que
      completa a ideia — sem ele a tira invisível continuaria engolindo o
      toque de quem mira no que está atrás dela.
    */
    <View
      /*
        `box-none` fica na prop, e é o único lugar do app onde ela continua.

        O React Native depreciou a prop em favor do estilo, e as outras doze
        camadas do app migraram. Estas duas não podem: o `react-native-web`
        **descarta** `box-none` quando ele vem pelo estilo — medido, o
        `pointer-events` computado volta a ser `auto`. E `auto` aqui é o defeito
        que a tira erguida tinha antes de existir: ela engole o toque de quem
        mira no conteúdo atrás dela.

        No aparelho o estilo funcionaria. Só que o app também roda na web, e
        trocar comportamento de toque por causa de um aviso de depreciação é
        pagar caro por arrumação.
      */
      pointerEvents="box-none"
      style={{ marginTop: -(RAISE + POR_TRAS_DA_BARRA), paddingTop: RAISE, zIndex: 2 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 10,
          paddingBottom: 10 + insets.bottom,
          backgroundColor: colors.surface,
          borderTopLeftRadius: RAIO_DO_TOPO,
          borderTopRightRadius: RAIO_DO_TOPO,
          ...shadows.barra,
        }}
      >
        {/*
          O fio, no lugar da borda que ia de ponta a ponta.

          Uma borda de ponta a ponta num painel de canto arredondado acompanha a
          curva e morre na quina, apontando para o canto em vez de separar a
          barra do que está atrás. O documento troca por um fio de 1,5 recuado
          40 de cada lado: ele fica inteiro na parte reta do topo, e quem separa
          o painel da página é a sombra.
        */}
        <View
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            left: RECUO_DO_FIO,
            right: RECUO_DO_FIO,
            height: 1.5,
            borderRadius: 1,
            backgroundColor: palette.brown100,
          }}
        />

        {lateral(LEFT)}
        {/*
          Lugar reservado para o botão central, que é posicionado por cima.

          O rótulo dele mora aqui, e não no botão: o botão sobe para fora da
          barra, e um texto preso nele subiria junto, descolado dos outros dois.
          O espaçador de 26 é a altura do ícone das laterais, para as três
          palavras ficarem na mesma linha.
        */}
        <View style={{ width: CENTER_SIZE, alignItems: 'center', gap: 3 }}>
          <View style={{ height: 26 }} />
          <Text
            style={{
              fontFamily: active === 'home' ? fonts.body.bold : fonts.body.regular,
              fontSize: 11,
              color: active === 'home' ? colors.primaryStrong : colors.textSecondary,
            }}
          >
            Início
          </Text>
        </View>
        {lateral(RIGHT)}
      </View>

      {/* `box-none` pela prop, pelo mesmo motivo da camada de cima. Esta faixa
          atravessa a largura toda: com `auto`, ela engoliria o toque nos
          rótulos das duas abas laterais. */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}
      >
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Início"
          accessibilityState={{ selected: active === 'home' }}
          onPress={(e) => {
            aoTocar?.('home', { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
            onChange?.('home');
          }}
          style={({ pressed }) => ({
            width: CENTER_SIZE,
            height: CENTER_SIZE,
            borderRadius: CENTER_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            /*
              O copo vazio: o verde mais claro que o tema tem.

              A primeira tentativa recuava o disco com opacidade, e o pêssego
              lavado no creme do fundo lia como botão desligado. A segunda usou
              `green300`, que continuava cheio demais para parecer vazio. O que
              faz a água aparecer é o contraste entre o copo e o líquido: com o
              tom suave do tema atrás e o verde cheio subindo por cima, o
              movimento é a própria diferença entre os dois.
            */
            backgroundColor: colors.primarySoft,
            overflow: 'hidden',
            transform: [{ scale: pressed ? 0.94 : 1 }],
            ...shadows.md,
          })}
        >
          {/*
            A marca do copo vazio, no verde forte para ser legível no tom claro.
            Ela fica embaixo; a água sobe por cima dela com a sua própria cópia.
          */}
          <View style={{ position: 'absolute', zIndex: 0 }}>
            <BrotinhoMark size={CENTER_SIZE} disco={null} traco={colors.primaryStrong} />
          </View>

          {/*
            A água, e o truque que a faz parecer água.

            São duas camadas. A de fora é uma peça do tamanho do botão que sobe
            de baixo para cima — e o `overflow: 'hidden'` do botão, que é
            redondo, recorta ela em círculo: o que aparece é uma linha de nível
            subindo dentro de um copo, e não um retângulo entrando na tela.

            A de dentro **desce na mesma medida**. Sem isso, a marca clara subiria
            junto com a água como se estivesse boiando. Descendo o mesmo tanto,
            ela fica parada no lugar e vai sendo *revelada* conforme o nível
            passa por ela — que é exatamente o que acontece com um desenho no
            fundo de um copo que se enche.
          */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: CENTER_SIZE,
              height: CENTER_SIZE,
              overflow: 'hidden',
              /* Acima das cristas: elas são maiores que o botão e, sem ordem
                 declarada, cobriam a marca inteira. */
              zIndex: 2,
              transform: [{ translateY: nivel }],
            }}
          >
            <Animated.View
              style={{
                width: CENTER_SIZE,
                height: CENTER_SIZE,
                backgroundColor: MARK_DISCO,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ translateY: Animated.multiply(nivel, -1) }],
              }}
            >
              <BrotinhoMark size={CENTER_SIZE} disco={null} />
            </Animated.View>
          </Animated.View>

          {/*
            As cristas, na linha da água.

            Elas acompanham o nível e só somam para cima: a metade de baixo de
            cada uma cai dentro da água, que é da mesma cor, e some. O que se vê
            é a superfície inchando de um lado e do outro conforme elas giram.

            Somem com o copo vazio. Sem isso, no repouso da aba fechada sobraria
            um fio verde encostado na borda de baixo do disco — a crista de uma
            água que não existe.
          */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: CENTER_SIZE,
              height: CENTER_SIZE,
              zIndex: 1,
              opacity: nivel.interpolate({
                inputRange: [0, CENTER_SIZE * 0.88, CENTER_SIZE],
                outputRange: [1, 1, 0],
              }),
              transform: [{ translateY: nivel }],
            }}
          >
            {[
              [ONDA_DE_TRAS, marolaDeTras] as const,
              [ONDA, marola] as const,
            ].map(([onda, giro]) => {
              const lado = CENTER_SIZE * onda.lado;
              return (
                <Animated.View
                  key={onda.giro}
                  style={{
                    position: 'absolute',
                    top: ondaEncostada(lado, onda.canto),
                    left: (CENTER_SIZE - lado) / 2,
                    width: lado,
                    height: lado,
                    borderRadius: lado * onda.canto,
                    backgroundColor: MARK_DISCO,
                    /* Uma gira para cada lado: em desacordo elas não fecham
                       ciclo à vista. */
                    transform: [
                      {
                        rotate: giro.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', `${onda.sentido * 360}deg`],
                        }),
                      },
                    ],
                  }}
                />
              );
            })}
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useMenosMovimento } from '../hooks/useMenosMovimento';
import { useTema } from '../theme';
import { camadaDaAba, proximaAAquecer, proximasMontadas } from './regrasDasAbas';

/**
 * As abas da barra de baixo, todas montadas ao mesmo tempo — só uma à vista.
 *
 * ## O que isto conserta
 *
 * As três abas dividiam um lugar só na árvore, e a troca era uma chave de
 * `ScreenTransition`: ir para outra aba **desmontava** a atual e montava a de
 * destino do zero — as duas faixas animadas, os desenhos, a grade das
 * práticas, tudo de novo. Medido no navegador com a CPU desacelerada quatro
 * vezes:
 *
 * | para       | linha travada |
 * | ---------- | ------------- |
 * | Início     | 899 ms        |
 * | Brotinho   | 694 ms        |
 * | Perfil     | 149 ms        |
 *
 * E o esmaecer não chegava a acontecer: amostrada quadro a quadro, a opacidade
 * da camada ia de 1 a 0 e voltava para 1 num salto, sem nenhum valor no meio.
 * A linha estava travada o tempo inteiro da animação, e a rede de segurança da
 * `ScreenTransition` — que existe para a tela nunca ficar invisível — chegava
 * antes dela. Travada e corte seco, nessa ordem, toda vez.
 *
 * Aqui nenhuma aba desmonta. A troca são duas telas opacas andando de lado
 * durante {@link TROCA_MS}, que o compositor desenha sozinho.
 *
 * ## E nenhuma delas esmaece
 *
 * A primeira versão disto trocava as abas com uma dissolução, e ela trouxe **o
 * piscar**: por 220 ms apareciam duas telas inteiras uma dentro da outra — a
 * terra escura da Início lavando por cima do claro do Brotinho, dois
 * cabeçalhos, dois textos. O porquê, e por que deslizar não inventa
 * hierarquia, estão no cabeçalho de `regrasDasAbas`.
 *
 * ## Isto é o quarto conserto da mesma queixa
 *
 * As três primeiras vezes trataram sintomas: a transição, depois a tela
 * empilhada, depois o congelamento do elemento da aba. O que faltava era a
 * causa — montar uma tela inteira dentro do toque. Para não voltar uma quinta
 * vez existe o `scripts/confere-troca-de-telas.js`, que reprova a bateria se
 * alguém puser as abas de volta num lugar só, e o
 * `scripts/testa-abas-vivas.js`, que guarda as regras de `regrasDasAbas.ts`.
 */

/** Quanto dura a passagem de uma aba para a próxima. */
const TROCA_MS = 220;

/**
 * Quanto a montagem em silêncio espera antes de cada aba.
 *
 * Dois segundos é depois da abertura do app — que é o momento mais cheio que
 * existe — e antes de a pessoa ter terminado de ler a tela inicial. O preço da
 * montagem é pago uma vez, num instante parado, em vez de dentro do toque na
 * barra de baixo, que é onde ele aparece como travada.
 */
const ESPERA_DO_AQUECIMENTO = 2000;

/**
 * A aba em volta está à vista?
 *
 * Quem está montado e escondido para de se mexer. Sem isto, manter as três
 * abas de pé trocaria a travada da troca por três telas animando o tempo todo
 * — e o preço disso é bateria de quem nem está olhando.
 *
 * Vale `true` fora da `AbasVivas`: uma tela empilhada não é aba nenhuma, e a
 * pessoa está olhando para ela. Durante a troca ele demora a virar de propósito
 * — ver `CenaDasAbas`.
 *
 * ## Quem pode ler isto
 *
 * **Só a folha que se mexe** — a faixa animada, o gatilho de um aviso. Nunca o
 * corpo de uma tela.
 *
 * Quem lê um contexto é redesenhado quando ele muda, e o valor daqui muda
 * exatamente no instante da troca de aba. Lido no alto da `HomeScreen`, ele
 * redesenhava a tela inteira dentro do toque: medido, **411 ms** de linha
 * travada numa troca que sem ele custa **zero**. Foi a travada inteira
 * voltando pela porta dos fundos, no mesmo dia em que ela saiu pela frente.
 *
 * É a mesma regra do `useCoberta`, e pelo mesmo motivo.
 */
const AbaAVista = createContext(true);
export const useAbaAVista = () => useContext(AbaAVista);

/** De onde o círculo da revelação nasce, em pixels da tela. */
export type OrigemDaTroca = { x: number; y: number };

/**
 * O raio que o círculo precisa alcançar para cobrir a tela inteira.
 *
 * É a distância do ponto de origem até o canto mais longe. Calculado, e não um
 * número grande chutado: um raio folgado demais faz o fim da animação acontecer
 * fora da tela, e a revelação parece terminar antes da hora.
 */
function raioQueCobre(origem: OrigemDaTroca, largura: number, altura: number): number {
  const dx = Math.max(origem.x, largura - origem.x);
  const dy = Math.max(origem.y, altura - origem.y);
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * De que tamanho o círculo começa, em pontos de raio.
 *
 * Não começa de zero. Dois motivos, e o segundo é o que manda:
 *
 * 1. Um círculo de raio zero some do compositor em algumas superfícies, e a
 *    aba nova pisca inteira no primeiro quadro.
 * 2. A tela de dentro é desenhada com a **escala inversa** à do recorte (ver
 *    `JanelaRedonda`), e inverso de quase-zero é quase-infinito: num raio
 *    inicial de um ponto, o conteúdo entraria desenhado quinhentas vezes
 *    maior, e o que o primeiro quadro mostraria seria um pedaço de um pixel
 *    esticado.
 *
 * Vinte e dois pontos é mais ou menos o tamanho do ícone tocado — então o
 * círculo não nasce "de um ponto", nasce **do ícone**, que é o que o documento
 * desenha.
 */
const RAIO_INICIAL = 22;

/**
 * A tela nova, vista por uma janela redonda que cresce.
 *
 * ## Por que não é uma máscara
 *
 * O caminho óbvio seria `@react-native-masked-view`. Ele foi instalado, usado,
 * e desfeito no mesmo dia: a implementação dele para web é
 *
 * ```js
 * function MaskedView({ maskElement, ...props }) {
 *   return React.createElement(View, props, maskElement);
 * }
 * ```
 *
 * — ela desenha a **máscara** e **joga os filhos fora**. No navegador a aba que
 * chega aparecia como um disco preto crescendo sobre o nada. E o navegador é a
 * única superfície em que este app consegue ser conferido sem um aparelho na
 * mão: uma animação que só existe no nativo é uma animação que ninguém viu —
 * a mesma lição que está escrita por extenso em `laco.ts`.
 *
 * ## Como ela funciona
 *
 * Duas caixas, uma dentro da outra, com escalas inversas:
 *
 * - a **de fora** é um quadrado do tamanho do círculo cheio, redonda por
 *   `borderRadius`, com `overflow: 'hidden'`, e cresce de `RAIO_INICIAL` até o
 *   raio que cobre a tela;
 * - a **de dentro** é a tela inteira, posicionada no lugar certo e encolhida
 *   pelo inverso exato da escala de fora.
 *
 * Escalar por `s` em torno de um ponto e depois por `1/s` em torno do mesmo
 * ponto é a identidade: o conteúdo fica parado, do tamanho certo, enquanto só
 * o recorte cresce. E as duas são `transform`, que é o que o driver nativo
 * sabe animar sozinho — nada disto passa pelo JavaScript quadro a quadro.
 */
function JanelaRedonda({
  t,
  centro,
  raio,
  largura,
  altura,
  children,
}: {
  t: Animated.Value;
  centro: OrigemDaTroca;
  raio: number;
  largura: number;
  altura: number;
  children: React.ReactNode;
}) {
  const inicial = Math.min(RAIO_INICIAL, raio) / raio;
  const escala = t.interpolate({ inputRange: [0, 1], outputRange: [inicial, 1] });
  /*
    A inversa é uma **divisão**, e não outra interpolação.

    A primeira versão escrevia `outputRange: [1 / inicial, 1]`, o que parece a
    mesma coisa e não é: interpolar entre os inversos não dá o inverso da
    interpolação. `1 / lerp(a, b, t) ≠ lerp(1/a, 1/b, t)` em todo t que não
    seja 0 ou 1 — nas duas pontas bate, e no meio não.

    Medido no navegador: a tela de dentro saía do tamanho certo em t=0,
    inchava até dez vezes no meio da animação e voltava ao certo no fim. Era
    o erro aparecendo exatamente onde a conta erra.
  */
  const inversa = Animated.divide(1, escala);

  return (
    <Animated.View
      /* Tem nome para poder ser medida quadro a quadro no navegador. */
      testID="janela-redonda"
      style={{
        position: 'absolute',
        left: centro.x - raio,
        top: centro.y - raio,
        width: raio * 2,
        height: raio * 2,
        borderRadius: raio,
        overflow: 'hidden',
        transform: [{ scale: escala }],
      }}
    >
      <Animated.View
        /* Tem nome para poder ser medida quadro a quadro no navegador: é assim
           que se descobre que a tela de dentro está inchando no meio da
           animação em vez de ficar parada. */
        testID="janela-conteudo"
        style={{
          position: 'absolute',
          /* A tela inteira, deslocada para o canto dela cair no (0,0) da tela. */
          left: raio - centro.x,
          top: raio - centro.y,
          width: largura,
          height: altura,
          /*
            O inverso, em torno do mesmo ponto: o centro do círculo.

            Escrito como ida-escala-volta, e não com `transformOrigin`. A
            primeira versão usava a propriedade, e no navegador ela não pegou:
            a escala aconteceu em torno do **centro da tela**, não do centro do
            círculo, e o conteúdo entrava gigante — medido, não deduzido.

            `T(d) · S(k) · T(-d)` é escalar em torno de um ponto, e `d` é a
            distância desse ponto até o centro da `View`, que é a origem padrão
            do `transform` no React Native. Só a escala é animada; os dois
            deslocamentos são constantes.
          */
          transform: [
            { translateX: centro.x - largura / 2 },
            { translateY: centro.y - altura / 2 },
            { scale: inversa },
            { translateX: -(centro.x - largura / 2) },
            { translateY: -(centro.y - altura / 2) },
          ],
        }}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

type Props<Chave extends string> = {
  /** A aba em que a pessoa está. */
  ativa: Chave;
  /**
   * Onde o dedo encostou na barra, para o círculo nascer dali.
   *
   * Sem isto — uma troca que não veio de um toque na barra — o círculo nasce
   * no meio do pé da tela, que é onde a barra fica.
   */
  origem?: OrigemDaTroca | null;
  /**
   * Todas as abas, **na ordem da barra de baixo**, da esquerda para a direita.
   *
   * A ordem decide de que lado a aba nova entra — ver `CenaDasAbas`. E serve
   * de brinde para o aquecimento: a primeira que falta é a primeira a montar
   * em silêncio.
   */
  todas: readonly Chave[];
  /** Desenha uma aba. Deve devolver sempre o **mesmo** elemento para a mesma
   *  chave, senão a aba é refeita e a travada volta por outro caminho. */
  render: (chave: Chave) => React.ReactNode;
};

export function AbasVivas<Chave extends string>({
  ativa,
  todas,
  render,
  origem,
}: Props<Chave>) {
  const { colors } = useTema();
  const menosMovimento = useMenosMovimento();
  const { width: largura, height: altura } = useWindowDimensions();

  /*
    A origem é congelada no instante em que a troca começa.

    Ela vem de fora e pode mudar no meio da animação — outro toque na
    barra, por exemplo. Lida direto, o círculo saltaria de lugar enquanto
    cresce. Congelada, cada revelação nasce onde o dedo dela encostou.
  */
  const ondeNasceu = useRef<OrigemDaTroca | null>(null);

  /*
    Calculado no próprio render, e não num efeito: num efeito, existiria um
    quadro em que a aba de destino ainda não está na lista e a tela aparece
    vazia — o corte seco de novo, por outra porta.
  */
  const [montadas, setMontadas] = useState<readonly Chave[]>(() => [ativa]);
  const noAr = proximasMontadas(montadas, ativa);
  if (noAr !== montadas) setMontadas(noAr);

  /** A aba que está saindo, ainda desenhada ao lado da que chega. */
  const [anterior, setAnterior] = useState<Chave | null>(null);
  /** A que pode se mexer. Só vira a nova quando a troca acaba — ver `CenaDasAbas`. */
  const [seMexendo, setSeMexendo] = useState<Chave>(ativa);
  const [animando, setAnimando] = useState(false);
  const t = useRef(new Animated.Value(1)).current;
  const queEstava = useRef(ativa);

  /*
    `useLayoutEffect`, e não `useEffect`: o efeito comum roda depois da
    pintura, e existe um quadro em que a aba nova já foi desenhada no lugar,
    com o `t` que sobrou da troca anterior, antes de saltar para zero e
    começar a entrar. Num aparelho lento isso é a tela nova piscando antes de
    entrar.
  */
  useLayoutEffect(() => {
    if (queEstava.current === ativa) return;
    const saindo = queEstava.current;
    queEstava.current = ativa;

    if (menosMovimento) {
      t.setValue(1);
      setAnterior(null);
      setSeMexendo(ativa);
      return;
    }

    setAnterior(saindo);
    ondeNasceu.current = origem ?? { x: largura / 2, y: altura - 48 };
    t.setValue(0);
    setAnimando(true);
    const troca = Animated.timing(t, {
      toValue: 1,
      duration: TROCA_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const assentou = () => {
      setAnimando(false);
      setAnterior(null);
      setSeMexendo(ativa);
    };
    troca.start(({ finished }) => {
      /* Interrompida por outra troca: quem manda é a de agora. */
      if (finished) assentou();
    });

    /* Rede de segurança: a aba ativa não pode ficar fora da tela por nada. */
    const seguranca = setTimeout(() => {
      t.setValue(1);
      assentou();
    }, TROCA_MS + 250);

    return () => {
      troca.stop();
      clearTimeout(seguranca);
    };
    /*
      `origem`, `largura` e `altura` de fora da lista de propósito: elas são
      lidas no instante da troca e congeladas. Entrando aqui, mudar de tamanho
      de janela recomeçaria a animação no meio.
    */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativa, menosMovimento, t]);

  /*
    Monta em silêncio as abas que a pessoa ainda não abriu.

    Uma de cada vez: o efeito roda de novo quando a lista cresce, e agenda a
    seguinte.

    ## Por que um relógio simples, e não o `InteractionManager`

    `runAfterInteractions` é o lugar certo para trabalho pesado que pode
    esperar: ele guarda a fila até o dedo sair da tela e as animações
    acabarem. Só que, **neste app, ele nunca chega a rodar**. `Animated.timing`
    nasce com `isInteraction` ligado, e a faixa da Composta roda um
    `Animated.loop` que não acaba nunca — a mão que ele levanta nunca é
    abaixada, e a fila fica parada para sempre.

    Isso não aparece como erro: aparece como o aquecimento simplesmente não
    acontecendo. Conferido no navegador, cinco segundos depois de o app abrir
    havia uma aba montada, e não três — e a primeira troca de aba pagava a
    montagem inteira, que é o defeito que este componente veio tirar.
  */
  useEffect(() => {
    const pendente = proximaAAquecer(noAr, todas);
    if (!pendente) return;
    const espera = setTimeout(
      () => setMontadas((antes) => proximasMontadas(antes, pendente)),
      ESPERA_DO_AQUECIMENTO,
    );
    return () => clearTimeout(espera);
  }, [noAr, todas]);

  const raio = raioQueCobre(
    ondeNasceu.current ?? { x: largura / 2, y: altura - 48 },
    largura,
    altura,
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {noAr.map((chave) => {
        const camada = camadaDaAba(chave, { ativa, anterior, seMexendo, ordem: todas });
        return (
          <Animated.View
            key={chave}
            /* Tem nome para poder ser medida quadro a quadro no navegador. */
            testID={`aba-viva-${chave}`}
            pointerEvents={camada.recebeToque ? 'auto' : 'none'}
            /*
              A aba escondida some para o leitor de tela: montada e invisível,
              ela continuaria na ordem de leitura do TalkBack.
            */
            importantForAccessibility={camada.recebeToque ? 'auto' : 'no-hide-descendants'}
            accessibilityElementsHidden={!camada.recebeToque}
            renderToHardwareTextureAndroid={animando}
            style={[
              StyleSheet.absoluteFill,
              {
                /*
                  Fundo próprio, porque a camada é **opaca**: é o que garante
                  que a aba de trás não apareça por dentro da da frente em
                  nenhum quadro. Ver o cabeçalho de `regrasDasAbas`.
                */
                /*
                  A camada que está sendo revelada **não** pinta fundo: o fundo
                  dela é opaco e cobriria a aba de baixo fora do círculo, que é
                  justamente o que o círculo existe para deixar à mostra.
                */
                backgroundColor: camada.revela && animando ? 'transparent' : colors.bg,
                zIndex: camada.altura,
                opacity: camada.opacidade,
                transform: camada.desliza
                  ? [
                      {
                        translateX: t.interpolate({
                          inputRange: [0, 1],
                          outputRange: [camada.desliza[0] * largura, camada.desliza[1] * largura],
                        }),
                      },
                    ]
                  : [],
              },
            ]}
          >
            {camada.revela && animando ? (
              /* A revelação em círculo. Ver `JanelaRedonda` e `regrasDasAbas`. */
              <JanelaRedonda
                t={t}
                centro={ondeNasceu.current ?? { x: largura / 2, y: altura - 48 }}
                raio={raio}
                largura={largura}
                altura={altura}
              >
                <AbaAVista.Provider value={camada.aVista}>{render(chave)}</AbaAVista.Provider>
              </JanelaRedonda>
            ) : (
              <AbaAVista.Provider value={camada.aVista}>{render(chave)}</AbaAVista.Provider>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

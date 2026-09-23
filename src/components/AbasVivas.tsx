import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

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
 * Aqui nenhuma aba desmonta. A troca é quem está por cima, e um esmaecer de
 * {@link TROCA_MS} que o compositor desenha sozinho.
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

/** Quanto dura o esmaecer entre uma aba e a próxima. */
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

type Props<Chave extends string> = {
  /** A aba em que a pessoa está. */
  ativa: Chave;
  /** Todas as abas, na ordem em que vale a pena montá-las em silêncio. */
  todas: readonly Chave[];
  /** Desenha uma aba. Deve devolver sempre o **mesmo** elemento para a mesma
   *  chave, senão a aba é refeita e a travada volta por outro caminho. */
  render: (chave: Chave) => React.ReactNode;
};

export function AbasVivas<Chave extends string>({ ativa, todas, render }: Props<Chave>) {
  const { colors } = useTema();
  const menosMovimento = useMenosMovimento();

  /*
    Calculado no próprio render, e não num efeito: num efeito, existiria um
    quadro em que a aba de destino ainda não está na lista e a tela aparece
    vazia — o corte seco de novo, por outra porta.
  */
  const [montadas, setMontadas] = useState<readonly Chave[]>(() => [ativa]);
  const noAr = proximasMontadas(montadas, ativa);
  if (noAr !== montadas) setMontadas(noAr);

  /** A aba que está saindo, ainda desenhada por baixo da que chega. */
  const [anterior, setAnterior] = useState<Chave | null>(null);
  /** A que pode se mexer. Só vira a nova quando o esmaecer acaba — ver `CenaDasAbas`. */
  const [seMexendo, setSeMexendo] = useState<Chave>(ativa);
  const [animando, setAnimando] = useState(false);
  const t = useRef(new Animated.Value(1)).current;
  const queEstava = useRef(ativa);

  /*
    `useLayoutEffect`, e não `useEffect`: o efeito comum roda depois da
    pintura, e existe um quadro em que a aba nova já foi desenhada inteira,
    com o `t` que sobrou da troca anterior, antes de saltar para zero e
    começar a aparecer. Num aparelho lento isso é a tela nova piscando antes
    de entrar.
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

    /* Rede de segurança: a aba ativa não pode ficar invisível por nada. */
    const seguranca = setTimeout(() => {
      t.setValue(1);
      assentou();
    }, TROCA_MS + 250);

    return () => {
      troca.stop();
      clearTimeout(seguranca);
    };
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {noAr.map((chave) => {
        const camada = camadaDaAba(chave, { ativa, anterior, seMexendo });
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
                backgroundColor: colors.bg,
                zIndex: camada.altura,
                opacity: camada.opacidade ?? t,
              },
            ]}
          >
            <AbaAVista.Provider value={camada.aVista}>{render(chave)}</AbaAVista.Provider>
          </Animated.View>
        );
      })}
    </View>
  );
}

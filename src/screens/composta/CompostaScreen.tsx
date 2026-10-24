import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import {
  AjudaAgora,
  ALTURA_DA_CENA,
  BalaoDoBroto,
  BotaoNoCeu,
  Button,
  CabecalhoNoCeu,
  Chip,
  CRISTA,
  FLORES,
  FolhaDaComposta,
  Icon,
  IconeDaFlor,
  Input,
  MicrofoneDaComposta,
  PaisagemDaComposta,
  caixaDaNuvemGrande,
  PastilhaEscura,
  PastilhaNoCeu,
  ScreenTransition,
  SEGUNDOS_DA_COMPOSTA,
  TextoNaPastilha,
  TituloNoCeu,
  canteiroDaPratica,
  falaDoBrotoNaComposta,
  florDoIndice,
  LADO_DO_MICROFONE,
} from '../../components';
import { recuoDaCena } from '../../components/brand/FolhaDaComposta';
import {
  PASTILHA_ESCURA,
  TEXTO_NA_PAISAGEM,
  TEXTO_NA_PAISAGEM_FRACO,
  curvaDaLetra,
  desfoqueDaFrase,
} from '../../components/brand/planoDaPaisagem';
import { ALTURA_ERGUIDA, POR_TRAS_DA_BARRA } from '../../components/navigation/BottomNav';
import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { perguntarSobreAInternet, precisaDaLicencaDeVoz, SERVICO_DE_VOZ } from '../../services/licencaDeVoz';
import { toqueDeConclusao, toqueLeve } from '../../services/toque';
import { useAppState } from '../../state/AppStateProvider';
import { sproutStage, vezesQueVoltou, voltouAntes } from '../../state/derived';
import { SUGESTOES_DA_COMPOSTA } from '../../data/composta';
import { fonts, radius, useTema } from '../../theme';
import { JardimDaComposta } from './JardimDaComposta';
import { useCompostSession, type ModoDaComposta } from './useCompostSession';
import { useBotaoVoltar } from '../../navigation/useBotaoVoltar';
import {
  jaPedimosAvaliacao,
  pedirAvaliacaoNaComposta,
} from '../../services/pedirAvaliacao';

/**
 * A Composta — compostar um pensamento até ele virar só som, e depois flor.
 *
 * ## O lugar, e as cinco telas dentro dele
 *
 * As cinco telas da ferramenta são **o mesmo lugar** em horas diferentes: a
 * mesma paisagem, com a luz mudando. O céu começa de chumbo na tela do
 * pensamento, abre em dourado ao longo dos trinta e seis segundos de voz, e na
 * tela do fim o sol está alto com os raios girando. O que fecha a história é a
 * terra: cada frase compostada deixa uma flor no solo, e o solo vira um jardim
 * que é o histórico da prática.
 *
 * Isso é o que uma sequência de telas creme com cartões nunca disse: que a
 * coisa tem direção, e que repetir hoje acrescenta a alguma coisa que fica.
 *
 * ## A fundamentação, que não é tema
 *
 * Saciedade semântica: repetir uma frase rápido e muitas vezes faz o cérebro
 * parar de processá-la como significado e passar a ouvi-la como som. Na ACT
 * chama-se defusão cognitiva. Toda a encenação daqui existe para servir a esse
 * mecanismo — a frase que se desmancha letra por letra na tela é a imagem dele,
 * e é por isso que ela se desfaz em pedaços de palavra em vez de ser apagada
 * palavra por palavra.
 *
 * ## O que é do app e não do documento
 *
 * O protótipo conta repetições por um cronômetro: `reps = floor(t / 2.5)`.
 * Aqui quem conta é o **aparelho ouvindo a frase** — `useCompostSession` liga
 * o reconhecimento de voz, confere o que foi dito contra o que ela escreveu, e
 * cai no volume do microfone onde o reconhecimento não existe. A prática não
 * anda falando outra coisa, e isso é o contrário de simular.
 *
 * Também são do app, e ficam: o modo baixinho (quem usa isto na cama às duas
 * da manhã não pode falar alto), o aviso de que o áudio não é salvo, o
 * reconhecimento de pensamento recorrente, e a passagem para o diário no fim.
 */

/** Repetições até a frase se desmanchar por completo. */
const REPS_PARA_SUMIR = 12;

/* As frases moram em `data/composta` desde que o cartão da tela inicial
   passou a usar as mesmas para demonstrar o gesto. */
const SUGESTOES = SUGESTOES_DA_COMPOSTA;

/** "5 de setembro" — a data curta do reconhecimento de frase repetida. */
const diaDe = (quando: number) =>
  new Date(quando).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

type Step = 'explain' | 'thought' | 'record' | 'done' | 'garden';

/**
 * Os passos, na ordem em que acontecem.
 *
 * É dela que a transição tira o lado: avançar entra pela direita, o "voltar"
 * do pensamento entra pela esquerda. O jardim fica no fim porque é para onde
 * se vai do fim da prática — e voltar dele entra pela esquerda, como deve.
 */
const PASSOS_DA_COMPOSTA = ['explain', 'thought', 'record', 'done', 'garden'] as const;

/**
 * A nuvem, o microfone e a papoula dos três passos da explicação.
 *
 * Desenhados aqui, e não tirados do conjunto de ícones, porque os dois
 * primeiros têm **preenchimento** — a nuvem é branca com contorno escuro, o
 * bulbo do microfone é branco. O `Icon` do app é um conjunto de contorno, de
 * uma cor só: um microfone vazado dentro de um círculo verde-claro leria como
 * ícone de interface, e o que estes três são é ilustração pequena.
 */
function NuvemDoPasso() {
  return (
    <Svg width={26} height={26} viewBox="0 0 32 24">
      <Path
        d="M 4 18 C 1 13 5 8 10 9 C 11 3 19 1 22 6 C 27 4 31 9 29 14 C 30 18 27 20 24 20 L 7 20 C 5 20 4 19 4 18 Z"
        fill="#fff"
        stroke={TEXTO_NA_PAISAGEM}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MicrofoneDoPasso() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z"
        fill="#fff"
        stroke="#3E6B54"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.5 11a5.5 5.5 0 0 0 11 0 M12 16.5V20"
        stroke="#3E6B54"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** A lâmpada do cartão "Por que funciona" — miolo âmbar, contorno escuro. */
function Lampada() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"
        fill="#F6D27E"
        stroke={TEXTO_NA_PAISAGEM}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 18h6M10 21h4"
        stroke={TEXTO_NA_PAISAGEM}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * A linha pontilhada entre dois passos da explicação.
 *
 * É SVG, e não uma `View` com `borderStyle: 'dotted'`: o `borderStyle` do
 * React Native vale para a borda inteira, e uma borda só à esquerda com
 * pontilhado sai contínua no Android. Com `strokeDasharray` o pontilhado é o
 * mesmo nas três plataformas.
 */
function LinhaDoPasso({ cor }: { cor: string }) {
  return (
    <View style={{ width: 2.5, height: 16, marginVertical: 4, marginLeft: 22 }}>
      <Svg width={2.5} height={16}>
        <Line
          x1={1.25}
          y1={0}
          x2={1.25}
          y2={16}
          stroke={cor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="0.1 5"
        />
      </Svg>
    </View>
  );
}

export function CompostaScreen({
  onClose,
  aoFazerExercicio,
  aoEscreverNoDiario,
}: {
  onClose: () => void;
  /** Repassado ao CVV: a saída de quem não quer falar com ninguém agora. */
  aoFazerExercicio?: () => void;
  /** Abre o diário com a pergunta de partida, no fim da prática. */
  aoEscreverNoDiario?: (comeco: string) => void;
}) {
  const { colors, palette, shadows } = useTema();
  const { width: largura, height: alturaDaTela } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const parado = useMenosMovimento();
  /*
    Quanto a cena desce por causa da barra de status — ver `recuoDaCena`.

    Uma régua só para as cinco telas: tudo que o documento posiciona (a
    crista, o sol, as nuvens, o selo, a frase na nuvem) soma isto, e nada sai
    do lugar em relação a nada.
  */
  const recuo = recuoDaCena(insets.top);
  const { data, addCompost, pesarAgora, marcarAvaliacaoPedida, updateSettings } = useAppState();

  /**
   * A ferramenta sempre abre na primeira tela, a que explica.
   *
   * Ela já fez diferente: quem tinha compostado alguma vez entrava direto no
   * campo de texto, pela ideia de que a explicação é pedágio para quem já
   * sabe. O Pedro pediu para voltar atrás, e a tela nova dá razão a ele —
   * porque **ela deixou de ser só explicação**.
   *
   * Hoje a primeira tela é onde o jardim aparece: o solo com as flores de
   * todas as frases que já foram compostadas, e o selo que leva ao histórico.
   * Pular isso para cair num campo vazio é pular justamente o que a prática
   * acumulou — e o acúmulo é o que faz voltar valer a pena. Quem não quer ler
   * desce até o botão, que fica preso no rodapé e não cobra rolagem nenhuma.
   */
  const [step, setStep] = useState<Step>('explain');
  /** De onde se entrou no jardim, para o "voltar" dele voltar ao certo. */
  const [jardimVeioDe, setJardimVeioDe] = useState<Step>('explain');

  const irParaOPensamento = () => setStep('thought');
  /*
    A explicação está sempre atrás, porque é sempre por ela que se entra — o
    estado que guardava "ela está atrás?" não tem mais o que guardar.
  */
  const voltarDoPensamento = () => setStep('explain');

  const [thought, setThought] = useState('');
  const [modo, setModo] = useState<ModoDaComposta>('voz');
  const [result, setResult] = useState({ reps: 0, secs: 0 });
  /** O `id` da compostagem que acabou de nascer — para a pergunta do peso. */
  const [idDaSessao, setIdDaSessao] = useState<string | null>(null);
  const [peso, setPeso] = useState<'menos' | 'igual' | 'mais' | null>(null);

  /**
   * O pedido de avaliação, preso na resposta "pesa menos".
   *
   * Fica aqui, e não num `useEffect` que observa `peso`, porque ele precisa
   * acontecer **uma vez, no toque**. Observando o estado, trocar de resposta e
   * voltar para "menos" dispararia de novo.
   *
   * O atraso é o mesmo da colheita, e pela mesma razão: o modal da loja sobe
   * por cima da tela, e abri-lo no mesmo quadro do toque engole o retorno
   * visual do botão que a pessoa acabou de escolher.
   *
   * `marcarAvaliacaoPedida` roda **antes** do atraso, e de propósito: se a
   * pessoa sair da tela nesse meio segundo, o pedido não acontece e a cota não
   * foi gasta — mas também não queremos que ele volte a disparar na próxima
   * Composta como se nada tivesse sido tentado. Uma chance, uma anotação.
   */
  const avaliacaoAgendada = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pedirAvaliacaoSePuder = () => {
    if (jaPedimosAvaliacao(data.profile.avaliacaoPedidaEm)) return;
    if (avaliacaoAgendada.current) return;
    marcarAvaliacaoPedida();
    avaliacaoAgendada.current = setTimeout(() => void pedirAvaliacaoNaComposta(), 1200);
  };
  useEffect(() => () => {
    if (avaliacaoAgendada.current) clearTimeout(avaliacaoAgendada.current);
  }, []);
  /*
    O botão de segurar está pressionado agora.

    A sessão guarda isso num `ref` — ela precisa ler o valor dentro do laço de
    contagem, sem redesenhar nada sessenta vezes por segundo. Mas a tela
    **mostra** o estado, em duas linhas de texto, e para isso precisa de
    estado. Os dois andam juntos nos mesmos dois gestos, logo abaixo.
  */
  const [segurando, setSegurando] = useState(false);

  /** Se esta frase já passou por aqui — dito enquanto ela escreve. */
  const voltou = useMemo(() => voltouAntes(data, thought), [data, thought]);
  const [jaVoltou, setJaVoltou] = useState(0);

  /**
   * Quantas flores o solo já tem.
   *
   * Lido num `ref` no começo da sessão, e não de `data` a cada render: a
   * compostagem que termina agora soma uma, e a tela do fim precisa mostrar o
   * canteiro **sem** a flor nova (que ela desenha nascendo) e o selo **com**
   * ela. Dois números diferentes do mesmo instante.
   */
  const floresAntes = useRef(data.composts.length);

  const session = useCompostSession({
    targetSeconds: SEGUNDOS_DA_COMPOSTA,
    frase: thought.trim() || SUGESTOES[0],
    podeUsarAInternet: data.settings.vozForaDoAparelho === 'permitida',
    onFinish: ({ reps, secs }) => {
      setJaVoltou(vezesQueVoltou(data, thought.trim()) + 1);
      setResult({ reps, secs });
      floresAntes.current = data.composts.length;
      setIdDaSessao(addCompost({ thought: thought.trim(), reps, secs: Math.round(secs) }));
      setPeso(null);
      // A prática inteira devolvia uma vibração leve a cada repetição e depois
      // terminava no silêncio: dez batidinhas construindo um crescendo sem
      // resolução. Esta é uma conclusão de verdade, das poucas que o app tem.
      toqueDeConclusao(data.settings.vibracao);
      setStep('done');
    },
  });

  /** Cada repetição que o app conta devolve uma vibração. */
  const ultimoTick = useRef(0);
  useEffect(() => {
    if (session.repTick === ultimoTick.current) return;
    ultimoTick.current = session.repTick;
    if (session.repTick > 0) toqueLeve(data.settings.vibracao);
  }, [session.repTick, data.settings.vibracao]);

  const começar = async () => {
    /*
      A pergunta da internet, antes da primeira Composta em voz alta.

      Só em aparelho que não reconhece fala sozinho, e só uma vez: a resposta
      fica guardada, e muda em Perfil › Privacidade. Vem antes de trocar de
      tela para a janela não abrir em cima da prática já rodando. Ver
      `licencaDeVoz`.
    */
    let licencaNova: boolean | undefined;
    if (modo === 'voz' && data.settings.vozForaDoAparelho === null && precisaDaLicencaDeVoz()) {
      licencaNova = await perguntarSobreAInternet();
      updateSettings({ vozForaDoAparelho: licencaNova ? 'permitida' : 'recusada' });
    }
    setStep('record');
    await session.start(modo, licencaNova);
  };

  const cancelar = () => {
    session.stop();
    /* Volta para o pensamento, não para a explicação: quem desiste no meio da
       gravação desiste da gravação, não da prática. A frase continua no campo. */
    setStep('thought');
  };

  const abrirJardim = () => {
    setJardimVeioDe(step);
    setStep('garden');
  };

  const compostarDeNovo = () => {
    setThought('');
    setStep('thought');
  };

  useBotaoVoltar(() => {
    if (step === 'record') {
      cancelar();
      return true;
    }
    if (step === 'thought') {
      voltarDoPensamento();
      return true;
    }
    if (step === 'garden') {
      setStep(jardimVeioDe);
      return true;
    }
    if (step === 'done') {
      onClose();
      return true;
    }
    return false;
  });

  const progresso = Math.min(1, session.secs / SEGUNDOS_DA_COMPOSTA);
  const restante = Math.max(0, Math.ceil(SEGUNDOS_DA_COMPOSTA - session.secs));
  const relógio = `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}`;

  /** O estágio do broto, para ele aparecer na paisagem como está de verdade. */
  const estágio = sproutStage(data);

  // --- Passo 1: o que é e por que funciona --------------------------------

  if (step === 'explain') {
    const alturaDaCena = ALTURA_DA_CENA.intro + recuo;

    const passos = [
      {
        n: '1',
        fundo: palette.slate100,
        icone: <NuvemDoPasso />,
        texto: 'Você escreve o pensamento que está te incomodando, em uma frase curta.',
      },
      {
        n: '2',
        fundo: palette.green100,
        icone: <MicrofoneDoPasso />,
        texto: 'Repete ele em voz alta, rápido, por 30 a 40 segundos, sem pausar.',
      },
      {
        n: '3',
        fundo: palette.amber100,
        icone: <IconeDaFlor tipo="papoula" tamanho={30} />,
        texto:
          'A frase vai desmanchando na tela a cada repetição, e cada repetição vira adubo para o seu broto.',
      },
    ];

    const cartão = (titulo: string, corpo: string, icone: React.ReactNode, enfeite: boolean) => (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 18,
          flexDirection: 'row',
          gap: 14,
          alignItems: 'flex-start',
          overflow: 'hidden',
          ...shadows.sm,
        }}
      >
        {/*
          O círculo âmbar que sai pelo canto. É o único enfeite gráfico de um
          cartão de texto em toda a ferramenta, e ele existe porque este cartão
          é o que explica **por que a prática funciona** — a única coisa na tela
          que a pessoa pode duvidar que seja verdade. Um cartão com cara de
          cartão a essa altura lê como aviso legal.
        */}
        {enfeite && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: palette.amber100,
              opacity: 0.7,
            }}
          />
        )}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: palette.amber100,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icone}
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text
            style={{
              fontFamily: fonts.body.extraBold,
              fontSize: 16,
              color: colors.textPrimary,
            }}
          >
            {titulo}
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 14.5,
              lineHeight: 14.5 * 1.55,
              color: palette.brown700,
            }}
          >
            {corpo}
          </Text>
        </View>
      </View>
    );

    return (
      <ScreenTransition transitionKey="explain" ordem={PASSOS_DA_COMPOSTA}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: POR_TRAS_DA_BARRA }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ height: alturaDaCena }}>
              <PaisagemDaComposta
                largura={largura}
                altura={alturaDaCena}
                crista={CRISTA.intro + recuo}
                recuo={recuo}
                /*
                  Noventa por cento de luz, e não cem: a intro é a promessa, não
                  a recompensa. O dourado cheio é da tela em que a flor nasce.
                */
                luz={0.9}
                flores={canteiroDaPratica(data.composts.length, 270)}
                broto={{ x: 272, escala: 1, humor: 'leve', estagio: estágio, pose: 'parado' }}
              />

              <CabecalhoNoCeu recuo={recuo}>
                <BotaoNoCeu rotulo="Voltar" aoTocar={onClose} />
                {/*
                  O mesmo nome do cartão que abre esta tela. Tocar numa coisa e
                  chegar noutra com outro nome faz a pessoa conferir se errou o
                  botão.
                */}
                <TituloNoCeu>Compostar pensamentos</TituloNoCeu>
              </CabecalhoNoCeu>

              {/*
                O selo do jardim, e ele só aparece quando há jardim.

                "Seu solo já tem 0 flores" na primeira vez seria o app abrindo
                com um placar zerado — e a intro é justamente a tela de quem
                nunca fez isto. Mesma decisão da sequência de dias na tela
                inicial, que fica escondida no dia zero.
              */}
              {data.composts.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Seu solo já tem ${data.composts.length} ${data.composts.length === 1 ? 'flor' : 'flores'}. Abrir o jardim.`}
                  onPress={abrirJardim}
                  style={({ pressed }) => ({
                    position: 'absolute',
                    left: 20,
                    top: recuo + 118,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 8,
                    paddingLeft: 8,
                    paddingRight: 10,
                    borderRadius: 12,
                    backgroundColor: PASTILHA_ESCURA,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: 'rgba(251,246,236,0.16)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <IconeDaFlor tipo="margarida" tamanho={22} />
                  </View>
                  <TextoNaPastilha>
                    {`Seu solo já tem ${data.composts.length} ${data.composts.length === 1 ? 'flor' : 'flores'}`}
                  </TextoNaPastilha>
                  <Icon name="chevronRight" size={14} color="#FBF6EC" strokeWidth={3} />
                </Pressable>
              )}

              {/*
                Nada mais sobre o céu além do selo.

                Havia aqui uma fala do broto — "me dá o pensamento, eu composto
                com você". Ela não está no documento, e o Pedro pediu para
                tirar. Ele tem razão pelo que a tela faz: esta é a cena de
                **abrir** a ferramenta, e o que ela precisa mostrar é o solo
                com as flores de quem já compostou. Um balão de fala em cima
                disso é uma segunda voz competindo com o título, com o selo e
                com os três passos logo abaixo — e o broto já diz o que tem a
                dizer durante a prática, que é onde a fala dele tem função.
              */}
            </View>

            <FolhaDaComposta style={{ paddingBottom: 36, gap: 22 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontFamily: fonts.display.extraBold,
                  fontSize: 27,
                  lineHeight: 27 * 1.18,
                }}
              >
                Um pensamento repetido em voz alta perde a força
              </Text>

              {/*
                A linha do tempo dos três passos.

                Eram três números num círculo verde de 26 pontos, iguais. Agora
                cada passo tem o **objeto** dele — a nuvem do pensamento, o
                microfone da voz, a flor do que sobra — e o número virou um selo
                pequeno no canto. A diferença é que assim os três passos contam
                a passagem céu → voz → terra antes de alguém ler uma palavra, e
                a linha pontilhada entre eles diz que é uma sequência e não uma
                lista de requisitos.
              */}
              <View>
                {passos.map((p, i) => (
                  <View key={p.n}>
                    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                      {/*
                        Duas camadas, e a de fora não corta nada.

                        O disco colorido recorta o que passa dele — é redondo, e
                        um ícone vazando por baixo da curva estragaria a forma.
                        Mas o selo numerado mora **fora** da borda, no canto de
                        cima à direita: posto dentro do disco que recorta, ele
                        simplesmente não aparecia. Foi o que aconteceu, e os
                        três passos ficaram sem número nenhum.
                      */}
                      <View style={{ width: 46, height: 46 }}>
                        <View
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 23,
                            backgroundColor: p.fundo,
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {p.icone}
                        </View>
                        <View
                          style={{
                            position: 'absolute',
                            right: -4,
                            top: -4,
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: palette.green500,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 2.5,
                            borderColor: colors.bg,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: fonts.body.extraBold,
                              fontSize: 11,
                              color: '#fff',
                            }}
                          >
                            {p.n}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: fonts.body.regular,
                          fontSize: 15.5,
                          lineHeight: 15.5 * 1.45,
                          color: colors.textPrimary,
                        }}
                      >
                        {p.texto}
                      </Text>
                    </View>
                    {i < 2 && <LinhaDoPasso cor={colors.border} />}
                  </View>
                ))}
              </View>

              {cartão(
                'Por que funciona',
                'Existe um fenômeno real chamado saciedade semântica: quando você repete uma palavra ou frase rápido e várias vezes, o cérebro para de processá-la como significado e passa a ouvi-la só como som. Na terapia ACT isso se chama defusão cognitiva.',
                <Lampada />,
                true,
              )}

            </FolhaDaComposta>
          </ScrollView>

          {/*
            O botão sai da rolagem e fica preso no rodapé: quem abriu a Composta
            para compostar não precisa rolar a explicação inteira para encontrar
            o que já tinha decidido fazer.
          */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 16 + ALTURA_ERGUIDA + POR_TRAS_DA_BARRA,
              backgroundColor: colors.bg,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Button variant="primary" style={{ width: '100%' }} onPress={irParaOPensamento}>
              Escolher o pensamento
            </Button>
          </View>
        </View>
      </ScreenTransition>
    );
  }

  // --- Passo 2: qual pensamento -------------------------------------------

  if (step === 'thought') {
    const alturaDaCena = ALTURA_DA_CENA.pensamento + recuo;
    const escrito = thought.trim();

    /* Onde a nuvem grande está — a frase é posicionada a partir dela. */
    const nuvem = caixaDaNuvemGrande(largura, recuo);

    return (
      <ScreenTransition transitionKey="thought" ordem={PASSOS_DA_COMPOSTA}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: POR_TRAS_DA_BARRA, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ height: alturaDaCena }}>
              {/*
                O céu de chumbo, a nuvem grande e a chuva.

                Esta é a única tela da ferramenta com `luz` 0, e é de propósito:
                é a tela do pensamento ainda inteiro. O sol existe atrás do
                cinza, a 15% — um céu sem nenhum sol seria um céu sem hora do
                dia, e o que esta tela diz é "está pesado agora", não "é noite".
              */}
              <PaisagemDaComposta
                largura={largura}
                altura={alturaDaCena}
                crista={CRISTA.pensamento + recuo}
                recuo={recuo}
                luz={0}
                nuvemGrande
                chuva
                naNuvemGrande={
                  /*
                    A frase escrita aparece **dentro da nuvem**.

                    É a melhor ideia do documento para esta tela, e vale dizer
                    por quê: ela põe o que a pessoa digitou no lugar de onde a
                    chuva cai. O pensamento deixa de ser texto num campo e passa
                    a ser a coisa que está fazendo chover em cima dela — que é
                    exatamente o que a prática vai desmanchar nos próximos
                    trinta e seis segundos.

                    Vazia, a nuvem mostra a sugestão em tom fraco: a nuvem nunca
                    fica vazia, porque uma nuvem vazia não explica nada.

                    Mora **dentro** da nuvem, e não por cima dela, para subir e
                    descer junto. A caixa é a mesma de antes — 28 de cada borda
                    da tela, 118 abaixo do recuo, 120 de altura —, só que
                    contada a partir da nuvem.
                  */
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: 28 - nuvem.left,
                      top: recuo + 118 - nuvem.top,
                      width: largura - 56,
                      height: 120,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 34,
                    }}
                  >
                    <Text
                      numberOfLines={3}
                      style={{
                        fontFamily: fonts.display.bold,
                        fontSize: 23,
                        lineHeight: 23 * 1.2,
                        textAlign: 'center',
                        color: escrito ? TEXTO_NA_PAISAGEM : palette.brown400,
                      }}
                    >
                      {`“${escrito || SUGESTOES[0]}”`}
                    </Text>
                  </View>
                }
              />

              <CabecalhoNoCeu recuo={recuo}>
                <BotaoNoCeu rotulo="Voltar" aoTocar={voltarDoPensamento} />
                <TituloNoCeu>O pensamento</TituloNoCeu>
              </CabecalhoNoCeu>

            </View>

            <FolhaDaComposta style={{ paddingBottom: 32, gap: 18, flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 16,
                  lineHeight: 16 * 1.45,
                  color: palette.brown700,
                }}
              >
                Uma frase curta, do jeito que ela aparece na sua cabeça.
              </Text>

              <Input value={thought} onChangeText={setThought} placeholder="vou ser demitido" />

              <View style={{ gap: 8 }}>
                <Text
                  style={{ fontFamily: fonts.body.bold, fontSize: 14, color: palette.brown700 }}
                >
                  Ou comece por um destes
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {SUGESTOES.map((s) => (
                    <Chip key={s} onPress={() => setThought(s)} selected={thought === s}>
                      {s}
                    </Chip>
                  ))}
                </View>
              </View>

              {/*
                Aqui havia um link "Como funciona, de novo".

                Ele existia para quem entrava direto nesta tela, sem passar
                pela explicação — e isso não acontece mais: a ferramenta abre
                sempre na primeira tela, e a seta de voltar deste cabeçalho já
                leva de volta a ela. Dois caminhos para o mesmo lugar, um deles
                sublinhado no meio do conteúdo, é ruído.
              */}

              {/*
                "Isto já passou por aqui", enquanto ela ainda está escrevendo.

                Dito antes, e não no fim, muda de função: deixa de ser um dado
                sobre o que acabou de acontecer e vira o reconhecimento de que
                aquela frase é recorrente — que é a razão de compostar de novo,
                e não um motivo para desistir. Segue o interruptor de análise.
              */}
              {!!voltou && (
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: radius.md,
                    backgroundColor: colors.primarySoft,
                  }}
                >
                  <Icon name="ampulheta" size={18} color={colors.primaryStrong} />
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: fonts.body.regular,
                      fontSize: 13,
                      lineHeight: 13 * 1.45,
                      color: palette.brown700,
                    }}
                  >
                    {voltou.quantas === 1
                      ? `Você já compostou algo parecido, em ${diaDe(voltou.quando)}.`
                      : `Algo parecido já passou por aqui ${voltou.quantas} vezes. A última em ${diaDe(voltou.quando)}.`}
                  </Text>
                </View>
              )}

              {/*
                A escolha do modo, e por que ela existe.

                O aviso que ficava aqui dizia "fale em um lugar onde você possa
                usar a voz" — o que não é conselho, é condição. Este app é usado
                na cama de madrugada, com alguém dormindo do lado, e no ônibus:
                nesses lugares a prática simplesmente não acontecia.

                Em silêncio ela perde força, e a tela diz isso sem enfeitar.
                Fraco acontecendo vale mais que forte que não acontece.
              */}
              <View style={{ gap: 10, marginTop: 4 }}>
                {(
                  [
                    {
                      modo: 'voz' as const,
                      icone: 'mic' as const,
                      titulo: 'Em voz alta',
                      texto: 'O broto ouve e conta sozinho. É assim que funciona melhor.',
                    },
                    {
                      modo: 'silencio' as const,
                      icone: 'som' as const,
                      titulo: 'Baixinho ou só no pensamento',
                      texto: 'Sem microfone. Você segura o botão enquanto repete.',
                    },
                  ]
                ).map((opcao) => {
                  const escolhida = modo === opcao.modo;
                  return (
                    <Pressable
                      key={opcao.modo}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: escolhida }}
                      accessibilityLabel={`${opcao.titulo}. ${opcao.texto}`}
                      onPress={() => setModo(opcao.modo)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        gap: 14,
                        alignItems: 'flex-start',
                        padding: 16,
                        borderRadius: 18,
                        borderWidth: 2,
                        borderColor: escolhida ? colors.primaryStrong : 'transparent',
                        backgroundColor: escolhida ? colors.primarySoft : colors.surface,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        ...shadows.sm,
                      })}
                    >
                      {/*
                        O ícone num disco branco, e não solto na linha: é o que
                        o separa do texto quando o cartão fica verde-claro ao
                        ser escolhido — ícone verde sobre verde desaparece.
                      */}
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 21,
                          backgroundColor: colors.surface,
                          alignItems: 'center',
                          justifyContent: 'center',
                          ...shadows.sm,
                        }}
                      >
                        <Icon name={opcao.icone} size={22} color={colors.primaryStrong} />
                      </View>
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text
                          style={{
                            fontFamily: fonts.body.extraBold,
                            fontSize: 16,
                            color: colors.textPrimary,
                          }}
                        >
                          {opcao.titulo}
                        </Text>
                        <Text
                          style={{
                            fontFamily: fonts.body.regular,
                            fontSize: 14,
                            lineHeight: 14 * 1.4,
                            color: palette.brown700,
                          }}
                        >
                          {opcao.texto}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/*
                O que o app faz com a voz, numa linha — e não num cartão.

                Havia um cartão sobre isso na tela anterior, e ele saiu: o
                Pedro pediu, e com razão, porque ali era mais um bloco de texto
                numa tela que já explica três passos. Mas o aviso em si não
                pode simplesmente sumir: daqui a um toque o app liga o
                microfone, e a pessoa vai repetir em voz alta a frase que mais
                dói. Ela tem o direito de saber, **antes**, que aquilo não é
                gravado nem enviado.

                Então ele vira uma linha, no lugar onde a escolha acontece, e
                aparece só para quem escolheu a voz — em silêncio o microfone
                nem é pedido.
              */}
              {modo === 'voz' && (
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 13,
                    lineHeight: 13 * 1.45,
                    color: colors.textSecondary,
                  }}
                >
                  O microfone fica ligado só para confirmar que você está vocalizando. O áudio não
                  é salvo nem enviado.
                </Text>
              )}

              <View style={{ flex: 1 }} />

              <Button
                variant="primary"
                style={{ width: '100%' }}
                disabled={thought.trim().length < 3}
                onPress={começar}
              >
                Começar a compostar
              </Button>

              {/* A tela em que a pessoa escreve o pensamento que mais dói. Se há
                  um lugar no app onde o caminho até ajuda precisa ser curto, é
                  este. */}
              <AjudaAgora aoFazerExercicio={aoFazerExercicio} />
            </FolhaDaComposta>
          </ScrollView>
        </View>
      </ScreenTransition>
    );
  }

  // --- Passo 3: compostando ------------------------------------------------

  if (step === 'record') {
    /*
      A crista, o balão e a frase saem de frações da tela, e não dos pontos do
      documento.

      Esta é a única tela da ferramenta que ocupa a altura inteira — as outras
      têm cena de altura fixa e folha embaixo. Os 660 pontos de crista do
      documento são 78% de uma tela de 844; num aparelho curto, 660 ficaria
      abaixo da borda de baixo e a terra não apareceria. A fração acompanha.
    */
    const crista = alturaDaTela * (CRISTA.rodando / ALTURA_DA_CENA.rodando);

    /*
      A fala é ancorada **no microfone**, por baixo — não na crista, por cima.

      ## O defeito, e as duas tentativas

      O balão ficava numa altura tirada da crista. Numa tela curta ele descia
      para dentro do bloco do microfone e sumia atrás dele: o microfone é
      desenhado depois na árvore, então ganha.

      A primeira correção foi um teto: subir o balão quando ele passasse do
      topo do rodapé. A conta do teto saía de `alturaDaTela`, e **foi aí que
      ela errou** — `useWindowDimensions` devolve a janela, e o conteúdo da
      tela mora num container menor que ela, descontado o recuo do alto.
      Medido numa tela de 667: a janela diz 667, o container tem 627. O teto
      ficava quarenta pontos baixo demais, o `Math.min` nunca mordia, e o
      balão continuava atrás do botão. Foi o que o Pedro viu de novo.

      ## Por que ancorar embaixo resolve de vez

      Porque o microfone também é ancorado embaixo, e os dois são irmãos no
      mesmo container. Medindo a fala a partir da mesma borda que posiciona o
      botão, a distância entre eles é uma subtração de constantes — não
      depende da altura de container nenhum, e não há como errar por quarenta
      pontos de recuo que este arquivo não enxerga.

      A medida sai parecida com a do documento, que põe a fala a 266 pontos
      acima do microfone numa tela de 844; aqui são 170 fixos, que é o que
      cabe na menor tela sem a fala invadir a frase que se desmancha.

      As alturas são escritas, e não medidas: `onLayout` não dispara no
      `react-native-web`, que é onde esta tela é conferida. O bloco é o
      microfone, o vão de seis e a pastilha do rótulo.
    */
    const fundoDoRodape = 30 + insets.bottom + POR_TRAS_DA_BARRA;
    const ALTURA_DO_RODAPE = LADO_DO_MICROFONE + 6 + 30;
    /** Onde o pé da fala fica, contado da borda de baixo. */
    const peDaFala = fundoDoRodape + ALTURA_DO_RODAPE + 12;

    /*
      Quem conta é o botão, e não o microfone.

      São dois caminhos que chegam ao mesmo lugar: a pessoa **escolheu**
      repetir baixinho, ou o aparelho não deu microfone nenhum. A tela se
      comporta igual nos dois — segurar conta — e só o rótulo embaixo do botão
      diz qual dos dois é, porque "sem microfone" é informação e "baixinho" é
      escolha.
    */
    const contaNoDedo = modo === 'silencio' || session.manual;
    const ativo = contaNoDedo ? segurando : !session.pausado;

    const dica =
      contaNoDedo
        ? segurando
          ? 'Continue repetindo...'
          : 'Segure o botão e repita a frase'
        : session.pausado
          ? 'Pausado'
          : session.silent
            ? 'Volte a repetir a frase'
            : 'Repita em voz alta, rápido, sem pausar';

    const rotuloDoMicrofone =
      contaNoDedo
        ? segurando
          ? 'Repetindo...'
          : 'Segure enquanto repete'
        : session.pausado
          ? 'Pausado · toque para continuar'
          : 'Ouvindo · toque para pausar';

    return (
      <ScreenTransition transitionKey="record" ordem={PASSOS_DA_COMPOSTA}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <PaisagemDaComposta
            largura={largura}
            altura={alturaDaTela}
            crista={crista}
            recuo={recuo}
            /*
              A luz é o cronômetro. Ela sobe de 0 a 1 ao longo dos trinta e seis
              segundos de voz — o céu abrindo **é** a barra de progresso desta
              tela, e é por isso que não há barra nenhuma.
            */
            luz={progresso}
            flores={canteiroDaPratica(data.composts.length, 300).map((f) => ({
              ...f,
              escala: f.escala * 0.8,
            }))}
            broto={{
              x: 300,
              escala: 0.95,
              humor: session.reps > 8 ? 'feliz' : 'leve',
              estagio: estágio,
              pose: session.reps > 8 ? 'comemora' : 'parado',
            }}
          />

          <CabecalhoNoCeu recuo={recuo}>
            <PastilhaNoCeu>
              <Text
                style={{
                  fontFamily: fonts.body.extraBold,
                  fontSize: 14,
                  color: TEXTO_NA_PAISAGEM,
                }}
              >
                {`${session.reps} ${session.reps === 1 ? 'repetição' : 'repetições'}`}
              </Text>
            </PastilhaNoCeu>
            <PastilhaNoCeu fraca>
              <Text
                style={{
                  fontFamily: fonts.body.extraBold,
                  fontSize: 14,
                  color: TEXTO_NA_PAISAGEM_FRACO,
                }}
              >
                {relógio}
              </Text>
            </PastilhaNoCeu>
            <View style={{ flex: 1 }} />
            <BotaoNoCeu icone="close" rotulo="Fechar" aoTocar={cancelar} />
          </CabecalhoNoCeu>

          <Text
            style={{
              position: 'absolute',
              top: recuo + 116,
              left: 24,
              right: 24,
              textAlign: 'center',
              fontFamily: fonts.body.extraBold,
              fontSize: 14.5,
              color: TEXTO_NA_PAISAGEM_FRACO,
            }}
          >
            {dica}
          </Text>

          {/*
            O aparelho não conferiu a frase e voltou a contar só pelo som.
            Calar sobre isso faria a tela ficar idêntica à de quem tem a
            conferência — e qualquer barulho passaria a contar, que é
            exatamente a queixa que originou este trabalho todo.

            Mora **no céu**, logo abaixo da instrução, e não mais no rodapé.
            Lá embaixo ele tinha dois defeitos que o Pedro viu no iPhone X —
            que é justamente o aparelho que sempre mostra este aviso, porque
            não reconhece fala sem servidor. O texto, feito para o céu, ficava
            em cima da terra e sumia nela. E as duas linhas dele cresciam o
            rodapé para cima: o microfone subia por cima do balão do broto,
            que é posicionado por uma conta (`peDaFala`) que não sabia dele.
          */}
          {/*
            E quando a frase está sendo conferida pela internet, a tela diz.
            A pessoa deu a licença uma vez, talvez semanas antes; ela merece
            saber, a cada prática, quando a voz dela está saindo do aparelho.
          */}
          {session.running && session.porFrase && session.naInternet && (
            <Text
              style={{
                position: 'absolute',
                top: recuo + 142,
                left: 40,
                right: 40,
                textAlign: 'center',
                fontFamily: fonts.body.regular,
                fontSize: 12,
                lineHeight: 12 * 1.45,
                color: TEXTO_NA_PAISAGEM_FRACO,
              }}
            >
              {`Conferindo a frase pelo reconhecimento de fala ${SERVICO_DE_VOZ}.`}
            </Text>
          )}
          {session.running && !session.porFrase && !session.manual && (
            <Text
              style={{
                position: 'absolute',
                top: recuo + 142,
                left: 40,
                right: 40,
                textAlign: 'center',
                fontFamily: fonts.body.regular,
                fontSize: 12,
                lineHeight: 12 * 1.45,
                color: TEXTO_NA_PAISAGEM_FRACO,
              }}
            >
              Este aparelho não confere a frase — estou contando pelo som da sua voz. Procure um
              lugar quieto.
            </Text>
          )}

          <FraseSeDesmanchando
            frase={thought.trim() || SUGESTOES[0]}
            repeticoes={session.reps}
            parado={parado}
            topo={recuo + 190}
            altura={alturaDaTela * 0.3}
          />

          {/*
            A fala dele, encostada nele.

            Duas coisas estavam erradas e se somavam. A primeira é a coluna: o
            documento põe o balão em x 120, e eu pus em 24 — com o broto
            plantado em 300, o bico do balão apontava para noventa pontos de
            céu vazio. Um balão de fala cujo bico não encosta em ninguém lê
            como caixa solta, não como alguém falando.

            A segunda é a largura. O corpo do balão é `flex: 1` dentro de uma
            linha; com `maxWidth` e sem largura, a linha encolhe até o conteúdo
            e o `flex: 1` resolve contra uma base indefinida — o texto saía
            espremido em coluna, uma palavra por linha. Com largura definida a
            conta tem contra o que ser feita.

            As duas medidas são as do documento, na régua dele: 120 e 160,
            reescaladas para a largura da tela.
          */}
          <BalaoDoBroto
            lado="direita"
            tom="noCeu"
            apareceEm={session.reps === 0 ? 0 : session.reps < 5 ? 1 : session.reps < 9 ? 2 : 3}
            style={{
              position: 'absolute',
              left: (largura * 120) / 390,
              bottom: peDaFala,
              width: (largura * 168) / 390,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 14.5,
                lineHeight: 14.5 * 1.35,
                color: TEXTO_NA_PAISAGEM,
              }}
            >
              {falaDoBrotoNaComposta(session.reps)}
            </Text>
          </BalaoDoBroto>

          {/*
            O microfone, e o que cada modo faz com ele.

            Em voz alta o toque alterna pausa: o aparelho está ouvindo, e parar
            de ouvir tem de ser uma coisa que a pessoa pode pedir a qualquer
            momento — ela está falando sozinha em voz alta sobre o que mais dói,
            e alguém pode entrar no quarto. Em silêncio é segurar: o botão é o
            contador, porque não há microfone nenhum para contar.

            O recuo de quem não tem permissão nem medidor (`session.manual` no
            modo voz) também cai no segurar, e o rótulo diz por quê.
          */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 30 + insets.bottom + POR_TRAS_DA_BARRA,
              alignItems: 'center',
              gap: 6,
            }}
          >
            {contaNoDedo ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Segurar e repetir"
                onPressIn={() => {
                  setSegurando(true);
                  session.holdOn();
                }}
                onPressOut={() => {
                  setSegurando(false);
                  session.holdOff();
                }}
                style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.96 : 1 }] })}
              >
                <MicrofoneDaComposta ativo={ativo} fracao={progresso} />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={session.pausado ? 'Continuar' : 'Pausar'}
                onPress={() => {
                  if (session.pausado) void session.retomar(modo);
                  else session.pausar();
                }}
                style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.96 : 1 }] })}
              >
                <MicrofoneDaComposta ativo={ativo} fracao={progresso} />
              </Pressable>
            )}

            <PastilhaEscura>
              <TextoNaPastilha>
                {session.manual && modo === 'voz'
                  ? 'Sem microfone · segure e repita'
                  : rotuloDoMicrofone}
              </TextoNaPastilha>
            </PastilhaEscura>

          </View>
        </View>
      </ScreenTransition>
    );
  }

  // --- Passo 5: o jardim ---------------------------------------------------

  if (step === 'garden') {
    return (
      <ScreenTransition transitionKey="garden" ordem={PASSOS_DA_COMPOSTA}>
        <JardimDaComposta onClose={() => setStep(jardimVeioDe)} aoCompostar={compostarDeNovo} />
      </ScreenTransition>
    );
  }

  // --- Passo 4: virou flor -------------------------------------------------

  const alturaDaCena = ALTURA_DA_CENA.flor + recuo;
  const florNova = florDoIndice(floresAntes.current);
  const totalDeFlores = floresAntes.current + 1;

  const opcoesDePeso = [
    { chave: 'menos' as const, rotulo: 'Mais leve' },
    { chave: 'igual' as const, rotulo: 'Igual' },
    { chave: 'mais' as const, rotulo: 'Mais pesado' },
  ];

  return (
    <ScreenTransition transitionKey="done" ordem={PASSOS_DA_COMPOSTA}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: POR_TRAS_DA_BARRA, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: alturaDaCena }}>
            {/*
              O fim da prática, encenado.

              O céu está dourado e os raios giram — cinquenta segundos por
              volta, devagar o bastante para ninguém notar como animação. O
              canteiro aparece com as flores de **antes**, e a nova nasce na
              frente de todas: a terra espirra, a flor cresce com repique, o
              halo acende e cinco brilhos piscam. Ver `FlorNascendo`, na
              paisagem, que conta por que a ordem é essa.
            */}
            <PaisagemDaComposta
              largura={largura}
              altura={alturaDaCena}
              crista={CRISTA.flor + recuo}
              recuo={recuo}
              luz={1}
              raios
              flores={canteiroDaPratica(floresAntes.current, 150).map((f) => ({
                ...f,
                escala: f.escala * 0.85,
                dy: f.dy - 6,
              }))}
              florNova={{ indice: floresAntes.current, x: 150 }}
              broto={{
                x: 290,
                escala: 1.05,
                humor: 'feliz',
                estagio: estágio,
                pose: 'comemora',
              }}
            />

            <BalaoDoBroto
              lado="direita"
              tom="noCeu"
              style={{
                position: 'absolute',
                left: 24,
                top: recuo + 120,
                /* Largura definida, e não `maxWidth`: ver a nota do balão da
                   tela da prática, que conta por que o corpo se espremia. */
                width: (largura * 150) / 390,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.body.bold,
                  fontSize: 14.5,
                  lineHeight: 14.5 * 1.35,
                  color: TEXTO_NA_PAISAGEM,
                }}
              >
                Seu adubo virou flor!
              </Text>
            </BalaoDoBroto>
          </View>

          <FolhaDaComposta style={{ paddingBottom: 36, gap: 18, flex: 1 }}>
            <View style={{ gap: 6, alignItems: 'center' }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontFamily: fonts.display.extraBold,
                  fontSize: 30,
                  lineHeight: 30 * 1.15,
                  textAlign: 'center',
                }}
              >
                Virou flor
              </Text>
              <Text
                style={{
                  maxWidth: 320,
                  fontFamily: fonts.body.regular,
                  fontSize: 16,
                  lineHeight: 16 * 1.5,
                  color: palette.brown700,
                  textAlign: 'center',
                }}
              >
                {`“${thought.trim() || SUGESTOES[0]}” foi repetido ${result.reps} ${result.reps === 1 ? 'vez' : 'vezes'}. Ele ainda pode voltar, e tudo bem. Agora você sabe que é só um pensamento.`}
              </Text>
            </View>

            {/* Reconhecer o pensamento que volta é a coisa mais inteligente que
                o app pode dizer aqui. A comparação roda no aparelho, por
                palavras em comum. Sem julgamento e sem alarme: só o fato. */}
            {jaVoltou > 1 && (
              <Text
                style={{
                  fontFamily: fonts.body.bold,
                  fontSize: 15,
                  lineHeight: 15 * 1.5,
                  color: colors.primaryStrong,
                  textAlign: 'center',
                }}
              >
                Esse pensamento já voltou {jaVoltou} vezes. Reparar nisso também é cuidado.
              </Text>
            )}

            {/* Nova no seu jardim. */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                overflow: 'hidden',
                ...shadows.sm,
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  right: -30,
                  top: -30,
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  backgroundColor: palette.amber100,
                  opacity: 0.7,
                }}
              />
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  backgroundColor: palette.amber100,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  overflow: 'hidden',
                }}
              >
                <IconeDaFlor tipo={florNova.chave} tamanho={46} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    fontFamily: fonts.body.extraBold,
                    fontSize: 12,
                    letterSpacing: 0.96,
                    textTransform: 'uppercase',
                    color: colors.primaryStrong,
                  }}
                >
                  Nova no seu jardim
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.display.bold,
                    fontSize: 19,
                    color: colors.textPrimary,
                  }}
                >
                  {florNova.nome}
                </Text>
                <Text
                  style={{ fontFamily: fonts.body.regular, fontSize: 13.5, color: palette.brown400 }}
                >
                  {`Seu solo já tem ${totalDeFlores} ${totalDeFlores === 1 ? 'flor' : 'flores'}`}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver jardim"
                onPress={abrirJardim}
                style={({ pressed }) => ({
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: palette.green100,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <Text
                  style={{
                    fontFamily: fonts.body.extraBold,
                    fontSize: 14,
                    color: colors.primaryStrong,
                  }}
                >
                  Ver jardim
                </Text>
              </Pressable>
            </View>

            {/*
              Quanto ele pesa agora.

              É a pergunta do documento, e ela é diferente da repesagem que o
              app faz uma semana depois: esta é "e agora?", aquela é "e ainda?".
              Por isso a resposta vai para um campo próprio — ver
              `Compost.pesoNaHora`, que conta o que aconteceria se as duas
              dividissem o mesmo.

              Responder não é obrigatório, e não há botão de pular: quem não
              responde desce e vai embora, e o jardim mostra "sem registro".
            */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 16,
                gap: 12,
                ...shadows.sm,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.body.extraBold,
                  fontSize: 15,
                  color: colors.textPrimary,
                }}
              >
                Quanto ele pesa agora?
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {opcoesDePeso.map((o) => {
                  const escolhida = peso === o.chave;
                  return (
                    <Pressable
                      key={o.chave}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: escolhida }}
                      accessibilityLabel={o.rotulo}
                      onPress={() => {
                        setPeso(o.chave);
                        if (idDaSessao) pesarAgora(idDaSessao, o.chave);
                        if (o.chave === 'menos') pedirAvaliacaoSePuder();
                      }}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: escolhida ? colors.primaryStrong : colors.border,
                        backgroundColor: escolhida ? colors.primarySoft : colors.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.body.bold,
                          fontSize: 14,
                          color: colors.textPrimary,
                        }}
                      >
                        {o.rotulo}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ flex: 1 }} />

            <View style={{ gap: 10 }}>
              {/*
                Escrever sobre o que sobrou.

                Não está no documento, e fica. É logo depois de repetir vinte
                vezes o que mais dói que costuma aparecer alguma coisa para
                dizer — e o diário estava a três toques dali, com a pessoa tendo
                de lembrar sozinha o que ia escrever. A pergunta de partida já
                vem escrita, como nas práticas.
              */}
              {!!aoEscreverNoDiario && (
                <Button
                  variant="secondary"
                  style={{ width: '100%' }}
                  onPress={() => aoEscreverNoDiario('O que ficou depois de compostar isso?')}
                >
                  Escrever sobre isso
                </Button>
              )}
              <Button variant="primary" style={{ width: '100%' }} onPress={onClose}>
                Voltar ao início
              </Button>
              <Button variant="ghost" style={{ width: '100%' }} onPress={compostarDeNovo}>
                Compostar outro pensamento
              </Button>
            </View>
          </FolhaDaComposta>
        </ScrollView>
      </View>
    </ScreenTransition>
  );
}

/**
 * A frase se desmanchando, letra por letra.
 *
 * ## O que acontece na tela
 *
 * Cada caractere afunda em direção ao solo, girando um pouco, e some num
 * momento próprio: a letra 7 começa a cair na terceira repetição, a 12 na
 * oitava. O momento sai do índice por `sin` — determinístico de propósito, para
 * a letra não pular para um lugar novo a cada redesenho. Ver `curvaDaLetra`.
 *
 * ## Um relógio, e não um por letra
 *
 * O componente mantém **um** `Animated.Value` que segue o contador de
 * repetições, e cada letra lê a reta dela por `interpolate`. Quando uma
 * repetição é contada, esse valor anda em 1,4 s com a curva do documento, e as
 * vinte letras andam juntas no driver nativo — nenhum render de React no meio.
 *
 * Isto é a correção de um defeito de antes: a frase se desmanchava por
 * **palavra**, com a tela recalculando as posições a cada repetição. Palavra
 * inteira descendo lê como alguém apagando a frase; o que a prática faz é a
 * frase perder a estrutura, e para isso o que tem de se soltar é a letra.
 */
function FraseSeDesmanchando({
  frase,
  repeticoes,
  parado,
  topo,
  altura,
}: {
  frase: string;
  repeticoes: number;
  parado: boolean;
  topo: number;
  altura: number;
}) {
  const andado = useRef(new Animated.Value(repeticoes)).current;

  useEffect(() => {
    if (parado) {
      andado.setValue(repeticoes);
      return;
    }
    const t = Animated.timing(andado, {
      toValue: repeticoes,
      duration: 1400,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
      isInteraction: false,
    });
    t.start();
    return () => t.stop();
  }, [repeticoes, parado, andado]);

  /**
   * A frase quebrada em palavras, cada palavra com os índices das letras dela.
   *
   * Letra por letra numa linha que quebra, a frase quebrava **no meio da
   * palavra**: "vou ser demitid" numa linha e "o" na outra. Cada caractere é
   * uma caixa própria, e o layout não tem como saber onde uma palavra acaba.
   *
   * Então quem quebra é a palavra, e as letras dela ficam numa linha que não
   * quebra. O índice continua sendo o da frase inteira — é dele que sai o
   * momento em que cada letra cai, e renumerar por palavra mudaria a queda.
   */
  const palavras = useMemo(() => {
    const saida: { texto: string; primeiro: number }[] = [];
    let i = 0;
    for (const pedaco of frase.split(' ')) {
      saida.push({ texto: pedaco, primeiro: i });
      /* +1 pelo espaço que separa esta palavra da seguinte. */
      i += pedaco.length + 1;
    }
    return saida;
  }, [frase]);

  const desfoque = desfoqueDaFrase(repeticoes);

  const letra = (caractere: string, indice: number) => {
    const { comeca, termina, destino } = curvaDaLetra(indice);
    /*
      Quatro pontos bastam: a reta é parada, anda, e para. O último ponto é bem
      além do fim para a letra ficar onde parou se o contador passar do
      previsto — e ele passa, porque quem conta é o aparelho ouvindo.
    */
    const entrada = [0, comeca, termina, REPS_PARA_SUMIR * 8];
    const ate = (fim: number) => ({ inputRange: entrada, outputRange: [0, 0, fim, fim] });
    return (
      <Animated.Text
        key={`${caractere}-${indice}`}
        style={{
          fontFamily: fonts.display.extraBold,
          fontSize: 42,
          lineHeight: 42 * 1.2,
          color: TEXTO_NA_PAISAGEM,
          textShadowColor: 'rgba(255,255,255,0.35)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 0,
          /*
            Sem desfoque no iPhone.

            O React Native não sabe desfocar no iOS: para qualquer `filter` ele
            põe uma camada branca por cima da peça, que deveria se misturar em
            modo multiplicar — e o iOS ignora esse modo de mistura. O resultado
            era uma caixa branca sólida em cada letra, a partir da repetição em
            que o desfoque começa: o Pedro viu "uma caixa de texto branca"
            atrás da frase. Lá a letra cai, gira e some sem desfocar; no
            Android e na web o desfoque continua.
          */
          filter:
            desfoque > 0 && Platform.OS !== 'ios' ? `blur(${desfoque}px)` : undefined,
          opacity: andado.interpolate({
            inputRange: entrada,
            outputRange: [1, 1, destino.opacidade, destino.opacidade],
          }),
          transform: [
            { translateX: andado.interpolate(ate(destino.dx)) },
            { translateY: andado.interpolate(ate(destino.dy)) },
            {
              rotate: andado.interpolate({
                inputRange: entrada,
                outputRange: ['0deg', '0deg', `${destino.giro}deg`, `${destino.giro}deg`],
              }),
            },
          ],
        }}
      >
        {caractere}
      </Animated.Text>
    );
  };

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: topo,
        left: 24,
        right: 24,
        height: altura,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {palavras.map((palavra, n) => (
          <View key={palavra.primeiro} style={{ flexDirection: 'row' }}>
            {palavra.texto.split('').map((c, j) => letra(c, palavra.primeiro + j))}
            {/* O espaço entre palavras: ele também cai, com a letra que o
                precede, senão a frase se desmancha e o vão fica. */}
            {n < palavras.length - 1 && letra(' ', palavra.primeiro + palavra.texto.length)}
          </View>
        ))}
      </View>
    </View>
  );
}

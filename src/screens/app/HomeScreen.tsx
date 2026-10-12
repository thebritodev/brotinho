import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BannerDoHumor,
  BoasVindas,
  CabecalhoDaHome,
  CartaoDaComposta,
  CartaoDaFrase,
  ChuvaDeFarelos,
  FaixaDaSemana,
  FeitasRecentemente,
  FundoDaTela,
  GradeDeTemas,
  HarvestNotice,
  QuandoDescoberta,
  ResumoDaSemana,
  TexturaDaHome,
  VoltaCard,
  useCompartilharFrase,
  type ChuvaDeFarelosRef,
} from '../../components';
import { POR_TRAS_DA_BARRA } from '../../components/navigation/BottomNav';
import { conselhoDoDia } from '../../data/conselhos';
import { escolhasApos, especieValida, type EspecieKey } from '../../data/especies';

/**
 * O identificador do atalho de desenvolvimento, para as capturas o esconderem.
 *
 * Exportado para `capturas.js` poder usar o mesmo nome dos dois lados — ver o
 * comentário no próprio botão.
 */
export const ATALHO_DE_DEV = 'atalho-de-dev';
import { ehNoite, horaDaCena } from '../../data/falasDoBroto';
import { TITULO_DO_DIA } from '../../data/humores';
import { ANCORA_RAPIDA, PRACTICE_TOPICS } from '../../data/practices';
import { toqueLeve } from '../../services/toque';
import { useFotoDePerfil } from './useFotoDePerfil';
import { useAppState } from '../../state/AppStateProvider';
import type { Plant } from '../../state/types';
import {
  AUSENCIA_LONGA,
  colheita,
  dayKey,
  diasSemAparecer,
  feitasRecentemente,
  moodWeek,
  praticasRecentes,
  prontoParaColher,
  resumoDaSemana,
  semanaDePraticas,
  sequenciaAtual,
  sproutStage,
  type PraticaVisitada,
} from '../../state/derived';
import { fonts, useTema } from '../../theme';

/**
 * A tela inicial.
 *
 * ## A ordem, e a pergunta que cada bloco responde
 *
 * 1. **Quem é você, e como vai** — o retrato, a saudação e a sequência.
 * 2. **A semana** — sete discos: onde você praticou.
 * 3. **O humor** — a porta para contar como está hoje.
 * 4. **A Composta** — a única oferta grande, e o mecanismo único do app.
 * 5. **A frase de hoje** — o canteiro, e o que está enterrado nele.
 * 6. **Feitas recentemente** — o caminho de volta.
 * 7. **Resumo da semana** — o que o app viu.
 * 8. **Todas as práticas** — treze temas em grade.
 *
 * Os quatro primeiros cabem na primeira dobra de um celular comum, e é essa a
 * diferença em relação à versão anterior. Ali a Composta era uma faixa que
 * ocupava a tela inteira: a tela abria bonita e **muda** — a semana, o humor e
 * as práticas começavam todos abaixo da dobra. Uma tela inicial que responde
 * "o que eu faço agora?" não pode gastar a primeira dobra com uma resposta só.
 *
 * ## O que está aqui e não aparece
 *
 * As comemorações. A colheita e as boas-vindas moram nesta tela, e não na aba
 * do broto, porque esta é a tela que abre: uma planta madura que espera a
 * pessoa trocar de aba para ser colhida não seria colhida.
 *
 * ## O humor voltou, e não voltou como pergunta
 *
 * A regra antiga — *uma pergunta, um lugar* — continua valendo: quem responde
 * é a aba do broto. O que existe aqui é a porta e o eco. Ver `BannerDoHumor`.
 */

/**
 * As práticas de estreia, para quem ainda não fez nenhuma.
 *
 * A fileira de recentes sumiria sem histórico — e sem histórico é a maior parte
 * das pessoas na primeira semana. Em vez de sumir, ela troca de assunto: as
 * mesmas vagas, preenchidas com práticas em vez de lembranças.
 *
 * ## Como estas foram escolhidas
 *
 * Nenhuma delas é "a melhor" do repertório: são **as que pedem menos**.
 * Primeira prática ruim é primeira prática longa — todas cabem em três minutos,
 * nenhuma precisa de voz, de preparo ou de lugar reservado.
 *
 * E são de quatro temas diferentes, o que faz a fileira mostrar de saída que o
 * app não é só sobre ansiedade: tem coisa para adiar, para tensão no corpo e
 * para reparar no que foi bom. Quatro cores diferentes na fileira dizem isso
 * antes de qualquer texto.
 *
 * O aterramento abre a fila por ser a mesma que o app oferece como saída de
 * emergência (`ANCORA_RAPIDA`) — a que vale a pena conhecer antes de precisar.
 */
const PARA_COMECAR: PraticaVisitada[] = [
  { topico: ANCORA_RAPIDA.topico, pratica: ANCORA_RAPIDA.pratica },
  { topico: 'procrastinacao', pratica: 'dois-minutos' },
  { topico: 'estresse', pratica: 'ombros' },
  { topico: 'gratidao', pratica: 'saboreio-de-dois-minutos' },
  { topico: 'solidao', pratica: 'mensagem-de-um-minuto' },
];

type Props = {
  name: string;
  onOpenComposta: () => void;
  onOpenPractices: (alvo?: { topico: string; pratica: string }) => void;
  onOpenConselhosGuardados: () => void;
  /** A aba do broto: o retrato e o banner do humor levam para lá. */
  onOpenBroto: () => void;
  onOpenDiario: () => void;
  /** O resumo para a terapia, atrás do "Ver tudo". */
  onOpenResumo: () => void;
  onOpenGarden: () => void;
  /** Altura em que a tela abre, guardada fora dela — ver `MainTabs`. */
  rolagemInicial?: number;
  /** Sobe de um a cada toque na aba já aberta: o pedido de voltar ao topo. */
  aoTopo?: number;
  aoRolar?: (y: number) => void;
};

/**
 * Onde a tela deixa de ser "o alto" e vira lista.
 *
 * Abaixo disto, as cenas param de se mexer: a Composta para de deixar as
 * palavras caírem e as treze cenas da grade congelam. É a mesma guarda que a
 * faixa tinha, pelo mesmo motivo — o laço roda na tela que abre o app, e não
 * pode rodar à toa enquanto a pessoa lê a grade oitocentos pontos abaixo.
 *
 * É um número, e não uma medida: medir pediria `onLayout`, que **não dispara
 * no react-native-web** — ver `CartaoHeroi`. Errar para mais custa um laço
 * rodando um pouco além da conta; medir errado custaria a animação parada no
 * navegador, que é onde eu confiro.
 */
const ALTO_DA_TELA = 620;

export function HomeScreen({
  name,
  onOpenComposta,
  onOpenPractices,
  onOpenConselhosGuardados,
  onOpenBroto,
  onOpenDiario,
  onOpenResumo,
  onOpenGarden,
  rolagemInicial = 0,
  aoTopo = 0,
  aoRolar,
}: Props) {
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  /** A largura da tela, com piso: no primeiro quadro ela vem zerada. */
  const largura = Math.max(320, width);
  /** A margem lateral da rolagem, e a largura que sobra para os cartões. */
  const MARGEM = 20;
  const larguraUtil = largura - MARGEM * 2;

  const {
    data,
    marcarVisto,
    colherPlanta,
    desenterrarConselho,
    guardarConselho,
  } = useAppState();

  const hoje = dayKey();
  const registroDeHoje = data.moodHistory.find((m) => m.date === hoje);
  const humorMarcado = registroDeHoje?.mood ?? null;

  const stage = sproutStage(data);
  const nomeDoBroto = data.profile.nomeDoBroto.trim() || 'Brotinho';

  /* O retrato do cabeçalho: a foto dela, ou o broto. Ver `useFotoDePerfil`. */
  const retrato = useFotoDePerfil();

  /**
   * Quem sumiu por dias vê o reencontro antes de qualquer outra coisa. Some
   * sozinho no instante em que ela registra algo — sem estado guardado.
   */
  const ausente = diasSemAparecer(data);
  const voltando = ausente !== null && ausente >= AUSENCIA_LONGA;

  /** Quantos exercícios existem ao todo — contados, nunca escritos à mão. */
  const quantasPraticas = useMemo(
    () => PRACTICE_TOPICS.reduce((total, t) => total + t.practices.length, 0),
    [],
  );

  /*
    As contas da semana: a fita de práticas, a fita de humor e os três números.

    As três saem da **mesma** janela — domingo a hoje — e isso não é detalhe de
    implementação: são três fitas de sete colunas na mesma tela, e janelas
    diferentes fariam delas três semanas diferentes chamadas de semana. Ver
    `resumoDaSemana`.
  */
  const semana = useMemo(() => semanaDePraticas(data), [data]);
  const humorDaSemana = useMemo(() => moodWeek(data), [data]);
  const resumo = useMemo(() => resumoDaSemana(data), [data]);
  const sequencia = useMemo(() => sequenciaAtual(data), [data]);

  /* O que ela fez por último: práticas, diários e compostas, juntos. */
  const recentes = useMemo(() => feitasRecentemente(data), [data]);
  const temHistorico = useMemo(() => praticasRecentes(data).length > 0, [data]);

  /*
    A hora do relógio dela, que decide o céu e a pose.

    A mesma conta da aba do broto, e de propósito: as duas telas mostram o
    mesmo personagem no mesmo instante, e não podem discordar sobre se é dia.
  */
  const agora = new Date();
  const ehDeNoite = ehNoite(agora);
  const poseDaHora =
    horaDaCena(agora) === 'manha' ? 'espreguica' : ehDeNoite ? 'dorme' : 'parado';

  /*
    O broto do cartão da Composta responde ao toque trocando de pose.

    Sem balão de fala: o documento tira o balão daqui, e com razão — num cartão
    de 250 de altura ele comeria o céu por onde as palavras caem. O que sobra é
    o personagem reagindo com o corpo. Ver `CartaoDaComposta`.
  */
  const POSES_DO_TOQUE = ['acena', 'espreguica', 'pensa', 'comemora'] as const;
  const [toques, setToques] = useState(0);
  const poseDoBroto = toques === 0 ? poseDaHora : POSES_DO_TOQUE[toques % POSES_DO_TOQUE.length];

  const tituloDoDia = humorMarcado
    ? TITULO_DO_DIA[humorMarcado]
    : 'Vamos cuidar de você hoje?';

  /*
    A frase de hoje, e se ela já foi desenterrada. `conselhoDoDia` é pura e
    escolhe a que faz mais tempo que não aparece; o que fixa a escolha do dia é
    o histórico, gravado no toque.
  */
  const conselho = useMemo(
    () => conselhoDoDia({ vistos: data.conselhos, hoje }),
    [data.conselhos, hoje],
  );
  const conselhoAberto = data.conselhos.some((c) => c.date === hoje);
  const story = useCompartilharFrase();

  /**
   * A altura em que esta tela abre — congelada no instante da montagem.
   *
   * `rolagemInicial` chega de uma `ref` lá do `MainTabs` e muda conforme a
   * pessoa rola. Lida a cada render, ela viraria um `contentOffset` novo a cada
   * vez, e o Android reagiria a isso rolando: a tela puxaria o tapete de quem
   * está lendo.
   */
  const alturaInicial = useRef(rolagemInicial).current;
  const rolagem = useRef<ScrollView>(null);
  /** A camada por onde a terra do buraco da Frase do dia cai. */
  const chuva = useRef<ChuvaDeFarelosRef>(null);
  const jaRestaurou = useRef(false);

  /**
   * O alto da tela está à vista? Fora dele, os laços param.
   *
   * O `setState` só acontece quando a resposta **muda** — duas vezes por
   * rolagem, e não a cada evento. Sem essa guarda, um `onScroll` a cada 64 ms
   * viraria quinze renders por segundo desta tela inteira, que é o oposto do
   * que economizar quadro significa.
   */
  const [naVista, setNaVista] = useState(rolagemInicial < ALTO_DA_TELA);

  /**
   * Planta madura: mostra o momento ANTES de guardar.
   *
   * Colher em silêncio fazia o broto de três semanas virar uma mudinha sem
   * explicação — lê como perda de dado, não como conquista.
   */
  const [colhendo, setColhendo] = useState<Plant | null>(null);

  useEffect(() => {
    if (prontoParaColher(data) && !colhendo) setColhendo(colheita(data));
  }, [data, colhendo]);


  /*
    O toque na aba em que já se está pede o topo de volta — ver `MainTabs`.

    Zero é a montagem e não rola nada: a tela abre na altura que ficou
    guardada, e rolar sozinha ao aparecer destruiria exatamente isso.
  */
  useEffect(() => {
    if (!aoTopo) return;
    rolagem.current?.scrollTo({ y: 0, animated: true });
  }, [aoTopo]);

  /**
   * Fecha o ciclo: guarda a planta e planta a espécie escolhida.
   *
   * As duas numa chamada só — ver `colherPlanta`. Depois leva ao jardim, que
   * é onde a planta recém-guardada está, ao lado das outras espécies.
   */
  const guardarNoJardim = (proxima: EspecieKey) => {
    if (colhendo) colherPlanta(colhendo, proxima);
    setColhendo(null);
    onOpenGarden();
  };

  const Titulo = ({ children }: { children: React.ReactNode }) => (
    <Text
      style={{ fontFamily: fonts.display.bold, fontSize: 21, color: colors.textPrimary }}
    >
      {children}
    </Text>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* A luz e a descida ficam atrás de tudo, inclusive da rolagem. */}
      <FundoDaTela />
      {/* E, por cima dela, as folhinhas e o sol do canto. Ver `TexturaDaHome`. */}
      <TexturaDaHome />

      <ScrollView
        ref={rolagem}
        /*
          A tela **monta** já na altura certa, em vez de montar no zero e
          corrigir depois — corrigir depois pisca um quadro do topo.
        */
        contentOffset={{ x: 0, y: alturaInicial }}
        scrollEventThrottle={64}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          aoRolar?.(y);
          const vendo = y < ALTO_DA_TELA;
          if (vendo !== naVista) setNaVista(vendo);
        }}
        /*
          Rede para quem ignorar o `contentOffset` — o `react-native-web`, que é
          o que gera as capturas da loja, é um deles.
        */
        onContentSizeChange={(_, altura) => {
          if (jaRestaurou.current || alturaInicial <= 0) return;
          if (altura <= alturaInicial) return;
          jaRestaurou.current = true;
          rolagem.current?.scrollTo({ y: alturaInicial, animated: false });
        }}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: MARGEM,
          paddingBottom: 32 + POR_TRAS_DA_BARRA,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <CabecalhoDaHome
          nome={name}
          linha={tituloDoDia}
          estagio={stage}
          sequencia={sequencia}
          foto={retrato.foto}
          aoTocarNoRetrato={() => {
            toqueLeve(data.settings.vibracao);
            void retrato.escolher();
          }}
        />

        {/*
          Só em desenvolvimento: força o fim do ciclo, para ver a escolha da
          próxima espécie sem esperar vinte e um dias.

          O app tem a mesma válvula para a cerimônia de crescimento — o
          toque-e-segura no broto da aba, também em `__DEV__`. Esta é visível
          em vez de escondida porque a outra existe há tempo e ninguém lembra
          onde fica; e `__DEV__` é apagado na build de produção pelo
          empacotador, então isto não chega a aparelho de ninguém.

          Cada toque colhe de novo: a planta entra no jardim com a espécie que
          era, um broto novo começa na espécie escolhida, e dá para empilhar
          várias para ver a prateleira de espécies se formar.
        */}
        {__DEV__ && (
          <Pressable
            /*
              O `nativeID` existe por causa das capturas da loja.

              Elas são tiradas da versão web, onde `__DEV__` é verdadeiro — e
              numa delas este botão apareceu no meio da tela inicial, a caminho
              da App Store. Com um identificador estável, `capturas.js` o
              esconde antes de fotografar, em vez de depender de procurar o
              texto "DEV ·" no documento.
            */
            nativeID={ATALHO_DE_DEV}
            accessibilityRole="button"
            accessibilityLabel="Forçar a colheita, só em desenvolvimento"
            onPress={() => setColhendo(colheita(data))}
            style={{
              alignSelf: 'flex-start',
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 999,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: palette.brown400,
            }}
          >
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 12.5, color: palette.brown400 }}
            >
              DEV · colher agora e escolher a próxima
            </Text>
          </Pressable>
        )}

        <FaixaDaSemana dias={semana} />

        <BannerDoHumor humor={humorMarcado} onPress={onOpenBroto} />

        {voltando && <VoltaCard dias={ausente} />}

        <CartaoDaComposta
          largura={larguraUtil}
          humor={humorMarcado}
          noite={ehDeNoite}
          estagio={stage}
          pose={poseDoBroto}
          aoTocarNoBroto={() => {
            toqueLeve(data.settings.vibracao);
            setToques((n) => n + 1);
          }}
          rotuloDoBroto={`Mexer com ${nomeDoBroto}`}
          /*
            Durante a comemoração o cartão para.

            A cena de colheita é um véu por cima desta tela, e a Home continua
            montada embaixo. Sem isto, as palavras seguiam caindo atrás do véu,
            e o que a cena pede é o contrário: tudo o mais sai de vista.
          */
          ativa={naVista && !colhendo}
          /*
            O título é o sintoma, e não o nome da ferramenta.

            Dizia "Compostar pensamentos", e o botão logo abaixo dizia
            "Compostar agora": o botão repetia o título e não acrescentava nada.
            Pior, os dois falavam do **procedimento** — e ninguém rola a tela
            procurando um procedimento. Procura-se o próprio problema, e é ele
            que está escrito aqui agora.

            O nome da ferramenta não se perdeu: ele está na etiqueta do canto e
            no botão, que é onde a pessoa decide entrar.
          */
          titulo="Não sai da cabeça?"
          custo="30 s"
          linha="Repita esse pensamento em voz alta por 30 segundos, até ele virar só som."
          acao="Compostar esse pensamento"
          onPress={onOpenComposta}
        />

        <CartaoDaFrase
          largura={larguraUtil}
          texto={conselho.texto}
          nomeDoBroto={nomeDoBroto}
          aberto={conselhoAberto}
          guardada={data.conselhosGuardados.includes(conselho.id)}
          totalGuardadas={data.conselhosGuardados.length}
          onDesenterrar={() => {
            toqueLeve(data.settings.vibracao);
            desenterrarConselho(conselho.id);
          }}
          onGuardar={() => {
            toqueLeve(data.settings.vibracao);
            guardarConselho(conselho.id);
          }}
          onVerGuardadas={onOpenConselhosGuardados}
          onCompartilhar={() => story.compartilhar(conselho.texto)}
          compartilhando={story.compartilhando}
          aviso={story.aviso}
          aoCeder={(origem) => {
            /* Um toque leve a cada estágio: a terra cedendo na mão. */
            toqueLeve(data.settings.vibracao);
            chuva.current?.soltar(origem);
          }}
        />

        {/*
          O que foi feito, e o caminho de volta.

          O título muda de assunto junto com a lista: "Para começar" em quem
          nunca praticou, "Feitas recentemente" depois da primeira.
        */}
        <View style={{ gap: 12 }}>
          <Titulo>{temHistorico ? 'Feitas recentemente' : 'Para começar'}</Titulo>
          <FeitasRecentemente
            itens={recentes}
            estreia={PARA_COMECAR}
            estagio={stage}
            margem={MARGEM}
            onAbrirPratica={(item) =>
              onOpenPractices({ topico: item.topico, pratica: item.pratica })
            }
            onAbrirDiario={onOpenDiario}
            onAbrirComposta={onOpenComposta}
          />
        </View>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Titulo>Resumo da semana</Titulo>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver o resumo completo, para a terapia"
              onPress={onOpenResumo}
              hitSlop={12}
            >
              <Text
                style={{
                  fontFamily: fonts.body.extraBold,
                  fontSize: 14,
                  color: colors.primaryStrong,
                }}
              >
                Ver tudo
              </Text>
            </Pressable>
          </View>
          <ResumoDaSemana resumo={resumo} semana={humorDaSemana} estagio={stage} />
        </View>

        {/*
          As práticas são a metade de baixo da tela, e não um atalho.

          São 41 exercícios em treze temas — a parte do app com mais trabalho
          feito dentro, e a que menos aparecia. A lista inteira fica à vista
          porque é ela o argumento: quem rola até aqui vê que tem coisa para
          ansiedade, para luto, para procrastinação, e não um "exercícios
          guiados" genérico.
        */}
        <View style={{ gap: 12 }}>
          <View style={{ gap: 3 }}>
            <Titulo>Todas as práticas</Titulo>
            {/*
              O número sai de `PRACTICE_TOPICS`, e não de um número escrito à
              mão: uma prática nova entra na conta sozinha, e ninguém precisa
              lembrar de corrigir a frase.
            */}
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 14.5,
                color: colors.textSecondary,
              }}
            >
              {quantasPraticas} exercícios guiados, em {PRACTICE_TOPICS.length} temas
            </Text>
          </View>

          <GradeDeTemas
            larguraUtil={larguraUtil}
            estagio={stage}
            /*
              A grade só se mexe quando a pessoa chegou nela. Treze cenas
              animando enquanto ela lê o alto da tela é trabalho pago sem nada
              em troca — e, ao contrário dos laços do alto, estes são treze.
            */
            parado={naVista || !!colhendo}
            onAbrir={(tema) => onOpenPractices({ topico: tema, pratica: '' })}
          />
        </View>
      </ScrollView>

      {/*
        Um `Modal`, e não uma camada dentro da tela: o escurecido de uma View
        absoluta preenche só a Home, e a barra de baixo continuava acesa e
        tocável embaixo do aviso.

        Só com a Home à vista: ela fica montada por baixo das telas empilhadas,
        e este aviso abriria no meio de uma prática. Ver `QuandoDescoberta`.
      */}
      <QuandoDescoberta>
        <Modal
          visible={!!colhendo}
          transparent
          animationType="none"
          /*
            O voltar do Android aceita a espécie marcada, que nunca é nenhuma.
            `escolhasApos` põe na frente a que responde ao período, e o estado
            da tela começa nela — ver `HarvestNotice`.
          */
          onRequestClose={() => guardarNoJardim(escolhasApos(
            especieValida(colhendo?.especie), colhendo?.mood ?? null,
          )[0])}
        >
          {colhendo ? <HarvestNotice planta={colhendo} onEscolher={guardarNoJardim} /> : null}
        </Modal>
      </QuandoDescoberta>

      {/*
        Os farelos do buraco da Frase do dia. Por cima da rolagem, para caírem
        a tela inteira, e por baixo da barra de navegação — que é desenhada
        depois desta tela — para sumirem atrás dela. Ver `ChuvaDeFarelos`.
      */}
      <ChuvaDeFarelos ref={chuva} />

      {/* A chegada, uma vez só: a primeira Home depois do onboarding. */}
      <QuandoDescoberta>
        <BoasVindas
          visivel={!data.boasVindasVistas}
          nome={name}
          aoFechar={() => marcarVisto('boasVindas')}
        />
      </QuandoDescoberta>

      {/* O card do story, montado fora da tela só enquanto está sendo fotografado. */}
      {story.palco}
      {story.folha}
    </View>
  );
}

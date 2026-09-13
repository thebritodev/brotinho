import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedSprout,
  BalaoDoBroto,
  BoasVindas,
  Carrossel,
  CartaoHeroi,
  FundoDaTela,
  CartaoDoConselho,
  CenaDaComposta,
  CenaDoDiario,
  OndeVoceParou,
  GrowthNotice,
  HarvestNotice,
  Icon,
  IconButton,
  PracticeTopicCard,
  VoltaCard,
  useCompartilharFrase,
} from '../../components';
import { toqueLeve } from '../../services/toque';
import { conselhoDoDia } from '../../data/conselhos';
import { ANCORA_RAPIDA, PRACTICE_TOPICS } from '../../data/practices';
import { falaDaHome } from '../../data/falaDaHome';
import { sugestaoParaOHumor } from '../../data/sugestao';
import { useAppState } from '../../state/AppStateProvider';
import type { Plant } from '../../state/types';
import {
  AUSENCIA_LONGA,
  colheita,
  dayKey,
  daysCaredFor,
  daysToNextStage,
  diasSemAparecer,
  ondeVoceParou,
  type Recente,
  prontoParaColher,
  sproutStage,
} from '../../state/derived';
import { fonts, type Mood, radius, useTema } from '../../theme';

/**
 * A tela inicial: o lugar de **fazer**.
 *
 * ## O que mudou, e por quê
 *
 * Ela era duas telas empilhadas. Em cima, o personagem grande, a saudação, o
 * humor e a palavra — uma conversa, para ler devagar. Embaixo, os cartões de
 * ferramenta e os atalhos — uma escolha, para resolver e sair. As duas metades
 * disputavam a primeira dobra, e quem perdia era sempre a de baixo: as
 * práticas, que são 41 exercícios, viviam atrás de um atalho de dois toques do
 * tamanho de um chip.
 *
 * Agora o personagem tem aba própria (ver `BrotinhoScreen`) e esta tela tem um
 * trabalho só: escolher uma ferramenta ou entrar numa prática.
 *
 * ## A ordem daqui
 *
 * 1. **O carrossel** com as três coisas que se faz agora: Diário, Composta e a
 *    Frase do dia.
 * 2. **As práticas**, os treze temas em grade — com uma sugestão em cima
 *    quando o humor de hoje pede alguma.
 *
 * ## O humor não mora mais aqui
 *
 * Ele esteve nas duas telas por um tempo: uma linha compacta aqui, a versão
 * inteira na aba do broto. Duas perguntas iguais em dois lugares acabam
 * fazendo a pessoa responder na que estiver na frente e estranhar a outra —
 * e o humor é uma conversa com o broto, não uma tarefa da tela de
 * ferramentas. Agora ele existe num lugar só.
 *
 * O que sobrou dele aqui é indireto: a sugestão de prática ainda olha o humor
 * de hoje, quando houver. Sem humor marcado, ela simplesmente não aparece.
 *
 * As comemorações (crescer, colher) e as boas-vindas ficam aqui, e não na aba
 * do broto, porque esta é a tela que abre. Uma planta que amadureceu e espera
 * a pessoa trocar de aba para ser colhida não seria colhida.
 */

/**
 * Humores em que uma comemoração cai mal — e em que a Composta é a ferramenta
 * do dia. Os dois usos leem a mesma lista de propósito: é a mesma pergunta,
 * "hoje está pesado?".
 */
const DIA_PESADO: readonly Mood[] = ['ansioso', 'triste', 'cansado'];

/**
 * As quatro portas de estreia, para quem ainda não esteve em lugar nenhum.
 *
 * A fileira de recentes some sem histórico — e sem histórico é a maior parte
 * das pessoas na primeira semana. Em vez de sumir, ela troca de assunto: as
 * duas ferramentas que qualquer um consegue usar no primeiro dia, mais duas
 * práticas curtas.
 *
 * As duas práticas não são as "melhores" do repertório: são as que pedem menos.
 * O aterramento 5-4-3-2-1 é a mesma que o app oferece como saída de emergência
 * (`ANCORA_RAPIDA`), e os "Dois minutos" da procrastinação é a única que cabe
 * inteira no tempo de quem só abriu para dar uma olhada. Primeira prática ruim
 * é primeira prática longa.
 */
const PARA_COMECAR: Recente[] = [
  { tipo: 'pratica', topico: ANCORA_RAPIDA.topico, pratica: ANCORA_RAPIDA.pratica },
  { tipo: 'diario' },
  { tipo: 'composta' },
  { tipo: 'pratica', topico: 'procrastinacao', pratica: 'dois-minutos' },
];

type Props = {
  name: string;
  onOpenComposta: () => void;
  onOpenDiario: () => void;
  onOpenSettings: () => void;
  onOpenPractices: (alvo?: { topico: string; pratica: string }) => void;
  onOpenConselhosGuardados: () => void;
  /** Altura em que a tela abre, guardada fora dela — ver `MainTabs`. */
  rolagemInicial?: number;
  aoRolar?: (y: number) => void;
  onOpenReminders: () => void;
  onOpenGarden: () => void;
};

export function HomeScreen({
  name,
  onOpenComposta,
  onOpenDiario,
  onOpenSettings,
  onOpenPractices,
  onOpenConselhosGuardados,
  rolagemInicial = 0,
  aoRolar,
  onOpenReminders,
  onOpenGarden,
}: Props) {
  const { colors, palette, tintsDosTemas } = useTema();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  /** A largura da tela, com piso: no primeiro quadro ela vem zerada. */
  const largura = Math.max(320, width);
  const {
    data,
    markStageSeen,
    marcarVisto,
    colherPlanta,
    desenterrarConselho,
    guardarConselho,
  } = useAppState();

  /**
   * Quem sumiu por dias vê o reencontro antes de qualquer outra coisa. Some
   * sozinho no instante em que ela registra algo — sem estado guardado.
   */
  const ausente = diasSemAparecer(data);
  const voltando = ausente !== null && ausente >= AUSENCIA_LONGA;

  const today = dayKey();
  const registroDeHoje = data.moodHistory.find((m) => m.date === today);
  const humorMarcado = registroDeHoje?.mood ?? null;

  /** Quantos exercícios existem ao todo — contados, nunca escritos à mão. */
  const quantasPraticas = useMemo(
    () => PRACTICE_TOPICS.reduce((total, t) => total + t.practices.length, 0),
    [],
  );

  const sugestao = useMemo(
    () => sugestaoParaOHumor({ humor: humorMarcado, agora: new Date() }),
    [humorMarcado],
  );

  /**
   * A altura dos três cartões grandes.
   *
   * Sai da largura da tela para a cena guardar a mesma proporção em qualquer
   * aparelho — e tem teto, porque num tablet ou numa tela muito alta um cartão
   * de 400 pontos empurraria as práticas para fora da primeira dobra, que é
   * exatamente o que esta tela foi reorganizada para evitar.
   */
  const alturaDoHeroi = Math.round(Math.min(largura * 0.84, 330));

  /**
   * A fileira do meio da tela: onde a pessoa parou, ou por onde começar.
   *
   * Ela existe sempre e no mesmo lugar. O que muda é a lista e o título — e o
   * cartão sabe a diferença sozinho: item com data mostra "ontem", item sem
   * data mostra quanto leva. Ver `PARA_COMECAR` e `OndeVoceParou`.
   */
  const visitados = useMemo(() => ondeVoceParou(data), [data]);
  const estreando = visitados.length === 0;
  const fileira = estreando ? PARA_COMECAR : visitados;

  const voltarPara = (item: Recente) => {
    if (item.tipo === 'composta') return onOpenComposta();
    if (item.tipo === 'diario') return onOpenDiario();
    onOpenPractices({ topico: item.topico, pratica: item.pratica });
  };

  /**
   * Os selos do carrossel: sempre um por cartão, e nunca o mesmo o dia inteiro.
   *
   * A primeira versão só mostrava selo quando havia um motivo forte — e o
   * resultado foi uma Home que na maioria dos dias não tinha selo nenhum, que é
   * o contrário do que o selo existe para fazer.
   *
   * O caminho do meio é este: o selo é fixo, mas o **texto** é o que for
   * verdade agora. Nenhum deles é um "Recomendado" que não recomenda nada:
   *
   * - **Diário** — "fim do dia" depois das 18h de quem ainda não escreveu,
   *   porque "o que passou hoje" só faz sentido quando o hoje já passou; "já
   *   escrito hoje" para quem escreveu; "recomendado" no resto do tempo.
   * - **Composta** — "para agora" em dia de humor pesado, que é o dia em que
   *   ela serve; "30 segundos" no resto, que é o custo dela e é o que costuma
   *   decidir se alguém entra.
   * - **Frase do dia** — "uma por dia" enquanto está enterrada, "lida hoje"
   *   depois. O cartão dela carrega o próprio selo; ver `CartaoDoConselho`.
   */
  /** O que o broto fala no alto da tela — ver `falaDaHome`. */
  const fala = useMemo(
    () =>
      falaDaHome({
        agora: new Date(),
        diasCuidados: daysCaredFor(data),
        diasParaCrescer: daysToNextStage(data),
        fraseAberta: data.conselhos.some((c) => c.date === today),
      }),
    [data, today],
  );

  const escreveuHoje = data.journal.some((e) => dayKey(e.createdAt) === today);
  const diaPesado = !!humorMarcado && DIA_PESADO.includes(humorMarcado);
  const fimDoDia = new Date().getHours() >= 18;
  const seloDaComposta = diaPesado ? 'para agora' : '30 segundos';
  const seloDoDiario = escreveuHoje
    ? 'já escrito hoje'
    : fimDoDia
      ? 'fim do dia'
      : 'recomendado';

  /*
    A frase de hoje, e se ela já foi desenterrada. `conselhoDoDia` é pura e
    escolhe a que faz mais tempo que não aparece; o que fixa a escolha do dia é
    o histórico, gravado no toque.
  */
  const conselho = useMemo(
    () => conselhoDoDia({ vistos: data.conselhos, hoje: today }),
    [data.conselhos, today],
  );
  const conselhoAberto = data.conselhos.some((c) => c.date === today);
  const story = useCompartilharFrase();

  /**
   * A altura em que esta tela abre — congelada no instante da montagem.
   *
   * `rolagemInicial` chega de uma `ref` lá do `MainTabs` e muda conforme a
   * pessoa rola. Lida a cada render, ela viraria um `contentOffset` novo a cada
   * vez, e o Android reagiria a isso rolando: a tela puxaria o tapete de quem
   * está lendo. Congelada, ela é o que sempre foi para o React — a posição
   * *inicial*, e nada mais.
   */
  const alturaInicial = useRef(rolagemInicial).current;
  const rolagem = useRef<ScrollView>(null);
  const jaRestaurou = useRef(false);

  const stage = sproutStage(data);
  const [celebrando, setCelebrando] = useState(false);

  useEffect(() => {
    // Quem já usava o app antes disso existir adota o estágio atual calado:
    // comemorar de uma vez um crescimento que aconteceu semanas atrás seria
    // um susto, não uma comemoração.
    if (data.stageSeen === null) {
      markStageSeen(stage);
      return;
    }
    if (stage <= data.stageSeen) return;

    /*
      A comemoração espera o dia melhorar.

      O crescimento do broto depende só de dias de presença, e não olhava o
      humor: quem marcasse "Triste" no décimo dia levava uma festa na cara.
      Tela de comemoração logo depois de registrar um momento difícil é
      descompasso emocional, e é dos que mais afastam.

      Nada se perde: `stageSeen` não avança, então a comemoração aparece
      inteira no primeiro dia em que ela não estiver marcando um humor pesado.
    */
    if (humorMarcado && DIA_PESADO.includes(humorMarcado)) return;

    setCelebrando(true);
  }, [stage, data.stageSeen, humorMarcado]);

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

  const guardarNoJardim = () => {
    if (colhendo) colherPlanta(colhendo);
    setColhendo(null);
    onOpenGarden();
  };

  const fecharCelebracao = () => {
    setCelebrando(false);
    markStageSeen(stage);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* A luz e a descida ficam atrás de tudo, inclusive da rolagem. */}
      <FundoDaTela />

      <ScrollView
        ref={rolagem}
        /*
          A tela **monta** já na altura certa, em vez de montar no zero e
          corrigir depois — corrigir depois pisca um quadro do topo. O
          `ReactScrollView` do Android guarda o `contentOffset` como pendente e
          o aplica dentro do próprio `onLayout`, antes de desenhar.
        */
        contentOffset={{ x: 0, y: alturaInicial }}
        scrollEventThrottle={64}
        onScroll={(e) => aoRolar?.(e.nativeEvent.contentOffset.y)}
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
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 32,
          gap: 22,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: colors.textPrimary, fontFamily: fonts.display.bold, fontSize: 25 }}
            >
              Oi, {name}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <IconButton
              accessibilityLabel="Lembretes"
              icon={<Icon name="bell" />}
              onPress={onOpenReminders}
              forma="vidro"
            />
            <IconButton
              accessibilityLabel="Configurações"
              icon={<Icon name="settings" />}
              onPress={onOpenSettings}
              forma="vidro"
            />
          </View>
        </View>

        {/*
          O broto falando, logo abaixo do nome.

          Aqui havia uma linha em versalete — "VAMOS CUIDAR DE VOCÊ HOJE?" —
          que era moldura, não fala: ninguém a dizia e ela não sabia de nada.
          Com o personagem e o balão, a primeira coisa da tela passa a ser
          alguém falando, que é a diferença entre uma tela de ferramentas e um
          app que tem alguém dentro.

          Ele é pequeno de propósito. O broto grande, com humor e conversa,
          mora na aba dele; repetir aquele tamanho aqui devolveria a esta tela
          o problema que a reorganização resolveu — o personagem ocupando a
          primeira dobra e empurrando as práticas para fora dela.

          O que ele diz vem de `falaDaHome`: fato do app quando há um, e a
          saudação do dia quando não há.
        */}
        <View style={{ marginTop: -14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AnimatedSprout mood={humorMarcado ?? 'neutro'} stage={stage} size={76} swayOnMount />
          <BalaoDoBroto lado="esquerda" tom="suave" style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 14,
                lineHeight: 14 * 1.4,
                color: palette.brown700,
              }}
            >
              {fala}
            </Text>
          </BalaoDoBroto>
        </View>

        {voltando && <VoltaCard dias={ausente} />}

        {/*
          As três coisas que se faz agora. As que olham para trás — jardim,
          valores, frases guardadas — moram na aba do broto.
        */}
        <Carrossel rotulos={['Diário', 'Composta', 'Frase do dia']}>
          <CartaoHeroi
            altura={alturaDoHeroi}
            fundo={palette.cream200}
            cena={<CenaDoDiario fundo={palette.cream200} />}
            selo={seloDoDiario}
            titulo="Diário"
            linha="Escreva ou fale o que passou hoje. Não sai do seu aparelho."
            acao="Escrever agora"
            onPress={onOpenDiario}
            label="Diário: escrever ou falar o que passou hoje"
          />

          <CartaoHeroi
            altura={alturaDoHeroi}
            fundo={palette.green100}
            cena={<CenaDaComposta fundo={palette.green100} />}
            selo={seloDaComposta}
            titulo="Composta"
            linha="Repita em voz alta o pensamento que te incomoda até ele virar só som."
            acao="Compostar um pensamento"
            onPress={onOpenComposta}
            label="Composta: repita em voz alta um pensamento que incomoda"
          />

          <CartaoDoConselho
            heroi={alturaDoHeroi}
            texto={conselho.texto}
            aberto={conselhoAberto}
            guardada={data.conselhosGuardados.includes(conselho.id)}
            onDesenterrar={() => {
              toqueLeve(data.settings.vibracao);
              desenterrarConselho(conselho.id);
            }}
            onGuardar={() => {
              toqueLeve(data.settings.vibracao);
              guardarConselho(conselho.id);
            }}
            onVerGuardadas={onOpenConselhosGuardados}
            totalGuardadas={data.conselhosGuardados.length}
            onCompartilhar={() => story.compartilhar(conselho.texto)}
            compartilhando={story.compartilhando}
            aviso={story.aviso}
          />
        </Carrossel>

        {/*
          Onde você parou.

          Vem depois do carrossel e antes das práticas de propósito: quem não
          sabe o que fazer olha para cima, quem já sabe encontra o caminho de
          volta aqui sem atravessar treze temas. Some inteira em quem ainda não
          fez nada — uma fileira vazia com um título em cima é pior que
          nenhuma. Ver `ondeVoceParou`.
        */}
        <View style={{ gap: 12, marginTop: -4 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontFamily: fonts.display.bold,
              fontSize: 20,
            }}
          >
            {estreando ? 'Para começar' : 'Onde você parou'}
          </Text>
          <OndeVoceParou itens={fileira} margem={20} onAbrir={voltarPara} />
        </View>

        {/*
          As práticas deixam de ser um atalho e passam a ser a metade de baixo
          da tela inicial.

          São 41 exercícios em treze temas — a parte do app com mais trabalho
          feito dentro, e a que menos aparecia. A lista inteira fica à vista
          porque é ela o argumento: quem rola até aqui vê que tem coisa para
          ansiedade, para luto, para procrastinação, e não um "exercícios
          guiados" genérico.
        */}
        <View style={{ gap: 12 }}>
          <View style={{ gap: 3 }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: fonts.display.bold,
                fontSize: 23,
              }}
            >
              Práticas guiadas
            </Text>
            {/*
              O número está aqui porque ele é o argumento.

              "Exercícios guiados" não diz tamanho nenhum, e tamanho é o que
              esta parte do app tem. Sai de `PRACTICE_TOPICS` e não de um
              número escrito à mão — uma prática nova entra na conta sozinha,
              e ninguém precisa lembrar de corrigir a frase.
            */}
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              {quantasPraticas} exercícios em {PRACTICE_TOPICS.length} temas, de ansiedade a luto
            </Text>
          </View>

          {/*
            A sugestão do dia, quando o humor pede uma.

            Ela vem antes da lista porque quem está mal não deveria ter de
            escolher entre treze portas — escolher é justamente o que custa
            nessa hora. Some sozinha quando o humor não pede nada; ver
            `data/sugestao.ts`.
          */}
          {!!sugestao && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${sugestao.convite} ${sugestao.titulo}`}
              onPress={() =>
                onOpenPractices({ topico: sugestao.topico, pratica: sugestao.pratica })
              }
              style={({ pressed }) => ({
                backgroundColor: colors.primarySoft,
                borderRadius: radius.lg,
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Icon name="droplet" size={20} color={colors.primaryStrong} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{ fontFamily: fonts.body.regular, fontSize: 13, color: palette.brown700 }}
                >
                  {sugestao.convite}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body.extraBold,
                    fontSize: 15,
                    color: colors.primaryStrong,
                  }}
                >
                  {sugestao.titulo}
                </Text>
              </View>
              <Icon name="chevronRight" color={colors.primaryStrong} />
            </Pressable>
          )}

          {/*
            Treze em duas colunas. O último fica sozinho na fileira e continua
            com meia largura — esticá-lo faria o tema de baixo parecer outra
            categoria, mais importante que os doze de cima.
          */}
          {/* O vão entre fileiras é menor que o das colunas porque cada célula
              já carrega embaixo a faixa em que o desenho passa da borda do
              cartão — ver `SOBRA_DO_DESENHO`. Com 12 nos dois, as fileiras
              ficariam com o dobro do respiro das colunas. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 0 }}>
            {PRACTICE_TOPICS.map((t) => (
              <PracticeTopicCard
                key={t.key}
                grade
                title={t.title}
                icon={t.icon}
                chave={t.key}
                /* A chave vira cor aqui, com o tema que está no ar — `practices`
                   é dado, e guardaria a cor do tema claro para sempre. */
                tint={tintsDosTemas[t.key]}
                style={{ width: (largura - 40 - 12) / 2 }}
                onPress={() => onOpenPractices({ topico: t.key, pratica: '' })}
              />
            ))}
          </View>

          {/*
            O broto fechando a tela.

            A lista acabava num cartão, e uma tela que acaba num cartão parece
            cortada — a pessoa rola até o fim e o que encontra é o mesmo
            retângulo de antes, só que sem vizinho embaixo. Aqui ele encerra,
            do jeito que um rodapé desenhado encerra uma página.

            É o mesmo broto de cima, no mesmo estágio, e não tem balão: o de
            cima fala, o de baixo despede. Dois personagens falando na mesma
            tela seriam duas conversas.
          */}
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            /* A barra de baixo flutua por cima do conteúdo: sem a folga, o vaso
               fica atrás do botão redondo do meio dela. */
            style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 34 }}
          >
            <AnimatedSprout
              mood={humorMarcado ?? 'neutro'}
              stage={stage}
              size={Math.min(largura * 0.3, 132)}
            />
          </View>
        </View>
      </ScrollView>

      {/*
        Um `Modal`, e não uma camada dentro da tela: o escurecido de uma View
        absoluta preenche só a Home, e a barra de baixo continuava acesa e
        tocável embaixo do aviso.
      */}
      <Modal
        visible={!!colhendo || (celebrando && stage !== 1)}
        transparent
        animationType="none"
        onRequestClose={colhendo ? guardarNoJardim : fecharCelebracao}
      >
        {colhendo ? (
          <HarvestNotice planta={colhendo} onClose={guardarNoJardim} />
        ) : (
          celebrando &&
          stage !== 1 && (
            <GrowthNotice stage={stage} days={daysCaredFor(data)} onClose={fecharCelebracao} />
          )
        )}
      </Modal>

      {/* A chegada, uma vez só: a primeira Home depois do onboarding. */}
      <BoasVindas
        visivel={!data.boasVindasVistas}
        nome={name}
        aoFechar={() => marcarVisto('boasVindas')}
      />

      {/* O card do story, montado fora da tela só enquanto está sendo fotografado. */}
      {story.palco}
    </View>
  );
}

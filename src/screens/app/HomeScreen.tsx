import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedSprout,
  BalaoDoBroto,
  BoasVindas,
  CartaoHeroi,
  ChuvaDeFarelos,
  FaixaDaComposta,
  FaixaDaFrase,
  alturaDaFaixa,
  alturaDaFaixaDaFrase,
  FundoDaTela,
  CenaDaPratica,
  OndeVoceParou,
  QuandoDescoberta,
  GrowthNotice,
  HarvestNotice,
  Icon,
  IconButton,
  PracticeTopicCard,
  VoltaCard,
  useCompartilharFrase,
  type ChuvaDeFarelosRef,
} from '../../components';
import { toqueLeve } from '../../services/toque';
import { conselhoDoDia } from '../../data/conselhos';
import { POR_TRAS_DA_BARRA } from '../../components/navigation/BottomNav';
/* A lista mora em `data/humores` desde que a repesagem da Composta também
   precisou dela. Aqui ela responde a mesma pergunta de sempre: hoje está
   pesado? — e decide a comemoração, o selo e a ordem do carrossel. */
import { DIA_PESADO } from '../../data/humores';
import {
  ANCORA_RAPIDA,
  findTopic,
  GRUPOS_DE_PRATICAS,
  PRACTICE_TOPICS,
} from '../../data/practices';
import { falaDaHome } from '../../data/falaDaHome';
import { praticaDeHoje } from '../../data/praticaDeHoje';
import { useAppState } from '../../state/AppStateProvider';
import type { Plant } from '../../state/types';
import {
  AUSENCIA_LONGA,
  colheita,
  dayKey,
  daysCaredFor,
  daysToNextStage,
  diasSemAparecer,
  praticasRecentes,
  type PraticaVisitada,
  prontoParaColher,
  sproutStage,
} from '../../state/derived';
import { fonts, useTema } from '../../theme';

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
 * 1. **O carrossel** com as três coisas que se faz agora: a prática de hoje, a
 *    Composta e a Frase do dia.
 * 2. **A fileira do meio**: onde a pessoa parou, ou por onde começar.
 * 3. **As práticas**, os treze temas em grade.
 *
 * O Diário já foi o primeiro cartão do carrossel e mudou para a aba do broto:
 * dizer como se está e escrever sobre isso são o mesmo gesto em dois tempos, e
 * lá eles ficam um embaixo do outro. Ele continua alcançável daqui pela fileira
 * do meio, que é onde ele aparece assim que for usado uma vez.
 *
 * ## O humor não mora mais aqui
 *
 * Ele esteve nas duas telas por um tempo: uma linha compacta aqui, a versão
 * inteira na aba do broto. Duas perguntas iguais em dois lugares acabam
 * fazendo a pessoa responder na que estiver na frente e estranhar a outra —
 * e o humor é uma conversa com o broto, não uma tarefa da tela de
 * ferramentas. Agora ele existe num lugar só.
 *
 * O que sobrou dele aqui é indireto: o cartão da prática de hoje olha o humor
 * marcado para escolher qual oferecer, e o selo da Composta muda em dia pesado.
 * Nenhum dos dois pergunta nada — leem o que já foi respondido na outra aba.
 *
 * As comemorações (crescer, colher) e as boas-vindas ficam aqui, e não na aba
 * do broto, porque esta é a tela que abre. Uma planta que amadureceu e espera
 * a pessoa trocar de aba para ser colhida não seria colhida.
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
 * São cinco para a fileira mostrar quatro: o cartão grande já oferece uma
 * delas, e a fileira não repete o que está logo acima.
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

  /**
   * A prática que o cartão do carrossel oferece hoje, e o tom do tema dela.
   *
   * Nunca vem vazia: sem humor marcado ela oferece retomar a última, e em quem
   * nunca fez nenhuma, uma de estreia. Ver `praticaDeHoje` — um cartão fixo do
   * carrossel não pode ter dia de não ter nada a dizer.
   */
  const oferta = useMemo(() => praticaDeHoje(data), [data]);
  const tomDaPratica =
    (tintsDosTemas as Record<string, string | undefined>)[oferta.topico] ?? palette.green100;

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
   * A faixa da Composta: o cabeçalho dentro do céu, e a terra embaixo.
   *
   * ## O céu aberto tem tamanho, e o tamanho é o recurso
   *
   * `quedaDaFaixa` é a distância que uma palavra percorre antes de entrar
   * na terra, e é a única medida daqui que muda alguma coisa de verdade.
   * No cartão que isto substitui a queda dava uns 114 pontos de tela, e
   * ainda perdia o fim dela para o véu do cartão; aqui passa dos duzentos,
   * inteiros. É o que faz caber ler cada palavra antes da seguinte — que
   * era o pedido que eu tinha resolvido só com tempo, quando o que faltava
   * era espaço.
   *
   * Sai da largura, como a altura dos cartões, para guardar a proporção em
   * qualquer aparelho. E tem teto, pelo mesmo motivo de lá: numa tela muito
   * alta, uma queda de trezentos pontos empurraria as práticas para fora da
   * primeira dobra.
   */
  /*
    Cento e trinta e dois, e não cento e doze.

    O broto e o balão subiam por cima da linha do nome — a fileira deles
    tinha recuo negativo, herdado de quando isto era um cabeçalho de lista e
    apertar era o objetivo. Dentro do céu, encostados nos botões de sino e
    ajustes, eles liam como se estivessem espremidos no teto.

    Agora a fileira desce, e a altura reservada acompanha: sem isso, o que
    desceu invadiria os primeiros vinte pontos da queda.
  */
  const CABECALHO_DA_FAIXA = 152;
  /*
    A queda cede um pouco do que o cabeçalho tomou.

    Era 0,52 da largura com teto de 210. Somando os vinte do cabeçalho e os
    trinta e dois que a terra ganhou para poder sumir, a faixa passaria de
    seiscentos e trinta pontos num celular comum — três quartos da primeira
    dobra, e o carrossel deixaria de aparecer espiando embaixo, que é o que
    convida a rolar.

    Com 0,46 e teto de 190 a queda fica em cento e setenta e nove pontos num
    aparelho de 390 — ainda uma vez e meia o que o cartão antigo dava, e sem
    o véu comendo o fim dela.
  */
  const quedaDaFaixa = Math.round(Math.min(largura * 0.42, 172));
  /*
    A faixa da Composta não termina mais nela: a terra emenda na da Frase.

    O `true` é o que tira a dissolução do fim dela — quem dissolve agora é a
    faixa de baixo. Ver `FaixaDaComposta` e `FaixaDaFrase`.
  */
  const faixa = alturaDaFaixa(insets.top + 20, CABECALHO_DA_FAIXA, quedaDaFaixa, true);
  /** As duas faixas juntas: é a partir daqui que o laço da queda para. */
  const terreno = faixa + alturaDaFaixaDaFrase();

  /**
   * A fileira do meio da tela: onde a pessoa parou, ou por onde começar.
   *
   * Ela existe sempre e no mesmo lugar. O que muda é a lista e o título — e o
   * cartão sabe a diferença sozinho: item com data mostra "ontem", item sem
   * data mostra quanto leva. Ver `PARA_COMECAR` e `OndeVoceParou`.
   */
  const visitados = useMemo(() => praticasRecentes(data), [data]);

  /*
    A prática do cartão grande não aparece de novo na fileira logo abaixo.

    Quando a oferta vem de "continuar", ela é exatamente a última feita — ou
    seja, o primeiro item da fileira. Sem este filtro, a mesma prática, com o
    mesmo desenho e o mesmo nome, aparecia duas vezes em quinze centímetros de
    tela, e a fileira passava a parecer eco do cartão em vez de outra oferta.
  */
  const semAOferta = (lista: PraticaVisitada[]) =>
    lista.filter((i) => !(i.topico === oferta.topico && i.pratica === oferta.pratica));

  /*
    Quem nunca fez nenhuma vê as de estreia; quem já fez, as que fez.

    A conta é feita **depois** do filtro da oferta, e não antes: se a única
    prática do histórico for justamente a do cartão grande, a fileira ficaria
    vazia — e uma fileira vazia com título em cima é pior que a de estreia.
  */
  const feitas = semAOferta(visitados);
  const estreando = feitas.length === 0;
  const fileira = estreando ? semAOferta(PARA_COMECAR) : feitas;

  const abrirPratica = (item: PraticaVisitada) =>
    onOpenPractices({ topico: item.topico, pratica: item.pratica });

  /**
   * Os selos dos cartões: o texto é sempre o que for verdade agora.
   *
   * - **Prática de hoje** — "para hoje" quando a escolha veio do humor de
   *   hoje, "continuar" quando é a última que ela fez, "para começar" em quem
   *   nunca fez nenhuma. Ver `praticaDeHoje`.
   * - **Frase do dia** — "uma por dia" enquanto está enterrada, "lida hoje"
   *   depois. O cartão dela carrega o próprio selo; ver `CartaoDoConselho`.
   *
   * A faixa da Composta tinha um — "30 segundos", ou "para agora" em dia
   * pesado — e saiu: numa faixa que ocupa a tela inteira, com título, frase e
   * botão, ele era mais uma coisa para ler antes da que importa.
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
  /**
   * A faixa está à vista? Fora dela, a queda para.
   *
   * O laço roda na tela que abre o app, então ele não pode rodar à toa
   * enquanto a pessoa lê a grade de práticas oitocentos pontos abaixo.
   *
   * O `setState` só acontece quando a resposta **muda** — duas vezes por
   * rolagem, e não a cada evento. Sem essa guarda, um `onScroll` a cada 64
   * ms viraria quinze renders por segundo desta tela inteira, que é o
   * oposto do que economizar quadro significa.
   */
  const [naVista, setNaVista] = useState(rolagemInicial < terreno);

  const alturaInicial = useRef(rolagemInicial).current;
  const rolagem = useRef<ScrollView>(null);
  /** A camada por onde a terra do buraco da Frase do dia cai. */
  const chuva = useRef<ChuvaDeFarelosRef>(null);
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
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          aoRolar?.(y);
          const vendo = y < terreno;
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
          /*
            Zero, e não `insets.top + 20`: a faixa é o primeiro filho, ela
            sangra até a borda da tela e dá esse respiro **por dentro**, no
            céu. Repetido aqui, ele apareceria como uma tira de creme acima
            do céu — a moldura que a faixa existe para não ter.
          */
          paddingTop: 0,
          paddingHorizontal: 20,
          paddingBottom: 32 + POR_TRAS_DA_BARRA,
          gap: 22,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/*
          A faixa da Composta: a tela começa sendo o lugar dela.

          O cabeçalho não está *acima* de um cartão — ele está **dentro do
          céu** por onde as palavras caem, e o convite está pousado na terra
          em que elas somem. A borda arredondada, a sombra e o fundo de
          cartão sumiram porque eram justamente o que dizia "isto aqui é mais
          um item da prateleira".

          Ela sangra até as bordas da tela (`recuo` negativo por dentro do
          componente) e dá o respiro do alto por conta própria — por isso o
          `paddingTop` da rolagem é zero.

          Abaixo dela, a partir do carrossel, a tela volta a ser a prateleira
          de sempre. A linha da terra é o que separa as duas coisas: em cima,
          onde a pessoa está; embaixo, o que dá para fazer.
        */}
        <FaixaDaComposta
          largura={largura}
          topo={insets.top + 20}
          recuo={20}
          cabecalho={CABECALHO_DA_FAIXA}
          queda={quedaDaFaixa}
          ativa={naVista}
          continua
          titulo="Compostar pensamentos"
          linha="Repita em voz alta o pensamento que te incomoda até ele virar só som."
          acao="Compostar agora"
          onPress={onOpenComposta}
          label="Compostar pensamentos: repita em voz alta um pensamento que incomoda"
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
          {/*
            Vinte e seis de respiro, e o número foi medido, não escolhido.

            Com seis sobravam **dez pontos** entre a base dos botões de sino
            e ajustes e o topo do balão — e o balão termina na mesma borda
            direita que eles. Dez pontos com as bordas alinhadas não leem
            como duas fileiras: leem como o balão encostado por baixo dos
            botões, que foi exatamente a queixa.

            Com vinte e seis a folga vai a trinta, que é mais que a metade
            da altura de um botão, e as duas fileiras se separam.
          */}
          <View style={{ marginTop: 26, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/*
              A carinha daqui é sempre a feliz, e não a do humor marcado.

              Ela seguia `humorMarcado`, o que sobrou de quando o humor era
              perguntado nesta tela. Hoje ele mora na aba do broto, e é lá que o
              personagem grande responde ao que a pessoa marcou — com a carinha,
              a palavra e a conversa inteira. Aqui em cima ele não pergunta nada:
              ele recebe.

              O que a versão antiga produzia era um segundo termômetro de humor
              sem nada ao redor que o explicasse. Em dia neutro — que é o padrão
              de quem ainda não marcou — dava uma carinha sem expressão recebendo
              a pessoa na tela que abre o app.
            */}
            <AnimatedSprout mood="feliz" stage={stage} size={76} swayOnMount />
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
        </FaixaDaComposta>

        {/*
          A Frase do dia, na mesma terra — e sem nada entre as duas.

          A `emenda` come o `gap` de 22 da rolagem. Sem ela, as duas faixas
          ficariam separadas por uma tira do fundo da tela — o terreno tem de ser
          contínuo, senão são duas faixas marrons empilhadas.

          Ela é feita na raiz da faixa, e não por uma `View` com `marginTop`
          em volta dela, que era como estava: aquele embrulho era a única
          diferença de estrutura entre esta faixa e a da Composta, e a risca
          branca na borda esquerda só aparecia nesta.
        */}
        <FaixaDaFrase
          largura={largura}
          recuo={20}
          emenda={22}
          texto={conselho.texto}
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

        {voltando && <VoltaCard dias={ausente} />}

        {/*
          A prática de hoje: cartão de largura inteira, sem carrossel.

          O carrossel tinha dois cartões e a Frase do dia saiu dele para virar
          faixa. Com um item só, os pontinhos e a espia do vizinho passam a
          mentir — dizem que há mais alguma coisa para o lado, e não há. O
          componente continua existindo para quando voltar a haver.
        */}
        <CartaoHeroi
          altura={alturaDoHeroi}
          fundo={tomDaPratica}
          cena={() => (
            <CenaDaPratica fundo={tomDaPratica} tema={oferta.topico} altura={alturaDoHeroi} />
          )}
          selo={oferta.selo}
          titulo={oferta.titulo}
          linha={`${oferta.convite} ${oferta.duracao}, guiada pelo app.`}
          acao="Fazer agora"
          onPress={() => onOpenPractices({ topico: oferta.topico, pratica: oferta.pratica })}
          label={`${oferta.titulo}: ${oferta.duracao}`}
        />

        {/*
          A fileira de práticas.

          Vem depois do carrossel e antes da grade de propósito: quem não sabe o
          que fazer olha para cima, quem já sabe encontra o caminho de volta
          aqui sem atravessar treze temas.

          O título é o que muda de assunto junto com a lista. "Para começar" em
          quem nunca praticou, "Práticas recentes" depois da primeira — e o
          nome novo não chega sozinho: a fileira inteira passa a ser histórico
          de verdade no instante em que existe histórico.
        */}
        <View style={{ gap: 12, marginTop: -4 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontFamily: fonts.display.bold,
              fontSize: 20,
            }}
          >
            {estreando ? 'Para começar' : 'Práticas recentes'}
          </Text>
          <OndeVoceParou itens={fileira} margem={20} onAbrir={abrirPratica} />
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
              {quantasPraticas} exercícios guiados, em {PRACTICE_TOPICS.length} temas
            </Text>
          </View>

          {/*
            Quatro blocos, e não uma grade de treze.

            Ver `GRUPOS_DE_PRATICAS` para o corte e o motivo dele. Aqui só
            importa a consequência de desenho: os cartões passaram a dizer o
            que o tema resolve — "Acalmar a ansiedade" — em vez do nome do
            assunto, e treze frases soltas numa grade são pior de ler do que
            treze palavras. Com título em cima de cada punhado, a pessoa lê
            quatro linhas e só então olha dois ou três cartões.

            Os blocos têm tamanhos diferentes de propósito (4, 3, 2, 4): o
            corte é pelo estado em que a pessoa está, e estado não vem em
            porções iguais. Igualar os blocos obrigaria a mudar o critério.

            O de três e o de dois deixam meia fileira vazia no fim, e o cartão
            continua com meia largura ali — esticá-lo faria aquele tema
            parecer mais importante que os vizinhos, que é exatamente o que
            uma lista de saídas não pode sugerir.
          */}
          {GRUPOS_DE_PRATICAS.map((grupo) => (
            <View key={grupo.titulo} style={{ gap: 8 }}>
              <Text
                style={{
                  fontFamily: fonts.body.extraBold,
                  fontSize: 13.5,
                  color: colors.textSecondary,
                }}
              >
                {grupo.titulo}
              </Text>

              {/* O vão entre fileiras é menor que o das colunas porque cada
                  célula já carrega embaixo a faixa em que o desenho passa da
                  borda do cartão — ver `SOBRA_DO_DESENHO`. Com 12 nos dois, as
                  fileiras ficariam com o dobro do respiro das colunas. */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 0 }}>
                {grupo.temas.map((chave) => {
                  const tema = findTopic(chave);
                  if (!tema) return null;
                  return (
                    <PracticeTopicCard
                      key={tema.key}
                      grade
                      title={tema.solucao}
                      icon={tema.icon}
                      chave={tema.key}
                      /* A chave vira cor aqui, com o tema que está no ar —
                         `practices` é dado, e guardaria a cor do tema claro
                         para sempre. */
                      tint={tintsDosTemas[tema.key]}
                      style={{ width: (largura - 40 - 12) / 2 }}
                      onPress={() => onOpenPractices({ topico: tema.key, pratica: '' })}
                    />
                  );
                })}
              </View>
            </View>
          ))}

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
      {/*
        Só com a Home à vista: ela fica montada por baixo das telas
        empilhadas, e este aviso abriria no meio de uma prática. Ver
        `QuandoDescoberta`.
      */}
      <QuandoDescoberta>
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
    </View>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BoasVindas,
  Carrossel,
  CartaoDeFerramenta,
  CartaoDoConselho,
  GrowthNotice,
  HarvestNotice,
  Icon,
  IconButton,
  DesenhoDaComposta,
  DesenhoDoDiario,
  PracticeTopicCard,
  VoltaCard,
  useCompartilharFrase,
} from '../../components';
import { toqueLeve } from '../../services/toque';
import { conselhoDoDia } from '../../data/conselhos';
import { PRACTICE_TOPICS } from '../../data/practices';
import { sugestaoParaOHumor } from '../../data/sugestao';
import { useAppState } from '../../state/AppStateProvider';
import type { Plant } from '../../state/types';
import {
  AUSENCIA_LONGA,
  colheita,
  dayKey,
  daysCaredFor,
  diasSemAparecer,
  prontoParaColher,
  sproutStage,
} from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';

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
  const mood = humorMarcado ?? 'neutro';

  /** Quantos exercícios existem ao todo — contados, nunca escritos à mão. */
  const quantasPraticas = useMemo(
    () => PRACTICE_TOPICS.reduce((total, t) => total + t.practices.length, 0),
    [],
  );

  const sugestao = useMemo(
    () => sugestaoParaOHumor({ humor: humorMarcado, agora: new Date() }),
    [humorMarcado],
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
  const alturaInicial = useRef(rolagemInicial).current;
  const rolagem = useRef<ScrollView>(null);
  const jaRestaurou = useRef(false);

  const stage = sproutStage(data);
  const [celebrando, setCelebrando] = useState(false);

  /** Humores em que uma comemoração cai mal. Ver o efeito abaixo. */
  const DIA_PESADO: readonly (typeof mood)[] = ['ansioso', 'triste', 'cansado'];

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
          A pergunta do dia, em versalete.

          Ela não é conteúdo: emoldura o nome, como uma linha de olho emoldura
          um título, e em caixa alta espaçada lê como rótulo.

          A saudação do broto, que morava aqui, foi junto com ele: fala dele
          pede o balão, e o balão pede o desenho para apontar. Ela aparece
          inteira na aba do broto, e repeti-la aqui como texto solto seria a
          mesma frase duas vezes, em dois lugares, sem ninguém dizendo.
        */}
        <Text
          style={{
            marginTop: -14,
            fontFamily: fonts.body.bold,
            fontSize: 13,
            letterSpacing: 1.3,
            textTransform: 'uppercase',
            color: colors.textSecondary,
          }}
        >
          Vamos cuidar de você hoje?
        </Text>

        {voltando && <VoltaCard dias={ausente} />}

        {/*
          As três coisas que se faz agora. As que olham para trás — jardim,
          valores, frases guardadas — moram na aba do broto.
        */}
        <Carrossel rotulos={['Diário', 'Composta', 'Frase do dia']}>
          <CartaoDeFerramenta
            desenho={<DesenhoDoDiario />}
            titulo="Diário"
            texto="Escreva ou fale o que passou hoje. Não sai do seu aparelho."
            etiquetas={['escrever', 'ou falar']}
            onPress={onOpenDiario}
            label="Diário: escrever ou falar o que passou hoje"
          />

          <CartaoDeFerramenta
            desenho={<DesenhoDaComposta />}
            titulo="Composta"
            texto="Repita em voz alta o pensamento que te incomoda. O broto transforma ele em adubo."
            etiquetas={['30 a 40 segundos', 'em voz alta']}
            tom="destaque"
            onPress={onOpenComposta}
            label="Composta: repita em voz alta um pensamento que incomoda"
          />

          <CartaoDoConselho
            compacto
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {PRACTICE_TOPICS.map((t) => (
              <PracticeTopicCard
                key={t.key}
                grade
                title={t.title}
                icon={t.icon}
                /* A chave vira cor aqui, com o tema que está no ar — `practices`
                   é dado, e guardaria a cor do tema claro para sempre. */
                tint={tintsDosTemas[t.key]}
                style={{ width: (largura - 40 - 12) / 2 }}
                onPress={() => onOpenPractices({ topico: t.key, pratica: '' })}
              />
            ))}
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

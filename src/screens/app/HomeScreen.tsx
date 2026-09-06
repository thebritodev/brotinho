import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedSprout,
  BalaoDoBroto,
  LuzDeEstufa,
  alturaDoMascote,
  Button,
  Card,
  GrowthNotice,
  HarvestNotice,
  Icon,
  IconButton,
  InsightCard,
  MemoryCard,
  MoodSelector,
  PalavraDoHumor,
  CrossedCard,
  VoltaCard,
  type IconName,
} from '../../components';
import { toqueLeve } from '../../services/toque';
import { saudacaoDoDia } from '../../data/saudacao';
import { proximoPasso } from '../../data/primeiraSemana';
import { sugestaoParaOHumor } from '../../data/sugestao';
import { useAppState } from '../../state/AppStateProvider';
import type { Plant } from '../../state/types';
import {
  AUSENCIA_LONGA,
  colheita,
  dayKey,
  daysCaredFor,
  diasSemAparecer,
  atravessou,
  lembranca,
  padraoDoDia,
  prontoParaColher,
  sproutStage,
} from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';

type Props = {
  name: string;
  onOpenComposta: () => void;
  onOpenSettings: () => void;
  /** Sem alvo abre a lista; com alvo, vai direto na prática oferecida. */
  onOpenPractices: (alvo?: { topico: string; pratica: string }) => void;
  onOpenValues: () => void;
  onOpenReminders: () => void;
  onOpenGarden: () => void;
};

export function HomeScreen({
  name,
  onOpenComposta,
  onOpenSettings,
  onOpenPractices,
  onOpenValues,
  onOpenReminders,
  onOpenGarden,
}: Props) {
  const { colors, palette, shadows } = useTema();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data, setTodayMood, setTodayPalavra, markStageSeen, colherPlanta } = useAppState();

  /**
   * O broto domina a tela, mas divide a primeira dobra com a pergunta.
   *
   * Era 0,46 da altura. Com ele nesse tamanho, quem abria o app precisava
   * rolar para responder "como você está hoje?" — que é a única coisa que a
   * tela pede todos os dias. Em 0,38 a saudação, o broto, as carinhas e as
   * palavras cabem juntos, e quem abre para responder e fechar nunca rola.
   *
   * Continua sangrando até as bordas: o desenho não ficou pequeno, ficou do
   * tamanho do trabalho dele.
   */
  const sproutSize = Math.min(width, height * 0.38);
  // `useWindowDimensions` devolve 0 no primeiro quadro, e aí a conta daria
  // tamanho negativo — que no SVG é inválido, não apenas feio. O piso segura
  // esse quadro; do segundo em diante a largura real assume.
  const faceSize = Math.max(36, Math.min(54, (width - 40) / 6.2));

  /**
   * Quem sumiu por dias vê o reencontro antes de qualquer outra coisa. Some
   * sozinho no instante em que ela registra algo — sem estado guardado.
   */
  const ausente = diasSemAparecer(data);
  const voltando = ausente !== null && ausente >= AUSENCIA_LONGA;

  const today = dayKey();
  /**
   * `mood` cai em 'neutro' para o broto ter uma cara antes de ela dizer
   * qualquer coisa. A oferta precisa distinguir "disse neutro" de "não disse
   * nada" — só a primeira é uma resposta.
   */
  const registroDeHoje = data.moodHistory.find((m) => m.date === today);
  const humorMarcado = registroDeHoje?.mood ?? null;
  const mood = humorMarcado ?? 'neutro';

  const sugestao = useMemo(
    () => sugestaoParaOHumor({ humor: humorMarcado, agora: new Date() }),
    [humorMarcado],
  );

  /**
   * A frase da saudação, escolhida pelo dia — ver `data/saudacao.ts`.
   *
   * O tom muda para quem já tem estrada, daí os dias cuidados. Vinha de
   * `stats()`, pelo primeiro dos três números; com os números fora desta tela,
   * ela pergunta direto a quem sabe. Não depende do relógio a cada render: a
   * escolha é estável dentro do mesmo dia.
   */
  const diasCuidados = daysCaredFor(data);
  const saudacao = useMemo(
    () => saudacaoDoDia({ agora: new Date(), diasCuidados }),
    [diasCuidados],
  );
  const padrao = useMemo(() => padraoDoDia(data), [data]);
  /**
   * O que mostrar enquanto ainda não há padrão nenhum — ver
   * `data/primeiraSemana.ts`.
   *
   * Divide o mesmo cartão com os padrões, e sempre perde para eles: uma
   * observação sobre a própria pessoa vale mais que uma apresentação do app.
   */
  const passo = useMemo(() => (padrao ? null : proximoPasso(data)), [padrao, data]);
  const memoria = useMemo(() => lembranca(data), [data]);
  const passou = useMemo(() => atravessou(data), [data]);
  const [lendoMemoria, setLendoMemoria] = useState(false);

  const stage = sproutStage(data);
  const [celebrando, setCelebrando] = useState(false);

  /**
   * Humores em que uma comemoração cai mal. Ver o efeito abaixo.
   */
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
      humor: quem marcasse "Triste" no décimo dia levava uma festa na cara. A
      literatura de design para pessoas em sofrimento chama isso pelo nome —
      tela de comemoração logo depois de registrar um momento difícil é
      descompasso emocional, e é dos que mais afastam.

      Nada se perde: `stageSeen` não avança, então a comemoração aparece
      inteira no primeiro dia em que ela não estiver marcando um humor pesado.
      Só muda a hora.
    */
    if (humorMarcado && DIA_PESADO.includes(humorMarcado)) return;

    setCelebrando(true);
  }, [stage, data.stageSeen, humorMarcado]);

  /**
   * Planta madura: mostra o momento ANTES de guardar.
   *
   * Colher em silêncio fazia o broto de três semanas virar uma mudinha sem
   * explicação — lê como perda de dado, não como conquista. A planta só vai
   * para o jardim quando a pessoa fecha o aviso, então ela vê acontecer.
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
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.bold, fontSize: 25 }}>Oi, {name}</Text>
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

        Ela não é conteúdo: é o que emoldura a saudação, do mesmo jeito que uma
        linha de olho emoldura um título. Em caixa alta espaçada e no cinza de
        apoio ela lê como rótulo — a pessoa passa por ela sem parar, que é o
        certo, porque quem tem algo a dizer aqui é o broto logo abaixo.

        Ficou colada no "Oi, Ana" (o `gap` do container é comido por uma margem
        negativa) porque as duas são uma unidade só: nome e pergunta.
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
        A frase do dia virou fala do broto.

        Ela era um parágrafo cinza logo abaixo do "Oi, Pedro" — indistinguível
        de qualquer outro texto de sistema, embora seja a única frase da tela
        que ele diz. No balão, com o bico apontando para o desenho logo abaixo,
        quem fala fica claro sem precisar escrever "o broto diz".

        Ela desceu para depois do `VoltaCard`: com um cartão no meio, o bico
        apontaria para o cartão em vez de para o broto.

        A margem negativa come parte do `gap: 22` do container. Encostado
        demais, o bico vira um V grudado na cabeça dele; longe demais, deixa de
        apontar para alguma coisa.
      */}
      {/*
        O balão fica **acima** do bloco do broto.

        O bico avança 14 pontos para dentro dele — é o que faz o balão apontar
        para o desenho. Enquanto a luz atrás do broto era translúcida isso não
        importava; agora ela é opaca (termina na cor do fundo, para não depender
        de alfa em gradiente — ver `LuzDeEstufa`), e sem o `zIndex` ela pinta
        por cima da ponta do bico.
      */}
      <BalaoDoBroto style={{ marginBottom: -14, zIndex: 1 }}>
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.5,
            color: palette.brown700,
            textAlign: 'center',
          }}
        >
          {saudacao}
        </Text>
      </BalaoDoBroto>

      <View style={{ alignItems: 'center', gap: 12 }}>
        {/* Margem negativa: o desenho encosta nas bordas da tela. */}
        {/* O broto é a porta do próprio histórico: tocar nele abre o jardim. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver meu jardim"
          onPress={onOpenGarden}
          style={{ marginHorizontal: -20 }}
        >
          {/*
            A luz vai até onde o quadro dela ainda cabe na tela.

            O documento faz o halo do tamanho da altura do desenho — 300 e 300,
            porque lá o broto ocupa a tela toda em altura. O nosso é mais baixo
            (270 numa tela de 412), e essa regra deixava a luz pequena demais
            para o gosto de quem olha.

            O teto não é estético, é geométrico: o quadro da luz precisa ser
            1,112 vez ela (a queda do gradiente precisa de margem — ver
            `LuzDeEstufa`), então a maior luz que cabe numa tela de 412 é 370.
            Passar disso faz o quadro ficar mais largo que a tela, e aí a
            queda é cortada nos lados: volta a borda dura.

            Em 0,9 da largura a luz fica 37% maior que a do documento e o
            quadro fecha exatamente na tela.
          */}
          <LuzDeEstufa diametro={Math.round(width * 0.9)}>
            <AnimatedSprout mood={mood} stage={stage} size={sproutSize} bamboleia />
          </LuzDeEstufa>
        </Pressable>
        <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.bold, fontSize: 16 }}>
          Como você está se sentindo hoje?
        </Text>
        <MoodSelector
          value={mood}
          onChange={(m) => {
            toqueLeve(data.settings.vibracao);
            setTodayMood(m);
          }}
          faceSize={faceSize}
        />

        {/*
          A palavra vem antes da sugestão, e as duas nunca competem.

          A palavra pertence ao toque que a pessoa acabou de dar — é a mesma
          pergunta, mais fina. A sugestão é outro assunto: sair daqui e fazer
          um exercício. Invertida, a ordem convidaria a sair da tela antes de
          terminar de responder nela.
        */}
        {!!humorMarcado && (
          <PalavraDoHumor
            mood={humorMarcado}
            value={registroDeHoje?.palavra}
            onChange={(p) => {
              toqueLeve(data.settings.vibracao);
              setTodayPalavra(p);
            }}
          />
        )}

        {/* Discreto de propósito: um convite, não um cartão. Some sozinho
            quando o humor não pede nada — ver `data/sugestao.ts`. */}
        {!!sugestao && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${sugestao.convite} ${sugestao.titulo}`}
            onPress={() => onOpenPractices({ topico: sugestao.topico, pratica: sugestao.pratica })}
            hitSlop={8}
            style={{ alignItems: 'center', gap: 2, paddingTop: 4 }}
          >
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 13, color: palette.brown400 }}>
              {sugestao.convite}
            </Text>
            <Text style={{ fontFamily: fonts.body.bold, fontSize: 15, color: colors.primaryStrong }}>
              {sugestao.titulo}
            </Text>
          </Pressable>
        )}
      </View>

      {/*
        O único cartão de destaque da tela.

        O verde era pintado aqui, por cima do branco do `Card`. Virou o tom
        `destaque`, que é o mesmo verde em vidro — e assim ele acompanha o tema
        em vez de precisar de uma cor escrita à mão. Ver `vidros` em `tokens`.
      */}
      <Card
        onPress={onOpenComposta}
        label="Composta: repita em voz alta um pensamento que incomoda"
        padding={18}
        tom="destaque"
        style={{ gap: 12 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* O disco do microfone: 46 e levantado, como no documento. */}
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.sm,
            }}
          >
            <Icon name="mic" size={24} color={colors.primaryStrong} />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.display.extraBold,
                fontSize: 19,
                color: colors.primaryStrong,
              }}
            >
              Composta
            </Text>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 14,
                lineHeight: 14 * 1.45,
                color: palette.brown700,
              }}
            >
              Repita em voz alta o pensamento que te incomoda. O broto transforma ele em adubo.
            </Text>
          </View>

          <Icon name="chevronRight" color={colors.primaryStrong} />
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['30 a 40 segundos', 'em voz alta'].map((tag) => (
            <View
              key={tag}
              style={{
                backgroundColor: colors.surface,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: radius.pill,
              }}
            >
              <Text
                style={{ fontFamily: fonts.body.bold, fontSize: 12, color: palette.brown700 }}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/*
        Um reencontro por vez, e nunca os dois juntos.

        Os dois cartões olham para trás, e empilhados viram uma seção de
        nostalgia que rouba a tela de hoje. O pensamento atravessado tem
        precedência porque é o mais raro: ele só existe quando a Composta
        cumpriu o que promete, e é a única coisa aqui que prova isso.

        Os dois só aparecem quando há registro antigo o bastante — sem isso a
        Home ficaria com um espaço vazio nos primeiros meses.
      */}
      {passou ? (
        <CrossedCard atravessado={passou} />
      ) : (
        !!memoria && <MemoryCard lembranca={memoria} onPress={() => setLendoMemoria(true)} />
      )}

      {/* Práticas e Valores saíram da barra de baixo e viram atalhos daqui. */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Shortcut
          icon="droplet"
          tint={palette.blue100}
          iconColor={palette.brown700}
          title="Práticas"
          subtitle="Exercícios guiados"
          onPress={onOpenPractices}
        />
        <Shortcut
          icon="leaf"
          tint={colors.primarySoft}
          iconColor={colors.primaryStrong}
          title="Meus valores"
          subtitle="O que você vive"
          onPress={onOpenValues}
        />
      </View>

      {/*
        "Seu crescimento" saiu daqui, e mora no Perfil.

        Os três números são memória, e memória se consulta — não se responde. A
        tela inicial tem um trabalho por dia, que é perguntar como a pessoa
        está, e cada bloco a mais empurra essa pergunta para baixo da dobra.

        Nada se perdeu: o Perfil já mostrava os mesmos três, com o mesmo
        `StatRow`. E o texto de boas-vindas que aparecia aqui enquanto tudo era
        zero também não faz falta — quem chega agora vê a apresentação da
        primeira semana, que diz a mesma coisa e diz melhor. Ver
        `data/primeiraSemana.ts`.
      */}

      {/*
        Um cartão, dois conteúdos, e a ordem importa.

        "Seu broto percebeu" só aparece com registros suficientes — inventar um
        padrão para quem acabou de instalar seria falso. Só que `patterns` pede
        cinco registros, então esse espaço ficava vazio exatamente na primeira
        semana, que é quando as pessoas somem. Enquanto não há padrão, o mesmo
        cartão mostra uma parte do app que ainda não foi descoberta; assim que
        houver, os padrões tomam o lugar e não voltam a sair.
      */}
      {!!padrao && (
        <View>
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 19, marginBottom: 12 }}>
            Seu broto percebeu
          </Text>
          <InsightCard text={padrao} />
        </View>
      )}

      {!!passo && (
        <View>
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 19, marginBottom: 12 }}>
            Tem isto aqui também
          </Text>
          {passo.destino ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={passo.frase}
              onPress={() => (passo.destino === 'praticas' ? onOpenPractices() : onOpenGarden())}
            >
              <InsightCard text={passo.frase} />
            </Pressable>
          ) : (
            <InsightCard text={passo.frase} />
          )}
        </View>
      )}
    </ScrollView>

      <Modal
        visible={lendoMemoria}
        transparent
        animationType="fade"
        onRequestClose={() => setLendoMemoria(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 22 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => setLendoMemoria(false)}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.45)' }]}
          />
          <View
            style={{
              backgroundColor: colors.bg,
              borderRadius: radius.lg,
              padding: 20,
              gap: 14,
              maxHeight: '80%',
            }}
          >
            <Text
              style={{ fontFamily: fonts.display.semiBold, fontSize: 18, color: colors.primaryStrong }}
            >
              {memoria?.quando}, você escreveu
            </Text>
            <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false}>
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 16,
                  lineHeight: 16 * 1.6,
                  color: palette.brown900,
                }}
              >
                {memoria?.texto}
              </Text>
            </ScrollView>
            <Button variant="ghost" style={{ width: '100%' }} onPress={() => setLendoMemoria(false)}>
              Fechar
            </Button>
          </View>
        </View>
      </Modal>

      {/*
        A colheita tem precedência: é o momento maior, e mostrar os dois avisos
        empilhados atropelaria os dois.

        Os dois vão dentro de um `Modal` porque não estavam cobrindo a tela
        inteira. O escurecido deles é `position: absolute` com as quatro bordas
        em zero, e isso preenche o pai — que aqui é a Home, e a Home termina
        onde a barra de baixo começa. A barra ficava acesa embaixo de um aviso
        escuro, e continuava respondendo ao toque: dava para trocar de aba no
        meio da colheita. O `Modal` também devolve o botão de voltar do
        Android, que antes não fechava nada.
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
    </View>
  );
}

/** Atalho compacto da Home: metade da largura, ícone, título e uma linha. */
function Shortcut({
  icon,
  tint,
  iconColor,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  tint: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useTema();
  return (
    <Card onPress={onPress} padding={16} style={{ flex: 1, gap: 10 }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: tint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ gap: 2 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.extraBold, fontSize: 15 }}>{title}</Text>
        <Text
          style={{ fontFamily: fonts.body.regular, fontSize: 12, color: colors.textSecondary }}
        >
          {subtitle}
        </Text>
      </View>
    </Card>
  );
}

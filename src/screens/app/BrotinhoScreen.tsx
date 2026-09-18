import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AFraseVoltou,
  alturaDoMascote,
  AnimatedSprout,
  BalaoDoBroto,
  Button,
  Card,
  CartaoHeroi,
  CenaDoDiario,
  CrossedCard,
  HumorNoTempo,
  Icon,
  InsightCard,
  LuzDeEstufa,
  MemoryCard,
  MoodSelector,
  PalavraDoHumor,
  TopBar,
  type IconName,
} from '../../components';
import { proximoPasso } from '../../data/primeiraSemana';
import { saudacaoDoDia } from '../../data/saudacao';
import { toqueLeve } from '../../services/toque';
import { useAppState } from '../../state/AppStateProvider';
import {
  atravessou,
  compostaParaRepesar,
  dayKey,
  daysCaredFor,
  lembranca,
  padraoDoDia,
  sproutStage,
} from '../../state/derived';
import type { Compost } from '../../state/types';
import { ANCORA_RAPIDA } from '../../data/practices';
import { fonts, useTema } from '../../theme';
import { POR_TRAS_DA_BARRA } from '../../components/navigation/BottomNav';

/**
 * A aba do broto: o personagem, o humor de hoje e a memória dela.
 *
 * ## Por que ela existe
 *
 * A tela inicial fazia dois trabalhos que brigavam entre si. Em cima, o
 * personagem, a saudação e o humor — devagar, para ler e responder. Embaixo, as
 * ferramentas e as práticas — rápido, para escolher e sair. Quem abria o app
 * para escrever no diário passava por uma dobra inteira de conversa; quem abria
 * para responder "como você está" rolava por cima de cartões de ação.
 *
 * Separadas, cada uma pode ser o que é: **Início** é o lugar de fazer, esta é o
 * lugar de estar. Aqui o broto tem espaço para ser grande, a palavra do humor
 * cabe sem competir com nada, e o que olha para trás (o jardim, o arco do
 * humor, os padrões) fica junto do personagem que representa esse tempo.
 *
 * ## O humor aparece nos dois lugares, e não é repetição
 *
 * Na tela inicial ele é uma linha compacta: a pergunta e as cinco carinhas, o
 * suficiente para registrar sem sair de lá. Aqui ele é a versão inteira, com a
 * palavra mais exata e o arco do mês. O registro diário é o que alimenta todo o
 * resto do app — ele não pode depender de a pessoa trocar de aba.
 */

type Props = {
  onOpenGarden: () => void;
  /** O diário virou tela empilhada; a dica da primeira semana leva até ele. */
  onOpenDiario: () => void;
  onOpenConselhosGuardados: () => void;
  onOpenValues: () => void;
  onOpenPractices: (alvo?: { topico: string; pratica: string }) => void;
  /** A Composta, para quem respondeu que a frase ainda pesa igual. */
  onOpenComposta: () => void;
  /**
   * A altura em que esta aba estava quando alguém saiu dela.
   *
   * Mora no `MainTabs`, e não aqui, porque é justamente esta tela que deixa de
   * existir quando o diário abre — ver o comentário de `rolagemDoBroto` lá.
   */
  rolagemInicial?: number;
  aoRolar?: (y: number) => void;
};

export function BrotinhoScreen({
  onOpenGarden,
  onOpenDiario,
  onOpenConselhosGuardados,
  onOpenValues,
  onOpenPractices,
  onOpenComposta,
  rolagemInicial = 0,
  aoRolar,
}: Props) {
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data, setTodayMood, setTodayPalavra, repesarComposta } = useAppState();

  const today = dayKey();
  const registroDeHoje = data.moodHistory.find((m) => m.date === today);
  const humorMarcado = registroDeHoje?.mood ?? null;
  const mood = humorMarcado ?? 'neutro';
  const stage = sproutStage(data);

  /**
   * A altura em que esta tela abre — congelada no instante da montagem.
   *
   * `rolagemInicial` chega de uma `ref` e muda conforme a pessoa rola. Lida a
   * cada render, ela viraria um `contentOffset` novo a cada vez, e o Android
   * reagiria a isso rolando: a tela puxaria o tapete de quem está lendo.
   */
  const alturaInicial = useRef(rolagemInicial).current;
  const rolagem = useRef<ScrollView>(null);
  const jaRestaurou = useRef(false);

  /** A mesma medida dos cartões do carrossel da tela inicial. */
  const alturaDoHeroi = Math.round(Math.min(Math.max(320, width) * 0.84, 330));

  /**
   * O selo do cartão do Diário.
   *
   * Mesma regra dos selos da tela inicial: fixo, com o texto sendo o que for
   * verdade agora. "Fim do dia" depois das 18h de quem ainda não escreveu,
   * porque "o que passou hoje" só faz sentido quando o hoje já passou.
   */
  const escreveuHoje = data.journal.some((e) => dayKey(e.createdAt) === today);
  const seloDoDiario = escreveuHoje
    ? 'já escrito hoje'
    : new Date().getHours() >= 18
      ? 'fim do dia'
      : 'recomendado';

  /* O broto cabe maior aqui do que cabia na tela inicial: esta tela não
     precisa entregar mais nada na primeira dobra. */
  const sproutSize = Math.min(width, height * 0.4);

  /**
   * A luz tem o tamanho do desenho, e não o da tela.
   *
   * Na tela inicial ela era uma fração da largura, e ali funcionava porque
   * abaixo dela vinha logo a pergunta do humor. Aqui, acima dela, vem o balão
   * de fala — e um halo de 380 em volta de um broto de 174 deixava o bico do
   * balão apontando para quase cem pontos de vazio. O balão parecia flutuar
   * longe de quem está falando.
   *
   * `alturaDoMascote` é a mesma tabela que desenha o broto, então isto
   * acompanha o estágio: no primeiro, onde o desenho é pequeno, a luz encolhe
   * junto. A folga de 20% é o que faz a luz sobrar em volta em vez de virar
   * recorte, e o teto continua sendo a largura da tela.
   */
  const diametroDaLuz = Math.min(
    Math.round(width * 0.9),
    Math.round(alturaDoMascote(stage, sproutSize) * 1.2),
  );
  const faceSize = Math.max(36, Math.min(54, (width - 40) / 6.2));

  const diasCuidados = daysCaredFor(data);
  const saudacao = useMemo(
    () => saudacaoDoDia({ agora: new Date(), diasCuidados }),
    [diasCuidados],
  );

  const padrao = useMemo(() => padraoDoDia(data), [data]);

  /**
   * A frase compostada que voltou para ser pesada — ver `AFraseVoltou`.
   *
   * `travada` existe por causa de um efeito da própria regra: responder grava a
   * resposta, e a regra "uma por dia" passa a valer no mesmo instante, de modo
   * que `compostaParaRepesar` devolve `null` e o cartão sumiria **antes** de a
   * pessoa ler o que o app respondeu a ela. Travando a frase no primeiro toque,
   * o cartão continua montado para dizer o fecho.
   */
  const candidata = useMemo(() => compostaParaRepesar(data), [data]);
  const [travada, setTravada] = useState<Compost | null>(null);
  const aFrase = travada ?? candidata;

  /*
    Um oferecimento por vez nesta faixa da tela. A pergunta sobre o peso ganha
    do passo da primeira semana: ela só existe para quem já compostou, o que
    quer dizer que a primeira semana ficou para trás.
  */
  const passo = useMemo(
    () => (padrao || aFrase ? null : proximoPasso(data)),
    [padrao, aFrase, data],
  );
  const memoria = useMemo(() => lembranca(data), [data]);
  const passou = useMemo(() => atravessou(data), [data]);
  const [lendoMemoria, setLendoMemoria] = useState(false);

  /** O nome que ela deu ao broto — e "Brotinho" para quem manteve. */
  const nomeDoBroto = data.profile.nomeDoBroto.trim() || 'Brotinho';

  const linha = (icone: IconName, rotulo: string, aoTocar: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={aoTocar}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <Icon name={icone} color={palette.brown700} />
      <Text
        style={{ color: colors.textPrimary, flex: 1, fontFamily: fonts.body.bold, fontSize: 15 }}
      >
        {rotulo}
      </Text>
      <Icon name="chevronRight" color={palette.brown400} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title={nomeDoBroto} />

      <ScrollView
        ref={rolagem}
        /*
          A tela **monta** já na altura certa, em vez de montar no zero e
          corrigir depois — corrigir depois pisca um quadro do topo. É o mesmo
          que a tela inicial faz, e pelo mesmo motivo: abrir o diário desmonta
          esta aba, e voltar montava uma aba nova, que nascia no começo.
        */
        contentOffset={{ x: 0, y: alturaInicial }}
        scrollEventThrottle={64}
        onScroll={(e) => aoRolar?.(e.nativeEvent.contentOffset.y)}
        /* Rede para quem ignorar o `contentOffset` — o `react-native-web` é um. */
        onContentSizeChange={(_, altura) => {
          if (jaRestaurou.current || alturaInicial <= 0) return;
          if (altura <= alturaInicial) return;
          jaRestaurou.current = true;
          rolagem.current?.scrollTo({ y: alturaInicial, animated: false });
        }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 + POR_TRAS_DA_BARRA, gap: 22 }}
        showsVerticalScrollIndicator={false}
      >
        {/* O bico do balão avança para dentro do desenho; o `zIndex` mantém a
            ponta por cima da luz, que é opaca. */}
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
          {/* O broto é a porta do próprio histórico: tocar nele abre o jardim. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver meu jardim"
            onPress={onOpenGarden}
            style={{ marginHorizontal: -20 }}
          >
            <LuzDeEstufa diametro={diametroDaLuz}>
              <AnimatedSprout mood={mood} stage={stage} size={sproutSize} bamboleia />
            </LuzDeEstufa>
          </Pressable>

          {/* Nada no desenho diz que ele é um botão. A dica fica até a primeira
              visita ao jardim e depois some. */}
          {!data.jardimAberto && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver meu jardim"
              onPress={onOpenGarden}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 }}
            >
              <Icon name="leaf" size={14} color={colors.primaryStrong} />
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 13, color: palette.brown400 }}>
                Toque em mim para ver seu jardim
              </Text>
            </Pressable>
          )}

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

          {/* A palavra é a mesma pergunta, mais fina. Ela mora aqui inteira; na
              tela inicial ficam só as carinhas. */}
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
        </View>

        {!!padrao && (
          <View>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: fonts.display.semiBold,
                fontSize: 19,
                marginBottom: 12,
              }}
            >
              Seu broto percebeu
            </Text>
            <InsightCard text={padrao} />
          </View>
        )}

        {/*
          Sem título em cima.

          Os outros blocos desta faixa têm um ("Seu broto percebeu", "Tem isto
          aqui também"), e este não pode ter: qualquer frase minha antes da
          frase dela seria o app comentando a dor antes de devolvê-la. O cartão
          já abre dizendo de onde aquilo veio.
        */}
        {!!aFrase && (
          <AFraseVoltou
            composta={aFrase}
            aoResponder={(resposta) => {
              setTravada(aFrase);
              repesarComposta(aFrase.id, resposta);
            }}
            aoDispensar={() => {
              setTravada(null);
              repesarComposta(aFrase.id, null);
            }}
            aoCompostarDeNovo={onOpenComposta}
            aoAncorar={() => onOpenPractices(ANCORA_RAPIDA)}
          />
        )}

        {!!passo && (
          <View>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: fonts.display.semiBold,
                fontSize: 19,
                marginBottom: 12,
              }}
            >
              Tem isto aqui também
            </Text>
            {passo.destino ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={passo.frase}
                onPress={() => {
                  if (passo.destino === 'praticas') return onOpenPractices();
                  if (passo.destino === 'diario') return onOpenDiario();
                  return onOpenGarden();
                }}
              >
                <InsightCard text={passo.frase} />
              </Pressable>
            ) : (
              <InsightCard text={passo.frase} />
            )}
          </View>
        )}

        {/* Um reencontro por vez: empilhados, os dois viram uma seção de
            nostalgia. O pensamento atravessado ganha por ser o mais raro. */}
        {passou ? (
          <CrossedCard atravessado={passou} />
        ) : (
          !!memoria && <MemoryCard lembranca={memoria} onPress={() => setLendoMemoria(true)} />
        )}

        {/*
          O Diário, fechando a parte de cima da tela.

          Ele veio do carrossel da tela inicial por causa do encadeamento com o
          humor — marcar como se está e escrever sobre isso são o mesmo gesto em
          dois tempos. Mas escrever é o **fim** desse encadeamento, não o começo:
          primeiro ela diz como está, depois o broto mostra o que percebeu, e só
          então vem o convite para escrever. Colado logo abaixo das carinhas ele
          chegava antes de haver o que escrever.

          Fica acima da fita de humor e dos atalhos: daí para baixo a tela é só
          histórico, e escrever é a única coisa desta aba que se faz agora.
        */}
        <CartaoHeroi
          altura={alturaDoHeroi}
          fundo={palette.cream200}
          cena={(p) => <CenaDoDiario fundo={palette.cream200} passo={p} />}
          selo={seloDoDiario}
          titulo="Diário"
          linha="Escreva ou fale o que passou hoje. Não sai do seu aparelho."
          acao="Escrever agora"
          onPress={onOpenDiario}
          label="Diário: escrever ou falar o que passou hoje"
        />

        {/* O arco do humor veio do Perfil: ele é sobre o mesmo tempo que o broto
            representa, e ali ficava atrás de três blocos de ajustes. */}
        <HumorNoTempo />

        <Card>
          <View style={{ gap: 16 }}>
            {linha('leaf', 'Meu jardim', onOpenGarden)}
            {linha('heart', 'Frases guardadas', onOpenConselhosGuardados)}
            {linha('star', 'Meus valores', onOpenValues)}
          </View>
        </Card>
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
              borderRadius: 18,
              padding: 20,
              gap: 14,
              maxHeight: '80%',
            }}
          >
            <Text
              style={{
                fontFamily: fonts.display.semiBold,
                fontSize: 18,
                color: colors.primaryStrong,
              }}
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
    </View>
  );
}

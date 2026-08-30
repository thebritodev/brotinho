import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AjudaAgora, Button, Icon, MoodFace, MOODS, Sprout, TopBar } from '../../components';
import { toqueDeConclusao } from '../../services/toque';
import { useAppState } from '../../state/AppStateProvider';
import { descartarRascunho, loadRascunho, saveRascunho } from '../../storage/appStorage';
import { comecoDoDia } from '../../data/comecos';
import { dayKey, normalize } from '../../state/derived';
import { borderWidth, fonts, type Mood, radius, useTema } from '../../theme';
import { LINE_HEIGHT, RuledPaper } from './RuledPaper';
import { SwipeableEntry } from './SwipeableEntry';
import { useVoiceNote } from './useVoiceNote';

/** Duração da virada de página, em ms. */
const TURN_DURATION = 620;

/**
 * Quanto o texto desce para se apoiar na pauta, em pixels.
 *
 * Medido na tela: com a fonte centralizada na faixa de 35, a base do texto
 * ficava 13px acima do traço. Nove desce o suficiente para a escrita pousar
 * sem encostar.
 */
const POUSO_NA_PAUTA = 9;

/** Registros carregados por vez na lista. */
const PAGINA = 5;

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

export function JournalScreen({
  comecoDaPratica,
  aoFazerExercicio,
}: {
  comecoDaPratica?: string | null;
  /** Repassado ao CVV: a saída de quem não quer falar com ninguém agora. */
  aoFazerExercicio?: () => void;
}) {
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();
  const { data, addJournalEntry, updateJournalEntry, removeJournalEntry } = useAppState();

  const [text, setText] = useState('');

  /**
   * O que está sendo escrito, atravessando a troca de aba e o fim do app.
   *
   * O `MainTabs` monta **só a aba ativa**: sair do Diário desmonta esta tela e
   * levava junto tudo o que estava digitado. Bastava tocar em Início no meio de
   * um desabafo — ou tocar numa notificação, que troca a aba sozinha — para
   * perder a página inteira, sem aviso. Num app de diário essa é a pior falha
   * possível.
   *
   * `escrito` guarda o valor atual fora do ciclo de render, para a gravação de
   * saída poder registrar o último estado sem depender de um novo render.
   */
  /**
   * Alinha o texto às pautas — usado tanto na folha em uso quanto na que vira.
   *
   * Estava no topo do arquivo. Aqui dentro ele acompanha o tema: no escuro a
   * tinta clareia junto com o papel.
   */
  const paperTextStyle = {
    minHeight: LINE_HEIGHT * 7,
    fontFamily: fonts.body.regular,
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    color: palette.brown900,
    paddingLeft: 4,
    paddingRight: 16,
    // No Android o padding extra da fonte soma ao lineHeight alto do papel
    // pautado e empurra o texto para fora da área visível.
    includeFontPadding: false,
    /*
      O texto pousa na pauta, em vez de flutuar no meio dela.

      Com `lineHeight` 35 e fonte 16, o glifo fica centralizado na faixa: medido
      na tela, a base da escrita caía 13px acima do traço, e a folha parecia um
      caderno em que ninguém acertou a linha. Este empurrão põe a base logo
      acima da pauta, que é como se escreve à mão.

      Vale para as duas folhas — a que está sendo escrita e a que vira na
      animação —, porque as duas usam este mesmo estilo.
    */
    paddingTop: POUSO_NA_PAUTA,
  } as const;

  const [restaurado, setRestaurado] = useState(false);
  const escrito = useRef('');
  escrito.current = text;

  useEffect(() => {
    let vivo = true;
    void loadRascunho<{ text: string }>('diario')
      .then((r) => {
        if (!vivo) return;
        if (typeof r?.text === 'string' && r.text) setText(r.text);
        setRestaurado(true);
      })
      .catch(() => vivo && setRestaurado(true));
    return () => {
      vivo = false;
    };
  }, []);

  /**
   * Grava com atraso, e uma última vez ao sair.
   *
   * Sem o atraso seria uma escrita em disco por tecla digitada. Sem a gravação
   * de saída, os últimos caracteres antes de trocar de aba se perderiam — que é
   * justamente o instante que este rascunho existe para cobrir.
   */
  useEffect(() => {
    if (!restaurado) return;
    const id = setTimeout(() => {
      void (text ? saveRascunho('diario', { text }) : descartarRascunho('diario'));
    }, 600);
    return () => clearTimeout(id);
  }, [restaurado, text]);

  useEffect(() => {
    if (!restaurado) return;
    return () => {
      const ultimo = escrito.current;
      void (ultimo ? saveRascunho('diario', { text: ultimo }) : descartarRascunho('diario'));
    };
  }, [restaurado]);

  /** Linha do histórico com as ações abertas — só uma por vez. */
  const [linhaAberta, setLinhaAberta] = useState<string | null>(null);
  /**
   * `original` existe para saber se a edição mexeu em alguma coisa.
   *
   * Tocar fora do cartão fechava o modal e descartava a edição **em silêncio**.
   * Quem estivesse reescrevendo um registro longo e encostasse um dedo dois
   * centímetros fora perdia tudo, sem pergunta e sem volta — enquanto excluir um
   * registro, que é menos grave, tem tela de confirmação.
   */
  const [editando, setEditando] = useState<
    { id: string; text: string; original: string } | null
  >(null);
  const edicaoMexida = !!editando && editando.text !== editando.original;
  const [lendo, setLendo] = useState<{ id: string; date: string; text: string } | null>(null);
  const [excluindo, setExcluindo] = useState<{ id: string; date: string } | null>(null);

  const appendTranscription = useCallback((transcribed: string) => {
    setText((t) => (t ? `${t} ` : '') + transcribed);
  }, []);

  const voice = useVoiceNote({ onText: appendTranscription });

  /**
   * A pergunta de partida, no lugar da folha em branco.
   *
   * A página em branco é o motivo mais citado de abandono em app de diário: a
   * maioria desiste em um mês porque a caixa vazia vence. A pergunta sai do que
   * o app já sabe — o humor de hoje, o horário, os valores escolhidos — e está
   * em `data/comecos.ts`, com o porquê de cada regra.
   */
  const humorDeHoje = useMemo(
    () => data.moodHistory.find((m) => m.date === dayKey())?.mood ?? null,
    [data.moodHistory],
  );
  /**
   * Quando a pessoa chega de uma prática, a pergunta dela vem no lugar.
   *
   * Estado local, e não a prop direto, por causa de um detalhe: o `MainTabs`
   * monta só a aba ativa, então esta tela nasce com a prop já pronta — e
   * salvar o registro tem de devolver a pergunta do dia, senão a da prática
   * ficaria presa na folha pelo resto da sessão.
   */
  const [daPratica, setDaPratica] = useState(comecoDaPratica ?? null);

  const comeco = useMemo(
    () =>
      daPratica ??
      comecoDoDia({
        agora: new Date(),
        humorDeHoje,
        valores: data.profile.valores ?? [],
      }),
    [daPratica, humorDeHoje, data.profile.valores],
  );

  /**
   * Registros com o humor do dia em que foram escritos. O humor não fica no
   * registro: ele é um por dia, então vem do histórico pela data.
   */
  const humorPorDia = useMemo(
    () => new Map(data.moodHistory.map((m) => [m.date, m.mood])),
    [data.moodHistory],
  );

  const entries = useMemo(
    () =>
      data.journal.map((e) => ({
        id: e.id,
        date: formatDate(e.createdAt),
        text: e.text,
        mood: humorPorDia.get(dayKey(e.createdAt)) ?? null,
      })),
    [data.journal, humorPorDia],
  );

  const [busca, setBusca] = useState('');
  const [filtroHumor, setFiltroHumor] = useState<Mood | null>(null);

  const visiveis = useMemo(() => {
    const termo = normalize(busca.trim());
    return entries.filter(
      (e) =>
        (!termo || normalize(e.text).includes(termo)) &&
        (!filtroHumor || e.mood === filtroHumor),
    );
  }, [entries, busca, filtroHumor]);

  /**
   * A busca aparece sempre que existe algum registro.
   *
   * Já tentei escondê-la enquanto houvesse poucos, para não poluir a tela.
   * Foi ruim: quem tinha dois registros não via o campo e concluía que a busca
   * não funcionava. Um campo a mais numa lista curta incomoda bem menos do que
   * uma função que some sem explicar por quê.
   */
  const mostrarBusca = entries.length > 0;

  /**
   * Quantos registros a lista mostra por vez.
   *
   * Carregar tudo de uma vez faria a tela crescer sem limite para quem escreve
   * há meses — e o diário é justamente a tela que mais acumula.
   */
  const [mostrando, setMostrando] = useState(PAGINA);

  const aMostrar = visiveis.slice(0, mostrando);
  const restantes = visiveis.length - aMostrar.length;

  // Mudou a busca ou o filtro, a lista recomeça do topo.
  useEffect(() => {
    setMostrando(PAGINA);
  }, [busca, filtroHumor]);

  // --- Virada de página ao salvar ---------------------------------------

  const turn = useRef(new Animated.Value(0)).current;
  /** Texto da folha que está virando. null quando não há virada em curso. */
  const [outgoing, setOutgoing] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (alive) setReduceMotion(on);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  /** A folha gira em torno da lombada, à esquerda. */
  const pageRotation = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-168deg'],
  });

  // Some perto do fim da virada, quando já está quase de perfil.
  const pageOpacity = turn.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [1, 1, 0],
  });

  const save = () => {
    const content = text.trim();
    if (!content || outgoing !== null) return;

    Keyboard.dismiss();

    // O registro é gravado ANTES da animação, nunca depois: um desabafo não pode
    // se perder porque um efeito visual não terminou.
    addJournalEntry(content);
    toqueDeConclusao(data.settings.vibracao);
    setText('');
    // Virou registro: o rascunho não tem mais razão de existir, e deixá-lo
    // seria uma segunda cópia do desabafo esquecida no aparelho.
    escrito.current = '';
    void descartarRascunho('diario');
    // A pergunta da prática cumpriu o que veio fazer; a folha seguinte volta a
    // ser a do dia.
    setDaPratica(null);

    // Quem pediu menos movimento no sistema não leva uma página girando na cara.
    if (reduceMotion) return;

    setOutgoing(content);
    turn.setValue(0);
    Animated.timing(turn, {
      toValue: 1,
      duration: TURN_DURATION,
      // Acelera como uma folha que ganha peso ao cair.
      easing: Easing.in(Easing.cubic),
      // O driver nativo não existe na web; ali a animação roda em JS.
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => setOutgoing(null));
  };

  // Rede de segurança: se o callback da animação não vier, a folha em trânsito
  // não pode ficar cobrindo a tela para sempre.
  useEffect(() => {
    if (outgoing === null) return;
    const id = setTimeout(() => setOutgoing(null), TURN_DURATION + 400);
    return () => clearTimeout(id);
  }, [outgoing]);

  const isRecording = voice.state === 'recording';
  const voiceLabel = {
    idle: 'Falar em vez de escrever',
    recording: voice.partial ? 'Ouvindo... toque para concluir' : 'Pode falar... toque para concluir',
    transcribing: 'Transcrevendo...',
  }[voice.state];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, paddingTop: insets.top }}
    >
      <TopBar title="Diário" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 19 }}>{comeco}</Text>

        {/* Folha em uso. A folha que acabou de ser salva vira por cima dela. */}
        <View>
          <RuledPaper>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Escreva o que vier. Ninguém além de você vai ler."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
              style={paperTextStyle}
            />
          </RuledPaper>

          {outgoing !== null && (
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  transformOrigin: 'left center',
                  backfaceVisibility: 'hidden',
                  transform: [{ perspective: 1400 }, { rotateY: pageRotation }],
                  opacity: pageOpacity,
                },
              ]}
            >
              <RuledPaper style={{ flex: 1 }}>
                <Text style={paperTextStyle}>{outgoing}</Text>
              </RuledPaper>
            </Animated.View>
          )}
        </View>

        <View style={{ gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            onPress={voice.toggle}
            disabled={voice.state === 'transcribing'}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 13,
              paddingHorizontal: 18,
              borderRadius: radius.md,
              opacity: voice.state === 'transcribing' ? 0.6 : 1,
              backgroundColor: isRecording ? colors.danger : colors.primarySoft,
            }}
          >
            {voice.state === 'transcribing' ? (
              <ActivityIndicator size="small" color={colors.primaryStrong} />
            ) : (
              <Icon name="droplet" size={18} color={isRecording ? colors.textInverse : colors.primaryStrong} />
            )}
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 15,
                color: isRecording ? colors.textInverse : colors.primaryStrong,
              }}
            >
              {voiceLabel}
            </Text>
          </Pressable>

          {/* Texto reconhecido ao vivo, antes de virar registro. */}
          {!!voice.partial && (
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 14,
                lineHeight: 14 * 1.5,
                color: colors.textSecondary,
                fontStyle: 'italic',
              }}
            >
              {voice.partial}
            </Text>
          )}

          {!!voice.error && (
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 13,
                lineHeight: 13 * 1.4,
                color: colors.danger,
              }}
            >
              {voice.error}
            </Text>
          )}

          {voice.wasSimulated && !voice.error && (
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 12,
                lineHeight: 12 * 1.4,
                color: colors.textSecondary,
              }}
            >
              O áudio foi gravado, mas o texto acima é de demonstração: falta configurar o serviço
              de transcrição.
            </Text>
          )}
        </View>

        <Button
          variant="primary"
          style={{ width: '100%' }}
          onPress={save}
          disabled={!text.trim()}
        >
          Salvar no diário
        </Button>

        {/* Fica logo abaixo de onde a pessoa escreve, e antes do histórico:
            é o ponto do app em que ela está mais perto do que dói. */}
        <AjudaAgora aoFazerExercicio={aoFazerExercicio} />

        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 19 }}>
            Registros anteriores
          </Text>
          {mostrarBusca && (
            <View style={{ gap: 10, marginBottom: 14 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 14,
                  borderRadius: radius.md,
                  borderWidth,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <Icon name="search" size={18} color={palette.brown400} />
                <TextInput
                  value={busca}
                  onChangeText={setBusca}
                  placeholder="Buscar no que você escreveu"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontFamily: fonts.body.regular,
                    fontSize: 15,
                    color: colors.textPrimary,
                  }}
                />
                {!!busca && (
                  <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setBusca('')}>
                    <Icon name="close" size={18} color={palette.brown400} />
                  </Pressable>
                )}
              </View>

              {/* Filtrar pelo humor do DIA do registro, não do registro em si. */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: 4 }}
              >
                {/* "Todos" primeiro: sem ele, voltar a ver a lista inteira
                    dependia de descobrir que tocar de novo no humor aceso o
                    desliga — uma saída que ninguém adivinha. */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mostrar todos os humores"
                  accessibilityState={{ selected: !filtroHumor }}
                  onPress={() => setFiltroHumor(null)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: radius.pill,
                    borderWidth,
                    borderColor: !filtroHumor ? colors.primaryStrong : colors.border,
                    backgroundColor: !filtroHumor ? colors.primarySoft : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.body.bold,
                      fontSize: 12,
                      color: !filtroHumor ? colors.primaryStrong : palette.brown700,
                    }}
                  >
                    Todos
                  </Text>
                </Pressable>

                {MOODS.map((m) => {
                  const ativo = filtroHumor === m.key;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={m.key}
                      accessibilityLabel={`Filtrar por ${m.label}`}
                      accessibilityState={{ selected: ativo }}
                      onPress={() => setFiltroHumor(ativo ? null : m.key)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: radius.pill,
                        borderWidth,
                        borderColor: ativo ? colors.primaryStrong : colors.border,
                        backgroundColor: ativo ? colors.primarySoft : colors.surface,
                      }}
                    >
                      <MoodFace mood={m.key} size={20} />
                      <Text
                        style={{
                          fontFamily: fonts.body.bold,
                          fontSize: 12,
                          color: ativo ? colors.primaryStrong : palette.brown700,
                        }}
                      >
                        {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

            {!entries.length && (
              <View style={{ alignItems: 'center', gap: 12, paddingVertical: 28 }}>
                <Sprout mood="neutro" stage={1} size={92} showBg={false} />
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 15,
                    lineHeight: 15 * 1.5,
                    color: colors.textSecondary,
                    textAlign: 'center',
                  }}
                >
                  Você ainda não salvou nenhum registro.{'\n'}O que você escrever aparece aqui.
                </Text>
              </View>
            )}
            {/* Vazio por filtro é diferente de vazio por não ter escrito nada. */}
            {!!entries.length && !visiveis.length && (
              <View style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
                <Sprout mood="neutro" stage={1} size={72} showBg={false} />
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 15,
                    color: colors.textSecondary,
                    textAlign: 'center',
                  }}
                >
                  Nenhum registro com {filtroHumor ? 'esse filtro' : 'esse texto'}.
                </Text>
              </View>
            )}
            {aMostrar.map((e) => (
              <SwipeableEntry
                key={e.id}
                id={e.id}
                date={e.date}
                text={e.text}
                openId={linhaAberta}
                onOpen={setLinhaAberta}
                onRead={() => setLendo({ id: e.id, date: e.date, text: e.text })}
                onEdit={() => setEditando({ id: e.id, text: e.text, original: e.text })}
                onDelete={() => setExcluindo({ id: e.id, date: e.date })}
              />
            ))}

          {/* Só o que já foi carregado fica na tela; o resto vem sob demanda. */}
          {restantes > 0 && (
            <Button
              variant="ghost"
              style={{ width: '100%', marginTop: 6 }}
              onPress={() => setMostrando((n) => n + PAGINA)}
            >
              {`Carregar mais antigos (${restantes})`}
            </Button>
          )}
        </View>
      </ScrollView>

      {/* Ler um registro inteiro */}
      <Modal visible={!!lendo} transparent animationType="fade" onRequestClose={() => setLendo(null)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 22 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => setLendo(null)}
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
              style={{ fontFamily: fonts.display.semiBold, fontSize: 19, color: colors.primaryStrong }}
            >
              {lendo?.date}
            </Text>

            {/* Rola por dentro: um desabafo longo não pode empurrar os botões
                para fora da tela. */}
            <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false}>
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 16,
                  lineHeight: 16 * 1.6,
                  color: palette.brown900,
                }}
              >
                {lendo?.text}
              </Text>
            </ScrollView>

            <View style={{ gap: 10 }}>
              <Button
                variant="secondary"
                style={{ width: '100%' }}
                onPress={() => {
                  if (!lendo) return;
                  setEditando({ id: lendo.id, text: lendo.text, original: lendo.text });
                  setLendo(null);
                }}
              >
                Editar
              </Button>
              <Button variant="ghost" style={{ width: '100%' }} onPress={() => setLendo(null)}>
                Fechar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Editar um registro */}
      <Modal
        visible={!!editando}
        transparent
        animationType="fade"
        onRequestClose={() => setEditando(null)}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 22 }}>
          {/* Com alteração pendente, o toque fora não fecha: sair passa a ser
              uma escolha, feita no botão que diz o que vai acontecer. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => !edicaoMexida && setEditando(null)}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.45)' }]}
          />
          <View style={{ backgroundColor: colors.bg, borderRadius: radius.lg, padding: 20, gap: 14 }}>
            <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 19 }}>
              Editar registro
            </Text>

            <TextInput
              value={editando?.text ?? ''}
              onChangeText={(t) => setEditando((atual) => (atual ? { ...atual, text: t } : atual))}
              multiline
              textAlignVertical="top"
              autoFocus
              style={{
                minHeight: 160,
                fontFamily: fonts.body.regular,
                fontSize: 16,
                lineHeight: 16 * 1.5,
                color: palette.brown900,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                padding: 14,
                includeFontPadding: false,
              }}
            />

            <View style={{ gap: 10 }}>
              <Button
                variant="primary"
                style={{ width: '100%' }}
                disabled={!editando?.text.trim()}
                onPress={() => {
                  if (!editando) return;
                  updateJournalEntry(editando.id, editando.text);
                  setEditando(null);
                }}
              >
                Salvar alterações
              </Button>
              <Button variant="ghost" style={{ width: '100%' }} onPress={() => setEditando(null)}>
                {edicaoMexida ? 'Descartar alterações' : 'Cancelar'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Excluir um registro */}
      <Modal
        visible={!!excluindo}
        transparent
        animationType="fade"
        onRequestClose={() => setExcluindo(null)}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 22 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => setExcluindo(null)}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.5)' }]}
          />
          <View style={{ backgroundColor: colors.bg, borderRadius: radius.lg, padding: 22, gap: 14 }}>
            <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.bold, fontSize: 21 }}>Excluir registro?</Text>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.55,
                color: palette.brown700,
              }}
            >
              O registro de {excluindo?.date} será apagado para sempre. Não há como recuperar.
            </Text>

            <View style={{ gap: 10, marginTop: 4 }}>
              <Button
                variant="primary"
                style={{ width: '100%', backgroundColor: colors.danger }}
                onPress={() => {
                  if (!excluindo) return;
                  removeJournalEntry(excluindo.id);
                  setExcluindo(null);
                  setLinhaAberta(null);
                }}
              >
                Excluir
              </Button>
              <Button variant="ghost" style={{ width: '100%' }} onPress={() => setExcluindo(null)}>
                Cancelar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

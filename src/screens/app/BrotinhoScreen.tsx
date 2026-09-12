import React, { useMemo, useState } from 'react';
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
  AnimatedSprout,
  BalaoDoBroto,
  Button,
  Card,
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
  dayKey,
  daysCaredFor,
  lembranca,
  padraoDoDia,
  sproutStage,
} from '../../state/derived';
import { fonts, useTema } from '../../theme';

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
};

export function BrotinhoScreen({
  onOpenGarden,
  onOpenDiario,
  onOpenConselhosGuardados,
  onOpenValues,
  onOpenPractices,
}: Props) {
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data, setTodayMood, setTodayPalavra } = useAppState();

  const today = dayKey();
  const registroDeHoje = data.moodHistory.find((m) => m.date === today);
  const humorMarcado = registroDeHoje?.mood ?? null;
  const mood = humorMarcado ?? 'neutro';
  const stage = sproutStage(data);

  /* O broto cabe maior aqui do que cabia na tela inicial: esta tela não
     precisa entregar mais nada na primeira dobra. */
  const sproutSize = Math.min(width, height * 0.4);
  const faceSize = Math.max(36, Math.min(54, (width - 40) / 6.2));

  const diasCuidados = daysCaredFor(data);
  const saudacao = useMemo(
    () => saudacaoDoDia({ agora: new Date(), diasCuidados }),
    [diasCuidados],
  );

  const padrao = useMemo(() => padraoDoDia(data), [data]);
  const passo = useMemo(() => (padrao ? null : proximoPasso(data)), [padrao, data]);
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 22 }}
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
            <LuzDeEstufa diametro={Math.round(width * 0.9)}>
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

        {/* Um reencontro por vez: empilhados, os dois viram uma seção de
            nostalgia. O pensamento atravessado ganha por ser o mais raro. */}
        {passou ? (
          <CrossedCard atravessado={passou} />
        ) : (
          !!memoria && <MemoryCard lembranca={memoria} onPress={() => setLendoMemoria(true)} />
        )}

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

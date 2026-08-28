import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedSprout,
  Button,
  Card,
  GrowthNotice,
  HarvestNotice,
  Icon,
  IconButton,
  InsightCard,
  MemoryCard,
  MoodSelector,
  CrossedCard,
  StatRow,
  VoltaCard,
  type IconName,
} from '../../components';
import { toqueLeve } from '../../services/toque';
import { saudacaoDoDia } from '../../data/saudacao';
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
  patterns,
  prontoParaColher,
  sproutStage,
  stats,
} from '../../state/derived';
import { colors, palette, radius, fonts } from '../../theme';

type Props = {
  name: string;
  onOpenComposta: () => void;
  onOpenSettings: () => void;
  onOpenPractices: () => void;
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
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data, setTodayMood, markStageSeen, colherPlanta } = useAppState();

  /**
   * O broto domina a tela: sangra até as bordas, ignorando a margem lateral
   * da tela. Junto com as carinhas, o bloco fica em torno de 70% da área útil
   * — o que sobra depois da barra de status e da navegação de baixo.
   */
  const sproutSize = Math.min(width, height * 0.46);
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
  const mood = data.moodHistory.find((m) => m.date === today)?.mood ?? 'neutro';

  const growth = useMemo(() => stats(data), [data]);

  /**
   * A frase da saudação, escolhida pelo dia — ver `data/saudacao.ts`.
   *
   * Depende de `growth` porque o tom muda para quem já tem estrada. Não depende
   * do relógio a cada render: a escolha é estável dentro do mesmo dia.
   */
  const saudacao = useMemo(
    () => saudacaoDoDia({ agora: new Date(), diasCuidados: growth[0].value }),
    [growth],
  );

  /**
   * No primeiro dia os três números são zero, e "Seu crescimento" vira um
   * placar vazio no exato momento em que devia dar as boas-vindas. Enquanto não
   * há o que contar, a seção diz o que vem a seguir.
   */
  const semNadaAindaParaContar = growth.every((s) => s.value === 0);
  const insights = useMemo(() => patterns(data), [data]);
  const memoria = useMemo(() => lembranca(data), [data]);
  const passou = useMemo(() => atravessou(data), [data]);
  const [lendoMemoria, setLendoMemoria] = useState(false);

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
    if (stage > data.stageSeen) setCelebrando(true);
  }, [stage, data.stageSeen]);

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
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.display.bold, fontSize: 24 }}>Oi, {name}</Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 15,
              color: colors.textSecondary,
              marginTop: 4,
            }}
          >
            {saudacao}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <IconButton
            accessibilityLabel="Lembretes"
            icon={<Icon name="bell" />}
            onPress={onOpenReminders}
          />
          <IconButton
            accessibilityLabel="Configurações"
            icon={<Icon name="settings" />}
            onPress={onOpenSettings}
          />
        </View>
      </View>

      {voltando && <VoltaCard dias={ausente} />}

      <View style={{ alignItems: 'center', gap: 12 }}>
        {/* Margem negativa: o desenho encosta nas bordas da tela. */}
        {/* O broto é a porta do próprio histórico: tocar nele abre o jardim. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver meu jardim"
          onPress={onOpenGarden}
          style={{ marginHorizontal: -20 }}
        >
          <AnimatedSprout mood={mood} stage={stage} size={sproutSize} breathe />
        </Pressable>
        <Text style={{ fontFamily: fonts.body.bold, fontSize: 16 }}>
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
      </View>

      <Card
        onPress={onOpenComposta}
        label="Composta: repita em voz alta um pensamento que incomoda"
        padding={18}
        style={{ backgroundColor: colors.primarySoft, gap: 12 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
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

      <View>
        <Text style={{ fontFamily: fonts.display.semiBold, fontSize: 19, marginBottom: 12 }}>
          {semNadaAindaParaContar ? 'Seu broto' : 'Seu crescimento'}
        </Text>
        {semNadaAindaParaContar ? (
          <Card>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.55,
                color: palette.brown700,
              }}
            >
              Ele começa hoje. Registre um humor, escreva o que veio à cabeça ou
              composte um pensamento — qualquer um dos três já faz o dia contar.
            </Text>
          </Card>
        ) : (
          <StatRow stats={growth} />
        )}
      </View>

      {/* Só aparece quando há registros suficientes — inventar um "padrão"
          para quem acabou de instalar seria falso. */}
      {insights.length > 0 && (
        <View>
          <Text style={{ fontFamily: fonts.display.semiBold, fontSize: 19, marginBottom: 12 }}>
            Seu broto percebeu
          </Text>
          <InsightCard text={insights[0]} />
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

      {/* A colheita tem precedência: é o momento maior, e mostrar os dois
          avisos empilhados atropelaria os dois. */}
      {colhendo ? (
        <HarvestNotice planta={colhendo} onClose={guardarNoJardim} />
      ) : (
        celebrando && stage !== 1 && (
          <GrowthNotice stage={stage} days={daysCaredFor(data)} onClose={fecharCelebracao} />
        )
      )}
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
        <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 15 }}>{title}</Text>
        <Text
          style={{ fontFamily: fonts.body.regular, fontSize: 12, color: colors.textSecondary }}
        >
          {subtitle}
        </Text>
      </View>
    </Card>
  );
}

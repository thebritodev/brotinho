import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedSprout,
  BalaoDoBroto,
  Cena,
  CRISTA_DO_MORRO,
  ehEnfeite,
  Icon,
  type IconName,
  NOMES_DOS_ESTAGIOS,
  Sprout,
  TopBar,
  VALUES,
  type ValueKey,
} from '../../components';
import { NO_JARDIM } from '../../data/falasDoBroto';
import { useAppState } from '../../state/AppStateProvider';
import {
  MATURIDADE, dayKey, daysToNextStage, diasNoCiclo, sproutStage,
} from '../../state/derived';
import { fonts, type Mood, radius, useTema } from '../../theme';
import type { SubScreen } from './types';
import { POR_TRAS_DA_BARRA } from '../../components/navigation/BottomNav';

/**
 * O jardim: as plantas que já amadureceram, e o broto de agora.
 *
 * Existe porque o crescimento tinha teto. O broto ia até o estágio 3, aos dez
 * dias, e nunca mais mudava — dez dias de crescimento numa assinatura anual.
 * Aqui cada planta guarda um período da vida da pessoa, com o valor e o humor
 * que o marcaram. O que se acumula é memória, não pontuação: não há número
 * total, não há recorde, não há nada a bater.
 */

const MES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const mesDe = (dia: string) => {
  const d = new Date(`${dia}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : MES[d.getMonth()];
};

const ROTULO_HUMOR: Record<Mood, string> = {
  feliz: 'dias felizes', leve: 'dias leves', ansioso: 'dias ansiosos',
  triste: 'dias tristes', cansado: 'dias cansados', neutro: 'dias comuns',
};

/**
 * Os tres jeitos de um dia contar, e para onde cada um leva.
 *
 * "Conta o dia" e nao "+1 folha": o documento conta folhas, e aqui o broto
 * cresce por dia cuidado. Tres praticas na mesma terca contam uma terca.
 */
const COMO_CRESCE: { rotulo: string; icone: IconName; destino: SubScreen }[] = [
  { rotulo: 'Práticas', icone: 'droplet', destino: 'praticas' },
  { rotulo: 'Diário', icone: 'book', destino: 'diario' },
  { rotulo: 'Composta', icone: 'sparkle', destino: 'composta' },
];

export function GardenScreen({
  onBack,
  aoAbrir,
}: {
  onBack: () => void;
  /** Leva aos tres lugares que fazem o dia contar. Sem isto, o bloco some. */
  aoAbrir?: (qual: SubScreen) => void;
}) {
  const { colors, moodColorsFundo, palette, shadows, vidros } = useTema();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data, marcarVisto } = useAppState();

  // Aberto uma vez, a dica embaixo do broto da Home cumpriu o papel e some.
  // Aqui, e não no toque do broto: o jardim também se abre por outros caminhos.
  useEffect(() => marcarVisto('jardim'), [marcarVisto]);

  const hoje = dayKey();
  const humorDeHoje = data.moodHistory.find((m) => m.date === hoje)?.mood ?? 'neutro';
  const noCiclo = diasNoCiclo(data);
  const faltam = daysToNextStage(data);
  const tamanho = Math.min(width * 0.42, 170);
  /* A janela cabe o broto inteiro mais a crista do morro embaixo dele. */
  const alturaDaJanela = Math.round(tamanho * 1.12) + CRISTA_DO_MORRO.grama - 10;
  const nomeAqui = data.profile.nomeDoBroto.trim() || 'Brotinho';
  const [falaDoJardim, setFalaDoJardim] = useState(0);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Meu jardim" onBack={onBack} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 + POR_TRAS_DA_BARRA, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/*
          O broto de agora, dentro de uma janela.

          Ele estava solto sobre o creme, do mesmo jeito que o resto da tela —
          e esta e a tela que fala do **tempo** dele. Dentro de um cartao com
          ceu e chao, ele deixa de ser uma figura no meio de uma lista e passa
          a ser o que esta acontecendo agora, com o texto logo abaixo
          explicando. Tocar nele faz ele dizer outra coisa.
        */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            overflow: 'hidden',
            ...shadows.sm,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Falar com o broto"
            onPress={() => setFalaDoJardim((n) => n + 1)}
            style={{ height: alturaDaJanela }}
          >
            <Cena
              largura={width - 40}
              altura={alturaDaJanela}
              humor={humorDeHoje}
              semAstro
              chao="grama"
              capim
            />
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: CRISTA_DO_MORRO.grama - 10,
                alignItems: 'center',
              }}
            >
              <AnimatedSprout
                mood={humorDeHoje}
                stage={sproutStage(data)}
                size={tamanho}
                bamboleia
              />
            </View>
            <BalaoDoBroto
              lado="direita"
              apareceEm={falaDoJardim}
              style={{ position: 'absolute', left: 14, top: 14, maxWidth: 180 }}
            >
              <Text
                style={{
                  fontFamily: fonts.body.bold,
                  fontSize: 14,
                  lineHeight: 14 * 1.35,
                  color: colors.textPrimary,
                }}
              >
                {NO_JARDIM[falaDoJardim % NO_JARDIM.length]}
              </Text>
            </BalaoDoBroto>
          </Pressable>

          <View style={{ padding: 18, gap: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <Text
                style={{ color: colors.textPrimary, fontFamily: fonts.display.bold, fontSize: 21 }}
              >
                Crescendo agora
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body.extraBold,
                  fontSize: 13,
                  color: colors.primaryStrong,
                }}
              >
                {nomeAqui} · {NOMES_DOS_ESTAGIOS[sproutStage(data) - 1]}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.45,
                color: palette.brown700,
              }}
            >
              {noCiclo === 0
                ? 'Ele começa a crescer no primeiro dia em que você aparecer.'
                : faltam === null
                  ? 'Esta planta está madura e logo vai para o jardim.'
                  : `${noCiclo} ${noCiclo === 1 ? 'dia' : 'dias'} de cuidado. Faltam ${faltam} para o próximo passo.`}
            </Text>

            {/* A régua do ciclo, com os quatro nomes por onde ele passa. */}
            <View
              style={{
                width: '100%',
                height: 10,
                borderRadius: 5,
                backgroundColor: palette.cream300,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${Math.min(100, (noCiclo / MATURIDADE) * 100)}%`,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {[...NOMES_DOS_ESTAGIOS, 'Flor'].map((rotulo, i) => (
                <Text
                  key={rotulo}
                  style={{
                    fontFamily: fonts.body.extraBold,
                    fontSize: 12,
                    color:
                      i === sproutStage(data) - 1 ? colors.primaryStrong : palette.brown400,
                  }}
                >
                  {rotulo}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/*
          O que faz ele crescer — e os tres caminhos para fazer.

          A tela dizia quantos dias faltavam e parava ali. Faltava a parte que
          responde "e eu faco o que?", que e a unica pergunta que alguem tem
          olhando uma barra de progresso. Os tres sao os tres jeitos de um dia
          contar, e cada um leva direto ao lugar.
        */}
        {!!aoAbrir && (
          <View style={{ gap: 10 }}>
            <Text
              style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 18 }}
            >
              O que faz ele crescer
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {COMO_CRESCE.map((c) => (
                <Pressable
                  key={c.rotulo}
                  accessibilityRole="button"
                  accessibilityLabel={c.rotulo}
                  onPress={() => aoAbrir(c.destino)}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    paddingVertical: 14,
                    paddingHorizontal: 8,
                    alignItems: 'center',
                    gap: 6,
                    opacity: pressed ? 0.85 : 1,
                    ...shadows.sm,
                  })}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primarySoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={c.icone} size={20} color={colors.primaryStrong} />
                  </View>
                  <Text
                    style={{
                      fontFamily: fonts.body.bold,
                      fontSize: 13,
                      color: colors.textPrimary,
                    }}
                  >
                    {c.rotulo}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.body.bold,
                      fontSize: 11.5,
                      color: palette.brown400,
                    }}
                  >
                    conta o dia
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 1, backgroundColor: palette.brown100 }} />

        {data.garden.length === 0 ? (
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 20 }}>
            <Sprout mood="leve" stage={3} size={96} />
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.55,
                color: colors.textSecondary,
                textAlign: 'center',
              }}
            >
              Seu jardim ainda está vazio.{'\n'}
              Quando este broto amadurecer, ele fica guardado aqui — e outro começa.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 19 }}>
              Plantas que você criou
            </Text>

            {/* Da mais nova para a mais antiga: o que aconteceu por último
                importa mais do que o começo de tudo. */}
            {[...data.garden].reverse().map((planta) => {
              const valor = VALUES[planta.valor as ValueKey];
              return (
                <View
                  key={planta.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    ...vidros.cartao,
                    borderRadius: radius.lg,
                    padding: 14,
                    ...shadows.sm,
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      // Fundo atrás do desenho, e não pastilha — ver `moodColorsFundo`.
                      backgroundColor: planta.mood ? moodColorsFundo[planta.mood] : palette.cream200,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sprout
                      mood={planta.mood ?? 'leve'}
                      stage={3}
                      size={54}
                      showPot={false}
                      decorations={ehEnfeite(planta.valor) ? [planta.valor] : []}
                    />
                  </View>

                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.extraBold, fontSize: 15 }}>
                      {mesDe(planta.maturedAt) || 'período guardado'}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.body.regular,
                        fontSize: 13,
                        lineHeight: 13 * 1.45,
                        color: palette.brown700,
                      }}
                    >
                      {planta.dias} dias de cuidado
                      {planta.mood ? ` · sobretudo ${ROTULO_HUMOR[planta.mood]}` : ''}
                      {valor ? `\nvocê viveu ${valor.label.toLowerCase()}` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

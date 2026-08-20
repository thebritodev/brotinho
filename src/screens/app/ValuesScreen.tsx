import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sprout, TopBar, ValueBadge, type Decoration } from '../../components';
import { useAppState } from '../../state/AppStateProvider';
import { dayKey, livedValues, sproutStage } from '../../state/derived';
import { colors, fonts } from '../../theme';

export function ValuesScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { data } = useAppState();

  const values = useMemo(() => livedValues(data), [data]);
  const today = dayKey();
  const mood = data.moodHistory.find((m) => m.date === today)?.mood ?? 'neutro';

  // Os 3 valores mais vividos viram enfeites no broto.
  const decorations = values.slice(0, 3).map((v) => v.value) as Decoration[];

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Meus valores" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32,
          gap: 20,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.5,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Seu broto ganha características a partir dos valores que aparecem no que você escreve.
        </Text>

        <Sprout mood={mood} stage={sproutStage(data)} decorations={decorations} size={150} />

        {values.length ? (
          <View style={{ gap: 10, width: '100%' }}>
            {values.map((v) => (
              <ValueBadge key={v.value} value={v.value} count={v.count} />
            ))}
          </View>
        ) : (
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 15,
              lineHeight: 15 * 1.5,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            {/* Sem essa distinção a mensagem mentiria: diria "escreva mais"
                para quem escreveu bastante e só desligou a análise. */}
            {data.settings.analysis
              ? 'Ainda não dá pra dizer. Escreva no diário sobre seus dias e seu broto vai começar a reconhecer o que você valoriza.'
              : 'A análise dos seus registros está desligada, então o broto não está lendo o que você escreve. Dá para ligar em Perfil › Privacidade.'}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

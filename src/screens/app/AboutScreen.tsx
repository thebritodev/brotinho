import Constants from 'expo-constants';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedSprout, Icon, TopBar } from '../../components';
import { ABOUT, OPEN_SOURCE } from '../../data/about';
import { CONTATO, OPERADOR } from '../../data/privacyPolicy';
import { fonts, radius, useTema } from '../../theme';

/** Vem do app.json, então nunca fica defasada em relação ao que foi publicado. */
export const APP_VERSION = Constants.expoConfig?.version ?? '—';

type Props = {
  onBack: () => void;
  onOpenPolicy: () => void;
};

export function AboutScreen({ onBack, onOpenPolicy }: Props) {
  const { colors, palette, shadows } = useTema();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Sobre o Brotinho" onBack={onBack} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', gap: 12, paddingTop: 4 }}>
          <AnimatedSprout mood="feliz" stage={3} size={140} swayOnMount />
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.bold, fontSize: 26 }}>Brotinho</Text>
          <Text
            style={{ fontFamily: fonts.body.regular, fontSize: 14, color: colors.textSecondary }}
          >
            Versão {APP_VERSION}
          </Text>
        </View>

        {ABOUT.map((secao) => (
          <View key={secao.title} style={{ gap: 8 }}>
            <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 18 }}>{secao.title}</Text>
            {secao.paragraphs.map((p, i) => (
              <Text
                key={i}
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 15,
                  lineHeight: 15 * 1.6,
                  color: palette.brown700,
                }}
              >
                {p}
              </Text>
            ))}
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={onOpenPolicy}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: 16,
            opacity: pressed ? 0.85 : 1,
            ...shadows.sm,
          })}
        >
          <Icon name="lock" color={palette.brown700} />
          <Text style={{ color: colors.textPrimary, flex: 1, fontFamily: fonts.body.bold, fontSize: 15 }}>
            Política de privacidade
          </Text>
          <Icon name="chevronRight" color={palette.brown400} />
        </Pressable>

        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 18 }}>
            Feito com software livre
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 14,
              lineHeight: 14 * 1.6,
              color: palette.brown700,
            }}
          >
            O Brotinho existe por causa de projetos que outras pessoas construíram e abriram:{' '}
            {OPEN_SOURCE.join(', ')}.
          </Text>
        </View>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: palette.brown100,
            paddingTop: 16,
            gap: 4,
          }}
        >
          <Text
            style={{ fontFamily: fonts.body.regular, fontSize: 13, color: colors.textSecondary }}
          >
            {OPERADOR}
          </Text>
          <Text
            style={{ fontFamily: fonts.body.regular, fontSize: 13, color: colors.textSecondary }}
          >
            {CONTATO}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

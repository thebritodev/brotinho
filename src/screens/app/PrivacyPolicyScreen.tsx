import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sprout, TopBar } from '../../components';
import {
  CONTATO,
  OPERADOR,
  POLICY_DATE,
  POLICY_VERSION,
  PRIVACY_POLICY,
} from '../../data/privacyPolicy';
import { fonts, radius, useTema } from '../../theme';

export function PrivacyPolicyScreen({ onBack }: { onBack: () => void }) {
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Política de privacidade" onBack={onBack} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
            backgroundColor: colors.primarySoft,
            borderRadius: radius.lg,
            padding: 16,
          }}
        >
          <Sprout mood="leve" stage={2} size={52} showPot={false} showBg={false} />
          <Text
            style={{
              flex: 1,
              fontFamily: fonts.body.regular,
              fontSize: 14,
              lineHeight: 14 * 1.5,
              color: palette.brown900,
            }}
          >
            Escrito para ser lido, não para se proteger de você. Está curto porque o app faz pouca
            coisa com seus dados.
          </Text>
        </View>

        {PRIVACY_POLICY.map((secao) => (
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
            Responsável: {OPERADOR}
          </Text>
          <Text
            style={{ fontFamily: fonts.body.regular, fontSize: 13, color: colors.textSecondary }}
          >
            Contato: {CONTATO}
          </Text>
          <Text
            style={{ fontFamily: fonts.body.regular, fontSize: 13, color: colors.textSecondary }}
          >
            Versão {POLICY_VERSION} · {POLICY_DATE}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

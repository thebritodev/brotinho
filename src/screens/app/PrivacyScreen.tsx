import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  Icon,
  ScreenTransition,
  Sprout,
  Switch,
  TopBar,
  type IconName,
} from '../../components';
import { useAppState } from '../../state/AppStateProvider';
import { colors, palette, radius, borderWidth, fonts } from '../../theme';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';

function PrivRow({
  icon,
  label,
  hint,
  children,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  children?: React.ReactNode;
  onPress?: () => void;
}) {
  const Container = onPress ? Pressable : View;
  return (
    <Container onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Icon name={icon} color={palette.brown700} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.body.bold, fontSize: 15 }}>{label}</Text>
        {!!hint && (
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 12,
              lineHeight: 12 * 1.4,
              color: palette.brown400,
              marginTop: 2,
            }}
          >
            {hint}
          </Text>
        )}
      </View>
      {children}
    </Container>
  );
}

export function PrivacyScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { data, updateSettings, reset } = useAppState();
  const s = data.settings;

  const [vendoPolitica, setVendoPolitica] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const chevron = <Icon name="chevronRight" color={palette.brown400} />;

  if (vendoPolitica)
    return (
      <ScreenTransition transitionKey="politica" mode="forward">
        <PrivacyPolicyScreen onBack={() => setVendoPolitica(false)} />
      </ScreenTransition>
    );

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Privacidade" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 20 }}
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
            Seu diário e seus desabafos são só seus. Nada é compartilhado sem você pedir.
          </Text>
        </View>

        <Card>
          <View style={{ gap: 18 }}>
            <PrivRow
              icon="lock"
              label="Bloqueio do app"
              hint="Pedir biometria ou senha ao abrir"
            >
              <Switch checked={s.appLock} onChange={(appLock) => updateSettings({ appLock })} />
            </PrivRow>
            <PrivRow
              icon="sparkle"
              label="Análise dos meus registros"
              hint="Permite que o broto identifique padrões nos seus textos"
            >
              <Switch checked={s.analysis} onChange={(analysis) => updateSettings({ analysis })} />
            </PrivRow>
          </View>
        </Card>

        <Card>
          <View style={{ gap: 18 }}>
            <PrivRow
              icon="pencil"
              label="Política de privacidade"
              onPress={() => setVendoPolitica(true)}
            >
              {chevron}
            </PrivRow>
          </View>
        </Card>

        <Card
          onPress={() => setConfirmandoExclusao(true)}
          style={{ borderWidth, borderColor: palette.terracotta100 }}
        >
          <Text
            style={{
              fontFamily: fonts.body.extraBold,
              fontSize: 15,
              color: colors.danger,
              marginBottom: 4,
            }}
          >
            Apagar meus dados
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 13,
              lineHeight: 13 * 1.5,
              color: palette.brown700,
            }}
          >
            Remove permanentemente seu diário, desabafos e padrões. Essa ação não pode ser desfeita.
          </Text>
        </Card>
      </ScrollView>

      <Modal
        visible={confirmandoExclusao}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmandoExclusao(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Pressable
            onPress={() => setConfirmandoExclusao(false)}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.5)' }]}
          />
          <View
            style={{
              backgroundColor: colors.bg,
              borderRadius: radius.lg,
              padding: 22,
              gap: 14,
            }}
          >
            <Text
              style={{ fontFamily: fonts.display.bold, fontSize: 22, color: colors.textPrimary }}
            >
              Apagar tudo?
            </Text>

            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.55,
                color: palette.brown700,
              }}
            >
              Isso apaga para sempre o que você registrou. Não guardamos cópia, então não há como
              recuperar depois.
            </Text>

            {/* Números concretos: "3 registros" pesa diferente de "seus dados". */}
            <View
              style={{
                backgroundColor: colors.surfaceSunken,
                borderRadius: radius.md,
                padding: 14,
                gap: 4,
              }}
            >
              {[
                [data.journal.length, 'registros no diário'],
                [data.composts.length, 'compostagens'],
                [data.moodHistory.length, 'humores registrados'],
              ].map(([quantidade, rotulo]) => (
                <Text
                  key={String(rotulo)}
                  style={{ fontFamily: fonts.body.regular, fontSize: 14, color: palette.brown700 }}
                >
                  <Text style={{ fontFamily: fonts.body.extraBold }}>{quantidade}</Text> {rotulo}
                </Text>
              ))}
            </View>

            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 13,
                lineHeight: 13 * 1.5,
                color: colors.textSecondary,
              }}
            >
              Se o backup do seu celular estiver ligado, apagar aqui também esvazia a cópia na
              próxima vez que ele rodar.
            </Text>

            <View style={{ gap: 10, marginTop: 4 }}>
              <Button
                variant="primary"
                style={{ width: '100%', backgroundColor: colors.danger }}
                onPress={() => {
                  setConfirmandoExclusao(false);
                  reset();
                }}
              >
                Sim, apagar tudo
              </Button>
              <Button
                variant="ghost"
                style={{ width: '100%' }}
                onPress={() => setConfirmandoExclusao(false)}
              >
                Cancelar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

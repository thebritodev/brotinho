import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Icon, ScreenTransition, Switch, TopBar, type IconName } from '../../components';
import { useAppState } from '../../state/AppStateProvider';
import { palette, fonts } from '../../theme';
import { AboutScreen, APP_VERSION } from './AboutScreen';
import { MyDataScreen } from './MyDataScreen';
import { MyValuesScreen } from './MyValuesScreen';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
import { RemindersScreen } from './RemindersScreen';
import { enviarFeedback } from '../../services/feedback';

function Row({
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
  const content = (
    <>
      <Icon name={icon} color={palette.brown700} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.body.bold, fontSize: 15 }}>{label}</Text>
        {!!hint && (
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 12,
              color: palette.brown400,
              marginTop: 2,
            }}
          >
            {hint}
          </Text>
        )}
      </View>
      {children}
    </>
  );

  const style = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 };
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={style}>
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text
        style={{
          fontFamily: fonts.display.semiBold,
          fontSize: 15,
          color: palette.brown400,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <Card>
        <View style={{ gap: 18 }}>{children}</View>
      </Card>
    </View>
  );
}

/** Telas abertas de dentro das Configurações. */
type Detalhe = 'dados' | 'valores' | 'sobre' | 'politica' | 'lembretes';

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { data, updateSettings } = useAppState();
  const s = data.settings;

  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [avisoFeedback, setAvisoFeedback] = useState<string | null>(null);

  const chevron = <Icon name="chevronRight" color={palette.brown400} />;

  const telas: Record<Detalhe, React.ReactNode> = {
    dados: <MyDataScreen onBack={() => setDetalhe(null)} />,
    valores: <MyValuesScreen onBack={() => setDetalhe(null)} />,
    sobre: (
      <AboutScreen onBack={() => setDetalhe(null)} onOpenPolicy={() => setDetalhe('politica')} />
    ),
    politica: <PrivacyPolicyScreen onBack={() => setDetalhe('sobre')} />,
    lembretes: <RemindersScreen onBack={() => setDetalhe(null)} />,
  };

  if (detalhe)
    return (
      <ScreenTransition transitionKey={detalhe} mode="forward">
        {telas[detalhe]}
      </ScreenTransition>
    );

  const tocarFeedback = async () => {
    const r = await enviarFeedback();
    if (r === 'sem-destinatario') {
      setAvisoFeedback('Falta definir o e-mail de contato do app.');
    } else if (r === 'sem-email') {
      setAvisoFeedback('Não encontrei um app de e-mail neste aparelho.');
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Configurações" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Lembretes">
          {/* Os interruptores moram na tela de Lembretes, junto com o horário.
              Duplicar aqui daria dois lugares para mudar a mesma coisa. */}
          <Row
            icon="bell"
            label="Lembretes"
            hint={s.reminders ? `Todos os dias às ${data.profile.reminder}` : 'Desligados'}
            onPress={() => setDetalhe('lembretes')}
          >
            {chevron}
          </Row>
        </Section>

        <Section title="Sinais do app">
          <Row
            icon="sparkle"
            label="Vibração"
            hint="Confirma o humor escolhido, cada repetição da Composta e o fim de um ciclo"
          >
            <Switch
              label="Vibração"
              checked={data.settings.vibracao}
              onChange={(vibracao) => updateSettings({ vibracao })}
            />
          </Row>
          <Row
            icon="bell"
            label="Som na respiração"
            hint="Um tom marca as fases, para você fechar os olhos. Respeita o silencioso do aparelho"
          >
            <Switch
              label="Som na respiração"
              checked={data.settings.somDaRespiracao}
              onChange={(somDaRespiracao) => updateSettings({ somDaRespiracao })}
            />
          </Row>
        </Section>

        <Section title="Conta">
          <Row icon="user" label="Meus dados" onPress={() => setDetalhe('dados')}>
            {chevron}
          </Row>
          <Row
            icon="heart"
            label="Meus valores pessoais"
            hint={
              data.profile.valores.length
                ? data.profile.valores.join(', ')
                : 'Nenhum escolhido ainda'
            }
            onPress={() => setDetalhe('valores')}
          >
            {chevron}
          </Row>
          <Row icon="book" label="Idioma" hint="Português (BR)">
            {chevron}
          </Row>
        </Section>

        <Section title="Sobre">
          <Row
            icon="sparkle"
            label="Sobre o Brotinho"
            hint={`Versão ${APP_VERSION}`}
            onPress={() => setDetalhe('sobre')}
          >
            {chevron}
          </Row>
          <Row
            icon="pencil"
            label="Enviar feedback"
            hint={avisoFeedback ?? undefined}
            onPress={tocarFeedback}
          >
            {chevron}
          </Row>
        </Section>
      </ScrollView>
    </View>
  );
}

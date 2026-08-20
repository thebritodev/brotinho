import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { BottomNav, ScreenTransition, type TabKey } from '../components';
import { HomeScreen } from '../screens/app/HomeScreen';
import { JournalScreen } from '../screens/app/JournalScreen';
import { PracticesScreen } from '../screens/app/PracticesScreen';
import { PrivacyScreen } from '../screens/app/PrivacyScreen';
import { RemindersScreen } from '../screens/app/RemindersScreen';
import { ProfileScreen } from '../screens/app/ProfileScreen';
import { SettingsScreen } from '../screens/app/SettingsScreen';
import { TherapySummaryScreen } from '../screens/app/TherapySummaryScreen';
import type { SubScreen } from '../screens/app/types';
import { CompostaScreen } from '../screens/composta/CompostaScreen';
import { ValuesScreen } from '../screens/app/ValuesScreen';
import { onNotificationTap } from '../services/notifications';
import { useAppState } from '../state/AppStateProvider';
import { colors } from '../theme';

export function MainTabs() {
  const { data } = useAppState();
  const [tab, setTab] = useState<TabKey>('home');
  const [sub, setSub] = useState<SubScreen | null>(null);

  const name = data.profile.name.trim() || 'você';
  const closeSub = () => setSub(null);

  // Tocar no lembrete leva ao diário; tocar no resumo semanal, ao resumo.
  // Antes o toque só trazia o app de volta para onde ele tinha parado.
  useEffect(
    () =>
      onNotificationTap((destino) => {
        if (destino === 'diario') {
          setSub(null);
          setTab('diario');
          return;
        }
        setTab('perfil');
        setSub('terapia');
      }),
    [],
  );

  const renderSub = () => {
    switch (sub) {
      case 'terapia':
        return <TherapySummaryScreen onBack={closeSub} />;
      case 'config':
        return <SettingsScreen onBack={closeSub} />;
      case 'privacidade':
        return <PrivacyScreen onBack={closeSub} />;
      case 'composta':
        return <CompostaScreen onClose={closeSub} />;
      case 'praticas':
        return <PracticesScreen onBack={closeSub} />;
      case 'valores':
        return <ValuesScreen onBack={closeSub} />;
      case 'lembretes':
        return <RemindersScreen onBack={closeSub} />;
      default:
        return null;
    }
  };

  const renderTab = () => {
    switch (tab) {
      case 'diario':
        return <JournalScreen />;
      case 'perfil':
        return <ProfileScreen name={name} onNavigate={setSub} />;
      case 'home':
      default:
        return (
          <HomeScreen
            name={name}
            onOpenComposta={() => setSub('composta')}
            onOpenSettings={() => setSub('config')}
            onOpenPractices={() => setSub('praticas')}
            onOpenValues={() => setSub('valores')}
            onOpenReminders={() => setSub('lembretes')}
          />
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Abrir uma tela empilhada desliza da direita; trocar de aba só aparece. */}
      <ScreenTransition transitionKey={sub ?? tab} mode={sub ? 'forward' : 'fade'}>
        {sub ? renderSub() : renderTab()}
      </ScreenTransition>
      <BottomNav
        active={tab}
        onChange={(next) => {
          setTab(next);
          setSub(null);
        }}
      />
    </View>
  );
}

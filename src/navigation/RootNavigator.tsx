import React, { useState } from 'react';
import { View } from 'react-native';

import { ScreenTransition } from '../components';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { PaywallGate } from '../screens/PaywallGate';
import { useAppState } from '../state/AppStateProvider';
import { precisaAssinar, useAssinatura } from '../state/SubscriptionProvider';
import { colors } from '../theme';
import { MainTabs } from './MainTabs';

export function RootNavigator() {
  const { hydrated, data } = useAppState();
  const { estado } = useAssinatura();

  /**
   * Não fica guardado: quem fechou o app na tela de boas-vindas ainda não
   * contou nada ao Brotinho, então rever a porta de entrada é o certo.
   */
  const [comecou, setComecou] = useState(false);

  // Enquanto o AsyncStorage não responde, mantém a tela na cor de fundo
  // para não piscar o onboarding para quem já passou por ele.
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const dentroDoApp = data.profile.onboarded;

  /**
   * Só tranca quem já passou pelo onboarding e perdeu o acesso depois.
   * `precisaAssinar` é falso enquanto verifica e quando não há SDK — ver o
   * porquê em SubscriptionProvider.
   */
  const trancado = dentroDoApp && precisaAssinar(estado);

  const tela = trancado
    ? 'paywall'
    : dentroDoApp
      ? 'app'
      : comecou
        ? 'onboarding'
        : 'boas-vindas';

  return (
    // A passagem do onboarding para o app é o corte mais marcante do fluxo:
    // entra suave em vez de trocar de tela de uma vez.
    <ScreenTransition transitionKey={tela} mode="fade">
      {trancado ? (
        <PaywallGate />
      ) : dentroDoApp ? (
        <MainTabs />
      ) : comecou ? (
        <OnboardingScreen />
      ) : (
        <WelcomeScreen onStart={() => setComecou(true)} />
      )}
    </ScreenTransition>
  );
}

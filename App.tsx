import {
  Baloo2_400Regular,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppLockGate } from './src/screens/AppLockGate';
import { AppStateProvider } from './src/state/AppStateProvider';
import { SubscriptionProvider } from './src/state/SubscriptionProvider';
import { useTema } from './src/theme';

void SplashScreen.preventAutoHideAsync();

function AppInterno() {
  const [fontsLoaded, fontError] = useFonts({
    Baloo2_400Regular,
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // Sem as fontes o layout "salta" ao carregá-las; a splash cobre esse intervalo.
  if (!fontsLoaded && !fontError) return null;

  return (
    // O gesture-handler exige esta raiz; sem ela os gestos não chegam a rodar.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          {/*
            O fundo e a barra de status ficam DENTRO do provedor de tema.

            Estavam fora, com a cor clara fixa: a barra vinha escura sobre um
            app escuro, e o fundo atrás de tudo continuava creme — visível no
            instante de carregamento e por trás das transições de tela.
          */}
          <Moldura>
            <SubscriptionProvider>
              <AppLockGate>
                <RootNavigator />
              </AppLockGate>
            </SubscriptionProvider>
          </Moldura>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** O fundo e a barra de status, já do lado de dentro do tema. */
function Moldura({ children }: { children: React.ReactNode }) {
  const { colors, tema } = useTema();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={tema === 'escuro' ? 'light' : 'dark'} />
      {children}
    </View>
  );
}

/**
 * O limite de erro fica por fora de tudo, inclusive do carregamento das fontes:
 * um erro ali dentro também precisa cair numa tela que explica, e não na tela
 * branca permanente.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AppInterno />
    </ErrorBoundary>
  );
}

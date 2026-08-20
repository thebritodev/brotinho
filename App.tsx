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
import { colors } from './src/theme';

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
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar style="dark" />
          <AppStateProvider>
            <SubscriptionProvider>
              <AppLockGate>
                <RootNavigator />
              </AppLockGate>
            </SubscriptionProvider>
          </AppStateProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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

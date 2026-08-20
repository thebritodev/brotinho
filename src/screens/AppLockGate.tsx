import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Text, View } from 'react-native';

import { Button, Sprout } from '../components';
import { useAppState } from '../state/AppStateProvider';
import { colors, fonts } from '../theme';

/**
 * Cobre o app com uma tela de bloqueio quando "Bloqueio do app" está ligado
 * em Privacidade. Também rebloqueia quando o app volta do segundo plano —
 * sem isso, deixar o celular na mão de alguém depois de destravar expõe o diário.
 */
export function AppLockGate({ children }: { children: React.ReactNode }) {
  const { data, hydrated } = useAppState();
  const enabled = data.settings.appLock && data.profile.onboarded && Platform.OS !== 'web';

  const [unlocked, setUnlocked] = useState(false);
  const [failed, setFailed] = useState(false);

  const authenticate = useCallback(async () => {
    setFailed(false);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      // Sem biometria cadastrada não dá para exigir — trancar o usuário para
      // fora do próprio diário seria pior do que não bloquear.
      if (!hasHardware || !enrolled) {
        setUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloqueie seu diário',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) setUnlocked(true);
      else setFailed(true);
    } catch {
      // Falha do módulo não pode virar app inacessível.
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!enabled) {
      setUnlocked(true);
      return;
    }
    if (!unlocked) void authenticate();
  }, [hydrated, enabled, unlocked, authenticate]);

  // Rebloqueia ao voltar do segundo plano.
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        setUnlocked(false);
        setFailed(false);
      }
    });
    return () => sub.remove();
  }, [enabled]);

  if (!enabled || unlocked) return <>{children}</>;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 32,
      }}
    >
      <Sprout mood="neutro" stage={2} size={140} />
      <Text
        style={{
          fontFamily: fonts.display.bold,
          fontSize: 22,
          textAlign: 'center',
          color: colors.textPrimary,
        }}
      >
        Seu diário está protegido
      </Text>
      <Text
        style={{
          fontFamily: fonts.body.regular,
          fontSize: 15,
          lineHeight: 15 * 1.5,
          color: colors.textSecondary,
          textAlign: 'center',
        }}
      >
        {failed
          ? 'Não consegui confirmar que é você. Tente de novo.'
          : 'Confirme que é você para continuar.'}
      </Text>
      {failed && (
        <Button variant="primary" onPress={authenticate} style={{ width: '100%' }}>
          Tentar de novo
        </Button>
      )}
    </View>
  );
}

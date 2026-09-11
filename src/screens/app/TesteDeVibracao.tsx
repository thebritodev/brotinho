import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, Text, Vibration, View } from 'react-native';

import { useAppState } from '../../state/AppStateProvider';
import { fonts, radius, useTema } from '../../theme';

/**
 * Bancada de teste da vibração — só existe no app de desenvolvimento.
 *
 * No aparelho de teste nada vibrava, em modo "som", e havia três suspeitos com
 * consertos diferentes: o ajuste de Vibração do próprio app desligado; o
 * Android tratando a vibração pedida pelo app como "de mídia" (sem dizer para
 * que serve, é assim que o Android 13 em diante a classifica, e ali ela segue
 * a intensidade de vibração de mídia do sistema); ou a duração de 18 ms curta
 * demais para o motor daquele aparelho.
 *
 * Cada botão exercita um caminho só, e a resposta "vibrou o 2 e o 3" aponta o
 * conserto sem adivinhação. Nenhum deles passa pelo `toque.ts` nem pelo ajuste
 * do app, de propósito: é o teste do caminho, não da preferência.
 */
export function TesteDeVibracao() {
  const { colors, palette } = useTema();
  const { data } = useAppState();

  if (!__DEV__ || Platform.OS !== 'android') return null;

  const botoes: [string, string, () => void][] = [
    ['1', 'Curtinha, 18 ms (a dos botões hoje)', () => Vibration.vibrate(18)],
    ['2', 'Longa, 400 ms', () => Vibration.vibrate(400)],
    ['3', 'Toque do sistema', () => void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(() => {})],
    ['4', 'Toque do sistema, forte', () => void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press).catch(() => {})],
  ];

  return (
    <View style={{ gap: 8, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontFamily: fonts.body.bold, fontSize: 13, color: colors.textPrimary }}>
        Teste de vibração (só no app de teste)
      </Text>
      <Text style={{ fontFamily: fonts.body.regular, fontSize: 12, color: colors.textSecondary }}>
        Vibração do app: {data.settings.vibracao ? 'ligada' : 'desligada'}
      </Text>
      {botoes.map(([numero, rotulo, vibrar]) => (
        <Pressable
          key={numero}
          accessibilityRole="button"
          onPress={vibrar}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: radius.sm,
            backgroundColor: pressed ? colors.primarySoft : palette.brown100,
          })}
        >
          <Text style={{ fontFamily: fonts.display.bold, fontSize: 18, color: colors.primaryStrong, width: 18 }}>
            {numero}
          </Text>
          <Text style={{ fontFamily: fonts.body.bold, fontSize: 14, color: colors.textPrimary }}>{rotulo}</Text>
        </Pressable>
      ))}
    </View>
  );
}

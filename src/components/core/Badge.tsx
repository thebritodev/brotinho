import React from 'react';
import { Text, View } from 'react-native';

import { radius, fonts, useTema, type Cores, type Palette } from '../../theme';

type Tone = 'primary' | 'warm' | 'neutral';

/**
 * A tabela virou função porque cor agora depende do tema, e tabela no topo do
 * arquivo é calculada uma vez só — ficaria congelada no claro para sempre.
 */
const tons = (colors: Cores, palette: Palette) =>
  ({
    primary: { background: colors.primarySoft, color: colors.primaryStrong },
    warm: { background: palette.amber100, color: palette.amber700 },
    neutral: { background: palette.brown100, color: palette.brown700 },
  }) as const;

/** Badge — rótulo pequeno para contagens, estados ou tags. */
export function Badge({ children, tone = 'primary' }: { children: React.ReactNode; tone?: Tone }) {
  const { colors, palette } = useTema();
  const TONES = tons(colors, palette);
  const t = TONES[tone] ?? TONES.primary;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: t.background,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
      }}
    >
      <Text style={{ fontFamily: fonts.body.bold, fontSize: 12, color: t.color }}>{children}</Text>
    </View>
  );
}

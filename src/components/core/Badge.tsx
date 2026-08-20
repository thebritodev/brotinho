import React from 'react';
import { Text, View } from 'react-native';

import { colors, palette, radius, fonts } from '../../theme';

type Tone = 'primary' | 'warm' | 'neutral';

const TONES = {
  primary: { background: colors.primarySoft, color: colors.primaryStrong },
  warm: { background: palette.amber100, color: '#8a6318' },
  neutral: { background: palette.brown100, color: palette.brown700 },
} as const;

/** Badge — rótulo pequeno para contagens, estados ou tags. */
export function Badge({ children, tone = 'primary' }: { children: React.ReactNode; tone?: Tone }) {
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

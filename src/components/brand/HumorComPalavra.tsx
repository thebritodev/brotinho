import React from 'react';
import { Text, View } from 'react-native';

import { ROTULO_DO_HUMOR } from '../../data/humores';
import { fonts, type Mood, useTema } from '../../theme';
import { MoodFace } from './MoodFace';

/**
 * O humor de um dia com a palavra mais exata dele: carinha, "Ansioso ·
 * preocupação".
 *
 * ## Por que existe
 *
 * A palavra era gravada e não aparecia em lugar nenhum. A Home perguntava "se
 * tiver uma palavra mais exata, ela é qual?", a pessoa parava para achar a
 * certa — e no dia seguinte ela sumia. Só voltava como frase de padrão, e só
 * depois de se repetir três vezes. Do lado de quem respondeu, era uma pergunta
 * que não dava em nada.
 *
 * Agora ela acompanha o humor onde o humor de um dia aparece: no dia tocado da
 * fita do Perfil e no alto de cada registro do Diário. É um componente só para
 * que os dois lugares digam a mesma coisa do mesmo jeito.
 *
 * A palavra vem em negrito porque é a parte que a pessoa escolheu com mais
 * cuidado: "Ansioso" é uma de seis carinhas, "preocupação" foi procurada.
 */
export function HumorComPalavra({
  mood,
  palavra,
  tamanho = 'normal',
}: {
  mood: Mood;
  palavra?: string;
  tamanho?: 'pequeno' | 'normal';
}) {
  const { palette } = useTema();
  const corpo = tamanho === 'pequeno' ? 12 : 14;
  const rotulo = ROTULO_DO_HUMOR[mood];

  return (
    <View
      accessible
      accessibilityLabel={palavra ? `Humor do dia: ${rotulo}, ${palavra}` : `Humor do dia: ${rotulo}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}
    >
      <MoodFace mood={mood} size={tamanho === 'pequeno' ? 16 : 20} />
      <Text
        numberOfLines={1}
        style={{ flexShrink: 1, fontFamily: fonts.body.regular, fontSize: corpo, color: palette.brown700 }}
      >
        {rotulo}
        {!!palavra && (
          <Text style={{ fontFamily: fonts.body.bold }}>
            {' · '}
            {palavra}
          </Text>
        )}
      </Text>
    </View>
  );
}

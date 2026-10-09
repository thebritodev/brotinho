import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { fonts, radius, useTema } from '../../theme';
import type { Mood } from '../../theme/tokens';
import { ROTULO_DO_HUMOR } from '../../data/humores';
import { MoodFace } from './MoodFace';

type Props = {
  /** O humor de hoje, ou `null` enquanto ninguém respondeu. */
  humor: Mood | null;
  /** Leva à aba do broto, que é onde a pergunta mora inteira. */
  onPress: () => void;
};

/**
 * A pergunta do humor, de volta à tela inicial — mas como **convite**, não como
 * formulário.
 *
 * ## A história, porque ela explica o formato
 *
 * O humor já esteve aqui com as cinco carinhas na própria tela. Saiu, e por um
 * bom motivo: a mesma pergunta em duas abas fazia a pessoa responder na que
 * estivesse na frente e estranhar a outra. A regra que ficou — *uma pergunta,
 * um lugar* — continua valendo.
 *
 * O que volta agora não é a pergunta: é a **porta** para ela. Uma linha só, com
 * um toque, que leva à aba do broto. Ninguém responde nada aqui, então não há
 * dois lugares para responder; e a tela inicial deixa de ser o único lugar do
 * app onde o humor do dia é invisível, que era o preço alto demais da regra.
 *
 * ## Por que ele não some depois de respondido
 *
 * Porque aí ele vira outra coisa, e a outra coisa também é útil: *"Hoje você
 * está ansioso. Quer contar mais?"* — o app repetindo de volta o que ouviu, com
 * a porta aberta para a palavra mais exata e para o diário. Um banner que
 * desaparece ao ser usado ensina que responder faz a tela encolher.
 *
 * ## A carinha
 *
 * Fica num disco da cor do humor, e antes de responder ela é a do "leve" — a
 * cara neutra e simpática do app. Não é um palpite sobre como a pessoa está: é
 * o rosto da pergunta. Pôr ali um rosto triste para quem não disse nada seria
 * o app sugerindo a resposta.
 */
export function BannerDoHumor({ humor, onPress }: Props) {
  const { colors, palette, shadows, moodColors } = useTema();
  const marcado = humor !== null && humor !== 'neutro';
  const rosto: Mood = marcado ? humor : 'leve';

  const texto = marcado
    ? `Hoje você está ${ROTULO_DO_HUMOR[humor].toLowerCase()}. Quer contar mais?`
    : 'Como você está hoje? Conte para o seu broto.';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        marcado
          ? `Hoje você está ${ROTULO_DO_HUMOR[humor].toLowerCase()}. Abrir para contar mais`
          : 'Contar como você está hoje'
      }
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingRight: 10,
        paddingLeft: 12,
        borderRadius: radius.botao,
        backgroundColor: colors.surface,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        ...shadows.sm,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: moodColors[rosto],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/*
          Sem o disco próprio da carinha: o disco já está aqui, na cor do
          humor, e dois círculos concêntricos da mesma cor só acrescentariam um
          anel de contorno. Mesma razão da casa do calendário. Ver `MoodFace`.
        */}
        <MoodFace mood={rosto} size={30} semFundo />
      </View>

      <Text
        style={{
          flex: 1,
          fontFamily: fonts.body.bold,
          fontSize: 14.5,
          lineHeight: 14.5 * 1.35,
          color: palette.brown700,
        }}
      >
        {texto}
      </Text>

      <View
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: radius.sm,
          backgroundColor: colors.primarySoft,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body.extraBold,
            fontSize: 14,
            color: colors.primaryStrong,
          }}
        >
          {marcado ? 'Abrir' : 'Contar'}
        </Text>
      </View>
    </Pressable>
  );
}

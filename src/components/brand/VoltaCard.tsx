import React from 'react';
import { Text, View } from 'react-native';

import { fonts, radius, useTema } from '../../theme';
import { Sprout } from './Sprout';

/**
 * O reencontro depois de uma ausência.
 *
 * Some sozinho: nasce de `diasSemAparecer`, que zera no instante em que a
 * pessoa registra qualquer coisa. Nada precisa ser guardado nem marcado como
 * visto — ela some porque a pessoa voltou mesmo, não porque fechou um aviso.
 *
 * O tom é a coisa toda aqui. Quem volta depois de dias já chega se cobrando;
 * qualquer "que bom que você lembrou de mim" vira culpa. O cartão só afirma um
 * fato — nada se perdeu — porque é verdade: a contagem do app nunca somou os
 * dias ausentes contra ninguém.
 */
export function VoltaCard({ dias }: { dias: number }) {
  const { colors, palette } = useTema();
  const tempo =
    dias >= 30
      ? 'um tempo'
      : dias >= 14
        ? 'duas semanas'
        : dias >= 7
          ? 'uma semana'
          : `${dias} dias`;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: colors.primarySoft,
        borderRadius: radius.lg,
        padding: 16,
      }}
      // Uma coisa só para o leitor de tela: separado em pedaços, ele leria
      // "que bom te ver" e "3 dias" como dois itens sem relação.
      accessible
      accessibilityLabel={`Que bom te ver de novo. Faz ${tempo}, e nada se perdeu.`}
    >
      <Sprout mood="feliz" stage={3} size={72} showPot={false} />

      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: fonts.display.bold, fontSize: 17, color: colors.primaryStrong }}>
          Que bom te ver de novo
        </Text>
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 14,
            lineHeight: 14 * 1.5,
            color: palette.brown700,
          }}
        >
          Faz {tempo}. Seu broto está exatamente onde você deixou — aqui a conta só soma os dias em
          que você aparece, nunca os que você faltou.
        </Text>
      </View>
    </View>
  );
}

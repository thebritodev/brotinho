import React from 'react';
import { Text, View } from 'react-native';

import { fonts, useTema } from '../../theme';
import { BalaoDoBroto } from './BalaoDoBroto';
import { Sprout } from './Sprout';

/**
 * InsightCard — o balão "Seu broto percebeu", trazendo um padrão notado no
 * diário/desabafos. Serve também à resposta depois de salvar um registro e ao
 * próximo passo da primeira semana: são todos ele falando.
 *
 * O nome já dizia "balão" e o desenho não era um: o broto e o texto dividiam
 * um cartão verde, sem bico e sem nada que dissesse quem estava falando. Com o
 * bico apontando para ele, a frase passa a ser dele — e não mais um aviso do
 * app com um desenho ao lado.
 */
export function InsightCard({ text }: { text: string }) {
  const { palette } = useTema();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 4,
        /*
          Centralizado, e não alinhado pelo topo.

          O broto tem altura fixa e o texto tem uma, duas ou três linhas. Preso
          ao topo, um texto curto ficava encostado na borda de cima com o broto
          sobrando embaixo — o cartão parecia torto. Centralizado, o texto
          acompanha o broto em qualquer tamanho, e é também o que mantém o bico
          na altura da cara dele.
        */
        alignItems: 'center',
      }}
    >
      <Sprout mood="leve" stage={2} size={56} showPot={false} />
      <BalaoDoBroto lado="esquerda" tom="suave" style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.5,
            color: palette.brown900,
          }}
        >
          {text}
        </Text>
      </BalaoDoBroto>
    </View>
  );
}

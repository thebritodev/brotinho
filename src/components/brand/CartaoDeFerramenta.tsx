import React from 'react';
import { Text, View } from 'react-native';

import { fonts, radius, useTema } from '../../theme';
import { Card } from '../core/Card';
import { Icon } from '../core/Icon';

/**
 * Um cartão do carrossel da tela inicial: disco com ícone, nome da ferramenta,
 * uma linha do que ela faz e, quando cabe, duas etiquetas.
 *
 * Nasceu do cartão da Composta, que já era assim e era o único. No carrossel
 * ele passa a ter irmãos, e o que era desenho de uma tela virou peça: mesma
 * estrutura, mesmo ritmo de leitura, mudando só o ícone, a cor do disco e o
 * texto. Sem isso, três cartões lado a lado seriam três desenhos diferentes
 * disputando a mesma fileira.
 *
 * `flex: 1` no cartão porque o carrossel estica a fileira até a altura do mais
 * alto — o cartão precisa ocupar a altura que recebeu, senão fica um branco
 * embaixo dele.
 */
export function CartaoDeFerramenta({
  desenho,
  titulo,
  texto,
  etiquetas = [],
  tom = 'cartao',
  onPress,
  label,
}: {
  /** A cena do cartão — ver `desenhosDoCarrossel`. */
  desenho: React.ReactNode;
  titulo: string;
  texto: string;
  /** Até duas, curtas. Elas dizem o custo da coisa: tempo, jeito. */
  etiquetas?: string[];
  tom?: 'cartao' | 'destaque';
  onPress: () => void;
  label: string;
}) {
  const { colors, palette } = useTema();

  return (
    <Card onPress={onPress} label={label} padding={18} tom={tom} style={{ flex: 1, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {desenho}

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.display.extraBold,
              fontSize: 19,
              color: tom === 'destaque' ? colors.primaryStrong : colors.textPrimary,
            }}
          >
            {titulo}
          </Text>
        </View>

        <Icon name="chevronRight" color={tom === 'destaque' ? colors.primaryStrong : palette.brown700} />
      </View>

      <Text
        style={{
          flex: 1,
          fontFamily: fonts.body.regular,
          fontSize: 14,
          lineHeight: 14 * 1.45,
          color: palette.brown700,
        }}
      >
        {texto}
      </Text>

      {etiquetas.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {etiquetas.map((etiqueta) => (
            <View
              key={etiqueta}
              style={{
                backgroundColor: colors.surface,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: radius.pill,
              }}
            >
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 12, color: palette.brown700 }}>
                {etiqueta}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

import React from 'react';
import { Text, View } from 'react-native';

import { MATURIDADE, STAGE_AT } from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import { Sprout, type SproutStage } from './Sprout';

/**
 * Onde o broto está no crescimento dele — os três estágios e a barra.
 *
 * ## Por que ele existe
 *
 * O app dizia o crescimento em três lugares e de três jeitos: "Broto" no
 * cabeçalho da aba, "faltam 7 dias" numa linha do jardim, e o tamanho do
 * desenho. Nenhum dos três mostrava **para onde** aquilo vai — e o que segura
 * alguém num app de hábito é justamente ver o próximo passo antes de chegar
 * nele. Aqui os três estágios aparecem juntos, com o de agora aceso e os
 * outros dois apagados.
 *
 * ## Por que dias, e não folhas
 *
 * O protótipo conta folhas: dez folhas viram um estágio, e cada prática vale
 * uma. É bonito e é errado para este app — aqui o crescimento é por **dia
 * cuidado**, não por volume, justamente para não premiar quem despeja tudo
 * numa terça e some. Ver `STAGE_AT`, em `derived`. A barra é contínua pelo
 * mesmo motivo: em dias, uma barra repartida em dez pedaços mentiria sobre o
 * tamanho de cada passo, que não é igual (três dias até Broto, sete até
 * Plantinha, onze até amadurecer).
 */

/** Os nomes dos três estágios, mais o fim do ciclo. */
export const NOMES_DOS_ESTAGIOS: string[] = ['Semente', 'Broto', 'Plantinha'];

type Props = {
  /** O estágio de agora. */
  estagio: SproutStage;
  /** Dias cuidados dentro do ciclo atual. */
  dias: number;
  /** Quantos faltam para o próximo passo — `null` quando já amadureceu. */
  faltam: number | null;
  /** O nome que a pessoa deu ao broto. */
  nome: string;
};

export function CartaoDosEstagios({ estagio, dias, faltam, nome }: Props) {
  const { colors, palette, shadows } = useTema();

  const proximo = NOMES_DOS_ESTAGIOS[estagio] ?? 'Florescer';
  const andado = Math.max(0, Math.min(1, dias / MATURIDADE));

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: 18,
        gap: 16,
        ...shadows.sm,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        {([1, 2, 3] as SproutStage[]).map((n) => {
          const chegou = n <= estagio;
          const agora = n === estagio;
          return (
            <View key={n} style={{ flex: 1, alignItems: 'center', gap: 4, opacity: chegou ? 1 : 0.4 }}>
              {/*
                O desenho parado, e não o animado.

                São três brotos lado a lado, e três respirações fora de fase na
                mesma linha viram tremor. O que está vivo nesta tela é o grande,
                lá em cima.
              */}
              <Sprout mood="leve" stage={n} size={64} />
              <Text
                style={{
                  fontFamily: fonts.body.extraBold,
                  fontSize: 13,
                  color: agora ? colors.primaryStrong : palette.brown400,
                }}
              >
                {NOMES_DOS_ESTAGIOS[n - 1]}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ gap: 8 }}>
        <View
          style={{
            height: 10,
            borderRadius: 5,
            backgroundColor: palette.cream300,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${andado * 100}%`,
              height: '100%',
              borderRadius: 5,
              backgroundColor: colors.primary,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[...NOMES_DOS_ESTAGIOS, 'Flor'].map((rotulo, i) => (
            <Text
              key={rotulo}
              style={{
                fontFamily: fonts.body.extraBold,
                fontSize: 12,
                color: i === estagio - 1 ? colors.primaryStrong : palette.brown400,
              }}
            >
              {rotulo}
            </Text>
          ))}
        </View>
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 14,
            lineHeight: 14 * 1.45,
            color: palette.brown700,
          }}
        >
          {faltam === null
            ? `${nome} já está pronto para ir para o jardim, e um novo começa.`
            : `${dias} ${dias === 1 ? 'dia' : 'dias'} de cuidado. `
              + `${faltam === 1 ? 'Falta 1 dia' : `Faltam ${faltam} dias`} para ${proximo.toLowerCase()}.`}
        </Text>
      </View>
    </View>
  );
}

/** Os dias em que cada estágio abre, para quem quiser desenhar a régua. */
export { STAGE_AT };

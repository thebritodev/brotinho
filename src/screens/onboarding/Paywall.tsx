import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../components';
import { colors, palette, fonts } from '../../theme';
import { PLANS, PRODUTO_DO_PLANO, type PlanKey } from '../../data/onboarding';
import { useAssinatura } from '../../state/SubscriptionProvider';

const planCardStyle = (selected: boolean, accent: boolean) => ({
  position: 'relative' as const,
  backgroundColor: accent ? palette.green50 : '#fff',
  borderRadius: 14,
  paddingVertical: 18,
  paddingHorizontal: 16,
  borderWidth: selected ? 2 : 1.5,
  borderColor: selected ? palette.green500 : palette.brown200,
  ...(selected
    ? {
        shadowColor: palette.brown900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 4,
      }
    : null),
});

const planRowStyle = (selected: boolean) => ({
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  gap: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 12,
  backgroundColor: '#fff',
  borderWidth: selected ? 2 : 1.5,
  borderColor: selected ? palette.green500 : palette.brown200,
});

type Props = {
  plan: PlanKey;
  onSelectPlan: (plan: PlanKey) => void;
};

/** Tela de planos — destaque para o anual, com mensal ao lado e as demais opções abaixo. */
export function Paywall({ plan, onSelectPlan }: Props) {
  const { planos } = useAssinatura();

  /**
   * O preço da loja tem precedência sobre o que está escrito aqui.
   *
   * Apple e Google exigem o valor que a própria loja informa: já convertido,
   * localizado e com o imposto da região. O texto fixo em Reais só aparece
   * quando não houve resposta da loja — no Expo Go, por exemplo — para a tela
   * não ficar vazia durante o desenvolvimento.
   */
  const daLoja = (chave: PlanKey) => planos.find((p) => p.id === PRODUTO_DO_PLANO[chave]);

  const preco = (chave: PlanKey) => daLoja(chave)?.preco ?? PLANS[chave].price;

  /**
   * O mesmo plano visto por mês.
   *
   * O cartão do anual mostrava o total do ano com a legenda "por mês": lia-se
   * "R$ 179,40 por mês", quase seis vezes o plano mensal ao lado. Num cartão
   * que existe para parecer o mais barato, o erro dizia o contrário.
   *
   * A loja já entrega esse valor diluído e formatado, então ele vem de lá.
   */
  const precoPorMes = (chave: PlanKey) =>
    daLoja(chave)?.precoMensal ?? PLANS[chave].precoMensal ?? PLANS[chave].price;

  return (
    <View style={{ gap: 22, paddingTop: 14, paddingBottom: 4 }}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View
          style={{
            backgroundColor: palette.amber100,
            paddingVertical: 6,
            paddingHorizontal: 14,
            borderRadius: 999,
          }}
        >
          <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 13, color: '#8a6318' }}>
            Oferta do plano anual
          </Text>
        </View>

        <Text
          style={{
            fontFamily: fonts.display.extraBold,
            fontSize: 52,
            lineHeight: 52 * 1.02,
            color: palette.green700,
            letterSpacing: -1,
            textAlign: 'center',
          }}
        >
          Economize{'\n'}50%
        </Text>

        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.5,
            color: palette.brown700,
            textAlign: 'center',
          }}
        >
          No plano anual você paga{' '}
          <Text style={{ fontFamily: fonts.body.extraBold }}>{preco('anual')} por ano</Text> em vez
          de {preco('mensal')} por mês.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSelectPlan('mensal')}
          style={[planCardStyle(plan === 'mensal', false), { flex: 1 }]}
        >
          <Text style={{ fontFamily: fonts.display.bold, fontSize: 17, color: palette.brown900 }}>
            Mensal
          </Text>
          <Text
            style={{
              fontFamily: fonts.display.extraBold,
              fontSize: 30,
              color: palette.brown900,
              marginTop: 8,
            }}
          >
            {preco('mensal')}
          </Text>
          <Text
            style={{ fontFamily: fonts.body.regular, fontSize: 13, color: palette.brown400, marginTop: 4 }}
          >
            por mês
          </Text>
          <View style={{ height: 1, backgroundColor: palette.brown100, marginVertical: 14 }} />
          <Text style={{ fontFamily: fonts.body.regular, fontSize: 13, color: palette.brown700 }}>
            {`${preco('mensal')} × 12 ao ano`}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => onSelectPlan('anual')}
          style={[planCardStyle(plan === 'anual', true), { flex: 1 }]}
        >
          <View
            style={{
              position: 'absolute',
              top: -11,
              alignSelf: 'center',
              backgroundColor: palette.green500,
              paddingVertical: 5,
              paddingHorizontal: 12,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.extraBold,
                fontSize: 11,
                letterSpacing: 0.3,
                color: '#fff',
              }}
            >
              MAIS POPULAR
            </Text>
          </View>

          <Text style={{ fontFamily: fonts.display.bold, fontSize: 17, color: palette.green700 }}>
            Anual
          </Text>
          <Text
            style={{
              fontFamily: fonts.display.extraBold,
              fontSize: 30,
              color: palette.green700,
              marginTop: 8,
            }}
          >
            {precoPorMes('anual')}
          </Text>
          <Text
            style={{ fontFamily: fonts.body.regular, fontSize: 13, color: palette.brown400, marginTop: 4 }}
          >
            por mês
          </Text>
          <View style={{ height: 1, backgroundColor: palette.green100, marginVertical: 14 }} />
          <Text style={{ fontFamily: fonts.body.regular, fontSize: 13, color: palette.brown700 }}>
            {`${preco('anual')} ao ano`}{'\n'}
            <Text style={{ color: palette.brown400, textDecorationLine: 'line-through' }}>
              {`${preco('mensal')} × 12`}
            </Text>
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 10 }}>
        <Text
          style={{
            fontFamily: fonts.body.extraBold,
            fontSize: 13,
            color: palette.brown400,
            letterSpacing: 0.4,
          }}
        >
          OUTRAS OPÇÕES
        </Text>
        <View style={{ gap: 8 }}>
          {(['semanal', 'vitalicio'] as PlanKey[]).map((key) => (
            <Pressable accessibilityRole="button" key={key} onPress={() => onSelectPlan(key)} style={planRowStyle(plan === key)}>
              <View style={{ gap: 2 }}>
                <Text
                  style={{ fontFamily: fonts.display.bold, fontSize: 15, color: palette.brown900 }}
                >
                  {PLANS[key].name}
                </Text>
                <Text
                  style={{ fontFamily: fonts.body.regular, fontSize: 13, color: palette.brown400 }}
                >
                  {PLANS[key].note}
                </Text>
              </View>
              <Text
                style={{ fontFamily: fonts.display.extraBold, fontSize: 17, color: palette.brown900 }}
              >
                {preco(key)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="lock" size={18} color={colors.primary} />
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.body.regular,
            fontSize: 13,
            lineHeight: 13 * 1.4,
            color: palette.brown700,
          }}
        >
          Cancele quando quiser. Sem multa, sem burocracia.
        </Text>
      </View>
    </View>
  );
}

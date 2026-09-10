import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../components';
import { fonts, radius, useTema, type Cores, type Palette, type Sombra, type Vidro } from '../../theme';
import { PLANS, PRODUTO_DO_PLANO, type PlanKey } from '../../data/onboarding';
import { useAssinatura } from '../../state/SubscriptionProvider';

/*
  As duas fábricas já eram função — só não recebiam as cores.

  O `'#fff'` de fundo virou `colors.surface`: no escuro, cartão branco sobre
  fundo escuro seria a única coisa acesa da tela.

  Agora recebem também o vidro e a sombra, que substituíram o branco chapado e
  o raio escrito à mão. Eram as duas últimas superfícies do app com raio fora
  da escada — 14 e 12, de quando o cartão era 12 — e por isso as únicas que
  ficariam com o canto do desenho antigo depois da mudança de geometria.
*/
type Vidros = { cartao: Vidro; destaque: Vidro };

const planCardStyle = (
  vidros: Vidros,
  sombra: Sombra,
  palette: Palette,
  selected: boolean,
  accent: boolean,
) => ({
  position: 'relative' as const,
  ...(accent ? vidros.destaque : vidros.cartao),
  borderRadius: radius.lg,
  paddingVertical: 18,
  paddingHorizontal: 16,
  borderWidth: selected ? 2 : 1.5,
  borderColor: selected ? palette.green500 : 'transparent',
  ...(selected ? sombra : null),
});

const planRowStyle = (vidros: Vidros, palette: Palette, selected: boolean) => ({
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  gap: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: radius.md,
  ...vidros.cartao,
  borderWidth: selected ? 2 : 1.5,
  borderColor: selected ? palette.green500 : 'transparent',
});

type Props = {
  plan: PlanKey;
  onSelectPlan: (plan: PlanKey) => void;
};

/** Tela de planos — destaque para o anual, com mensal ao lado e as demais opções abaixo. */
export function Paywall({ plan, onSelectPlan }: Props) {
  const { colors, palette, vidros, shadows } = useTema();
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
          <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 13, color: palette.amber700 }}>
            Oferta do plano anual
          </Text>
        </View>

        <Text
          style={{
            fontFamily: fonts.display.extraBold,
            fontSize: 52,
            /*
              1,18 e não 1,02. A Baloo 2 é alta — ascendentes e descendentes
              passam bastante do corpo —, e com a entrelinha colada no tamanho
              da letra o Android recorta o que sobra: o topo do "E" e o pé do
              "z" saíam cortados. Essa folga é o mínimo que a fonte pede.
            */
            lineHeight: 52 * 1.18,
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
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.extraBold }}>{preco('anual')} por ano</Text> em vez
          de {preco('mensal')} por mês.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSelectPlan('mensal')}
          style={[planCardStyle(vidros, shadows.md, palette, plan === 'mensal', false), { flex: 1 }]}
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
          style={[planCardStyle(vidros, shadows.md, palette, plan === 'anual', true), { flex: 1 }]}
        >
          <View
            style={{
              position: 'absolute',
              top: -11,
              alignSelf: 'center',
              backgroundColor: colors.primary,
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
                color: colors.textInverse,
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

      {/*
        Semanal e vitalício saíram daqui. Eram uma fileira "Outras opções"
        embaixo dos dois cartões, e com quatro preços na mesma tela a
        comparação que importa — mensal contra anual, que é onde está o
        "economize 50%" — ficava diluída entre opções que quase ninguém escolhe.
      */}
      {/*
        As duas garantias, na ordem em que pesam.

        A privacidade vem primeiro porque preocupação com dados é uma das causas
        nomeadas de abandono em app de saúde mental — e porque aqui ela é
        verdade rara: não existe servidor para onde mandar o diário. Isso estava
        dito só na tela de Privacidade, que quase ninguém abre antes de decidir
        pagar. Ver `docs/retencao.md`.
      */}
      <View style={{ gap: 12 }}>
        {(
          [
            ['lock', 'O que você escreve fica no seu aparelho. Não existe conta, nem servidor nosso: nem nós conseguimos ler.'],
            ['check', 'Cancele quando quiser. Sem multa, sem burocracia.'],
          ] as const
        ).map(([icone, texto]) => (
          <View key={texto} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name={icone} size={18} color={colors.primary} />
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.body.regular,
                fontSize: 13,
                lineHeight: 13 * 1.4,
                color: palette.brown700,
              }}
            >
              {texto}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

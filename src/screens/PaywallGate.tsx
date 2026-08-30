import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components';
import { PLANS, PRODUTO_DO_PLANO, type PlanKey } from '../data/onboarding';
import { Paywall } from './onboarding/Paywall';
import { useAssinatura } from '../state/SubscriptionProvider';
import { fonts, useTema } from '../theme';

/**
 * A tela que aparece para quem já usava o app e ficou sem assinatura —
 * cancelou, o cartão falhou, o período acabou.
 *
 * Os registros continuam no aparelho, intactos. O que some é o acesso, e o
 * texto diz isso: ameaçar apagar o diário de alguém para forçar a renovação
 * seria o oposto do que este app promete.
 */
export function PaywallGate() {
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();
  const { planos, comprar, restaurar } = useAssinatura();
  const [plano, setPlano] = useState<PlanKey>('anual');
  const [ocupado, setOcupado] = useState<'comprando' | 'restaurando' | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const detalhes = PLANS[plano];
  const daLoja = planos.find((p) => p.id === PRODUTO_DO_PLANO[plano]);

  const assinar = async () => {
    if (!daLoja) return setAviso('Não consegui falar com a loja. Tente de novo em instantes.');
    setAviso(null);
    setOcupado('comprando');
    const r = await comprar(daLoja.pacote);
    setOcupado(null);
    // Desistir no meio não merece aviso nenhum: foi uma escolha, não um erro.
    if (r === 'erro') setAviso('A compra não foi concluída. Nada foi cobrado.');
  };

  const recuperar = async () => {
    setAviso(null);
    setOcupado('restaurando');
    const ok = await restaurar();
    setOcupado(null);
    if (!ok) setAviso('Não encontrei uma assinatura ativa nesta conta da loja.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 6 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.bold, fontSize: 24, lineHeight: 24 * 1.2 }}>
          Sua assinatura terminou
        </Text>
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.5,
            color: palette.brown700,
          }}
        >
          Seus registros continuam aqui no aparelho, do jeito que você deixou. É só
          retomar para voltar a acessá-los.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <Paywall plan={plano} onSelectPlan={setPlano} />
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 18 + insets.bottom,
          gap: 8,
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        {!!aviso && (
          <Text
            style={{
              fontFamily: fonts.body.bold,
              fontSize: 13,
              color: colors.danger,
              textAlign: 'center',
            }}
          >
            {aviso}
          </Text>
        )}

        <Button
          size="lg"
          style={{ width: '100%' }}
          disabled={!!ocupado}
          onPress={assinar}
        >
          {ocupado === 'comprando' ? 'Abrindo a loja…' : detalhes.cta}
        </Button>

        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 12,
            lineHeight: 12 * 1.45,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          {detalhes.fine}
        </Text>

        <Pressable accessibilityRole="button" onPress={recuperar} disabled={!!ocupado} style={{ padding: 8 }}>
          {ocupado === 'restaurando' ? (
            <ActivityIndicator color={colors.primaryStrong} />
          ) : (
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 14, color: colors.primaryStrong }}
            >
              Já assinei · restaurar compra
            </Text>
          )}
        </Pressable>

        {Platform.OS === 'ios' && (
          <Text
            style={{ fontFamily: fonts.body.regular, fontSize: 11, color: palette.brown400 }}
          >
            Gerencie ou cancele nos Ajustes do seu Apple ID.
          </Text>
        )}
      </View>
    </View>
  );
}

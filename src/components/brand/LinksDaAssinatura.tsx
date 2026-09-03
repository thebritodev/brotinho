import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { fonts, useTema } from '../../theme';

/**
 * Os dois links que a Apple exige numa tela de assinatura.
 *
 * A diretriz 3.1.2 pede que, **antes da compra**, a tela mostre o nome da
 * assinatura, a duração, o preço, e links funcionais para os termos de uso e
 * para a política de privacidade. Os três primeiros já estavam lá; os dois
 * links não estavam em nenhum dos dois paywalls, e a falta deles é uma das
 * rejeições automáticas mais comuns da categoria.
 *
 * ## Por que os termos apontam para a Apple
 *
 * O Brotinho não tem contrato próprio de licença, e a própria Apple resolve
 * esse caso: quem não escreve o seu usa o padrão dela, o *Licensed Application
 * End User License Agreement*. O link abaixo é o endereço oficial desse texto,
 * e é o que a revisão espera encontrar de um app sem EULA próprio.
 *
 * ## Por que a privacidade abre dentro do app
 *
 * Porque o texto mora aqui, inteiro, em `data/privacyPolicy.ts` — e porque o
 * app não tem site. Um link para fora exigiria hospedar a mesma política num
 * endereço público e mantê-la igual em dois lugares; um deles ficaria velho, e
 * seria justamente o que a pessoa lê.
 *
 * Vale notar para o preenchimento da loja: a ficha do App Store Connect pede
 * uma URL de política, e essa é a única cópia que precisa existir na web.
 */

/** O contrato padrão da Apple, para apps sem EULA próprio. */
const EULA_PADRAO = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export function LinksDaAssinatura({ aoAbrirPolitica }: { aoAbrirPolitica: () => void }) {
  const { colors } = useTema();

  const estilo = {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'underline' as const,
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Termos de uso"
        hitSlop={10}
        // Falhar em silêncio: sem navegador o link não abre, e um alerta em
        // cima do paywall assustaria por causa de um contrato que ninguém
        // estava tentando ler.
        onPress={() => void Linking.openURL(EULA_PADRAO).catch(() => {})}
      >
        <Text style={estilo}>Termos de uso</Text>
      </Pressable>

      <Text style={{ fontFamily: fonts.body.regular, fontSize: 12, color: colors.textSecondary }}>
        ·
      </Text>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Política de privacidade"
        hitSlop={10}
        onPress={aoAbrirPolitica}
      >
        <Text style={estilo}>Política de privacidade</Text>
      </Pressable>
    </View>
  );
}

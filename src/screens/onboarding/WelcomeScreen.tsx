import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, TrazerDeVolta, WindowScene } from '../../components';
import { colors, palette, radius, fonts } from '../../theme';

/**
 * Boas-vindas — a primeira tela de quem abre o app.
 *
 * Não pede conta nem e-mail porque não existe conta: nada do que a pessoa
 * escreve sai do aparelho, e é isso que o app promete no Sobre e na política
 * de privacidade. Em vez de um "entrar" que não teria onde entrar, o segundo
 * botão explica como os registros voltam depois de reinstalar.
 */
export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [explicando, setExplicando] = useState(false);
  /**
   * A confirmação da volta ocupa o mesmo modal, como segundo passo.
   *
   * Enquanto ela está na frente, a explicação some: dois assuntos empilhados
   * num modal só é o que já tinha dado errado quando eram dois modais.
   */
  const [confirmandoVolta, setConfirmandoVolta] = useState(false);

  const fecharExplicacao = () => {
    setExplicando(false);
    setConfirmandoVolta(false);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 24 + insets.bottom,
          justifyContent: 'space-between',
        }}
        showsVerticalScrollIndicator={false}
      >
        <WindowScene width={width} />

        <View style={{ paddingHorizontal: 24, gap: 12, marginTop: 8 }}>
          <Text
            style={{
              fontFamily: fonts.display.extraBold,
              fontSize: 30,
              lineHeight: 30 * 1.2,
              textAlign: 'center',
            }}
          >
            Um lugar só seu para deixar o que pesa
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 16,
              lineHeight: 16 * 1.55,
              color: palette.brown700,
              textAlign: 'center',
            }}
          >
            Fale, escreva, respire. O broto cresce conforme você aparece — e o que você contar não
            sai deste aparelho.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 24, gap: 10, marginTop: 22 }}>
          <Button size="lg" style={{ width: '100%' }} onPress={onStart}>
            Começar
          </Button>
          <Pressable
            accessibilityRole="button"
            onPress={() => setExplicando(true)}
            style={{ paddingVertical: 12, alignItems: 'center' }}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 15,
                color: colors.primaryStrong,
              }}
            >
              Já usei o Brotinho antes
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={explicando}
        transparent
        animationType="fade"
        onRequestClose={fecharExplicacao}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 22 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={fecharExplicacao}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.45)' }]}
          />
          <View
            style={{
              backgroundColor: colors.bg,
              borderRadius: radius.lg,
              padding: 22,
              gap: 12,
            }}
          >
            {!confirmandoVolta && (
              <Text style={{ fontFamily: fonts.display.bold, fontSize: 21 }}>
                Seus registros voltam sozinhos
              </Text>
            )}
            {!confirmandoVolta && (
              <>
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 15,
                    lineHeight: 15 * 1.55,
                    color: palette.brown700,
                  }}
                >
                  O Brotinho não tem login, e isso é de propósito: sem conta e sem servidor, não
                  existe cópia do seu diário em lugar nenhum além do seu celular.
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 15,
                    lineHeight: 15 * 1.55,
                    color: palette.brown700,
                  }}
                >
                  Se você reinstalou no mesmo aparelho, ou trocou de celular restaurando o backup do
                  sistema, seus registros voltam junto com ele. É só continuar daqui.
                </Text>

                {/* A saída para quem o backup não cobriu.
                
                Ela também mora em Privacidade, e só ali seria inútil: quem
                acabou de reinstalar está exatamente aqui, e Privacidade fica
                atrás dos catorze passos do onboarding e do paywall. Quem mais
                precisa dela seria quem menos conseguiria chegar. */}
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 15,
                    lineHeight: 15 * 1.55,
                    color: palette.brown700,
                  }}
                >
                  E se não voltaram: a cópia de segurança que você tenha baixado daqui traz tudo
                  de volta.
                </Text>
              </>
            )}

            <TrazerDeVolta aparencia="botao" aoMudarConfirmacao={setConfirmandoVolta} />

            {!confirmandoVolta && (
              <Button variant="ghost" style={{ width: '100%' }} onPress={fecharExplicacao}>
                Entendi
              </Button>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

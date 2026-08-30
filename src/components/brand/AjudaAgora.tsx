import React, { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, radius, useTema } from '../../theme';
import { Button } from '../core/Button';
import { Icon } from '../core/Icon';

/**
 * Um caminho curto até o CVV, de dentro das telas onde a pessoa está quando pesa.
 *
 * O telefone existia só na tela Sobre e na política de privacidade — as duas
 * atrás de Perfil → Configurações. Quem está em sofrimento agudo, às três da
 * manhã, escrevendo no diário, não navega três telas para achar um número.
 *
 * ---
 *
 * **O que este componente deliberadamente não faz: ler o que a pessoa escreveu.**
 *
 * A tentação óbvia seria detectar palavras de risco no texto e oferecer ajuda
 * sozinho. É onde esse tipo de recurso erra feio nos dois sentidos: um alarme
 * falso invade quem estava só desabafando — e num app cuja promessa é que
 * ninguém lê o que ela escreve, o app se denunciar lendo é pior que o alarme.
 * E o silêncio no caso contrário dá uma sensação de rede de proteção que não
 * existe.
 *
 * Então o convite fica **sempre visível e sempre igual**, e quem decide é ela.
 *
 * O tom evita a palavra "crise" na porta de entrada de propósito: quem está mal
 * frequentemente não se reconhece em crise, e um rótulo pesado afasta em vez de
 * acolher. "Se estiver muito pesado" cabe em mais gente.
 *
 * ---
 *
 * **Por que ela parece um link, e não um texto solto.** A primeira versão era só
 * a metade da frase — "Se estiver muito pesado agora" — em negrito cinza, logo
 * abaixo do botão de salvar. Três problemas de uma vez: condição sem
 * consequência, então a pessoa tinha de adivinhar o destino; nenhuma pista de
 * que dava para tocar; e negrito com cinza-apagado ao mesmo tempo, que é o
 * "repare em mim" e o "me ignore" se anulando.
 *
 * Agora fecha a frase — "tem quem escute" promete uma pessoa, sem rotular a
 * porta — e usa o mesmo verde de link que o app já usa em toda parte. Continua
 * discreta: aqui discrição é respeito, não timidez de design.
 */

const TELEFONE = '188';
const SITE = 'https://cvv.org.br';

export function AjudaAgora({ aoFazerExercicio }: { aoFazerExercicio?: () => void }) {
  const { colors, palette } = useTema();
  const [aberto, setAberto] = useState(false);

  const abrir = (url: string) => {
    void Linking.openURL(url).catch(() => {
      // Aparelho sem telefone, ou sem navegador: o número continua na tela,
      // legível, para a pessoa discar onde quiser.
    });
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Se estiver muito pesado agora, tem quem escute"
        onPress={() => setAberto(true)}
        hitSlop={10}
        style={{
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          paddingVertical: 10,
          paddingHorizontal: 8,
        }}
      >
        <Icon name="heart" size={16} color={colors.primaryStrong} strokeWidth={2.2} />
        <Text
          style={{
            fontFamily: fonts.body.bold,
            fontSize: 13,
            lineHeight: 13 * 1.4,
            color: colors.primaryStrong,
            textAlign: 'center',
          }}
        >
          Se estiver muito pesado agora, tem quem escute
        </Text>
      </Pressable>

      <Modal
        visible={aberto}
        transparent
        animationType="fade"
        onRequestClose={() => setAberto(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 22 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => setAberto(false)}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.5)' }]}
          />

          <View
            style={{ backgroundColor: colors.bg, borderRadius: radius.lg, padding: 22, gap: 14 }}
          >
            <Text style={{ fontFamily: fonts.display.bold, fontSize: 21 }}>
              Você não precisa segurar isso sozinho
            </Text>

            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.55,
                color: palette.brown700,
              }}
            >
              O CVV atende de graça, 24 horas por dia, todos os dias — por telefone, por chat
              e por e-mail. Quem atende é voluntário, e a conversa é sigilosa.
            </Text>

            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.55,
                color: palette.brown700,
              }}
            >
              Não é preciso estar em crise para ligar.
            </Text>

            <View style={{ gap: 10, marginTop: 4 }}>
              <Button
                variant="primary"
                style={{ width: '100%' }}
                onPress={() => abrir(`tel:${TELEFONE}`)}
              >
                Ligar para o 188
              </Button>
              <Button variant="ghost" style={{ width: '100%' }} onPress={() => abrir(SITE)}>
                Conversar por chat em cvv.org.br
              </Button>

              {/* A saída para quem abriu esta porta e não está pronta para falar
                  com ninguém. Antes ela não recebia nada e só podia fechar. Vem
                  depois do CVV de propósito: a pessoa continua vindo primeiro. */}
              {!!aoFazerExercicio && (
                <>
                  <Text
                    style={{
                      fontFamily: fonts.body.regular,
                      fontSize: 13,
                      lineHeight: 13 * 1.5,
                      color: colors.textSecondary,
                      marginTop: 6,
                    }}
                  >
                    E se você não quiser falar com ninguém agora:
                  </Text>
                  <Button
                    variant="secondary"
                    style={{ width: '100%' }}
                    onPress={() => {
                      setAberto(false);
                      aoFazerExercicio();
                    }}
                  >
                    Fazer um exercício comigo
                  </Button>
                </>
              )}

              <Button variant="ghost" style={{ width: '100%' }} onPress={() => setAberto(false)}>
                Agora não
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

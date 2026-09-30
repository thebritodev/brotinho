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

import {
  AnimatedSprout,
  BalaoDoBroto,
  Button,
  Cena,
  CRISTA_DO_MORRO,
  TrazerDeVolta,
} from '../../components';
import { NA_CHEGADA } from '../../data/falasDoBroto';
import { fonts, radius, useTema } from '../../theme';

/**
 * Boas-vindas — a primeira tela de quem abre o app.
 *
 * Não pede conta nem e-mail porque não existe conta: nada do que a pessoa
 * escreve sai do aparelho, e é isso que o app promete no Sobre e na política
 * de privacidade. Em vez de um "entrar" que não teria onde entrar, o segundo
 * botão explica como os registros voltam depois de reinstalar.
 *
 * ## O que mudou no redesenho
 *
 * A janela com as plantas saiu, e no lugar entrou o **broto acenando numa
 * cena**. A janela era bonita e era um lugar — mas era um lugar sem ninguém
 * dentro, e a primeira tela do app é onde o personagem precisa aparecer
 * primeiro. Quem chega agora é cumprimentado por alguém, não recebido por uma
 * paisagem.
 *
 * O céu daqui é azul fixo, e não o do humor: ninguém disse ainda como está.
 */
export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  /*
    A cena ocupa a metade de cima, e não uma altura fixa.

    540 sobre 844 é o que o documento desenha — pouco menos de dois terços.
    Escrito como número fixo, num aparelho curto ela empurraria o botão para
    fora da tela, e num alto sobraria uma faixa de céu sem nada. Como fração,
    o enquadramento é o mesmo em qualquer aparelho.
  */
  const alturaDaCena = Math.max(320, Math.min(height * 0.62, 560));
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
        {/*
          A arte e a promessa são um bloco só, e isso é o que conserta a tela.

          Eram três filhos soltos num `space-between`: desenho, texto, botões.
          Num aparelho alto a sobra se parte em **duas** — cento e quarenta
          pontos entre o desenho e o título, cento e setenta entre o texto e o
          botão. Um terço da primeira tela do app era buraco, e buraco no meio
          de uma composição não lê como respiro, lê como inacabado.

          Com dois filhos a sobra vai para um lugar só, e ela cai no lugar
          certo: acima do botão. O texto encosta no desenho e vira legenda
          dele, que é o que ele sempre foi.
        */}
        <View>
          <View style={{ height: alturaDaCena }}>
            <Cena
              largura={width}
              altura={alturaDaCena}
              ceu={palette.blue100}
              chao="grama"
              capim
            />
            {/*
              O broto no meio, com os pés na crista do morro.

              `size` é a largura de referência do desenho: 270 são os 1,35 de
              escala do documento sobre as 200 unidades do enquadramento.
            */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: CRISTA_DO_MORRO.grama,
                alignItems: 'center',
              }}
            >
              <AnimatedSprout mood="feliz" stage={1} pose="acena" size={270} />
            </View>
            {/*
              O balão fica à esquerda do broto e aponta para ele.

              Ele sai do alinhamento do texto de baixo de propósito: fala não é
              parágrafo, e um balão alinhado à margem lê como legenda.
            */}
            <BalaoDoBroto
              lado="esquerda"
              style={{ position: 'absolute', right: 20, top: alturaDaCena * 0.42, maxWidth: 190 }}
            >
              <Text
                style={{
                  fontFamily: fonts.body.bold,
                  fontSize: 14.5,
                  lineHeight: 14.5 * 1.35,
                  color: colors.textPrimary,
                }}
              >
                {NA_CHEGADA}
              </Text>
            </BalaoDoBroto>
          </View>

          <View style={{ paddingHorizontal: 24, gap: 12, marginTop: 28 }}>
            <Text
              style={{
                color: palette.brown400,
                fontFamily: fonts.display.bold,
                fontSize: 24,
                lineHeight: 24 * 1.2,
              }}
            >
              Oi, eu sou o Brotinho
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: fonts.display.extraBold,
                fontSize: 30,
                lineHeight: 30 * 1.2,
              }}
            >
              Vou crescer junto com você, um dia de cada vez
            </Text>
            {/*
              O subtítulo diz o que o desenho não consegue.

              Ele era "Fale, escreva, respire. O broto cresce conforme você
              aparece — e o que você contar não sai deste aparelho." Falar,
              escrever e respirar é o que todo app de bem-estar faz, e o broto
              crescendo já está desenhado bem ali em cima, na janela. Das três
              frases, duas gastavam espaço com o que a imagem já mostra ou com
              o que não separa o Brotinho de ninguém.

              O que ele tem e mais ninguém tem é a Composta — repetir em voz
              alta até a frase virar só som —, e a pessoa vai **fazer** isso no
              sétimo passo. Anunciar aqui é a diferença entre entrar num diário
              e entrar para experimentar uma coisa que não dá para entender
              lendo.

              A privacidade fica, e fica por último: ela não traz ninguém para
              dentro, mas é o que tira o medo de começar a escrever.
            */}
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 16,
                lineHeight: 16 * 1.55,
                color: palette.brown700,
              }}
            >
              Escreva ou fale o que passou hoje. E repita em voz alta o pensamento que te
              persegue, até ele virar só som. Nada disso sai do seu aparelho.
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, gap: 10, marginTop: 32 }}>
          <Button size="lg" style={{ width: '100%' }} onPress={onStart}>
            Oi, Brotinho
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
              <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.bold, fontSize: 21 }}>
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

import React from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedSprout,
  BalaoDoBroto,
  Card,
  Cena,
  Icon,
  TopBar,
  useCompartilharFrase,
} from '../../components';
import { CONSELHOS, entreAspas } from '../../data/conselhos';
import { NAS_GUARDADAS_VAZIO, ehNoite } from '../../data/falasDoBroto';
import { useAppState } from '../../state/AppStateProvider';
import { TEXTO_NO_CEU } from '../../components/brand/ceuDaComposta';
import { fonts, useTema } from '../../theme';
import { CRISTA_DO_MORRO } from '../../components/brand/Cena';
import {
  CX,
  POT_TOP_Y,
  noQuadro,
  quadroDoBroto,
} from '../../components/brand/geometriaDoBroto';
import { POR_TRAS_DA_BARRA } from '../../components/navigation/BottomNav';

/**
 * As frases que a pessoa guardou, para reler.
 *
 * ## Por que uma tela e não uma seção do Jardim
 *
 * O Jardim guarda plantas maduras: coisas que a pessoa **fez crescer**, com
 * dias contados e humor do período. Frase guardada é o contrário — ela não fez,
 * ela achou. Empilhar as duas na mesma tela faria o Jardim significar só
 * "coisas salvas", e ele hoje significa uma coisa mais precisa que isso.
 *
 * ## A ordem, e por que "tirar" fica aqui
 *
 * Mais recente primeiro: quem volta aqui costuma querer a de ontem, não a de
 * março. E tirar da lista tem de ser possível **de dentro da lista**, senão a
 * única forma de desguardar uma frase seria esperar ela voltar a sair no
 * sorteio do dia — o que pode levar vinte dias.
 */
export function ConselhosGuardadosScreen({ onBack }: { onBack: () => void }) {
  const { colors, shadows } = useTema();
  const insets = useSafeAreaInsets();
  const { width: largura } = useWindowDimensions();
  const { data, guardarConselho } = useAppState();
  const story = useCompartilharFrase();

  /*
    Casa id com texto na hora de mostrar, e descarta em silêncio o que não
    existe mais. O saneamento de propósito não filtra ids desconhecidos: uma
    frase pode sair numa atualização e voltar na seguinte, e apagar o que a
    pessoa guardou por causa disso seria irreversível.
  */
  const guardadas = data.conselhosGuardados
    .map((id) => CONSELHOS.find((c) => c.id === id))
    .filter((c): c is (typeof CONSELHOS)[number] => Boolean(c));

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Frases guardadas" onBack={onBack} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32 + insets.bottom + POR_TRAS_DA_BARRA,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        {guardadas.length === 0 ? (
          <View style={{ alignItems: 'center', gap: 18, marginTop: 8 }}>
            {/*
              O vazio era uma elipse de terra, e sozinha ela não dizia nada —
              no tema escuro virava literalmente uma mancha cinza no meio de
              uma tela preta. O que faltava é o que falta em qualquer tela
              vazia: alguém dizendo que o vazio é normal.

              O broto espera numa cena como a dos lembretes. Ele não está
              triste por não ter frase guardada; está de olho, que é o que a
              fala promete.
            */}
            <VazioComBroto largura={largura} />
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.55,
                color: colors.textSecondary,
                textAlign: 'center',
                maxWidth: 280,
              }}
            >
              Nada guardado ainda. Quando uma frase te acertar, toque em Guardar e ela fica aqui.
            </Text>
          </View>
        ) : (
          guardadas.map((c) => (
            <Card key={c.id} padding={18} style={{ gap: 12, ...shadows.md }}>
              {/*
                A aspa grande de abertura, atrás do texto.

                Ela não repete as aspas da frase: é textura, e serve para o
                cartão ter um assunto visual próprio numa tela que, de outro
                jeito, é uma pilha de parágrafos iguais. Fica com opacidade
                baixa de propósito — quem lê tem de ler a frase, não a aspa.
              */}
              <Text
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                  position: 'absolute',
                  top: -6,
                  left: 10,
                  fontFamily: fonts.display.bold,
                  fontSize: 64,
                  lineHeight: 72,
                  color: colors.primaryStrong,
                  opacity: 0.09,
                }}
              >
                {'“'}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 15,
                  lineHeight: 15 * 1.55,
                  color: colors.textPrimary,
                }}
              >
                {entreAspas(c.texto)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tirar das guardadas"
                  onPress={() => guardarConselho(c.id)}
                  /* Área de toque maior que o ícone: 19px é alvo pequeno demais. */
                  hitSlop={10}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Icon name="heart" size={19} color={colors.primaryStrong} />
                  <Text
                    style={{
                      fontFamily: fonts.body.extraBold,
                      fontSize: 14,
                      color: colors.primaryStrong,
                    }}
                  >
                    Guardada
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Compartilhar esta frase como imagem"
                  onPress={() => story.compartilhar(c.texto)}
                  disabled={story.compartilhando}
                  hitSlop={10}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                    opacity: story.compartilhando ? 0.5 : pressed ? 0.6 : 1,
                  })}
                >
                  <Icon name="compartilhar" size={19} color={colors.textSecondary} />
                  <Text
                    style={{
                      fontFamily: fonts.body.extraBold,
                      fontSize: 14,
                      color: colors.textSecondary,
                    }}
                  >
                    {story.compartilhando ? 'Preparando…' : 'Compartilhar'}
                  </Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}

        {!!story.aviso && (
          <Text
            accessibilityLiveRegion="polite"
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 13,
              lineHeight: 13 * 1.45,
              color: colors.textSecondary,
            }}
          >
            {story.aviso}
          </Text>
        )}
      </ScrollView>

      {/* O card do story, fora da tela, só enquanto está sendo fotografado. */}
      {story.palco}
      {story.folha}
    </View>
  );
}

/**
 * O estado vazio: o broto num canteiro onde ainda não nasceu nada.
 *
 * ## Por que a cena, e não só o desenho
 *
 * O canteiro de antes era uma elipse de terra com um fio de luz em cima. Ela
 * dizia "aqui não tem nada" e parava aí — e no tema escuro nem isso, porque
 * um marrom claro recortado num fundo quase preto lê como erro de
 * carregamento, não como canteiro.
 *
 * A cena é a mesma dos Lembretes: céu, morro e grama, com o broto em pé. O
 * que muda é a pose — ali ele dorme, aqui ele acena —, e é a pose que faz o
 * vazio virar espera em vez de ausência.
 *
 * ## Por que o céu é o de um dia leve
 *
 * Porque esta tela não sabe o humor de hoje e não deve saber: ela é a
 * estante de frases, não o registro do dia. Um céu que anoitecesse com o
 * relógio tiraria a única coisa que a cena precisa dizer, que é "ainda dá
 * tempo".
 */
/** O broto desta cena, em pixels. */
const TAMANHO_DO_BROTO = 112;

function VazioComBroto({ largura }: { largura: number }) {
  /* Sangra os 20 de recuo da lista: a paisagem vai de ponta a ponta. */
  const altura = 200;

  /*
    O broto à direita e o balão à esquerda, como na faixa da tela inicial.

    Centrado, ele ficava debaixo do próprio balão — e um balão em cima da
    cabeça de quem fala é a única posição em que o bico deixa de apontar para
    alguém. Com ele de lado, o bico aponta de volta e a frase tem para onde
    crescer.
  */
  const xDoBroto = largura * 0.72;
  /*
    O pé da haste pousa na crista do morro, e não no fim da faixa.

    É a mesma conta da faixa da tela inicial: `noQuadro` diz onde, dentro do
    quadro do desenho, cai o ponto em que a planta encosta no chão — as folhas
    descem abaixo dele. Ancorar pelo fim da caixa deixava o broto enterrado até
    as folhas, porque o morro sobe no meio da cena.
  */
  const quadro = quadroDoBroto(2, TAMANHO_DO_BROTO, { showPot: false });
  const pe = noQuadro(quadro, CX, POT_TOP_Y);
  const chao = altura - CRISTA_DO_MORRO.grama;
  return (
    <View style={{ width: largura, height: altura, marginHorizontal: -20 }}>
      <Cena
        largura={largura}
        altura={altura}
        humor="leve"
        noite={ehNoite(new Date())}
        chao="grama"
        capim
        xDoBroto={xDoBroto}
      />
      <View
        style={{
          position: 'absolute',
          left: xDoBroto - quadro.largura / 2,
          top: chao - pe.y,
        }}
      >
        <AnimatedSprout
          mood="leve"
          stage={2}
          size={TAMANHO_DO_BROTO}
          pose="acena"
          showPot={false}
        />
      </View>
      <BalaoDoBroto
        lado="direita"
        tom="noCeu"
        style={{
          position: 'absolute',
          left: 20,
          top: chao - pe.y + 10,
          maxWidth: Math.max(140, xDoBroto - quadro.largura / 2 - 36),
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body.bold,
            fontSize: 14,
            lineHeight: 14 * 1.35,
            color: TEXTO_NO_CEU,
          }}
        >
          {NAS_GUARDADAS_VAZIO}
        </Text>
      </BalaoDoBroto>
    </View>
  );
}

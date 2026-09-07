import React, { useId } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import { Card, Icon, TopBar, useCompartilharFrase } from '../../components';
import { CONSELHOS, entreAspas } from '../../data/conselhos';
import { useAppState } from '../../state/AppStateProvider';
import { fonts, tracos, useTema } from '../../theme';

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
  const { colors, palette, shadows } = useTema();
  const insets = useSafeAreaInsets();
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
          paddingBottom: 32 + insets.bottom,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        {guardadas.length === 0 ? (
          <View style={{ alignItems: 'center', gap: 18, marginTop: 40 }}>
            {/* Um canteiro fechado: nada foi desenterrado ainda. */}
            <CanteiroVazio />
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
    </View>
  );
}

/**
 * O canteiro intacto do estado vazio.
 *
 * Mesma linguagem do cartão da Home — terra com luz em cima e sombra embaixo —,
 * só que sem a saliência: aqui nada empurra por baixo, porque a pessoa ainda
 * não guardou nada. O desenho diz o que a frase diz, e diz antes dela.
 */
function CanteiroVazio() {
  const { palette } = useTema();
  /* Id por instância: `url(#...)` não tem escopo — a regra está no `Sprout`. */
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg viewBox="0 0 140 80" width={140} height={80}>
      <Defs>
        <RadialGradient id={`vazio-sombra-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={tracos.contorno} stopOpacity={0.2} />
          <Stop offset="1" stopColor={tracos.contorno} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={70} cy={64} rx={62} ry={10} fill={`url(#vazio-sombra-${id})`} />
      <Ellipse cx={70} cy={54} rx={54} ry={17} fill={palette.brown200} />
      <Path
        d="M22 50 Q70 35 118 50"
        stroke={palette.brown100}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
    </Svg>
  );
}

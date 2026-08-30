import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { AnimatedSprout, Button, Chip, Icon } from '../../components';
import { borderWidth, fonts, radius, useTema } from '../../theme';
import { FallingWords } from '../composta/FallingWords';

/**
 * O experimento: a pessoa composta um pensamento antes de decidir pagar.
 *
 * Era a lacuna maior do onboarding — dez telas de pergunta e uma conta no
 * fim, sem nunca ter usado o app. E a tese do Brotinho é justamente a que não
 * dá para entender lendo: repetir a frase até ela virar só som.
 *
 * A repetição é por toque, não por voz. Pedir microfone no meio do onboarding
 * é atrito, e quem negasse a permissão perderia justamente o momento que
 * justifica o preço.
 *
 * Por isso NENHUM texto daqui afirma que a pessoa falou: o app não tem como
 * saber. Falar em voz alta é convite, com o motivo explicado; o toque conta
 * só como leitura, que é o que ele de fato é. Afirmar uma experiência que não
 * aconteceu seria mentir para ela logo na porta de entrada.
 */

/** Repetições até a frase se desmanchar. */
const ALVO = 6;

const SUGESTOES = ['Vou decepcionar todo mundo', 'Não sou bom o bastante', 'Vai dar tudo errado'];

type Props = {
  thought: string;
  onChangeThought: (t: string) => void;
  /** Sobe a cada repetição; o pai guarda para o passo não reiniciar ao voltar. */
  reps: number;
  onRep: () => void;
};

export function ExperimentoComposta({ thought, onChangeThought, reps, onRep }: Props) {
  const { colors, palette, shadows } = useTema();
  const { width } = useWindowDimensions();
  const [escrevendo, setEscrevendo] = useState(!thought.trim());

  const frase = thought.trim();
  const pronto = reps >= ALVO;

  /**
   * As palavras desbotam da esquerda para a direita conforme as repetições —
   * a frase se desfaz na ordem em que é lida.
   */
  const palavras = useMemo(() => {
    const raw = frase.split(/\s+/).filter(Boolean);
    const decay = Math.min(1, reps / ALVO);
    return raw.map((text, i) => {
      const atraso = i * (0.5 / Math.max(1, raw.length - 1));
      const t = Math.max(0, Math.min(1, decay * 1.5 - atraso));
      return { text, opacity: 1 - 0.9 * t, dy: t * 8 };
    });
  }, [frase, reps]);

  if (escrevendo) {
    return (
      <View style={{ gap: 16 }}>
        <Text
          style={{
            color: colors.textPrimary,
            fontFamily: fonts.display.bold,
            fontSize: 21,
            lineHeight: 21 * 1.26,
            textAlign: 'center',
          }}
        >
          Qual frase tem repetido na sua cabeça?
        </Text>
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 14,
            lineHeight: 14 * 1.5,
            color: palette.brown700,
            textAlign: 'center',
          }}
        >
          Escreva do jeito que ela aparece, sem suavizar. Ela não sai deste aparelho.
        </Text>

        <TextInput
          value={thought}
          onChangeText={onChangeThought}
          placeholder="Ex: nunca vou dar conta"
          placeholderTextColor={colors.textSecondary}
          multiline
          style={{
            minHeight: 84,
            fontFamily: fonts.body.regular,
            fontSize: 16,
            lineHeight: 16 * 1.5,
            color: palette.brown900,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth,
            borderColor: colors.border,
            padding: 14,
            includeFontPadding: false,
            textAlignVertical: 'top',
          }}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {SUGESTOES.map((s) => (
            <Chip key={s} onPress={() => onChangeThought(s)} style={{ paddingVertical: 9 }}>
              {s}
            </Chip>
          ))}
        </View>

        <Button
          variant="secondary"
          style={{ width: '100%' }}
          disabled={!frase}
          onPress={() => setEscrevendo(false)}
        >
          Estou pronto
        </Button>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <Text
        style={{
          color: colors.textPrimary,
          fontFamily: fonts.display.bold,
          fontSize: 20,
          lineHeight: 20 * 1.26,
          textAlign: 'center',
        }}
      >
        {pronto ? 'Repare no que sobrou' : 'Leia a frase e toque a cada vez'}
      </Text>

      {!pronto && (
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 13,
            lineHeight: 13 * 1.5,
            color: palette.brown700,
            textAlign: 'center',
          }}
        >
          Se estiver num lugar onde dá, diga em voz alta — funciona bem melhor. Se não
          der, leia devagar.
        </Text>
      )}

      {/* A frase, se desmanchando. As palavras caem por cima dela. */}
      <View style={{ width: '100%', minHeight: 116, justifyContent: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            paddingVertical: 18,
            paddingHorizontal: 16,
            ...shadows.sm,
          }}
        >
          {palavras.map((p, i) => (
            <Text
              key={i}
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 18,
                color: palette.brown900,
                opacity: p.opacity,
                transform: [{ translateY: p.dy }],
              }}
            >
              {p.text}
            </Text>
          ))}
        </View>
        <FallingWords tick={reps} thought={frase} />
      </View>

      <AnimatedSprout
        mood="feliz"
        stage={pronto ? 2 : 1}
        size={Math.min(width * 0.34, 130)}
        showBg={false}
        swayOn={reps}
      />

      {pronto ? (
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.55,
            color: palette.brown700,
            textAlign: 'center',
          }}
        >
          Seis vezes seguidas e a frase começa a virar só palavra. É isso que a
          repetição faz: gasta o significado até sobrar o som. Em voz alta o efeito é
          bem maior — é assim que a Composta funciona lá dentro.
        </Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onRep}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: radius.pill,
            backgroundColor: colors.primarySoft,
            borderWidth,
            borderColor: colors.primary,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}
        >
          <Icon name="plus" size={20} color={colors.primaryStrong} />
          <Text
            style={{ fontFamily: fonts.body.extraBold, fontSize: 16, color: colors.primaryStrong }}
          >
            Li ({reps}/{ALVO})
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export const REPETICOES_DO_EXPERIMENTO = ALVO;

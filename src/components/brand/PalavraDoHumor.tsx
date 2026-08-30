import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { palavrasDe } from '../../data/humores';
import { borderWidth, fonts, type Mood, radius, useTema } from '../../theme';

/**
 * A segunda camada do humor: a palavra mais exata, se a pessoa quiser.
 *
 * Aparece **depois** de a carinha ser tocada, e não antes. Uma tela que já
 * abrisse com cinco carinhas e vinte e cinco palavras seria a queixa que o
 * Finch acumula — muita coisa antes de fazer qualquer coisa. Aqui a pergunta
 * segunda só existe depois da resposta primeira, e a pessoa que não quiser
 * responder não vê nada além do que via antes.
 *
 * Nada no app exige a palavra. Ela enriquece o que `patterns` consegue notar
 * depois, e é isso; um dia sem palavra é um dia registrado igual.
 */
export function PalavraDoHumor({
  mood,
  value,
  onChange,
}: {
  mood: Mood;
  /** A palavra já escolhida hoje, se houver. */
  value?: string;
  /** Tocar na palavra escolhida a tira — quem escolheu errado desfaz no mesmo gesto. */
  onChange: (palavra: string) => void;
}) {
  const { colors, palette } = useTema();
  const palavras = palavrasDe(mood);
  if (!palavras.length) return null;

  return (
    <View style={{ alignItems: 'center', gap: 8, paddingTop: 2 }}>
      <Text
        style={{
          fontFamily: fonts.body.regular,
          fontSize: 13,
          color: palette.brown400,
          textAlign: 'center',
        }}
      >
        Se tiver uma palavra mais exata, ela é qual?
      </Text>

      {/*
        Duas linhas próprias, e não uma lista que quebra sozinha.

        Cinco substantivos não cabem numa linha de 375 de jeito nenhum — nem
        cortando o espaçamento. Deixados a quebrar sozinhos, entram quatro em
        cima e sobra um embaixo, e a palavra órfã parece a que ficou de fora.
        Partidos ao meio, ficam três e duas, centradas, e as cinco pesam igual.

        Cada linha ainda quebra por conta própria se precisar: com a fonte do
        sistema aumentada, três palavras deixam de caber, e aí a quebra
        automática é exatamente o que se quer.

        Rolar na horizontal, que seria a outra saída, esconderia a última
        palavra — e numa pergunta sobre achar a palavra certa, esconder palavra
        é o pior corte possível.
      */}
      {[palavras.slice(0, Math.ceil(palavras.length / 2)), palavras.slice(Math.ceil(palavras.length / 2))]
        .filter((linha) => linha.length > 0)
        .map((linha, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {linha.map((p) => {
              const ativa = value === p;
              return (
                <Pressable
                  key={p}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativa }}
                  accessibilityLabel={ativa ? `${p}, escolhida. Tocar para tirar.` : p}
                  onPress={() => onChange(p)}
                  hitSlop={6}
                  style={{
                    paddingVertical: 5,
                    paddingHorizontal: 12,
                    borderRadius: radius.pill,
                    borderWidth,
                    borderColor: ativa ? colors.primaryStrong : colors.border,
                    backgroundColor: ativa ? colors.primarySoft : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: ativa ? fonts.body.bold : fonts.body.regular,
                      fontSize: 13,
                      color: ativa ? colors.primaryStrong : colors.textSecondary,
                    }}
                  >
                    {p}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
    </View>
  );
}

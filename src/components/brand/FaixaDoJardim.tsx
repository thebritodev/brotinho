import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { fonts, radius, useTema } from '../../theme';
import { ROTULO_DO_VALOR, type ValueKey } from '../../data/valores';
import { Sprout, ehEnfeite } from './Sprout';

/**
 * Meu jardim, dentro da aba do broto: os valores que a pessoa viveu.
 *
 * ## Por que ele voltou para cá
 *
 * O jardim existia só como uma linha de lista no fim da aba — "Meu jardim >",
 * entre "Frases guardadas" e "Meus valores". Três destinos em três linhas
 * iguais, e o jardim é o único dos três que **mostra uma coisa**: ele é o
 * retrato do que a pessoa viveu, e um retrato atrás de uma linha de lista é um
 * retrato que ninguém abre.
 *
 * O documento põe a faixa aqui, aberta, logo depois do crescimento — e é o
 * lugar certo: o cartão de cima diz onde o broto está, e este diz **com o
 * quê** ele chegou lá. Os dois são a mesma frase em duas metades.
 *
 * ## Por que cada valor tem um vasinho, e não um ícone
 *
 * Porque o que a pessoa viveu virou planta. É literalmente a promessa do app:
 * o que você cuida cresce. Um ícone de estrela ao lado de "Coragem" seria uma
 * etiqueta; um broto com flor é a coisa que a palavra fez acontecer.
 *
 * ## Quando ele não aparece
 *
 * Sem valor nenhum reconhecido — porque a pessoa não escreveu ainda, ou porque
 * desligou a análise dos registros — a faixa some inteira. Um "Meu jardim"
 * com três caixas vazias promete um lugar que ainda não existe, e promessa
 * vazia nesta tela é pior do que seção nenhuma.
 */

/** As cores de fundo dos vasinhos, em rodízio. São as do documento. */
const TONS = ['terracotta100', 'blue100', 'yellow100', 'lavender100', 'green100'] as const;

export type ValorVivido = { value: ValueKey; count: number };

export function FaixaDoJardim({
  valores,
  margem,
  aoAbrir,
}: {
  valores: ValorVivido[];
  /** A margem lateral da tela, para a fileira sangrar até a borda. */
  margem: number;
  aoAbrir: () => void;
}) {
  const { colors, palette } = useTema();

  if (!valores.length) return null;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
        <Text
          style={{
            fontFamily: fonts.display.semiBold,
            fontSize: 19,
            color: colors.textPrimary,
          }}
        >
          Meu jardim
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Ver jardim" onPress={aoAbrir}>
          <Text
            style={{
              fontFamily: fonts.body.bold,
              fontSize: 15,
              color: colors.primaryStrong,
            }}
          >
            Ver jardim
          </Text>
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: 'right',
            fontFamily: fonts.body.regular,
            fontSize: 13,
            color: palette.brown400,
          }}
        >
          valores que você viveu
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -margem }}
        contentContainerStyle={{ paddingHorizontal: margem, gap: 12 }}
      >
        {valores.map((v, i) => (
          <Pressable
            key={v.value}
            accessibilityRole="button"
            accessibilityLabel={`${ROTULO_DO_VALOR[v.value]}, ${v.count} ${v.count === 1 ? 'vez' : 'vezes'}. Ver jardim`}
            onPress={aoAbrir}
            style={({ pressed }) => ({
              width: 118,
              borderRadius: radius.lg,
              backgroundColor: palette[TONS[i % TONS.length]],
              paddingVertical: 14,
              alignItems: 'center',
              gap: 2,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {/*
              O enfeite do valor vai no broto quando o valor tem um; os que não
              têm mostram o broto sem nada, e não um espaço vazio. Ver
              `ehEnfeite` — a lista de valores é maior que a de desenhos, e já
              houve um valor sem desenho alargando a caixa do broto à toa.
            */}
            <Sprout
              mood="feliz"
              stage={2}
              size={58}
              decorations={ehEnfeite(v.value) ? [v.value] : []}
            />
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 14,
                color: colors.textPrimary,
              }}
            >
              {ROTULO_DO_VALOR[v.value]}
            </Text>
            <Text
              style={{ fontFamily: fonts.body.regular, fontSize: 13, color: palette.brown400 }}
            >
              {v.count} {v.count === 1 ? 'vez' : 'vezes'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

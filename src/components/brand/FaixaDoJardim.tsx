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
 * ## Vazio, ele não some — ele convida
 *
 * A primeira versão sumia inteira sem valor nenhum reconhecido, com o
 * argumento de que um "Meu jardim" com três caixas vazias promete um lugar
 * que ainda não existe.
 *
 * O argumento estava de cabeça para baixo. **Sumir é a promessa pior**: quem
 * abre o app no primeiro dia não vê o jardim, não sabe que ele existe, e por
 * isso não tem motivo nenhum para escrever no diário — que é justamente o que
 * faz o jardim nascer. A seção que some é a que nunca é descoberta. Pedro
 * abriu a aba e me disse que o jardim não estava lá; estava, e estava
 * escondido por um `return null`.
 *
 * Então ela existe sempre. Com valores, mostra os vasinhos. Sem nenhum,
 * mostra um só, apagado, e diz em uma linha o que faz ele nascer. É a
 * diferença entre uma caixa vazia e um canteiro preparado.
 *
 * O único caso em que ela continua sumindo é a análise dos registros
 * desligada: ali não é "ainda não", é "você pediu para eu não olhar", e
 * oferecer o jardim seria oferecer uma coisa que a própria escolha dela
 * desligou.
 */

/** As cores de fundo dos vasinhos, em rodízio. São as do documento. */
const TONS = ['terracotta100', 'blue100', 'yellow100', 'lavender100', 'green100'] as const;

export type ValorVivido = { value: ValueKey; count: number };

export function FaixaDoJardim({
  valores,
  margem,
  analisando,
  aoAbrir,
}: {
  valores: ValorVivido[];
  /** A margem lateral da tela, para a fileira sangrar até a borda. */
  margem: number;
  /** A análise dos registros está ligada? Ver a nota do alto. */
  analisando: boolean;
  aoAbrir: () => void;
}) {
  const { colors, palette } = useTema();

  if (!analisando) return null;
  const vazio = valores.length === 0;

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
          {vazio ? 'ainda sem nada' : 'valores que você viveu'}
        </Text>
      </View>

      {vazio && (
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 14,
            lineHeight: 14 * 1.5,
            color: colors.textSecondary,
          }}
        >
          Escreva no diário e o que você viveu vira planta aqui. Coragem,
          conexão, autocuidado — o broto reconhece sozinho.
        </Text>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -margem }}
        contentContainerStyle={{ paddingHorizontal: margem, gap: 12 }}
      >
        {vazio && (
          /*
            Um vasinho apagado, e não três.

            Três caixas vazias leem como um lugar quebrado; uma, apagada, lê
            como o primeiro canteiro esperando. E ela é tocável: leva ao
            jardim, que tem a história inteira.
          */
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver jardim"
            onPress={aoAbrir}
            style={({ pressed }) => ({
              width: 118,
              borderRadius: radius.lg,
              backgroundColor: palette.cream200,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: palette.brown200,
              paddingVertical: 14,
              alignItems: 'center',
              gap: 2,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ opacity: 0.45 }}>
              <Sprout mood="leve" stage={1} size={58} />
            </View>
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 14, color: palette.brown400 }}
            >
              O primeiro
            </Text>
            <Text
              style={{ fontFamily: fonts.body.regular, fontSize: 13, color: palette.brown400 }}
            >
              nenhuma vez
            </Text>
          </Pressable>
        )}

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

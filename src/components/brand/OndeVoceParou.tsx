import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { findPractice } from '../../data/practices';
import type { Recente } from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import { DesenhoDaComposta, DesenhoDoDiario } from './desenhosDoCarrossel';
import { DesenhoDoTema, ehTemaDesenhado } from './desenhosDosTemas';

/**
 * "Onde você parou" — a fileira de volta ao que já foi feito.
 *
 * ## O que ela resolve
 *
 * A Home oferecia sempre o mesmo começo, como se toda visita fosse a primeira.
 * Quem fez uma prática ontem e quer seguir precisava atravessar a grade de
 * treze temas outra vez. Aqui o caminho de volta tem um toque, e o que aparece
 * é o que a pessoa de fato usou — nada de "recomendado para você" fabricado.
 *
 * ## Por que os cartões são pequenos e a arte sangra
 *
 * Porque eles **não** podem competir com o carrossel de cima. Ali estão as três
 * ferramentas, grandes, e é ali que alguém sem rumo deve olhar primeiro. Esta
 * fileira é para quem já sabe o que quer: baixa, horizontal, reconhecível de
 * relance pela cena do tema — que é justamente o que a arte cortada na borda
 * faz melhor do que um ícone centralizado.
 *
 * ## O que não aparece aqui
 *
 * O que foi escrito ou compostado. Os cartões dizem "Diário" e "Composta", com
 * a data; o conteúdo continua onde sempre esteve, atrás do toque. Uma Home que
 * mostra pedaço de desabafo é uma Home que não se pode abrir perto de ninguém.
 */

/** Largura e altura de cada cartãozinho da fileira. */
const LARGURA = 166;
const ALTURA = 104;

/** "hoje", "ontem", "há 4 dias" — a data sem número quando dá. */
function quandoFoi(quando: number, agora = Date.now()): string {
  const dia = 24 * 60 * 60 * 1000;
  const inicio = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const dias = Math.round((inicio(agora) - inicio(quando)) / dia);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 7) return `há ${dias} dias`;
  if (dias < 14) return 'semana passada';
  return `há ${Math.floor(dias / 7)} semanas`;
}

type Props = {
  itens: Recente[];
  /** A margem lateral da tela, para a fileira sangrar até a borda. */
  margem: number;
  onAbrir: (item: Recente) => void;
};

export function OndeVoceParou({ itens, margem, onAbrir }: Props) {
  const { colors, palette, shadows, tintsDosTemas } = useTema();

  /* A chave vem do disco e pode ser de um tema que saiu do repertorio. */
  const tomDoTema = (chave: string): string =>
    (tintsDosTemas as Record<string, string | undefined>)[chave] ?? palette.green100;

  if (!itens.length) return null;

  /** Nome, cena e cor de cada tipo de lugar. */
  const comoFica = (item: Recente) => {
    if (item.tipo === 'composta') {
      return {
        titulo: 'Composta',
        cena: <DesenhoDaComposta size={88} />,
        tom: palette.brown100,
        label: 'Compostar um pensamento de novo',
      };
    }
    if (item.tipo === 'diario') {
      return {
        titulo: 'Diário',
        cena: <DesenhoDoDiario size={88} />,
        tom: palette.cream300,
        label: 'Escrever no diário',
      };
    }
    const pratica = findPractice(item.topico, item.pratica);
    return {
      titulo: pratica?.title ?? 'Prática',
      /* Sem cena para o tema, o quadrado fica vazio — melhor a cor sozinha do
         que um ícone genérico brigando com as cenas dos vizinhos. */
      cena: ehTemaDesenhado(item.topico) ? <DesenhoDoTema tema={item.topico} size={92} /> : null,
      tom: tomDoTema(item.topico),
      label: `Voltar para ${pratica?.title ?? 'a prática'}`,
    };
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -margem }}
      contentContainerStyle={{ paddingHorizontal: margem, gap: 12 }}
    >
      {itens.map((item) => {
        const { titulo, cena, tom, label } = comoFica(item);
        const chave =
          item.tipo === 'pratica' ? `${item.topico}/${item.pratica}` : item.tipo;

        return (
          <Pressable
            key={chave}
            accessibilityRole="button"
            accessibilityLabel={`${label}. ${quandoFoi(item.quando)}.`}
            onPress={() => onAbrir(item)}
            style={({ pressed }) => ({
              width: LARGURA,
              height: ALTURA,
              borderRadius: radius.lg,
              backgroundColor: tom,
              overflow: 'hidden',
              padding: 12,
              justifyContent: 'space-between',
              opacity: pressed ? 0.85 : 1,
              ...shadows.sm,
            })}
          >
            {/*
              A cena, ancorada no canto de baixo à direita e maior que o espaço
              que tem: ela é cortada pela borda do cartão de propósito, que é o
              que faz a arte parecer continuar em vez de acabar.
            */}
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
              style={{ position: 'absolute', right: -10, bottom: -14, opacity: 0.95 }}
            >
              {cena}
            </View>

            <Text
              numberOfLines={2}
              style={{
                fontFamily: fonts.body.extraBold,
                fontSize: 13.5,
                lineHeight: 13.5 * 1.25,
                color: palette.brown900,
                /* Deixa o canto de baixo à direita livre para o desenho. */
                width: '80%',
              }}
            >
              {titulo}
            </Text>

            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 11.5,
                color: colors.textSecondary,
              }}
            >
              {quandoFoi(item.quando)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

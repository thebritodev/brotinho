import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { findPractice } from '../../data/practices';
import type { Recente } from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import { DesenhoDaComposta, DesenhoDoDiario } from './desenhosDoCarrossel';
import { DesenhoDoTema, ehTemaDesenhado } from './desenhosDosTemas';
import { SOBRA_DO_DESENHO, TAMANHO_DO_DESENHO } from './PracticeTopicCard';

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
 * ## A mesma fileira serve para quem nunca esteve em lugar nenhum
 *
 * Na primeira versão ela sumia sem histórico, e some sem histórico era a maior
 * parte das pessoas: quem instalou hoje via a Home mais curta e nunca soube que
 * a seção existia. Agora quem manda os itens é a tela — com histórico ela manda
 * os lugares visitados, sem histórico manda quatro boas portas de estreia — e o
 * título muda junto, de "Onde você parou" para "Para começar".
 *
 * O que **não** muda é o que cada cartão diz: um item sem data nunca se
 * apresenta como visita. No lugar da data ele mostra quanto a coisa leva, que é
 * a pergunta de quem nunca entrou.
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

/**
 * O que a linha de baixo diz quando não houve visita nenhuma.
 *
 * O cartão precisa de alguma coisa ali: sem a linha, os cartões da fileira de
 * estreia ficariam com meia altura vazia ao lado dos que têm data. E o que
 * cabe no lugar da data é o custo — quanto tempo aquilo leva —, que é a
 * pergunta de quem nunca entrou.
 */
const QUANTO_LEVA: Record<'composta' | 'diario', string> = {
  composta: '30 segundos',
  diario: 'escrever ou falar',
};

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
        cena: <DesenhoDaComposta size={TAMANHO_DO_DESENHO - 8} />,
        tom: palette.brown100,
        label: item.quando ? 'Compostar um pensamento de novo' : 'Compostar um pensamento',
      };
    }
    if (item.tipo === 'diario') {
      return {
        titulo: 'Diário',
        cena: <DesenhoDoDiario size={TAMANHO_DO_DESENHO - 8} />,
        tom: palette.cream300,
        label: 'Escrever no diário',
      };
    }
    const pratica = findPractice(item.topico, item.pratica);
    return {
      titulo: pratica?.title ?? 'Prática',
      /* Sem cena para o tema, o quadrado fica vazio — melhor a cor sozinha do
         que um ícone genérico brigando com as cenas dos vizinhos. */
      cena: ehTemaDesenhado(item.topico) ? (
        <DesenhoDoTema tema={item.topico} size={TAMANHO_DO_DESENHO} />
      ) : null,
      tom: tomDoTema(item.topico),
      label: item.quando
        ? `Voltar para ${pratica?.title ?? 'a prática'}`
        : `Começar por ${pratica?.title ?? 'uma prática'}`,
      duracao: pratica?.duration,
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
        const ficha = comoFica(item);
        const { titulo, cena, tom, label } = ficha;
        /* Já esteve aqui? mostra quando. Nunca esteve? mostra quanto leva. */
        const rodape =
          item.quando !== undefined
            ? quandoFoi(item.quando)
            : item.tipo === 'pratica'
              ? ('duracao' in ficha && ficha.duracao) || 'prática guiada'
              : QUANTO_LEVA[item.tipo];
        const chave =
          item.tipo === 'pratica' ? `${item.topico}/${item.pratica}` : item.tipo;

        return (
          <View key={chave} style={{ width: LARGURA, height: ALTURA + SOBRA_DO_DESENHO }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${label}. ${rodape}.`}
              onPress={() => onAbrir(item)}
              style={({ pressed }) => ({
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: ALTURA,
                borderRadius: radius.lg,
                backgroundColor: tom,
                padding: 12,
                justifyContent: 'space-between',
                opacity: pressed ? 0.85 : 1,
                ...shadows.sm,
              })}
            >
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: fonts.body.extraBold,
                  fontSize: 13.5,
                  lineHeight: 13.5 * 1.25,
                  color: palette.brown900,
                  /* Mesma regra da grade: a primeira linha passa por cima da
                     folga de cima da cena. Ver `PracticeTopicCard`. */
                  width: '74%',
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
                {rodape}
              </Text>
            </Pressable>

            {/*
              A cena, por cima do cartão e passando da borda de baixo dele —
              a mesma regra da grade de temas; ver `SOBRA_DO_DESENHO`.
            */}
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
              style={{ position: 'absolute', right: 0, bottom: 0 }}
            >
              {cena}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

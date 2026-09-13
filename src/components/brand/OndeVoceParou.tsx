import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { findPractice } from '../../data/practices';
import type { PraticaVisitada } from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import { DesenhoDoTema, ehTemaDesenhado } from './desenhosDosTemas';
import { SOBRA_DO_DESENHO, TAMANHO_DO_DESENHO } from './PracticeTopicCard';

/**
 * A fileira de práticas da tela inicial.
 *
 * ## O que ela resolve
 *
 * A Home oferecia sempre o mesmo começo, como se toda visita fosse a primeira.
 * Quem fez uma prática ontem e quer seguir precisava atravessar a grade de
 * treze temas outra vez. Aqui o caminho de volta tem um toque, e o que aparece
 * é o que a pessoa de fato usou — nada de "recomendado para você" fabricado.
 *
 * ## A mesma fileira serve para quem nunca fez nenhuma
 *
 * Na primeira versão ela sumia sem histórico, e sumir sem histórico era a maior
 * parte das pessoas: quem instalou hoje via a Home mais curta e nunca soube que
 * a seção existia. Agora quem manda os itens é a tela — com histórico ela manda
 * as práticas feitas, sem histórico manda quatro de estreia — e o título muda
 * junto, de "Práticas recentes" para "Para começar".
 *
 * O que **não** muda é o que cada cartão diz: uma prática sem data nunca se
 * apresenta como visita. No lugar da data ela mostra quanto leva, que é a
 * pergunta de quem nunca entrou.
 *
 * ## Só práticas
 *
 * O Diário e a Composta já estiveram aqui, em cartão próprio. Saíram: a fileira
 * repetia duas ferramentas que a tela já oferece em cartão grande logo acima, e
 * sobrava pouco espaço para o que ela sabe fazer de melhor — lembrar em qual
 * das quarenta e uma práticas a pessoa estava. Ver `praticasRecentes`.
 *
 * ## Por que os cartões são pequenos e a arte sangra
 *
 * Porque eles **não** podem competir com o carrossel de cima. Ali estão as três
 * coisas de fazer agora, grandes, e é ali que alguém sem rumo deve olhar
 * primeiro. Esta fileira é para quem já sabe o que quer: baixa, horizontal,
 * reconhecível de relance pela cena do tema — que é justamente o que a arte
 * cortada na borda faz melhor do que um ícone centralizado.
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
  itens: PraticaVisitada[];
  /** A margem lateral da tela, para a fileira sangrar até a borda. */
  margem: number;
  onAbrir: (item: PraticaVisitada) => void;
};

export function OndeVoceParou({ itens, margem, onAbrir }: Props) {
  const { colors, palette, shadows, tintsDosTemas } = useTema();

  /* A chave vem do disco e pode ser de um tema que saiu do repertorio. */
  const tomDoTema = (chave: string): string =>
    (tintsDosTemas as Record<string, string | undefined>)[chave] ?? palette.green100;

  if (!itens.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -margem }}
      contentContainerStyle={{ paddingHorizontal: margem, gap: 12 }}
    >
      {itens.map((item) => {
        const pratica = findPractice(item.topico, item.pratica);
        /* Já fez? mostra quando. Nunca fez? mostra quanto leva. */
        const rodape =
          item.quando !== undefined
            ? quandoFoi(item.quando)
            : (pratica?.duration ?? 'prática guiada');
        const label =
          item.quando !== undefined
            ? `Voltar para ${pratica?.title ?? 'a prática'}`
            : `Começar por ${pratica?.title ?? 'uma prática'}`;

        return (
          <View
            key={`${item.topico}/${item.pratica}`}
            style={{ width: LARGURA, height: ALTURA + SOBRA_DO_DESENHO }}
          >
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
                backgroundColor: tomDoTema(item.topico),
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
                  /* A primeira linha passa por cima da folga de cima da cena.
                     Ver `PracticeTopicCard`. */
                  width: '74%',
                }}
              >
                {pratica?.title ?? 'Prática'}
              </Text>

              {/* A linha de baixo também cede a direita para o desenho: a cena
                  está ancorada ali e é o que ela vai continuar fazendo. */}
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: fonts.body.bold,
                  fontSize: 11.5,
                  color: colors.textSecondary,
                  width: '58%',
                }}
              >
                {rodape}
              </Text>
            </Pressable>

            {/*
              A cena, por cima do cartão e passando da borda de baixo dele —
              a mesma regra da grade de temas; ver `SOBRA_DO_DESENHO`.

              Sem cena para o tema, fica só a cor: melhor a cor sozinha do que
              um ícone genérico brigando com as cenas dos vizinhos.
            */}
            {ehTemaDesenhado(item.topico) && (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                pointerEvents="none"
                style={{ position: 'absolute', right: 0, bottom: 0 }}
              >
                <DesenhoDoTema tema={item.topico} size={TAMANHO_DO_DESENHO} />
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

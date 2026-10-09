import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { GRUPOS_DE_PRATICAS, PRACTICE_TOPICS, findTopic } from '../../data/practices';
import { fonts, useTema } from '../../theme';
import { CenaDoTema } from './cenasDosTemas';
import type { SproutStage } from './Sprout';

/** A faixa branca do pé do cartão, do documento. */
const RODAPE = 54;

/** O vão entre os cartões da grade. */
export const VAO_DA_GRADE = 14;

/** Quanto mede o lado de um cartão, numa grade de duas colunas. */
export function ladoDoCartaoDoTema(larguraUtil: number): number {
  return Math.floor((larguraUtil - VAO_DA_GRADE) / 2);
}

type Props = {
  /** A largura disponível, já descontadas as margens da tela. */
  larguraUtil: number;
  estagio: SproutStage;
  /** A grade saiu de vista: o movimento das cenas para. */
  parado?: boolean;
  onAbrir: (tema: string) => void;
};

/**
 * Os treze temas, em grade de dois — a metade de baixo da tela inicial.
 *
 * ## O que isto substitui, e por quê
 *
 * Quatro fileiras que andavam, uma por grupo ("Para o corpo acelerado", "Para
 * o que dói"…). Aquilo resolveu um problema real na época: treze cartões de
 * 124 pontos em grade eram descoberta máxima e presença mínima, e nenhum deles
 * tinha área para uma cena caber.
 *
 * O redesenho resolve o mesmo problema pelo outro lado. Em vez de encolher a
 * lista escondendo-a numa fileira que anda, ele **aumenta o cartão**: quadrado,
 * meia largura de tela, com cena de verdade dentro. Treze deles em sete
 * fileiras ocupam muita tela — e ocupar tela aqui é o ponto, não o custo. Esta
 * é a parte do app com mais trabalho feito dentro e a que menos aparecia.
 *
 * ## Os grupos saíram
 *
 * Com os títulos de grupo, a grade vira quatro listas curtas e a pessoa lê
 * quatro cabeçalhos antes de qualquer cartão. Fazia sentido quando os cartões
 * eram pequenos e quase ilegíveis de relance — o título do grupo era a
 * legenda que faltava. Com cena, cor e frase inteira em cada cartão, a legenda
 * virou repetição: "Para o que dói" em cima de "Atravessar a tristeza" diz a
 * mesma coisa duas vezes.
 *
 * O corte por grupo não se perdeu — ele continua em `GRUPOS_DE_PRATICAS`, e é
 * ele que dá a **ordem** desta grade: os temas vêm agrupados por estado, só que
 * sem o cabeçalho anunciando o agrupamento. Quem rola encontra ansiedade,
 * estresse, raiva e insônia juntos, e não precisa que alguém diga por quê.
 *
 * ## Por que a frase, e não o nome do assunto
 *
 * "Acalmar a ansiedade", e não "Ansiedade". O cartão não é um rótulo de pasta,
 * é uma saída: diz o que acontece se a pessoa entrar. Isso vem de `solucao`, em
 * `practices`, e já valia na versão anterior.
 */
/**
 * Os temas na ordem dos grupos, e sem repetir nenhum.
 *
 * `GRUPOS_DE_PRATICAS` continua sendo a verdade sobre o que vem perto do quê —
 * ansiedade, estresse, raiva e insônia juntos; tristeza, luto e solidão
 * juntos. O que a grade nova tira são os **títulos** dos grupos, não o corte.
 *
 * O rabo da lista existe para um tema novo nunca sumir: quem acrescentar um em
 * `PRACTICE_TOPICS` e esquecer de pô-lo num grupo vai vê-lo no fim da grade, e
 * não vai passar meses sem saber que ele não aparece em lugar nenhum.
 */
const NA_ORDEM_DOS_GRUPOS = (() => {
  const vistos = new Set<string>();
  const lista = [];
  for (const grupo of GRUPOS_DE_PRATICAS) {
    for (const chave of grupo.temas) {
      const tema = findTopic(chave);
      if (!tema || vistos.has(chave)) continue;
      vistos.add(chave);
      lista.push(tema);
    }
  }
  for (const tema of PRACTICE_TOPICS) {
    if (!vistos.has(tema.key)) lista.push(tema);
  }
  return lista;
})();

export function GradeDeTemas({ larguraUtil, estagio, parado = false, onAbrir }: Props) {
  const lado = ladoDoCartaoDoTema(larguraUtil);

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: VAO_DA_GRADE,
      }}
    >
      {NA_ORDEM_DOS_GRUPOS.map((tema) => (
        <CartaoDoTema
          key={tema.key}
          chave={tema.key}
          titulo={tema.solucao}
          quantas={tema.practices.length}
          lado={lado}
          estagio={estagio}
          parado={parado}
          onPress={() => onAbrir(tema.key)}
        />
      ))}
    </View>
  );
}

function CartaoDoTema({
  chave,
  titulo,
  quantas,
  lado,
  estagio,
  parado,
  onPress,
}: {
  chave: string;
  titulo: string;
  quantas: number;
  lado: number;
  estagio: SproutStage;
  parado: boolean;
  onPress: () => void;
}) {
  const { colors, palette, shadows, tintsDosTemas } = useTema();
  const tom = (tintsDosTemas as Record<string, string | undefined>)[chave] ?? colors.primarySoft;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}, ${quantas} ${quantas === 1 ? 'prática' : 'práticas'}`}
      onPress={onPress}
      style={({ pressed }) => ({
        width: lado,
        height: lado,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: tom,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        ...shadows.sm,
      })}
    >
      <CenaDoTema
        tema={chave}
        largura={lado}
        altura={lado - RODAPE}
        estagio={estagio}
        parado={parado}
      />

      {/* Quantas práticas há dentro — o número é a promessa do cartão. */}
      <View
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: 8,
          backgroundColor: colors.surface,
          ...shadows.sm,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body.extraBold,
            fontSize: 11.5,
            color: palette.brown700,
          }}
        >
          {quantas} {quantas === 1 ? 'prática' : 'práticas'}
        </Text>
      </View>

      {/*
        A faixa branca do pé: o nome do tema e a seta.

        Ela existe para o título **nunca** ficar em cima do desenho. Treze cenas
        diferentes, com treze fundos diferentes, não têm como garantir contraste
        atrás de uma frase — e o véu que resolveria isso comeria a cena. Uma
        faixa opaca de 54 pontos resolve as treze de uma vez.
      */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: RODAPE,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingLeft: 12,
          paddingRight: 10,
          backgroundColor: colors.surface,
        }}
      >
        <Text
          numberOfLines={2}
          style={{
            flex: 1,
            fontFamily: fonts.display.bold,
            fontSize: 15.5,
            lineHeight: 15.5 * 1.2,
            color: colors.textPrimary,
          }}
        >
          {titulo}
        </Text>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path
              d="M9 5l7 7-7 7"
              fill="none"
              stroke={colors.primaryStrong}
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>
    </Pressable>
  );
}

import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { useTema } from '../../theme';

/**
 * Carrossel — um cartão por vez, arrastando, com uma fatia do próximo à vista.
 *
 * ## A espia não é enfeite
 *
 * Um cartão que ocupa a largura inteira não diz que tem outro atrás. A fatia do
 * vizinho aparecendo na borda é o que ensina o gesto, e ela é a razão de o
 * cartão medir menos que a tela. Os pontinhos embaixo dizem quantos são e onde
 * se está — sozinhos eles contam, mas não convidam.
 *
 * ## Não passa sozinho
 *
 * Movimento que começa sem ninguém pedir é o contrário do tom deste app, e em
 * carrossel automático quem lê devagar perde o cartão no meio da frase. Aqui a
 * troca é sempre gesto.
 *
 * ## Todos os cartões têm a mesma altura
 *
 * O conteúdo deles é diferente — a Frase do dia tem um canteiro desenhado, o
 * Diário tem duas linhas de texto. Sem `alignItems: 'stretch'`, cada cartão
 * ficaria com a sua altura e os pontinhos dançariam ao trocar. Esticados, a
 * fileira inteira tem a altura do mais alto e nada se mexe.
 *
 * ## Sangra até a borda
 *
 * A tela tem 20 de margem; o carrossel precisa que o cartão de fora atravesse
 * essa margem para ser cortado pela tela, e não pelo conteúdo. Daí a margem
 * negativa e o mesmo valor devolvido como recuo interno.
 */

/** Quanto do próximo cartão fica à mostra. */
const ESPIA = 26;
const VAO = 12;
const MARGEM_DA_TELA = 20;

type Props = {
  /** Um filho por cartão. */
  children: React.ReactNode;
  /** Rótulo de cada cartão, para o leitor de tela anunciar a posição. */
  rotulos: string[];
  /**
   * Qual cartão está à vista agora.
   *
   * Existe porque um cartão pode ter algo a fazer quando chega a vez dele —
   * o da Composta desmancha a frase do balão para demonstrar o gesto. Sem isto,
   * ou a animação roda escondida atrás da borda, ou roda o tempo todo.
   */
  aoTrocar?: (indice: number) => void;
};

export function Carrossel({ children, rotulos, aoTrocar }: Props) {
  const { colors, palette } = useTema();
  const { width } = useWindowDimensions();
  const cartoes = React.Children.toArray(children);

  /* No primeiro quadro a largura vem zerada; o piso evita cartão negativo. */
  const largura = Math.max(220, width - MARGEM_DA_TELA * 2 - ESPIA);
  const passo = largura + VAO;

  /**
   * Onde a rolagem pode parar, uma posição por cartão.
   *
   * A última é limitada ao fim do conteúdo: o último cartão não tem vizinho
   * para espiar do outro lado, então a rolagem máxima é menor que o passo
   * multiplicado — e mandar o `ScrollView` parar além do fim é o que produzia
   * aquele repuxo ao soltar o dedo no fim da fileira.
   */
  const paradas = useMemo(() => {
    const conteudo = cartoes.length * largura + (cartoes.length - 1) * VAO;
    const tela = width - MARGEM_DA_TELA * 2;
    const fim = Math.max(0, conteudo - tela);
    return cartoes.map((_, i) => Math.min(i * passo, fim));
  }, [cartoes.length, largura, passo, width]);

  const [atual, setAtual] = useState(0);
  const ultimo = useRef(0);

  return (
    <View style={{ gap: 12 }}>
      {/*
        Por que `snapToOffsets` e não `snapToInterval`.

        `snapToInterval` multiplica um passo: ele acerta o primeiro e o último
        cartão por acidente, porque o recuo das pontas não é múltiplo de nada.
        Na prática o último cartão parava alguns pontos fora do lugar e o
        carrossel "puxava" de volta ao soltar. `snapToOffsets` diz as posições
        exatas — e a última é encurtada para o fim do conteúdo, que é onde a
        rolagem realmente para.

        E `disableIntervalMomentum` saiu. Ele trava a rolagem em **um** cartão
        por gesto: um peteleco rápido, que deveria atravessar a fileira, morria
        no vizinho. Era isso que fazia o carrossel parecer preso — cada gesto
        batia num freio que ele não pediu.
      */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToOffsets={paradas}
        snapToAlignment="start"
        /* 16ms = um quadro. Os pontinhos acompanham o dedo sem atraso, e o
           `setState` só acontece quando o cartão muda mesmo. */
        scrollEventThrottle={16}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / passo);
          // Só avisa quando o cartão realmente muda: um `setState` por quadro
          // de rolagem redesenharia os três cartões o tempo todo.
          if (i !== ultimo.current) {
            ultimo.current = i;
            setAtual(i);
            aoTrocar?.(i);
          }
        }}
        style={{ marginHorizontal: -MARGEM_DA_TELA }}
        contentContainerStyle={{
          paddingHorizontal: MARGEM_DA_TELA,
          gap: VAO,
          alignItems: 'stretch',
        }}
      >
        {cartoes.map((cartao, i) => (
          <View
            key={i}
            accessibilityLabel={
              rotulos[i] ? `${rotulos[i]}. ${i + 1} de ${cartoes.length}` : undefined
            }
            style={{ width: largura }}
          >
            {cartao}
          </View>
        ))}
      </ScrollView>

      {/*
        Os pontinhos são desenho, não comando: quem navega por voz já ouviu
        "1 de 3" no próprio cartão, e três botões mudos aqui só atrasariam.
      */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}
      >
        {cartoes.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === atual ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === atual ? colors.primaryStrong : palette.brown200,
            }}
          />
        ))}
      </View>
    </View>
  );
}

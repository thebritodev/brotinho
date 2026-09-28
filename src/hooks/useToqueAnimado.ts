import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { useMenosMovimento } from './useMenosMovimento';

/**
 * Quanto a cena se mexe antes de a tela trocar.
 *
 * É perto do tempo da própria transição entre telas do app, e isso não é
 * coincidência: a animação precisa caber no intervalo que a pessoa já aceita
 * como "o app respondeu". Passando disso, ela deixa de ser resposta ao toque e
 * vira espera.
 *
 * Quem abre o Brotinho para respirar num dia ruim toca nestes cartões todos os
 * dias. Meio segundo de enfeite encanta três vezes e atrapalha na trigésima —
 * por isso o número é o menor que ainda deixa a ampulheta escorrer inteira.
 */
export const DURACAO_DO_TOQUE = 350;

/**
 * Em que ponto da cena a tela nova comeca a entrar.
 *
 * ## Por que nao no fim
 *
 * Porque duas animacoes em fila nao sao uma transicao fluida: sao duas. Medido
 * no navegador com a CPU a um quarto, tocar num cartao de pratica deixava a
 * tela **parada por 600 ms** — os 350 da cena mais o que a tela de destino
 * levava para montar — e so entao o deslize comecava. Nada travava; era so
 * espera, e espera entre dois movimentos e exatamente o que se le como corte.
 *
 * Disparando a navegacao aos 58% do caminho, a cena ainda esta se mexendo
 * quando a tela comeca a andar. As duas se sobrepoem por um terco de segundo e
 * o dedo ve **um** movimento, que e o que se queria desde o comeco: a cena e a
 * resposta ao toque, e a tela nova e a continuacao dela.
 *
 * ## Por que 45%, e por que a cena **para** aqui
 *
 * A cena corre com `Easing.out(Easing.quad)`: sai rapido e freia no fim. Aos
 * 45% do **tempo**, cerca de 70% do **caminho** ja aconteceu — a areia ja
 * escorreu, a chama ja tremeu, e o que falta e a desaceleracao.
 *
 * E neste ponto ela para de vez, em vez de terminar por baixo da tela nova.
 * Isso nao e economia de enfeite: a cena redesenha o cartao inteiro a cada
 * quadro, e a tela de destino monta no mesmo instante. Medido no navegador com
 * a CPU a um quarto, as duas disputando a mesma linha esticavam a montagem de
 * 110 para 250 ms — adiantar a navegacao sem parar a cena so aumentava a
 * briga, e o deslize continuava comecando depois de a cena ter acabado.
 *
 * Parada, a montagem corre sozinha e o deslize comeca **enquanto** o cartao
 * ainda esta no lugar em que a cena o deixou. O dedo ve um movimento so.
 */
const ONDE_A_TELA_COMECA = 0.45;

/**
 * Toca a cena de um cartão e só então executa a ação dele.
 *
 * A ordem é essa de propósito: a animação é a resposta ao dedo, e resposta que
 * chega junto com a tela nova não é vista por ninguém.
 *
 * ## Por que devolve um número, e não o valor animado
 *
 * Porque quem desenha é SVG, e `Animated` entrega valor novo para um nó de
 * `react-native-svg` chamando `setNativeProps` — que o `react-native-web` não
 * implementa. Lá a animação rodava e o desenho ficava parado, o que torna a web
 * inútil como lugar de conferir. Com um número comum, a cena é função dele e se
 * comporta igual em toda plataforma.
 *
 * O custo é re-renderizar o cartão a cada quadro em vez de empurrar
 * propriedade. São vinte e um quadros de um cartão, uma vez por toque.
 */
export function useToqueAnimado(onPress?: () => void, duracao = DURACAO_DO_TOQUE) {
  const menosMovimento = useMenosMovimento();

  const valor = useRef(new Animated.Value(0)).current;
  const [p, setP] = useState(0);
  /** Um toque de cada vez. Ver `tocar`. */
  const andando = useRef(false);

  useEffect(() => {
    const id = valor.addListener(({ value }) => setP(value));
    return () => valor.removeListener(id);
  }, [valor]);

  const tocar = () => {
    if (!onPress) return;

    /*
      Sem movimento, sem espera.

      Quem pediu ao sistema para reduzir animações costuma ter pedido por enjoo
      ou enxaqueca. Fazer essa pessoa esperar por uma animação que ela não vai
      ver seria cobrar duas vezes pelo mesmo ajuste.
    */
    if (menosMovimento) {
      onPress();
      return;
    }

    /*
      Dois toques seguidos não abrem duas telas.

      Sem o trinco, o segundo toque reiniciava a cena e agendava uma segunda
      navegação — que chegava depois de a tela já ter trocado e empilhava o
      mesmo destino duas vezes, obrigando a voltar duas.
    */
    if (andando.current) return;
    andando.current = true;
    valor.setValue(0);

    /*
      A navegacao sai no meio da cena, por relogio e nao por listener.

      `addListener` no valor animado dispararia a cada quadro e a comparacao
      teria de ser feita 21 vezes; um `setTimeout` faz a mesma coisa uma vez.
    */
    const animacao = Animated.timing(valor, {
      toValue: 1,
      duration: duracao,
      /*
        Sai rápido e desacelera no fim. É o que faz a areia parecer escoar por
        peso, e não ser arrastada por um cursor — movimento de coisa, não de
        interface.
      */
      easing: Easing.out(Easing.quad),
      /* Não há driver nativo para isto: o destino é um número que vira SVG. */
      useNativeDriver: false,
    });

    animacao.start(({ finished }) => {
      /*
        Chegar ao fim só acontece quando o toque não leva a lugar nenhum — um
        cartão sem destino não existe aqui, então na prática quem termina é a
        parada do relógio abaixo. Nos dois casos a cena volta ao repouso, para
        quem voltar não encontrar a ampulheta vazia e a chuva já caída.
      */
      if (finished) {
        andando.current = false;
        valor.setValue(0);
      }
    });

    const aMeioCaminho = setTimeout(() => {
      animacao.stop();
      andando.current = false;
      onPress();
      /*
        O repouso vem depois, e não junto: zerar a cena no mesmo quadro da
        navegação faria o cartão dar um salto para trás bem no instante em que
        a tela nova começa a passar por cima dele. Meio segundo depois ele já
        está coberto, e ninguém vê a volta.
      */
      setTimeout(() => valor.setValue(0), 500);
    }, duracao * ONDE_A_TELA_COMECA);
  };

  return { p, tocar };
}

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

    Animated.timing(valor, {
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
    }).start(({ finished }) => {
      andando.current = false;
      /*
        Animação interrompida não age. Ela só é interrompida quando o cartão sai
        da tela, e nesse caso a pessoa já está noutro lugar.
      */
      if (!finished) return;
      onPress();
      /*
        E a cena volta ao repouso, para quem voltar não encontrar a ampulheta
        vazia e a chuva já caída.
      */
      valor.setValue(0);
    });
  };

  return { p, tocar };
}

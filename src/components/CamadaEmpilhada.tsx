import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { useMenosMovimento } from '../hooks/useMenosMovimento';
import { ScreenTransition } from './ScreenTransition';

/**
 * A tela empilhada — uma prática, o diário, as configurações — **por cima** da
 * aba, e não no lugar dela.
 *
 * ## O que isto conserta
 *
 * A tela empilhada e a aba ocupavam o mesmo lugar na árvore. Abrir uma prática
 * desmontava a tela inicial inteira, e voltar a montava do zero: as duas faixas
 * animadas, os desenhos, a grade das 41 práticas. Medido no navegador com a CPU
 * desacelerada para parecer um celular médio, o toque em Voltar travava a linha
 * de JavaScript por **440 ms** — a prática ficava congelada na tela esse tempo
 * todo, e depois a Home aparecia de uma vez. Era a "travada e corte seco".
 *
 * E a volta não tinha como ser animada: a tela que saía já tinha sido
 * desmontada no mesmo quadro em que o toque aconteceu. Só a que chegava
 * animava, e ela chegava atrasada.
 *
 * ## Como funciona
 *
 * A aba fica montada por baixo, parada. A tela empilhada entra deslizando por
 * cima e, ao fechar, **sai** deslizando — continua desenhada durante a saída,
 * mesmo com o `sub` do `MainTabs` já vazio, e só é desmontada quando some.
 * Voltar não monta nada: a aba já estava ali, na altura em que a pessoa a
 * deixou.
 *
 * Durante a saída a camada não recebe toque: quem voltou já pode rolar a aba
 * que está aparecendo, sem esperar a animação acabar.
 */

/**
 * A aba está coberta por uma tela empilhada?
 *
 * ## Por que contexto, e não uma prop da tela
 *
 * Como prop, mudar de "coberta" para "descoberta" redesenhava a Home
 * **inteira** — as duas faixas, os desenhos, a grade das práticas — no mesmo
 * instante do toque em Voltar. Medido: 363 ms de linha travada, quase tanto
 * quanto a montagem do zero que a camada veio evitar.
 *
 * O `MainTabs` congela o elemento da aba, e quem precisa saber se ela está
 * coberta pergunta aqui. Só esses redesenham: a faixa da Composta, que para
 * de animar o que ninguém vê, e os avisos que abrem sozinhos.
 */
const Coberta = createContext(false);
export const ProvedorDeCobertura = Coberta.Provider;
export const useCoberta = () => useContext(Coberta);

/**
 * Só mostra o que tem dentro com a aba à vista.
 *
 * Para os avisos que abrem sozinhos — a comemoração de crescimento, a
 * colheita. Eles apareciam ao **voltar** para a Home, quando ela era montada
 * de novo; com a Home montada por baixo, abririam por cima da prática, no
 * meio dela. Aqui eles esperam a pessoa voltar, como antes.
 */
export function QuandoDescoberta({ children }: { children: React.ReactNode }) {
  return useCoberta() ? null : <>{children}</>;
}

/** Quanto a tela empilhada anda para os lados ao entrar e ao sair. */
const DESLIZE = 26;
const ENTRADA_MS = 260;
/** A saída é um pouco mais curta: quem pediu para voltar já quer estar lá. */
const SAIDA_MS = 220;

type Props<Chave extends string> = {
  /** A tela empilhada aberta agora, ou `null` quando nenhuma está. */
  aberta: Chave | null;
  /** Desenha a tela de uma chave — também a que está saindo, já fechada. */
  render: (chave: Chave) => React.ReactNode;
};

export function CamadaEmpilhada<Chave extends string>({ aberta, render }: Props<Chave>) {
  const menosMovimento = useMenosMovimento();
  /** A tela desenhada: a aberta, ou a que está saindo. */
  const [mostrada, setMostrada] = useState<Chave | null>(aberta);
  const [saindo, setSaindo] = useState(false);
  const [animando, setAnimando] = useState(false);
  const t = useRef(new Animated.Value(aberta ? 1 : 0)).current;

  useEffect(() => {
    if (aberta) {
      /*
        Trocar de uma tela empilhada para outra — da prática para o diário —
        não passa por aqui como entrada: a camada já está inteira, e quem
        anima a troca é a `ScreenTransition` de dentro.
      */
      setMostrada(aberta);
      setSaindo(false);
      if (menosMovimento) {
        t.setValue(1);
        return;
      }
      setAnimando(true);
      const entrada = Animated.timing(t, {
        toValue: 1,
        duration: ENTRADA_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      entrada.start(() => setAnimando(false));
      return () => entrada.stop();
    }

    if (menosMovimento) {
      t.setValue(0);
      setMostrada(null);
      return;
    }
    setSaindo(true);
    setAnimando(true);
    const saida = Animated.timing(t, {
      toValue: 0,
      duration: SAIDA_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    saida.start(({ finished }) => {
      setAnimando(false);
      /* Interrompida por uma tela nova abrindo: quem assume é a entrada dela. */
      if (!finished) return;
      setSaindo(false);
      setMostrada(null);
    });
    return () => saida.stop();
  }, [aberta, menosMovimento, t]);

  if (!mostrada) return null;

  return (
    <Animated.View
      testID="camada-empilhada"
      pointerEvents={saindo ? 'none' : 'auto'}
      renderToHardwareTextureAndroid={animando}
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: t,
          transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [DESLIZE, 0] }) }],
        },
      ]}
    >
      {/*
        A troca entre duas telas empilhadas — da prática para o diário — é um
        esmaecer por dentro. A entrada da primeira já é o deslize desta
        camada, então a de dentro não anima ao montar: as duas juntas davam um
        aparecer em câmera lenta.
      */}
      <ScreenTransition transitionKey={mostrada} mode="fade" semEntrada>
        {render(mostrada)}
      </ScreenTransition>
    </Animated.View>
  );
}

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';

import { useMenosMovimento } from '../hooks/useMenosMovimento';
import { useTema } from '../theme';
import { DURACAO_DA_TROCA, FRACAO_DO_DESLIZE } from './regrasDaTroca';
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
 *
 * ## E a resposta muda tarde de propósito
 *
 * Ela vira no **fim** da animação, e não no toque. Redesenhar a faixa custa
 * caro: medido no navegador com a CPU desacelerada quatro vezes, tocar em
 * Voltar travava a linha por **225 ms** — dentro dos 220 ms do deslize de
 * saída, ou seja, em cima da animação inteira. Virando no fim, o deslize não
 * tem nenhum trabalho de JavaScript pela frente, e o que a faixa perde é
 * continuar se mexendo por um quinto de segundo atrás de uma tela opaca.
 *
 * É a mesma regra do `seMexendo` das `AbasVivas`, pelo mesmo motivo.
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

/*
  O quanto a camada anda e quanto tempo leva vêm de `regrasDaTroca`.

  Eram números próprios — 26 pontos e 260 ms — parecidos com os da
  `ScreenTransition` mas não iguais, e dois deslizes parecidos e diferentes no
  mesmo app é o que se lê como "cada tela faz uma coisa".
*/
const ENTRADA_MS = DURACAO_DA_TROCA;
/** A saída é um pouco mais curta: quem pediu para voltar já quer estar lá. */
const SAIDA_MS = Math.round(DURACAO_DA_TROCA * 0.85);

type Props<Chave extends string> = {
  /** A tela empilhada aberta agora, ou `null` quando nenhuma está. */
  aberta: Chave | null;
  /** Desenha a tela de uma chave — também a que está saindo, já fechada. */
  render: (chave: Chave) => React.ReactNode;
  /**
   * Avisa que a aba de baixo passou a estar coberta, ou deixou de estar.
   *
   * Chamado no **fim** da animação, dos dois lados — ver o comentário do
   * contexto acima. É daqui que sai o valor do `ProvedorDeCobertura`.
   */
  aoCobrir: (coberta: boolean) => void;
};

export function CamadaEmpilhada<Chave extends string>({ aberta, render, aoCobrir }: Props<Chave>) {
  const { colors } = useTema();
  const { width } = useWindowDimensions();
  /** O mesmo caminho das telas de dentro, em fração da largura. */
  const DESLIZE = width * FRACAO_DO_DESLIZE;
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
        aoCobrir(true);
        return;
      }
      setAnimando(true);
      const entrada = Animated.timing(t, {
        toValue: 1,
        duration: ENTRADA_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      entrada.start(() => {
        setAnimando(false);
        aoCobrir(true);
      });
      /* Rede: sem o fim da animação, a aba de baixo ficaria se mexendo para sempre. */
      const seguranca = setTimeout(() => aoCobrir(true), ENTRADA_MS + 250);
      return () => {
        entrada.stop();
        clearTimeout(seguranca);
      };
    }

    if (menosMovimento) {
      t.setValue(0);
      setMostrada(null);
      aoCobrir(false);
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
      aoCobrir(false);
    });
    const seguranca = setTimeout(() => aoCobrir(false), SAIDA_MS + 250);
    return () => {
      saida.stop();
      clearTimeout(seguranca);
    };
  }, [aberta, menosMovimento, t, aoCobrir]);

  /*
    A tela empilhada, desenhada uma vez só por abertura.

    `render` devolve um elemento novo a cada chamada, e esta camada renderiza
    a cada toque que mexe no `MainTabs` e a cada passo do próprio estado
    (`saindo`, `animando`). O resultado era a tela de dentro sendo redesenhada
    inteira no instante do Voltar: medido, **215 ms** de linha travada em cima
    dos 220 ms do deslize de saída. Congelada, o React nem entra nela, e o
    deslize corre sozinho.

    Refaz quando a chave muda — que é quando a tela realmente é outra.
  */
  const desenhada = useRef<{ chave: Chave; no: React.ReactNode } | null>(null);
  if (mostrada !== null && desenhada.current?.chave !== mostrada) {
    desenhada.current = { chave: mostrada, no: render(mostrada) };
  }

  if (!mostrada) return null;

  return (
    <Animated.View
      testID="camada-empilhada"
      pointerEvents={saindo ? 'none' : 'auto'}
      renderToHardwareTextureAndroid={animando}
      /*
        A camada entra **opaca**, e só anda.

        Ela esmaecia de zero a um enquanto deslizava, e esmaecer uma tela
        inteira por cima de outra mostra, pelos 260 ms da entrada, as duas
        juntas: o cabeçalho das Configurações escrito por cima do "Oi, Pedro",
        a frase do dia atravessando a lista de ajustes. Congelado o meio da
        animação no navegador, dá para ler as duas. É o mesmo "piscar" que a
        troca de abas teve, e a regra que saiu de lá vale aqui: **nenhuma
        camada da troca pode ser translúcida** — ver `regrasDasAbas`.

        O fundo vem da `ScreenTransition` de dentro, que pinta a cor do app
        antes de qualquer conteúdo.
      */
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.bg,
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
      {/*
        A troca entre duas telas empilhadas — da prática para o diário — entra
        pelo lado, como todo o resto. A entrada da primeira já é o deslize
        desta camada, então a de dentro não anima ao montar.
      */}
      <ScreenTransition transitionKey={mostrada} semEntrada>
        {desenhada.current?.no}
      </ScreenTransition>
    </Animated.View>
  );
}

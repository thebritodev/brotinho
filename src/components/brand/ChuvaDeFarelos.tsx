import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { tracos } from '../../theme/tokens';
import {
  FARELOS_POR_ETAPA,
  curvaDaAltura,
  soltarFarelos,
  type Farelo,
} from './quedaDosFarelos';
import { TERRA, TERRA_FUNDA, TERRA_SOMBRA } from './terraDoCanteiro';

/**
 * A camada por onde caem os farelos de terra quando o buraco da Frase do dia
 * se abre.
 *
 * ## Por que ela mora na tela inicial, e não na faixa
 *
 * O farelo tem de cair a tela **inteira** e sumir por trás da barra de
 * navegação. Dentro da faixa ele ficaria preso à rolagem — rolaria junto com
 * ela — e não teria como passar por baixo da barra, que é desenhada depois da
 * tela, por cima dela. Aqui ele cai em coordenadas da tela, por cima de tudo o
 * que a tela inicial desenha e por baixo da barra; ninguém precisa escondê-lo
 * no fim, a barra esconde.
 *
 * ## Como a faixa fala com ela
 *
 * A faixa mede onde o buraco está **na janela** no instante em que ele cede, e
 * manda isso para cá. Esta camada mede onde ela mesma está na janela, e a
 * diferença é o ponto de partida. As duas medidas são feitas na hora, então
 * não importa quanto a pessoa tenha rolado.
 */

export type OrigemDosFarelos = {
  /** O centro do buraco, em pontos da janela. */
  x: number;
  y: number;
  meiaLargura: number;
  meiaAltura: number;
  /** Qual dos três estágios da abertura: decide quantos farelos. */
  etapa: 1 | 2 | 3;
};

export type ChuvaDeFarelosRef = {
  soltar: (origem: OrigemDosFarelos) => void;
};

type Rajada = { id: number; farelos: Farelo[] };

/** As três cores de terra, na ordem de `Farelo.tom`. */
const TONS = [TERRA, TERRA_FUNDA, TERRA_SOMBRA] as const;

export const ChuvaDeFarelos = forwardRef<ChuvaDeFarelosRef>(function ChuvaDeFarelos(_, ref) {
  const raiz = useRef<View>(null);
  const [rajadas, setRajadas] = useState<Rajada[]>([]);
  const contador = useRef(0);

  useImperativeHandle(ref, () => ({
    soltar: (origem) => {
      const camada = raiz.current;
      if (!camada) return;
      camada.measureInWindow((rx, ry, largura, altura) => {
        const id = (contador.current += 1);
        const farelos = soltarFarelos({
          cx: origem.x - rx,
          cy: origem.y - ry,
          meiaLargura: origem.meiaLargura,
          meiaAltura: origem.meiaAltura,
          fim: altura,
          largura,
          quantos: FARELOS_POR_ETAPA[origem.etapa - 1],
          /* A mesma rajada no mesmo estágio: repetível, e diferente por estágio. */
          semente: 7919 * origem.etapa + Math.round(origem.x),
        });
        setRajadas((agora) => [...agora, { id, farelos }]);
      });
    },
  }));

  return (
    <View ref={raiz} collapsable={false} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {rajadas.map((r) => (
        <RajadaDeFarelos
          key={r.id}
          farelos={r.farelos}
          aoTerminar={() => setRajadas((agora) => agora.filter((x) => x.id !== r.id))}
        />
      ))}
    </View>
  );
});

/**
 * Uma leva de farelos: um relógio só para todos, em milissegundos.
 *
 * Cada farelo lê o mesmo relógio pela curva dele — o mesmo desenho que
 * resolveu as palavras da Composta. Um valor animado por farelo seriam trinta
 * animações partindo de um temporizador cada; aqui é uma, no driver nativo.
 */
function RajadaDeFarelos({ farelos, aoTerminar }: { farelos: Farelo[]; aoTerminar: () => void }) {
  const relogio = useRef(new Animated.Value(0)).current;
  const maior = Math.max(1, ...farelos.map((f) => f.duracaoMs));

  useEffect(() => {
    const animacao = Animated.timing(relogio, {
      toValue: maior,
      duration: maior,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animacao.start(({ finished }) => {
      if (finished) aoTerminar();
    });
    return () => animacao.stop();
    // A rajada nasce, cai uma vez e some: não reinicia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {farelos.map((f, i) => {
        const fim = f.duracaoMs;
        const y = relogio.interpolate({ ...curvaDaAltura(f), extrapolate: 'clamp' });
        const x = relogio.interpolate({
          inputRange: [0, fim],
          outputRange: [f.x0, f.x0 + (f.vx * fim) / 1000],
          extrapolate: 'clamp',
        });
        const giro = relogio.interpolate({
          inputRange: [0, fim],
          outputRange: ['0deg', `${(f.giro * fim) / 1000}deg`],
          extrapolate: 'clamp',
        });
        /* Os maiores levam contorno, como todo desenho do app; os menores, não. */
        const comContorno = f.raio >= 2.8;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: -f.raio,
              top: -f.raio,
              width: f.raio * 2,
              height: f.raio * 1.7,
              borderRadius: f.raio,
              backgroundColor: TONS[f.tom],
              borderWidth: comContorno ? 1 : 0,
              borderColor: tracos.contorno,
              transform: [{ translateX: x }, { translateY: y }, { rotate: giro }],
            }}
          />
        );
      })}
    </>
  );
}

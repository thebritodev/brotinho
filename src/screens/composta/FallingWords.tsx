import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { palette, fonts } from '../../theme';

type Particle = {
  id: number;
  text: string;
  /** Posição horizontal em % da largura. */
  x: number;
  top: number;
  size: number;
  duration: number;
};

function Falling({ p, onDone }: { p: Particle; onDone: (id: number) => void }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: p.duration,
      easing: Easing.bezier(0.35, 0.1, 0.7, 1),
      useNativeDriver: true,
    }).start(() => onDone(p.id));
    // A partícula é descartável: anima uma vez e some.
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: `${p.x}%`,
        top: `${p.top}%`,
        fontFamily: fonts.body.bold,
        fontSize: p.size,
        color: palette.brown400,
        opacity: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.9, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, 150] }) },
          {
            rotate: t.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${p.id % 2 === 0 ? 18 : -18}deg`],
            }),
          },
        ],
      }}
    >
      {p.text}
    </Animated.Text>
  );
}

type Props = {
  /** Cada incremento solta um punhado de palavras. */
  tick: number;
  /** Frase de onde saem as palavras. */
  thought: string;
};

/**
 * As palavras da frase se soltando e caindo — a parte visível da compostagem.
 * Cada repetição desprende uma ou duas.
 */
export function FallingWords({ tick, thought }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (tick === 0) return;

    const words = thought.split(/\s+/).filter(Boolean);
    if (!words.length) return;

    const howMany = 1 + Math.floor(Math.random() * 2);
    const novas: Particle[] = Array.from({ length: howMany }).map(() => ({
      id: ++nextId.current,
      text: words[Math.floor(Math.random() * words.length)],
      x: 12 + Math.random() * 60,
      top: 22 + Math.random() * 18,
      size: 13 + Math.random() * 5,
      duration: 1400 + Math.random() * 600,
    }));

    setParticles((prev) => [...prev, ...novas]);
  }, [tick]);

  const remove = (id: number) => setParticles((prev) => prev.filter((p) => p.id !== id));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Falling key={p.id} p={p} onDone={remove} />
      ))}
    </View>
  );
}

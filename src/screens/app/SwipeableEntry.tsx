import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { Card, Icon } from '../../components';
import { colors, palette, radius, fonts } from '../../theme';

/**
 * Registro do diario que revela acoes ao ser arrastado para a esquerda.
 *
 * Usa `react-native-gesture-handler` em vez de `PanResponder`: dentro de um
 * ScrollView, a negociacao feita em JavaScript perde o gesto para a rolagem.
 * O gesture-handler resolve essa disputa na camada nativa.
 */

/** Largura total da faixa de acoes escondida a direita. */
const ACTIONS_WIDTH = 152;

/** Quantas linhas do registro aparecem na lista antes das reticências. */
const LINHAS_NA_LISTA = 4;

type Props = {
  id: string;
  date: string;
  text: string;
  onEdit: () => void;
  /** Toque na linha: abre o registro inteiro para leitura. */
  onRead: () => void;
  onDelete: () => void;
  /** Id da linha aberta no momento; as outras se fecham. */
  openId: string | null;
  onOpen: (id: string | null) => void;
};

export function SwipeableEntry({ id, date, text, onEdit, onRead, onDelete, openId, onOpen }: Props) {
  const ref = useRef<Swipeable>(null);
  /** Esta linha esta aberta agora? Evita mandar fechar quem ja esta fechado. */
  const aberta = useRef(false);

  // So uma linha aberta por vez.
  useEffect(() => {
    if (openId !== id && aberta.current) ref.current?.close();
  }, [openId, id]);

  const acao = (
    rotulo: string,
    icone: 'pencil' | 'trash',
    fundo: string,
    aoTocar: () => void,
  ) => (
    <Pressable
      onPress={() => {
        ref.current?.close();
        aoTocar();
      }}
      style={{
        width: ACTIONS_WIDTH / 2,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: fundo,
      }}
    >
      <Icon name={icone} size={20} color="#fff" />
      <Text style={{ fontFamily: fonts.body.bold, fontSize: 12, color: '#fff' }}>{rotulo}</Text>
    </Pressable>
  );

  const acoes = (progresso: Animated.AnimatedInterpolation<number>) => {
    // As acoes acompanham o cartao em vez de aparecerem prontas atras dele.
    const translateX = progresso.interpolate({
      inputRange: [0, 1],
      outputRange: [ACTIONS_WIDTH / 2, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={{ flexDirection: 'row', width: ACTIONS_WIDTH, transform: [{ translateX }] }}
      >
        {acao('Editar', 'pencil', colors.primary, onEdit)}
        {acao('Excluir', 'trash', colors.danger, onDelete)}
      </Animated.View>
    );
  };

  return (
    <View style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
      <Swipeable
        ref={ref}
        // friction 1 = o cartao acompanha o dedo na razao de 1 para 1.
        friction={1}
        // Distancia a partir da qual soltar deixa a faixa aberta.
        rightThreshold={40}
        overshootRight={false}
        onSwipeableWillOpen={() => {
          aberta.current = true;
          onOpen(id);
        }}
        onSwipeableClose={() => {
          aberta.current = false;
          // So limpa se ESTA era a linha aberta. Sem esta guarda, o fechamento
          // das outras linhas zerava o estado e fechava a que acabou de abrir.
          if (openId === id) onOpen(null);
        }}
        renderRightActions={acoes}
      >
        {/* O corte em LINHAS_NA_LISTA existe para um desabafo comprido não
            virar um cartão de várias telas de altura. O texto inteiro fica a
            um toque — antes só dava para reler entrando em "Editar", o que
            sugeria que você ia alterar alguma coisa. */}
        <Card onPress={onRead}>
          <Text
            style={{
              fontFamily: fonts.body.extraBold,
              fontSize: 13,
              color: colors.primaryStrong,
              marginBottom: 6,
            }}
          >
            {date}
          </Text>
          <Text
            numberOfLines={LINHAS_NA_LISTA}
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 14,
              lineHeight: 14 * 1.5,
              color: palette.brown700,
            }}
          >
            {text}
          </Text>
        </Card>
      </Swipeable>
    </View>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { Card, Icon } from '../../components';
import { fonts, radius, useTema } from '../../theme';

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
  const { colors, palette, shadows } = useTema();
  /**
   * As mesmas duas ações, alcançáveis sem gesto nenhum.
   *
   * Editar e excluir só existiam arrastando o cartão. Quem tem limitação
   * motora, ou navega por leitor de tela, **não conseguia apagar o próprio
   * desabafo** — e num app cuja promessa é que os dados são dela, isso pesa
   * mais que a média. A recomendação da literatura de design para pessoas em
   * sofrimento é direta: todo gesto precisa de alternativa em botão.
   *
   * O arrastar continua igual para quem já usa.
   */
  const [menuAberto, setMenuAberto] = useState(false);
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
      accessibilityRole="button"
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
      <Text style={{ fontFamily: fonts.body.bold, fontSize: 12, color: colors.textInverse }}>{rotulo}</Text>
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
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.body.extraBold,
                fontSize: 13,
                color: colors.primaryStrong,
                marginBottom: 6,
              }}
            >
              {date}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Opções do registro de ${date}`}
              onPress={() => setMenuAberto(true)}
              hitSlop={10}
              style={{ width: 28, height: 22, alignItems: 'flex-end', justifyContent: 'center' }}
            >
              <Icon name="more" size={18} color={palette.brown400} />
            </Pressable>
          </View>
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

      <Modal
        visible={menuAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuAberto(false)}
      >
        {/* Tocar fora fecha, como qualquer folha de ações do sistema. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          onPress={() => setMenuAberto(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
            justifyContent: 'flex-end',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              overflow: 'hidden',
              ...shadows.lg,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 13,
                color: palette.brown400,
                padding: 16,
              }}
            >
              {date}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMenuAberto(false);
                onEdit();
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 44 }}
            >
              <Icon name="pencil" size={20} color={colors.primary} />
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 15, color: colors.textPrimary }}>Editar</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMenuAberto(false);
                onDelete();
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 44 }}
            >
              <Icon name="trash" size={20} color={colors.danger} />
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 15, color: colors.danger }}>Excluir</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

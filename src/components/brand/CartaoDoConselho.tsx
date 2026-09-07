import React, { useEffect, useId, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { entreAspas } from '../../data/conselhos';
import { fonts, radius, useTema } from '../../theme';
import { Button } from '../core/Button';
import { Card } from '../core/Card';
import { Icon } from '../core/Icon';
import { Desenterrar } from './Desenterrar';

/**
 * O cartão de "Frase do dia" na Home, e o momento que ele abre.
 *
 * ## O toque é o que autoriza o tom
 *
 * As frases daqui falam duro, ao contrário de todo o resto do app — o porquê
 * está inteiro em `data/conselhos.ts`. O que sustenta a diferença é que **esta
 * é a única coisa do Brotinho que a pessoa vai buscar**: a saudação aparece, o
 * lembrete chega, o broto responde. Isto não acontece sem toque.
 *
 * Daí duas coisas que este arquivo garante e que não podem ser "melhoradas"
 * depois:
 *
 * - **O cartão fechado não mostra a frase.** Nem um pedaço, nem desbotada ao
 *   fundo. Espiar de graça é o mesmo que a frase ter chegado sozinha.
 * - **Nada aqui abre por conta própria.** Sem abertura automática ao entrar na
 *   Home, sem "abre sozinho depois de três dias sem tocar".
 *
 * ## Por que este cartão é de terra e os outros são de creme
 *
 * Porque ele sumia. Estava embaixo de dois cartões idênticos entre si e vestido
 * com o mesmo creme translúcido de todos os outros — lia como o terceiro item
 * de uma lista de atalhos, e a pessoa passava direto.
 *
 * Subir na tela resolveu metade. A outra metade é esta: é a única seção do app
 * com **voz** própria, então ela tem **cara** própria. O tom de terra também é
 * o assunto do desenho, e não uma cor escolhida por ser diferente — o que
 * acontece aqui é desenterrar.
 *
 * ## Depois de aberta, ela fica
 *
 * Aberto o dia, o cartão passa a mostrar a frase direto, sem animação e sem
 * precisar tocar. A encenação é para a primeira vez do dia; repetir a cada
 * relance transformaria um momento em pedágio.
 */

/* O canteiro do cartão fechado, num quadrado de 60. */
const PLOT = { cx: 30, cy: 40, rx: 25, ry: 10 };
/** A saliência: alguma coisa empurrando a terra por baixo. */
const SALIENCIA = 'M19 34 Q30 24 41 34';
/** Torrõezinhos soltos, para a terra não ser uma mancha lisa. */
const GRAOS = [
  { x: 14, y: 41, r: 1.5 },
  { x: 44, y: 42, r: 1.2 },
  { x: 22, y: 45, r: 1 },
  { x: 38, y: 46, r: 1.4 },
];
const TERRA = '#8A7A63';
const TERRA_FUNDA = '#5F5443';
const TERRA_CLARA = '#A3927A';
const TERRA_SOMBRA = '#4B4237';
/** O calor que escapa de baixo da terra: a dica de que tem algo ali. */
const BRASA = '#E8B65A';

export type CartaoDoConselhoProps = {
  /** A frase de hoje. */
  texto: string;
  /** true quando a pessoa já desenterrou hoje. */
  aberto: boolean;
  /** true quando esta frase está entre as guardadas. */
  guardada: boolean;
  /** Chamado no primeiro toque do dia, antes da animação. */
  onDesenterrar: () => void;
  onGuardar: () => void;
  onVerGuardadas: () => void;
  /** Quantas frases a pessoa já guardou. */
  totalGuardadas: number;
  /** Abre a folha de compartilhamento com a frase virada em imagem. */
  onCompartilhar: () => void;
  /** true enquanto a imagem do story está sendo montada. */
  compartilhando?: boolean;
  /** Recado de quando não deu para compartilhar. `null` quando deu. */
  aviso?: string | null;
};

export function CartaoDoConselho({
  texto,
  aberto,
  guardada,
  onDesenterrar,
  onGuardar,
  onVerGuardadas,
  totalGuardadas,
  onCompartilhar,
  compartilhando = false,
  aviso = null,
}: CartaoDoConselhoProps) {
  const { colors, palette, shadows } = useTema();
  const [abrindo, setAbrindo] = useState(false);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  /*
    O cartão em tom de terra, contra o creme de todos os outros — e com um fio
    de luz na borda de cima.

    O fio é o que separa "cartão de terra" de "retângulo marrom": sem ele a
    superfície não tem para onde a luz vir, e a peça fica chapada no meio de
    vizinhos que têm brilho de vidro. A sombra também sobe de `sm` para `md`,
    porque este cartão precisa parecer estar **em cima** dos outros, não ao lado.
  */
  const pele = {
    backgroundColor: palette.brown200,
    borderWidth: 0,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.34)',
    ...shadows.md,
  };

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Text
          style={{ fontFamily: fonts.display.semiBold, fontSize: 19, color: colors.textPrimary }}
        >
          Frase do dia
        </Text>

        {/*
          A porta das guardadas, e ela é **fixa**.

          Antes só existia um "3 guardadas" no rodapé, que aparecia depois de a
          pessoa guardar a primeira. Quem nunca guardou nada nunca via — ou
          seja, o recurso só se anunciava para quem já o tinha descoberto.
        */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            totalGuardadas > 0
              ? `Ver as ${totalGuardadas} frases guardadas`
              : 'Ver as frases guardadas'
          }
          onPress={onVerGuardadas}
          hitSlop={10}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Icon name="heart" size={18} color={colors.textSecondary} />
          {totalGuardadas > 0 && (
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 14, color: colors.textSecondary }}
            >
              {totalGuardadas}
            </Text>
          )}
        </Pressable>
      </View>

      {aberto ? (
        <Card padding={18} style={[pele, { gap: 14 }]}>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 16,
              lineHeight: 16 * 1.55,
              color: palette.brown900,
            }}
          >
            {entreAspas(texto)}
          </Text>
          <Rodape
            guardada={guardada}
            onGuardar={onGuardar}
            onCompartilhar={onCompartilhar}
            compartilhando={compartilhando}
          />
          {!!aviso && <Aviso texto={aviso} sobreTerra />}
        </Card>
      ) : (
        <Card
          padding={18}
          label="Desenterrar a frase de hoje"
          onPress={() => {
            // A anotação vem antes da animação: se a pessoa fechar no meio, o
            // dia já está marcado e ela reabre na mesma frase, e não em outra.
            onDesenterrar();
            setAbrindo(true);
          }}
          style={[pele, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}
        >
          <Svg viewBox="0 0 60 60" width={60} height={60}>
            <Defs>
              <LinearGradient id={`terrinha-${id}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={TERRA_CLARA} />
                <Stop offset="0.5" stopColor={TERRA} />
                <Stop offset="1" stopColor={TERRA_SOMBRA} />
              </LinearGradient>
              <RadialGradient id={`sombrinha-${id}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#3A3630" stopOpacity={0.26} />
                <Stop offset="1" stopColor="#3A3630" stopOpacity={0} />
              </RadialGradient>
              {/* O calor por baixo da saliência: a única pista do que tem ali. */}
              <RadialGradient id={`brasa-${id}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={BRASA} stopOpacity={0.5} />
                <Stop offset="1" stopColor={BRASA} stopOpacity={0} />
              </RadialGradient>
            </Defs>

            {/* Ordem: brilho por trás, sombra no chão, terra, luz na crista, grãos. */}
            <Ellipse cx={30} cy={31} rx={15} ry={11} fill={`url(#brasa-${id})`} />
            <Ellipse cx={30} cy={48} rx={28} ry={6} fill={`url(#sombrinha-${id})`} />
            <Ellipse
              cx={PLOT.cx}
              cy={PLOT.cy}
              rx={PLOT.rx}
              ry={PLOT.ry}
              fill={`url(#terrinha-${id})`}
            />
            <Path
              d={SALIENCIA}
              stroke={TERRA_FUNDA}
              strokeWidth={2.6}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M8 38 Q30 28 52 38"
              stroke={TERRA_CLARA}
              strokeWidth={1.6}
              strokeLinecap="round"
              fill="none"
              opacity={0.6}
            />
            {GRAOS.map((g) => (
              <Ellipse
                key={`${g.x}:${g.y}`}
                cx={g.x}
                cy={g.y}
                rx={g.r}
                ry={g.r * 0.8}
                fill={TERRA_FUNDA}
                opacity={0.5}
              />
            ))}
          </Svg>
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              style={{
                fontFamily: fonts.display.semiBold,
                fontSize: 17,
                color: palette.brown900,
              }}
            >
              Tem uma frase enterrada aqui
            </Text>
            <Text
              style={{ fontFamily: fonts.body.regular, fontSize: 13.5, color: palette.brown700 }}
            >
              Uma por dia. Toque para desenterrar.
            </Text>
          </View>
          <Icon name="chevronRight" color={palette.brown700} />
        </Card>
      )}

      <Modal
        visible={abrindo}
        transparent
        animationType="fade"
        onRequestClose={() => setAbrindo(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 22 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => setAbrindo(false)}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.45)' }]}
          />
          <View
            style={{
              backgroundColor: colors.bg,
              borderRadius: radius.lg,
              padding: 22,
              gap: 18,
              alignItems: 'center',
            }}
          >
            <ConselhoRevelado
              texto={texto}
              guardada={guardada}
              onGuardar={onGuardar}
              onCompartilhar={onCompartilhar}
              compartilhando={compartilhando}
              aviso={aviso}
              onFechar={() => setAbrindo(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

/**
 * O conteúdo do momento: o botão sobe, desabrocha, e só então a frase entra.
 *
 * Vive num componente próprio porque o `Modal` só monta os filhos quando abre —
 * e é essa montagem que dá o start na animação. Com isto no corpo do cartão, a
 * flor abriria escondida enquanto ninguém olha, e a pessoa encontraria a frase
 * já posta ao abrir o modal na segunda vez do dia.
 */
function ConselhoRevelado({
  texto,
  guardada,
  onGuardar,
  onCompartilhar,
  compartilhando,
  aviso,
  onFechar,
}: {
  texto: string;
  guardada: boolean;
  onGuardar: () => void;
  onCompartilhar: () => void;
  compartilhando: boolean;
  aviso: string | null;
  onFechar: () => void;
}) {
  const { colors } = useTema();
  const entrada = useRef(new Animated.Value(0)).current;
  const [revelado, setRevelado] = useState(false);

  useEffect(() => {
    if (!revelado) return;
    Animated.timing(entrada, {
      toValue: 1,
      duration: 520,
      useNativeDriver: true,
    }).start();
  }, [revelado, entrada]);

  return (
    <>
      <Desenterrar size={142} onAberto={() => setRevelado(true)} />

      {/*
        Ocupa o lugar desde o começo, com opacidade zero: se a frase entrasse no
        layout só ao aparecer, o cartão daria um pulo de altura bem no instante
        em que a pessoa está lendo a primeira linha.
      */}
      <Animated.View
        style={{
          opacity: entrada,
          transform: [
            { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
          gap: 18,
          alignSelf: 'stretch',
        }}
        pointerEvents={revelado ? 'auto' : 'none'}
      >
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 18,
            lineHeight: 18 * 1.55,
            color: colors.textPrimary,
            textAlign: 'center',
          }}
        >
          {entreAspas(texto)}
        </Text>

        <Rodape
          guardada={guardada}
          onGuardar={onGuardar}
          onCompartilhar={onCompartilhar}
          compartilhando={compartilhando}
          centralizado
        />

        {!!aviso && <Aviso texto={aviso} />}

        <Button variant="ghost" style={{ width: '100%' }} onPress={onFechar}>
          Fechar
        </Button>
      </Animated.View>
    </>
  );
}

/**
 * O recado de quando compartilhar não deu.
 *
 * Sem isto o botão só voltava ao normal e a pessoa tocava de novo achando que
 * tinha errado o toque. O caso mais comum tem conserto e a frase diz qual:
 * atualizar o app.
 */
function Aviso({ texto, sobreTerra = false }: { texto: string; sobreTerra?: boolean }) {
  const { colors, palette } = useTema();
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={{
        fontFamily: fonts.body.regular,
        fontSize: 13,
        lineHeight: 13 * 1.45,
        color: sobreTerra ? palette.brown700 : colors.textSecondary,
        textAlign: sobreTerra ? 'left' : 'center',
      }}
    >
      {texto}
    </Text>
  );
}

/** Guardar e compartilhar — as duas coisas que se pode fazer com a frase. */
function Rodape({
  guardada,
  onGuardar,
  onCompartilhar,
  compartilhando,
  centralizado = false,
}: {
  guardada: boolean;
  onGuardar: () => void;
  onCompartilhar: () => void;
  compartilhando: boolean;
  centralizado?: boolean;
}) {
  const { colors, palette } = useTema();
  /* No cartão de terra o texto secundário precisa do marrom da paleta; no modal,
     que é creme, o secundário do tema já serve. */
  const tinta = centralizado ? colors.textSecondary : palette.brown700;
  const aceso = centralizado ? colors.primaryStrong : palette.green700;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: centralizado ? 'center' : 'flex-start',
        gap: 22,
      }}
    >
      <Acao
        icone="heart"
        rotulo={guardada ? 'Guardada' : 'Guardar'}
        acessivel={guardada ? 'Tirar das guardadas' : 'Guardar esta frase'}
        selecionado={guardada}
        onPress={onGuardar}
        tinta={tinta}
        aceso={aceso}
      />
      <Acao
        icone="compartilhar"
        rotulo={compartilhando ? 'Preparando…' : 'Compartilhar'}
        acessivel="Compartilhar esta frase como imagem"
        selecionado={false}
        onPress={onCompartilhar}
        desabilitado={compartilhando}
        tinta={tinta}
        aceso={aceso}
      />
    </View>
  );
}

function Acao({
  icone,
  rotulo,
  acessivel,
  selecionado,
  onPress,
  desabilitado = false,
  tinta,
  aceso,
}: {
  icone: 'heart' | 'compartilhar';
  rotulo: string;
  acessivel: string;
  selecionado: boolean;
  onPress: () => void;
  desabilitado?: boolean;
  tinta: string;
  aceso: string;
}) {
  const cor = selecionado ? aceso : tinta;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado, disabled: desabilitado }}
      accessibilityLabel={acessivel}
      onPress={onPress}
      disabled={desabilitado}
      hitSlop={8}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        opacity: desabilitado ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icone} size={19} color={cor} />
      <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 14, color: cor }}>{rotulo}</Text>
    </Pressable>
  );
}

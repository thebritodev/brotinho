import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Sprout } from '../../components';
import { calar, falar } from '../../services/voz';
import { useAppState } from '../../state/AppStateProvider';
import { fonts, radius, useTema } from '../../theme';

/**
 * O guia dos passos de uma prática — o que não é respiração.
 *
 * ## O relógio deixou de mandar
 *
 * Ele avançava sozinho: acabou o tempo do passo, o próximo entrava. Isso serve
 * para respiração, onde o ritmo **é** o exercício, e não serve para nenhum dos
 * outros — os passos daqui pedem para olhar em volta e nomear cinco coisas,
 * escolher uma tarefa mínima, lembrar de uma pessoa. Pensar não cabe num
 * cronômetro, e quem estava no meio de um pensamento via a tela trocar sem ter
 * pedido.
 *
 * Agora o tempo é **referência**: ele conta, chega a zero e espera. O passo só
 * muda no toque. Quem quer o ritmo sugerido olha o número; quem precisa de mais
 * tempo simplesmente fica.
 *
 * ## Pausar e voltar
 *
 * Antes havia dois caminhos: seguir, ou parar a prática inteira. Quem se
 * distraía no terceiro de cinco passos tinha de recomeçar do primeiro — e
 * distrair-se é exatamente o que acontece com quem está ansioso, que é para
 * quem estas práticas existem.
 *
 * ## A voz
 *
 * Cada passo é dito em voz alta quando começa. Não é enfeite: a primeira
 * prática a usar isto é o Aterramento 5-4-3-2-1, que é a que a porta de
 * "estou muito mal agora" abre, e o comentário que a nomeia em
 * `data/practices.ts` já dizia o que faltava — *"em crise ninguém lê, alguém
 * precisa conduzir"*. Ela conduzia por escrito, para quem não estava em
 * condição de ler.
 *
 * A voz diz o rótulo e o texto do passo numa frase só. A pontuação entre os
 * dois é o que dá a pausa: duas chamadas seguidas entrariam na fila do
 * sintetizador e sairiam coladas, sem respiro entre a instrução e o
 * exemplo.
 *
 * Ela cala em toda saída — seguir, voltar, pausar, parar e desmontar. Passo
 * novo falando por cima do anterior é pior do que silêncio, e quem toca em
 * "Seguir" no meio da frase está dizendo que já ouviu o bastante.
 *
 * O que ela fala é sempre texto de `data/practices.ts`. A regra e o motivo
 * estão em `services/voz.ts`.
 *
 * ## Pausar e voltar
 *
 * Antes havia dois caminhos: seguir, ou parar a prática inteira. Quem se
 * distraía no terceiro de cinco passos tinha de recomeçar do primeiro — e
 * distrair-se é exatamente o que acontece com quem está ansioso, que é para
 * quem estas práticas existem.
 *
 * A pausa para o relógio sem sair do passo. O voltar recomeça o passo anterior,
 * com o tempo dele inteiro de novo.
 */

type Step = { label: string; text: string; seconds: number };

type Props = {
  steps: Step[];
  onDone: () => void;
  onCancel: () => void;
};

export function StepGuide({ steps, onDone, onCancel }: Props) {
  const { colors, palette } = useTema();
  const { data } = useAppState();
  const comVoz = data.settings.voz;
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(steps[0].seconds);
  const [pausado, setPausado] = useState(false);

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const primeiro = index === 0;
  /** O tempo sugerido acabou; daqui em diante quem decide é o toque. */
  const noSeuTempo = left === 0;

  const avançar = () => {
    calar();
    if (isLast) return onDone();
    setIndex((i) => i + 1);
  };

  const voltar = () => {
    if (primeiro) return;
    calar();
    setIndex((i) => i - 1);
  };

  const parar = () => {
    calar();
    onCancel();
  };

  /*
    O relógio zera a cada passo e para no zero — não chama `avançar`.

    `setLeft` no corpo do efeito (e não no `useState`) porque o passo muda sem
    o componente remontar: sem isto, o segundo passo herdaria o tempo restante
    do primeiro.
  */
  useEffect(() => {
    setLeft(steps[index].seconds);
    setPausado(false);
  }, [index, steps]);

  /*
    O passo novo é dito em voz alta.

    `comVoz` fica de fora das dependências de propósito: desligar a voz no
    meio de uma prática deve calar o que está sendo dito, e não fazer o passo
    ser lido de novo quando ela for religada.
  */
  useEffect(() => {
    if (!comVoz) {
      calar();
      return;
    }
    const passo = steps[index];
    falar(`${passo.label}. ${passo.text}`);
    return calar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, steps]);

  useEffect(() => {
    if (pausado || left === 0) return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [pausado, left]);

  const botaoDoRelogio = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={pausado ? 'Continuar o tempo' : 'Pausar o tempo'}
      accessibilityState={{ disabled: noSeuTempo }}
      disabled={noSeuTempo}
      onPress={() => {
        // Pausar o relógio cala o que estiver sendo dito; voltar a andar não
        // repete o passo, que a essa altura já foi ouvido.
        if (!pausado) calar();
        setPausado((p) => !p);
      }}
      hitSlop={10}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        backgroundColor: colors.primarySoft,
        opacity: noSeuTempo ? 0 : pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.body.bold, fontSize: 13, color: colors.primaryStrong }}>
        {pausado ? 'Continuar' : 'Pausar'}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, padding: 24, gap: 24 }}>
      {/* Trilha de progresso: um traço por etapa. */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {steps.map((s, i) => (
          <View
            key={s.label}
            style={{
              flex: 1,
              height: 5,
              borderRadius: radius.pill,
              backgroundColor: i <= index ? colors.primary : palette.brown100,
            }}
          />
        ))}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Sprout mood="leve" stage={2} size={120} />

        <Text
          style={{
            fontFamily: fonts.display.bold,
            fontSize: 26,
            lineHeight: 26 * 1.25,
            textAlign: 'center',
            color: colors.textPrimary,
          }}
        >
          {step.label}
        </Text>

        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 16,
            lineHeight: 16 * 1.5,
            textAlign: 'center',
            color: palette.brown700,
          }}
        >
          {step.text}
        </Text>

        {/*
          O número continua grande, mas agora ele informa em vez de mandar.
          Chegando a zero, ele dá lugar a uma frase que diz o que está
          acontecendo: nada. O passo espera.
        */}
        {noSeuTempo ? (
          <Text
            accessibilityLiveRegion="polite"
            style={{
              fontFamily: fonts.body.bold,
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            Sem pressa. Siga quando quiser.
          </Text>
        ) : (
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Text
              style={{
                fontFamily: fonts.display.bold,
                fontSize: 40,
                color: pausado ? colors.textSecondary : colors.primaryStrong,
              }}
            >
              {left}
            </Text>
            {botaoDoRelogio}
          </View>
        )}
      </View>

      <View style={{ gap: 10 }}>
        <Button variant="primary" style={{ width: '100%' }} onPress={avançar}>
          {isLast ? 'Concluir' : 'Seguir'}
        </Button>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/*
            O voltar só existe a partir do segundo passo. No primeiro ele seria
            um botão que não faz nada — pior que não ter botão.
          */}
          {!primeiro && (
            <Button variant="ghost" style={{ flex: 1 }} onPress={voltar}>
              Voltar um passo
            </Button>
          )}
          <Button variant="ghost" style={{ flex: 1 }} onPress={parar}>
            Parar
          </Button>
        </View>
      </View>
    </View>
  );
}

import React from 'react';
import { Text, View } from 'react-native';

import { fonts, radius, useTema } from '../../theme';
import type { DiaDePratica } from '../../state/derived';
import { FolhaDoSelo } from './folhaDoSelo';

/** O disco de cada dia, do documento. */
const DISCO = 36;
/** A folga que o anel de hoje precisa em volta do disco: 2,5 + 2,5. */
const ANEL = 5;

type Props = {
  dias: DiaDePratica[];
};

/**
 * A semana em sete discos: onde ela praticou, e onde é hoje.
 *
 * ## Por que ela abre a tela
 *
 * É a única coisa da tela inicial que olha para **trás**, e é a mais curta.
 * Logo abaixo do nome, antes de qualquer oferta, ela responde "o que eu venho
 * fazendo" numa olhada — e é essa resposta que dá sentido ao resto: um convite
 * a praticar lê diferente para quem vê quatro folhas atrás dele.
 *
 * ## Por que a folha, e não um "check"
 *
 * Um tique é um item cumprido numa lista de tarefas, e esta é a diferença que o
 * app inteiro tenta sustentar: fazer uma prática não é cumprir tarefa, é regar
 * a planta. A folha é o mesmo sinal que aparece na sequência ao lado do nome e
 * na data de cada prática feita — uma só, de um arquivo só. Ver `FolhaDoSelo`.
 *
 * ## Dia vazio e dia que não chegou
 *
 * Os dois são o disco branco com o fio em volta, e isso é de propósito. A
 * distinção existe no dado (`futuro`, em `semanaDePraticas`) e é levada a sério
 * onde tem consequência — na fita de humor do resumo, onde um dia sem registro
 * é uma ausência dela e um dia futuro não é. Aqui a fita só promete, e marcar a
 * quarta-feira que ainda nem chegou como "não praticou" seria cobrar o
 * impossível. Ver `moodWeek` para o argumento inteiro.
 *
 * ## O anel de hoje
 *
 * É um anel por fora, com um fio da cor do fundo entre ele e o disco — do
 * documento. Ele é desenhado com `padding` e `borderWidth` em vez de sombra
 * porque sombra `inset` não é confiável no Android com a Fabric desligada, e
 * este é o único marcador da tela que diz "você está aqui".
 */
export function FaixaDaSemana({ dias }: Props) {
  const { colors, palette, shadows } = useTema();

  return (
    <View
      style={{
        paddingTop: 14,
        paddingHorizontal: 12,
        paddingBottom: 10,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        ...shadows.sm,
      }}
    >
      {dias.map((dia) => (
        <View
          key={dia.date}
          accessible
          accessibilityLabel={`${dia.date}${dia.praticou ? ', praticou' : ''}`}
          style={{ flex: 1, alignItems: 'center', gap: 5 }}
        >
          {/*
            A caixa do anel tem o tamanho dele mesmo quando ele não existe,
            para os sete discos ficarem na mesma linha: sem isso, a coluna de
            hoje empurraria as vizinhas cinco pontos para os lados.
          */}
          <View
            style={{
              width: DISCO + ANEL * 2,
              height: DISCO + ANEL * 2,
              borderRadius: (DISCO + ANEL * 2) / 2,
              alignItems: 'center',
              justifyContent: 'center',
              ...(dia.hoje
                ? {
                    borderWidth: 2.5,
                    borderColor: palette.green500,
                    backgroundColor: colors.bg,
                  }
                : null),
            }}
          >
            <View
              style={{
                width: DISCO,
                height: DISCO,
                borderRadius: DISCO / 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: dia.praticou ? palette.green500 : colors.surface,
                ...(dia.praticou
                  ? null
                  : { borderWidth: 2, borderColor: palette.cream300 }),
              }}
            >
              {dia.praticou && <FolhaDoSelo size={18} cor={palette.cream100} />}
            </View>
          </View>

          <Text
            style={{
              fontFamily: fonts.body.extraBold,
              fontSize: 12,
              color: dia.hoje ? colors.primaryStrong : palette.brown700,
            }}
          >
            {dia.day}
          </Text>
        </View>
      ))}
    </View>
  );
}

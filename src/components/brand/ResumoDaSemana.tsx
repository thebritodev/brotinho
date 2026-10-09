import React from 'react';
import { Text, View } from 'react-native';

import type { DiaDaSemana, ResumoDaSemana as Resumo } from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import { MoodFace } from './MoodFace';
import { Sprout, type SproutStage } from './Sprout';

type Props = {
  resumo: Resumo;
  semana: DiaDaSemana[];
  estagio: SproutStage;
};

/**
 * O resumo da semana: três contas, sete carinhas e uma observação.
 *
 * ## Por que ele cabe na tela inicial
 *
 * Porque o app já tinha o número e não mostrava em lugar nenhum que a pessoa
 * passasse todo dia. O resumo inteiro mora na tela da terapia — ver
 * `TherapySummaryScreen` —, que é um documento para ser lido uma vez por mês e
 * mostrado a outra pessoa. Entre instalar e abrir aquela tela, o app não
 * devolvia nada do que foi registrado.
 *
 * Aqui é a versão curta e sem conclusão nenhuma: o que você fez, como você
 * esteve. Quem quiser o resto tem o "Ver tudo" no título.
 *
 * ## A janela é a semana do calendário
 *
 * De domingo a hoje, e não os últimos sete dias. É a mesma de `moodWeek` e da
 * `FaixaDaSemana` lá em cima, e tem de ser: três fitas de sete colunas na mesma
 * tela, com janelas diferentes, seriam três semanas diferentes chamadas de
 * semana. Ver `resumoDaSemana` para o argumento inteiro.
 *
 * ## O rodapé some quando não há o que dizer
 *
 * A frase só aparece com três dias de humor registrado e uma diferença de
 * verdade entre o começo e o fim da semana. Sem isso, o cartão fica só com os
 * números — e isso é melhor do que uma observação genérica com o broto feliz ao
 * lado, que é o app fingindo ter notado alguma coisa.
 */
export function ResumoDaSemana({ resumo, semana, estagio }: Props) {
  const { colors, palette, shadows, moodColors } = useTema();

  const tiles = [
    { n: resumo.praticas, rotulo: resumo.praticas === 1 ? 'prática' : 'práticas', bg: palette.blue100 },
    { n: resumo.diarios, rotulo: resumo.diarios === 1 ? 'diário' : 'diários', bg: palette.amber100 },
    { n: resumo.compostas, rotulo: resumo.compostas === 1 ? 'composta' : 'compostas', bg: palette.green100 },
  ];

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        gap: 16,
        overflow: 'hidden',
        ...shadows.sm,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {tiles.map((t) => (
          <View
            key={t.rotulo}
            style={{
              flex: 1,
              backgroundColor: t.bg,
              borderRadius: radius.lg - 6,
              paddingVertical: 10,
              paddingHorizontal: 12,
              gap: 2,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.display.bold,
                fontSize: 24,
                lineHeight: 24 * 1.1,
                color: colors.textPrimary,
              }}
            >
              {t.n}
            </Text>
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 12.5,
                color: palette.brown700,
              }}
            >
              {t.rotulo}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontFamily: fonts.body.extraBold,
            fontSize: 13,
            color: colors.textSecondary,
          }}
        >
          Como você se sentiu
        </Text>
        <View style={{ flexDirection: 'row' }}>
          {semana.map((dia) => (
            <View
              key={dia.date}
              accessible
              accessibilityLabel={dia.mood ? `${dia.date}: ${dia.mood}` : `${dia.date}: sem registro`}
              style={{ flex: 1, alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: dia.mood ? moodColors[dia.mood] : colors.surfaceSunken,
                  /*
                    O dia sem carinha fica mais apagado — e isso vale tanto para
                    o que ainda não chegou quanto para o que passou em branco.
                    A diferença entre os dois existe no dado e não é desenhada
                    aqui: nenhuma das duas é falta, e marcar uma delas como
                    falta num app de saúde mental é cobrança. Ver `moodWeek`.
                  */
                  opacity: dia.mood ? 1 : 0.6,
                }}
              >
                {dia.mood && <MoodFace mood={dia.mood} size={26} semFundo />}
              </View>
              <Text
                style={{
                  fontFamily: fonts.body.extraBold,
                  fontSize: 11.5,
                  color: colors.textSecondary,
                }}
              >
                {dia.day}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {!!resumo.nota && (
        /*
          O rodapé sangra até as bordas do cartão — margem negativa igual ao
          `padding` dele. É o que faz a faixa verde ler como o chão do cartão,
          e não como mais um bloco empilhado dentro dele.
        */
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 10,
            marginHorizontal: -16,
            marginBottom: -16,
            paddingTop: 12,
            paddingHorizontal: 16,
            backgroundColor: palette.green50,
          }}
        >
          <Text
            style={{
              flex: 1,
              paddingBottom: 14,
              fontFamily: fonts.body.regular,
              fontSize: 14.5,
              lineHeight: 14.5 * 1.45,
              color: palette.brown700,
            }}
          >
            {resumo.nota}
          </Text>
          <View style={{ width: 58, height: 68, justifyContent: 'flex-end' }}>
            <Sprout mood="feliz" stage={estagio} size={58} />
          </View>
        </View>
      )}
    </View>
  );
}

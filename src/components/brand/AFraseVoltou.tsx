import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DIAS_ATE_REPESAR } from '../../state/derived';
import type { Compost } from '../../state/types';
import { fonts, radius, useTema } from '../../theme';
import { Button } from '../core/Button';
import { Card } from '../core/Card';
import { Icon } from '../core/Icon';

/**
 * A frase compostada volta, uma semana depois, para ser pesada de novo.
 *
 * ## Por que isto existe
 *
 * A Composta terminava numa tela de resultado e acabava ali. Com esta pergunta
 * ela ganha duração: a frase volta, e a pessoa diz se ela pesa menos.
 *
 * É a única prova que este app consegue mostrar de que alguma coisa funcionou —
 * e ela vem da própria pessoa, não de um número que o app inventou sobre ela.
 * Um gráfico de humor diz "você registrou doze dias". Isto aqui pode dizer
 * *aquela frase pesa menos agora, e foi você que fez isso*.
 *
 * ## O tom, e por que ele é contido
 *
 * Nenhuma das três respostas é vitória ou fracasso, e a escrita tem de sustentar
 * isso. "Pesa menos" não ganha comemoração: comemorar transformaria a próxima
 * resposta honesta num fracasso, e a pessoa passaria a responder o que o app
 * quer ouvir. "Pesa mais" não vira alerta nem diagnóstico — vira uma oferta.
 *
 * Quem decide *quando* isto aparece é `compostaParaRepesar`, e é lá que estão as
 * travas que fazem a funcionalidade ser aceitável: nunca num dia pesado, uma por
 * vez, uma por dor, e nunca como notificação.
 */

type Resposta = 'menos' | 'igual' | 'mais';

const FECHO: Record<Resposta, string> = {
  menos:
    'A frase continua aí. O que ela consegue com você é que mudou — e foi você que fez isso.',
  igual:
    'Uma semana é pouco para algumas coisas. Ela fica guardada; dá para compostar de novo quando quiser.',
  mais:
    'Isso acontece, e não é recuo. Se estiver pesando agora, tem um exercício de três minutos aqui.',
};

export function AFraseVoltou({
  composta,
  aoResponder,
  aoDispensar,
  aoCompostarDeNovo,
  aoAncorar,
}: {
  composta: Compost;
  aoResponder: (resposta: Resposta) => void;
  aoDispensar: () => void;
  aoCompostarDeNovo: () => void;
  /** O aterramento de três minutos, para quem respondeu que pesa mais. */
  aoAncorar: () => void;
}) {
  const { colors, palette } = useTema();
  /*
    A resposta fica no estado local **além** de ser gravada.

    Gravada, ela some da tela na próxima montagem — que é o que se quer. Mas no
    instante do toque a pessoa precisa ler o fecho, e para isso o cartão tem de
    continuar montado dizendo o que ela acabou de responder.
  */
  const [respondido, setRespondido] = useState<Resposta | null>(null);

  /*
    Os dias são contados, não assumidos.

    A primeira versão escrevia `DIAS_ATE_REPESAR` na frase — e dizia "há 7 dias"
    para uma sessão de nove, porque sete é quando a pergunta *fica disponível*,
    não quando a coisa aconteceu. Quem dispensou uma vez, ou passou uma semana
    sem abrir o app, receberia um número errado sobre a própria história. Este
    app não inventa número sobre ninguém.
  */
  const dias = Math.max(
    DIAS_ATE_REPESAR,
    Math.round((Date.now() - composta.createdAt) / (24 * 60 * 60 * 1000)),
  );

  const responder = (r: Resposta) => {
    setRespondido(r);
    aoResponder(r);
  };

  const opcao = (r: Resposta, rotulo: string) => (
    <Pressable
      key={r}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={() => responder(r)}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: 12,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.primarySoft : colors.surface,
        alignItems: 'center',
      })}
    >
      <Text
        style={{
          fontFamily: fonts.body.bold,
          fontSize: 13,
          color: palette.brown700,
        }}
      >
        {rotulo}
      </Text>
    </Pressable>
  );

  return (
    <Card>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Text
            style={{
              flex: 1,
              fontFamily: fonts.body.regular,
              fontSize: 13,
              lineHeight: 13 * 1.45,
              color: colors.textSecondary,
            }}
          >
            {`Há ${dias} dias você repetiu isto em voz alta:`}
          </Text>

          {/*
            Dispensar é uma saída de verdade, não um "depois".

            Sem ela, a única forma de tirar da tela uma frase que a pessoa não
            quer reencontrar hoje seria responder sobre ela — obrigar a pesar
            para poder fechar. O toque grava a dispensa, e a pergunta não volta.
          */}
          {!respondido && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dispensar esta pergunta"
              hitSlop={10}
              onPress={aoDispensar}
            >
              <Icon name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <Text
          style={{
            fontFamily: fonts.display.semiBold,
            fontSize: 20,
            lineHeight: 20 * 1.3,
            color: colors.textPrimary,
          }}
        >
          “{composta.thought}”
        </Text>

        {respondido ? (
          <View style={{ gap: 12 }}>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 14,
                lineHeight: 14 * 1.5,
                color: colors.textSecondary,
              }}
            >
              {FECHO[respondido]}
            </Text>

            {respondido === 'igual' && (
              <Button variant="secondary" onPress={aoCompostarDeNovo}>
                Compostar de novo
              </Button>
            )}
            {respondido === 'mais' && (
              <Button variant="secondary" onPress={aoAncorar}>
                Fazer o exercício
              </Button>
            )}
          </View>
        ) : (
          <>
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 15,
                color: colors.textPrimary,
              }}
            >
              Ainda pesa o mesmo?
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {opcao('menos', 'Pesa menos')}
              {opcao('igual', 'Pesa igual')}
              {opcao('mais', 'Pesa mais')}
            </View>
          </>
        )}
      </View>
    </Card>
  );
}

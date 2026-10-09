import React from 'react';
import { Text, View } from 'react-native';

import { STAGE_AT } from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import { ReguaDoCiclo } from './ReguaDoCiclo';
import { NOMES_DOS_ESTAGIOS } from './planoDoCiclo';
import type { SproutStage } from './Sprout';

/**
 * Onde o broto está no crescimento dele — a régua do ciclo e a frase.
 *
 * ## Por que ele existe
 *
 * O app dizia o crescimento em três lugares e de três jeitos: "Broto" no
 * cabeçalho da aba, "faltam 7 dias" numa linha do jardim, e o tamanho do
 * desenho. Nenhum dos três mostrava **para onde** aquilo vai — e o que segura
 * alguém num app de hábito é justamente ver o próximo passo antes de chegar
 * nele.
 *
 * ## O que mudou, e por que eu estava errado duas vezes
 *
 * Primeiro eu desenhei uma barra contínua de zero a vinte e um dias, com os
 * quatro nomes embaixo. Depois troquei por uma fileira de pontinhos do
 * **estágio de agora** — três na Semente, sete no Broto, onze na Plantinha —
 * argumentando que na barra de vinte e um dias um dia movia menos de cinco por
 * cento, e que progresso invisível no dia em que acontece não é progresso.
 *
 * O argumento continua certo. A conclusão estava errada, e o Pedro viu onde:
 * aos dez dias cuidados o cartão dizia "10 dias de cuidado. Faltam 11 dias
 * para florescer" **em cima de uma fileira vazia** — vazia porque a Plantinha
 * tinha acabado de abrir. Dividir por estágio resolve o tamanho do passo e
 * destrói a única coisa que a barra precisa dizer, que é quanto falta para o
 * fim.
 *
 * A régua tem as duas: vinte e um intervalos, um por dia cuidado, com os
 * quatro desenhos **em cima dos dias em que eles acontecem**. Um dia acende um
 * intervalo inteiro, e o fim é o fim. Ela mora em `ReguaDoCiclo`, porque o
 * jardim desenhava a mesma coisa com outra conta e as duas divergiram.
 */

export { NOMES_DOS_ESTAGIOS };

type Props = {
  /** O estágio de agora. */
  estagio: SproutStage;
  /** Dias cuidados dentro do ciclo atual. */
  dias: number;
  /** Quantos faltam para o próximo passo — `null` quando já amadureceu. */
  faltam: number | null;
  /** O nome que a pessoa deu ao broto. */
  nome: string;
  /**
   * A largura do cartão.
   *
   * Entra como propriedade porque a régua é posicionada por coordenada, e
   * medir não é opção: `onLayout` não dispara no `react-native-web`.
   */
  largura: number;
};

/** O preenchimento do cartão, de cada lado. */
const RECHEIO = 18;

export function CartaoDosEstagios({ estagio, dias, faltam, nome, largura }: Props) {
  const { colors, palette, shadows } = useTema();

  /*
    O nome do degrau seguinte: o estágio de cima, ou florescer.

    "Florescer" e não "Flor" porque aqui a palavra entra numa frase — "faltam
    11 dias para florescer" —, e na régua ela é o rótulo de uma marca. O verbo
    não serve de rótulo e o substantivo não serve de frase.
  */
  const proximo = estagio < 3 ? NOMES_DOS_ESTAGIOS[estagio] : 'Florescer';

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: RECHEIO,
        gap: 14,
        ...shadows.sm,
      }}
    >
      <ReguaDoCiclo largura={Math.max(120, largura - RECHEIO * 2)} dias={dias} />

      <Text
        style={{
          fontFamily: fonts.body.regular,
          fontSize: 14,
          lineHeight: 14 * 1.45,
          color: palette.brown700,
        }}
      >
        {faltam === null
          ? `${nome} já está pronto para ir para o jardim, e um novo começa.`
          : `${dias} ${dias === 1 ? 'dia' : 'dias'} de cuidado. `
            + `${faltam === 1 ? 'Falta 1 dia' : `Faltam ${faltam} dias`} para ${proximo.toLowerCase()}.`}
      </Text>
    </View>
  );
}

/** Os dias em que cada estágio abre, para quem quiser desenhar a régua. */
export { STAGE_AT };

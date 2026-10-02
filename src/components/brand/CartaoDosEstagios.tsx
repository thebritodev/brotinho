import React from 'react';
import { Text, View } from 'react-native';

import { MATURIDADE, STAGE_AT } from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import { Sprout, type SproutStage } from './Sprout';

/**
 * Onde o broto está no crescimento dele — os três estágios e a barra.
 *
 * ## Por que ele existe
 *
 * O app dizia o crescimento em três lugares e de três jeitos: "Broto" no
 * cabeçalho da aba, "faltam 7 dias" numa linha do jardim, e o tamanho do
 * desenho. Nenhum dos três mostrava **para onde** aquilo vai — e o que segura
 * alguém num app de hábito é justamente ver o próximo passo antes de chegar
 * nele. Aqui os três estágios aparecem juntos, com o de agora aceso e os
 * outros dois apagados.
 *
 * ## A cara é a do documento; a conta é de dias
 *
 * O documento conta folhas — dez folhas viram um estágio, cada prática vale
 * uma — e desenha isso como uma fileira de pontinhos. A conta é errada para
 * este app: aqui o crescimento é por **dia cuidado**, e não por volume,
 * justamente para não premiar quem despeja tudo numa terça e some. Ver
 * `STAGE_AT`, em `derived`.
 *
 * Mas o **desenho** do documento está certo, e eu tinha jogado fora junto com
 * a conta. Uma barra contínua com quatro rótulos embaixo é um gráfico; uma
 * fileira de pontinhos é um caminho com passos contados, e passo contado é o
 * que faz alguém querer dar o próximo. Pedro pediu a cara de lá com a conta
 * daqui, e é o que está aqui: **um pontinho por dia do estágio atual**.
 *
 * E há um ganho de verdade na troca. A barra contínua ia de zero a
 * `MATURIDADE` — vinte e um dias — e por isso os três estágios apareciam nela
 * com tamanhos diferentes, o que estava certo e não ajudava ninguém: na
 * Plantinha, um dia movia a barra menos de cinco por cento. Os pontinhos são
 * do **estágio de agora**, então o passo de hoje sempre ocupa um pontinho
 * inteiro.
 */

/** Os nomes dos três estágios, mais o fim do ciclo. */
export const NOMES_DOS_ESTAGIOS: string[] = ['Semente', 'Broto', 'Plantinha'];

type Props = {
  /** O estágio de agora. */
  estagio: SproutStage;
  /** Dias cuidados dentro do ciclo atual. */
  dias: number;
  /** Quantos faltam para o próximo passo — `null` quando já amadureceu. */
  faltam: number | null;
  /** O nome que a pessoa deu ao broto. */
  nome: string;
};

export function CartaoDosEstagios({ estagio, dias, faltam, nome }: Props) {
  const { colors, palette, shadows } = useTema();

  const proximo = NOMES_DOS_ESTAGIOS[estagio] ?? 'Florescer';

  /*
    Os pontinhos são do estágio de agora, e não da vida inteira do broto.

    `STAGE_AT` diz em que dia cada estágio abre; o fim do último é
    `MATURIDADE`. O tamanho do passo atual é a diferença entre os dois, e é
    quantos pontinhos a fileira tem: três na Semente, sete no Broto, onze na
    Plantinha.
  */
  const comeca = STAGE_AT[estagio];
  const termina = estagio < 3 ? STAGE_AT[(estagio + 1) as SproutStage] : MATURIDADE;
  const passos = Math.max(1, termina - comeca);
  const andados = Math.max(0, Math.min(passos, dias - comeca));

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: 18,
        gap: 16,
        ...shadows.sm,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        {([1, 2, 3] as SproutStage[]).map((n) => {
          const chegou = n <= estagio;
          const agora = n === estagio;
          return (
            <View key={n} style={{ flex: 1, alignItems: 'center', gap: 4, opacity: chegou ? 1 : 0.4 }}>
              {/*
                O desenho parado, e não o animado.

                São três brotos lado a lado, e três respirações fora de fase na
                mesma linha viram tremor. O que está vivo nesta tela é o grande,
                lá em cima.
              */}
              <Sprout mood="leve" stage={n} size={64} />
              <Text
                style={{
                  fontFamily: fonts.body.extraBold,
                  fontSize: 13,
                  color: agora ? colors.primaryStrong : palette.brown400,
                }}
              >
                {NOMES_DOS_ESTAGIOS[n - 1]}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ gap: 10 }}>
        {/*
          Os pontinhos. Cada um é um dia cuidado dentro deste estágio.

          `flex: 1` em cada um, e não largura fixa: a fileira tem três, sete ou
          onze pontinhos conforme o estágio, e com largura fixa ela sobraria
          numa ponta e estouraria na outra. O `gap` é o que os separa.

          Sem rótulo embaixo. Os três nomes já estão escritos em cima, debaixo
          dos desenhos, e repeti-los aqui era a mesma palavra duas vezes na
          mesma altura da tela.
        */}
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: passos, now: andados }}
          style={{ flexDirection: 'row', gap: 6 }}
        >
          {Array.from({ length: passos }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 12,
                borderRadius: 6,
                backgroundColor: i < andados ? colors.primary : palette.cream300,
              }}
            />
          ))}
        </View>
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
    </View>
  );
}

/** Os dias em que cada estágio abre, para quem quiser desenhar a régua. */
export { STAGE_AT };

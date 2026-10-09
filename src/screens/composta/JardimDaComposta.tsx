import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BotaoNoCeu,
  Button,
  CabecalhoNoCeu,
  FLORES,
  FolhaDaComposta,
  IconeDaFlor,
  PaisagemDaComposta,
  TituloNoCeu,
  florDoIndice,
  jardimEspalhado,
} from '../../components';
import { ALTURA_ERGUIDA, POR_TRAS_DA_BARRA } from '../../components/navigation/BottomNav';
import { ALTURA_DA_CENA, CRISTA } from '../../components/brand/planoDaPaisagem';
import { recuoDaCena } from '../../components/brand/FolhaDaComposta';
import { useBotaoVoltar } from '../../navigation/useBotaoVoltar';
import { jardimDaComposta } from '../../state/derived';
import { useAppState } from '../../state/AppStateProvider';
import { fonts, radius, useTema } from '../../theme';

/**
 * O jardim da Composta: o histórico da ferramenta, como canteiro.
 *
 * ## Por que um jardim, e não uma lista
 *
 * Porque a promessa da prática é que o pensamento **vira adubo**, e uma lista
 * de frases riscadas não mostra nada tendo virado nada. Aqui cada frase tem
 * uma flor no solo, e o solo é o que a pessoa vê primeiro. Quinze frases
 * compostadas são um canteiro cheio — e isso é o retorno que a ferramenta
 * prometeu na primeira tela.
 *
 * As frases estão todas aí, embaixo, riscadas. Riscar é importante: é o
 * registro de que aquilo passou por aqui e perdeu força, e é a única coisa na
 * tela que trata o texto como vencido.
 *
 * ## O que acontece ao tocar numa frase
 *
 * A flor dela acende no céu, com halo pulsando. É o que liga a lista ao
 * canteiro — sem isso, são duas coisas na mesma tela que não se olham. Tocar
 * de novo desmarca.
 */

/** "12 set" — a data curta dos cartões do jardim. */
const diaCurto = (quando: number) =>
  new Date(quando)
    .toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    /* O `pt-BR` devolve "12 de set."; o documento escreve "12 set". */
    .replace(' de ', ' ')
    .replace('.', '');

/** Como cada peso aparece na etiqueta do cartão. */
const ETIQUETA = {
  menos: 'Mais leve',
  igual: 'Igual',
  mais: 'Mais pesado',
} as const;

export function JardimDaComposta({
  onClose,
  aoCompostar,
}: {
  /** Volta para onde a pessoa estava — a intro, ou o fim da prática. */
  onClose: () => void;
  /** Começa outra compostagem, com o campo limpo. */
  aoCompostar: () => void;
}) {
  const { colors, palette, shadows } = useTema();
  const { width: largura } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data } = useAppState();

  const { frases, repeticoes, maisLeves } = useMemo(() => jardimDaComposta(data), [data]);

  /**
   * Qual frase está selecionada, pelo índice de criação.
   *
   * Guarda o índice e não o `id` porque é o índice que a paisagem usa para
   * achar a flor — ver `jardimEspalhado`, que recebe o mesmo número.
   */
  const [escolhida, setEscolhida] = useState<number | null>(null);

  useBotaoVoltar(() => {
    onClose();
    return true;
  });

  /* A régua das cinco telas da ferramenta — ver `recuoDaCena`. */
  const recuo = recuoDaCena(insets.top);
  const altura = ALTURA_DA_CENA.jardim + recuo;
  const flores = useMemo(
    () => jardimEspalhado(frases.length, escolhida),
    [frases.length, escolhida],
  );

  /**
   * Quantos tipos de flor o jardim já tem.
   *
   * São seis em rotação, então o número é o menor entre o total de frases e
   * seis. Sai da contagem, e não de um `Set` sobre a lista, porque a conta é
   * a mesma e esta diz o que significa.
   */
  const tipos = Math.min(frases.length, FLORES.length);

  const estatisticas = [
    { n: repeticoes, rotulo: 'repetições', fundo: palette.green100 },
    { n: maisLeves, rotulo: 'ficaram mais leves', fundo: palette.amber100 },
    { n: tipos, rotulo: 'tipos de flor', fundo: palette.lavender100 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: POR_TRAS_DA_BARRA }}
        showsVerticalScrollIndicator={false}
      >
        {/*
          A cena, e o cabeçalho flutuando dentro dela.

          Ela rola junto com o conteúdo de propósito: um cabeçalho preso no
          alto ficaria boiando sobre a lista de frases, e o jardim deixaria de
          ser o alto de um lugar para ser uma faixa decorativa. Mesma decisão
          das outras telas da ferramenta.
        */}
        <View style={{ height: altura }}>
          <PaisagemDaComposta
            largura={largura}
            altura={altura}
            crista={CRISTA.jardim + recuo}
            recuo={recuo}
            luz={1}
            flores={flores}
            broto={{ x: 340, escala: 0.7, humor: 'feliz', estagio: 3, pose: 'parado' }}
          />
          <CabecalhoNoCeu recuo={recuo}>
            <BotaoNoCeu rotulo="Voltar" aoTocar={onClose} />
            <TituloNoCeu>Jardim da composta</TituloNoCeu>
          </CabecalhoNoCeu>
        </View>

        <FolhaDaComposta style={{ paddingHorizontal: 20, paddingBottom: 40, gap: 18 }}>
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontFamily: fonts.display.extraBold,
                fontSize: 26,
                lineHeight: 26 * 1.15,
                color: colors.textPrimary,
              }}
            >
              {frases.length === 1
                ? '1 pensamento virou flor'
                : `${frases.length} pensamentos viraram flor`}
            </Text>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15,
                lineHeight: 15 * 1.45,
                color: palette.brown700,
              }}
            >
              Cada flor nasceu de uma frase que você repetiu até virar só som. Toque numa frase para
              ver a flor dela.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {estatisticas.map((e) => (
              <View
                key={e.rotulo}
                style={{
                  flex: 1,
                  backgroundColor: e.fundo,
                  borderRadius: 14,
                  padding: 12,
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
                  {e.n}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body.bold,
                    fontSize: 12.5,
                    lineHeight: 12.5 * 1.3,
                    color: palette.brown700,
                  }}
                >
                  {e.rotulo}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ gap: 10 }}>
            <Text
              style={{ fontFamily: fonts.display.bold, fontSize: 19, color: colors.textPrimary }}
            >
              Frases compostadas
            </Text>

            {[...frases].reverse().map((f) => {
              const flor = florDoIndice(f.indice);
              const marcada = escolhida === f.indice;
              const leve = f.peso === 'menos';
              return (
                <Pressable
                  key={f.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: marcada }}
                  accessibilityLabel={`${f.frase}. ${flor.nome}, ${diaCurto(f.quando)}, ${f.reps} repetições. ${f.peso ? ETIQUETA[f.peso] : 'sem registro de peso'}.`}
                  accessibilityHint={marcada ? 'Toque para desmarcar' : 'Toque para ver a flor dela'}
                  onPress={() => setEscolhida(marcada ? null : f.indice)}
                  style={({ pressed }) => ({
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    borderWidth: 2,
                    borderColor: marcada ? colors.primaryStrong : 'transparent',
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    ...shadows.sm,
                  })}
                >
                  {/*
                    O quadrado âmbar corta a flor embaixo, de propósito: ela é
                    plantada no pé da caixa, e o caule sai por baixo. Lê como
                    uma flor no canteiro, e não como um ícone centralizado num
                    quadrado.
                  */}
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      backgroundColor: palette.amber100,
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      overflow: 'hidden',
                    }}
                  >
                    <IconeDaFlor tipo={flor.chave} tamanho={40} />
                  </View>

                  <View style={{ flex: 1, gap: 3 }}>
                    <Text
                      style={{
                        fontFamily: fonts.display.bold,
                        fontSize: 16.5,
                        lineHeight: 16.5 * 1.25,
                        color: colors.textPrimary,
                        textDecorationLine: 'line-through',
                      }}
                    >
                      {`“${f.frase}”`}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.body.bold,
                        fontSize: 13,
                        color: palette.brown400,
                      }}
                    >
                      {`${flor.nome} · ${diaCurto(f.quando)} · ${f.reps} repetições`}
                    </Text>
                  </View>

                  <View
                    style={{
                      paddingVertical: 5,
                      paddingHorizontal: 9,
                      borderRadius: 8,
                      backgroundColor: leve ? palette.green100 : colors.surfaceSunken,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.body.extraBold,
                        fontSize: 12,
                        color: leve ? colors.primaryStrong : palette.brown700,
                      }}
                    >
                      {f.peso ? ETIQUETA[f.peso] : 'Sem registro'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 6, paddingBottom: ALTURA_ERGUIDA }}>
            <Button variant="primary" style={{ width: '100%' }} onPress={aoCompostar}>
              Compostar outro pensamento
            </Button>
          </View>
        </FolhaDaComposta>
      </ScrollView>
    </View>
  );
}

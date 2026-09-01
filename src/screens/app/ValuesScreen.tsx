import React, { useMemo } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sprout, TopBar, ValueBadge, ehEnfeite } from '../../components';
import { useAppState } from '../../state/AppStateProvider';
import { dayKey, livedValues, sproutStage } from '../../state/derived';
import { fonts, useTema } from '../../theme';

export function ValuesScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useTema();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data } = useAppState();

  /*
    O broto é o assunto desta tela, e estava com 150 pixels fixos.

    Com os cinco enfeites aparecendo juntos, cada um deles fica com poucos
    pixels de diâmetro nesse tamanho — a flor e a plantinha viram manchas. O
    teto de 240 segura o desenho em telas largas, onde ele passaria a ocupar
    metade da altura só porque a largura permite.
  */
  const tamanhoDoBroto = Math.min(width * 0.62, 240);

  const values = useMemo(() => livedValues(data), [data]);
  const today = dayKey();
  const mood = data.moodHistory.find((m) => m.date === today)?.mood ?? 'neutro';

  /*
    Todos os valores vividos viram enfeite, não os três primeiros.

    O corte em três existia porque só quatro dos cinco valores tinham desenho e
    dois deles disputavam espaço. Agora os cinco têm o seu canto — estrela em
    cima à esquerda, brilho em cima à direita, gotas nos lados, plantinha
    embaixo à direita, flor embaixo à esquerda — e o broto pode mostrar tudo de
    uma vez. É o que a tela promete: um retrato do que a pessoa viveu, não uma
    amostra dele.

    E é filtro, não `as Decoration[]`. O elenco antes tinha quatro nomes e a
    lista podia trazer cinco: a conversão empurrava "coragem" para dentro sem
    ninguém conferir, e ela chegava ao desenho como um enfeite que não existe —
    que não desenha nada e ainda **alarga a caixa** para caber, encolhendo o
    broto sem motivo. Ver `ehEnfeite`.
  */
  const decorations = values.map((v) => v.value).filter(ehEnfeite);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Meus valores" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32,
          gap: 20,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.5,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Seu broto ganha uma característica para cada valor que aparece no que você escreve.
        </Text>

        <Sprout
          mood={mood}
          stage={sproutStage(data)}
          decorations={decorations}
          size={tamanhoDoBroto}
        />

        {values.length ? (
          <View style={{ gap: 10, width: '100%' }}>
            {values.map((v) => (
              <ValueBadge key={v.value} value={v.value} count={v.count} />
            ))}
          </View>
        ) : (
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 15,
              lineHeight: 15 * 1.5,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            {/* Sem essa distinção a mensagem mentiria: diria "escreva mais"
                para quem escreveu bastante e só desligou a análise. */}
            {data.settings.analysis
              ? 'Ainda não dá pra dizer. Escreva no diário sobre seus dias e seu broto vai começar a reconhecer o que você valoriza.'
              : 'A análise dos seus registros está desligada, então o broto não está lendo o que você escreve. Dá para ligar em Perfil › Privacidade.'}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, Text, View } from 'react-native';

import {
  ESPECIES,
  escolhasApos,
  especieValida,
  type EspecieKey,
} from '../../data/especies';
import { pedirAvaliacaoNaColheita } from '../../services/pedirAvaliacao';
import { toqueDeConclusao } from '../../services/toque';
import { useAppState } from '../../state/AppStateProvider';
import { fonts, radius, useTema } from '../../theme';
import type { Plant } from '../../state/types';
import { Button } from '../core/Button';
import { ehEnfeite, Sprout } from './Sprout';
import { VALUES, type ValueKey } from './ValueBadge';

/**
 * O momento em que uma planta amadurece e vai para o jardim.
 *
 * Sem isto a colheita acontecia em silêncio: a pessoa abria o app e o broto
 * que ela criou por três semanas tinha virado uma mudinha de novo, sem
 * explicação. Isso lê como perda de dado, não como conquista — e era
 * justamente o momento mais importante do ciclo.
 *
 * O tom não é de troféu. A planta não é prêmio por desempenho: é o registro de
 * um período, e o texto fala dele.
 *
 * ## E é aqui que se escolhe a próxima espécie
 *
 * Esta tela era um aviso com um botão: "ver meu jardim". O ciclo seguinte
 * começava com um broto idêntico ao que acabou de ser guardado — vinte e um
 * dias para ver a mesma mudinha de novo, que é a repetição que o Pedro
 * apontou.
 *
 * Agora ela é uma **escolha**: três espécies, e a próxima planta é a que ela
 * escolher. Receber é passivo; escolher é a pessoa dizendo o que quer para as
 * próximas três semanas. Ver `data/especies` para o mecanismo inteiro.
 *
 * A primeira das três é a que responde ao humor predominante do período, e ela
 * já vem **marcada**. Não é para empurrar: é para a tela nunca ter um botão
 * desabilitado esperando um toque, e para o botão de voltar do Android ter
 * sempre uma resposta válida. Quem não quiser aquela troca em dois toques.
 */
export function HarvestNotice({
  planta,
  onEscolher,
}: {
  planta: Plant;
  /** Guarda a planta e planta a espécie escolhida. */
  onEscolher: (proxima: EspecieKey) => void;
}) {
  const { colors, moodColorsFundo, palette, shadows } = useTema();
  const { data } = useAppState();
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Três semanas de cuidado terminando: se algo merece a vibração de
    // conclusão neste app, é isto.
    toqueDeConclusao(data.settings.vibracao);

    /*
      E é o único lugar do app onde cabe pedir uma avaliação na loja.

      A recomendação padrão — "peça depois de uma ação concluída" — não serve
      aqui: a Composta também termina em conclusão, e ali a pessoa acabou de
      dizer em voz alta o pensamento que mais a machuca. O porquê completo está
      em `services/pedirAvaliacao.ts`.

      Vai com atraso para não competir com a animação da planta chegando.
    */
    const id = setTimeout(() => void pedirAvaliacaoNaColheita(), 2600);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((menosMovimento) => {
      if (menosMovimento) return entrada.setValue(1);
      Animated.timing(entrada, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const valor = VALUES[planta.valor as ValueKey];

  /*
    As três ofertas, e a marcada.

    `escolhasApos` nunca devolve a espécie atual, e põe na frente a que
    responde ao humor predominante do período — ver `data/especies`. O estado
    começa na primeira: a tela nunca aparece sem resposta válida.

    `useMemo` porque a lista não pode mudar entre dois quadros desta tela: ela
    é derivada de valores estáveis, mas uma remontagem no meio da escolha
    trocando as opções debaixo do dedo seria o pior momento possível.
  */
  const atual = especieValida(planta.especie);
  const ofertas = useMemo(() => escolhasApos(atual, planta.mood), [atual, planta.mood]);
  const [escolhida, setEscolhida] = useState<EspecieKey>(ofertas[0]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 26,
        backgroundColor: 'rgba(58, 54, 48, 0.45)',
        opacity: entrada,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        onPress={() => onEscolher(escolhida)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Animated.View
        style={{
          width: '100%',
          alignItems: 'center',
          gap: 14,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          paddingVertical: 28,
          paddingHorizontal: 24,
          ...shadows.lg,
          transform: [
            { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
            { scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          ],
        }}
      >
        <View
          style={{
            width: 132,
            height: 132,
            borderRadius: 66,
            // Fundo atrás do desenho, e não pastilha — ver `moodColorsFundo`.
            backgroundColor: planta.mood ? moodColorsFundo[planta.mood] : palette.cream200,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/*
            Na espécie que ela **era**, e não na de agora.

            Quando esta tela aparece, a espécie do perfil ainda é a desta
            planta — mas um segundo depois deixa de ser, e o jardim desenha as
            plantas antigas lendo `planta.especie`. Passar aqui também deixa os
            dois caminhos iguais e tira a pergunta de qual dos dois vale.
          */}
          <Sprout
            mood={planta.mood ?? 'feliz'}
            stage={3}
            size={116}
            showPot={false}
            especie={atual}
            decorations={ehEnfeite(planta.valor) ? [planta.valor] : []}
          />
        </View>

        <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.bold, fontSize: 23, textAlign: 'center' }}>
          Esta planta cresceu
        </Text>

        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 15,
            lineHeight: 15 * 1.55,
            color: palette.brown700,
            textAlign: 'center',
          }}
        >
          {planta.dias} dias em que você apareceu
          {valor ? `, e ${valor.label.toLowerCase()} foi o que mais apareceu no que você escreveu` : ''}.
          Ela fica guardada no seu jardim.
        </Text>

        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: palette.brown100 }} />

        <Text
          style={{
            fontFamily: fonts.display.bold,
            fontSize: 18,
            color: colors.textPrimary,
            textAlign: 'center',
          }}
        >
          O que você quer plantar agora?
        </Text>

        {/*
          As três, lado a lado, no estágio 2.

          Estágio 2 e não 1: a semente das três espécies é quase o mesmo
          desenho, e escolher entre três imagens iguais não é escolher. No 2 já
          há folhas, haste e cabeça — as três peças que mudam de cor.

          `especie` passada em cada uma: aqui o contexto não serve, porque o
          ponto é justamente mostrar o que **não** é a espécie de agora.
        */}
        <View style={{ flexDirection: 'row', alignSelf: 'stretch', gap: 8 }}>
          {ofertas.map((chave) => {
            const e = ESPECIES[chave];
            const marcada = chave === escolhida;
            return (
              <Pressable
                key={chave}
                accessibilityRole="radio"
                accessibilityState={{ selected: marcada }}
                accessibilityLabel={`${e.nome}. ${e.sobre}`}
                onPress={() => setEscolhida(chave)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: 2,
                  paddingVertical: 10,
                  borderRadius: radius.md,
                  borderWidth: 2,
                  borderColor: marcada ? colors.primary : 'transparent',
                  backgroundColor: marcada ? colors.primarySoft : colors.surfaceSunken,
                }}
              >
                <Sprout mood="feliz" stage={2} size={58} showPot={false} especie={chave} />
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: fonts.body.extraBold,
                    fontSize: 12.5,
                    color: marcada ? colors.primaryStrong : colors.textPrimary,
                  }}
                >
                  {e.nome}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/*
          A linha da escolhida, e só dela.

          Três descrições de uma linha em colunas de oitenta pontos viram seis
          linhas de texto picado. Uma por vez, embaixo, é o que cabe e o que se
          lê — e muda ao tocar, que é o que faz valer tocar nas três antes de
          decidir.
        */}
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 14,
            lineHeight: 14 * 1.5,
            color: colors.textSecondary,
            textAlign: 'center',
            minHeight: 14 * 1.5 * 2,
          }}
        >
          {ESPECIES[escolhida].sobre}
        </Text>

        <Button onPress={() => onEscolher(escolhida)} style={{ marginTop: 4 }}>
          Plantar {ESPECIES[escolhida].nome.toLowerCase()}
        </Button>
      </Animated.View>
    </Animated.View>
  );
}

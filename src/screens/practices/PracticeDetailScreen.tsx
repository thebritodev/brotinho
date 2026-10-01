import React, { useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedSprout,
  BalaoDoBroto,
  Button,
  Cena,
  CRISTA_DO_MORRO,
  Icon,
  ScreenTransition,
  TopBar,
} from '../../components';
import { PracticeIllustration } from '../../components/brand/PracticeIllustration';
import type { Practice } from '../../data/practices';
import { useAppState } from '../../state/AppStateProvider';
import type { OrigemDoRegistro } from '../../state/types';
import { useBotaoVoltar } from '../../navigation/useBotaoVoltar';
import { toqueDeConclusao } from '../../services/toque';
import { noFim } from '../../data/falasDoBroto';
import { nomeDoBroto, sproutStage, vezesPorPratica } from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import { BreathingGuide } from './BreathingGuide';
import { StepGuide } from './StepGuide';

type Props = {
  practice: Practice;
  /** Chave do tema, para registrar a prática concluída. */
  topicKey: string;
  tint: string;
  onBack: () => void;
  /**
   * Leva ao diário com a pergunta da prática já na folha.
   *
   * Vinte e cinco das quarenta e uma práticas mandam escrever, e até aqui
   * nenhuma delas oferecia onde. A porta fica no fim, e não na leitura: antes
   * de fazer, o convite competiria com a própria prática.
   */
  /** Abre o diário com a pergunta de partida e de onde ela veio. */
  onEscreverNoDiario?: (comeco: string, origem: OrigemDoRegistro) => void;
};

type Mode = 'read' | 'guide' | 'finished';

/**
 * A ordem dos tres estados da pratica.
 *
 * E ela que decide o lado da troca: entrar no guia avanca, desistir dele
 * volta, e a conclusao vem depois do guia. Sem a ordem, cada `return` teria de
 * adivinhar sozinho para que lado estava indo — e era assim que um passo saia
 * pelo lado errado e a troca parecia outra transicao.
 */
const PASSOS_DA_PRATICA = ['leitura', 'guia', 'fim'] as const;

/**
 * Quantas voltas a respiracao pode ter.
 *
 * Tres, quatro e seis — os numeros do documento. Quatro e o padrao de
 * quase toda pratica guiada do app, entao a opcao do meio e a que ja
 * existia: quem nao mexer em nada continua fazendo o que fazia.
 */
const CICLOS_A_ESCOLHER = [3, 4, 6];

export function PracticeDetailScreen({
  practice,
  topicKey,
  tint,
  onBack,
  onEscreverNoDiario,
}: Props) {
  const { colors, palette, shadows, vidros } = useTema();
  const insets = useSafeAreaInsets();
  const { width: largura, height: alturaDaTela } = useWindowDimensions();
  const { data, registrarPratica } = useAppState();
  const [mode, setMode] = useState<Mode>('read');

  const estagio = sproutStage(data);
  /*
    A cena da comemoração ocupa quase metade da tela.

    O documento desenha 400 sobre 844. Como fração, o título e os botões
    continuam cabendo num aparelho curto — e aqui isso importa mais que nas
    outras telas, porque esta termina em três botões empilhados.
  */
  const alturaDaFesta = Math.max(260, Math.min(alturaDaTela * 0.44, 400));
  const nomeDoBrotoAqui = nomeDoBroto(data) || 'Brotinho';

  /* So a respiracao tem ciclos; o guia por passos nao. */
  const respiracao = practice.guide?.kind === 'breathing' ? practice.guide : null;
  const [ciclos, setCiclos] = useState(respiracao?.cycles ?? 4);

  const comeco = practice.comecoNoDiario;
  const escrever =
    comeco && onEscreverNoDiario
      ? () => onEscreverNoDiario(comeco, { tipo: 'pratica', topico: topicKey, pratica: practice.key })
      : null;

  /**
   * No meio do guia, voltar é desistir do guia — e não sair da prática.
   *
   * Na tela de conclusão é o contrário: a prática acabou, e voltar para a
   * leitura seria reabrir o que ela terminou. Ali o `false` deixa a lista
   * responder, que é para onde o botão principal também leva.
   */
  useBotaoVoltar(() => {
    if (mode === 'guide') {
      setMode('read');
      return true;
    }
    return false;
  });

  const jaFeita = vezesPorPratica(data)[`${topicKey}/${practice.key}`] ?? 0;

  /**
   * Só conta quando o guia chega ao fim. Abrir e desistir não é ter feito, e
   * inflar essa contagem tiraria justamente o valor dela.
   */
  const concluir = () => {
    registrarPratica(topicKey, practice.key);
    // Na respiração, cada virada de fase já vibra; faltava o ponto final. Nas
    // outras práticas, era a única resposta tátil da tela inteira.
    toqueDeConclusao(data.settings.vibracao);
    setMode('finished');
  };

  // --- Guia em andamento ---------------------------------------------------

  if (mode === 'guide' && practice.guide) {
    const guide = practice.guide;
    return (
      <ScreenTransition transitionKey="guia" ordem={PASSOS_DA_PRATICA}>
      {/*
        Sem `TopBar`: o guia pinta a tela inteira.

        O fundo muda de cor a cada fase da respiracao — azul para inspirar,
        lavanda para segurar, verde para soltar —, e uma barra creme por cima
        cortava justamente a faixa que faz isso funcionar de olho desfocado. O
        titulo tambem nao faz falta: quem esta no exercicio acabou de escolher
        qual era. O que faz falta e a saida, e ela esta nos dois botoes de
        baixo, em letra grande.
      */}
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        {guide.kind === 'breathing' ? (
          <BreathingGuide
            phases={guide.phases}
            cycles={ciclos}
            onDone={concluir}
            onCancel={() => setMode('read')}
          />
        ) : (
          <StepGuide
            steps={guide.steps}
            tom={tint}
            onDone={concluir}
            onCancel={() => setMode('read')}
          />
        )}
      </View>
      </ScreenTransition>
    );
  }

  // --- Fim da prática ------------------------------------------------------

  if (mode === 'finished') {
    return (
      <ScreenTransition transitionKey="fim" ordem={PASSOS_DA_PRATICA}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/*
          A comemoração acontece num lugar, e não sobre o creme.

          O broto pula, bate as folhas e solta brilhos — é a única pose do app
          em que ele festeja, e ela existe só aqui. O céu é feliz seja qual for
          o humor que a pessoa marcou hoje: quem acabou de fazer uma prática
          merece um céu bom, mesmo num dia ruim. Essa é a diferença entre
          espelhar o estado e fazer companhia.
        */}
        <View style={{ height: alturaDaFesta + insets.top }}>
          <Cena
            largura={largura}
            altura={alturaDaFesta + insets.top}
            humor="feliz"
            chao="grama"
            capim
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: CRISTA_DO_MORRO.grama - 6,
              alignItems: 'center',
            }}
          >
            <AnimatedSprout
              mood="feliz"
              stage={estagio}
              size={Math.round(alturaDaFesta * 0.62)}
              pose="comemora"
            />
          </View>
          <BalaoDoBroto
            lado="baixo"
            style={{
              position: 'absolute',
              left: 24,
              right: 24,
              top: insets.top + 18,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 14.5,
                lineHeight: 14.5 * 1.35,
                color: colors.textPrimary,
                textAlign: 'center',
              }}
            >
              {noFim({ cresceu: false })}
            </Text>
          </BalaoDoBroto>
        </View>

        <View style={{ padding: 24, alignItems: 'center', gap: 18 }}>
        <Text
          style={{
            color: colors.textPrimary,
            fontFamily: fonts.display.extraBold,
            fontSize: 30,
            lineHeight: 30 * 1.1,
            textAlign: 'center',
          }}
        >
          Você cuidou de você
        </Text>
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 16,
            lineHeight: 16 * 1.5,
            color: palette.brown700,
            textAlign: 'center',
          }}
        >
          Repare como você está agora, sem cobrar que seja diferente de antes. Fazer já conta.
        </Text>
        {/* Sem contar troféu: só devolve à pessoa que ela já voltou aqui. A
            contagem inclui esta, por isso a comparação é com 1. */}
        {jaFeita > 1 && (
          <Text
            style={{
              fontFamily: fonts.body.bold,
              fontSize: 14,
              color: colors.primaryStrong,
              textAlign: 'center',
            }}
          >
            Esta é a {jaFeita}ª vez que você faz esta prática.
          </Text>
        )}
        <View style={{ width: '100%', gap: 10, marginTop: 8 }}>
          {!!escrever && (
            <Button variant="primary" style={{ width: '100%' }} onPress={escrever}>
              Escrever no diário
            </Button>
          )}
          <Button
            variant={escrever ? 'secondary' : 'primary'}
            style={{ width: '100%' }}
            onPress={onBack}
          >
            Voltar às práticas
          </Button>
          <Button variant="ghost" style={{ width: '100%' }} onPress={() => setMode('guide')}>
            Fazer de novo
          </Button>
        </View>
        </View>
      </ScrollView>
      </ScreenTransition>
    );
  }

  // --- Leitura -------------------------------------------------------------

  return (
    <ScreenTransition transitionKey="leitura" ordem={PASSOS_DA_PRATICA}>
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <TopBar title={practice.title} onBack={onBack} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: tint,
            borderRadius: radius.lg,
            paddingVertical: 18,
            alignItems: 'center',
          }}
        >
          <PracticeIllustration name={practice.illustration} size={200} />
        </View>

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: radius.pill,
                ...shadows.sm,
              }}
            >
              <Text
                style={{ fontFamily: fonts.body.bold, fontSize: 12, color: palette.brown700 }}
              >
                {practice.duration}
              </Text>
            </View>
            {!!practice.guide && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: colors.primarySoft,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: radius.pill,
                }}
              >
                <Icon name="sparkle" size={13} color={colors.primaryStrong} />
                <Text
                  style={{
                    fontFamily: fonts.body.bold,
                    fontSize: 12,
                    color: colors.primaryStrong,
                  }}
                >
                  o app te guia
                </Text>
              </View>
            )}
          </View>

          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 16,
              lineHeight: 16 * 1.5,
              color: palette.brown700,
            }}
          >
            {practice.summary}
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 19 }}>Como fazer</Text>

          {practice.steps.map((s, i) => (
            <View key={s.title} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{ fontFamily: fonts.body.extraBold, fontSize: 14, color: colors.textInverse }}
                >
                  {i + 1}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.bold, fontSize: 15 }}>{s.title}</Text>
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 14,
                    lineHeight: 14 * 1.5,
                    color: palette.brown700,
                  }}
                >
                  {s.text}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View
          style={{
            ...vidros.cartao,
            borderRadius: radius.lg,
            padding: 18,
            ...shadows.sm,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 17, marginBottom: 8 }}>
            Por que funciona
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 15,
              lineHeight: 15 * 1.55,
              color: palette.brown700,
            }}
          >
            {practice.why}
          </Text>
        </View>

        {/*
          Quantas voltas, antes de comecar.

          O documento poe a escolha aqui, e ela resolve um incomodo real: o
          numero de ciclos vinha escrito na pratica e valia para todo mundo.
          Quatro voltas de 4-7-8 sao dezenove segundos cada — curto para quem
          ja respira assim, longo para quem esta comecando com o peito
          apertado. Tres opcoes, e a do meio continua sendo a que a pratica
          sempre teve.

          Nao fica guardado de proposito: e uma escolha para **esta** vez. Quem
          esta pior hoje escolhe tres hoje, e nao fica com tres para sempre.
        */}
        {!!respiracao && respiracao.phases.length > 0 && (
          <View
            style={{
              ...vidros.cartao,
              borderRadius: radius.lg,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              ...shadows.sm,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 15,
                color: palette.brown700,
              }}
            >
              Ciclos
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {CICLOS_A_ESCOLHER.map((n) => {
                const escolhido = n === ciclos;
                return (
                  <Pressable
                    key={n}
                    accessibilityRole="button"
                    accessibilityLabel={`${n} ciclos`}
                    onPress={() => setCiclos(n)}
                    style={{
                      minWidth: 48,
                      height: 38,
                      borderRadius: radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: escolhido ? colors.primarySoft : colors.surface,
                      borderWidth: 2,
                      borderColor: escolhido ? colors.primary : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.body.bold,
                        fontSize: 15,
                        color: colors.textPrimary,
                      }}
                    >
                      {n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {practice.guide ? (
          <>
            <Button variant="primary" style={{ width: '100%' }} onPress={() => setMode('guide')}>
              Começar com o {nomeDoBrotoAqui}
            </Button>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 13,
                color: palette.brown400,
                textAlign: 'center',
                marginTop: -6,
              }}
            >
              Você pode pausar quando quiser.
            </Text>
          </>
        ) : (
          /*
            Sem guia, esta tela não tinha saída nenhuma: só "Voltar".

            Dezessete das trinta e uma práticas são assim — mais da metade do
            conteúdo era um beco sem saída. A pessoa lia um exercício de dez
            minutos, fazia, voltava, e o app agia como se ela não tivesse
            aparecido: nada entrava em `practicesDone`, então nem "retomar de
            onde parou" nem "mais feitas" a enxergavam, e o broto não crescia.

            O comentário de `concluir` diz que abrir e desistir não é ter feito.
            Continua valendo: aqui a pessoa declara, e declarar é o único sinal
            que existe numa prática que acontece fora da tela. Num app sem
            placar e sem ranking, não há o que inflar — a contagem só serve para
            ela se reencontrar.
          */
          <Button variant="primary" style={{ width: '100%' }} onPress={concluir}>
            Já fiz esta prática
          </Button>
        )}
      </ScrollView>
    </View>
    </ScreenTransition>
  );
}

import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedSprout,
  BalaoDoBroto,
  Cena,
  CRISTA_DO_MORRO,
  Icon,
  PracticeTopicCard,
  ScreenTransition,
  TopBar,
} from '../../components';
import { PracticeIllustration } from '../../components/brand/PracticeIllustration';
import { PRACTICE_TOPICS, findPractice, findTopic, resumoDoTema } from '../../data/practices';
import { useAppState } from '../../state/AppStateProvider';
import type { OrigemDoRegistro } from '../../state/types';
import { ehNoite, noTema } from '../../data/falasDoBroto';
import {
  praticasMaisFeitas,
  sproutStage,
  ultimaPratica,
  vezesPorPratica,
} from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import { PracticeDetailScreen } from '../practices/PracticeDetailScreen';
import { useBotaoVoltar } from '../../navigation/useBotaoVoltar';
import { POR_TRAS_DA_BARRA } from '../../components/navigation/BottomNav';

/**
 * Os tres niveis da tela de praticas, do mais raso ao mais fundo.
 *
 * A chave e o **nivel**, e nao o tema ou a pratica que esta dentro dele: trocar
 * de tema e trocar do tema A para o tema B, que e o mesmo nivel, e ali a tela
 * nao desliza — ela so troca de conteudo, que e o certo. Quem desliza e quem
 * muda de profundidade.
 */
const PASSOS_DAS_PRATICAS = ['temas', 'tema', 'pratica'] as const;

export function PracticesScreen({
  onBack,
  onEscreverNoDiario,
  alvo,
}: {
  onBack: () => void;
  /** Repassado à prática: o fim dela pode levar ao diário. */
  /** Abre o diário com a pergunta de partida e de onde ela veio. */
  onEscreverNoDiario?: (comeco: string, origem: OrigemDoRegistro) => void;
  /** Prática para abrir de saída, vinda da oferta da Home. */
  alvo?: { topico: string; pratica: string } | null;
}) {
  const { colors, palette, shadows, tintsDosTemas, vidros } = useTema();
  const { data } = useAppState();
  const feitas = vezesPorPratica(data);

  /**
   * Retomar de onde parou. Sem isto, 31 exercícios viravam uma biblioteca em
   * que ninguém lembrava onde tinha ficado — e o app já sabia a resposta.
   */
  const ultima = ultimaPratica(data);
  const retomar = ultima ? findPractice(ultima.topic, ultima.practice) : undefined;
  const temaDaUltima = ultima ? findTopic(ultima.topic) : undefined;

  /*
    Descarta o que saiu do repertório, e descarta de um jeito que o tipo
    acompanhe.

    Uma prática pode sumir numa atualização e o histórico continuar citando
    ela. Antes isso era um `map` seguido de `filter`, e o `filter` não estreita
    tipo nenhum: a lista continuava podendo ter `undefined` dentro, e a tela
    jurava que não com dois `!`. O `flatMap` só monta o item quando as duas
    buscas acharam alguma coisa — some o `undefined`, somem os `!`.
  */
  const repetidas = praticasMaisFeitas(data).flatMap((r) => {
    const pratica = findPractice(r.topic, r.practice);
    const tema = findTopic(r.topic);
    return pratica && tema ? [{ ...r, pratica, tema }] : [];
  });
  const insets = useSafeAreaInsets();
  const { width: largura, height: alturaDaTela } = useWindowDimensions();

  /*
    A cena do tema ocupa pouco mais de um terco da tela.

    O documento desenha 300 sobre 844. Como fracao, o enquadramento sobrevive a
    aparelhos curtos — onde 300 fixos empurrariam a primeira pratica para fora
    da dobra, que e justamente o que esta tela nao pode fazer.
  */
  const alturaDaCenaDoTema = Math.max(220, Math.min(alturaDaTela * 0.36, 330));
  const ehDeNoite = ehNoite(new Date());
  const estagioDoBroto = sproutStage(data);

  // A oferta da Home chega como estado inicial: esta tela é montada de novo a
  // cada abertura, então não há caso em que o alvo mude com ela na frente.
  const [topicKey, setTopicKey] = useState<string | null>(alvo?.topico ?? null);
  const [practiceKey, setPracticeKey] = useState<string | null>(alvo?.pratica ?? null);

  /**
   * Em que degrau esta tela foi aberta — e é o chão dela.
   *
   * ## O problema
   *
   * Esta tela tem três degraus: a lista de temas, a lista de práticas de um
   * tema, e a prática. Quem entra pela barra desce os três a pé, e voltar um a
   * um é o certo.
   *
   * Mas os atalhos da tela inicial — "Para começar", "Onde você parou", a
   * sugestão do dia — pulam direto para a prática. O voltar então desfazia
   * passos que ninguém tinha dado: da prática caía na lista do tema, dali na
   * lista de temas, e só no terceiro toque a pessoa voltava para a tela
   * inicial. Três toques para desfazer um, passando por duas telas que ela
   * nunca viu.
   *
   * ## A regra
   *
   * Voltar nunca vai mais raso do que o degrau de entrada. Quem entrou numa
   * prática sai dela direto para de onde veio; quem entrou num tema sai do
   * tema; quem entrou pela raiz percorre os três.
   *
   * É `useRef` porque isto é onde a pessoa **entrou**: não pode mudar quando
   * ela navega para dentro. A tela é montada de novo a cada abertura, então o
   * valor nasce certo todas as vezes.
   */
  const entrada = useRef<'raiz' | 'tema' | 'pratica'>(
    alvo?.pratica ? 'pratica' : alvo?.topico ? 'tema' : 'raiz',
  ).current;

  /** Sair da prática: ou um degrau acima, ou fora da tela, conforme a entrada. */
  const voltarDaPratica = () => (entrada === 'pratica' ? onBack() : setPracticeKey(null));
  /** O mesmo para a lista de um tema. */
  const voltarDoTema = () => (entrada === 'raiz' ? setTopicKey(null) : onBack());

  // O botão do sistema segue exatamente o mesmo caminho da setinha do cabeçalho.
  useBotaoVoltar(() => {
    if (practiceKey) {
      if (entrada === 'pratica') return false;
      setPracticeKey(null);
      return true;
    }
    if (topicKey) {
      if (entrada !== 'raiz') return false;
      setTopicKey(null);
      return true;
    }
    return false;
  });

  const topic = topicKey ? findTopic(topicKey) : undefined;
  const practice = topicKey && practiceKey ? findPractice(topicKey, practiceKey) : undefined;

  // --- Uma prática aberta --------------------------------------------------

  if (practice && topic) {
    return (
      <ScreenTransition transitionKey="pratica" ordem={PASSOS_DAS_PRATICAS}>
        <PracticeDetailScreen
          practice={practice}
          topicKey={topic.key}
          tint={tintsDosTemas[topic.key]}
          onBack={voltarDaPratica}
          onEscreverNoDiario={onEscreverNoDiario}
        />
      </ScreenTransition>
    );
  }

  // --- Lista de práticas de um tema ---------------------------------------

  if (topic) {
    /* Como ele aparece neste tema: a fala, a pose e o ceu. Ver `NO_TEMA`. */
    const eleNoTema = noTema(topic.key);
    return (
      <ScreenTransition transitionKey="tema" ordem={PASSOS_DAS_PRATICAS}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 + POR_TRAS_DA_BARRA, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {/*
            A cena do tema, com o broto dentro dela.

            A `TopBar` saiu: o titulo do tema aparecia pequeno na barra e
            grande logo abaixo, e a barra roubava do ceu a faixa que ele
            precisa para passar por tras da hora e da bateria. O botao de
            voltar continua, redondo, pousado sobre o ceu.

            Ele nao fica ansioso no tema da ansiedade nem triste no da
            tristeza: num app de saude mental, o personagem que espelha o
            estado deixa a pessoa sozinha nele. Ver `NO_TEMA`.
          */}
          <View style={{ height: alturaDaCenaDoTema + insets.top }}>
            <Cena
              largura={largura}
              altura={alturaDaCenaDoTema + insets.top}
              humor={eleNoTema.humor}
              noite={eleNoTema.noite ?? ehDeNoite}
              chao="grama"
              capim
              xDoBroto={largura * 0.4}
            />
            <View
              style={{
                position: 'absolute',
                left: largura * 0.4 - alturaDaCenaDoTema * 0.34,
                bottom: CRISTA_DO_MORRO.grama - 6,
                width: alturaDaCenaDoTema * 0.68,
                alignItems: 'center',
              }}
            >
              <AnimatedSprout
                mood={eleNoTema.humor}
                stage={estagioDoBroto}
                size={Math.round(alturaDaCenaDoTema * 0.62)}
                pose={eleNoTema.pose}
              />
            </View>
            <BalaoDoBroto
              lado="esquerda"
              apareceEm={topic.key}
              style={{
                position: 'absolute',
                right: 20,
                top: insets.top + alturaDaCenaDoTema * 0.34,
                maxWidth: 160,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.body.bold,
                  fontSize: 14.5,
                  lineHeight: 14.5 * 1.35,
                  color: colors.textPrimary,
                }}
              >
                {eleNoTema.fala}
              </Text>
            </BalaoDoBroto>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              onPress={voltarDoTema}
              style={{
                position: 'absolute',
                left: 20,
                top: insets.top + 8,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                ...shadows.md,
              }}
            >
              <Icon name="back" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 20, gap: 6, marginTop: 4 }}>
            <Text
              style={{
                fontFamily: fonts.body.extraBold,
                fontSize: 13.5,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                color: colors.primaryStrong,
              }}
            >
              Práticas
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: fonts.display.extraBold,
                fontSize: 30,
                lineHeight: 30 * 1.1,
              }}
            >
              {topic.solucao}
            </Text>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 15.5,
                lineHeight: 15.5 * 1.5,
                color: palette.brown700,
              }}
            >
              {topic.intro}
            </Text>
          </View>

          <View style={{ paddingHorizontal: 20, gap: 12 }}>

          {topic.practices.map((p) => (
            <Pressable
              accessibilityRole="button"
              key={p.key}
              onPress={() => setPracticeKey(p.key)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: 14,
                opacity: pressed ? 0.85 : 1,
                ...shadows.sm,
              })}
            >
              <View
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: radius.md,
                  backgroundColor: tintsDosTemas[topic.key],
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <PracticeIllustration name={p.illustration} size={70} />
              </View>

              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.extraBold, fontSize: 16 }}>{p.title}</Text>
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 13,
                    lineHeight: 13 * 1.4,
                    color: palette.brown700,
                  }}
                >
                  {p.summary}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Text
                    style={{
                      fontFamily: fonts.body.bold,
                      fontSize: 12,
                      color: colors.textSecondary,
                    }}
                  >
                    {p.duration}
                  </Text>
                  {!!p.guide && (
                    <>
                      <Text style={{ color: palette.brown400 }}>·</Text>
                      <Text
                        style={{
                          fontFamily: fonts.body.bold,
                          fontSize: 12,
                          color: colors.primaryStrong,
                        }}
                      >
                        guiada
                      </Text>
                    </>
                  )}
                  {/* O app passa a lembrar o que já foi feito: antes eram 31
                      exercícios soltos e ninguém sabia onde tinha parado. */}
                  {!!feitas[`${topic.key}/${p.key}`] && (
                    <>
                      <Text style={{ color: palette.brown400 }}>·</Text>
                      <Text
                        style={{
                          fontFamily: fonts.body.bold,
                          fontSize: 12,
                          color: palette.brown400,
                        }}
                      >
                        feita {feitas[`${topic.key}/${p.key}`]}×
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <Icon name="chevronRight" color={palette.brown400} />
            </Pressable>
          ))}
          </View>
        </ScrollView>
      </View>
      </ScreenTransition>
    );
  }

  // --- Temas ---------------------------------------------------------------

  return (
    <ScreenTransition transitionKey="temas" ordem={PASSOS_DAS_PRATICAS}>
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TopBar title="Práticas" onBack={onBack} />
      {/* Os temas dividem a altura livre em vez de deixarem uma faixa vazia
          embaixo. `flexGrow` (e não `flex`) de propósito nos dois lados: se um
          dia houver temas demais para caber, ou a fonte do sistema estiver
          grande, os cartões voltam ao tamanho natural e a lista rola — com
          `flex` eles encolheriam e o texto seria espremido. */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          // Igual às laterais: assim o respiro de baixo lê como margem, e não
          // como uma sobra de tela que ninguém preencheu.
          paddingBottom: 20 + POR_TRAS_DA_BARRA,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        {!!retomar && !!temaDaUltima && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Retomar ${retomar.title}`}
            onPress={() => {
              setTopicKey(temaDaUltima.key);
              setPracticeKey(retomar.key);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              backgroundColor: colors.primarySoft,
              borderRadius: radius.lg,
              padding: 14,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="check" size={22} color={colors.primaryStrong} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{ fontFamily: fonts.body.bold, fontSize: 12, color: colors.primaryStrong }}
              >
                A última que você fez
              </Text>
              <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.extraBold, fontSize: 16 }}>
                {retomar.title}
              </Text>
            </View>
            <Icon name="chevronRight" color={colors.primaryStrong} />
          </Pressable>
        )}

        {/* Quem se repete são as favoritas. O app repara em vez de pedir para
            a pessoa marcar estrelinha — é menos uma tarefa para quem já está
            cansado, e o comportamento diz a mesma coisa. */}
        {repetidas.length > 0 && (
          <View style={{ gap: 8, marginTop: 2 }}>
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 12,
                letterSpacing: 0.6,
                color: colors.textSecondary,
              }}
            >
              AS QUE VOCÊ MAIS REPETE
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {repetidas.map((r) => (
                <Pressable
                  key={`${r.topic}/${r.practice}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.pratica.title}, feita ${r.vezes} vezes`}
                  onPress={() => {
                    setTopicKey(r.topic);
                    setPracticeKey(r.practice);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: radius.pill,
                    ...vidros.cartao,
                    ...shadows.sm,
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontFamily: fonts.body.bold, fontSize: 13 }}>
                    {r.pratica.title}
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.body.extraBold, fontSize: 12, color: palette.brown400 }}
                  >
                    {r.vezes}×
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {PRACTICE_TOPICS.map((t) => (
          <PracticeTopicCard
            key={t.key}
            /*
              O mesmo nome que a tela inicial usa, e não o `title`.

              Não é só coerência de vocabulário: os dois lugares dividem o
              **mesmo desenho**, e as cenas passaram a mostrar o depois — a
              pedra posta no chão, a nuvem saindo da frente do sol, a brasa no
              lugar da chama. Um desenho de alívio embaixo da palavra
              "Estresse" é exatamente o descasamento que essas cenas foram
              refeitas para tirar; mantê-lo aqui o recriaria numa tela só.

              O substantivo não se perde: ele abre o `subtitle` de onze dos
              treze intros ("Tristeza não é um problema a resolver", "Raiva
              quase sempre é a capa de outra coisa") e é o título do próprio
              tema quando ele abre, em `TopBar`. Os dois que não trazem a
              palavra no resumo são insônia e comparação, e os dois abrem com
              o verbo — "Dormir não se força", "Comparar é automático".
            */
            title={t.solucao}
            subtitle={resumoDoTema(t.intro)}
            icon={t.icon}
            chave={t.key}
            /*
              A chave vira cor **aqui**, com o tema que está no ar.

              `practices.ts` é dado, não componente: se ele importasse a cor,
              ficaria com a do tema claro para sempre, e no escuro o quadrado
              seguiria pastel com um ícone quase branco por cima — invisível.
              Por isso ele guarda só a chave do tema, e quem desenha resolve.

              A chave é a **do próprio tema** ("ansiedade", "luto"): antes havia
              um campo `tint` ao lado, que só podia repetir o `key` ou estar
              errado. Três pares repetiam de fato, e no escuro dois eram o
              mesmo hex — Solidão e Culpa com quadrados idênticos.
            */
            tint={tintsDosTemas[t.key]}
            style={{ flexGrow: 1 }}
            onPress={() => setTopicKey(t.key)}
          />
        ))}
      </ScrollView>
    </View>
    </ScreenTransition>
  );
}

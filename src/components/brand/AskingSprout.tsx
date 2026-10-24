import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { fonts, useTema, type Mood } from '../../theme';
import { AnimatedSprout } from './AnimatedSprout';
import { BalaoDoBroto } from './BalaoDoBroto';
import { Cena, CRISTA_DO_MORRO } from './Cena';
import type { Pose } from './geometriaDoBroto';

/**
 * A margem lateral da tela de onboarding, que a faixa de céu precisa desfazer.
 *
 * Ela mora no `contentContainerStyle` do `ScrollView` de lá. Escrita aqui como
 * constante, e não como -20 solto no estilo, porque são dois números que têm
 * de bater: se a margem de lá mudar, esta linha é a que precisa mudar junto.
 */
const MARGEM_DA_TELA = 20;

/**
 * AskingSprout — o broto fazendo a pergunta, com o balão de fala acima dele.
 *
 * O balão fica em cima e o bico aponta para baixo, para o broto ficar grande
 * e centrado no meio da tela. A primeira versão punha os dois lado a lado; o
 * mascote sobrava num canto com 62px, pequeno demais para ser o personagem.
 *
 * Ele está sempre no estágio 3 e feliz: é o mesmo rosto do começo ao fim do
 * onboarding, para a pessoa reconhecer quem está falando com ela.
 *
 * ## O chão embaixo dele
 *
 * No redesenho ele deixa de flutuar sobre o creme e passa a **pisar em algum
 * lugar**: uma faixa de céu com um morro, que sangra para fora da margem da
 * tela. A margem é de 20, e a faixa a desfaz com `marginHorizontal: -20` —
 * negativa, e não posição absoluta, porque posição absoluta fora dos limites
 * do pai não desenha no Android.
 *
 * A cor do céu é a resposta da pessoa: enquanto ela não disse como tem estado,
 * é o azul de espera; depois, é o tom do humor que ela marcou. É a primeira
 * vez no app em que uma resposta muda o mundo em volta do broto, e é de
 * propósito que seja no onboarding.
 */

type Props = {
  title: string;
  sub?: string;
  kicker?: string;
  /** Muda a cada resposta escolhida; o broto balança confirmando. */
  reageA?: string | number | null;
  /**
   * Telas com muitas opções de resposta. O broto encolhe só nelas, em vez de
   * ficar pequeno no app inteiro por causa das duas mais cheias.
   */
  compacto?: boolean;
  /**
   * Quanta altura sobrou para o passo inteiro, em pixels.
   *
   * Zero quer dizer "ainda não sei" — no primeiro quadro, antes de o
   * `onLayout` responder. Aí vale a conta antiga, pela janela.
   */
  espaco?: number;
  /** O que ele faz neste passo — acena na chegada, pensa quando pergunta. */
  pose?: Pose;
  /** O céu atrás dele. Antes do check-in, o azul de espera. */
  humor?: Mood | null;
  /** Depois do pôr do sol o céu escurece, mesmo no tema claro. */
  noite?: boolean;
  /**
   * A altura do cabeçalho que flutua por cima do passo.
   *
   * O céu sobe até o topo da tela, por trás dele; o balão não pode subir
   * junto, senão a pergunta fica embaixo do "voltar". Esta é a folga que
   * mantém o balão onde ele sempre esteve.
   */
  folgaDoTopo?: number;
};

export function AskingSprout({
  title,
  sub,
  kicker,
  reageA = null,
  compacto = false,
  espaco = 0,
  pose = 'parado',
  humor = null,
  noite = false,
  folgaDoTopo = 0,
}: Props) {
  const { colors, palette, moodColorsFundo, cena } = useTema();
  const { width, height } = useWindowDimensions();
  /**
   * Largura e altura entram as duas: a largura define o quanto ele domina a
   * tela, e a altura impede que ele empurre as opções para fora dela.
   *
   * O termo de altura é o que segura telas pequenas. E ele foi baixando à
   * medida que os botões de resposta cresceram: numa tela de 690px os dois não
   * cabem grandes ao mesmo tempo, e entre mascote e alvo de toque quem cede é
   * o mascote.
   */
  /*
    ## O broto cede ao que sobrou, e não ao tamanho da janela

    A conta era `height * 0,17` — a janela inteira. Só que o passo não dispõe
    da janela: dele saem ainda o cabeçalho, o rodapé e os recuos do sistema.
    Num iPhone X isso são 142 pontos, e num SE de 320 por 548 o que sobra para
    o conteúdo são **406**. Dimensionar pela janela fazia o mascote reservar
    espaço que não existia, e quem pagava eram as opções, empurradas para fora.

    Agora a referência é `espaco`, medido de verdade pelo `onLayout` de quem
    desenha o passo. Medir, e não calcular, porque o cabeçalho e o rodapé mudam
    de altura com o tamanho da fonte do sistema — e quem aumenta a fonte é
    justamente quem mais precisa que caiba.

    `TETO_DA_FAIXA` é a fatia do que sobrou que o mascote pode ocupar. Acima
    disso ele empurra as respostas para fora, e entre mascote e alvo de toque
    quem cede é o mascote — a mesma regra de antes, agora com o número certo
    na frente.
  */
  /*
    Os numeros saem de medida, nao de gosto.

    Com a conta antiga, num iPhone X, faltavam 27 pontos no pior passo (a roda
    das horas) para tudo caber sem rolar. 27 pontos de faixa sao 24 de broto, e
    24 a menos num broto de 125 dao 101 — que e 0,17 do espaco de 592. O teto
    do compacto desceu na mesma proporcao.

    O teto absoluto existe para a tela grande: so com fracao, o mascote cresce
    junto com o aparelho e o deficit nunca fecha.
  */
  const TETO_DA_FAIXA = compacto ? 0.1 : 0.17;
  const TETO_ABSOLUTO = compacto ? 86 : 130;
  const porAltura = espaco > 0 ? espaco * TETO_DA_FAIXA : height * (compacto ? 0.095 : 0.17);
  const sproutSize = Math.min(width * (compacto ? 0.3 : 0.44), porAltura, TETO_ABSOLUTO);

  /**
   * Abaixo deste tamanho a cena sai inteira, e isso é melhor do que encolher.
   *
   * Um broto de cinquenta pontos dentro de uma faixa de céu não é um mascote
   * menor: é uma tira de cor com uma bolinha no meio, que custa cem pontos de
   * altura e não entrega personagem nenhum. Numa tela em que faltam cem
   * pontos, essa é a primeira coisa que tem de ceder — e cede por inteiro,
   * porque meio mascote é pior que nenhum.
   *
   * O balão fica. Ele é a pergunta, e a pergunta é a razão da tela existir; o
   * bico dele passa a apontar para as respostas, que é para onde a pessoa vai
   * mesmo olhar.
   *
   * Noventa pontos é onde o desenho ainda tem rosto e ainda paga a altura que
   * custa: abaixo disso a cara some e a faixa vira só uma tira de cor.
   */
  const PISO_DO_MASCOTE = 90;
  const temCena = sproutSize >= PISO_DO_MASCOTE;

  /*
    Sem vaso, o broto nasce da terra — e o pé dele precisa ficar **abaixo** da
    linha do morro, senão a haste parece pousada em cima do chão em vez de
    plantada nele. Uma fração do tamanho, e não um número fixo, porque ele
    encolhe nas telas compactas.
  */
  const RAIZ_ENTERRADA = Math.round(sproutSize * 0.06);
  /* A altura do desenho sem vaso é `size * 1,12` — ver `quadroDoBroto`. */
  const alturaDaFaixa = Math.round(sproutSize * 1.12) + CRISTA_DO_MORRO.grama + 10;

  /*
    A cor do céu, calculada igual à `Cena` calcula a dela.

    O céu daqui de cima e o da faixa do morro são dois desenhos encostados um
    no outro, e a emenda só some se as duas contas derem o mesmo pixel: o tom
    do humor (ou o azul de espera), e de noite a mesma camada de
    `cena.noite` com a mesma força por cima. Os dois são chapados — não há
    degradê para casar.
  */
  const corDoCeu = humor ? moodColorsFundo[humor] : palette.blue100;

  return (
    /*
      ## O céu sobe até o topo da tela

      Esta `View` é a **mola de cima** do passo: ela cresce (`flexGrow`) com o
      balão e o morro encostados embaixo (`justifyContent: 'flex-end'`), e a
      sobra que ela ganha é pintada de céu. Com a mola de baixo do
      `OnboardingScreen`, a sobra se divide ao meio e o conteúdo continua
      centrado onde estava — o que mudou é que a metade de cima deixou de ser
      creme.

      Ela desfaz a margem da tela (`marginHorizontal` negativo, devolvido em
      `paddingHorizontal`) para o céu ir de borda a borda, e começa no pixel
      zero da tela: o cabeçalho flutua por cima, e `folgaDoTopo` segura o balão
      abaixo dele.

      Sem cena — tela pequena demais para o mascote —, não há morro para o céu
      nascer, e o fundo fica creme. A mola continua, para a centragem não
      mudar.
    */
    <View
      style={{
        flexGrow: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 2,
        marginHorizontal: -MARGEM_DA_TELA,
        paddingHorizontal: MARGEM_DA_TELA,
        paddingTop: folgaDoTopo + 6,
      }}
    >
      {temCena && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: corDoCeu,
          }}
        >
          {noite && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: cena.noite,
                opacity: cena.noiteForca,
              }}
            />
          )}
        </View>
      )}
      {/*
        O balão saiu daqui para `BalaoDoBroto`: ele era o único do app com bico,
        e o bico é justamente o que marca a fala do broto. Agora a saudação da
        tela inicial e o "Seu broto percebeu" usam o mesmo desenho.
      */}
      <BalaoDoBroto lado="baixo" tom="superficie" style={{ width: '100%' }}>
        {!!kicker && (
          <Text
            style={{
              fontFamily: fonts.body.bold,
              fontSize: 13,
              color: colors.primaryStrong,
              textAlign: 'center',
            }}
          >
            {kicker}
          </Text>
        )}
        <Text
          style={{
            fontFamily: fonts.display.bold,
            fontSize: 20,
            lineHeight: 20 * 1.26,
            color: colors.textPrimary,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        {!!sub && (
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 14,
              lineHeight: 14 * 1.5,
              color: palette.brown700,
              textAlign: 'center',
            }}
          >
            {sub}
          </Text>
        )}
      </BalaoDoBroto>

      {/*
        A faixa do morro tem a altura do broto mais o chão, e nada além disso.

        O céu acima dela não é mais desta faixa: é o fundo da mola, pintado
        com a mesma conta de cor. Antes a faixa parava aqui de propósito, com
        medo de o balão branco perder o contorno sobre o céu — mas o balão tem
        sombra própria, e o que se perdia era o mundo do broto acabando numa
        linha reta no meio da tela, com creme por cima.
      */}
      {temCena && (
      <View style={{ marginHorizontal: -MARGEM_DA_TELA, marginTop: 6 }}>
        <View style={{ height: alturaDaFaixa }}>
          <Cena
            largura={width}
            altura={alturaDaFaixa}
            humor={humor ?? undefined}
            ceu={humor ? undefined : palette.blue100}
            noite={noite}
            semAstro
            nuvens={false}
            chao="grama"
            capim
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: CRISTA_DO_MORRO.grama - RAIZ_ENTERRADA,
              alignItems: 'center',
            }}
          >
            {/*
              O rosto e sempre o do humor feliz — `rostoDoHumor`.

              Este componente so existe no onboarding, e ali o broto esta sendo
              apresentado. As poses das perguntas trocavam a cara a cada passo:
              `calmo` e `dorme` fecham os olhos, `pensa` torce a boca. Lado a
              lado isso lia como ele reagindo ao que a pessoa respondeu — e
              numa conversa em que ela conta que anda mal, uma cara fechada em
              resposta e a leitura errada. O corpo da pose continua: as folhas
              mexem, ele balanca, os zes sobem. So a expressao nao muda.
            */}
            <AnimatedSprout
              mood="feliz"
              rostoDoHumor
              stage={3}
              size={sproutSize}
              bamboleia
              swayOn={reageA}
              pose={pose}
              showPot={false}
            />
          </View>
        </View>
      </View>
      )}
    </View>
  );
}

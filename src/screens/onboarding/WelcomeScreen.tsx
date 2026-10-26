import React, { useState } from 'react';
import {
  type LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedSprout,
  BalaoDoBroto,
  Button,
  Cena,
  CRISTA_DO_MORRO,
  TrazerDeVolta,
} from '../../components';
import {
  alturaDoMascote,
  BULB_R,
  CX,
  noQuadro,
  quadroDoBroto,
  STEM_TOP_Y,
} from '../../components/brand/geometriaDoBroto';
import { NA_CHEGADA } from '../../data/falasDoBroto';
import { fonts, radius, useTema } from '../../theme';

/**
 * Boas-vindas — a primeira tela de quem abre o app.
 *
 * Não pede conta nem e-mail porque não existe conta: nada do que a pessoa
 * escreve sai do aparelho, e é isso que o app promete no Sobre e na política
 * de privacidade. Em vez de um "entrar" que não teria onde entrar, o segundo
 * botão explica como os registros voltam depois de reinstalar.
 *
 * ## O que mudou no redesenho
 *
 * A janela com as plantas saiu, e no lugar entrou o **broto acenando numa
 * cena**. A janela era bonita e era um lugar — mas era um lugar sem ninguém
 * dentro, e a primeira tela do app é onde o personagem precisa aparecer
 * primeiro. Quem chega agora é cumprimentado por alguém, não recebido por uma
 * paisagem.
 *
 * O céu daqui é azul fixo, e não o do humor: ninguém disse ainda como está.
 */
export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const { colors, palette } = useTema();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  /*
    ## A cena fica com o que sobra, e o botão nunca sai da tela

    A cena era 62% da altura da **janela**, sem descontar o que vem embaixo
    dela. O texto e os dois botões medem uns 440 pontos, e a soma passava da
    tela em todo aparelho: medido no navegador, o "Oi, Brotinho" ficava abaixo
    da borda até numa tela de 414 por 814, e num iPhone X sobravam 181 pontos
    para fora. A rolagem estava lá para resolver — e no iPhone do Pedro ela não
    respondeu, com a primeira tela do app cortada e sem saída.

    Agora a conta vai ao contrário: a altura da rolagem, menos o que o texto e
    os botões medem **de verdade** (`onLayout`), é o que a cena recebe. Medir,
    e não estimar, porque o texto muda de altura com a largura do aparelho e
    com o tamanho da fonte do sistema. O broto acompanha a cena — ver
    `tamanhoDoBroto`.

    `CENA_MINIMA` é o piso: abaixo dele o desenho deixa de ser lugar. Uma tela
    minúscula com letra gigante passa dele, e aí a rolagem volta a valer.
    Antes da primeira medida, os números de partida são os do navegador.
  */
  const respiroDeBaixo = 24 + insets.bottom;
  /*
    O céu sobe até o topo da tela, por trás da barra de status.

    A tela tinha `paddingTop: insets.top` na raiz, e a faixa do relógio e da
    bateria ficava com a cor da página — o céu começava abaixo dela, como um
    quadro colado. Agora a rolagem começa no pixel zero, a cena ganha a altura
    da barra de status (`topo`) e o desenho dela continua por trás. Tudo que é
    posicionado no alto da cena — balão, sol, nuvem — soma `topo`; o broto é
    contado do chão e não muda.
  */
  const topo = insets.top;
  const [alturaDaRolagem, setAlturaDaRolagem] = useState(height);
  /** A altura que a tela tem para o conteúdo, abaixo da barra de status. */
  const util = alturaDaRolagem - topo;
  /*
    Tela baixa — os iPhone SE, de 647 pontos úteis para baixo: o texto aperta.

    Ali o texto e os botões sozinhos já passam de dois terços da tela, e nenhum
    tamanho de cena salva o botão. Título um pouco menor, margens menores e um
    piso de cena mais baixo devolvem o "Oi, Brotinho" para dentro da tela sem
    mudar nenhuma palavra.
  */
  const apertada = util < 700;
  const CENA_MINIMA = apertada ? 170 : 220;
  const MARGEM_DO_TEXTO = apertada ? 16 : 28;
  const MARGEM_DOS_BOTOES = apertada ? 18 : 32;
  const [alturaDoTexto, setAlturaDoTexto] = useState(270);
  const [alturaDosBotoes, setAlturaDosBotoes] = useState(118);
  const mede = (atual: number, definir: (v: number) => void) => (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0 && Math.abs(h - atual) > 1) definir(h);
  };
  const alturaDaCena = Math.round(
    Math.max(
      CENA_MINIMA,
      Math.min(
        560,
        util - respiroDeBaixo - MARGEM_DO_TEXTO - alturaDoTexto - MARGEM_DOS_BOTOES - alturaDosBotoes,
      ),
    ),
  );
  /*
    O broto do tamanho da cena.

    Era 270 fixo, para uma cena de 540 a 560. Com a cena encolhendo, um broto
    fixo passaria do céu e encostaria no balão. Ele ocupa no máximo 62% da
    altura da cena, acima da crista do morro, e nunca cresce além do 270 do
    documento.
  */
  const tamanhoDoBroto = Math.round(
    Math.min(270, ((alturaDaCena - CRISTA_DO_MORRO.grama) * 0.62 * 270) / alturaDoMascote(1, 270)),
  );
  /*
    O broto à esquerda, e o balão apontando para a cabeça dele.

    Com o broto de 270 no meio, o balão cabia ao lado da cabeça dele. Com o
    broto do tamanho da cena, o balão no mesmo lugar caía em cima do vaso. Então
    o broto sai do meio — centrado no terço esquerdo da tela — e o balão vem
    para a direita dele.

    O bico do balão sai do meio da lateral e aponta reto. Para apontar **para o
    broto**, o meio do balão fica na altura do centro da cabeça, e a ponta do
    bico encosta um pouco à direita dela. O centro da cabeça é a mesma conta que
    o `AnimatedSprout` faz para pôr os zês e os brilhos (`noQuadro` no topo da
    haste), então os dois não têm como discordar. A altura do balão é medida:
    ela muda com a fonte do sistema.
  */
  const quadro = quadroDoBroto(1, tamanhoDoBroto);
  const centroDoBroto = Math.round(width * 0.32);
  const pesDoBroto = alturaDaCena + topo - CRISTA_DO_MORRO.grama;
  const cabeca = noQuadro(quadro, CX, STEM_TOP_Y[1] - 4);
  const cabecaX = centroDoBroto - quadro.largura / 2 + cabeca.x;
  const cabecaY = pesDoBroto - quadro.altura + cabeca.y;
  const raioDaCabeca = BULB_R[1] * quadro.escala;
  const [alturaDoBalao, setAlturaDoBalao] = useState(72);
  const inicioDoBalao = Math.round(cabecaX + raioDaCabeca + 6);
  const topoDoBalao = Math.max(topo + 8, Math.round(cabecaY - alturaDoBalao / 2));
  /*
    O sol sai da esquerda, onde agora mora o broto, e vai para o alto à
    direita, acima do balão. Fica a 75% e só aparece se couber ali inteiro:
    numa tela baixa o balão sobe até o topo, e um sol espremido contra ele é
    pior que céu sem sol. A nuvem fica entre o broto e o balão, no alto.
  */
  const ESCALA_DO_SOL = 0.75;
  const raioDoSol = 30 * (width / 390) * ESCALA_DO_SOL;
  const solCabe = topoDoBalao - topo >= raioDoSol * 2 + 22;
  const ceuDaChegada = {
    sol: {
      x: Math.round(width - 18 - raioDoSol * 1.5),
      y: Math.round(topo + 12 + raioDoSol),
      escala: ESCALA_DO_SOL,
    },
    nuvens: [{ x: Math.round(width * 0.4), y: topo + 16, escala: 0.55 }],
  };
  const [explicando, setExplicando] = useState(false);
  /**
   * A confirmação da volta ocupa o mesmo modal, como segundo passo.
   *
   * Enquanto ela está na frente, a explicação some: dois assuntos empilhados
   * num modal só é o que já tinha dado errado quando eram dois modais.
   */
  const [confirmandoVolta, setConfirmandoVolta] = useState(false);

  const fecharExplicacao = () => {
    setExplicando(false);
    setConfirmandoVolta(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        onLayout={mede(alturaDaRolagem, setAlturaDaRolagem)}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: respiroDeBaixo,
          justifyContent: 'space-between',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/*
          A arte e a promessa são um bloco só, e isso é o que conserta a tela.

          Eram três filhos soltos num `space-between`: desenho, texto, botões.
          Num aparelho alto a sobra se parte em **duas** — cento e quarenta
          pontos entre o desenho e o título, cento e setenta entre o texto e o
          botão. Um terço da primeira tela do app era buraco, e buraco no meio
          de uma composição não lê como respiro, lê como inacabado.

          Com dois filhos a sobra vai para um lugar só, e ela cai no lugar
          certo: acima do botão. O texto encosta no desenho e vira legenda
          dele, que é o que ele sempre foi.
        */}
        {/*
          O céu de quando se puxa o topo: no iPhone a rolagem estica além do
          começo, e o que aparecia ali era a cor da página. Fora de vista em
          repouso.
        */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -1000,
            left: 0,
            right: 0,
            height: 1000,
            backgroundColor: palette.blue100,
          }}
        />
        <View>
          <View style={{ height: alturaDaCena + topo }}>
            <Cena
              largura={width}
              altura={alturaDaCena + topo}
              ceu={palette.blue100}
              chao="grama"
              capim
              semAstro={!solCabe}
              ceuLivre={ceuDaChegada}
              xDoBroto={centroDoBroto}
            />
            {/*
              O broto no meio, com os pés na crista do morro.

              `size` é a largura de referência do desenho: 270 são os 1,35 de
              escala do documento sobre as 200 unidades do enquadramento.
            */}
            <View
              style={{
                position: 'absolute',
                left: centroDoBroto - quadro.largura / 2,
                width: quadro.largura,
                bottom: CRISTA_DO_MORRO.grama,
                alignItems: 'center',
              }}
            >
              <AnimatedSprout mood="feliz" stage={1} pose="acena" size={tamanhoDoBroto} />
            </View>
            {/*
              O balão fica à esquerda do broto e aponta para ele.

              Ele sai do alinhamento do texto de baixo de propósito: fala não é
              parágrafo, e um balão alinhado à margem lê como legenda.
            */}
            <View
              onLayout={mede(alturaDoBalao, setAlturaDoBalao)}
              style={{ position: 'absolute', left: inicioDoBalao, right: 16, top: topoDoBalao }}
            >
            <BalaoDoBroto lado="esquerda">
              <Text
                style={{
                  fontFamily: fonts.body.bold,
                  fontSize: 14.5,
                  lineHeight: 14.5 * 1.35,
                  color: colors.textPrimary,
                }}
              >
                {NA_CHEGADA}
              </Text>
            </BalaoDoBroto>
            </View>
          </View>

          <View
            onLayout={mede(alturaDoTexto, setAlturaDoTexto)}
            style={{ paddingHorizontal: 24, gap: apertada ? 8 : 12, marginTop: MARGEM_DO_TEXTO }}
          >
            <Text
              style={{
                color: palette.brown400,
                fontFamily: fonts.display.bold,
                fontSize: apertada ? 21 : 24,
                lineHeight: (apertada ? 21 : 24) * 1.2,
              }}
            >
              Oi, eu sou o Brotinho
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: fonts.display.extraBold,
                fontSize: apertada ? 25 : 30,
                lineHeight: (apertada ? 25 : 30) * 1.2,
              }}
            >
              Vou crescer junto com você, um dia de cada vez
            </Text>
            {/*
              O subtítulo diz o que o desenho não consegue.

              Ele era "Fale, escreva, respire. O broto cresce conforme você
              aparece — e o que você contar não sai deste aparelho." Falar,
              escrever e respirar é o que todo app de bem-estar faz, e o broto
              crescendo já está desenhado bem ali em cima, na janela. Das três
              frases, duas gastavam espaço com o que a imagem já mostra ou com
              o que não separa o Brotinho de ninguém.

              O que ele tem e mais ninguém tem é a Composta — repetir em voz
              alta até a frase virar só som —, e a pessoa vai **fazer** isso no
              sétimo passo. Anunciar aqui é a diferença entre entrar num diário
              e entrar para experimentar uma coisa que não dá para entender
              lendo.

              A privacidade fica, e fica por último: ela não traz ninguém para
              dentro, mas é o que tira o medo de começar a escrever.
            */}
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: apertada ? 15 : 16,
                lineHeight: (apertada ? 15 : 16) * (apertada ? 1.45 : 1.55),
                color: palette.brown700,
              }}
            >
              Escreva ou fale o que passou hoje. E repita em voz alta o pensamento que te
              persegue, até ele virar só som. Nada disso sai do seu aparelho sem você deixar.
            </Text>
          </View>
        </View>

        <View
          onLayout={mede(alturaDosBotoes, setAlturaDosBotoes)}
          style={{ paddingHorizontal: 24, gap: 10, marginTop: MARGEM_DOS_BOTOES }}
        >
          <Button size="lg" style={{ width: '100%' }} onPress={onStart}>
            Oi, Brotinho
          </Button>
          <Pressable
            accessibilityRole="button"
            onPress={() => setExplicando(true)}
            style={{ paddingVertical: 12, alignItems: 'center' }}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 15,
                color: colors.primaryStrong,
              }}
            >
              Já usei o Brotinho antes
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={explicando}
        transparent
        animationType="fade"
        onRequestClose={fecharExplicacao}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 22 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={fecharExplicacao}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.45)' }]}
          />
          <View
            style={{
              backgroundColor: colors.bg,
              borderRadius: radius.lg,
              padding: 22,
              gap: 12,
            }}
          >
            {!confirmandoVolta && (
              <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.bold, fontSize: 21 }}>
                Seus registros voltam sozinhos
              </Text>
            )}
            {!confirmandoVolta && (
              <>
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 15,
                    lineHeight: 15 * 1.55,
                    color: palette.brown700,
                  }}
                >
                  O Brotinho não tem login, e isso é de propósito: sem conta e sem servidor, não
                  existe cópia do seu diário em lugar nenhum além do seu celular.
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 15,
                    lineHeight: 15 * 1.55,
                    color: palette.brown700,
                  }}
                >
                  Se você reinstalou no mesmo aparelho, ou trocou de celular restaurando o backup do
                  sistema, seus registros voltam junto com ele. É só continuar daqui.
                </Text>

                {/* A saída para quem o backup não cobriu.
                
                Ela também mora em Privacidade, e só ali seria inútil: quem
                acabou de reinstalar está exatamente aqui, e Privacidade fica
                atrás dos catorze passos do onboarding e do paywall. Quem mais
                precisa dela seria quem menos conseguiria chegar. */}
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 15,
                    lineHeight: 15 * 1.55,
                    color: palette.brown700,
                  }}
                >
                  E se não voltaram: a cópia de segurança que você tenha baixado daqui traz tudo
                  de volta.
                </Text>
              </>
            )}

            <TrazerDeVolta aparencia="botao" aoMudarConfirmacao={setConfirmandoVolta} />

            {!confirmandoVolta && (
              <Button variant="ghost" style={{ width: '100%' }} onPress={fecharExplicacao}>
                Entendi
              </Button>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { entreAspas } from '../../data/conselhos';
import { useMenosMovimento } from '../../hooks/useMenosMovimento';
import { fonts, useTema } from '../../theme';
import { palette, tracos } from '../../theme/tokens';
import { Icon } from '../core/Icon';
import type { OrigemDosFarelos } from './ChuvaDeFarelos';
import { GraoDePapel } from './GraoDePapel';
import { NAO_ACHATAR } from '../naoAchatar';
import {
  ALTURA_DO_CANTEIRO,
  CAVA,
  COLUNA_DO_PAPEL,
  COVA,
  ETAPAS,
  FundoDoBuraco,
  PAPEL,
  PUXA,
  Papel,
  TOPO_DO_PAPEL,
  TORROES,
  Tampa,
  entreDois,
} from './buracoDaFrase';
import {
  TERRA_FUNDA,
  TERRA_SOMBRA,
  TEXTO_NA_TERRA,
  TEXTO_NA_TERRA_FRACO,
} from './terraDoCanteiro';

/**
 * A Frase do dia — um canteiro dentro de um cartão.
 *
 * ## O que isto substitui, e por quê
 *
 * A `FaixaDaFrase`: a mesma terra, mas sangrando de borda a borda e emendada
 * na faixa da Composta logo acima. As duas juntas eram um terreno contínuo que
 * tomava os primeiros seiscentos pontos da tela inicial.
 *
 * O redesenho corta esse terreno em dois objetos, e aqui isso resolve mais do
 * que espaço. Numa terra que atravessa a tela, "desenterrar" compete com a
 * Composta pela mesma metáfora — as duas são coisas que acontecem no chão. Num
 * cartão com borda de grama por cima, a frase vira **um canteiro**: um lugar
 * pequeno, cercado, com uma coisa só plantada dentro. É o que ela sempre foi,
 * e é a primeira versão em que o desenho diz isso.
 *
 * ## O mecanismo não mudou
 *
 * A cova que cede em três estágios, a folha que não sai do lugar, a terra
 * recortada por cima dela e os farelos que caem pela tela são os mesmos, e
 * moram em `buracoDaFrase`. O que mudou aqui é a moldura e o fim: a frase
 * aparece **dentro do cartão**, e não numa folha que cobre a tela.
 *
 * ## Por que a frase deixou de abrir em tela cheia
 *
 * Porque a folha de tela cheia cobria o buraco de onde ela tinha acabado de
 * sair. A encenação inteira — a terra tremendo, a boca cedendo três vezes, o
 * papel aparecendo lá dentro — terminava sendo apagada pelo próprio prêmio.
 * Aqui o papel sobe e se desdobra no lugar, com o buraco aberto embaixo: dá
 * para ver de onde veio.
 *
 * ## As cores não seguem o tema
 *
 * Nem a terra nem o papel. A terra é `terraDoCanteiro`, que é fixa nos dois
 * temas pelo mesmo motivo de sempre — ela é paisagem, e paisagem tem luz
 * própria —, e os textos sobre ela são os dois tons já medidos lá. O papel, ao
 * contrário, é `colors.surface`: ele é **superfície de leitura**, não paisagem,
 * e no escuro precisa deixar de ser branco. Escrever `palette.cream100` ali
 * daria um cartão claro com texto creme em cima à noite, que é o erro que a
 * terra já ensinou uma vez.
 */

/** A borda de grama no alto, em pontos. */
const GRAMA = 16;

/**
 * A altura reservada ao canteiro fechado.
 *
 * Menor que o canteiro inteiro, de propósito: o desenho reserva folga em volta
 * do buraco para ele poder abrir sem a terra cortar nas pontas, e essa folga é
 * terra vazia. Num cartão ela aparece como um vão marrom acima do buraco. A
 * caixa menor, com a sobra puxada para cima, corta o vão sem tocar no desenho.
 */
const ALTURA_FECHADA = 150;

type Props = {
  /** A largura do cartão. O canteiro é desenhado nela, 1:1. */
  largura: number;
  /** A frase de hoje. Só é lida depois de desenterrada. */
  texto: string;
  /** O nome que ela deu ao broto: é dele que a frase vem. */
  nomeDoBroto: string;
  /** A pessoa já desenterrou hoje. */
  aberto: boolean;
  guardada: boolean;
  totalGuardadas: number;
  /** Chamado no primeiro toque do dia, quando a cavação começa. */
  onDesenterrar: () => void;
  onGuardar: () => void;
  onVerGuardadas: () => void;
  onCompartilhar: () => void;
  compartilhando?: boolean;
  aviso?: string | null;
  /**
   * Chamado a cada estágio em que o buraco cede, com onde ele está **na
   * janela** e o tamanho dele naquele estágio. Ver `ChuvaDeFarelos`.
   */
  aoCeder?: (origem: OrigemDosFarelos) => void;
};

export function CartaoDaFrase({
  largura,
  texto,
  nomeDoBroto,
  aberto,
  guardada,
  totalGuardadas,
  onDesenterrar,
  onGuardar,
  onVerGuardadas,
  onCompartilhar,
  compartilhando = false,
  aviso = null,
  aoCeder,
}: Props) {
  const { colors, shadows } = useTema();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const menosMovimento = useMenosMovimento();

  const passo = useRef(new Animated.Value(0)).current;
  /** A folha já foi desenterrada hoje? Começa assim em quem já abriu. */
  const [fora, setFora] = useState(aberto);
  /** A folha está desdobrada e legível. */
  const [lendo, setLendo] = useState(aberto);

  const [abertura, setAbertura] = useState(aberto ? 1 : 0);
  const abre = useRef(new Animated.Value(aberto ? 1 : 0)).current;

  useEffect(() => {
    const ouvinte = abre.addListener(({ value }) => setAbertura(value));
    return () => abre.removeListener(ouvinte);
  }, [abre]);

  const encenando = useRef(false);
  const desmontou = useRef(false);
  useEffect(() => () => {
    desmontou.current = true;
  }, []);

  useEffect(() => {
    if (!aberto || encenando.current) return;
    setFora(true);
    setLendo(true);
    abre.setValue(1);
  }, [aberto, abre]);

  const solavanco = useRef(new Animated.Value(0)).current;
  /** Um ponto no centro do buraco, só para medir onde ele está na janela. */
  const ancora = useRef<View>(null);

  const abrir = useCallback(() => {
    if (fora) return;
    onDesenterrar();
    if (menosMovimento) {
      abre.setValue(1);
      setFora(true);
      setLendo(true);
      return;
    }

    encenando.current = true;
    passo.setValue(0);
    abre.setValue(0);

    const rodar = (animacao: Animated.CompositeAnimation) =>
      new Promise<boolean>((resolve) => animacao.start(({ finished }) => resolve(finished)));

    const soltar = (etapa: 1 | 2 | 3, fracao: number) => {
      if (!aoCeder) return;
      ancora.current?.measureInWindow((x, y) => {
        aoCeder({
          x,
          y,
          meiaLargura: entreDois(COVA.fechado.meiaLargura, COVA.aberto.meiaLargura, fracao),
          meiaAltura: entreDois(COVA.fechado.meiaAltura, COVA.aberto.meiaAltura, fracao),
          etapa,
        });
      });
    };

    void (async () => {
      const tremeu = await rodar(
        Animated.timing(passo, {
          toValue: 1,
          duration: CAVA + PUXA,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      );
      if (!tremeu || desmontou.current) return;

      for (let i = 0; i < ETAPAS.length; i++) {
        const e = ETAPAS[i];
        soltar((i + 1) as 1 | 2 | 3, e.ate);
        solavanco.setValue(0);
        Animated.timing(solavanco, {
          toValue: 1,
          duration: 260,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();

        const abriu = await rodar(
          Animated.timing(abre, {
            toValue: e.ate,
            duration: e.dura,
            easing: Easing.out(Easing.back(e.passa)),
            useNativeDriver: false,
          }),
        );
        if (!abriu || desmontou.current) return;
        await rodar(Animated.delay(e.pausa));
        if (desmontou.current) return;
      }

      encenando.current = false;
      setFora(true);
      setLendo(true);
      passo.setValue(0);
    })();
  }, [fora, menosMovimento, onDesenterrar, passo, abre, solavanco, aoCeder]);

  /** Onde a terra para de tremer e a folha começa a dar o tranco. */
  const fimDaCava = CAVA / (CAVA + PUXA);

  const tremor = passo.interpolate({
    inputRange: [0, fimDaCava * 0.2, fimDaCava * 0.4, fimDaCava * 0.6, fimDaCava * 0.8, fimDaCava, 1],
    outputRange: [0, -2, 2, -2, 1.2, 0, 0],
  });
  const subida = passo.interpolate({
    inputRange: [0, fimDaCava, entreDois(fimDaCava, 1, 0.4), 1],
    outputRange: [0, 0, -7, 0],
  });
  const balanco = passo.interpolate({
    inputRange: [0, fimDaCava, entreDois(fimDaCava, 1, 0.45), 1],
    outputRange: ['0deg', '0deg', '-4deg', '0deg'],
  });
  const deslocamento = useMemo(
    () =>
      Animated.add(
        tremor,
        solavanco.interpolate({
          inputRange: [0, 0.2, 0.45, 0.7, 1],
          outputRange: [0, -1.6, 1.4, -0.7, 0],
        }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [passo, solavanco],
  );
  const torroes = passo.interpolate({
    inputRange: [0, fimDaCava * 0.35, fimDaCava, 1],
    outputRange: [0, 1, 0, 0],
  });

  const W = entreDois(COVA.fechado.meiaLargura, COVA.aberto.meiaLargura, abertura);
  const H = entreDois(COVA.fechado.meiaAltura, COVA.aberto.meiaAltura, abertura);

  /** A largura útil de dentro do cartão: o canteiro é desenhado nela. */
  const dentro = largura - 36;

  return (
    <View
      style={{
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: TERRA_SOMBRA,
        paddingTop: 26,
        paddingHorizontal: 18,
        paddingBottom: 20,
        gap: 6,
        ...shadows.md,
      }}
    >
      {/*
        A borda de grama: o que diz que isto é um canteiro, e não um retângulo
        marrom. Ela é o único verde do cartão, e fica em cima — é de lá que se
        olha para dentro de um buraco.
      */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: GRAMA }}>
        <Svg width="100%" height="100%" viewBox="0 0 350 18" preserveAspectRatio="none">
          <Path
            d={
              'M0 0 H350 V6 C 340 14 330 4 320 10 C 310 16 300 4 290 9 C 280 15 268 5 258 10 ' +
              'C 246 16 236 4 224 9 C 212 15 200 5 190 10 C 178 16 166 4 156 9 C 144 15 132 5 122 10 ' +
              'C 110 16 98 4 88 9 C 76 15 64 5 54 10 C 42 16 30 4 20 9 C 12 13 6 8 0 10 Z'
            }
            fill={palette.green500}
          />
          <Path d="M0 0 H350 V3 H0 Z" fill={palette.green300} opacity={0.6} />
        </Svg>
      </View>

      {/* As pedrinhas dos cantos de baixo: terra não é uma superfície lisa. */}
      <View style={{ position: 'absolute', left: 12, bottom: 12, opacity: 0.85 }} pointerEvents="none">
        <Svg width={44} height={30} viewBox="0 0 44 30">
          <Ellipse cx={14} cy={22} rx={8} ry={5} fill={TERRA_FUNDA} />
          <Ellipse cx={32} cy={24} rx={5} ry={3.5} fill={TERRA_FUNDA} opacity={0.5} />
        </Svg>
      </View>
      <View style={{ position: 'absolute', right: 14, bottom: 10, opacity: 0.9 }} pointerEvents="none">
        <Svg width={60} height={34} viewBox="0 0 60 34">
          <Ellipse cx={14} cy={26} rx={10} ry={6} fill={TERRA_FUNDA} />
          <Ellipse cx={12} cy={24} rx={4} ry={2} fill="#FFFFFF" opacity={0.12} />
          <Ellipse cx={38} cy={28} rx={7} ry={4.5} fill={TERRA_FUNDA} opacity={0.55} />
          <Ellipse cx={50} cy={22} rx={4} ry={3} fill={TERRA_FUNDA} />
        </Svg>
      </View>

      {/*
        O cabeçalho, e a porta das guardadas ao lado — alvos irmãos.

        ## Por que ele envolve, e por que o título não encolhe

        O título tinha `flex: 1` e o link ao lado tinha o tamanho que tivesse.
        Numa tela de 375 com o link curto isso cabia; com frases guardadas o
        link vira "Guardadas · 12", e numa tela de 320 a conta fecha em 272
        pontos de largura para 244 disponíveis. O título é quem cedia — e
        cedia quebrando no meio: "A frase de" numa linha, "hoje" na outra,
        vinte pontos abaixo, porque a entrelinha de um título de 23 é folgada.
        Medido no navegador a 320, e é o que o Pedro viu no aparelho.

        Agora **o título não encolhe** e a linha envolve: quando os dois não
        cabem juntos, o link desce inteiro para a linha de baixo, encostado à
        direita pelo `marginLeft: 'auto'`. Ninguém se parte no meio.

        ## O `zIndex`, que é o que consertou o corte de verdade

        O Pedro viu o título cortado **embaixo** — o rabo do "j" de "hoje" —, e
        eu culpei a fonte duas vezes antes de medir a coisa certa. Não era a
        fonte.

        O cartão fechado desenha o buraco num bloco de 182 pontos de altura
        dentro de um `Pressable` de 150, centrado, e ainda puxado 22 para cima.
        A conta fecha assim: o bloco **sobe 38 pontos acima do próprio
        `Pressable`**, e o vão até o cabeçalho é de 6. Medido no navegador: o
        título termina em 404,3 e o desenho do canteiro começa em 383,3 —
        **vinte e um pontos de sobreposição**, e ele é irmão posterior, então
        pinta por cima.

        No navegador aquele pedaço do SVG é transparente e ninguém vê. No
        aparelho, cobre. Com o cabeçalho por cima na ordem de pintura, o
        título deixa de ser coberto e o desenho continua exatamente onde está:
        a subida do buraco é escolha de composição, não acidente.

        ## E por que não há `lineHeight` aqui

        Por via das dúvidas, o que aprendi tentando: a entrelinha explícita é a
        cura certa no `react-native-web`, onde a caixa é a do CSS; no Android é
        o contrário — `Text` sem `lineHeight` usa as métricas da fonte **mais**
        o `includeFontPadding`, que é folga de sobra, e um `lineHeight` menor
        que a caixa natural de uma fonte de display corta dos dois lados. Baloo
        2 é alta. Aqui o sistema mede melhor do que eu.
      */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          columnGap: 10,
          rowGap: 2,
          zIndex: 2,
        }}
      >
        <Text
          style={{
            flexShrink: 0,
            fontFamily: fonts.display.bold,
            fontSize: 23,
            color: TEXTO_NA_TERRA,
          }}
        >
          A frase de hoje
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            totalGuardadas > 0
              ? `Ver as ${totalGuardadas} frases guardadas`
              : 'Ver as frases guardadas'
          }
          onPress={onVerGuardadas}
          hitSlop={12}
          style={{ marginLeft: 'auto' }}
        >
          <Text
            style={{
              fontFamily: fonts.body.bold,
              fontSize: 14,
              color: TEXTO_NA_TERRA_FRACO,
              textDecorationLine: 'underline',
            }}
          >
            {totalGuardadas > 0 ? `Guardadas · ${totalGuardadas}` : 'Guardadas'}
          </Text>
        </Pressable>
      </View>

      {lendo ? (
        <FolhaDesdobrada
          texto={texto}
          nomeDoBroto={nomeDoBroto}
          guardada={guardada}
          onGuardar={onGuardar}
          onCompartilhar={onCompartilhar}
          compartilhando={compartilhando}
          aviso={aviso}
          /* Sem encenação quando a tela abre com a frase já desenterrada: a
             pessoa não acabou de puxar nada, está relendo. */
          encena={!aberto || encenando.current}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Desenterrar a frase de hoje"
          onPress={abrir}
          style={({ pressed }) => ({
            height: ALTURA_FECHADA,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <View style={{ width: dentro, height: ALTURA_DO_CANTEIRO, marginTop: -22 }}>
            {/*
              A âncora: um ponto invisível no centro do buraco, só para medir
              onde ele está na janela quando os farelos se soltam.
              `collapsable` falso porque o Android achata `View` sem conteúdo.
            */}
            <View
              ref={ancora}
              {...NAO_ACHATAR}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: dentro * COLUNA_DO_PAPEL,
                top: COVA.cy,
                width: 1,
                height: 1,
              }}
            />

            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: ALTURA_DO_CANTEIRO,
                transform: [{ translateX: deslocamento }],
              }}
            >
              <Svg
                style={{ position: 'absolute' }}
                width="100%"
                height="100%"
                viewBox={`0 0 ${dentro} ${ALTURA_DO_CANTEIRO}`}
              >
                <FundoDoBuraco largura={dentro} id={`${id}f`} W={W} H={H} />
              </Svg>

              <Animated.View
                style={{
                  position: 'absolute',
                  left: dentro * COLUNA_DO_PAPEL - PAPEL.largura / 2,
                  top: TOPO_DO_PAPEL,
                  width: PAPEL.largura,
                  height: PAPEL.altura,
                  transform: fora ? [] : [{ translateY: subida }, { rotate: balanco }],
                }}
              >
                <Papel largura={PAPEL.largura} altura={PAPEL.altura} />
              </Animated.View>

              <Svg
                style={{ position: 'absolute' }}
                width="100%"
                height="100%"
                viewBox={`0 0 ${dentro} ${ALTURA_DO_CANTEIRO}`}
              >
                <Tampa largura={dentro} id={`${id}t`} W={W} H={H} />
              </Svg>

              {!fora &&
                TORROES.map((q, i) => (
                  <Animated.View
                    key={i}
                    style={{
                      position: 'absolute',
                      left: dentro * COLUNA_DO_PAPEL + q.x - q.r,
                      top: COVA.cy - COVA.fechado.meiaAltura - 4,
                      width: q.r * 2,
                      height: q.r * 1.7,
                      borderRadius: q.r,
                      backgroundColor: TERRA_FUNDA,
                      borderWidth: 1.4,
                      borderColor: tracos.contorno,
                      opacity: torroes,
                      transform: [
                        {
                          translateY: torroes.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, q.cai],
                          }),
                        },
                        {
                          translateX: torroes.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, q.anda],
                          }),
                        },
                      ],
                    }}
                  />
                ))}
            </Animated.View>
          </View>
        </Pressable>
      )}

      <Text
        style={{
          fontFamily: fonts.body.regular,
          fontSize: 14,
          lineHeight: 14 * 1.4,
          color: TEXTO_NA_TERRA_FRACO,
          textAlign: 'center',
        }}
      >
        {lendo ? 'Desenterrada hoje. Amanhã vem outra.' : 'Toque no papel para desenterrar.'}
      </Text>
    </View>
  );
}

/**
 * A folha aberta, dentro do canteiro.
 *
 * ## Como ela chega
 *
 * Sobe de dentro do buraco, achatada, e se desdobra. O documento faz isso com
 * `clip-path` animado, recortando um papel amassado que vira retângulo —
 * `clip-path` não anima no React Native, e não há como aproximar o recorte.
 *
 * O que dá para reproduzir é o **gesto**, que é o que se lê: a folha nasce
 * esmagada na horizontal (escala 0,42 por 0,2), sobe, passa um pouco do ponto,
 * endireita e assenta torta um grau e meio. É o mesmo arco do `bt-rise` do
 * documento, que existe lá justamente para o caso sem recorte.
 *
 * A tinta entra **depois**, quando a folha já tem tamanho. Escrita aparecendo
 * numa folha ainda dobrada lê como texto deformado; aparecendo depois, lê como
 * tinta surgindo no papel — que é o que o documento chama de `bt-ink`.
 */
function FolhaDesdobrada({
  texto,
  nomeDoBroto,
  guardada,
  onGuardar,
  onCompartilhar,
  compartilhando,
  aviso,
  encena,
}: {
  texto: string;
  nomeDoBroto: string;
  guardada: boolean;
  onGuardar: () => void;
  onCompartilhar: () => void;
  compartilhando: boolean;
  aviso: string | null;
  encena: boolean;
}) {
  const { colors } = useTema();
  const menosMovimento = useMenosMovimento();
  const sobe = useRef(new Animated.Value(encena && !menosMovimento ? 0 : 1)).current;

  useEffect(() => {
    if (!encena || menosMovimento) {
      sobe.setValue(1);
      return;
    }
    Animated.timing(sobe, {
      toValue: 1,
      duration: 1100,
      easing: Easing.bezier(0.35, 0.7, 0.35, 1),
      useNativeDriver: true,
    }).start();
  }, [encena, menosMovimento, sobe]);

  const escalaX = sobe.interpolate({ inputRange: [0, 0.45, 0.75, 1], outputRange: [0.42, 0.42, 1.03, 1] });
  const escalaY = sobe.interpolate({ inputRange: [0, 0.45, 0.75, 1], outputRange: [0.2, 0.2, 0.35, 1] });
  const andar = sobe.interpolate({ inputRange: [0, 0.4, 0.75, 1], outputRange: [70, -18, -4, 0] });
  const giro = sobe.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 1],
    outputRange: ['-6deg', '5deg', '-3deg', '-1deg', '-1.5deg'],
  });
  const tinta = sobe.interpolate({ inputRange: [0, 0.78, 1], outputRange: [0, 0, 1] });

  return (
    <Animated.View
      style={{
        marginVertical: 18,
        marginHorizontal: 4,
        borderRadius: 8,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        paddingTop: 22,
        paddingHorizontal: 20,
        paddingBottom: 18,
        gap: 16,
        transform: [
          { translateY: andar },
          { scaleX: escalaX },
          { scaleY: escalaY },
          { rotate: giro },
        ],
      }}
    >
      <GraoDePapel />

      <Animated.Text
        style={{
          opacity: tinta,
          fontFamily: fonts.display.bold,
          fontSize: 23,
          lineHeight: 23 * 1.3,
          color: colors.textPrimary,
        }}
      >
        {entreAspas(texto)}
      </Animated.Text>

      <Animated.View
        style={{ opacity: tinta, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: fonts.body.bold,
            fontSize: 13,
            color: colors.textSecondary,
          }}
        >
          de {nomeDoBroto}, para você
        </Text>

        <Quadrado
          icone="compartilhar"
          rotulo="Compartilhar esta frase como imagem"
          cor={colors.textPrimary}
          desabilitado={compartilhando}
          onPress={onCompartilhar}
        />
        <Quadrado
          icone="heart"
          rotulo={guardada ? 'Tirar das guardadas' : 'Guardar esta frase'}
          selecionado={guardada}
          /*
            O coração cheio é o terracota de *perigo*, que é o tom em que este
            app escreve afeto — a mesma cor do coração do jardim. Vazio, ele é a
            tinta do texto, para não parecer desligado.
          */
          cor={guardada ? colors.danger : colors.textPrimary}
          onPress={onGuardar}
        />
      </Animated.View>

      {!!aviso && (
        <Animated.Text
          accessibilityLiveRegion="polite"
          style={{
            opacity: tinta,
            fontFamily: fonts.body.regular,
            fontSize: 13,
            lineHeight: 13 * 1.45,
            color: colors.textSecondary,
          }}
        >
          {aviso}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

/** Um dos dois botões quadrados do pé da folha: 40 por 40, contorno fino. */
function Quadrado({
  icone,
  rotulo,
  cor,
  onPress,
  selecionado = false,
  desabilitado = false,
}: {
  icone: 'heart' | 'compartilhar';
  rotulo: string;
  cor: string;
  onPress: () => void;
  selecionado?: boolean;
  desabilitado?: boolean;
}) {
  const { colors } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ selected: selecionado, disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed || desabilitado ? 0.6 : 1,
      })}
    >
      <Icon name={icone} color={cor} size={20} />
    </Pressable>
  );
}

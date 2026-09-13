import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, useTema } from '../../theme';
import { BrotinhoMark, MARK_DISCO } from '../brand/BrotinhoMark';
import { Icon, type IconName } from '../core/Icon';

export type TabKey = 'home' | 'broto' | 'perfil';

/** Quanto o botão do meio sobe acima da faixa. */
const RAISE = 22;

/**
 * A altura que o botão central ocupa **acima** da barra.
 *
 * Exportada porque uma tela com barra de ação no rodapé precisa saber que há
 * um disco de 64 pontos pairando ali — hoje só a Composta.
 */
export const ALTURA_ERGUIDA = RAISE;

/**
 * O arredondamento do topo da barra — 28, do documento.
 *
 * Ele só faz sentido agora. Enquanto a barra reservava espaço no layout, o
 * canto arredondado não tinha o que revelar: atrás dele havia a mesma faixa
 * lisa da cor do fundo, e curvar um retângulo contra outro retângulo da mesma
 * cor não desenha nada. Com a tela passando por trás, o canto passa a mostrar
 * o conteúdo — que é o que faz a barra ler como um painel apoiado sobre a
 * página em vez de uma tarja colada na base.
 *
 * O documento arredonda também os cantos de baixo, em 44. Aquilo é o canto do
 * aparelho no mockup, não da barra: no celular ela encosta na borda da tela, e
 * arredondar ali abriria dois buracos de fundo nos cantos inferiores.
 */
const RAIO_DO_TOPO = 28;

/** O fio do documento: recuado 40 de cada lado, e não uma borda de ponta a ponta. */
const RECUO_DO_FIO = 40;
const CENTER_SIZE = 64;

type SideTab = { key: Exclude<TabKey, 'home'>; label: string; icon: IconName };

/**
 * A aba da esquerda era o Diário e passou a ser o broto.
 *
 * O Diário não perdeu nada: ele é o primeiro cartão do carrossel da tela
 * inicial, que abre no lugar onde a barra abria. O que ele não era é uma
 * *seção* — entrar no diário é fazer uma coisa, e coisas de fazer agora moram
 * juntas agora. O broto, sim, é um lugar: é onde ela está, com o humor, o
 * jardim e o que o app percebeu.
 *
 * O broto em vez da marca: a marca já é o botão do meio, e duas marcas na
 * mesma barra não dizem qual é qual. Ver o desenho em `Icon`.
 */
const LEFT: SideTab = { key: 'broto', label: 'Brotinho', icon: 'broto' };
const RIGHT: SideTab = { key: 'perfil', label: 'Perfil', icon: 'user' };

type Props = {
  active?: TabKey;
  onChange?: (tab: TabKey) => void;
};

/**
 * As três animações da barra, e por que elas existem.
 *
 * Trocar de aba era instantâneo e mudo: o ícone mudava de cor e pronto. Num app
 * cujo personagem é uma planta, a barra é o único lugar que se toca em toda
 * sessão — e era o mais parado de todos.
 *
 * Cada uma diz uma coisa diferente sobre o destino:
 *
 * - **Brotinho** balança ao vento quando a aba abre. Ele é uma planta; planta
 *   responde ao ar. O giro sai do pé do caule (`transformOrigin`), e não do
 *   meio do ícone, senão o desenho inteiro gira como uma peça de relógio em vez
 *   de vergar como um talo.
 * - **Início** enche como um copo de água. O disco fica num verde apagado com a
 *   aba fechada, e ao abrir o verde cheio **sobe** por dentro dele, com a
 *   superfície ondulando de um lado para o outro. É a única das três que muda o
 *   estado de repouso, e por isso a única que não precisa que ninguém esteja
 *   olhando na hora.
 * - **Perfil** dá um tranco curto **ao toque**, não ao abrir: não há nada de
 *   vivo naquele ícone para justificar movimento contínuo, e o que ele confirma
 *   é o toque.
 *
 * ## Movimento reduzido
 *
 * Nenhuma delas roda para quem pediu menos movimento no sistema. A troca de cor
 * continua acontecendo — ela é informação, não enfeite —, só que de uma vez.
 */

/** O quanto o broto verga, em graus, no pico da balançada. */
const VENTO = 7;
/** O tranco do perfil é mais curto e mais rápido: é resposta a toque. */
const TRANCO = 9;

/**
 * A crista da água, e por que ela é um quadrado girando.
 *
 * A superfície precisava ondular de um lado para o outro enquanto sobe, e não
 * subir como uma régua. Desenhar uma senoide em SVG e animar o `d` do caminho
 * resolveria — e sairia do driver nativo, recalculando o traçado a cada quadro
 * no JavaScript, no botão que a pessoa mais toca no app.
 *
 * O que faz o mesmo de graça é um **quadrado de cantos muito arredondados**
 * girando devagar, com o centro exatamente na linha da água. Ele não é um
 * círculo: a distância do centro até a borda varia conforme o giro, mais longa
 * na diagonal e mais curta no meio do lado. Girando, essa diferença passa pela
 * superfície como uma crista que vai de um lado ao outro — e é só `rotate`, que
 * roda no driver nativo.
 *
 * São duas, em tamanhos e sentidos diferentes, porque uma sozinha bate sempre
 * no mesmo ritmo e o olho percebe o compasso. Duas em desacordo não fecham
 * ciclo à vista.
 */
const ONDA = { lado: 1.8, canto: 0.32, giro: 2600, sentido: 1 };
const ONDA_DE_TRAS = { lado: 1.7, canto: 0.26, giro: 3500, sentido: -1 };

/**
 * Onde encostar a crista para ela ondular **em volta** da linha da água.
 *
 * A primeira tentativa pôs o centro do quadrado na linha — e o quadrado tem
 * mais de cinquenta pontos de raio num botão de sessenta e quatro: ele cobria o
 * disco inteiro, cheio ou vazio, e a animação virou um círculo verde liso.
 *
 * O que precisa encostar na linha é a **borda de cima**, não o centro. Num
 * quadrado de lado `L` com canto `r`, a distância do centro à borda vai de
 * `L/2` no meio do lado até `(L/2 - r)·√2 + r` na diagonal; a diferença entre as
 * duas é a altura da onda. Baixando a caixa por metade dessa diferença, a
 * superfície passa a oscilar metade para cima e metade para baixo da linha, que
 * é o que faz a água parecer balançar em vez de subir e descer inteira.
 */
function ondaEncostada(lado: number, canto: number) {
  const meio = lado / 2;
  const raio = lado * canto;
  const naDiagonal = (meio - raio) * Math.SQRT2 + raio;
  return (naDiagonal - meio) / 2;
}

/**
 * Um vai-e-vem que morre no zero, no ritmo de folha ao vento.
 *
 * O valor anda de 1 a -1 e volta; quantos graus isso vira é decisão de quem
 * desenha, não daqui. Assim o mesmo movimento serve para o broto vergando sete
 * graus e para o tranco de nove do perfil.
 */
function balancar(valor: Animated.Value, duracao: number) {
  valor.setValue(0);
  Animated.sequence([
    Animated.timing(valor, { toValue: 1, duration: duracao * 0.3, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    Animated.timing(valor, { toValue: -1, duration: duracao * 0.34, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    Animated.timing(valor, { toValue: 0.45, duration: duracao * 0.22, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    Animated.timing(valor, { toValue: 0, duration: duracao * 0.14, easing: Easing.out(Easing.quad), useNativeDriver: true }),
  ]).start();
}

/**
 * BottomNav — três destinos, só ícones.
 *
 * Sem rótulos, o único sinal de qual aba está aberta é a cor; por isso os
 * `accessibilityLabel` são obrigatórios, senão quem usa leitor de tela fica
 * sem nada para ouvir.
 */
export function BottomNav({ active = 'home', onChange }: Props) {
  const { colors, palette, shadows } = useTema();
  const insets = useSafeAreaInsets();

  const [menosMovimento, setMenosMovimento] = useState(false);
  useEffect(() => {
    let vivo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((r) => vivo && setMenosMovimento(r));
    const ouvinte = AccessibilityInfo.addEventListener('reduceMotionChanged', setMenosMovimento);
    return () => {
      vivo = false;
      ouvinte.remove();
    };
  }, []);

  /** Um valor por ícone que se mexe: -1 a 1, convertido em graus abaixo. */
  const vento = useRef(new Animated.Value(0)).current;
  const tranco = useRef(new Animated.Value(0)).current;
  /**
   * O nível da água, em pontos a partir do topo do disco.
   *
   * `CENTER_SIZE` é o copo vazio — a água inteira abaixo da borda de baixo — e
   * `0` é o copo cheio. Fica em pontos, e não de 0 a 1, porque quem anima é um
   * `translateY`: o disco verde é uma peça do tamanho do botão que **sobe**, e
   * o arredondamento do botão a recorta em círculo no caminho.
   */
  const nivel = useRef(new Animated.Value(active === 'home' ? 0 : CENTER_SIZE)).current;

  /*
    O broto balança quando a aba **passa a ser** a dele, e não a cada
    renderização: sem esta guarda, qualquer mudança de estado do app faria a
    folha tremer sozinha no canto da tela.
  */
  useEffect(() => {
    if (active !== 'broto' || menosMovimento) return;
    balancar(vento, 900);
  }, [active, menosMovimento, vento]);

  /**
   * O giro de cada crista. Só rodam enquanto a água está se mexendo.
   *
   * São dois valores, e não um com sinal trocado, porque as duas precisam de
   * **velocidades** diferentes. Com o mesmo valor elas fechariam ciclo juntas a
   * cada volta, e a superfície repetiria o mesmo desenho de dois em dois
   * segundos e meio — que é justamente o compasso que o olho pega.
   */
  const marola = useRef(new Animated.Value(0)).current;
  const marolaDeTras = useRef(new Animated.Value(0)).current;

  /*
    A água sobe devagar e para sem repique — é líquido entrando num copo, não
    um elemento chegando na tela.

    `inOut(cubic)` em 1100ms: com curva de mola ela saía pela borda de cima e
    voltava, que é coisa de bolha. E devagar porque a onda precisa de tempo para
    atravessar a superfície — enchendo em meio segundo, a crista mal saía de um
    lado. Esvaziar continua rápido: ninguém fica olhando a aba que fechou.

    A marola gira em laço **junto** com a subida e para quando ela acaba. Deixar
    girando para sempre custaria um quadro por quadro a vida inteira do app para
    desenhar uma onda que, com o copo cheio, está inteira fora do recorte.
  */
  useEffect(() => {
    const cheio = active === 'home';
    if (menosMovimento) return nivel.setValue(cheio ? 0 : CENTER_SIZE);

    const lacos = [
      [marola, ONDA.giro] as const,
      [marolaDeTras, ONDA_DE_TRAS.giro] as const,
    ].map(([valor, duracao]) => {
      valor.setValue(0);
      return Animated.loop(
        Animated.timing(valor, {
          toValue: 1,
          duration: duracao,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
    });
    lacos.forEach((l) => l.start());
    const pararMarola = () => lacos.forEach((l) => l.stop());

    const subida = Animated.timing(nivel, {
      toValue: cheio ? 0 : CENTER_SIZE,
      duration: cheio ? 1100 : 320,
      easing: cheio ? Easing.inOut(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    subida.start(pararMarola);

    return () => {
      subida.stop();
      pararMarola();
    };
  }, [active, menosMovimento, nivel, marola, marolaDeTras]);

  const giro = (valor: Animated.Value, graus: number) =>
    valor.interpolate({ inputRange: [-1, 1], outputRange: [`-${graus}deg`, `${graus}deg`] });

  const lateral = (t: SideTab) => {
    const ativa = active === t.key;
    const doBroto = t.key === 'broto';
    return (
      <Pressable
        key={t.key}
        accessibilityRole="tab"
        accessibilityLabel={t.label}
        accessibilityState={{ selected: ativa }}
        onPress={() => {
          /* O perfil responde ao toque, inclusive quando já está aberto: é
             confirmação do gesto, não anúncio de destino novo. */
          if (!doBroto && !menosMovimento) balancar(tranco, 420);
          onChange?.(t.key);
        }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48, gap: 3 }}
      >
        <Animated.View
          style={{
            /* O broto verga a partir do pé do caule; o perfil gira no meio,
               que é onde fica o pescoço do bonequinho. */
            transformOrigin: doBroto ? 'bottom center' : 'center',
            transform: [{ rotate: giro(doBroto ? vento : tranco, doBroto ? VENTO : TRANCO) }],
          }}
        >
          <Icon
            name={t.icon}
            size={26}
            color={ativa ? colors.primaryStrong : colors.textSecondary}
            strokeWidth={ativa ? 2.4 : 2}
          />
        </Animated.View>
        {/*
          O rótulo é visível, e não só para o leitor de tela.

          Os três ícones viviam sozinhos, e o nome de cada aba existia apenas em
          `accessibilityLabel`. Ícone sem rótulo obriga a adivinhar, e adivinhar
          é caro justamente para quem abre o app mal — a literatura de design
          para pessoas em sofrimento lista isso entre os atritos que mais pesam.
          Catorze pixels de altura resolvem.
        */}
        <Text
          style={{
            fontFamily: ativa ? fonts.body.bold : fonts.body.regular,
            fontSize: 11,
            color: ativa ? colors.primaryStrong : colors.textSecondary,
          }}
        >
          {t.label}
        </Text>
      </Pressable>
    );
  };

  return (
    /*
      A barra paira sobre a tela; não empurra uma faixa na frente dela.

      O espaço de cima é transparente e existe para o botão central subir sem
      sair dos limites do pai — no Android o que vaza pode ser cortado. Só que
      ele também era **reservado no layout**: a tela terminava 22 pontos acima
      da barra, e esses 22 pontos viravam uma faixa lisa da cor do fundo,
      cobrindo o que a tela tinha ali e passando por trás da metade de cima do
      broto. Era o que se via na tela inicial: os chips de palavra cortados,
      uma tira bege, e só então a barra.

      A margem negativa devolve esse espaço à tela: a barra continua ocupando
      no layout só a altura dela mesma, e a parte erguida passa a ficar **por
      cima** do conteúdo, não na frente de um vazio. `box-none` é o que
      completa a ideia — sem ele a tira invisível continuaria engolindo o
      toque de quem mira no que está atrás dela.
    */
    <View
      /*
        `box-none` fica na prop, e é o único lugar do app onde ela continua.

        O React Native depreciou a prop em favor do estilo, e as outras doze
        camadas do app migraram. Estas duas não podem: o `react-native-web`
        **descarta** `box-none` quando ele vem pelo estilo — medido, o
        `pointer-events` computado volta a ser `auto`. E `auto` aqui é o defeito
        que a tira erguida tinha antes de existir: ela engole o toque de quem
        mira no conteúdo atrás dela.

        No aparelho o estilo funcionaria. Só que o app também roda na web, e
        trocar comportamento de toque por causa de um aviso de depreciação é
        pagar caro por arrumação.
      */
      pointerEvents="box-none"
      style={{ marginTop: -RAISE, paddingTop: RAISE, zIndex: 2 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 10,
          paddingBottom: 10 + insets.bottom,
          backgroundColor: colors.surface,
          borderTopLeftRadius: RAIO_DO_TOPO,
          borderTopRightRadius: RAIO_DO_TOPO,
          ...shadows.barra,
        }}
      >
        {/*
          O fio, no lugar da borda que ia de ponta a ponta.

          Uma borda de ponta a ponta num painel de canto arredondado acompanha a
          curva e morre na quina, apontando para o canto em vez de separar a
          barra do que está atrás. O documento troca por um fio de 1,5 recuado
          40 de cada lado: ele fica inteiro na parte reta do topo, e quem separa
          o painel da página é a sombra.
        */}
        <View
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            left: RECUO_DO_FIO,
            right: RECUO_DO_FIO,
            height: 1.5,
            borderRadius: 1,
            backgroundColor: palette.brown100,
          }}
        />

        {lateral(LEFT)}
        {/*
          Lugar reservado para o botão central, que é posicionado por cima.

          O rótulo dele mora aqui, e não no botão: o botão sobe para fora da
          barra, e um texto preso nele subiria junto, descolado dos outros dois.
          O espaçador de 26 é a altura do ícone das laterais, para as três
          palavras ficarem na mesma linha.
        */}
        <View style={{ width: CENTER_SIZE, alignItems: 'center', gap: 3 }}>
          <View style={{ height: 26 }} />
          <Text
            style={{
              fontFamily: active === 'home' ? fonts.body.bold : fonts.body.regular,
              fontSize: 11,
              color: active === 'home' ? colors.primaryStrong : colors.textSecondary,
            }}
          >
            Início
          </Text>
        </View>
        {lateral(RIGHT)}
      </View>

      {/* `box-none` pela prop, pelo mesmo motivo da camada de cima. Esta faixa
          atravessa a largura toda: com `auto`, ela engoliria o toque nos
          rótulos das duas abas laterais. */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}
      >
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Início"
          accessibilityState={{ selected: active === 'home' }}
          onPress={() => onChange?.('home')}
          style={({ pressed }) => ({
            width: CENTER_SIZE,
            height: CENTER_SIZE,
            borderRadius: CENTER_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            /*
              O copo vazio: o verde mais claro que o tema tem.

              A primeira tentativa recuava o disco com opacidade, e o pêssego
              lavado no creme do fundo lia como botão desligado. A segunda usou
              `green300`, que continuava cheio demais para parecer vazio. O que
              faz a água aparecer é o contraste entre o copo e o líquido: com o
              tom suave do tema atrás e o verde cheio subindo por cima, o
              movimento é a própria diferença entre os dois.
            */
            backgroundColor: colors.primarySoft,
            overflow: 'hidden',
            transform: [{ scale: pressed ? 0.94 : 1 }],
            ...shadows.md,
          })}
        >
          {/*
            A marca do copo vazio, no verde forte para ser legível no tom claro.
            Ela fica embaixo; a água sobe por cima dela com a sua própria cópia.
          */}
          <View style={{ position: 'absolute', zIndex: 0 }}>
            <BrotinhoMark size={CENTER_SIZE} disco={null} traco={colors.primaryStrong} />
          </View>

          {/*
            A água, e o truque que a faz parecer água.

            São duas camadas. A de fora é uma peça do tamanho do botão que sobe
            de baixo para cima — e o `overflow: 'hidden'` do botão, que é
            redondo, recorta ela em círculo: o que aparece é uma linha de nível
            subindo dentro de um copo, e não um retângulo entrando na tela.

            A de dentro **desce na mesma medida**. Sem isso, a marca clara subiria
            junto com a água como se estivesse boiando. Descendo o mesmo tanto,
            ela fica parada no lugar e vai sendo *revelada* conforme o nível
            passa por ela — que é exatamente o que acontece com um desenho no
            fundo de um copo que se enche.
          */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: CENTER_SIZE,
              height: CENTER_SIZE,
              overflow: 'hidden',
              /* Acima das cristas: elas são maiores que o botão e, sem ordem
                 declarada, cobriam a marca inteira. */
              zIndex: 2,
              transform: [{ translateY: nivel }],
            }}
          >
            <Animated.View
              style={{
                width: CENTER_SIZE,
                height: CENTER_SIZE,
                backgroundColor: MARK_DISCO,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ translateY: Animated.multiply(nivel, -1) }],
              }}
            >
              <BrotinhoMark size={CENTER_SIZE} disco={null} />
            </Animated.View>
          </Animated.View>

          {/*
            As cristas, na linha da água.

            Elas acompanham o nível e só somam para cima: a metade de baixo de
            cada uma cai dentro da água, que é da mesma cor, e some. O que se vê
            é a superfície inchando de um lado e do outro conforme elas giram.

            Somem com o copo vazio. Sem isso, no repouso da aba fechada sobraria
            um fio verde encostado na borda de baixo do disco — a crista de uma
            água que não existe.
          */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: CENTER_SIZE,
              height: CENTER_SIZE,
              zIndex: 1,
              opacity: nivel.interpolate({
                inputRange: [0, CENTER_SIZE * 0.88, CENTER_SIZE],
                outputRange: [1, 1, 0],
              }),
              transform: [{ translateY: nivel }],
            }}
          >
            {[
              [ONDA_DE_TRAS, marolaDeTras] as const,
              [ONDA, marola] as const,
            ].map(([onda, giro]) => {
              const lado = CENTER_SIZE * onda.lado;
              return (
                <Animated.View
                  key={onda.giro}
                  style={{
                    position: 'absolute',
                    top: ondaEncostada(lado, onda.canto),
                    left: (CENTER_SIZE - lado) / 2,
                    width: lado,
                    height: lado,
                    borderRadius: lado * onda.canto,
                    backgroundColor: MARK_DISCO,
                    /* Uma gira para cada lado: em desacordo elas não fecham
                       ciclo à vista. */
                    transform: [
                      {
                        rotate: giro.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', `${onda.sentido * 360}deg`],
                        }),
                      },
                    ],
                  }}
                />
              );
            })}
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

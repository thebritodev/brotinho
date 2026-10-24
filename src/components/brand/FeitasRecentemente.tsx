import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { findPractice } from '../../data/practices';
import type { FeitaRecentemente, PraticaVisitada } from '../../state/derived';
import { fonts, radius, useTema } from '../../theme';
import { Sprout, type Pose, type SproutStage } from './Sprout';
import { caixaDoMascote, LARGURA_DE_REFERENCIA } from './geometriaDoBroto';
import { FolhaDoSelo } from './folhaDoSelo';

/** O cartão, do documento: 176 por 124. */
const LARGURA = 176;
const ALTURA = 124;

/** O broto no canto, do documento: 66 por 80, a 8 pontos de cada borda. */
const BROTO = { largura: 66, altura: 80, margem: 8 };

/**
 * O `size` que faz o broto **preencher** o canto, em qualquer estágio.
 *
 * O mascote tem escala fixa — `size / 200` unidades por pixel, ver
 * `medidasDoMascote` —, para ter o mesmo tamanho em todas as telas. Aqui isso
 * era o defeito: com `size` 66, um broto no estágio 1, que é o de quem acabou
 * de instalar, ocupava uma fração do canto e lia como um pontinho. Justo
 * na seção "Para começar", que só aparece para essa pessoa.
 *
 * O canto é um espaço fixo, e o broto ali é ilustração do cartão, não o
 * mascote da tela: ele cresce até encostar no lado que limitar primeiro.
 */
function tamanhoQuePreenche(estagio: SproutStage) {
  const caixa = caixaDoMascote(estagio, false);
  return Math.min(BROTO.largura / caixa.largura, BROTO.altura / caixa.altura) * LARGURA_DE_REFERENCIA;
}

/**
 * "hoje", "ontem", "há 4 dias" — a data sem número quando dá.
 *
 * Número de dias é informação exata e inútil: ninguém precisa saber que foram
 * quatro, precisa saber se foi *há pouco*. As palavras param de ser exatas
 * exatamente onde deixam de importar, e viram "semana passada".
 */
function quandoFoi(quando: number, agora = Date.now()): string {
  const dia = 24 * 60 * 60 * 1000;
  const inicio = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const dias = Math.round((inicio(agora) - inicio(quando)) / dia);
  if (dias <= 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  if (dias < 7) return `Há ${dias} dias`;
  if (dias < 14) return 'Semana passada';
  return `Há ${Math.floor(dias / 7)} semanas`;
}

/**
 * "4 minutos" vira "4 min".
 *
 * A legenda do cartão tem noventa pontos e divide a linha com a folhinha. Por
 * extenso, ela quebra em duas linhas e a segunda cai em cima do morrinho. O
 * catálogo guarda a forma longa porque é ela que aparece na tela da prática,
 * onde há espaço — encurtar lá seria piorar o lugar que está certo.
 */
const curta = (duracao: string) => duracao.replace(/\s*minutos?$/, ' min');

/** Como cada item se apresenta: título, legenda, tom e pose do broto. */
type Cartao = {
  chave: string;
  titulo: string;
  legenda: string;
  tom: string;
  pose: Pose;
  onPress: () => void;
};

type Props = {
  itens: FeitaRecentemente[];
  /** As de estreia, para quem ainda não fez nada. Ver `PARA_COMECAR`. */
  estreia: PraticaVisitada[];
  estagio: SproutStage;
  /** A margem lateral da tela: a fileira sangra para fora dela. */
  margem: number;
  onAbrirPratica: (item: PraticaVisitada) => void;
  onAbrirDiario: () => void;
  onAbrirComposta: () => void;
};

/**
 * A fileira do que foi feito — práticas, diários e compostas, juntos.
 *
 * ## O que ela responde
 *
 * "Por onde eu andei." É a única parte da tela inicial que olha para trás com
 * nome e data, e o caminho de volta mais curto que existe no app: um toque da
 * tela que abre até a prática exata em que a pessoa estava.
 *
 * ## Por que o broto, e não a arte do tema
 *
 * Porque a pergunta aqui não é "de que assunto é isto" — é "o que eu fiz". A
 * arte de objeto da grade responde a primeira; o broto no vaso responde a
 * segunda, porque é ele quem guia toda prática. Um coração grande no cartão da
 * prática de ansiedade responderia uma pergunta que ninguém fez. Esse caminho
 * já foi tentado duas vezes, com a cena de paisagem e com o objeto, e as duas
 * voltaram atrás.
 *
 * ## Sem histórico ela não some
 *
 * Troca de assunto: as mesmas vagas, preenchidas com práticas de estreia, e o
 * título muda lá na tela. Uma seção que desaparece na primeira semana é uma
 * seção que a maioria das pessoas nunca descobre que existe.
 *
 * Nos cartões de estreia a legenda não mente: sem data, ela diz **quanto
 * leva** — que é a pergunta de quem nunca entrou.
 *
 * ## O brilho e o morrinho
 *
 * Um clarão branco no canto de cima e um morro translúcido no pé. São do
 * documento, e são o que faz um retângulo pastel virar um pedaço de paisagem
 * sem desenhar paisagem nenhuma: luz vindo de cima, chão embaixo, e o broto
 * plantado entre as duas coisas.
 */
export function FeitasRecentemente({
  itens,
  estreia,
  estagio,
  margem,
  onAbrirPratica,
  onAbrirDiario,
  onAbrirComposta,
}: Props) {
  const { colors, palette, shadows, tintsDosTemas, tema } = useTema();
  /*
    O clarão e o morrinho são branco translúcido: luz sobre pastel claro, e
    disco cinza sobre o mesmo pastel escurecido. Os dois pares de números são
    os do documento, que troca `--bt-glow2` e `--bt-hill` no tema escuro.
  */
  const claro = tema === 'claro';
  const vidro = { brilho: claro ? 0.35 : 0.12, morro: claro ? 0.5 : 0.07 };

  const tomDoTema = (chave: string) =>
    (tintsDosTemas as Record<string, string | undefined>)[chave] ?? colors.primarySoft;

  const cartoes: Cartao[] = itens.length
    ? itens.map((item, i): Cartao => {
        if (item.tipo === 'diario') {
          return {
            chave: `d${item.quando}`,
            titulo: 'Diário',
            legenda: `${quandoFoi(item.quando)} · ${item.linhas} ${
              item.linhas === 1 ? 'linha' : 'linhas'
            }`,
            tom: palette.amber100,
            pose: 'pensa',
            onPress: onAbrirDiario,
          };
        }
        if (item.tipo === 'composta') {
          return {
            chave: `c${item.quando}`,
            titulo: 'Composta',
            legenda: `${quandoFoi(item.quando)} · 1 pensamento`,
            tom: palette.green100,
            pose: 'espreguica',
            onPress: onAbrirComposta,
          };
        }
        const p = findPractice(item.topico, item.pratica);
        return {
          chave: `p${item.topico}${item.pratica}${item.quando}`,
          titulo: p?.title ?? 'Prática',
          legenda: `${quandoFoi(item.quando)}${p ? ` · ${curta(p.duration)}` : ''}`,
          tom: tomDoTema(item.topico),
          /* As poses se alternam para a fileira não virar quatro retratos
             idênticos lado a lado. Ver `POSES`. */
          pose: (['calmo', 'parado', 'pensa'] as const)[i % 3],
          onPress: () => onAbrirPratica({ topico: item.topico, pratica: item.pratica }),
        };
      })
    : estreia.map((item, i): Cartao => {
        const p = findPractice(item.topico, item.pratica);
        return {
          chave: `e${item.topico}${item.pratica}`,
          titulo: p?.title ?? 'Prática',
          legenda: p ? curta(p.duration) : '',
          tom: tomDoTema(item.topico),
          pose: (['calmo', 'parado', 'pensa'] as const)[i % 3],
          onPress: () => onAbrirPratica(item),
        };
      });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      /*
        A fileira sangra para fora das margens da tela: o primeiro cartão
        começa alinhado com o texto, e o último some pela borda em vez de parar
        contra ela. Uma fileira que começa e termina dentro da margem parece uma
        lista completa, e esta quase nunca é.
      */
      style={{ marginHorizontal: -margem }}
      contentContainerStyle={{ paddingHorizontal: margem, gap: 12, paddingVertical: 4 }}
    >
      {cartoes.map((c) => (
        <Pressable
          key={c.chave}
          accessibilityRole="button"
          accessibilityLabel={`${c.titulo}, ${c.legenda}`}
          onPress={c.onPress}
          style={({ pressed }) => ({
            width: LARGURA,
            height: ALTURA,
            borderRadius: radius.lg,
            backgroundColor: c.tom,
            overflow: 'hidden',
            paddingTop: 14,
            paddingHorizontal: 14,
            paddingBottom: 12,
            justifyContent: 'space-between',
            transform: [{ scale: pressed ? 0.97 : 1 }],
            ...shadows.sm,
          })}
        >
          {/* O clarão do canto: a luz que vem do mesmo lado em toda a tela. */}
          <View style={{ position: 'absolute', right: -18, top: -18 }} pointerEvents="none">
            <Svg width={90} height={90} viewBox="0 0 90 90">
              <Circle cx={45} cy={45} r={45} fill="#FFFFFF" opacity={vidro.brilho} />
            </Svg>
          </View>

          {/*
            O morrinho do pé: um chão para o broto, feito com raio de canto em
            vez de desenho. `borderTopLeftRadius` grande numa faixa de 30 dá a
            mesma curva do documento sem um SVG a mais por cartão — e são
            quatro cartões numa fileira que rola.
          */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: -10,
              right: -10,
              bottom: 0,
              height: 30,
              backgroundColor: '#FFFFFF',
              opacity: vidro.morro,
              borderTopLeftRadius: 60,
              borderTopRightRadius: 60,
            }}
          />

          <Text
            numberOfLines={2}
            style={{
              maxWidth: 98,
              fontFamily: fonts.body.extraBold,
              fontSize: 15,
              lineHeight: 15 * 1.25,
              color: colors.textPrimary,
            }}
          >
            {c.titulo}
          </Text>

          <View
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5, maxWidth: 96 }}
          >
            <View style={{ marginTop: 2 }}>
              <FolhaDoSelo size={14} cor={palette.green500} />
            </View>
            <Text
              numberOfLines={2}
              style={{
                flex: 1,
                fontFamily: fonts.body.extraBold,
                fontSize: 12.5,
                lineHeight: 12.5 * 1.3,
                color: palette.brown700,
              }}
            >
              {c.legenda}
            </Text>
          </View>

          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: BROTO.margem,
              bottom: BROTO.margem,
              width: BROTO.largura,
              height: BROTO.altura,
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <Sprout mood="leve" stage={estagio} size={tamanhoQuePreenche(estagio)} pose={c.pose} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

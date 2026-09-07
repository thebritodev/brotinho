import React, { useId } from 'react';
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { entreAspas } from '../../data/conselhos';
import { fonts } from '../../theme';
import { corpoDaFrase, linhasDaFrase } from './quebraDeLinha';
import { graosDoCard, MANCHAS } from './texturaDoCard';

/**
 * A frase virada em imagem, para o story.
 *
 * ## Por que este é o único conteúdo do app que pode sair do aparelho
 *
 * Porque **não é da pessoa**. O diário não sai, a Composta não sai, o humor não
 * sai — está na política de privacidade e na ficha da loja, e vale. A frase é
 * do app, escrita antes de qualquer pessoa instalar. É o único material que dá
 * para compartilhar sem furar a promessa central.
 *
 * O que ela revela é outra coisa, e é escolha de quem posta: quem publica "não
 * acredite em tudo que a sua ansiedade te conta" está contando algo sobre o
 * próprio dia. Por isso compartilhar nunca é o botão mais gritante da tela, e
 * nunca é sugerido — é oferecido.
 *
 * ## Por que é um SVG, e não componentes fotografados
 *
 * A primeira versão montava o card com `View` e `Text` de verdade e tirava uma
 * foto com o `react-native-view-shot`. Ganhava a quebra de linha automática e
 * perdia no que decidiu: **dependia de um módulo nativo novo** que, mesmo
 * presente no APK e autolinkado, não era encontrado em execução. O
 * `react-native-svg` já está em todos os binários do app desde o começo e
 * exporta PNG sozinho. Ver `services/compartilharFrase.ts`.
 *
 * ## A regra que manda neste arquivo: nada assíncrono
 *
 * A foto sai **um quadro depois** da montagem. Qualquer coisa que precise
 * carregar — um PNG, uma fonte remota, uma imagem de textura — chega tarde e
 * sai um buraco no lugar. Foi exatamente o que aconteceu com o logo enquanto
 * ele era um `<Image>`: sumia do card e ninguém sabia por quê.
 *
 * Por isso a textura é calculada (`texturaDoCard`) em vez de vir de um
 * arquivo, e por isso o rodapé é texto e não uma imagem do logo. Tudo é
 * desenhado no mesmo quadro, sempre.
 *
 * ## O que há no fundo, e por que
 *
 * Um retângulo de cor chapada denuncia que a imagem foi gerada — é o que
 * qualquer app cospe. O que faz alguém querer postar é a imagem parecer
 * **impressa em alguma coisa**. Daí as quatro camadas antes do texto:
 *
 * 1. **Manchas** largas e quase invisíveis: papel não tem a mesma cor na folha
 *    inteira, e é a luz variando que separa fundo de retângulo pintado.
 * 2. **Grão**: cento e oitenta pontos que somem um a um e aparecem juntos.
 * 3. **Vinheta**: as bordas fecham de leve, e o olho cai no meio sozinho.
 * 4. **Fio interno**: uma linha fina recuada, que faz o conjunto ler como
 *    cartaz composto e não como captura de tela.
 *
 * ## O tamanho e as cores
 *
 * 1080 × 1920 é o story do Instagram. O fundo é o verde da marca, não o
 * terracota do ícone, por contraste: creme sobre terracota dá 2,5:1 — ilegível
 * em miniatura, que é como a maioria das pessoas vai ver isto. Sobre o verde
 * escuro dá 9:1. O terracota entra do mesmo jeito, no ícone lá embaixo, onde é
 * um detalhe e não o fundo do texto.
 *
 * Story não tem link clicável: o nome escrito embaixo é a única pista de onde
 * a frase veio. Por isso ele fica na zona segura, em corpo grande o bastante
 * para ser lido na miniatura de um feed.
 */

export const STORY = { largura: 1080, altura: 1920 };

/* Cores fixas: isto vira arquivo e sai do aparelho, então não segue o tema de
   quem exportou. Uma frase postada de noite não pode sair diferente da mesma
   frase postada de dia. */
const FUNDO = '#2E4A3B';
const TINTA = '#FBF6EC';

const ENTRELINHA = 1.42;

/**
 * A zona segura do story.
 *
 * O Instagram desenha a própria interface por cima: a barra do perfil come uns
 * 250px em cima e a de responder outro tanto embaixo. Nada que precise ser lido
 * mora fora disto.
 */
const SEGURO = { topo: 260, base: 270 };

/** A folha da marca, emprestada como silhueta gigante do fundo. */
const FOLHA = 'M0 0 C -6 -14 -18 -26 -32 -24 C -42 -22 -44 -6 -34 4 C -22 16 -8 12 0 0 Z';

export const CardDoStory = React.forwardRef<Svg, { texto: string }>(function CardDoStory(
  { texto },
  ref,
) {
  /* Id por instância: `url(#...)` não tem escopo em SVG. */
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  const frase = entreAspas(texto);
  const corpo = corpoDaFrase(texto);
  const linhas = linhasDaFrase(frase, corpo);
  const alturaDaLinha = corpo * ENTRELINHA;
  const graos = graosDoCard(texto, STORY.largura, STORY.altura);

  /*
    A frase fica centrada na zona segura, e não na altura total. Centrada no
    cartaz inteiro ela parece baixa quando o Instagram põe a própria barra em
    cima — o olho compara com o espaço que sobra, não com o arquivo.
  */
  const alturaDoTexto = linhas.length * alturaDaLinha;
  const meioSeguro = SEGURO.topo + (STORY.altura - SEGURO.topo - SEGURO.base) / 2;
  /*
    `alignmentBaseline` não se comporta igual entre Android, iOS e web, então a
    linha é posicionada a partir do topo: 0,74 do corpo é onde a base da Baloo 2
    cai.
  */
  const primeiraLinhaY = meioSeguro - alturaDoTexto / 2 + corpo * 0.74;

  const marcaY = STORY.altura - SEGURO.base;

  return (
    <Svg
      ref={ref}
      width={STORY.largura}
      height={STORY.altura}
      viewBox={`0 0 ${STORY.largura} ${STORY.altura}`}
    >
      <Defs>
        <RadialGradient id={`mancha-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={TINTA} stopOpacity={1} />
          <Stop offset="1" stopColor={TINTA} stopOpacity={0} />
        </RadialGradient>
        {/* A vinheta é o inverso: transparente no meio, fechando nas bordas. */}
        <RadialGradient id={`vinheta-${id}`} cx="50%" cy="50%" r="72%">
          <Stop offset="0.45" stopColor="#000000" stopOpacity={0} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0.34} />
        </RadialGradient>
      </Defs>

      <Rect x={0} y={0} width={STORY.largura} height={STORY.altura} fill={FUNDO} />

      {/* 1. Manchas: a luz variando pela folha. */}
      {MANCHAS.map((m, i) => (
        <Circle
          key={`mancha-${i}`}
          cx={m.cx * STORY.largura}
          cy={m.cy * STORY.altura}
          r={m.r * STORY.largura}
          fill={`url(#mancha-${id})`}
          opacity={m.o}
        />
      ))}

      {/*
        Duas folhas enormes sangrando pelos cantos, quase invisíveis.

        São a mesma folha da marca, e é isso que importa: o fundo passa a ser
        deste app, e não uma textura genérica que serviria a qualquer um.
      */}
      <G opacity={0.05}>
        <Path d={FOLHA} fill={TINTA} transform="translate(-40 380) rotate(-24) scale(13)" />
        <Path
          d={FOLHA}
          fill={TINTA}
          transform="translate(1180 1560) scale(-1,1) rotate(-16) scale(11)"
        />
      </G>

      {/* 2. Grão. */}
      <G fill={TINTA}>
        {graos.map((g, i) => (
          <Circle key={`grao-${i}`} cx={g.x} cy={g.y} r={g.r} opacity={g.o} />
        ))}
      </G>

      {/* 3. Vinheta. */}
      <Rect
        x={0}
        y={0}
        width={STORY.largura}
        height={STORY.altura}
        fill={`url(#vinheta-${id})`}
      />

      {/* 4. O fio interno. */}
      <Rect
        x={54}
        y={54}
        width={STORY.largura - 108}
        height={STORY.altura - 108}
        rx={28}
        fill="none"
        stroke={TINTA}
        strokeWidth={2}
        opacity={0.14}
      />

      {/*
        A aspa de abertura, grande, atrás da primeira linha.

        É a mesma que aparece na tela das frases guardadas — o card e o app
        passam a falar a mesma língua. Fica em 10% porque quem lê tem de ler a
        frase, não a aspa.
      */}
      <SvgText
        x={STORY.largura / 2}
        y={primeiraLinhaY - corpo * 0.42}
        fill={TINTA}
        fontSize={340}
        fontFamily={fonts.display.bold}
        textAnchor="middle"
        opacity={0.1}
      >
        {'“'}
      </SvgText>

      {linhas.map((linha, i) => (
        <SvgText
          key={`${i}-${linha}`}
          x={STORY.largura / 2}
          y={primeiraLinhaY + i * alturaDaLinha}
          fill={TINTA}
          fontSize={corpo}
          fontFamily={fonts.display.semiBold}
          textAnchor="middle"
        >
          {linha}
        </SvgText>
      ))}

      {/*
        Só o nome, centrado.

        O ícone saiu a pedido. Vale registrar o que ele fazia, para quem
        reabrir isto saber que não foi esquecimento: story não tem link
        clicável, e um quadrado arredondado com um broto dentro dizia "isto é
        um aplicativo" sem gastar palavra. Sem ele, o nome sozinho é a única
        pista — o que pede que ele seja grande e legível em miniatura, e é por
        isso que o corpo subiu de 50 para 58.
      */}
      <SvgText
        x={STORY.largura / 2}
        y={marcaY}
        fill={TINTA}
        fontSize={58}
        fontFamily={fonts.display.bold}
        textAnchor="middle"
      >
        Brotinho
      </SvgText>
    </Svg>
  );
});

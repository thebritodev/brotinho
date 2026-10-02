import React from 'react';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { entreAspas } from '../../data/conselhos';
import { fonts } from '../../theme';
import { palette, tracos } from '../../theme/tokens';
import { ESTILO_PADRAO, type EstiloDoStory } from './estilosDoStory';
import { corpoDaFrase, linhasDaFrase } from './quebraDeLinha';

/**
 * O card que vira imagem e sai do aparelho.
 *
 * ## O que ele era, e por que mudou inteiro
 *
 * Era um cartaz: fundo de uma cor, grão, manchas de luz, duas folhas gigantes
 * sangrando pelos cantos, uma vinheta fechando as bordas, a aspa de abertura
 * enorme atrás do texto e a frase centrada no meio de tudo. Tinha carinho e
 * tinha unidade — e não era o que o documento desenha.
 *
 * O documento desenha outra coisa, e a diferença não é de enfeite: lá a frase
 * está **num papel**, um retângulo claro ligeiramente torto, pousado sobre o
 * fundo colorido, com a assinatura logo abaixo dela. E embaixo de tudo há uma
 * **cena** — dois morros e o broto —, com o nome do app no pé.
 *
 * A troca importa porque muda o que a imagem diz. Um cartaz com uma frase
 * centrada é uma citação: ela vale por si, e quem postou é um detalhe. Um
 * bilhete de papel assinado "de Brotinho, para você", em cima de uma
 * paisagenzinha com o personagem, é **um recado que alguém deixou** — e é essa
 * a relação que o app inteiro tenta construir. O story é a única peça do
 * produto que estranhos veem; ela tem de ser a mesma coisa que o app é.
 *
 * ## A geometria é a do documento, multiplicada
 *
 * Lá o card tem 262 por 466; aqui tem 1080 por 1920. As duas proporções são a
 * mesma (0,562), então tudo vem de lá multiplicado por `ESCALA`. Os números
 * crus estão escritos como no documento, dentro de `d()` — assim dá para
 * comparar com o arquivo original sem fazer divisão de cabeça.
 *
 * ## O que continua sendo daqui
 *
 * A quebra de linha. `<Text>` de SVG não quebra sozinho, e a nossa quebra é
 * estimada — `confere-story.js` mede as vinte frases com a fonte de verdade,
 * num navegador, e reprova se alguma vazar. Esse teste é o que impede a frase
 * de sair cortada numa imagem que ninguém revisa antes de postar.
 */

export const STORY = { largura: 1080, altura: 1920 };

/** De 262 de largura, no documento, para 1080 aqui. */
const ESCALA = STORY.largura / 262;

/** Um número do documento, em pixels daqui. */
const d = (n: number) => n * ESCALA;

/**
 * A zona segura do story.
 *
 * O Instagram desenha a própria interface por cima: a barra do perfil come uns
 * 250px em cima e a de responder outro tanto embaixo. O **papel** mora dentro
 * disto, porque é o que precisa ser lido. A cena e a assinatura do pé podem
 * encostar no limite: se a interface cobrir um morro, não se perde recado
 * nenhum.
 */
const SEGURO = { topo: 260 };

const ENTRELINHA = 1.28;

/** O tamanho do broto da cena, em pixels do card. */
const TAMANHO_DO_BROTO = 230;

/**
 * As cores que não mudam com o estilo, e por que não mudam.
 *
 * O papel é sempre claro — é papel —, então o que se escreve nele é sempre a
 * tinta escura, nos cinco fundos. A assinatura do pé é sempre creme porque
 * pousa sobre o morro da frente, que é o tom mais escuro de qualquer estilo. E
 * o broto é verde: ele não muda de cor conforme o fundo que a pessoa escolheu,
 * do mesmo jeito que não muda de cor dentro do app.
 */
const NO_PAPEL = { tinta: '#3A3630', assinatura: '#8A8375' };

/**
 * O broto da cena, numa caixa de 28 — o mesmo desenho do ícone da barra.
 *
 * É o broto reduzido ao que se reconhece de longe: duas folhas saindo de um
 * caule e a cabeça em cima. Na miniatura de um feed é tudo o que cabe, e é
 * tudo o que precisa caber.
 */
const BROTO = {
  caule: 'M14 17.5v-5',
  folhaEsquerda: 'M14 14.2c-1.2-2.6-3.6-3.6-6.2-3.2.3 2.7 2.8 4 6.2 3.2z',
  folhaDireita: 'M14 14.2c1.2-2.6 3.6-3.6 6.2-3.2-.3 2.7-2.8 4-6.2 3.2z',
  cabeca: { cx: 14, cy: 7.2, r: 3.6 },
  /** O pé do caule, para plantar o desenho pelo chão e não pelo canto. */
  pe: { x: 14, y: 17.5 },
};

export const CardDoStory = React.forwardRef<
  Svg,
  { texto: string; estilo?: EstiloDoStory; nome?: string }
>(function CardDoStory({ texto, estilo = ESTILO_PADRAO, nome = 'Brotinho' }, ref) {
  const frase = entreAspas(texto);
  const corpo = corpoDaFrase(texto);
  const linhas = linhasDaFrase(frase, corpo);
  const alturaDaLinha = corpo * ENTRELINHA;

  /* O papel: largura do documento (210 de 262), e a altura sai do texto. */
  const larguraDoPapel = d(210);
  const esquerdaDoPapel = (STORY.largura - larguraDoPapel) / 2;
  const recuo = d(18);
  const assinatura = d(12);
  const alturaDoPapel = recuo * 2 + linhas.length * alturaDaLinha + d(10) + assinatura * 1.5;

  /* O papel fica centrado entre o rótulo de cima e a cena de baixo. */
  const topoDaCena = STORY.altura - d(150);
  const meioLivre = (d(96) + topoDaCena) / 2;
  const topoDoPapel = Math.max(SEGURO.topo, meioLivre - alturaDoPapel / 2);

  /* Onde o broto pousa: em cima do morro da frente, à direita. */
  const brotoX = STORY.largura * 0.74;
  const brotoY = topoDaCena + d(50);

  return (
    <Svg
      ref={ref}
      width={STORY.largura}
      height={STORY.altura}
      viewBox={`0 0 ${STORY.largura} ${STORY.altura}`}
    >
      <Rect x={0} y={0} width={STORY.largura} height={STORY.altura} fill={estilo.fundo} />

      {/*
        1. O rótulo do alto: um tracinho e a palavra em maiúsculas pequenas.

        É o que diz de onde a frase veio sem precisar de logotipo. Fica a 75%
        de opacidade, como no documento — ele apresenta, não compete.
      */}
      <Rect
        x={d(26)}
        y={d(55)}
        width={d(18)}
        height={d(2)}
        rx={d(1)}
        fill={estilo.tinta}
        opacity={0.75}
      />
      <SvgText
        x={d(52)}
        y={d(60)}
        fill={estilo.tinta}
        opacity={0.75}
        fontSize={d(11)}
        fontFamily={fonts.body.extraBold}
        letterSpacing={d(1.3)}
      >
        A FRASE DE HOJE
      </SvgText>

      {/*
        2. O papel, torto dois graus.

        A sombra é um segundo retângulo deslocado, e não um filtro: filtro de
        SVG no Android é caro, e é a coisa que eu não teria como conferir daqui
        antes de mandar para a loja.
      */}
      <G transform={`rotate(-2 ${STORY.largura / 2} ${topoDoPapel + alturaDoPapel / 2})`}>
        <Rect
          x={esquerdaDoPapel + d(2)}
          y={topoDoPapel + d(5)}
          width={larguraDoPapel}
          height={alturaDoPapel}
          rx={d(8)}
          fill="#28201A"
          opacity={0.14}
        />
        <Rect
          x={esquerdaDoPapel}
          y={topoDoPapel}
          width={larguraDoPapel}
          height={alturaDoPapel}
          rx={d(8)}
          fill={estilo.papel}
        />
        {linhas.map((linha, i) => (
          <SvgText
            key={`${i}-${linha}`}
            x={esquerdaDoPapel + recuo}
            y={topoDoPapel + recuo + corpo * 0.82 + i * alturaDaLinha}
            fill={NO_PAPEL.tinta}
            fontSize={corpo}
            fontFamily={fonts.display.semiBold}
          >
            {linha}
          </SvgText>
        ))}
        <SvgText
          x={esquerdaDoPapel + recuo}
          y={topoDoPapel + alturaDoPapel - recuo}
          fill={NO_PAPEL.assinatura}
          fontSize={assinatura}
          fontFamily={fonts.body.bold}
        >
          de {nome}, para você
        </SvgText>
      </G>

      {/*
        3. A cena do pé: dois morros e o broto.

        Dois, e não um: é o morro de trás que dá distância. Com um só, o chão
        encosta no fundo numa linha e a cena vira duas faixas de cor.
      */}
      <Path
        d={
          `M0 ${topoDaCena + d(34)} `
          + `C ${STORY.largura * 0.27} ${topoDaCena + d(14)} ${STORY.largura * 0.65} ${topoDaCena + d(20)} `
          + `${STORY.largura} ${topoDaCena + d(38)} L${STORY.largura} ${STORY.altura} L0 ${STORY.altura} Z`
        }
        fill={estilo.morroDeTras}
      />
      <Path
        d={
          `M0 ${topoDaCena + d(56)} `
          + `C ${STORY.largura * 0.3} ${topoDaCena + d(38)} ${STORY.largura * 0.7} ${topoDaCena + d(40)} `
          + `${STORY.largura} ${topoDaCena + d(54)} L${STORY.largura} ${STORY.altura} L0 ${STORY.altura} Z`
        }
        fill={estilo.morro}
      />

      {/*
        O broto da cena: o bulbo e as duas folhas, sem vaso.

        Não é o componente `Sprout`: aquele monta o próprio `Svg`, e `Svg`
        dentro de `Svg` não é caminho no `react-native-svg`. São as mesmas
        formas, no mesmo traço — a folha é a da marca, a mesma do aplicativo
        inteiro.
      */}
      <G
        transform={
          `translate(${brotoX} ${brotoY}) scale(${TAMANHO_DO_BROTO / 28}) `
          + `translate(${-BROTO.pe.x} ${-BROTO.pe.y})`
        }
      >
        <Path
          d={BROTO.caule}
          stroke={tracos.contornoFolha}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={BROTO.folhaEsquerda}
          fill={palette.green300}
          stroke={tracos.contornoFolha}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Path
          d={BROTO.folhaDireita}
          fill={palette.green300}
          stroke={tracos.contornoFolha}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Circle
          cx={BROTO.cabeca.cx}
          cy={BROTO.cabeca.cy}
          r={BROTO.cabeca.r}
          fill={palette.green300}
          stroke={tracos.contornoFolha}
          strokeWidth={2}
        />
      </G>

      {/* 4. A assinatura do pé: a única pista de onde isto veio. */}
      <SvgText
        x={STORY.largura / 2}
        y={STORY.altura - d(22)}
        fill={palette.cream100}
        fontSize={d(16)}
        fontFamily={fonts.display.bold}
        textAnchor="middle"
        letterSpacing={d(0.3)}
      >
        brotinho
      </SvgText>
    </Svg>
  );
});

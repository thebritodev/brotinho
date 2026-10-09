import React from 'react';
import { Text, View } from 'react-native';

import { MATURIDADE, STAGE_AT } from '../../state/derived';
import { fonts, useTema } from '../../theme';
import { FlorDoCiclo } from './FlorDoCiclo';
import { quadroDoBroto } from './geometriaDoBroto';
import {
  NOMES_DAS_MARCAS,
  larguraDoNome,
  posicoesDosRotulos,
  marcaDeAgora,
  planoDaRegua,
} from './planoDoCiclo';
import { Sprout, type SproutStage } from './Sprout';

/**
 * A régua do ciclo: os vinte e um dias até a planta ir para o jardim.
 *
 * ## O que ela corrige
 *
 * Duas barras que contavam uma coisa e diziam outra. A história está por
 * extenso em `reguaDoCiclo`, que é onde moram as contas; o resumo é que a
 * barra da tela inicial era do **estágio atual** — aos dez dias cuidados ela
 * aparecia vazia debaixo da frase "faltam 11 dias para florescer" — e a do
 * jardim tinha os quatro nomes espalhados em larguras iguais, embora os
 * estágios abram nos dias 3 e 10 de 21.
 *
 * Agora é uma régua só, nos dois lugares, do ciclo inteiro.
 *
 * ## Por que vinte e um intervalos, e não uma barra cheia
 *
 * Porque um dia tem de ser visível. Numa barra contínua de 21 dias, aparecer
 * hoje move o preenchimento menos de cinco por cento — e progresso que não dá
 * para ver no dia em que acontece não é progresso, é relatório. Em intervalos,
 * o dia de hoje acende **um intervalo inteiro**.
 *
 * Era esse o argumento que me fez, antes, fazer os pontinhos do estágio de
 * agora: três na Semente, sete no Broto, onze na Plantinha. O argumento estava
 * certo e a conclusão errada — dividir por estágio resolve o tamanho do passo
 * e destrói a única coisa que a barra precisa dizer, que é **quanto falta para
 * o fim**. Vinte e um intervalos têm as duas: o passo de hoje é um intervalo, e
 * o fim é o fim.
 *
 * ## E a última marca é a flor da espécie
 *
 * No dia 21 a planta amadurece, abre a flor dela, e a pessoa escolhe a
 * espécie do próximo ciclo — ver `data/especies`. A última marca desenha
 * **essa** flor: lilás numa lavanda, amarela num girassol. Aqui havia uma
 * margarida fixa, que é a flor da Composta, e repetir o desenho de outra
 * ferramenta era exatamente o que fazia os dois ciclos parecerem o mesmo.
 *
 * As três primeiras marcas já mudam de cor sozinhas: elas são `Sprout`, e o
 * `Sprout` lê a espécie do contexto.
 *
 * ## O desenho fica em cima da marca
 *
 * Cada estágio é desenhado sobre o dia em que ele abre, e não numa coluna de
 * largura igual. É daí que vem o encaixe que o resto não tinha: quando o broto
 * evolui, o trecho aceso **termina exatamente embaixo do desenho novo**. A
 * fronteira entre dois intervalos cai no meio do vão, que é onde o risco está
 * — ver o comentário de `planoDaRegua`.
 */

/**
 * Os quatro dias em que algo acontece no ciclo.
 *
 * Montado aqui, e não em `reguaDoCiclo`, porque aquele arquivo não importa
 * nada de propósito — é o que deixa a bateria compilá-lo sozinho. A régua tem
 * uma única fonte para estes números, que é `derived`; o teste confere que eles
 * continuam sendo 0, 3, 10 e 21, porque a folga mais estreita da régua foi
 * dimensionada em cima deles.
 */
export const MARCOS_DO_CICLO = [STAGE_AT[1], STAGE_AT[2], STAGE_AT[3], MATURIDADE];

/** O chão da flor, que carrega a luz da paisagem e não a do tema. */
const CHAO_DA_FLOR = '#FBF6EC';

/** A altura da barra, e o quanto o risco se estende acima dela. */
const ALTURA_DA_BARRA = 12;
const ALTURA_DO_RISCO = 7;
const FOLGA_DO_RISCO = 3;

/** O corpo dos nomes embaixo da régua, e o vão mínimo entre dois deles. */
const CORPO_DO_ROTULO = 11;
const FOLGA_ENTRE_ROTULOS = 5;

type Props = {
  /** O espaço que a régua tem, já sem o preenchimento do cartão. */
  largura: number;
  /** Dias cuidados dentro do ciclo atual. */
  dias: number;
};

export function ReguaDoCiclo({ largura, dias }: Props) {
  const { colors, palette } = useTema();

  const plano = planoDaRegua(largura, MARCOS_DO_CICLO, MATURIDADE);
  const agora = marcaDeAgora(MARCOS_DO_CICLO, dias);
  const acesos = Math.max(0, Math.min(MATURIDADE, dias));

  /*
    Os quatro nomes, já afastados o bastante para nenhum encostar no vizinho.

    A largura de cada um é estimada pelas letras — medir texto pediria
    `onLayout`, que não dispara no `react-native-web`. Ver `larguraDoNome`.
  */
  const larguraDosNomes = NOMES_DAS_MARCAS.map((n) => larguraDoNome(n, CORPO_DO_ROTULO));
  const esquerdaDosNomes = posicoesDosRotulos(
    plano.marcas.map((m) => m.x),
    larguraDosNomes,
    largura,
    FOLGA_ENTRE_ROTULOS,
  );

  /*
    O tamanho do broto sai da caixa dele, e não de um número escolhido.

    `size`, no `Sprout`, é uma largura de referência: o desenho que sai dela
    muda de proporção a cada estágio. Passar `lado` direto deixaria a Plantinha
    mais larga que a marca e a Semente perdida no meio dela. Medindo os três na
    mesma escala e dividindo pelo mais largo, o mais largo mede exatamente a
    marca e os outros dois ficam proporcionais — que é o que faz os três
    parecerem o mesmo broto em três idades.
  */
  const mesmaEscala = ([1, 2, 3] as SproutStage[]).map((n) =>
    quadroDoBroto(n, 100, { showPot: false }),
  );
  const maisLargo = Math.max(...mesmaEscala.map((q) => q.largura));
  const tamanhoDoBroto = (100 * plano.lado) / maisLargo;
  /* Sem vaso, a altura é a mesma para os três — ver `quadroDoBroto`. */
  const alturaDoDesenho = tamanhoDoBroto * 1.12;

  return (
    <View style={{ width: largura }}>
      {/*
        Os desenhos e os riscos, numa camada só.

        Juntos porque a opacidade é uma: o risco de um estágio que ainda não
        chegou tem de apagar junto com o desenho dele, senão a régua ganha
        quatro riscos fortes e quatro desenhos de pesos diferentes.

        Escondidos do leitor de tela. O que ele precisa ouvir é o valor da
        barra, logo abaixo, e não quatro imagens sem nome.
      */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ height: alturaDoDesenho + FOLGA_DO_RISCO + ALTURA_DO_RISCO }}
      >
        {plano.marcas.map((marca, i) => {
          const alcancou = dias >= marca.dia;
          const ehOFim = i === plano.marcas.length - 1;
          return (
            <View
              key={marca.dia}
              style={{
                position: 'absolute',
                top: 0,
                left: marca.x - plano.lado / 2,
                width: plano.lado,
                alignItems: 'center',
                opacity: alcancou ? 1 : 0.4,
              }}
            >
              <View style={{ height: alturaDoDesenho, justifyContent: 'flex-end' }}>
                {ehOFim ? (
                  /*
                    A flor num disco creme.

                    O broto é desenhado com cores literais — personagem não
                    inverte, e está escrito em `tokens`. O contorno da flor é o
                    verde escuro da espécie, e dentro de um cartão escuro isso
                    seria contorno preto sobre preto. O disco é o pedaço de luz
                    que ela traz consigo: no tema claro ele desaparece no creme
                    do cartão, e no escuro vira a moeda que marca o fim do
                    ciclo.
                  */
                  <View
                    style={{
                      width: alturaDoDesenho,
                      height: alturaDoDesenho,
                      borderRadius: alturaDoDesenho / 2,
                      backgroundColor: CHAO_DA_FLOR,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FlorDoCiclo tamanho={alturaDoDesenho - 4} />
                  </View>
                ) : (
                  <Sprout
                    mood="leve"
                    stage={(i + 1) as SproutStage}
                    size={tamanhoDoBroto}
                    showPot={false}
                  />
                )}
              </View>
              <View
                style={{
                  width: 2,
                  height: ALTURA_DO_RISCO,
                  marginTop: FOLGA_DO_RISCO,
                  borderRadius: 1,
                  backgroundColor: alcancou ? colors.primaryStrong : palette.brown400,
                }}
              />
            </View>
          );
        })}
      </View>

      {/*
        Os vinte e um intervalos.

        Posicionados por coordenada, e não por `flex: 1` com `gap`. A diferença
        não é de estilo: a fronteira entre dois intervalos precisa cair
        exatamente em cima da marca, e `flex` reparte o resto da divisão por
        onde quiser. Com coordenada, o intervalo do dia 3 começa no risco do
        Broto porque os dois saem da mesma conta.
      */}
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Crescimento até florescer"
        accessibilityValue={{ min: 0, max: MATURIDADE, now: acesos }}
        style={{ height: ALTURA_DA_BARRA }}
      >
        {plano.intervalos.map((intervalo) => (
          <View
            key={intervalo.dia}
            style={{
              position: 'absolute',
              top: 0,
              left: intervalo.esquerda,
              width: intervalo.largura,
              height: ALTURA_DA_BARRA,
              borderRadius: 4,
              backgroundColor: intervalo.dia < acesos ? colors.primary : palette.cream300,
            }}
          />
        ))}
      </View>

      {/*
        O nome de cada etapa, embaixo da marca dela.

        Eram quatro desenhos e **um** nome, o da etapa de agora. Eu tinha
        escrito que os quatro não cabiam, e não cabem mesmo centrados nos
        riscos — a Semente e o Broto estão a um sétimo da barra um do outro.
        Mas a conclusão estava errada: uma régua que desenha quatro coisas e
        nomeia uma obriga a adivinhar as outras três, e foi o que o Pedro viu.

        `posicoesDosRotulos` resolve do jeito que todo eixo de gráfico resolve:
        centra cada nome no risco dele e depois afasta o que se sobreporia,
        em duas varreduras. Quem cede é a palavra; o risco e o desenho
        continuam exatamente em cima do dia.

        A de agora fica acesa e as outras no tom de apoio — é o que mantém o
        "onde eu estou" legível agora que há quatro nomes em vez de um.
      */}
      <View style={{ height: CORPO_DO_ROTULO + 5, marginTop: 7 }}>
        {NOMES_DAS_MARCAS.map((nome, i) => (
          <Text
            key={nome}
            numberOfLines={1}
            style={{
              position: 'absolute',
              left: esquerdaDosNomes[i],
              width: larguraDosNomes[i],
              textAlign: 'center',
              fontFamily: fonts.body.extraBold,
              fontSize: CORPO_DO_ROTULO,
              color: i === agora ? colors.primaryStrong : palette.brown400,
            }}
          >
            {nome}
          </Text>
        ))}
      </View>
    </View>
  );
}

export { STAGE_AT };

/**
 * A paisagem das telas da Composta: as cores, as contas e os canteiros.
 *
 * Separado do desenho para poder ser conferido sem montar nada — é o mesmo
 * arranjo de `planoDaQueda` e `casaFrase`. O desenho mora em
* `PaisagemDaComposta.tsx`.
 *
 * ## Céu → terra, e por que é essa a narrativa
 *
 * A ferramenta tem uma direção: o pensamento chega pesado, é repetido até
 * virar som, e o que sobra vira adubo. O céu conta isso sozinho — cinza de
 * chumbo na tela do pensamento, dourado na da flor —, e a terra é onde a coisa
 * termina. Tudo aqui serve a essa passagem.
 *
 * ## O céu tem luz própria
 *
 * As cores são literais, e não vêm de `useTema`. É a mesma regra de
 * `ceuDaComposta` e `terraDoCanteiro`: paisagem não anoitece. Um céu de tema
 * escuro teria o cinza virando quase preto e o dourado virando marrom, e o
 * broto — que é traço de cor fixa — boiaria num vazio. O escuro desta tela
 * começa na folha de conteúdo, que é onde se lê.
 *
 * Consequência: **quem escreve sobre o céu também sai do tema.** Ver
 * `TEXTO_NA_PAISAGEM` e os pares medidos em `confere-contraste.js`.
 */

/**
 * A largura em que o documento foi desenhado.
 *
 * Todas as posições horizontais daqui são dadas nessa régua, e a tela as
 * reescala — ver `emX`, em `PaisagemDaComposta`. Guardar as coordenadas na
 * régua do documento é o que permite comparar um canteiro com o protótipo
 * ponto a ponto; convertê-las na origem perderia essa chance para sempre.
 */
export const LARGURA_DO_DOCUMENTO = 390;

/** O céu do pensamento pesado: chumbo em cima, poeira embaixo. */
export const CEU_PESADO = ['#B9C0C9', '#D5D8D8', '#E8E3D8'] as const;
/** As paradas do degradê cinza, em fração da altura. */
export const PARADAS_DO_PESADO = [0, 0.55, 1] as const;

/** O céu do alívio. Entra por cima do cinza, por opacidade. */
export const CEU_DOURADO = ['#F0BE68', '#F7D9A0', '#FCEED4'] as const;
export const PARADAS_DO_DOURADO = [0, 0.42, 1] as const;

/** O contorno de tudo na paisagem — o `brown900` do tema claro. */
export const CONTORNO = '#3A3630';

/** O corpo da terra, e a faixa funda embaixo dela. */
export const TERRA = '#5B5548';
export const TERRA_FUNDA = CONTORNO;
/** A linha de luz logo abaixo da crista, e as pedrinhas claras. */
export const TERRA_CLARA = '#8A8375';
/** A pedrinha escura. */
export const PEDRA_ESCURA = '#4A443B';

/** O morro verde ao longe. */
export const MORRO = '#9EBBAA';
/** Os tufos de grama na crista. */
export const GRAMA = '#3E6B54';

/** O sol e o halo dele. */
export const SOL = '#F6D27E';
export const SOL_CONTORNO = '#E8B65A';
export const LUZ = '#FFF4D6';

/** As nuvens. */
export const NUVEM = '#FFFDF8';
export const NUVEM_CONTORNO = 'rgba(58,54,48,0.12)';
export const NUVEM_CONTORNO_GRANDE = 'rgba(58,54,48,0.16)';
export const NUVEM_SOMBRA = '#D9D1BF';

/** A chuva da tela do pensamento. */
export const CHUVA = '#8FA3B4';

/** O texto escrito por cima do céu — fixo, porque o céu é fixo. */
export const TEXTO_NA_PAISAGEM = CONTORNO;
/**
 * O tom fraco: a dica da prática e o relógio.
 *
 * Não é o `brown700` do documento, e a diferença é de dois décimos de tom.
 * Aquele dá **4,03** sobre o alto do céu de chumbo, que é exatamente onde a
 * dica da tela da prática fica escrita. Este dá 4,64 no pior dos seis tons dos
 * dois céus.
 *
 * É a mesma história do `TEXTO_NO_CEU_FRACO` da tela inicial: a escolha do
 * documento não estava errada, estava medida contra um céu só. Aqui são dois,
 * e a conta tem de valer nos dois extremos da passagem.
 */
export const TEXTO_NA_PAISAGEM_FRACO = '#524C40';

/** O vidro das pastilhas e dos botões redondos que ficam sobre o céu. */
export const VIDRO_NA_PAISAGEM = 'rgba(255,253,248,0.72)';
/** O vidro mais fraco, da pastilha secundária do relógio. */
export const VIDRO_FRACO = 'rgba(255,253,248,0.45)';
/**
 * A pastilha escura: o selo do jardim e o rótulo do microfone.
 *
 * O documento escreve 55% de preto. Medido, o creme de dentro dá **3,88**
 * sobre o dourado do pé do céu, que é onde o rótulo do microfone fica — abaixo
 * dos 4,5 da WCAG, e justamente na tela em que a pessoa está com os olhos em
 * outro lugar, repetindo a frase em voz alta.
 *
 * Setenta e dois por cento resolve com 5,85 e não muda nada do que a pastilha
 * é: ela continua sendo uma sombra com texto dentro, e sobre o chumbo da tela
 * do pensamento a diferença não se vê. Ver `confere-contraste`, que mede os
 * dois céus.
 */
export const PASTILHA_ESCURA = 'rgba(43,40,36,0.72)';
/** O creme que se escreve dentro dela. */
export const TEXTO_NA_PASTILHA = '#FBF6EC';

/**
 * Onde a terra começa, por tela.
 *
 * São os `gy` do documento, em pontos contados do alto da cena. Ficam aqui, e
 * não espalhados pelas telas, porque a crista é o que amarra o broto, as
 * flores, as pedras e a grama: um número solto numa tela é um número que sai
 * de sincronia com os outros na primeira vez que alguém o ajusta.
 */
export const CRISTA = {
  /** C1 · intro: cena de 400. */
  intro: 316,
  /** C2 · o pensamento: cena de 300. */
  pensamento: 284,
  /** C3 · rodando: tela cheia. */
  rodando: 660,
  /** C4 · virou flor: cena de 420. */
  flor: 348,
  /** O jardim: cena de 380. */
  jardim: 300,
} as const;

/** A altura da cena, por tela — o par de `CRISTA`. */
export const ALTURA_DA_CENA = {
  intro: 400,
  pensamento: 300,
  rodando: 844,
  flor: 420,
  jardim: 380,
} as const;

export type FlorPlantada = {
  /** Na régua do documento. */
  x: number;
  /**
   * A posição dela na ordem de criação — é daqui que sai **qual** flor é.
   *
   * O canteiro guarda o índice, e não o tipo, de propósito. Guardando o tipo,
   * este arquivo precisaria conhecer o desenho das flores, e deixaria de ser
   * uma folha de contas: o `confere-contraste` compila estas constantes
   * sozinhas, com o compilador, e um import de arquivo com JSX arrastaria a
   * árvore inteira de componentes para dentro de uma conferência de cor.
   *
   * Quem converte índice em flor é `florDoIndice`, onde as flores moram.
   */
  indice: number;
  escala: number;
  /** Quanto ela desce da crista, em pontos. */
  dy: number;
  /** A flor da frase selecionada no jardim, com halo pulsando. */
  destaque?: boolean;
};

/**
 * O canteiro das telas da prática: flores plantadas ao longo da terra, dos
 * dois lados do broto.
 *
 * ## A ordem é o que importa aqui, não a lista
 *
 * O documento espalha as dez posições dele entre 18 e 214 — a metade esquerda
 * de uma tela de 390. Com o broto plantado em 272, o resultado foi um canteiro
 * amontoado num canto e um estirão de terra vazia entre a última flor e os pés
 * dele: o Pedro olhou e disse que faltavam as flores ao lado do broto. Faltavam
 * mesmo — não por estarem erradas, mas por nunca chegarem até lá.
 *
 * Agora as colunas cobrem a largura inteira, e **a ordem alterna os lados**.
 * Isso é o que resolve o caso comum, que é o de quem tem poucas flores: as
 * cinco primeiras caem em 34, 214, 126, 330 e 58, ou seja, uma de cada lado,
 * em vez das cinco primeiras da fileira da esquerda. Um canteiro de três
 * flores já ocupa a terra toda.
 *
 * Quando o jardim passa de quinze, a décima sexta nasce em cima da primeira —
 * e isso está certo: um solo com vinte frases **deve** parecer mais cheio que
 * um com cinco.
 *
 * `evitar` é a coluna do broto. Sem isso as flores nascem entre os pés dele e
 * o desenho vira sobreposição em vez de cena. Trinta e quatro pontos de cada
 * lado é a meia-largura da maior flor com a escala do canteiro.
 */
export function canteiroDaPratica(quantas: number, evitar?: number): FlorPlantada[] {
  const xs = [34, 214, 126, 330, 58, 170, 360, 18, 148, 310, 82, 376, 104, 242, 196];
  return Array.from({ length: Math.max(0, quantas) }, (_, i) => ({
    x: xs[i % xs.length],
    indice: i,
    escala: 0.85 + ((i * 7) % 4) * 0.08,
    dy: i >= 4 ? 10 : 0,
  })).filter((f) => evitar === undefined || Math.abs(f.x - evitar) > 34);
}

/**
 * O jardim inteiro: fileiras de seis, cada uma descendo e deslocada meia casa.
 *
 * O deslocamento das fileiras ímpares é o que impede o jardim de ler como
 * grade — seis colunas retas num solo são um gráfico de barras, não um
 * canteiro. E cada fileira desce 26 pontos, o que põe as mais novas na frente
 * das mais velhas: quem chegou depois está mais perto de quem olha.
 */
export function jardimEspalhado(quantas: number, destaque?: number | null): FlorPlantada[] {
  return Array.from({ length: Math.max(0, quantas) }, (_, i) => {
    const fileira = Math.floor(i / 6);
    const coluna = i % 6;
    return {
      x: 36 + coluna * 64 + (fileira % 2) * 30,
      dy: fileira * 26 - 4,
      indice: i,
      escala: 1.1 + ((i * 5) % 3) * 0.1,
      destaque: i === destaque,
    };
  });
}

/**
 * O passo da dissolução de um caractere, na conta do documento.
 *
 * ## Por que caractere, e não palavra
 *
 * A frase se desmanchava por palavra: cada palavra inteira descia e sumia
 * junto. Lido na tela, isso é uma frase **sendo apagada** — alguém tirando as
 * palavras uma a uma. O que a prática faz é outra coisa: a frase perde a
 * estrutura. Por caractere, o que cai é a forma da palavra, e o que sobra no
 * meio do caminho é um resto que não dá para ler nem para desler. É a imagem
 * da saciedade semântica, e é por isso que o documento desenha assim.
 *
 * ## O sorteio é determinístico
 *
 * `rnd` sai do índice do caractere por `sin`, e não de `Math.random()`. Tem de
 * sair: a tela redesenha a cada repetição contada, e com sorteio de verdade
 * cada letra pularia para um lugar novo em cada redesenho — a frase tremeria
 * inteira em vez de afundar. Com a semente no índice, a letra 7 cai sempre no
 * mesmo rumo, e o que muda entre um quadro e o outro é só o quanto ela já
 * andou.
 */
export function passoDaLetra(indice: number, repeticoes: number) {
  const { rnd, comeca, termina, destino } = curvaDaLetra(indice);
  const k =
    repeticoes <= comeca ? 0 : Math.min(1, (repeticoes - comeca) / (termina - comeca));
  return {
    rnd,
    opacidade: 1 - k * 0.92,
    dx: destino.dx * k,
    dy: destino.dy * k,
    giro: destino.giro * k,
    /** O desfoque cresce com as repetições, igual para a frase toda. */
    desfoque: desfoqueDaFrase(repeticoes),
  };
}

/**
 * Os dois instantes em que a letra começa e termina de cair, e onde ela para.
 *
 * ## Por que isto existe separado do passo
 *
 * Porque a tela não calcula o passo: ela **interpola** entre estes pontos.
 *
 * A dissolução é uma reta por partes em `repeticoes` — parada até `comeca`,
 * andando até `termina`, parada depois. Então a frase inteira pode se mexer com
 * **um** `Animated.Value` só, que segue o contador de repetições, e cada letra
 * lê a reta dela por `interpolate`. Quatro pontos bastam, e a curva sai exata.
 *
 * A alternativa seria recalcular `passoDaLetra` em cada quadro e redesenhar a
 * frase inteira sessenta vezes por segundo. Vinte letras em React, durante os
 * trinta e seis segundos em que a pessoa está falando — é o jeito de fazer uma
 * animação travar no aparelho, e esta casa já tem um defeito assim contado em
 * `planoDaQueda`.
 *
 * O documento transiciona cada letra em 1,4 s com `cubic-bezier(.4,0,.2,1)`;
 * aqui isso é a duração e a curva do `timing` que move o contador, e vale para
 * todas de uma vez — que é o que o CSS também faz.
 */
export function curvaDaLetra(indice: number) {
  const semente = (Math.sin((indice + 1) * 12.9898) * 43758.5453) % 1;
  const rnd = Math.abs(semente);
  return {
    rnd,
    /** A repetição em que ela começa a afundar. */
    comeca: 2 + rnd * 9,
    /** E em que ela já sumiu. Três repetições depois, sempre. */
    termina: 2 + rnd * 9 + 3,
    destino: {
      /** Para onde ela vai: um pouco para o lado, bastante para baixo. */
      dx: (rnd - 0.5) * 30,
      dy: 120 + rnd * 140,
      giro: (rnd - 0.5) * 90,
      /** Noventa e dois por cento da tinta vai embora; 8% fica de resto. */
      opacidade: 1 - 0.92,
    },
  };
}

/**
 * O desfoque da frase, pelas repetições.
 *
 * Não é animado, e é o único valor da tela que não é: `filter` não entra no
 * driver nativo, e o `react-native-web` o trataria como um estilo qualquer, a
 * um render por quadro. Ele cresce 0,12 por repetição e para em 2 — um degrau a
 * cada vez contada, que ninguém distingue de uma rampa porque o que o olho
 * segue é a letra caindo.
 *
 * No Android abaixo da API 31 `filter` não existe e não desfoca nada. Custa
 * pouco: as letras também estão perdendo opacidade, e é por ela que a frase se
 * desmancha.
 */
export function desfoqueDaFrase(repeticoes: number): number {
  return Math.min(2, repeticoes * 0.12);
}

/** Quantos segundos de voz completam uma compostagem. */
export const SEGUNDOS_DA_COMPOSTA = 36;

/**
 * O que o broto diz enquanto ela repete, pelas repetições contadas.
 *
 * Os quatro degraus são os do documento. Ficam aqui, e não em
 * `data/falasDoBroto`, porque são estado da prática e não repertório: a fala
 * muda com um número que só existe nesta tela.
 */
export function falaDoBrotoNaComposta(repeticoes: number): string {
  if (repeticoes === 0) return 'Tô ouvindo. Pode começar.';
  if (repeticoes < 5) return 'Isso, continua.';
  if (repeticoes < 9) return 'Tá virando só som...';
  return 'Hum, adubo fresquinho!';
}

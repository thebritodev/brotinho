/**
 * A conta da queda das palavras na faixa da Composta — separada do desenho
 * para poder ser testada frase por frase.
 *
 * ## O defeito que isto existe para impedir
 *
 * Cada palavra tinha o próprio laço de animação, e o escalonamento entre elas
 * era feito por temporizadores do JavaScript: a segunda partia um segundo
 * depois da primeira, a terceira dois, e assim por diante.
 *
 * No aparelho, o JavaScript trava por um instante logo depois de a tela
 * abrir. Os temporizadores que vencem durante a travada disparam todos juntos
 * quando ela acaba — e, como cada palavra repete com o mesmo período, **uma
 * vez juntas, elas ficam juntas para sempre**. Em "vai dar tudo errado" o
 * "vai" já tinha partido; "dar", "tudo" e "errado" caíam ao mesmo tempo.
 *
 * E havia um segundo defeito escondido atrás do primeiro: as colunas eram uma
 * tabela fixa, e a segunda e a quarta estavam a dezesseis pontos uma da outra.
 * Caindo juntas, "dar" e "errado" ficaram uma por cima da outra.
 *
 * ## O que muda
 *
 * **Um relógio só.** Todas as palavras leem o mesmo valor, que vai de 0 a 1
 * na primeira volta e de 1 a 2 em cada volta seguinte. A defasagem de cada
 * uma está escrita na própria curva dela (`curvaDaPalavra`), e não num
 * temporizador. Se o JavaScript travar, o relógio para para todas ao mesmo
 * tempo: elas congelam juntas e voltam juntas, mas não se desencontram.
 *
 * **A distância é calculada.** O atraso entre uma palavra e a seguinte sai da
 * altura que a maior palavra ocupa no pior momento do tombo, e não de um
 * número escolhido no olho. Duas palavras no ar ao mesmo tempo estão sempre
 * separadas, na vertical, por mais que isso — qualquer que seja a frase.
 *
 * **A coluna respeita a largura.** Palavras seguidas caem de lados opostos, e
 * cada uma é empurrada para dentro da tela se o tamanho dela não couber na
 * coluna. Palavra que não cabe nem assim tem a letra reduzida.
 */

/** O tamanho da letra das palavras que caem, e a altura da linha dela. */
export const TAMANHO_DA_FONTE = 30;
export const ALTURA_DA_LINHA = 38;

/** Quanto a palavra tomba até o fim da queda, em graus. */
export const TOMBO = 9;

/**
 * A largura média de uma letra, em fração do tamanho da fonte.
 *
 * É uma estimativa, e com folga: medida no navegador, a letra média das
 * frases de hoje na fonte da faixa dá entre 0,50 e 0,55. Errar para mais só
 * afasta as palavras um pouco além do necessário; errar para menos é o que
 * deixaria duas se encostarem. O `testa-queda-da-composta` confere a conta
 * com esta estimativa.
 */
export const LARGURA_POR_LETRA = 0.62;

/** O menor atraso entre uma palavra e a seguinte, em fração da queda. */
export const ATRASO_MINIMO = 0.34;

/** Quanto sobra entre duas palavras no ar, na vertical, no pior caso. */
export const FOLGA = 10;

/** Quanto a palavra fica longe das bordas da tela, no mínimo. */
export const MARGEM = 16;

/**
 * Onde as palavras caem, em fração da largura. Pares à esquerda, ímpares à
 * direita — duas palavras seguidas nunca dividem o mesmo lado.
 *
 * Dentro de cada lado as posições variam, para a queda não virar duas
 * fileiras retas. Palavras do mesmo lado estão sempre a dois atrasos uma da
 * outra, no mínimo, e por isso não se encontram.
 */
const ESQUERDA = [0.3, 0.38, 0.33] as const;
const DIREITA = [0.67, 0.6, 0.7] as const;

export type PalavraDaQueda = {
  palavra: string;
  fonte: number;
  linha: number;
  /** Largura estimada, sem o tombo. */
  largura: number;
  /** Onde o centro dela cai, em pontos a partir da borda esquerda. */
  centro: number;
  /** Em que ponto do ciclo ela começa a cair, de 0 a 1. */
  inicio: number;
  /** Para que lado ela tomba: -1 ou 1. */
  lado: -1 | 1;
};

export type PlanoDaQueda = {
  palavras: PalavraDaQueda[];
  /** Quanto tempo uma palavra leva para cair inteira. */
  quedaMs: number;
  /** Quanto tempo entre uma palavra e a seguinte. */
  intervaloMs: number;
  /** Quanto tempo até a frase recomeçar. */
  cicloMs: number;
  /** A fração do ciclo em que cada palavra está no ar. */
  janela: number;
  /** O atraso usado, em fração da queda — ver `ATRASO_MINIMO`. */
  atraso: number;
};

const RADIANOS = (TOMBO * Math.PI) / 180;

/** O espaço que a palavra ocupa na vertical com o tombo inteiro. */
export function alturaTombada(largura: number, linha: number): number {
  return linha * Math.cos(RADIANOS) + largura * Math.sin(RADIANOS);
}

/** O espaço que a palavra ocupa na horizontal com o tombo inteiro. */
export function larguraTombada(largura: number, linha: number): number {
  return largura * Math.cos(RADIANOS) + linha * Math.sin(RADIANOS);
}

export function larguraEstimada(palavra: string, fonte: number): number {
  return palavra.length * fonte * LARGURA_POR_LETRA;
}

export function planejarQueda({
  palavras,
  larguraDaTela,
  distancia,
  velocidade,
}: {
  palavras: readonly string[];
  larguraDaTela: number;
  /** Quantos pontos a palavra percorre do alto até sumir na terra. */
  distancia: number;
  /** Pontos por segundo. */
  velocidade: number;
}): PlanoDaQueda {
  const n = Math.max(1, palavras.length);
  const cabe = larguraDaTela - MARGEM * 2;

  /* O tamanho de cada palavra — e a letra reduzida para a que não couber. */
  const medidas = palavras.map((palavra) => {
    let fonte = TAMANHO_DA_FONTE;
    let largura = larguraEstimada(palavra, fonte);
    if (larguraTombada(largura, ALTURA_DA_LINHA) > cabe) {
      fonte = (fonte * cabe) / larguraTombada(largura, ALTURA_DA_LINHA);
      largura = larguraEstimada(palavra, fonte);
    }
    const linha = (ALTURA_DA_LINHA * fonte) / TAMANHO_DA_FONTE;
    return { palavra, fonte, linha, largura };
  });

  /*
    O atraso sai da maior palavra, e não da média.

    Duas palavras no ar ao mesmo tempo estão a pelo menos um atraso uma da
    outra. Se esse atraso, em pontos, for maior que a altura da maior palavra
    tombada, nenhuma par pode se encostar — seja qual for a frase.
  */
  const maisAlta = Math.max(0, ...medidas.map((m) => alturaTombada(m.largura, m.linha)));
  const atraso = Math.min(1, Math.max(ATRASO_MINIMO, (maisAlta + FOLGA) / distancia));

  const quedaMs = Math.round((distancia / velocidade) * 1000);
  const intervaloMs = Math.round(quedaMs * atraso);
  /*
    O ciclo é o bastante para a frase se dizer uma vez. O piso existe para a
    frase curta: com duas palavras, o ciclo ficaria menor que a própria queda.
  */
  const cicloMs = Math.max(intervaloMs * n, quedaMs);

  const lista: PalavraDaQueda[] = medidas.map((m, i) => {
    const doLado = i % 2 === 0 ? ESQUERDA : DIREITA;
    const desejado = doLado[Math.floor(i / 2) % doLado.length] * larguraDaTela;
    const meia = larguraTombada(m.largura, m.linha) / 2;
    const centro = Math.min(larguraDaTela - MARGEM - meia, Math.max(MARGEM + meia, desejado));
    return {
      ...m,
      centro,
      inicio: (i * intervaloMs) / cicloMs,
      lado: i % 2 === 0 ? -1 : 1,
    };
  });

  return {
    palavras: lista,
    quedaMs,
    intervaloMs,
    cicloMs,
    janela: Math.min(1, quedaMs / cicloMs),
    atraso,
  };
}

/** Um valor em função do progresso da queda de uma palavra, de 0 a 1. */
export type Pontos = readonly (readonly [number, number])[];

/**
 * A opacidade de uma palavra ao longo da própria queda.
 *
 * Ela **entra** também, e não só sai. Sem a entrada, o primeiro quadro de
 * cada volta punha a palavra no alto já opaca, do nada — num laço isso é um
 * piscar a cada ciclo, sempre na mesma posição. Fica cheia do primeiro sétimo
 * até perto de dois terços do caminho, que é onde dá para ler.
 *
 * Mora aqui, e não na faixa, porque o teste precisa da mesma curva: é ela
 * que decide quando uma palavra conta como "no ar".
 */
export const OPACIDADE_NA_QUEDA: Pontos = [
  [0, 0],
  [0.14, 1],
  [0.62, 1],
  [1, 0],
];

/** O valor da curva num progresso qualquer, por interpolação linear. */
export function valorEm(pontos: Pontos, p: number): number {
  if (p <= pontos[0][0]) return pontos[0][1];
  for (let i = 1; i < pontos.length; i++) {
    const [p1, v1] = pontos[i];
    if (p <= p1) {
      const [p0, v0] = pontos[i - 1];
      return p1 === p0 ? v1 : v0 + ((v1 - v0) * (p - p0)) / (p1 - p0);
    }
  }
  return pontos[pontos.length - 1][1];
}

/**
 * A curva de uma palavra escrita em função do relógio, de 0 a 2.
 *
 * O relógio faz a primeira volta de 0 a 1 e depois repete de 1 a 2 para
 * sempre. As duas partes são diferentes numa coisa só: **na primeira volta,
 * a palavra não existe antes de começar**. Sem isso, as palavras que no
 * regime normal já estão caindo quando o ciclo recomeça apareceriam todas de
 * uma vez, no meio da queda, no instante em que a tela abre — que é o mesmo
 * defeito que isto veio consertar, visto de outro ângulo.
 *
 * De 1 a 2 a curva é periódica: o valor em 2 é igual ao valor em 1, e a
 * volta não tem emenda.
 *
 * Devolve o que o `interpolate` do `Animated` pede.
 */
export function curvaDaPalavra(
  inicio: number,
  janela: number,
  pontos: Pontos,
): { inputRange: number[]; outputRange: number[] } {
  const naJanela = (comeco: number) =>
    pontos.map(([p, v]) => [comeco + p * janela, v] as [number, number]);

  const antes = pontos[0][1];
  const depois = pontos[pontos.length - 1][1];

  /* O valor no relógio 1, que tem de ser o mesmo no relógio 2. */
  let naVolta: number;
  if (inicio + janela >= 1) {
    /* A palavra está no ar quando o ciclo vira: meio da queda. */
    naVolta = valorEm(pontos, (1 - inicio) / janela);
  } else {
    /* Está no intervalo entre cair e voltar a cair. */
    const vazio = 1 - janela;
    const quanto = vazio > 0 ? (1 - inicio - janela) / vazio : 0;
    naVolta = depois + (antes - depois) * quanto;
  }

  const lista: [number, number][] = [
    [0, antes],
    [inicio, antes],
    ...naJanela(inicio),
    ...naJanela(1 + inicio).filter(([t]) => t <= 2),
    [2, naVolta],
  ];

  /*
    Em ordem de relógio, sem passar de 2 — e o ponto em 1 garantido, para a
    volta começar exatamente de onde a primeira terminou.
  */
  const ordenada = lista
    .filter(([t]) => t >= 0 && t <= 2)
    .sort((a, b) => a[0] - b[0]);

  return {
    inputRange: ordenada.map(([t]) => t),
    outputRange: ordenada.map(([, v]) => v),
  };
}

/**
 * Lê uma curva num instante do relógio — do mesmo jeito que o `Animated` lê.
 *
 * Existe para o teste poder percorrer a animação sem animação nenhuma.
 */
export function lerCurva(curva: { inputRange: number[]; outputRange: number[] }, t: number): number {
  const { inputRange: e, outputRange: s } = curva;
  if (t <= e[0]) return s[0];
  for (let i = 1; i < e.length; i++) {
    if (t <= e[i]) {
      const t0 = e[i - 1];
      const t1 = e[i];
      return t1 === t0 ? s[i] : s[i - 1] + ((s[i] - s[i - 1]) * (t - t0)) / (t1 - t0);
    }
  }
  return s[s.length - 1];
}

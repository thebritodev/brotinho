/**
 * A física dos farelos de terra que se soltam quando o buraco da Frase do dia
 * se abre.
 *
 * ## O que eles fazem
 *
 * Soltam-se da borda do buraco, dão um pulinho para fora — terra empurrada —
 * e caem com gravidade até passar do fim da tela, por trás da barra de
 * navegação. Caem a tela **inteira**, de onde quer que o buraco esteja naquele
 * momento: a conta usa a posição dele na janela, medida na hora, e a altura da
 * camada em que os farelos são desenhados.
 *
 * ## Por que uma parábola amostrada, e não um `easing`
 *
 * A queda com gravidade é `y = y0 + v·t + ½·g·t²`, e com o pulinho inicial a
 * velocidade começa **para cima**: o farelo sobe um pouco, para, e desce
 * acelerando. Nenhum `easing` pronto descreve isso — `Easing.in(quad)` parte do
 * repouso. A curva é amostrada em pontos e vira um `interpolate`, que o driver
 * nativo anda sozinho: o farelo cai liso mesmo se o JavaScript travar.
 *
 * Fica aqui, separado do desenho, para o teste conferir que todo farelo nasce
 * na borda e termina abaixo do fim da tela — que é o que faz ele sumir por trás
 * da barra, e não no meio do caminho.
 */

/** Pontos por segundo ao quadrado. Rápido o bastante para ler como peso. */
export const GRAVIDADE = 1500;

/** Quanto além do fim da camada o farelo vai, para sair inteiro de vista. */
export const ALEM_DO_FIM = 24;

/** Quantos pontos a curva de queda tem. Mais pontos, parábola mais lisa. */
export const PONTOS_DA_QUEDA = 24;

/** O quanto o farelo fica longe das laterais da tela, no mínimo, até o fim. */
export const MARGEM_DA_BORDA = 6;

/**
 * Quantos farelos cada estágio da abertura solta.
 *
 * Crescem com o buraco: o primeiro estalo solta pouca terra, o último, que é
 * a boca se abrindo de vez, solta mais.
 */
export const FARELOS_POR_ETAPA = [7, 9, 12] as const;

export type Farelo = {
  /** Onde nasce, em pontos da camada. */
  x0: number;
  y0: number;
  /** Velocidade inicial, em pontos por segundo. `vy` negativo é para cima. */
  vx: number;
  vy: number;
  raio: number;
  /** Graus por segundo. */
  giro: number;
  /** Quanto tempo leva até passar do fim. */
  duracaoMs: number;
  /** Qual das três cores de terra. */
  tom: 0 | 1 | 2;
};

/**
 * Um sorteio repetível: a mesma semente dá sempre os mesmos farelos.
 *
 * É o mulberry32 — quatro linhas, sem dependência — e existe para o teste
 * poder conferir exatamente o que o app desenha.
 */
export function sorteio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Quanto tempo o farelo leva de `y0` até `fim`, partindo com `vy`. */
export function tempoAte(y0: number, vy: number, fim: number): number {
  const d = fim - y0;
  return (-vy + Math.sqrt(vy * vy + 2 * GRAVIDADE * Math.max(0, d))) / GRAVIDADE;
}

export function soltarFarelos({
  cx,
  cy,
  meiaLargura,
  meiaAltura,
  fim,
  largura,
  quantos,
  semente,
}: {
  /** O centro do buraco, em pontos da camada. */
  cx: number;
  cy: number;
  /** O tamanho do buraco naquele estágio. */
  meiaLargura: number;
  meiaAltura: number;
  /** A altura da camada: é daqui que o farelo tem de passar. */
  fim: number;
  /**
   * A largura da camada. O farelo tem de sumir **por baixo**, atrás da barra
   * de navegação — um que saísse pela lateral sumiria no meio do caminho.
   */
  largura: number;
  quantos: number;
  semente: number;
}): Farelo[] {
  const acaso = sorteio(semente);
  const entre = (a: number, b: number) => a + (b - a) * acaso();

  return Array.from({ length: quantos }, () => {
    /*
      Nasce num ponto da borda, qualquer um. O pulinho é para fora do buraco
      — na direção do raio — mais um empurrão para cima, que é o que faz a
      terra "espirrar" em vez de só escorrer.
    */
    const angulo = entre(0, Math.PI * 2);
    const x0 = cx + Math.cos(angulo) * (meiaLargura + 5);
    const y0 = cy + Math.sin(angulo) * (meiaAltura + 4);
    const forca = entre(28, 86);
    let vx = Math.cos(angulo) * forca + entre(-26, 26);
    const vy = Math.sin(angulo) * forca * 0.5 - entre(46, 128);
    const raio = entre(1.6, 3.8);
    const duracao = tempoAte(y0, vy, fim + ALEM_DO_FIM);

    /*
      Se a deriva o levaria para fora pela lateral antes de chegar embaixo,
      ela é encurtada para ele cair rente à borda. Só a velocidade de lado
      muda; a queda continua a mesma.
    */
    const margem = MARGEM_DA_BORDA;
    const chegada = x0 + vx * duracao;
    const dentro = Math.min(Math.max(chegada, margem), largura - margem);
    if (dentro !== chegada) vx = (dentro - x0) / duracao;

    return {
      x0,
      y0,
      vx,
      vy,
      raio,
      giro: entre(-260, 260),
      /* Para cima: arredondar para baixo pararia o farelo um tico antes do fim. */
      duracaoMs: Math.ceil(duracao * 1000),
      tom: Math.floor(acaso() * 3) as 0 | 1 | 2,
    };
  });
}

/**
 * A altura do farelo ao longo da queda, em pontos amostrados.
 *
 * `inputRange` em milissegundos desde que ele se soltou; depois do fim ele
 * fica parado abaixo da tela, fora de vista.
 */
export function curvaDaAltura(f: Farelo): { inputRange: number[]; outputRange: number[] } {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let k = 0; k <= PONTOS_DA_QUEDA; k++) {
    const t = (f.duracaoMs / 1000) * (k / PONTOS_DA_QUEDA);
    inputRange.push(Math.round(t * 1000 * 100) / 100);
    outputRange.push(f.y0 + f.vy * t + 0.5 * GRAVIDADE * t * t);
  }
  return { inputRange, outputRange };
}

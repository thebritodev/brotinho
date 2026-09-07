/**
 * O grão do papel do card do story.
 *
 * ## Por que um fundo liso não serve
 *
 * Porque ele denuncia que a imagem foi gerada. Um retângulo de cor chapada com
 * texto centralizado é o que qualquer aplicativo cospe; o que faz alguém querer
 * postar é a imagem parecer **impressa em alguma coisa**. Grão é o jeito mais
 * barato de dizer isso — não desenha nada, só tira a lisura.
 *
 * ## Por que os pontos são calculados, e não uma imagem de ruído
 *
 * Porque imagem de ruído seria mais um arquivo para carregar, e carregamento
 * assíncrono foi exatamente o que fez o logo sumir do card: quando a foto é
 * tirada, o arquivo ainda não chegou. O que é desenhado no mesmo quadro não tem
 * esse risco.
 *
 * ## Por que o sorteio tem semente
 *
 * Para a mesma frase gerar sempre o mesmo card. Se o grão fosse aleatório de
 * verdade, compartilhar duas vezes daria duas imagens diferentes — e alguém que
 * repostasse a mesma frase notaria que "mudou alguma coisa" sem saber o quê.
 * Com semente vinda do texto, cada frase tem o seu grão, e ele é sempre aquele.
 */

/**
 * Gerador linear congruente — o mesmo dos livros.
 *
 * `Math.random` não serve aqui justamente por ser bom demais: o que se quer é
 * uma sequência que pareça sorteada e seja sempre a mesma.
 */
function sorteio(semente: number) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

/** Uma semente estável a partir do texto. */
function sementeDe(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type Grao = { x: number; y: number; r: number; o: number };

/**
 * Quantos pontos de grão.
 *
 * Cada ponto é um elemento de SVG, e o card inteiro é desenhado e fotografado
 * numa tacada. Mil pontos dariam um grão bonito e um card que demora; cento e
 * oitenta somem individualmente e aparecem no conjunto, que é o que se quer de
 * uma textura.
 */
const QUANTOS = 180;

export function graosDoCard(texto: string, largura: number, altura: number): Grao[] {
  const proximo = sorteio(sementeDe(texto));
  const graos: Grao[] = [];
  for (let i = 0; i < QUANTOS; i += 1) {
    graos.push({
      x: Math.round(proximo() * largura),
      y: Math.round(proximo() * altura),
      r: 1.4 + proximo() * 2.6,
      // Baixo de propósito: grão que se vê ponto a ponto virou sujeira.
      o: 0.03 + proximo() * 0.05,
    });
  }
  return graos;
}

/**
 * As manchas largas e apagadas que dão profundidade ao fundo.
 *
 * Papel de verdade não tem a mesma cor em toda a folha. Três círculos enormes
 * com gradiente quase invisível fazem a luz variar pelo cartaz, e é isso que
 * separa "fundo" de "retângulo pintado".
 */
export const MANCHAS = [
  { cx: 0.22, cy: 0.24, r: 0.52, o: 0.05 },
  { cx: 0.84, cy: 0.62, r: 0.46, o: 0.04 },
  { cx: 0.5, cy: 0.95, r: 0.55, o: 0.035 },
];

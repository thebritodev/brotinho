/**
 * Quebra a frase em linhas para o card do story.
 *
 * ## Por que isto existe, se o React Native quebra texto sozinho
 *
 * Porque o card deixou de ser feito de componentes e passou a ser um SVG. E
 * `<Text>` de SVG **não quebra linha**: ele desenha tudo numa linha só, e o que
 * passa da borda simplesmente sai da imagem.
 *
 * A troca aconteceu porque a alternativa — fotografar componentes de verdade
 * com o `react-native-view-shot` — dependia de um módulo nativo que não subia no
 * aparelho. Duas builds e uma tarde depois, a conclusão foi tirar a dependência
 * do caminho: o `react-native-svg` já está em todos os binários do app desde
 * sempre, e exporta PNG sozinho. O preço é este arquivo.
 *
 * ## Como as larguras são estimadas
 *
 * Sem poder medir a fonte no aparelho, cada caractere entra com uma largura em
 * *ems* — a proporção dele em relação ao corpo da letra. Os valores vêm da
 * Baloo 2, que é a fonte do card, e são deliberadamente **generosos**: numa
 * escolha entre quebrar uma linha antes da hora e deixar a frase vazar pela
 * borda da imagem, a primeira só fica um pouco menos bonita.
 *
 * Não é chute cego: `scripts/confere-story.js` renderiza as vinte frases e mede
 * a largura real de cada linha com a fonte de verdade. Se alguma passar da
 * caixa, o teste quebra.
 */

/** Largura de cada caractere em ems. O resto do alfabeto cai no padrão. */
const LARGURAS: Record<string, number> = {
  ' ': 0.26,
  i: 0.26, í: 0.26, l: 0.26, j: 0.28, t: 0.34, f: 0.32, r: 0.36,
  I: 0.3, J: 0.4, '.': 0.26, ',': 0.26, ':': 0.26, ';': 0.26, '!': 0.28,
  '“': 0.34, '”': 0.34, "'": 0.2, '-': 0.32, '?': 0.42,
  m: 0.82, w: 0.7, M: 0.82, W: 0.86,
  A: 0.6, B: 0.58, C: 0.58, D: 0.62, E: 0.54, F: 0.52, G: 0.62, H: 0.62,
  K: 0.58, L: 0.5, N: 0.64, O: 0.66, P: 0.56, Q: 0.66, R: 0.58, S: 0.54,
  T: 0.54, U: 0.62, V: 0.6, X: 0.58, Y: 0.56, Z: 0.54,
};

const PADRAO = 0.53;

/** Largura do texto em pixels, para um dado corpo de letra. */
export function larguraDoTexto(texto: string, corpo: number): number {
  let ems = 0;
  for (const c of texto) ems += LARGURAS[c] ?? PADRAO;
  return ems * corpo;
}

/**
 * Quebra em linhas que caibam em `larguraMax`.
 *
 * Palavra que sozinha não cabe fica na própria linha e transborda, em vez de
 * ser partida no meio. Nenhuma frase do repertório chega perto disso — a maior
 * palavra é "responsabilidade" —, e partir palavra em cartaz é pior do que uma
 * linha um pouco larga.
 */
export function quebrarEmLinhas(texto: string, larguraMax: number, corpo: number): string[] {
  const linhas: string[] = [];
  let atual = '';

  for (const palavra of texto.split(/\s+/).filter(Boolean)) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (atual && larguraDoTexto(tentativa, corpo) > larguraMax) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/**
 * A caixa em que a frase cabe no card, e o colchão que a estimativa ganha.
 *
 * A caixa é o desenho: 820 de 1080, com 130 de margem de cada lado. A folga
 * existe porque a largura aqui é **estimada**, não medida — quebrar a 780 deixa
 * quarenta pixels de erro permitido antes de qualquer coisa encostar na borda.
 *
 * Sem ela, a frase mais larga do repertório fechava com treze pixels de sobra.
 * Cabia, e cabia por sorte: a primeira frase nova com dois "m" a mais vazaria, e
 * o estrago só apareceria na imagem que alguém já postou.
 */
export const LARGURA_DA_CAIXA = 820;
export const FOLGA = 40;

/**
 * O corpo da frase encolhe quando ela é longa.
 *
 * Uma frase de 60 caracteres pede corpo grande para não boiar no cartaz; uma de
 * 150 pede corpo menor para não virar um paredão. A conta é sobre o texto
 * **com** as aspas, que é o que de fato vai na imagem.
 */
export function corpoDaFrase(texto: string): number {
  const n = texto.length + 2;
  if (n <= 80) return 74;
  if (n <= 120) return 66;
  return 58;
}

/** As linhas prontas para o card. Um lugar só, para o teste medir o mesmo. */
export function linhasDaFrase(frase: string, corpo: number): string[] {
  return quebrarEmLinhas(frase, LARGURA_DA_CAIXA - FOLGA, corpo);
}

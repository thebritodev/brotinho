import type { View } from 'react-native';

import type { ResultadoDoCompartilhar } from './compartilharFrase';

/**
 * Na web, compartilhar a frase não existe — e este arquivo existe para que a
 * web **nem carregue** o código que faria isso.
 *
 * ## O que aconteceu sem ele
 *
 * O `react-native-view-shot` tem uma implementação web que depende do
 * `html2canvas`. Esse pacote entra como dependência de segunda mão, veio sem o
 * `dist/` e o Metro não conseguiu resolver — resultado: **o bundle web inteiro
 * parava de compilar**, com erro 500 e tela branca.
 *
 * O estrago não era só meu. A web deste projeto não é um produto: é a máquina
 * que gera as capturas de tela da App Store, via `scripts/capturas.js`. Um
 * import quebrado aqui derruba a esteira de publicação, e derruba em silêncio —
 * a próxima pessoa a gerar capturas só descobriria olhando uma tela branca.
 *
 * ## Por que um arquivo `.web.ts`, e não um `if (Platform.OS === 'web')`
 *
 * Porque o `if` roda tarde demais. O Metro resolve os `import`/`require` ao
 * montar o pacote, muito antes de existir um `Platform` para consultar — então
 * uma guarda de tempo de execução não impede o módulo de ser incluído nem o
 * erro de resolução de acontecer. Só a resolução por plataforma resolve: na
 * web o Metro escolhe este arquivo, e o outro, com o `view-shot` dentro, nunca
 * é lido.
 */
export async function compartilharFrase(
  _alvo: React.RefObject<View | null>,
): Promise<ResultadoDoCompartilhar> {
  return { tipo: 'sem-compartilhamento' };
}

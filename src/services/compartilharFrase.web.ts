import type Svg from 'react-native-svg';

import type { ResultadoDoCompartilhar } from './compartilharFrase';

/**
 * Na web, compartilhar a frase não existe — e este arquivo existe para que a
 * web **nem carregue** o código que faria isso.
 *
 * ## Por que não basta a guarda que já existe do outro lado
 *
 * O arquivo nativo também devolve `sem-compartilhamento` quando roda na web,
 * mas essa guarda roda tarde: o Metro resolve os `import` ao montar o pacote,
 * muito antes de existir um `Platform` para consultar. Então tudo que aquele
 * arquivo importa — sistema de arquivos, folha de compartilhar do sistema,
 * exportação de PNG — entra no pacote da web de qualquer jeito, só para nunca
 * ser chamado. Já foi pior que peso morto: na versão que fotografava a tela com
 * o `react-native-view-shot`, a implementação web dele puxava um `html2canvas`
 * que o Metro não resolvia, e **o pacote web inteiro parava de compilar**.
 *
 * ## Por que isso importa num app que não tem web
 *
 * A web deste projeto não é um produto: é a máquina que gera as capturas de
 * tela da App Store, via `scripts/capturas.js`. Um import quebrado aqui derruba
 * a esteira de publicação, e derruba em silêncio — a próxima pessoa a gerar
 * capturas só descobriria olhando uma tela branca.
 */
export async function compartilharFrase(
  _alvo: React.RefObject<Svg | null>,
): Promise<ResultadoDoCompartilhar> {
  return { tipo: 'sem-compartilhamento' };
}

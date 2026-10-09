import { Platform } from 'react-native';

/**
 * "Não achate esta `View`" — para as que existem só para serem medidas.
 *
 * ## O que ela resolve no aparelho
 *
 * O Android achata `View` sem conteúdo: uma caixa vazia, usada como âncora
 * para descobrir onde um ponto da tela está, pode simplesmente não existir na
 * árvore nativa, e a medida devolve zero. `collapsable={false}` é o que diz ao
 * sistema para mantê-la. Três lugares precisam disso — a âncora do buraco da
 * frase, a raiz da chuva de farelos e a moldura do broto na aba dele.
 *
 * ## O que ela resolve no navegador
 *
 * O `react-native-web` não conhece `collapsable` e deixa a propriedade chegar
 * ao DOM, onde o React recusa: *"Received `false` for a non-boolean attribute
 * `collapsable`"*. Dois erros de console por carregamento da tela inicial, num
 * app que não tem nenhum outro — e erro de console que vira paisagem é erro
 * que deixa de ser lido.
 *
 * Como a propriedade **só** tem efeito no Android, a saída é não mandá-la nas
 * outras plataformas. Espalhada, e não passada como `undefined`, porque
 * `collapsable={undefined}` continua sendo uma propriedade entregue ao
 * componente — e o que se quer é que ela não exista.
 *
 * Uso: `<View ref={...} {...NAO_ACHATAR} />`
 */
export const NAO_ACHATAR = Platform.OS === 'android' ? ({ collapsable: false } as const) : {};

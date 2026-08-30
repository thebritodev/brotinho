/**
 * Os valores pessoais e seus nomes.
 *
 * Moram aqui, e não junto do `ValueBadge`, porque `state/derived.ts` precisa
 * escrever o nome de um valor numa frase de padrão — e `derived` roda em Node
 * puro nos testes, sem React. Importar um componente para pegar um rótulo
 * arrastaria a árvore inteira do React para dentro do teste.
 *
 * O ícone e a cor continuam no componente: aquilo é desenho, isto é conteúdo.
 */

export type ValueKey = 'criatividade' | 'conexao' | 'coragem' | 'autocuidado' | 'curiosidade';

export const ROTULO_DO_VALOR: Record<ValueKey, string> = {
  criatividade: 'Criatividade',
  conexao: 'Conexão',
  coragem: 'Coragem',
  autocuidado: 'Autocuidado',
  curiosidade: 'Curiosidade',
};

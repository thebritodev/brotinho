/**
 * A flor de "Sem rodeios", em números.
 *
 * Mora fora dos dois componentes que a desenham porque são dois: a animação do
 * `Desenterrar`, na tela, e a ilustração do card de story, que vira imagem e sai
 * do aparelho. Se cada um tivesse a sua cópia dos caminhos, a flor que a pessoa
 * posta no Instagram deixaria de ser a flor que ela viu abrir — e ninguém
 * perceberia até muito depois, porque as duas continuariam bonitas separadas.
 *
 * Segue o mesmo motivo do `geometriaDoBroto.ts`, que já existe pelo mesmo tipo
 * de razão.
 *
 * O desenho vive num quadrado de 120 × 120.
 */

/** Uma pétala, com a base no ponto em que todas se encontram. */
export const PETALA = 'M60 70 C 48 60, 45 44, 60 26 C 75 44, 72 60, 60 70 Z';

/** O ponto de encontro das pétalas — o eixo de rotação de todas. */
export const EIXO = { x: 60, y: 70 };

/**
 * Os mesmos cinco ângulos, duas aberturas.
 *
 * Cinco, e não quatro: com um número par não há pétala no eixo, e a flor fica
 * com um vinco no meio em vez de um centro.
 */
export const ENTREABERTO = [-30, -15, 0, 15, 30];
export const ABERTO = [-76, -38, 0, 38, 76];

/** O miolo aceso fica aqui, e não no encontro das pétalas: um pouco acima. */
export const MIOLO = { cx: 60, cy: 60 };

/** O caule curto que sai de baixo da flor. */
export const CAULE = 'M60 92 L60 62';

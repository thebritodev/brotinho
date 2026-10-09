import React, { createContext, useContext, useMemo } from 'react';

import { ESPECIES, ESPECIE_PADRAO, type EspecieKey, type TintaDaEspecie } from '../../data/especies';

/**
 * Qual espécie o broto é **agora** — para o desenho inteiro saber sem ser
 * avisado.
 *
 * ## Por que um contexto, e não uma propriedade
 *
 * Porque o `Sprout` é desenhado em mais de quarenta lugares: a cena da aba, o
 * cartão da Composta, o retrato do cabeçalho, as ilustrações das práticas, o
 * jardim, a comemoração, a Composta inteira. Passar a espécie por propriedade
 * em todos eles seria quarenta oportunidades de esquecer um — e o esquecido
 * não quebra nada: ele desenha um broto verde no meio de um app de lavandas,
 * que é o pior tipo de defeito, o que só aparece para quem está usando.
 *
 * ## Por que não no tema
 *
 * Caberia: `TemaProvider` já envolve o app e o `Sprout` já chama `useTema`.
 * Mas `tracos` existe exatamente para **o desenho não seguir o tema** — está
 * escrito lá, por extenso. Enfiar a espécie no tema juntaria de novo as duas
 * coisas que aquele arquivo separou de propósito, e a próxima pessoa a ler
 * acharia que a cor do personagem muda com o modo escuro.
 *
 * ## O custo
 *
 * Um `useContext` por `Sprout` montado, num valor que muda **uma vez a cada
 * vinte e um dias**. Não há risco do defeito de `travada-na-troca-de-tela`:
 * aquele vem de ler estado que muda a cada toque dentro do corpo de uma tela;
 * aqui o valor é estável por três semanas, e a troca acontece numa tela
 * modal, parada.
 */
const EspecieContext = createContext<EspecieKey>(ESPECIE_PADRAO);

export function EspecieProvider({
  especie,
  children,
}: {
  especie: EspecieKey;
  children: React.ReactNode;
}) {
  /* O valor é uma chave, não um objeto: memorizar não tem o que economizar. */
  const valor = useMemo(() => especie, [especie]);
  return <EspecieContext.Provider value={valor}>{children}</EspecieContext.Provider>;
}

/** A espécie de agora. Fora do provedor, a padrão — nada quebra. */
export function useEspecieDoBroto(): EspecieKey {
  return useContext(EspecieContext);
}

/**
 * Os tons de um broto: os da espécie pedida, ou os da espécie de agora.
 *
 * A propriedade ganha do contexto porque há dois lugares que precisam
 * desenhar uma espécie que **não** é a de agora: a tela de escolha, que mostra
 * as três lado a lado, e o jardim, onde cada planta guardada continua sendo o
 * que era quando amadureceu.
 */
export function useTintaDoBroto(especie?: EspecieKey): TintaDaEspecie {
  const deAgora = useEspecieDoBroto();
  return ESPECIES[especie ?? deAgora].tinta;
}

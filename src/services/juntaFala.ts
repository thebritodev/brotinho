/**
 * Emenda os pedaços que o reconhecimento de fala entrega em partes.
 *
 * ## O que estava errado
 *
 * Em modo contínuo, o reconhecedor do Android **não** manda o texto acumulado.
 * Ele fecha um trecho a cada pausa — evento `result` com `isFinal: true` — e
 * recomeça do zero no trecho seguinte. O ditado do diário guardava só o último
 * evento, então falar, pausar e voltar a falar apagava tudo o que já estava
 * escrito e começava de novo.
 *
 * Num app onde a pessoa está desabafando, perder o que ela acabou de dizer é a
 * pior forma de falhar — e ela só descobre depois de já ter falado.
 *
 * ## Por que isto é um arquivo, e não três linhas dentro do gancho
 *
 * Para ser testável. O `services/speech.ts` chama `requireOptionalNativeModule`
 * no corpo do módulo, e aquilo não roda fora do aparelho; o `useVoiceNote` é um
 * gancho de React cheio de efeitos. Aqui é uma função pura: entra o estado e o
 * evento, sai o estado novo. É nela que mora a regra que estava quebrada, e é
 * ela que o `testa-junta-fala` percorre com a sequência real de eventos de uma
 * fala com pausa no meio.
 */

/**
 * O que já foi ouvido, separado em duas partes.
 *
 * `fechados` são os trechos que o reconhecedor deu por encerrados e não vai
 * mais corrigir. `emCurso` é a frase que ele ainda está ouvindo, e que ele
 * reescreve inteira a cada palavra nova — por isso ela substitui, enquanto os
 * fechados somam.
 */
export type FalaAteAgora = {
  fechados: string;
  emCurso: string;
};

export const FALA_VAZIA: FalaAteAgora = { fechados: '', emCurso: '' };

/**
 * Junta dois pedaços de fala com um espaço, sem sobra nas pontas.
 *
 * Espaço simples basta: o reconhecimento roda com `addsPunctuation`, então cada
 * trecho fechado já vem com o ponto dele e o seguinte já vem com maiúscula.
 * Emendar sem espaço grudaria as frases.
 *
 * Aceita vazio dos dois lados sem inventar espaço solto — o começo da gravação
 * passa por aqui com tudo vazio, e uma sobra de espaço apareceria no registro.
 */
export function juntarTrechos(ateAgora: string, novo: string): string {
  const antes = ateAgora.trim();
  const depois = novo.trim();
  if (!antes) return depois;
  if (!depois) return antes;
  return `${antes} ${depois}`;
}

/** Tudo o que foi ouvido até agora, pronto para mostrar ou para guardar. */
export function textoDaFala(fala: FalaAteAgora): string {
  return juntarTrechos(fala.fechados, fala.emCurso);
}

/**
 * Aplica um evento `result` ao que já foi ouvido.
 *
 * Trecho **fechado** entra no acumulado e sai do caminho. Trecho **em curso**
 * substitui o anterior em curso, porque os dois são a mesma frase sendo
 * corrigida — somar ali repetiria cada palavra a cada correção.
 *
 * Evento sem texto nenhum não mexe em nada: o Android manda alguns desses ao
 * abrir e ao fechar o microfone, e deixá-los passar zeraria o `emCurso` de uma
 * frase que ainda está sendo dita.
 */
export function somarFala(
  fala: FalaAteAgora,
  evento: { isFinal?: boolean; trecho: string },
): FalaAteAgora {
  const trecho = evento.trecho.trim();
  if (!trecho) return fala;

  if (evento.isFinal) {
    return { fechados: juntarTrechos(fala.fechados, trecho), emCurso: '' };
  }
  return { ...fala, emCurso: trecho };
}

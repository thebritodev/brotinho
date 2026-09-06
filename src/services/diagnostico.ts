import { NativeModules } from 'react-native';

/**
 * Um canal de log de mão única, do aparelho para quem está desenvolvendo.
 *
 * ## Por que não o console
 *
 * O `console.log` do aparelho viaja pelo depurador que o Metro publica, e o
 * Expo CLI já ocupa esse depurador para imprimir no terminal dele. Quem tenta
 * ouvir por fora é desconectado no mesmo instante — e num aparelho de teste
 * que não é o do desenvolvedor, esse terminal pode estar em outra máquina.
 *
 * ## Como funciona
 *
 * Isto pede ao servidor do Metro uma URL que não existe. Ela dá 404, e é o que
 * se quer: o corpo da resposta não interessa. O que interessa é que o **túnel**
 * registra a requisição, e quem está do outro lado lê a lista de URLs pedidas.
 * O caminho da URL é a mensagem.
 *
 * ## O que nunca passa por aqui
 *
 * Nada que a pessoa escreveu ou disse. O texto do diário e a frase da Composta
 * não saem do aparelho — essa é uma decisão de produto, não uma preferência, e
 * uma ferramenta de diagnóstico não é motivo para abrir exceção. O que sobe são
 * códigos de erro, contagens e números do medidor.
 *
 * ## Só em desenvolvimento
 *
 * `__DEV__` é falso no app publicado, e aí toda chamada aqui é um `return` — a
 * URL nem chega a ser montada.
 */

/** O endereço do servidor de desenvolvimento, tirado da URL do próprio bundle. */
function servidor(): string | null {
  const url = (NativeModules as { SourceCode?: { scriptURL?: string } }).SourceCode?.scriptURL;
  if (!url) return null;
  const m = /^(https?:\/\/[^/]+)/.exec(url);
  return m ? m[1] : null;
}

export function relatar(evento: string, detalhe?: string | number): void {
  if (!__DEV__) return;
  const base = servidor();
  if (!base) return;
  const parte = detalhe === undefined ? '' : `/${encodeURIComponent(String(detalhe))}`;
  // Sem `await` e sem tratar a resposta: isto não pode atrasar nem quebrar
  // nada do que está sendo diagnosticado.
  void fetch(`${base}/__diag/${encodeURIComponent(evento)}${parte}`).catch(() => {});
}

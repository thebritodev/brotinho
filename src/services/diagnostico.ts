import Constants from 'expo-constants';
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

/**
 * O endereço do servidor de desenvolvimento.
 *
 * São três tentativas, em ordem de confiabilidade, e a primeira versão disto
 * usava só a última — que é justamente a que não funciona aqui. Na arquitetura
 * nova do React Native o `SourceCode` deixou de aparecer em `NativeModules` e
 * virou um TurboModule; o objeto vinha vazio, `servidor()` devolvia `null`, e
 * cada chamada de `relatar` saía calada. Uma sessão inteira de diagnóstico não
 * relatou nada, e não havia como distinguir isso de "o código não rodou".
 *
 * `getDevServer` é a função que o próprio React Native usa para isto, e ela lê
 * o TurboModule certo nas duas arquiteturas.
 */
function servidor(): string | null {
  /*
    O `hostUri` vem antes do `getDevServer`, e a ordem importa.

    `getDevServer` devolve o endereco de onde **este bundle** foi baixado, e o
    Metro monta esse endereco a partir do Host de quem pediu. Um pedido feito da
    propria maquina (um `curl` de diagnostico, por exemplo) faz o bundle sair
    carimbado com `127.0.0.1` -- e ai o aparelho tenta falar consigo mesmo, o
    `fetch` morre calado, e o canal fica mudo sem nada indicar isso.

    `Constants.expoConfig.hostUri` e o endereco do servidor de desenvolvimento
    como o **manifesto** o declara: num tunel, o `exp.direct`. E o que o
    aparelho consegue alcancar.
  */
  const host = Constants.expoConfig?.hostUri;
  if (host) return host.startsWith('http') ? host : `http://${host}`;

  try {
    const { url, bundleLoadedFromServer } = (
      require('react-native/Libraries/Core/Devtools/getDevServer') as {
        default: () => { url: string; bundleLoadedFromServer: boolean };
      }
    ).default();
    if (bundleLoadedFromServer && url) return url.replace(/\/$/, '');
  } catch {
    // Caminho interno do React Native: se um dia mudar, as outras tentativas
    // continuam valendo.
  }

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

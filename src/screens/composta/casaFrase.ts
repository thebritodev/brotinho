/**
 * Confere se o que a pessoa falou é mesmo a frase que ela escreveu.
 *
 * O portão acústico do `useCompostSession` só sabe dizer se houve som com jeito
 * de voz. Falar "vou comprar pão" contava igual a repetir o pensamento — e o
 * exercício inteiro depende de repetir *aquela* frase até ela perder o peso.
 *
 * ---
 *
 * **Por que não comparar texto com texto.** O reconhecimento erra, e erra de
 * formas previsíveis: come o "não", troca singular por plural, devolve "pra"
 * onde a pessoa escreveu "para". Exigir igualdade exata faria o contador travar
 * com a pessoa fazendo tudo certo — e quem está compostando um pensamento
 * difícil não merece brigar com um contador.
 *
 * São três regras, e cada uma existe porque a simulação pegou um caso real:
 *
 * 1. **Maioria das palavras.** Normaliza os dois lados, ignora acento e
 *    pontuação, e conta quando a janela do que foi dito traz a maior parte das
 *    palavras do alvo. Não exige ordem: quem repete uma frase decorada às vezes
 *    troca a ordem sem perceber.
 *
 * 2. **A palavra-chave é obrigatória.** Só a maioria não bastava: em "vai dar
 *    tudo errado", falar "vai dar tudo *certo*" acertava três de quatro e
 *    contava — sendo o oposto. A palavra mais longa do alvo costuma ser a que
 *    carrega o sentido ("errado", "demitido", "fraco"), e sem ela não conta.
 *
 * 3. **Erro de flexão não derruba.** Palavras de cinco letras ou mais casam
 *    pelo começo, então "demitida" vale por "demitido" e "contas" por "conta",
 *    mas "certo" não vale por "errado" nem "forte" por "fraco".
 */

/**
 * Quanto do alvo precisa aparecer para contar como uma repetição.
 *
 * Começou em 0,6 e estava frouxo: em "não vou dar conta" bastavam duas
 * palavras, então "não vou" já contava, e a frase inteira contava **duas**
 * vezes — casava em "não vou", zerava, e casava de novo em "dar conta".
 */
const LIMIAR = 0.75;

/** Nunca aceita menos que isto, por mais curto que seja o alvo. */
const MINIMO_ABSOLUTO = 2;

/** A partir deste tamanho, duas palavras casam pelo começo. */
const TAMANHO_PARA_PREFIXO = 5;

/**
 * Palavras curtas demais casam por acidente com qualquer coisa. Ficam de fora
 * do alvo — mas só quando sobra alvo suficiente sem elas.
 */
const CURTAS = new Set(['a', 'o', 'e', 'de', 'da', 'do', 'em', 'um', 'uma', 'que', 'se']);

/** Minúsculas, sem acento, sem pontuação, em lista de palavras. */
export function palavras(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** As palavras do alvo que valem a pena procurar, sem repetidas. */
export function palavrasDoAlvo(alvo: string): string[] {
  const todas = [...new Set(palavras(alvo))];
  const fortes = todas.filter((p) => !CURTAS.has(p));
  // "e se eu não der conta" fica com quatro palavras fortes; já "que se dane"
  // ficaria com uma só, e aí é melhor manter tudo.
  return fortes.length >= 2 ? fortes : todas;
}

/** Iguais, ou longas o bastante para casarem pelo começo. */
export function mesmaPalavra(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < TAMANHO_PARA_PREFIXO || b.length < TAMANHO_PARA_PREFIXO) return false;
  return a.slice(0, TAMANHO_PARA_PREFIXO) === b.slice(0, TAMANHO_PARA_PREFIXO);
}

/** A que carrega o sentido: a mais longa, e na dúvida a última. */
export function palavraChave(alvoPalavras: string[]): string {
  return alvoPalavras.reduce((maior, p) => (p.length >= maior.length ? p : maior), '');
}

export type Conferidor = {
  /**
   * Recebe a transcrição acumulada e devolve quantas repetições **novas**
   * apareceram desde a última chamada.
   */
  conferir: (transcricao: string) => number;
  /** Quantas palavras do alvo precisam aparecer. Útil para explicar e testar. */
  minimo: number;
  /** A palavra sem a qual nada conta. */
  chave: string;
};

export function criarConferidor(alvo: string): Conferidor {
  const alvoPalavras = palavrasDoAlvo(alvo);
  const chave = palavraChave(alvoPalavras);
  const minimo = Math.max(MINIMO_ABSOLUTO, Math.ceil(alvoPalavras.length * LIMIAR));

  /**
   * Até onde a transcrição já foi contada. O reconhecimento entrega o texto
   * inteiro a cada evento, crescendo — sem isto, a mesma repetição seria
   * contada de novo a cada palavra nova que chegasse.
   */
  let consumidas = 0;

  /** A janela nunca precisa ser muito maior que o alvo. */
  const maxJanela = alvoPalavras.length * 2 + 2;

  const casaAlgumaDoAlvo = (dita: string) => alvoPalavras.find((p) => mesmaPalavra(p, dita));

  return {
    minimo,
    chave,
    conferir(transcricao) {
      const ditas = palavras(transcricao);

      // Resultados parciais são revistos, e às vezes encolhem. Quando isso
      // acontece, o índice antigo não vale mais.
      if (ditas.length < consumidas) consumidas = 0;

      let repeticoes = 0;
      let janela: string[] = [];

      for (let i = consumidas; i < ditas.length; i++) {
        janela.push(ditas[i]);
        if (janela.length > maxJanela) janela.shift();

        const acertadas = alvoPalavras.filter((p) => janela.some((d) => mesmaPalavra(p, d)));
        const temChave = acertadas.some((p) => p === chave);

        if (acertadas.length >= minimo && temChave) {
          repeticoes += 1;

          /**
           * O casamento fecha antes de a frase acabar, e a cauda que sobra
           * entraria na próxima repetição, disparando cedo. Então engole também
           * as palavras seguintes que ainda são do alvo.
           *
           * **Mas só as que ainda não foram usadas nesta repetição.** Sem essa
           * trava, "vou ser demitido vou ser demitido vou ser demitido" era
           * engolido inteiro de uma vez e contava 1 em vez de 3: a palavra
           * repetida é justamente o sinal de que a próxima repetição começou.
           */
          const usadas = new Set(acertadas);
          let fim = i;
          while (fim + 1 < ditas.length) {
            const alvoDaProxima = casaAlgumaDoAlvo(ditas[fim + 1]);
            if (!alvoDaProxima || usadas.has(alvoDaProxima)) break;
            usadas.add(alvoDaProxima);
            fim += 1;
          }

          consumidas = fim + 1;
          i = fim;
          janela = [];
        }
      }

      return repeticoes;
    },
  };
}

/**
 * A frase que a pessoa vai **buscar**.
 *
 * ## Por que esta voz é diferente de todas as outras do app
 *
 * O repertório inteiro do Brotinho foi levantado antes de este arquivo
 * existir: saudação, lembretes, começos de diário, resposta do broto. São mais
 * de cem frases e **nenhuma manda na pessoa**. Elas perguntam ("O que está
 * pesando antes de o dia começar?"), oferecem ("Se quiser, tem isto para a
 * ansiedade") ou tiram cobrança ("Não precisa estar bem para começar").
 *
 * As daqui mandam. *Pare. Chega. Não acredite.* É uma segunda voz dentro do
 * app, e ela só se sustenta por causa de uma diferença que não é de tom — é de
 * quem começou a conversa:
 *
 * > **Tudo no Brotinho vem até a pessoa. Isto ela vai pegar.**
 *
 * A saudação aparece, o lembrete chega, o broto responde depois que ela
 * escreve. Isto aqui não acontece se ela não tocar. E é o toque que autoriza o
 * tom: "chega de tentar controlar tudo" chegando como notificação às nove da
 * noite é crueldade; a mesma frase, quando ela foi lá pedir, é um amigo
 * respondendo o que ela perguntou.
 *
 * Daí as duas regras que não se negociam:
 *
 * 1. **Nunca aparece sozinho.** Não vira notificação, não vira lembrete, não
 *    aparece na Home sem toque. Se um dia alguém quiser reaproveitar estas
 *    frases em algum lugar que a pessoa não pediu, a resposta é não — o que
 *    torna a frase aceitável é justamente ela ter sido pedida.
 * 2. **Ataca o mecanismo, nunca a pessoa.**
 *
 * ## A régua da segunda regra
 *
 * Das três frases que originaram o recurso, a melhor é a terceira:
 *
 * > "Não acredite em tudo que a sua ansiedade te conta. Ela sempre vai te
 * > mostrar o pior cenário antes do mais provável."
 *
 * Ela mira **o funcionamento da cabeça** — como a ansiedade ordena os
 * cenários. As outras duas miram o comportamento de quem lê, e num dia ruim
 * "chega de sofrer" chega como *a culpa é sua*.
 *
 * Toda frase nova passa por aqui: **o sujeito duro da frase é um mecanismo**
 * (a ansiedade, a culpa, a comparação, a ruminação, a indecisão), não a pessoa.
 * A pessoa é quem recebe a informação sobre o mecanismo — nunca a ré.
 *
 * O corolário é que nem toda frase precisa ser dura. Um repertório só de
 * cobrança cansa em uma semana; algumas destas tiram peso em vez de pôr, e é
 * essa mistura que faz o conjunto durar.
 *
 * ## Por que só vinte
 *
 * Porque vinte é o que dá para escrever bem de uma vez, e o recurso precisa ser
 * usado alguns dias antes de valer a pena escrever oitenta. Vinte frases, uma
 * por dia, sem repetir: vinte dias. Antes disso já se sabe se presta.
 */

export type Conselho = {
  /** Fixo para sempre: é por ele que o histórico sabe o que já foi mostrado. */
  id: string;
  texto: string;
};

/**
 * As três primeiras são do Pedro, palavra por palavra — são a referência de
 * voz, e é delas que as outras dezessete tiram o sotaque.
 */
export const CONSELHOS: Conselho[] = [
  {
    id: 'pessoas-nao-sao-voce',
    texto:
      'Pare de esperar que as pessoas sejam como você. Elas não são, e quanto antes você entender isso, menos você sofre.',
  },
  {
    id: 'prever-evitar-controlar',
    texto:
      'Chega de sofrer tentando prever, evitar e controlar tudo. Tem coisa que vai acontecer independente de você. Faça a SUA parte.',
  },
  {
    id: 'ansiedade-mente',
    texto:
      'Não acredite em tudo que a sua ansiedade te conta. Ela sempre vai te mostrar o pior cenário antes do mais provável.',
  },
  {
    id: 'ensaiar-nao-e-resolver',
    texto:
      'Sua cabeça chama de resolver o que na verdade é ensaiar. Ensaiar uma conversa vinte vezes não te prepara: só te faz viver ela vinte vezes.',
  },
  {
    id: 'descanso-nao-e-premio',
    texto: 'Cansaço não é preguiça e descanso não é prêmio. Você não precisa merecer parar.',
  },
  {
    id: 'vontade-vem-depois',
    texto:
      'A vontade vem depois de começar, não antes. Esperar dar vontade é esperar uma coisa que só nasce do movimento.',
  },
  {
    id: 'ninguem-pensa-tanto',
    texto:
      'Ninguém pensa em você tanto quanto você pensa que pensam. As pessoas estão ocupadas demais com elas mesmas.',
  },
  {
    id: 'calendario-inventado',
    texto:
      'Você não está atrasado. Existe um calendário na sua cabeça que ninguém combinou com você.',
  },
  {
    id: 'culpa-nao-conserta',
    texto:
      'Culpa que não muda nada não é responsabilidade, é autopunição. Repetir o erro na cabeça não conserta ele.',
  },
  {
    id: 'sentimento-nao-e-ordem',
    texto: 'Sentimento não é ordem. Você pode estar com medo e ir do mesmo jeito.',
  },
  {
    id: 'por-que-comigo',
    texto:
      'Perguntar por que comigo não tem resposta. É uma pergunta desenhada para você não sair do lugar.',
  },
  {
    id: 'vexame-antigo',
    texto:
      'Você lembra do seu vexame de sete anos atrás. Ninguém mais lembra. A memória dos outros é bem pior que a sua.',
  },
  {
    id: 'comparacao-desigual',
    texto:
      'Comparar sua vida com a de alguém é comparar o que você sabe de você com o que te mostraram do outro.',
  },
  {
    id: 'indecisao-cobra',
    texto:
      'Decidir errado e seguir costuma custar menos que não decidir. A indecisão também é escolha, só que ela cobra todo dia.',
  },
  {
    id: 'acesso-nao-e-tempo-de-servico',
    texto:
      'Se afastar de quem te faz mal não é maldade. Você não deve acesso à sua vida a ninguém por tempo de serviço.',
  },
  {
    id: 'tudo-urgente',
    texto:
      'Quando tudo é urgente, nada é. Sua cabeça pinta de vermelho coisas que não têm prazo nenhum.',
  },
  {
    id: 'comeco-pequeno',
    texto:
      'Você não precisa de motivação. Precisa de um começo pequeno o bastante para não dar medo.',
  },
  {
    id: 'ruminar-nao-e-pensar',
    texto:
      'Ruminar parece pensar, mas pensar chega em algum lugar. Se você já rodou três vezes na mesma frase, não é pensamento, é loop.',
  },
  {
    id: 'nao-e-desprezo',
    texto: 'Dizer não a alguém não é dizer que ele não importa. É dizer que você também importa.',
  },
  {
    id: 'desconforto-do-novo',
    texto:
      'Nem todo desconforto é sinal de que algo está errado. Às vezes é só o preço de estar fazendo algo novo.',
  },
];

/**
 * A frase entre aspas, do jeito que ela aparece na tela e na imagem.
 *
 * As aspas ficam **aqui e não no texto guardado** por dois motivos. O primeiro
 * é que uma citação com aspas dentro do próprio dado obriga cada lugar que a
 * mostra a lembrar de não pôr as suas — e um dia alguém esquece, e sai com
 * aspas duplas. O segundo é que as regras de voz de `testa-conselhos.js` leem o
 * texto cru; com pontuação decorativa embutida, cada expressão teria de
 * aprender a ignorá-la.
 *
 * São as aspas curvas do português, e não `"`. A reta é resquício de máquina de
 * escrever, e numa frase composta em Baloo 2 ela aparece como o único caractere
 * que não foi desenhado junto com o resto.
 */
export function entreAspas(texto: string): string {
  return `“${texto}”`;
}

/** Um registro por dia em que a pessoa desenterrou alguma coisa. */
export type ConselhoVisto = {
  /** YYYY-MM-DD. */
  date: string;
  id: string;
};

/**
 * Quantos registros ficam guardados.
 *
 * Não precisa ser maior que o repertório para a regra de não repetir funcionar
 * — a escolha usa a posição no histórico, e o que caiu fora simplesmente conta
 * como "faz muito tempo". O teto existe só para o arquivo do aparelho não
 * crescer para sempre.
 */
export const LIMITE_DO_HISTORICO = 200;

/** Semente estável do dia, no mesmo formato que a saudação e a sugestão usam. */
function sementeDoDia(hoje: string): number {
  const [ano, mes, dia] = hoje.split('-').map((n) => Number(n));
  if (!Number.isFinite(ano) || !Number.isFinite(mes) || !Number.isFinite(dia)) return 0;
  return ano * 372 + mes * 31 + dia;
}

/**
 * A frase de hoje.
 *
 * **Sorteia entre a metade mais antiga**, e essa combinação é o ponto todo.
 *
 * Sorteio puro pode repetir na terça o que saiu na segunda enquanto metade do
 * repertório nunca sai — com vinte frases isso apareceria já na primeira
 * semana, que é exatamente quando a pessoa está decidindo se o recurso presta.
 *
 * Mas pegar sempre **a** mais antiga é pior, e de um jeito que só aparece
 * depois: passada a primeira volta, o histórico é uma permutação, a mais antiga
 * é sempre exatamente uma, e a ordem vira uma fila fixa. A pessoa veria a mesma
 * sequência de vinte frases repetindo para sempre.
 *
 * A janela resolve os dois: uma frase não pode voltar antes de metade do
 * repertório ter passado (dez dias, hoje), e dentro dessa restrição a ordem
 * muda a cada volta.
 *
 * **Se hoje já foi desenterrado, devolve a mesma frase.** Uma por dia foi a
 * decisão; e mesmo que não fosse, uma frase que troca enquanto a pessoa pensa
 * no que leu não é conselho, é caça-níquel.
 */
export function conselhoDoDia({
  vistos,
  hoje,
}: {
  /** Histórico, do mais recente para o mais antigo. */
  vistos: ConselhoVisto[];
  /** YYYY-MM-DD. */
  hoje: string;
}): Conselho {
  const deHoje = vistos.find((v) => v.date === hoje);
  if (deHoje) {
    const guardado = CONSELHOS.find((c) => c.id === deHoje.id);
    // Só cai fora daqui se a frase de hoje tiver sido removida do repertório
    // numa atualização. Nesse caso escolhe outra, em vez de mostrar vazio.
    if (guardado) return guardado;
  }

  /** Posição do uso mais recente de cada frase. Quanto maior, mais antigo. */
  const ultimoUso = new Map<string, number>();
  vistos.forEach((v, i) => {
    if (!ultimoUso.has(v.id)) ultimoUso.set(v.id, i);
  });

  /*
    Nunca vista conta como a mais antiga possível — e um número, não `Infinity`,
    porque a comparação abaixo subtrai as duas distâncias: `Infinity - Infinity`
    é `NaN`, e um comparador que devolve `NaN` deixa a ordenação indefinida.
  */
  const NUNCA = Number.MAX_SAFE_INTEGER;
  const distancia = (c: Conselho) => ultimoUso.get(c.id) ?? NUNCA;

  const daMaisAntiga = [...CONSELHOS].sort((a, b) => distancia(b) - distancia(a));
  const janela = Math.max(1, Math.floor(CONSELHOS.length / 2));
  const candidatas = daMaisAntiga.slice(0, janela);

  return candidatas[sementeDoDia(hoje) % candidatas.length];
}

/**
 * As contas da régua do ciclo: onde cada intervalo e cada marca caem.
 *
 * ## Por que a régua existe
 *
 * Porque as duas barras do app contavam coisas diferentes do texto ao lado
 * delas, e a pessoa percebeu.
 *
 * Na tela inicial, a barra era do **estágio de agora**: na Plantinha, onze
 * pontinhos de dez a vinte e um. Aos dez dias cuidados ela aparecia vazia
 * embaixo da frase "10 dias de cuidado. Faltam 11 dias para florescer" — e
 * vazia estava certa, porque a Plantinha tinha acabado de começar. Ninguém lê
 * assim. Quem lê "10 e faltam 11" espera ver onze de vinte e um.
 *
 * No jardim era pior, e de um jeito mais silencioso: a barra ia de zero a
 * vinte e um dias, linear, e os quatro nomes embaixo dela estavam distribuídos
 * com `space-between` — ou seja, "Broto" ficava a um terço da largura quando o
 * Broto começa no dia 3, que é um sétimo. A barra passava **por cima** do nome
 * do estágio que ela ainda não tinha alcançado.
 *
 * ## A régua
 *
 * Uma só, usada nos dois lugares, com o ciclo inteiro: vinte e um intervalos,
 * um por dia cuidado, e quatro marcas nos dias em que algo acontece — 0, 3, 10
 * e 21. O desenho de cada estágio fica **em cima da marca dele**, e não numa
 * coluna de largura igual. O efeito é o que faltava: quando o broto evolui, o
 * trecho aceso termina exatamente embaixo do desenho novo.
 *
 * ## Por que este arquivo não importa nada
 *
 * Os marcos e o total entram como argumento, em vez de vir de `derived`.
 *
 * Não é purismo: `derived` importa tipos de componentes, que importam JSX, e a
 * bateria de testes compila este módulo sozinho para conferir as contas. Foi o
 * mesmo motivo que separou `planoDaPaisagem` de `PaisagemDaComposta`. Quem
 * chama passa `STAGE_AT` e `MATURIDADE`, que continuam sendo a única fonte.
 *
 * ## E por que ele não se chama `reguaDoCiclo`
 *
 * Porque era esse o nome, e no Windows `import ... from './ReguaDoCiclo'`
 * resolvia para **este** arquivo em vez do componente: o sistema de arquivos
 * não distingue maiúsculas, e o TypeScript tenta `.ts` antes de `.tsx`. O erro
 * sai como "differs ... only in casing" e aponta para o lugar errado. É o mesmo
 * tropeço que renomeou `paisagemDaComposta` para `planoDaPaisagem` — par de
 * arquivos cujo nome só difere na primeira letra não sobrevive aqui.
 */

/** Os nomes dos três estágios do broto. */
export const NOMES_DOS_ESTAGIOS: string[] = ['Semente', 'Broto', 'Plantinha'];

/**
 * Os nomes das quatro marcas da régua: os três estágios, e o fim.
 *
 * "Flor" é o fim do ciclo — o dia em que a planta vai para o jardim e outra
 * começa. Ele não é um estágio do broto, e por isso não entra na lista de
 * cima: `sproutStage` nunca devolve quatro.
 */
export const NOMES_DAS_MARCAS: string[] = [...NOMES_DOS_ESTAGIOS, 'Flor'];

/** A folga entre dois intervalos, em pontos. */
export const VAO_DO_INTERVALO = 3;

/** O menor desenho que ainda vale a pena desenhar, e o maior que não incha. */
export const LADO_MINIMO = 20;
export const LADO_MAXIMO = 44;

/**
 * O ar entre dois desenhos vizinhos, em pontos.
 *
 * Sem ele a conta devolve o tamanho em que os dois **encostam** — tecnicamente
 * certo, e na tela a folha da Semente nascendo do caule do Broto.
 *
 * Três pontos não bastaram. Foi o primeiro valor, calculado para os dois não
 * se tocarem, e no aparelho o Pedro leu "o estágio 1 e 2 ficaram coladas" —
 * que é o que quatro pontos de ar entre duas silhuetas da mesma cor parecem.
 * Não encostar é geometria; parecer separado é desenho, e precisa de mais.
 *
 * Doze deixa doze pontos de vão numa tela de 320 e catorze numa de 375, com
 * desenhos de vinte e cinco. Os desenhos encolhem junto, e é o preço certo: a
 * Semente e o Broto estão a um sétimo da barra um do outro, e dessa distância
 * não há como fugir sem mentir sobre onde eles acontecem.
 */
export const AR_ENTRE_MARCAS = 12;

export type MarcaDaRegua = {
  /** O dia cuidado em que a marca cai. */
  dia: number;
  /** O centro dela, contado da borda esquerda da régua. */
  x: number;
};

export type IntervaloDaRegua = {
  /** O dia que este intervalo representa: o intervalo `i` vai de `i` a `i+1`. */
  dia: number;
  esquerda: number;
  largura: number;
};

export type PlanoDaRegua = {
  /** O lado da caixa de cada desenho. */
  lado: number;
  /** O comprimento da barra, já descontado o meio desenho de cada ponta. */
  barra: number;
  /** Onde o dia zero cai — meio desenho para dentro, dos dois lados. */
  recuo: number;
  /** Quanto um dia cuidado vale em pontos. */
  passo: number;
  marcas: MarcaDaRegua[];
  intervalos: IntervaloDaRegua[];
};

/**
 * O lado do desenho que ainda cabe entre as duas marcas mais próximas.
 *
 * É a única medida da régua que não é escolha de gosto. As marcas estão nos
 * dias 0, 3, 10 e 21: as duas primeiras ficam a um sétimo da barra uma da
 * outra, e um sétimo de uma barra de celular é pouco mais de trinta pontos.
 * Desenho maior do que isso **encosta no vizinho** — e dois brotos encostados
 * numa linha de progresso viram um borrão, não dois passos.
 *
 * A conta sai de querer `lado ≤ folga · barra`, com `barra = largura − lado`:
 *
 *     lado ≤ folga · (largura − lado)   ⇒   lado ≤ folga · largura / (1 + folga)
 *
 * E ainda tira `AR_ENTRE_MARCAS` desse limite, para os dois não se encostarem.
 */
export function ladoDaMarca(largura: number, menorFolga: number): number {
  const cabe = Math.floor((menorFolga * largura) / (1 + menorFolga)) - AR_ENTRE_MARCAS;
  /*
    O piso vem depois do teto de propósito.

    Numa tela estreitíssima o `cabe` desce abaixo do mínimo, e aí há duas
    saídas ruins: desenho ilegível ou desenhos encostados. Encostados é a menos
    ruim — ilegível some, e o que some não conta passo nenhum. O último
    `Math.min` é só a garantia de que sobra barra para ser barra.
  */
  const comTeto = Math.min(cabe, LADO_MAXIMO);
  const comPiso = Math.max(comTeto, LADO_MINIMO);
  return Math.min(comPiso, Math.max(8, Math.floor(largura / 3)));
}

/** A menor distância entre duas marcas vizinhas, como fração do total. */
export function menorFolgaEntreMarcos(marcos: number[], total: number): number {
  let menor = 1;
  for (let i = 1; i < marcos.length; i += 1) {
    menor = Math.min(menor, (marcos[i] - marcos[i - 1]) / total);
  }
  return menor > 0 ? menor : 1;
}

/**
 * A régua inteira, em pontos, para uma largura dada.
 *
 * `largura` é o espaço que a régua tem de verdade — já sem o preenchimento do
 * cartão. Nada aqui é medido em tempo de execução: `onLayout` não dispara no
 * `react-native-web`, e número que só está certo onde não dá para olhar não
 * serve. Ver a nota de `alturaDoMascote`, em `geometriaDoBroto`.
 */
export function planoDaRegua(largura: number, marcos: number[], total: number): PlanoDaRegua {
  const lado = ladoDaMarca(largura, menorFolgaEntreMarcos(marcos, total));
  const barra = Math.max(1, largura - lado);
  const recuo = lado / 2;
  const passo = barra / total;

  const marcas = marcos.map((dia) => ({ dia, x: recuo + (dia / total) * barra }));

  /*
    O vão é dividido entre os dois vizinhos, e não jogado depois do intervalo.

    Com o vão inteiro à direita, o fim do trecho aceso ficava três pontos antes
    da marca, e a régua passava a mentir por três pontos justamente no lugar
    que ela existe para acertar. Com meio vão de cada lado, a fronteira entre
    dois intervalos cai **no meio da folga** — ou seja, exatamente em cima da
    marca.
  */
  const intervalos = Array.from({ length: total }, (_, dia) => ({
    dia,
    esquerda: recuo + dia * passo + VAO_DO_INTERVALO / 2,
    largura: Math.max(3, passo - VAO_DO_INTERVALO),
  }));

  return { lado, barra, recuo, passo, marcas, intervalos };
}

/** O centro da marca de um dia, contado da borda esquerda da régua. */
export function xDoDia(plano: PlanoDaRegua, dia: number, total: number): number {
  return plano.recuo + (dia / total) * plano.barra;
}

/**
 * Qual marca está valendo agora: a última que o broto já alcançou.
 *
 * Nunca devolve `-1`. Quem não cuidou de nenhum dia ainda está na primeira
 * marca — a semente é o começo, não a ausência de começo.
 */
export function marcaDeAgora(marcos: number[], dias: number): number {
  let qual = 0;
  for (let i = 0; i < marcos.length; i += 1) {
    if (dias >= marcos[i]) qual = i;
  }
  return qual;
}

/**
 * A largura que um nome ocupa, estimada pelo número de letras.
 *
 * Estimada, e não medida: medir texto exige `onLayout`, que não dispara no
 * `react-native-web`, e a régua inteira existe para ser posicionada por
 * coordenada. O fator é generoso de propósito — uma estimativa **curta**
 * cortaria o nome com reticências, que é pior do que um vão a mais.
 */
export function larguraDoNome(nome: string, corpo: number): number {
  return nome.length * corpo * 0.62 + 2;
}

/**
 * Onde cada nome fica, para os quatro caberem sem se encostar.
 *
 * ## Por que não é só centrar no risco
 *
 * Porque a Semente e o Broto estão a um sétimo da barra um do outro — trinta
 * e nove pontos numa tela de 375 —, e "Semente" sozinho ocupa quarenta e
 * quatro. Centrados nos riscos, os dois primeiros nomes se sobrepõem em
 * qualquer celular. Era por isso que a régua mostrava **só o nome de agora**,
 * e era isso que faltava: o Pedro pediu o nome de cada etapa, e ele tem
 * razão — uma régua com quatro desenhos e um nome só obriga a adivinhar três.
 *
 * ## O que ela faz
 *
 * Duas varreduras, como todo eixo de gráfico que precisa caber: da esquerda
 * para a direita empurrando quem invadiria o vizinho de trás, e da direita
 * para a esquerda puxando quem passaria da borda. O resultado é cada nome o
 * mais perto possível do risco dele, na ordem certa, sem encostar em ninguém.
 *
 * O risco e o desenho continuam exatamente em cima do dia; quem cede é a
 * palavra, que é a parte que não precisa ser exata.
 */
export function posicoesDosRotulos(
  centros: number[],
  larguras: number[],
  largura: number,
  folga: number,
): number[] {
  const esquerdas = centros.map((c, i) => c - larguras[i] / 2);

  for (let i = 0; i < esquerdas.length; i += 1) {
    const piso = i === 0 ? 0 : esquerdas[i - 1] + larguras[i - 1] + folga;
    esquerdas[i] = Math.max(esquerdas[i], piso);
  }
  for (let i = esquerdas.length - 1; i >= 0; i -= 1) {
    const teto = i === esquerdas.length - 1
      ? largura - larguras[i]
      : esquerdas[i + 1] - larguras[i] - folga;
    esquerdas[i] = Math.min(esquerdas[i], teto);
  }
  /*
    A varredura da direita pode empurrar o primeiro para fora pela esquerda,
    numa régua estreita demais para os quatro nomes. Ali não há saída boa: é
    melhor dois nomes encostados do que um nome cortado pela borda.
  */
  return esquerdas.map((x) => Math.max(0, x));
}

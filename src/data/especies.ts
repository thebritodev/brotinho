import type { Mood } from '../theme/tokens';

/**
 * As espécies do broto — o que ele é neste ciclo, e o que ele vira no próximo.
 *
 * ## O mecanismo, e o que ele substitui
 *
 * Quando um ciclo de vinte e um dias fechava, a planta ia para uma lista no
 * jardim e um broto **igual ao anterior** começava. O Pedro apontou o
 * problema: a Composta também cria uma coisa que também vai para um jardim, e
 * o segundo ciclo era o primeiro de novo — vinte e um dias para ver a mesma
 * mudinha nascer.
 *
 * Agora, ao amadurecer, a pessoa **escolhe a próxima espécie**. O broto dos
 * vinte e um dias seguintes é aquela espécie: outras folhas, outra cabeça,
 * outro vaso, outra flor no fim. O jardim deixa de ser uma prateleira de
 * cópias e vira uma de espécies.
 *
 * Três coisas mudam com isso:
 *
 * 1. **O ciclo seguinte é diferente do anterior.** Era o pedido, por extenso:
 *    "deveria ter um mecanismo diferente cada vez que o brotinho se torna uma
 *    flor".
 * 2. **A recompensa é uma escolha, e não um troféu.** Receber é passivo;
 *    escolher é a pessoa dizendo o que quer para as próximas três semanas.
 * 3. **Dá para ver o que vem.** A régua do ciclo desenha a flor da espécie de
 *    agora na marca do dia 21 — e ela é outra a cada ciclo. É o que transforma
 *    "faltam 11 dias" num motivo.
 *
 * ## Por que a cor, e não a forma
 *
 * Porque a forma do broto é a identidade dele, e porque mexer nela sairia
 * caro de um jeito que não aparece de fora: as folhas vêm de
 * `LEAVES_BY_STAGE`, e é dessa tabela que `caixaDaPlanta` tira a caixa que
 * posiciona o balão de fala, o halo, a folha que acena e o broto dentro de
 * cada cena. Uma tabela por espécie mudaria a caixa, e a caixa é lida em
 * quarenta lugares.
 *
 * A cor não tem esse problema, e não é pouco: o desenho do broto é **modelado
 * em três tons por peça** — luz, corpo e sombra —, e trocar os doze tons de
 * uma vez muda cabeça, folhas, haste e vaso juntos. Uma lavanda ao lado de um
 * girassol não se confunde.
 *
 * O contorno **não** entra na troca. Ele é o traço do personagem, o mesmo de
 * dia e de noite — a mesma razão por que `tracos` existe separado do tema.
 *
 * ## A primeira espécie é a de hoje
 *
 * `brotinho` tem exatamente os valores que `tracos` já tinha. Não é
 * conveniência: é o que garante que quem está no meio de um ciclo não vê o
 * próprio broto trocar de cor na atualização do app.
 */

/** Os tons que uma espécie troca. O contorno do personagem fica de fora. */
export type TintaDaEspecie = {
  /** O contorno das folhas e do bulbo. */
  contornoFolha: string;
  /** O tom chapado da folha, para quem desenha sem gradiente. */
  folha: string;
  /** O meio do bulbo, e a folha iluminada das ilustrações. */
  folhaClara: string;
  folhaLuz: string;
  folhaSombra: string;
  bulboLuz: string;
  bulboSombra: string;
  /** A sombra interna que dá curvatura ao bulbo, sob a linha do queixo. */
  bulboCurva: string;
  haste: string;
  vaso: string;
  vasoLuz: string;
  vasoSombra: string;
  vasoRisco: string;
};

/** A flor que a espécie abre no fim do ciclo. */
export type FlorDaEspecie = { petala: string; miolo: string };

export type EspecieKey = 'brotinho' | 'lavanda' | 'girassol' | 'suculenta' | 'cerejeira';

export type Especie = {
  chave: EspecieKey;
  nome: string;
  /** Uma linha sobre o que ela é — o que a pessoa lê antes de escolher. */
  sobre: string;
  /** O humor que ela responde. `null` na primeira, que não é escolhida. */
  responde: Mood | null;
  tinta: TintaDaEspecie;
  flor: FlorDaEspecie;
};

export const ESPECIES: Record<EspecieKey, Especie> = {
  brotinho: {
    chave: 'brotinho',
    nome: 'Brotinho',
    sobre: 'O de sempre. Verde, teimoso, cresce em qualquer canto.',
    responde: null,
    tinta: {
      contornoFolha: '#2E4A3B',
      folha: '#6F9079',
      folhaClara: '#A9C0B0',
      folhaLuz: '#7E9E87',
      folhaSombra: '#5F7F69',
      bulboLuz: '#C6DACB',
      bulboSombra: '#87A493',
      bulboCurva: '#5A7A66',
      haste: '#3E6B54',
      vaso: '#C08363',
      vasoLuz: '#D0906E',
      vasoSombra: '#A26B4F',
      vasoRisco: '#7A4426',
    },
    flor: { petala: '#FFFDF8', miolo: '#F2C14E' },
  },

  lavanda: {
    chave: 'lavanda',
    nome: 'Lavanda',
    sobre: 'Cheira a calma. Gosta de sol e de ser deixada em paz.',
    responde: 'ansioso',
    tinta: {
      contornoFolha: '#3F4A53',
      folha: '#7E8C86',
      folhaClara: '#B3BEB6',
      folhaLuz: '#8C9A92',
      folhaSombra: '#6B7A72',
      bulboLuz: '#DED4EA',
      bulboSombra: '#A194B5',
      bulboCurva: '#7A6B91',
      haste: '#5B6B63',
      vaso: '#B9AEC7',
      vasoLuz: '#CCC2D6',
      vasoSombra: '#95899F',
      vasoRisco: '#6B6177',
    },
    flor: { petala: '#C9BBDC', miolo: '#7A6B91' },
  },

  girassol: {
    chave: 'girassol',
    nome: 'Girassol',
    sobre: 'Vira o rosto para a luz, todo dia, mesmo nos nublados.',
    responde: 'triste',
    tinta: {
      contornoFolha: '#3F5A2E',
      folha: '#6F8A4A',
      folhaClara: '#AEC08C',
      folhaLuz: '#7E9A57',
      folhaSombra: '#5F7A3C',
      bulboLuz: '#FBE6AE',
      bulboSombra: '#D9A93F',
      bulboCurva: '#A07818',
      haste: '#4E6B33',
      vaso: '#B5825A',
      vasoLuz: '#C9956B',
      vasoSombra: '#8E6440',
      vasoRisco: '#653F22',
    },
    flor: { petala: '#F6C945', miolo: '#6B4A14' },
  },

  suculenta: {
    chave: 'suculenta',
    nome: 'Suculenta',
    sobre: 'Guarda água para os dias secos. Perdoa quem esquece dela.',
    responde: 'cansado',
    tinta: {
      contornoFolha: '#2F4A4A',
      folha: '#6F9090',
      folhaClara: '#A9C0C0',
      folhaLuz: '#7E9E9E',
      folhaSombra: '#5F7F7F',
      bulboLuz: '#CFE2DE',
      bulboSombra: '#87A49F',
      bulboCurva: '#5A7A75',
      haste: '#3E6B66',
      vaso: '#D6C3A3',
      vasoLuz: '#E4D4B8',
      vasoSombra: '#B09C7A',
      vasoRisco: '#7E6C4E',
    },
    flor: { petala: '#F2D9C2', miolo: '#B07F58' },
  },

  cerejeira: {
    chave: 'cerejeira',
    nome: 'Cerejeira',
    sobre: 'Floresce pouco tempo, e é disso que todo mundo lembra.',
    responde: 'leve',
    tinta: {
      contornoFolha: '#35503C',
      folha: '#5F8068',
      folhaClara: '#9FB8A6',
      folhaLuz: '#6F9079',
      folhaSombra: '#4E6B57',
      bulboLuz: '#FADFE4',
      bulboSombra: '#D095A2',
      bulboCurva: '#A86B78',
      haste: '#3A5F49',
      vaso: '#AFACA6',
      vasoLuz: '#C2BFB8',
      vasoSombra: '#8A8782',
      vasoRisco: '#5F5D59',
    },
    flor: { petala: '#F6C3CC', miolo: '#C77F8F' },
  },
};

/** A espécie de quem nunca escolheu nenhuma. */
export const ESPECIE_PADRAO: EspecieKey = 'brotinho';

/** Todas, na ordem em que aparecem quando é preciso listar. */
export const ORDEM_DAS_ESPECIES: EspecieKey[] = [
  'brotinho',
  'lavanda',
  'girassol',
  'suculenta',
  'cerejeira',
];

/**
 * A espécie guardada, ou a padrão — nunca `undefined`.
 *
 * `hasOwnProperty`, e não `chave in ESPECIES`. O `in` enxerga a cadeia de
 * protótipo: `'constructor' in ESPECIES` é **verdadeiro**, e também
 * `'toString'`, `'valueOf'` e o resto. Um perfil com `especieAtual:
 * "constructor"` — vindo de um backup corrompido ou editado à mão — passava
 * pela validação, e então `ESPECIES[chave].tinta` era `undefined`: doze
 * `fill` vazios num SVG, que no Android não desenha e não reclama. O teste
 * achou; a regra de `sanitize` vale aqui também, porque o que vem do disco
 * não é código de confiança.
 */
export function especieValida(chave: string | null | undefined): EspecieKey {
  const nossa = typeof chave === 'string'
    && Object.prototype.hasOwnProperty.call(ESPECIES, chave);
  return nossa ? (chave as EspecieKey) : ESPECIE_PADRAO;
}

/** Quantas espécies a pessoa escolhe entre, ao fim de um ciclo. */
export const QUANTAS_ESCOLHAS = 3;

/**
 * As espécies oferecidas no fim de um ciclo.
 *
 * ## As três regras, e por que cada uma
 *
 * **A atual nunca entra.** Se entrasse, "escolher a próxima" incluiria a
 * opção de não mudar nada — e a escolha existe justamente para o ciclo
 * seguinte não ser o anterior de novo.
 *
 * **A primeira é a que responde ao período.** `humor` é o humor predominante
 * dos vinte e um dias, que `colheita` já calcula: quem passou três semanas
 * ansioso vê a lavanda primeiro, quem passou cansado vê a suculenta. Não é
 * conselho nem diagnóstico — é o app tendo reparado, que é a única coisa que
 * ele pode honestamente oferecer.
 *
 * **A ordem do resto é fixa, e não sorteada.** Sorteio aqui faria a mesma
 * colheita mostrar coisas diferentes se a tela remontasse, e remontar
 * acontece — basta girar o aparelho. Uma lista estável também deixa a pessoa
 * reconhecer a espécie que viu da outra vez e não escolheu.
 */
export function escolhasApos(atual: EspecieKey, humor: Mood | null): EspecieKey[] {
  const candidatas = ORDEM_DAS_ESPECIES.filter((k) => k !== atual);
  const respondem = candidatas.filter((k) => humor !== null && ESPECIES[k].responde === humor);
  const resto = candidatas.filter((k) => !respondem.includes(k));
  return [...respondem, ...resto].slice(0, QUANTAS_ESCOLHAS);
}

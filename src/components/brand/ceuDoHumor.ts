import { moodColors, palette, type Mood } from '../../theme/tokens';
import { CEU_ALTO, CEU_BAIXO, CEU_MEIO } from './ceuDaComposta';

/**
 * O céu da tela inicial, pintado pelo humor de hoje e pela hora do relógio.
 *
 * ## O que muda, e o que não muda
 *
 * O céu era fixo: três paradas de verde-estufa, creme e creme afundado, iguais
 * todo dia. Agora as três saem do humor que a pessoa marcou — o azul da
 * ansiedade, o cinza da tristeza, o amarelo do dia bom. É a mesma ideia do
 * onboarding: uma resposta dela muda o mundo em volta do personagem.
 *
 * **O que não muda é o céu não seguir o tema.** Essa decisão é antiga e foi
 * cara: no tema escuro as mesmas paradas viravam um bloco quase preto com
 * palavras caindo dentro, a paisagem sumia, e o broto — que é traço fixo —
 * boiava num vazio. A regra ficou sendo "paisagem tem luz própria", e é por
 * isso que aqui as cores saem de `moodColors` direto, e não do gancho de tema.
 * Ver `ceuDaComposta`, que conta o episódio inteiro.
 *
 * Como consequência, tudo o que fica **em cima** deste céu também é cor fixa —
 * `TEXTO_NO_CEU`, `VIDRO_NO_CEU`. Os pares são medidos em
 * `confere-contraste.js`, agora contra os seis céus de humor e os seis de
 * noite, em vez de contra o único céu que existia antes.
 *
 * ## Como as três paradas saem de uma cor só
 *
 * De cima para baixo o céu clareia um pouco e depois assenta: a parada de cima
 * mistura o tom do humor com branco, a do meio é ele puro, e a de baixo é ele
 * puxado para o creme afundado, que é a cor que o horizonte tinha antes. Sem a
 * terceira, o céu encosta na crista do morro com a mesma cor do alto e a faixa
 * inteira vira um retângulo chapado.
 */

/** Mistura duas cores em hexa. `t` de 0 (a primeira) a 1 (a segunda). */
export function mistura(a: string, b: string, t: number): string {
  const ler = (c: string) => {
    const h = c.replace('#', '');
    const cheio = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
    return [
      parseInt(cheio.slice(0, 2), 16),
      parseInt(cheio.slice(2, 4), 16),
      parseInt(cheio.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = ler(a);
  const [r2, g2, b2] = ler(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(mix(r1, r2))}${hex(mix(g1, g2))}${hex(mix(b1, b2))}`;
}

export type CeuEmTresParadas = { alto: string; meio: string; baixo: string };

/** Quanto o véu da noite escurece o céu, e para que cor. */
const VEU_DA_NOITE = palette.lavender300;
const FORCA_DO_VEU = 0.3;

/**
 * O céu de um humor.
 *
 * `null` devolve o céu de sempre — quem ainda não disse como está continua
 * vendo o verde de estufa que o app sempre teve. Pintar de neutro seria
 * inventar uma resposta que ninguém deu.
 */
export function ceuDoHumor(humor: Mood | null, noite = false): CeuEmTresParadas {
  const base: CeuEmTresParadas = humor
    ? {
        alto: mistura(moodColors[humor], '#FFFFFF', 0.45),
        meio: moodColors[humor],
        baixo: mistura(moodColors[humor], palette.cream300, 0.55),
      }
    : { alto: CEU_ALTO, meio: CEU_MEIO, baixo: CEU_BAIXO };

  if (!noite) return base;
  /*
    O véu é uma mistura, e não uma camada por cima.

    Uma camada translúcida sobre o gradiente daria o mesmo resultado, com um
    retângulo a mais para o Android compor — e, mais importante, deixaria a cor
    final impossível de medir de fora. O `confere-contraste` precisa saber
    exatamente que tom o texto vai encontrar, e para isso o tom tem de existir
    como número, não como sobreposição.
  */
  return {
    alto: mistura(base.alto, VEU_DA_NOITE, FORCA_DO_VEU),
    meio: mistura(base.meio, VEU_DA_NOITE, FORCA_DO_VEU),
    baixo: mistura(base.baixo, VEU_DA_NOITE, FORCA_DO_VEU),
  };
}

/** Todos os céus possíveis, para o conferidor medir o texto contra eles. */
export function todosOsCeus(): CeuEmTresParadas[] {
  const humores: (Mood | null)[] = [
    null,
    'feliz',
    'leve',
    'ansioso',
    'triste',
    'cansado',
    'neutro',
  ];
  return humores.flatMap((h) => [ceuDoHumor(h, false), ceuDoHumor(h, true)]);
}

import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { useTema } from '../../theme';
import { palette, tracos } from '../../theme/tokens';
import { mistura } from './ceuDoHumor';
import { cresce, curva, desloca, gira } from './movimentoDaCena';

/**
 * A arte de cada tema de prática: **um objeto**, sobre o tom do grupo.
 *
 * ## O que isto substitui, e por que
 *
 * As treze cenas de paisagem — `cenariosDosTemas`, que foram deste arquivo
 * para o histórico do git. Elas eram vistas do mesmo mundo: céu, horizonte,
 * chão, e uma cena por tema. Funcionava, e o redesenho pediu outra coisa.
 *
 * O documento do redesenho desenha **objeto**, não lugar, e a razão é de
 * leitura: num cartão de 176 por 140 dentro de um carrossel que anda, um
 * objeto grande no meio se reconhece de relance; uma cena pede um segundo
 * olhar para separar o assunto do cenário. O lugar continua existindo onde ele
 * tem espaço para existir — na tela inicial, na aba do broto, nas práticas —,
 * e aqui a grade volta a ser uma grade de assuntos.
 *
 * ## As regras das treze
 *
 * 1. **Um objeto só, grande, no meio-baixo do cartão.** Dois objetos viram
 *    ilustração narrativa e param de se ler de relance.
 * 2. **O mesmo par luz/sombra.** Um clarão branco fraco atrás do objeto e uma
 *    elipse de sombra embaixo dele. São essas duas coisas, e não o estilo do
 *    traço, que fazem treze desenhos diferentes lerem como um conjunto.
 * 3. **Paleta do app, um acento por tema.** `escurece` tira o tom de sombra de
 *    cada cor, para o objeto ter volume sem precisar de gradiente.
 * 4. **O desenho não segue o tema** — mesma regra de `ceuDaComposta` e
 *    `terraDoCanteiro`. Quem muda com o tema é o tom do cartão por trás.
 * 5. **Nada se mexe sozinho.** No documento cada arte tem o seu laço infinito;
 *    aqui são treze cartões num carrossel, e treze laços rodando ao mesmo
 *    tempo é o que faz uma lista engasgar ao rolar. O movimento acontece **no
 *    toque**, e é o que o objeto faria: o coração bate, o guarda-chuva balança,
 *    a flecha crava. Ver `movimentoDaCena`.
 */

/* ---------- O enquadramento, igual para as treze ---------- */

/** A caixa do documento. O desenho é pensado nela e esticado para o cartão. */
const L = 176;
const A = 140;

/** O centro do objeto, de onde saem o clarão e a sombra. */
const CX = 118;
const CY = 94;

/** O desenho do documento vive dentro desta moldura. */
const MOLDURA = 'translate(40 36) scale(0.72)';

const CONTORNO = tracos.contorno;

/** O tom de sombra de uma cor: ela mesma, puxada para o contorno. */
const escurece = (cor: string, quanto = 0.16) => mistura(cor, CONTORNO, quanto);

/** O brilho de quatro pontas, o mesmo do broto e dos enfeites. */
const BRILHO = 'M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z';

/** O coração, desenhado uma vez e reaproveitado por quatro temas. */
const CORACAO = 'M 0 12 C -20 0 -24 -16 -12 -22 C -5 -25 0 -19 0 -15 C 0 -19 5 -25 12 -22 C 24 -16 20 0 0 12 Z';

type ArteProps = {
  /** O passo do toque: 0 parada, 1 no fim. */
  p: number;
};

/**
 * Um coração com volume: a sombra atrás, a cor na frente, deslocada.
 *
 * Dois caminhos iguais em vez de um gradiente — é mais barato de compor no
 * Android, e dá o mesmo relevo num desenho chapado.
 */
function Coracao({
  x,
  y,
  escala,
  cor = palette.terracotta400,
}: {
  x: number;
  y: number;
  escala: number;
  cor?: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${escala})`}>
      <Path d={CORACAO} fill={escurece(cor)} />
      <Path d={CORACAO} fill={cor} transform="translate(-1.6 -1) scale(0.9)" />
    </G>
  );
}

function Brilho({
  x,
  y,
  escala,
  cor,
  opacidade = 1,
}: {
  x: number;
  y: number;
  escala: number;
  cor: string;
  opacidade?: number;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${escala})`} opacity={opacidade}>
      <Path d={BRILHO} fill={cor} />
    </G>
  );
}

/* ---------- As treze ---------- */

/** Ansiedade: o coração acelerado, com a linha do batimento atravessando. */
function Ansiedade({ p }: ArteProps) {
  const batida = curva(p, [1, 1.12, 0.96, 1.08, 1]);
  return (
    <>
      <G transform={cresce(batida, CX, 92)}>
        <Coracao x={CX} y={92} escala={1.9} />
      </G>
      <Path
        d="M 64 122 H 96 L 102 114 L 108 128 L 114 118 L 118 122 H 170"
        stroke="#FFFFFF"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  );
}

/**
 * Estresse: o ferro de passar soltando vapor.
 *
 * O objeto é o que a tensão faz com o corpo — pressão acumulada que precisa
 * sair por algum lugar. O vapor sobe no toque.
 */
function Estresse({ p }: ArteProps) {
  const sobe = curva(p, [0, -4, -8, -11, -14]);
  const some = curva(p, [0.9, 0.9, 0.6, 0.3, 0]);
  return (
    <>
      <G transform={desloca(0, sobe)} opacity={some}>
        {[0, 1, 2].map((i) => (
          <Path
            key={i}
            d={`M ${76 + i * 7} 80 c -5 -6 5 -10 0 -16 c -5 -6 5 -10 0 -16`}
            stroke="#FFFFFF"
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </G>
      <Path
        d="M 142 98 C 160 98 160 122 142 122"
        stroke={escurece(palette.green500)}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M 96 108 C 86 104 80 94 78 86 L 85 84 C 88 92 92 98 100 101 Z"
        fill={escurece(palette.green500)}
      />
      <Path d="M 92 128 C 88 106 98 88 120 88 C 142 88 150 106 146 128 Z" fill={escurece(palette.green500)} />
      <Path d="M 94 128 C 90 108 99 90 118 90 C 132 90 138 106 136 128 Z" fill={palette.green500} />
      <Rect x={106} y={81} width={28} height={9} rx={4.5} fill={escurece(palette.green500, 0.28)} />
      <Circle cx={120} cy={78} r={4.5} fill={escurece(palette.green500, 0.28)} />
      <Path
        d="M 104 100 C 102 108 102 116 104 122"
        stroke="#FFFFFF"
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
      <Ellipse cx={119} cy={129} rx={30} ry={3.5} fill={escurece(palette.green500, 0.3)} />
    </>
  );
}

/** Tristeza: o guarda-chuva aberto na chuva. */
function Tristeza({ p }: ArteProps) {
  const cai = curva(p, [0, 10, 20, 28, 34]);
  const some = curva(p, [0, 1, 1, 0.6, 0]);
  const pende = curva(p, [-3, -1, 1, 3, 0]);
  return (
    <>
      <G transform={desloca(0, cai)} opacity={some}>
        {[
          [74, 56],
          [88, 66],
          [154, 60],
          [164, 74],
          [66, 80],
        ].map(([x, y], i) => (
          <Path
            key={i}
            d={`M ${x} ${y} c -2 4 -3 6 -3 7.5 a 3 3 0 0 0 6 0 c 0 -1.5 -1 -3.5 -3 -7.5 z`}
            fill={palette.blue300}
          />
        ))}
      </G>
      <G transform={gira(pende, 116, 92)}>
        <Path
          d="M 116 90 L 116 122 C 116 130 104 130 104 122"
          stroke={palette.brown700}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M 76 92 C 76 64 156 64 156 92 C 150 87 142 87 136 92 C 130 87 122 87 116 92 C 110 87 102 87 96 92 C 90 87 82 87 76 92 Z"
          fill={palette.terracotta400}
        />
        <Path
          d="M 116 66 C 132 66 156 74 156 92 C 150 87 142 87 136 92 C 130 87 122 87 116 92 Z"
          fill={escurece(palette.terracotta400)}
        />
        <Path d="M 116 66 C 106 72 98 82 96 92 C 102 87 110 87 116 92 Z" fill="#FFFFFF" opacity={0.18} />
        <Circle cx={116} cy={64} r={2.5} fill={palette.brown700} />
      </G>
    </>
  );
}

/** Luto e saudade: a foto antiga, e o que sobe dela. */
function Luto({ p }: ArteProps) {
  const pende = curva(p, [-7, -5, -3, -5, -7]);
  const sobe = curva(p, [0, -8, -16, -22, -26]);
  const some = curva(p, [0, 1, 1, 0.5, 0]);
  return (
    <>
      <G transform={gira(pende, 116, 94)}>
        <G transform="translate(116 94)">
          <Rect x={-34} y={-38} width={68} height={78} rx={4} fill={escurece('#FFFFFF', 0.08)} transform="translate(2 2)" />
          <Rect x={-34} y={-38} width={68} height={78} rx={4} fill="#FFFFFF" />
          <Rect x={-28} y={-32} width={56} height={52} rx={2} fill={palette.blue100} />
          <Circle cx={14} cy={-18} r={7} fill={palette.yellow300} />
          <Path d="M -28 20 L -28 4 C -16 -6 -6 -4 4 4 C 12 -2 22 -2 28 2 L 28 20 Z" fill={palette.green300} />
          <Path d="M -28 20 L -28 12 C -14 6 10 8 28 14 L 28 20 Z" fill={palette.green500} />
          <Rect x={-12} y={-44} width={24} height={10} rx={2} fill={palette.amber100} opacity={0.9} transform="rotate(-6)" />
        </G>
      </G>
      <G transform={desloca(-4, sobe)} opacity={some}>
        <Coracao x={158} y={72} escala={0.55} />
      </G>
    </>
  );
}

/** Procrastinação: a lista por fazer, e o primeiro item marcado. */
function Procrastinacao({ p }: ArteProps) {
  const marcado = curva(p, [0, 0.4, 1, 1, 1]);
  const lapis = curva(p, [0, -2, -3, -1, 0]);
  return (
    <>
      <Rect x={84} y={60} width={68} height={72} rx={7} fill={escurece(palette.brown400)} />
      <Rect x={84} y={60} width={64} height={70} rx={7} fill={palette.brown400} />
      <Rect x={91} y={68} width={52} height={56} rx={3} fill="#FFFFFF" />
      <Rect x={104} y={55} width={26} height={11} rx={4} fill={palette.brown700} />
      {[0, 1, 2].map((i) => {
        const y = 78 + i * 15;
        return (
          <G key={i}>
            <Rect
              x={97}
              y={y}
              width={9}
              height={9}
              rx={2.5}
              fill={i === 0 ? mistura(palette.cream300, palette.green500, marcado) : palette.cream300}
            />
            <Rect x={111} y={y + 2.5} width={i === 2 ? 18 : 26} height={4} rx={2} fill={palette.cream300} />
          </G>
        );
      })}
      {marcado > 0.5 && (
        <Path
          d="M 99 82.5 L 101 85 L 104.5 80"
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
      <G transform={`translate(150 ${70 + lapis}) rotate(35)`}>
        <Rect x={-4} y={0} width={8} height={40} rx={2} fill={palette.amber400} />
        <Rect x={0} y={0} width={4} height={40} fill={escurece(palette.amber400)} />
        <Path d="M -4 40 L 0 49 L 4 40 Z" fill={palette.cream200} />
        <Rect x={-4} y={-4} width={8} height={6} rx={2} fill={palette.terracotta400} />
      </G>
    </>
  );
}

/** Foco: o alvo, e a flecha que crava no centro. */
function Foco({ p }: ArteProps) {
  const voa = curva(p, [0, -10, -4, 1, 0]);
  return (
    <>
      <Circle cx={118} cy={96} r={34} fill={escurece(palette.terracotta400)} />
      <Circle cx={116.5} cy={95} r={32} fill={palette.terracotta400} />
      <Circle cx={116.5} cy={95} r={23} fill={palette.cream100} />
      <Circle cx={116.5} cy={95} r={14} fill={palette.terracotta400} />
      <Circle cx={116.5} cy={95} r={5.5} fill={palette.cream100} />
      <G transform={desloca(voa, -voa)}>
        <Path d="M 116.5 95 L 154 58" stroke={palette.brown700} strokeWidth={3.5} strokeLinecap="round" />
        <Path d="M 150 56 L 158 48 L 160 60 L 156 62 Z" fill={palette.green500} />
        <Path d="M 152 62 L 148 70 L 160 66 Z" fill={escurece(palette.green500)} />
      </G>
    </>
  );
}

/** Autoestima: o espelho de mão, com um coração dentro dele. */
function Autoestima({ p }: ArteProps) {
  const bate = curva(p, [1, 1.1, 0.97, 1.06, 1]);
  return (
    <>
      <Rect x={112} y={116} width={12} height={16} rx={3} fill={escurece(palette.amber400)} />
      <Ellipse cx={118} cy={84} rx={32} ry={38} fill={escurece(palette.amber400)} />
      <Ellipse cx={116.5} cy={83} rx={30} ry={36.5} fill={palette.amber400} />
      <Ellipse cx={116.5} cy={83} rx={23} ry={29} fill={palette.blue100} />
      <Path d="M 100 70 L 110 58 L 116 62 L 104 78 Z" fill="#FFFFFF" opacity={0.6} />
      <G transform={cresce(bate, 117, 90)}>
        <Coracao x={117} y={90} escala={0.95} />
      </G>
      <Brilho x={152} y={56} escala={0.9} cor={palette.amber400} opacidade={curva(p, [1, 0.4, 1, 0.4, 1])} />
      <Brilho x={80} y={60} escala={0.6} cor={palette.terracotta400} opacidade={curva(p, [0.4, 1, 0.4, 1, 0.4])} />
      <Brilho x={156} y={104} escala={0.55} cor={palette.amber400} opacidade={curva(p, [1, 0.5, 1, 0.5, 1])} />
    </>
  );
}

/** Culpa e vergonha: o coração com o curativo. */
function Culpa({ p }: ArteProps) {
  const respira = curva(p, [1, 1.05, 0.98, 1.03, 1]);
  return (
    <>
      <G transform={cresce(respira, CX, 96)}>
        <G transform="translate(118 96)">
          <Path d={CORACAO} fill={escurece(palette.terracotta400)} transform="scale(1.9)" />
          <Path d={CORACAO} fill={palette.terracotta400} transform="translate(-1.6 -1) scale(1.71)" />
          <G transform="rotate(-32)">
            <Rect x={-30} y={-8} width={60} height={16} rx={8} fill={palette.amber100} />
            <Rect x={-30} y={0} width={60} height={8} rx={4} fill={escurece(palette.amber100, 0.08)} />
            <Rect x={-10} y={-8} width={20} height={16} fill={palette.cream300} />
            {[
              [-20, -2],
              [-20, 3],
              [20, -2],
              [20, 3],
              [-24, 0.5],
              [24, 0.5],
            ].map(([x, y], i) => (
              <Circle key={i} cx={x} cy={y} r={1.1} fill={palette.brown200} />
            ))}
          </G>
        </G>
      </G>
      <Brilho x={76} y={62} escala={0.7} cor={palette.amber400} opacidade={curva(p, [1, 0.4, 1, 0.4, 1])} />
      <Brilho x={158} y={66} escala={0.55} cor={palette.amber400} opacidade={curva(p, [0.4, 1, 0.4, 1, 0.4])} />
    </>
  );
}

/** Insônia: o travesseiro, a lua, e os zês. */
function Insonia({ p }: ArteProps) {
  const sobe = curva(p, [0, -5, -10, -14, -18]);
  const some = curva(p, [0, 1, 1, 0.5, 0]);
  return (
    <>
      {[
        [30, 28],
        [60, 56],
        [20, 82],
        [150, 22],
        [166, 90],
        [90, 40],
      ].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={1.8} fill="#FFFFFF" opacity={0.9} />
      ))}
      <Path d="M 128 44 A 22 22 0 1 0 144 82 A 18 18 0 1 1 128 44 Z" fill={palette.yellow300} />
      <Path
        d="M 74 108 C 72 98 84 94 116 96 C 148 94 160 98 158 108 C 160 120 154 130 116 130 C 78 130 72 120 74 108 Z"
        fill={palette.cream100}
      />
      <Path
        d="M 74 114 C 80 124 96 126 116 126 C 136 126 152 124 158 114 C 160 124 152 130 116 130 C 80 130 72 124 74 114 Z"
        fill={palette.lavender100}
      />
      <Path
        d="M 116 100 C 112 108 112 116 116 122"
        stroke={palette.lavender100}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <G transform={desloca(3, sobe)} opacity={some}>
        {[0, 1, 2].map((i) => (
          <Path
            key={i}
            d={`M ${92 + i * 10} ${88 - i * 9} h ${9 + i * 2} l ${-(9 + i * 2)} ${9 + i * 2} h ${9 + i * 2}`}
            stroke="#FFFFFF"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </G>
    </>
  );
}

/** Gratidão: o pote cheio, e mais um caindo dentro. */
function Gratidao({ p }: ArteProps) {
  const cai = curva(p, [-26, -18, -8, 0, 8]);
  const some = curva(p, [0, 1, 1, 1, 0]);
  return (
    <>
      <Path
        d="M 94 74 L 142 74 C 150 74 154 80 154 88 L 154 120 C 154 128 148 132 140 132 L 96 132 C 88 132 82 128 82 120 L 82 88 C 82 80 86 74 94 74 Z"
        fill="#FFFFFF"
        opacity={0.7}
      />
      <Coracao x={104} y={118} escala={0.6} />
      <Coracao x={128} y={120} escala={0.55} cor={palette.amber400} />
      <Coracao x={116} y={104} escala={0.5} cor={palette.yellow300} />
      <Coracao x={140} y={104} escala={0.45} />
      <Coracao x={96} y={100} escala={0.42} cor={palette.amber400} />
      <G transform={desloca(0, cai)} opacity={some}>
        <Coracao x={118} y={70} escala={0.5} />
      </G>
      <Path d="M 90 88 L 90 116" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
      <Rect x={86} y={64} width={64} height={12} rx={5} fill={escurece(palette.green500)} />
      <Rect x={86} y={64} width={60} height={10} rx={5} fill={palette.green500} />
    </>
  );
}

/**
 * Raiva: a nuvem de tempestade com o raio.
 *
 * É o único dos treze que não veio do documento — ele desenha dez temas, e
 * este app tem treze. A nuvem com raio é o que mais se reconhece de relance
 * sem virar violência desenhada: a raiva como tempo que passa por cima, não
 * como briga.
 */
function Raiva({ p }: ArteProps) {
  const treme = curva(p, [0, -2, 2, -1, 0]);
  const brilha = curva(p, [0.35, 1, 0.5, 1, 0.35]);
  return (
    <>
      <G transform={desloca(treme, 0)}>
        <Path
          d="M 72 96 C 70 82 82 72 96 76 C 102 58 128 54 138 70 C 150 64 166 74 164 90 C 172 94 170 106 158 106 L 80 106 C 72 106 70 102 72 96 Z"
          fill={escurece(palette.slate300, 0.1)}
        />
        <Path
          d="M 72 94 C 70 80 82 70 96 74 C 102 56 128 52 138 68 C 150 62 166 72 164 88 C 172 92 170 104 158 104 L 80 104 C 72 104 70 100 72 94 Z"
          fill={palette.slate300}
        />
        <Path
          d="M 96 78 C 94 68 104 62 114 65"
          stroke="#FFFFFF"
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
      </G>
      <G opacity={brilha}>
        <Path d="M 122 104 L 108 126 L 118 126 L 110 142" stroke={escurece(palette.amber400)} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M 122 104 L 108 126 L 118 126 L 110 142" stroke={palette.amber400} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
      {[
        [78, 118],
        [152, 116],
      ].map(([x, y], i) => (
        <Path
          key={i}
          d={`M ${x} ${y} l ${i ? 8 : -8} 10`}
          stroke={palette.blue300}
          strokeWidth={3.5}
          strokeLinecap="round"
          opacity={0.7}
        />
      ))}
    </>
  );
}

/**
 * Solidão: duas canecas, uma fumegando.
 *
 * Também não vem do documento. O objeto não é a solidão — é o contrário dela,
 * que é o que o tema oferece: "diminuir a solidão". Duas canecas lado a lado
 * dizem companhia sem desenhar gente, e desenhar gente num app cujo único
 * personagem é uma planta abriria uma porta que não dá para fechar.
 */
function Solidao({ p }: ArteProps) {
  const sobe = curva(p, [0, -4, -9, -13, -16]);
  const some = curva(p, [0.2, 0.9, 0.9, 0.5, 0]);
  const chega = curva(p, [0, 2, 4, 3, 2]);

  const caneca = (x: number, y: number, escala: number, cor: string) => (
    <G transform={`translate(${x} ${y}) scale(${escala})`}>
      <Path d="M 22 -16 C 34 -16 34 2 22 2" stroke={escurece(cor, 0.25)} strokeWidth={6} fill="none" strokeLinecap="round" />
      <Path d="M -22 -22 L 22 -22 L 19 14 C 18 20 13 23 0 23 C -13 23 -18 20 -19 14 Z" fill={escurece(cor)} />
      <Path d="M -22 -22 L 16 -22 L 13 14 C 12 20 8 23 -2 23 C -13 23 -17 20 -18 14 Z" fill={cor} />
      <Ellipse cx={0} cy={-22} rx={22} ry={5.5} fill={escurece(cor, 0.3)} />
      <Ellipse cx={0} cy={-22} rx={17} ry={4} fill={palette.brown700} />
    </G>
  );

  return (
    <>
      <G transform={desloca(0, sobe)} opacity={some}>
        {[0, 1].map((i) => (
          <Path
            key={i}
            d={`M ${94 + i * 9} 68 c -5 -5 5 -9 0 -14`}
            stroke="#FFFFFF"
            strokeWidth={3.6}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </G>
      {caneca(99, 102, 1, palette.cream100)}
      <G transform={desloca(chega, 0)}>{caneca(142, 110, 0.78, palette.terracotta400)}</G>
      <Ellipse cx={118} cy={132} rx={44} ry={4.5} fill={CONTORNO} opacity={0.1} />
    </>
  );
}

/**
 * Comparação: a balança de dois pratos, voltando ao fiel.
 *
 * O terceiro que não vem do documento. Balança é o desenho universal de
 * comparar, e o movimento do toque é o que o tema promete: ela oscila e
 * **assenta**, em vez de pender para um lado para sempre.
 */
function Comparacao({ p }: ArteProps) {
  const inclina = curva(p, [-9, 5, -3, 1, 0]);

  const prato = (x: number, y: number) => (
    <G>
      <Path d={`M ${x} ${y} L ${x} ${y + 14}`} stroke={palette.brown700} strokeWidth={2.4} strokeLinecap="round" />
      <Path
        d={`M ${x - 17} ${y + 14} C ${x - 15} ${y + 26} ${x + 15} ${y + 26} ${x + 17} ${y + 14} Z`}
        fill={escurece(palette.amber400)}
      />
      <Path
        d={`M ${x - 17} ${y + 14} C ${x - 15} ${y + 23} ${x + 13} ${y + 23} ${x + 15} ${y + 14} Z`}
        fill={palette.amber400}
      />
    </G>
  );

  return (
    <>
      {/* A coluna e o pé: a parte que não se mexe. */}
      <Path d="M 118 70 L 118 124" stroke={escurece(palette.brown400)} strokeWidth={6} strokeLinecap="round" />
      <Path d="M 96 128 C 104 118 132 118 140 128 Z" fill={escurece(palette.brown400)} />
      <Path d="M 96 128 C 104 120 132 120 140 128 Z" fill={palette.brown400} />
      <Ellipse cx={118} cy={131} rx={28} ry={4} fill={CONTORNO} opacity={0.1} />

      <G transform={gira(inclina, 118, 70)}>
        <Path d="M 80 70 L 156 70" stroke={palette.brown700} strokeWidth={4} strokeLinecap="round" />
        {prato(82, 70)}
        {prato(154, 70)}
      </G>
      <Circle cx={118} cy={70} r={6} fill={escurece(palette.brown700)} />
      <Circle cx={118} cy={69} r={4} fill={palette.cream200} />
    </>
  );
}

/* ---------- A tabela, e o componente ---------- */

const ARTES: Record<string, React.ComponentType<ArteProps>> = {
  ansiedade: Ansiedade,
  estresse: Estresse,
  raiva: Raiva,
  insonia: Insonia,
  tristeza: Tristeza,
  luto: Luto,
  solidao: Solidao,
  procrastinacao: Procrastinacao,
  foco: Foco,
  autoestima: Autoestima,
  culpa: Culpa,
  comparacao: Comparacao,
  gratidao: Gratidao,
};

/** Este tema tem arte? Hoje os treze têm; a pergunta existe para o dia que não. */
export function ehTemaComArte(chave: string): boolean {
  return chave in ARTES;
}

/** Todas as chaves com arte, para o conferidor comparar com os temas de verdade. */
export const TEMAS_COM_ARTE = Object.keys(ARTES);

type Props = {
  tema: string;
  largura: number;
  altura: number;
  /** O passo da animação de toque: 0 parada, 1 no fim. */
  passo?: number;
};

export function ArteDoTema({ tema, largura, altura, passo = 0 }: Props) {
  /*
    O clarão é a única coisa daqui que segue o tema, e segue de propósito.

    Ele não é desenho: é a luz em volta do objeto. Branco a 40% sobre um tom
    claro é um halo; sobre o tom escuro do tema escuro seria um disco aceso,
    mais brilhante que o próprio objeto. `cena.brilho` já resolve isso para a
    `Cena`, e resolve igual aqui.
  */
  const { cena } = useTema();
  const Arte = ARTES[tema];
  if (!Arte || largura <= 0 || altura <= 0) return null;

  return (
    /*
      `preserveAspectRatio` com `slice`: o desenho preenche o cartão e o que
      sobra sai pelas bordas, em vez de encolher para caber e deixar faixa de
      tom vazia em cima e embaixo. `xMidYMax` prende o pé, que é onde está a
      sombra do objeto — é ela que precisa ficar colada na base do cartão.
    */
    <Svg
      width={largura}
      height={altura}
      viewBox={`0 0 ${L} ${A}`}
      preserveAspectRatio="xMidYMax slice"
    >
      {/* O clarão atrás do objeto e a sombra embaixo: o par que une as treze. */}
      <Circle cx={CX} cy={CY} r={44} fill={cena.brilho} transform={MOLDURA} />
      <Ellipse cx={CX} cy={131} rx={36} ry={5} fill={CONTORNO} opacity={0.08} transform={MOLDURA} />
      <G transform={MOLDURA}>
        <Arte p={passo} />
      </G>
    </Svg>
  );
}

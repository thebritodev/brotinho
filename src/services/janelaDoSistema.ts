import { AppState } from 'react-native';

/**
 * Marca os instantes em que o **próprio app** abre uma janela do sistema por
 * cima de si mesmo.
 *
 * ## O problema que isto resolve
 *
 * No Android, a caixa de permissão, o prompt de biometria e a folha de
 * compartilhar não são telas do app: são janelas do sistema, e o Android pausa
 * a atividade que está atrás delas. O React Native traduz essa pausa para o
 * mesmo evento que ele usa quando a pessoa sai do app de verdade —
 * `AppState` vira `background`, sem nenhum campo que separe os dois casos.
 *
 * Quem escuta esse evento não tem como saber a diferença. E o `AppLockGate`
 * escuta: ele tranca o diário em `background`, que é exatamente o que se quer
 * quando a pessoa larga o celular na mesa — e exatamente o que **não** se quer
 * quando o app acabou de pedir o microfone.
 *
 * O efeito era um beco sem saída na Composta: tocar em "Começar a compostar"
 * pedia a permissão do microfone, a caixa do sistema pausava a atividade, o
 * bloqueio caía por cima, e a pessoa desbloqueava para achar a tela inicial —
 * com a permissão nunca respondida. Da segunda vez, a mesma coisa. A prática
 * não tinha como começar nenhuma vez.
 *
 * ## Como se usa
 *
 * Envolvendo a chamada que abre a janela:
 *
 * ```ts
 * const ok = await janelaDoSistema(() => pedirPermissaoDoMicrofone());
 * ```
 *
 * Enquanto essa promessa não termina, `temJanelaDoSistema()` é verdadeiro, e
 * quem escuta o `background` sabe que aquilo não foi a pessoa saindo.
 *
 * ## O buraco que isto **não** abre
 *
 * Suspender o bloqueio enquanto a caixa está aberta criaria uma brecha: sair
 * do app de verdade com a permissão na tela deixaria o diário destrancado.
 * Por isso `aoFecharJanelaDoSistema` existe — quando a última janela fecha,
 * quem se inscreveu confere se o app voltou mesmo para a frente. Se não
 * voltou, a pessoa saiu, e o bloqueio cai ali.
 */

/** Quantas janelas do sistema o app abriu e ainda não fechou. */
let abertas = 0;

const ouvintes = new Set<() => void>();

/**
 * Quanto esperar antes de decidir se a pessoa saiu.
 *
 * O Android entrega o resultado da caixa **antes** de marcar o app como ativo:
 * a promessa da permissão resolve, e só depois vem o `onHostResume` que vira
 * `AppState = 'active'`. Conferir no mesmo instante leria `background` para
 * quem apenas respondeu a permissão e continuou ali — ou seja, reintroduziria
 * pela porta dos fundos o bug que este arquivo existe para consertar.
 *
 * Meio segundo é folgado para o estado assentar e curto para a brecha não
 * valer nada na prática.
 */
const ASSENTAR_MS = 500;

export async function janelaDoSistema<T>(
  abrir: () => Promise<T>,
  { avisaAoFechar = true }: { avisaAoFechar?: boolean } = {},
): Promise<T> {
  abertas += 1;
  try {
    return await abrir();
  } finally {
    abertas -= 1;
    // Só quando a última fecha: duas janelas encavaladas (a permissão do
    // microfone e a da fala, uma atrás da outra) contam como um intervalo só.
    if (abertas === 0 && avisaAoFechar) {
      setTimeout(() => {
        if (AppState.currentState === 'active') return;
        // Lido na hora de avisar, e não na hora de fechar: quem se
        // desinscreveu no meio da espera não deve ser chamado.
        for (const ouvinte of [...ouvintes]) ouvinte();
      }, ASSENTAR_MS);
    }
  }
}

/** Há uma janela do sistema aberta pelo próprio app neste instante? */
export function temJanelaDoSistema(): boolean {
  return abertas > 0;
}

/**
 * Avisa quando a última janela do sistema fecha **e o app não voltou para a
 * frente** — ou seja, a pessoa saiu de verdade enquanto a caixa estava aberta.
 */
export function aoFecharJanelaDoSistema(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

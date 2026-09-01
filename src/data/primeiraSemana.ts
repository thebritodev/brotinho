import { daysCaredFor, diasNoCiclo } from '../state/derived';
import type { AppData } from '../state/types';

/**
 * O que o broto mostra enquanto ainda não tem padrão nenhum para contar.
 *
 * ## O buraco que isto preenche
 *
 * `patterns` exige cinco registros para dizer a primeira frase. Ou seja, o
 * cartão "Seu broto percebeu" fica **vazio exatamente na primeira semana** —
 * que é a janela em que apps desta categoria perdem mais de 90% das pessoas. O
 * app tem treze temas, quarenta e uma práticas, jardim, composta e resumo de
 * terapia, e quem chega vê dois desses.
 *
 * A pesquisa de retenção é direta neste ponto: **quem tem um único momento de
 * "aha" está a caminho de sair.** O que segura não é a descoberta do primeiro
 * dia, é ela se repetir. Aqui cada aparição mostra uma coisa que ainda não foi
 * descoberta, uma por vez, e o cartão volta a ser dos padrões assim que
 * houver padrões.
 *
 * ## O que isto não é
 *
 * **Não é lista de tarefas, e não conta dias seguidos.** Nada aqui marca falta,
 * nada some por ausência, e a ordem não depende do calendário — depende do que
 * a pessoa já fez. Quem aparece de novo depois de duas semanas sumida continua
 * de onde estava. Ver `docs/retencao.md` para o motivo clínico de o app não ter
 * ofensiva nem placar.
 *
 * **E tem hora de calar.** Passados catorze dias de uso, o app para de se
 * explicar: continuar apontando caminhos para quem já mora aqui vira aquele
 * balão de dica que ninguém consegue desligar.
 */

/** Depois disto, o app para de se apresentar. */
const DIAS_ATE_CALAR = 14;

/** Antes de falar do jardim, é preciso ter algum broto crescendo. */
const DIAS_PARA_FALAR_DO_JARDIM = 3;

export type Passo = {
  frase: string;
  /** Para onde o toque leva, quando a tela inicial tem como abrir. */
  destino: 'praticas' | 'jardim' | null;
};

export function proximoPasso(data: AppData): Passo | null {
  if (daysCaredFor(data) > DIAS_ATE_CALAR) return null;

  /*
    Da coisa mais central para a mais lateral.

    O diário primeiro porque é o coração do app e o que carrega a promessa de
    privacidade; as práticas depois, porque são o maior volume de conteúdo que
    ninguém encontra sozinho; a palavra do humor em seguida, que é um toque a
    mais em algo que a pessoa já faz; e o jardim por último, que é a única
    dessas que precisa de tempo para existir.
  */

  if (!data.journal.length) {
    return {
      frase:
        'O diário fica na aba do meio. O que você escrever ali não sai deste aparelho — nem eu consigo ler.',
      destino: null,
    };
  }

  if (!data.practicesDone.length) {
    return {
      frase: 'Tem exercícios guiados para treze temas, de ansiedade a luto. Cada um leva poucos minutos.',
      destino: 'praticas',
    };
  }

  // Só oferece a palavra a quem já marcou humor mais de uma vez: no primeiro
  // dia isso seria uma segunda pergunta antes da primeira ter feito sentido.
  const marcou = data.moodHistory.length;
  const escolheuPalavra = data.moodHistory.some((m) => !!m.palavra);
  if (marcou >= 2 && !escolheuPalavra) {
    return {
      frase:
        'Depois de tocar numa carinha, aparecem palavras mais exatas. "Aflição" e "irritação" contam coisas diferentes.',
      destino: null,
    };
  }

  if (!data.garden.length && diasNoCiclo(data) >= DIAS_PARA_FALAR_DO_JARDIM) {
    return {
      frase: 'Aos vinte e um dias este broto amadurece e fica guardado no seu jardim, e outro começa.',
      destino: 'jardim',
    };
  }

  return null;
}

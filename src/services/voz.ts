import * as Speech from 'expo-speech';

/**
 * A voz do app — o Brotinho conduzindo uma prática em voz alta.
 *
 * ## Por que existe
 *
 * O app escutava e nunca falava. Havia reconhecimento de fala desde o começo —
 * a Composta conta as repetições, o diário transcreve —, mas nada que saísse
 * pelo alto-falante. E o cartão da tela inicial promete "guiada pelo app".
 *
 * Quinze das quarenta e uma práticas têm guia em tempo real; as outras
 * vinte e seis são uma lista de passos para ler. A primeira a receber voz é o
 * **Aterramento 5-4-3-2-1**, e a escolha não é minha: é a prática que a porta
 * de "estou muito mal agora" abre, e o comentário que a nomeia em
 * `data/practices.ts` já dizia o que faltava — *"em crise ninguém lê, alguém
 * precisa conduzir"*. Até hoje ela conduzia por escrito.
 *
 * A literatura sobre aliança terapêutica digital — o que faz alguém continuar
 * usando um app em vez de largá-lo na primeira semana — nomeia "recursos de
 * voz humana" entre os mecanismos que a constroem, ao lado de frases que
 * validam e de um personagem reconhecível. O app já tinha os outros dois.
 *
 * ## A regra que este arquivo existe para não deixar quebrar
 *
 * **Só passa por aqui texto escrito pelo app.** Nunca o diário, nunca a frase
 * da Composta, nunca o nome da pessoa.
 *
 * O motivo é técnico e é sério: no Android o sintetizador é do sistema, e o
 * motor padrão pode gerar a fala **na nuvem** quando a voz off-line não está
 * instalada. Texto do app é texto que já está dentro do binário e na ficha da
 * loja — falá-lo não conta nada a ninguém. O que a pessoa escreveu é a coisa
 * mais privada que existe neste app, e a política de privacidade diz, com
 * todas as letras, que ele não sai do aparelho.
 *
 * Quem chamar `falar()` com conteúdo de quem usa o app quebra essa promessa
 * sem que nada no código reclame. É por isso que esta nota é a maior deste
 * arquivo.
 *
 * ## Por que não falha alto
 *
 * Voz é enfeite de condução: ajuda quem está de olhos fechados e não é
 * indispensável para ninguém. Aparelho sem motor de fala, sem voz de português
 * instalada ou com a fala desligada no sistema simplesmente não ouve nada — e
 * a prática continua inteira na tela. Nada aqui lança.
 */

/** O português que as práticas falam. */
const IDIOMA = 'pt-BR';

/**
 * Um pouco mais devagar que o normal.
 *
 * A velocidade padrão é de quem lê uma notificação. Estas frases são ditas
 * para alguém que está tentando se acalmar, e a pessoa precisa conseguir
 * **fazer** o que ouviu antes da frase seguinte.
 */
const VELOCIDADE = 0.9;

export function vozDisponivel(): boolean {
  return typeof Speech?.speak === 'function';
}

/**
 * Diz uma frase. Frase do app — ver a nota do topo.
 *
 * Cala o que estiver falando antes de começar: dois passos falando juntos é
 * pior do que passo nenhum, e quem toca em "Seguir" no meio de uma frase está
 * dizendo que já ouviu o bastante.
 */
export function falar(frase: string, aoTerminar?: () => void): void {
  if (!vozDisponivel()) return;
  const texto = frase.trim();
  if (!texto) return;
  /*
    O corte é do próprio módulo, e estourá-lo lança. As frases das práticas têm
    dezenas de caracteres e nunca chegariam perto — o guarda existe para o dia
    em que alguém passar um texto montado em tempo de execução.
  */
  const teto = Speech.maxSpeechInputLength ?? 4000;
  if (texto.length > teto) return;

  try {
    void Speech.stop();
    Speech.speak(texto, {
      language: IDIOMA,
      rate: VELOCIDADE,
      pitch: 1,
      onDone: aoTerminar,
      onStopped: undefined,
      onError: () => undefined,
    });
  } catch {
    // Sem voz, a prática segue pela tela. Ver a nota do topo.
  }
}

/** Interrompe o que estiver sendo dito, e esvazia a fila. */
export function calar(): void {
  if (!vozDisponivel()) return;
  try {
    void Speech.stop();
  } catch {
    // idem
  }
}

import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

/**
 * Vibração curta como confirmação.
 *
 * Escolhida no lugar de som de propósito. O app é usado na cama, ao lado de
 * alguém dormindo, no trabalho, no ônibus — som que começa sozinho quebra a
 * promessa de "um lugar só seu". A vibração diz a mesma coisa sem ser ouvida
 * por ninguém, e funciona com o aparelho no bolso.
 *
 * Onde ela ganha do visual: na Composta a pessoa fala olhando para o lado, e
 * na respiração o exercício pede olhos fechados. Nos dois casos a tela é
 * justamente o que ela não está vendo.
 *
 * ---
 *
 * **Por que dois caminhos.** A primeira versão usava só `expo-haptics`, e no
 * Android não se sentia nada. Duas razões: ali `impactAsync` passa pelo
 * "resposta tátil ao toque" do sistema — desligado, não acontece nada — e o
 * estilo leve é fraco demais para se notar num aparelho no bolso.
 *
 * Então no Android vai o vibrador direto, com duração em milissegundos, que
 * não depende daquela preferência. No iPhone continua o `expo-haptics`: lá o
 * Taptic Engine é preciso, e `Vibration` seria uma pancada grosseira no lugar
 * de um toque.
 *
 * Nada aqui lança erro para cima: um aparelho sem motor de vibração, ou a web,
 * simplesmente não sentem nada. Falhar em vibrar não pode derrubar uma tela.
 */

const iOS = Platform.OS === 'ios';
const android = Platform.OS === 'android';

/** Durações no Android, em milissegundos. Curtas: é confirmação, não alarme. */
const LEVE = 18;
const MEDIO = 35;
/** Espera, vibra, espera, vibra — dois toques leem como "concluído". */
const CONCLUSAO = [0, 25, 70, 45];

/** Confirmação leve: um humor escolhido, uma repetição contada. */
export function toqueLeve(ligado: boolean) {
  if (!ligado) return;
  if (android) return void Vibration.vibrate(LEVE);
  if (iOS) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Marca uma virada: a fase da respiração mudou. */
export function toqueMedio(ligado: boolean) {
  if (!ligado) return;
  if (android) return void Vibration.vibrate(MEDIO);
  if (iOS) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/**
 * Algo se completou — o registro foi salvo, a planta amadureceu.
 *
 * Reservado para conclusões de verdade. Se tudo vibrar como conquista, nada
 * vibra como conquista.
 */
export function toqueDeConclusao(ligado: boolean) {
  if (!ligado) return;
  if (android) return void Vibration.vibrate(CONCLUSAO);
  if (iOS) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

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
 * **O toque leve voltou para o sistema no Android, e desta vez de propósito.**
 * No aparelho de teste nada vibrava — nem o vibrador direto. O motivo estava
 * no celular: a vibração de "interações de toque" desligada, que num Samsung
 * cala também o vibrador pedido pelos apps, e a economia de energia, que cala
 * tudo que não é chamada, alarme ou notificação. Ligado o ajuste, todos os
 * caminhos vibraram, e o escolhido para o toque leve foi o do próprio sistema
 * (`performAndroidHapticsAsync`): é o mesmo toque dos botões do Android, e
 * segue exatamente o ajuste de quem usa. Quem desligou a vibração ao toque
 * pediu isso ao celular inteiro, e o app não tem por que insistir.
 *
 * O médio e o de conclusão continuam no vibrador direto: marcam fases da
 * respiração de olhos fechados e o fim de uma prática, e precisam de corpo
 * que um toque de botão não tem.
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

/** Confirmação leve: um botão principal, um humor escolhido, uma repetição contada. */
export function toqueLeve(ligado: boolean) {
  if (!ligado) return;
  if (android) {
    /*
      O "confirmar" do sistema só existe do Android 11 em diante; antes disso a
      chamada é recusada, e cai no toque de tecla, que existe em qualquer
      versão. Se nem ele houver, o vibrador direto.
    */
    void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
      .catch(() => Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key))
      .catch(() => Vibration.vibrate(LEVE));
    return;
  }
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

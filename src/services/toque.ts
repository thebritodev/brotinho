import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

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
 * Nada aqui lança erro para cima: um aparelho sem motor de vibração, ou a web,
 * simplesmente não sentem nada. Falhar em vibrar não pode derrubar uma tela.
 */

const disponivel = Platform.OS === 'ios' || Platform.OS === 'android';

/** Confirmação leve: um humor escolhido, uma repetição contada. */
export function toqueLeve(ligado: boolean) {
  if (!ligado || !disponivel) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Marca uma virada: a fase da respiração mudou. */
export function toqueMedio(ligado: boolean) {
  if (!ligado || !disponivel) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/**
 * Algo se completou — o registro foi salvo, a planta amadureceu.
 *
 * Reservado para conclusões de verdade. Se tudo vibrar como conquista, nada
 * vibra como conquista.
 */
export function toqueDeConclusao(ligado: boolean) {
  if (!ligado || !disponivel) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

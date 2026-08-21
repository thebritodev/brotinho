import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Lembrete diário — o app promete no onboarding "ele vai te esperar todo dia às X".
 * Cumprir essa promessa é o que este módulo faz.
 */

const CHANNEL_ID = 'lembrete-diario';

/** Identificadores fixos: reagendar substitui o anterior, nunca acumula. */
const IDENTIFIER = 'brotinho-lembrete-diario';
const WEEKLY_IDENTIFIER = 'brotinho-resumo-semanal';

/**
 * Para onde cada notificação leva quando tocada. Viaja no `data` da própria
 * notificação, então continua correto mesmo para uma que ficou dias parada na
 * gaveta do sistema.
 */
export type DestinoDeNotificacao = 'diario' | 'resumo';
export const DESTINO_KEY = 'destino';

/** Domingo de manhã — 1 = domingo na contagem do expo-notifications. */
const WEEKLY_WEEKDAY = 1;
const WEEKLY_HOUR = 9;

/**
 * O texto do lembrete, escolhido pelo horário e pelo tempo de ausência.
 *
 * Duas regras que não são estilo, são correção:
 *
 * 1. **Nada do que a pessoa escreveu entra aqui.** Notificação aparece na tela
 *    bloqueada, à vista de quem estiver por perto. Um app cuja promessa é que
 *    o diário não sai do aparelho não pode publicá-lo no aviso.
 *
 * 2. **Nenhum número de dias.** O texto é decidido na hora de agendar e repete
 *    todo dia até o app ser aberto de novo. "Faz 3 dias" nasceria certo e
 *    estaria mentindo na manhã seguinte. As frases de ausência são vagas de
 *    propósito, para continuarem verdadeiras enquanto durarem.
 */
function mensagemDoLembrete(hora: number, diasSemAparecer: number | null): string {
  // Sumiu faz tempo: acolher, nunca cobrar. Quem voltou de uma semana ruim não
  // precisa de um app dizendo que falhou com ele.
  if (diasSemAparecer !== null && diasSemAparecer >= 7) {
    return 'Seu broto continua aqui, do mesmo jeito que você deixou.';
  }
  if (diasSemAparecer !== null && diasSemAparecer >= 2) {
    return 'Sem pressa. Quando quiser, ele está aqui.';
  }

  if (hora >= 5 && hora < 12) return 'Como você está começando o dia?';
  if (hora >= 12 && hora < 18) return 'Uma pausa no meio do dia?';
  if (hora >= 18 && hora < 24) return 'Como foi seu dia?';
  return 'Se estiver difícil dormir, escrever ajuda a esvaziar a cabeça.';
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Lembrete diário',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#5B8A72',
    sound: null,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(IDENTIFIER);
  } catch {
    // Nada agendado com esse id — nada a fazer.
  }
}

/**
 * Agenda (ou reagenda) o lembrete diário.
 * @param time horário no formato "HH:MM"
 * @param diasSemAparecer há quantos dias a pessoa não registra nada; `null`
 *   para quem nunca registrou. Só muda o texto do aviso.
 * @returns true se ficou agendado
 */
export async function scheduleDailyReminder(
  time: string,
  diasSemAparecer: number | null = null,
): Promise<boolean> {
  const [hour, minute] = time.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return false;

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await ensureAndroidChannel();
  // Sem cancelar antes, trocar de horário deixaria os dois agendamentos vivos.
  await cancelDailyReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: IDENTIFIER,
    content: {
      title: 'Brotinho',
      body: mensagemDoLembrete(hour, diasSemAparecer),
      data: { [DESTINO_KEY]: 'diario' satisfies DestinoDeNotificacao },
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return true;
}

/** Reflete o estado real do sistema, não o que o app acha que agendou. */
export async function isDailyReminderScheduled(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((n) => n.identifier === IDENTIFIER);
}

// --- Resumo semanal -------------------------------------------------------

export async function cancelWeeklySummary(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_IDENTIFIER);
  } catch {
    // Nada agendado com esse id.
  }
}

/**
 * Convida a pessoa a olhar a semana que passou, domingo de manhã.
 * Não resume nada na própria notificação: o resumo depende dos registros,
 * que só existem dentro do app.
 */
export async function scheduleWeeklySummary(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await ensureAndroidChannel();
  await cancelWeeklySummary();

  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_IDENTIFIER,
    content: {
      title: 'Sua semana no Brotinho',
      body: 'Que tal olhar como foram seus últimos sete dias?',
      data: { [DESTINO_KEY]: 'resumo' satisfies DestinoDeNotificacao },
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: WEEKLY_WEEKDAY,
      hour: WEEKLY_HOUR,
      minute: 0,
    },
  });

  return true;
}

/**
 * Avisa quando a pessoa TOCA numa notificação, com o destino que veio nela.
 *
 * Cobre os dois casos: o app já estava aberto (o ouvinte dispara) e o app
 * estava fechado e foi aberto pelo toque (a última resposta fica guardada, e
 * sem ler ela o toque que abre o app do zero não levaria a lugar nenhum).
 */
export function onNotificationTap(ir: (destino: DestinoDeNotificacao) => void): () => void {
  if (Platform.OS === 'web') return () => {};

  const extrair = (resposta: Notifications.NotificationResponse | null) => {
    const destino = resposta?.notification.request.content.data?.[DESTINO_KEY];
    if (destino === 'diario' || destino === 'resumo') ir(destino);
  };

  void Notifications.getLastNotificationResponseAsync().then(extrair);
  const sub = Notifications.addNotificationResponseReceivedListener(extrair);
  return () => sub.remove();
}

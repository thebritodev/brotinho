import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { planejarLembretes } from '../data/lembretes';

/**
 * Lembrete diário — o app promete no onboarding "ele vai te esperar todo dia às X".
 * Cumprir essa promessa é o que este módulo faz.
 */

const CHANNEL_ID = 'lembrete-diario';

/**
 * Identificadores fixos: reagendar substitui o anterior, nunca acumula.
 *
 * O lembrete deixou de ser um agendamento só e virou uma fila — um aviso por
 * dia, cada um com o seu texto. Por isso o prefixo: cancelar significa varrer
 * tudo que começa com ele. O identificador antigo, de instalações que já
 * existiam, começa com o prefixo de propósito, para ser varrido junto.
 */
const PREFIXO = 'brotinho-lembrete-diario';

/**
 * Quantos avisos ficam agendados de uma vez.
 *
 * O iOS guarda no máximo 64 notificações locais pendentes por app; passar disso
 * faz o sistema descartar as mais distantes em silêncio. Vinte e quatro deixa
 * folga larga para o resumo de domingo e, com o espaçamento de quem some,
 * cobre uns quatro meses sem o app precisar ser aberto.
 */
const QUANTOS_AVISOS = 24;
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
    const agendadas = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      agendadas
        .filter((n) => n.identifier.startsWith(PREFIXO))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // Nada agendado, ou o sistema não deixou perguntar. Nada a fazer.
  }
}

/**
 * Agenda (ou reagenda) a fila de lembretes.
 *
 * Um aviso por dia enquanto a pessoa está por perto, cada vez mais espaçados
 * conforme a ausência cresce — o plano inteiro está em `data/lembretes.ts`.
 *
 * @param time horário no formato "HH:MM"
 * @param diasSemAparecer há quantos dias a pessoa não registra nada; `null`
 *   para quem nunca registrou
 * @param diasCuidados dias em que ela apareceu, para o tom de quem já tem
 *   história por aqui
 * @returns true se ficou agendado
 */
export async function scheduleDailyReminder(
  time: string,
  diasSemAparecer: number | null = null,
  diasCuidados = 0,
): Promise<boolean> {
  const [hour, minute] = time.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return false;

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await ensureAndroidChannel();
  // Sem cancelar antes, reagendar deixaria as duas filas vivas ao mesmo tempo.
  await cancelDailyReminder();

  const plano = planejarLembretes({
    agora: new Date(),
    hora: hour,
    minuto: minute,
    ausenciaHoje: diasSemAparecer,
    diasCuidados,
    quantidade: QUANTOS_AVISOS,
  });

  for (const [i, aviso] of plano.entries()) {
    await Notifications.scheduleNotificationAsync({
      // O índice mantém o identificador único dentro da fila, e o prefixo faz
      // o cancelamento varrer todos de uma vez.
      identifier: `${PREFIXO}-${i}`,
      content: {
        title: 'Brotinho',
        body: aviso.texto,
        data: { [DESTINO_KEY]: 'diario' satisfies DestinoDeNotificacao },
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: aviso.quando,
      },
    });
  }

  return plano.length > 0;
}

/** Reflete o estado real do sistema, não o que o app acha que agendou. */
export async function isDailyReminderScheduled(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((n) => n.identifier.startsWith(PREFIXO));
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

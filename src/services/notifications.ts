import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { planejarLembretes, planejarResumos } from '../data/lembretes';

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
const PREFIXO_SEMANAL = 'brotinho-resumo-semanal';

/** Uns três meses de domingos. Somados aos diários, fica bem abaixo dos 64. */
const QUANTOS_RESUMOS = 12;

/**
 * Para onde cada notificação leva quando tocada. Viaja no `data` da própria
 * notificação, então continua correto mesmo para uma que ficou dias parada na
 * gaveta do sistema.
 */
export type DestinoDeNotificacao = 'diario' | 'resumo';
export const DESTINO_KEY = 'destino';

/**
 * Domingo de manhã — **0 = domingo**, que é a contagem do `getDay()` do
 * JavaScript.
 *
 * Era 1 enquanto isto usava o gatilho `WEEKLY` do expo-notifications, onde
 * domingo é 1. Agora quem monta as datas é `planejarResumos`, com `getDay()`.
 * Manter o 1 aqui teria mudado o resumo para segunda-feira sem nenhum erro de
 * compilação e sem ninguém notar até a primeira semana em aparelho.
 */
const WEEKLY_WEEKDAY = 0;
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

/**
 * O sistema está deixando o app avisar?
 *
 * Existe porque a tela de Lembretes mostrava "Todos os dias às 21:00" olhando
 * apenas para a chave interna do app. Quem negasse a permissão do sistema via o
 * interruptor ligado, o horário escrito, e **nunca recebia nada** — com o app
 * tendo prometido no onboarding que ia esperar naquele horário.
 *
 * Pergunta pela permissão, e não pela fila agendada, de propósito: a fila é
 * escrita por um efeito que roda depois da troca do interruptor, então
 * consultá-la logo após ligar acusaria um problema que não existe. A permissão
 * é a causa de verdade e não tem essa corrida.
 */
export async function notificacoesPermitidas(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const atual = await Notifications.getPermissionsAsync();
    return atual.granted;
  } catch {
    // Não deu para perguntar: não vale acusar bloqueio sem ter certeza.
    return true;
  }
}

// --- Resumo semanal -------------------------------------------------------

export async function cancelWeeklySummary(): Promise<void> {
  try {
    const agendadas = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      agendadas
        .filter((n) => n.identifier.startsWith(PREFIXO_SEMANAL))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // Nada agendado com esse prefixo.
  }
}

/**
 * Convida a pessoa a olhar a semana que passou, domingo de manhã.
 *
 * Não resume nada na própria notificação: o resumo depende dos registros, que
 * só existem dentro do app.
 *
 * Também é uma fila, e pelo mesmo motivo do lembrete diário: era um gatilho
 * `WEEKLY` com **uma** frase, então todo domingo da vida da pessoa trazia
 * exatamente o mesmo texto. Um convite que nunca muda vira mobília.
 */
export async function scheduleWeeklySummary(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await ensureAndroidChannel();
  await cancelWeeklySummary();

  const plano = planejarResumos({
    agora: new Date(),
    diaDaSemana: WEEKLY_WEEKDAY,
    hora: WEEKLY_HOUR,
    quantidade: QUANTOS_RESUMOS,
  });

  for (const [i, aviso] of plano.entries()) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIXO_SEMANAL}-${i}`,
      content: {
        title: 'Sua semana no Brotinho',
        body: aviso.texto,
        data: { [DESTINO_KEY]: 'resumo' satisfies DestinoDeNotificacao },
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

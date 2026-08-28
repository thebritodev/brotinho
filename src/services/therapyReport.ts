import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { VALUES } from '../components';
import { findPractice, findTopic } from '../data/practices';
import { daysCaredFor, livedValues, moodWeek, patterns, ventThemes } from '../state/derived';
import type { AppData } from '../state/types';
import { moodColors, palette } from '../theme';
import { comNomeDoBrotinho, limparExportacoes } from './limparExportacoes';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const MOOD_LABEL: Record<string, string> = {
  feliz: 'Feliz',
  leve: 'Leve',
  ansioso: 'Ansioso',
  triste: 'Triste',
  cansado: 'Cansado',
  neutro: 'Neutro',
};

function buildHtml(data: AppData): string {
  const nome = data.profile.name.trim() || 'Anônimo';
  const hoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const semana = moodWeek(data);
  const padroes = patterns(data);
  const valores = livedValues(data);
  const temas = ventThemes(data);
  const maiorTema = temas[0]?.count || 1;

  const semanaHtml = semana
    .map(
      (d) => `
      <td style="text-align:center;padding:0 3px">
        <div style="height:44px;border-radius:6px;background:${
          d.mood ? moodColors[d.mood] : '#EFEFEF'
        }"></div>
        <div style="font-size:11px;color:${palette.brown400};margin-top:5px">${d.day}</div>
      </td>`,
    )
    .join('');

  const secao = (titulo: string, conteudo: string) =>
    conteudo
      ? `<section><h2>${titulo}</h2>${conteudo}</section>`
      : '';

  const padroesHtml = padroes.length
    ? `<ul>${padroes.map((p) => `<li>${escape(p)}</li>`).join('')}</ul>`
    : '';

  const valoresHtml = valores.length
    ? `<ul>${valores
        .map((v) => `<li>${VALUES[v.value].label} — ${v.count} menç${v.count === 1 ? 'ão' : 'ões'}</li>`)
        .join('')}</ul>`
    : '';

  const temasHtml = temas.length
    ? temas
        .map(
          (t) => `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700">
          <span>${escape(t.theme)}</span><span style="color:${palette.brown400}">${t.count} registro${t.count === 1 ? '' : 's'}</span>
        </div>
        <div style="height:7px;border-radius:99px;background:${palette.brown100};margin-top:4px">
          <div style="width:${(t.count / maiorTema) * 100}%;height:7px;border-radius:99px;background:${palette.green500}"></div>
        </div>
      </div>`,
        )
        .join('')
    : '';

  /**
   * Quais técnicas a pessoa usou, e quantas vezes.
   *
   * Provavelmente a parte mais útil da folha para quem atende: mostra o que ela
   * de fato pratica entre as sessões, não só como se sentiu. O app já tinha o
   * dado e já o mostrava na tela de Práticas — faltava chegar aqui.
   *
   * O tema vai junto do título porque "Respiração 4-7-8" diz pouco sem saber
   * que veio de ansiedade, e não de insônia.
   */
  const usoDasPraticas = Object.entries(
    data.practicesDone.reduce<Record<string, number>>((conta, p) => {
      const chave = `${p.topic}/${p.practice}`;
      conta[chave] = (conta[chave] ?? 0) + 1;
      return conta;
    }, {}),
  )
    .map(([chave, vezes]) => {
      const [topico, pratica] = chave.split('/');
      return { titulo: findPractice(topico, pratica)?.title, tema: findTopic(topico)?.title, vezes };
    })
    .filter((p) => p.titulo && p.tema)
    .sort((a, b) => b.vezes - a.vezes);

  const praticasHtml = usoDasPraticas.length
    ? `<ul>${usoDasPraticas
        .map(
          (p) =>
            `<li>${escape(p.titulo!)} <span style="color:${palette.brown400}">(${escape(
              p.tema!,
            )})</span> — ${p.vezes} vez${p.vezes === 1 ? '' : 'es'}</li>`,
        )
        .join('')}</ul>`
    : '';

  const diasCuidados = daysCaredFor(data);

  const humores = data.moodHistory.length
    ? `<p>${data.moodHistory.length} registro${data.moodHistory.length === 1 ? '' : 's'} de humor. Mais recente: ${
        MOOD_LABEL[data.moodHistory[0].mood] ?? data.moodHistory[0].mood
      }.</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, 'Segoe UI', sans-serif; color: ${palette.brown900};
         padding: 36px; line-height: 1.55; }
  h1 { font-size: 24px; margin: 0 0 4px; color: ${palette.green700}; }
  h2 { font-size: 16px; margin: 26px 0 10px; color: ${palette.green700}; }
  .meta { color: ${palette.brown400}; font-size: 13px; margin-bottom: 8px; }
  ul { margin: 0; padding-left: 18px; }
  li { margin-bottom: 6px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; }
  footer { margin-top: 34px; font-size: 11px; color: ${palette.brown400};
           border-top: 1px solid ${palette.brown100}; padding-top: 10px; }
</style></head><body>
  <h1>Resumo para terapia</h1>
  <p class="meta">${escape(nome)} · gerado em ${hoje}</p>

  ${secao('Humor na semana', `<table><tr>${semanaHtml}</tr></table>${humores}`)}
  ${secao('Padrões identificados', padroesHtml)}
  ${secao('Valores mais presentes', valoresHtml)}
  ${secao('Temas dos registros', temasHtml)}
  ${secao('Práticas utilizadas', praticasHtml)}
  ${secao(
    'Registros',
    `<p>${data.journal.length} registro${data.journal.length === 1 ? '' : 's'} no diário${
      data.startedAt ? `, desde ${new Date(`${data.startedAt}T12:00:00`).toLocaleDateString('pt-BR')}` : ''
    }.</p>
     <p>${diasCuidados} dia${diasCuidados === 1 ? '' : 's'} com algum registro no app.</p>`,
  )}

  <footer>
    Gerado pelo Brotinho. Os textos do diário não são incluídos: este resumo traz
    apenas padrões e contagens, para você decidir o que quer contar.
  </footer>
</body></html>`;
}

/** Gera o PDF e devolve o caminho do arquivo. */
export async function generateTherapyPdf(data: AppData): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html: buildHtml(data) });
  // O PDF fica no cache até a próxima abertura do app — ver limparExportacoes.
  return comNomeDoBrotinho(uri, `resumo-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/** Gera e abre a folha de compartilhamento do sistema. */
export async function shareTherapyPdf(data: AppData): Promise<void> {
  // Varre o que sobrou de uma exportação anterior antes de criar mais uma.
  limparExportacoes();
  const uri = await generateTherapyPdf(data);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento não disponível neste aparelho.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Resumo para terapia',
    UTI: 'com.adobe.pdf',
  });
}

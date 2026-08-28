import { File, Paths } from 'expo-file-system';

import { limparExportacoes } from './limparExportacoes';
import * as Sharing from 'expo-sharing';

import { findPractice, findTopic } from '../data/practices';
import { VALUES, type ValueKey } from '../components/brand/ValueBadge';
import { dayKey, daysCaredFor } from '../state/derived';
import type { Mood } from '../theme';
import type { AppData } from '../state/types';

/**
 * Uma cópia de tudo o que o app guarda, para a pessoa levar embora.
 *
 * Existiam três afirmações que não se sustentavam juntas: a tela "Meus dados"
 * mandava ir em Privacidade para *baixar*, Privacidade só sabia apagar, e a
 * política de privacidade — a do app e a publicada — dizia que o direito de
 * portabilidade da LGPD "se exerce pelas próprias telas do app". Não havia
 * tela nenhuma.
 *
 * Aqui pesa mais do que em outros apps: sem conta e sem servidor, se o celular
 * se perder e o backup do sistema estiver desligado, o diário acabou — não
 * existe cópia nossa para devolver. Este arquivo é a única rede.
 *
 * ---
 *
 * **São dois formatos, e o padrão é o legível.** A primeira versão exportava
 * só JSON, porque portabilidade na lei quer um formato que outro programa
 * consiga ler. Só que quem toca em "Baixar meus dados" quase sempre quer o
 * próprio diário para ler ou guardar, e recebia um amontoado de chaves e
 * colchetes — tecnicamente correto e inútil na prática.
 *
 * Agora o texto vem primeiro, e o JSON continua ali para quem for levar os
 * dados para outro lugar. Os dois trazem tudo.
 */

export type ResultadoDaExportacao = 'ok' | 'sem-compartilhamento';

const MOOD_LABEL: Record<Mood, string> = {
  feliz: 'Feliz',
  leve: 'Leve',
  ansioso: 'Ansioso',
  triste: 'Triste',
  cansado: 'Cansado',
  neutro: 'Neutro',
};

const porExtenso = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const curta = (ms: number) => new Date(ms).toLocaleDateString('pt-BR');

const REGUA = '────────────────────────────────────';

/** "1 registro" e "2 registros" — "registro(s)" é preguiça à vista. */
const plural = (n: number, singular: string, plural_: string) =>
  `${n} ${n === 1 ? singular : plural_}`;

/** O arquivo que a pessoa abre e lê. */
function textoLegivel(data: AppData): string {
  const linhas: string[] = [];
  const nome = data.profile.name.trim();

  linhas.push('BROTINHO — SEUS REGISTROS');
  linhas.push(
    `${nome ? `${nome} · ` : ''}exportado em ${new Date().toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
  );
  linhas.push('');
  if (data.startedAt) linhas.push(`Cuidando de si desde ${porExtenso(data.startedAt)}.`);
  const dias = daysCaredFor(data);
  linhas.push(`${dias} ${dias === 1 ? 'dia' : 'dias'} com algum registro.`);

  // --- Diário: o que a pessoa mais quer de volta, então vem primeiro -------
  if (data.journal.length) {
    linhas.push('', REGUA, `DIÁRIO — ${plural(data.journal.length, 'registro', 'registros')}`, '');
    [...data.journal]
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((e) => {
        linhas.push(porExtenso(dayKey(e.createdAt)));
        linhas.push(e.text);
        linhas.push('');
      });
  }

  if (data.moodHistory.length) {
    linhas.push(REGUA, `HUMORES — ${plural(data.moodHistory.length, 'dia', 'dias')}`, '');
    [...data.moodHistory]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((m) => linhas.push(`${porExtenso(m.date)} — ${MOOD_LABEL[m.mood] ?? m.mood}`));
    linhas.push('');
  }

  if (data.composts.length) {
    linhas.push(REGUA, `COMPOSTAGENS — ${data.composts.length}`, '');
    [...data.composts]
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((c) =>
        linhas.push(
          `${curta(c.createdAt)} — "${c.thought}" — ${plural(c.reps, 'repetição', 'repetições')}, ${Math.round(c.secs)}s`,
        ),
      );
    linhas.push('');
  }

  if (data.practicesDone.length) {
    linhas.push(REGUA, `PRÁTICAS — ${data.practicesDone.length}`, '');
    [...data.practicesDone]
      .sort((a, b) => a.at - b.at)
      .forEach((p) => {
        const pratica = findPractice(p.topic, p.practice);
        const tema = findTopic(p.topic);
        linhas.push(
          `${curta(p.at)} — ${pratica?.title ?? p.practice}${tema ? ` (${tema.title})` : ''}`,
        );
      });
    linhas.push('');
  }

  if (data.garden.length) {
    linhas.push(REGUA, `JARDIM — ${plural(data.garden.length, 'planta', 'plantas')}`, '');
    data.garden.forEach((p) => {
      const valor = p.valor ? VALUES[p.valor as ValueKey]?.label : null;
      linhas.push(
        `${porExtenso(p.maturedAt)} — ${plural(p.dias, 'dia', 'dias')}` +
          (p.mood ? ` — humor mais presente: ${MOOD_LABEL[p.mood]}` : '') +
          (valor ? ` — valor: ${valor}` : ''),
      );
    });
    linhas.push('');
  }

  linhas.push(REGUA);
  linhas.push('Estes são os seus registros, guardados no seu aparelho.');
  linhas.push('O Brotinho não tem cópia deles.');

  return linhas.join('\n');
}

/**
 * O mesmo conteúdo em JSON, para quem for levar os dados a outro programa.
 *
 * Uma versão e uma data acompanham os dados: quem abrir isto daqui a dois anos
 * precisa saber de quando é e de que formato veio.
 */
function json(data: AppData): string {
  return JSON.stringify(
    { app: 'Brotinho', formato: 1, exportadoEm: new Date().toISOString(), dados: data },
    null,
    2,
  );
}

async function entregar(nome: string, conteudo: string, tipo: string, uti: string) {
  // Varre o que sobrou de uma exportação anterior antes de criar mais uma. O
  // arquivo abaixo tem o diário por extenso; ver `limparExportacoes`.
  limparExportacoes();

  const arquivo = new File(Paths.cache, nome);
  // Reexportar no mesmo dia cai no mesmo nome, e `create` reclama de arquivo
  // existente — sobrescrever é o comportamento certo aqui.
  arquivo.create({ overwrite: true });
  arquivo.write(conteudo);

  await Sharing.shareAsync(arquivo.uri, {
    mimeType: tipo,
    dialogTitle: 'Meus dados do Brotinho',
    UTI: uti,
  });
}

/** O arquivo para ler: texto, com o diário por extenso. */
export async function exportarLegivel(data: AppData): Promise<ResultadoDaExportacao> {
  if (!(await Sharing.isAvailableAsync())) return 'sem-compartilhamento';
  await entregar(`brotinho-${dayKey()}.txt`, textoLegivel(data), 'text/plain', 'public.plain-text');
  return 'ok';
}

/** O arquivo para levar a outro programa. */
export async function exportarJson(data: AppData): Promise<ResultadoDaExportacao> {
  if (!(await Sharing.isAvailableAsync())) return 'sem-compartilhamento';
  await entregar(`brotinho-${dayKey()}.json`, json(data), 'application/json', 'public.json');
  return 'ok';
}

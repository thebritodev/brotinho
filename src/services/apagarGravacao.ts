import { File } from 'expo-file-system';

/**
 * Encerra o gravador e apaga o arquivo que ele deixou no cache.
 *
 * O microfone do Brotinho é usado em dois lugares: na Composta, onde a pessoa
 * diz em voz alta o pensamento que mais a machuca, e no ditado do diário. Nos
 * dois, o gravador do `expo-audio` escreve um `.m4a` no cache do app. Nenhum dos
 * dois precisa desse arquivo depois — a Composta nem chega a abri-lo, porque só
 * usa o medidor de volume.
 *
 * ---
 *
 * **Por que isto virou uma função só.** A primeira versão apagava em cada tela,
 * e as duas leram a URI em momentos diferentes: uma antes de parar, outra
 * depois. A de antes estava errada — em `expo-audio` a URI só é confiável
 * quando a gravação foi finalizada, então o arquivo podia nunca ser apagado.
 *
 * Um erro desses não aparece em teste nenhum: o app funciona igual, e o áudio
 * fica no aparelho. Por isso a leitura agora acontece **dos dois lados**, e
 * apaga o que existir.
 *
 * Falhar em apagar não pode derrubar uma tela. Tudo aqui é engolido: no pior
 * caso o sistema limpa o cache sozinho depois.
 */
export async function pararEApagar(gravador: {
  uri: string | null;
  stop: () => Promise<void>;
}): Promise<void> {
  const antes = gravador.uri;

  try {
    await gravador.stop();
  } catch {
    // Parar um gravador que nunca começou lança, e não é problema:
    // no modo por frase quem escuta é o reconhecimento, não este gravador.
  }

  const alvo = gravador.uri ?? antes;
  if (!alvo) return;

  try {
    new File(alvo).delete();
  } catch {
    // sem drama: é cache
  }
}

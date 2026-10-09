import { Platform } from 'react-native';

import { Directory, File, Paths } from 'expo-file-system';

/**
 * A foto de perfil: escolher da galeria, guardar, apagar.
 *
 * ## O que ela é, e o que ela não é
 *
 * É o retrato no disco ao lado do "Oi, ..." da tela inicial. Quem não escolhe
 * nada continua vendo o broto ali, e o broto ali passou a sorrir sempre — ver
 * `CabecalhoDaHome`.
 *
 * Não é uma conta. Não sobe para lugar nenhum, não tem servidor, não aparece
 * para mais ninguém. A foto é copiada para a pasta do próprio app e fica lá,
 * do lado do diário, sob a mesma promessa.
 *
 * ## A galeria nunca é lida pelo app
 *
 * Isto importa mais aqui do que pareceria, porque o app promete por escrito
 * que não olha as fotos de ninguém — e a promessa continua verdadeira.
 *
 * `launchImageLibraryAsync` não abre a galeria **dentro** do app: ela chama o
 * selecionador do sistema, que roda fora do processo do Brotinho. O que volta é
 * uma cópia do único arquivo que a pessoa tocou. No Android isso é o
 * selecionador de fotos do sistema, que dispensa permissão de leitura — as três
 * permissões de leitura seguem bloqueadas no `app.json`, de propósito. No
 * iPhone é o `PHPicker`, que também não pede acesso à biblioteca.
 *
 * Ou seja: não existe momento em que o app possa listar, varrer ou enviar as
 * fotos da pessoa. Ele recebe uma, entregue na mão.
 *
 * ## Por que o módulo é carregado dentro da função
 *
 * Porque **módulo nativo que não está no binário derruba o app no boot**, e
 * `expo-image-picker` acabou de chegar ao projeto: existem aparelhos com uma
 * build anterior a ele por aí. A história inteira está em `guardarFrase`, que
 * é quem guarda o ajudante; `confere-modulos-tardios.js` guarda a regra. Aqui
 * a pior coisa que acontece num binário sem o módulo é o botão dizer que não
 * dá.
 *
 * ## Por que só o nome do arquivo é guardado
 *
 * Porque a pasta de documentos **troca de endereço**. No iPhone ela vive dentro
 * de um contêiner cujo identificador muda a cada atualização do app; uma URI
 * absoluta guardada hoje aponta para o nada depois do próximo update. Guardando
 * o nome e remontando o caminho na hora, a foto sobrevive às atualizações.
 */

/** A pasta onde o retrato mora, dentro da pasta do app. */
const PASTA = 'retrato';

export type ResultadoDaFoto =
  | { tipo: 'ok'; nome: string }
  /** A pessoa fechou o selecionador sem escolher. Não é erro, e não avisa nada. */
  | { tipo: 'cancelou' }
  /** Não existe galeria aqui — a web, ou uma build sem o módulo. */
  | { tipo: 'indisponivel' }
  | { tipo: 'falhou'; motivo: string };

/**
 * Um módulo nativo carregado na hora do uso, ou `null` se ele não existe aqui.
 *
 * `require` e não `import`: `import` é içado para o topo do arquivo pelo
 * empacotador, e içado para o topo ele volta a rodar no boot — que é
 * exatamente o que isto existe para impedir. Ver `guardarFrase`.
 */
function moduloTardio<T>(carregar: () => T): T | null {
  try {
    return carregar();
  } catch {
    return null;
  }
}

function motivoDe(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function pastaDoRetrato(): Directory {
  return new Directory(Paths.document, PASTA);
}

/**
 * O caminho completo da foto, a partir do nome guardado.
 *
 * `null` quando não há foto — e é esse `null` que o cabeçalho lê para desenhar
 * o broto no lugar dela.
 */
export function caminhoDaFoto(nome: string | null | undefined): string | null {
  if (!nome || Platform.OS === 'web') return null;
  try {
    return new File(pastaDoRetrato(), nome).uri;
  } catch {
    return null;
  }
}

/** A foto guardada ainda está no disco? */
export function aFotoExiste(nome: string | null | undefined): boolean {
  if (!nome || Platform.OS === 'web') return false;
  try {
    return new File(pastaDoRetrato(), nome).exists;
  } catch {
    return false;
  }
}

/** Apaga a pasta do retrato inteira, com o que houver dentro. */
export function apagarFotoDePerfil(): void {
  if (Platform.OS === 'web') return;
  try {
    const pasta = pastaDoRetrato();
    if (pasta.exists) pasta.delete();
  } catch {
    /*
      Sem alarme. Não conseguir apagar um avatar não é motivo para interromper
      nada: o estado já perdeu o nome, e o que sobra é um arquivo órfão de
      alguns quilobytes que a desinstalação leva.
    */
  }
}

/** A extensão da origem, quando é uma que dá para desenhar. */
function extensaoDe(uri: string): string {
  const limpo = uri.split('?')[0] ?? '';
  const ponto = limpo.lastIndexOf('.');
  const achada = ponto >= 0 ? limpo.slice(ponto + 1).toLowerCase() : '';
  return ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(achada) ? achada : 'jpg';
}

/**
 * Abre a galeria do sistema e guarda o que a pessoa escolher.
 *
 * Devolve o **nome** do arquivo guardado, que é o que vai para o perfil.
 *
 * `allowsEditing` com `aspect: [1, 1]`: o retrato é um disco, e quem escolhe
 * uma foto deitada sem poder recortar vê o nariz da própria foto no canto do
 * círculo. O iPhone recorta em quadrado por conta própria; o `aspect` é o que
 * diz isso ao Android.
 *
 * `quality: 0,8` e nada de `base64`: o arquivo vai ser desenhado num disco de
 * 52 pontos. Guardar os doze megapixels da câmera para isso seria encher o
 * aparelho da pessoa por nada.
 */
export async function escolherFotoDePerfil(): Promise<ResultadoDaFoto> {
  if (Platform.OS === 'web') return { tipo: 'indisponivel' };

  const ImagePicker = moduloTardio<typeof import('expo-image-picker')>(
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    () => require('expo-image-picker'),
  );
  if (!ImagePicker) return { tipo: 'indisponivel' };

  try {
    const escolha = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (escolha.canceled) return { tipo: 'cancelou' };
    const origem = escolha.assets?.[0]?.uri;
    if (!origem) return { tipo: 'falhou', motivo: 'o sistema não devolveu a foto' };

    /*
      A pasta é apagada e refeita, em vez de só escrever em cima.

      O nome carrega a hora, para o `Image` não mostrar a foto antiga do cache
      quando a pessoa troca de retrato — com nome fixo, a URI é a mesma e o
      cache ganha. E, com nomes diferentes, escrever sem apagar deixaria uma
      pilha de retratos velhos na pasta do app para sempre.
    */
    apagarFotoDePerfil();
    const pasta = pastaDoRetrato();
    pasta.create({ intermediates: true, idempotent: true });

    const nome = `retrato-${Date.now()}.${extensaoDe(origem)}`;
    new File(origem).copy(new File(pasta, nome));
    return { tipo: 'ok', nome };
  } catch (e) {
    return { tipo: 'falhou', motivo: motivoDe(e) };
  }
}

import { useCallback, useMemo, useState } from 'react';

import {
  aFotoExiste,
  apagarFotoDePerfil,
  caminhoDaFoto,
  escolherFotoDePerfil,
} from '../../services/fotoDePerfil';
import { useAppState } from '../../state/AppStateProvider';

/**
 * A foto de perfil, do ponto de vista de quem desenha a tela.
 *
 * Existe porque duas telas precisam dela: o retrato da tela inicial, que
 * mostra, e Meus dados, que troca e remove. Com a lógica em cada uma, as duas
 * iam divergir no detalhe que importa — qual é o aviso quando o aparelho não
 * tem galeria, e o que acontece com o arquivo antigo.
 *
 * ## Por que o caminho é remontado, e conferido
 *
 * O perfil guarda só o **nome** do arquivo; a pasta do app muda de endereço a
 * cada atualização, no iPhone. E o arquivo pode não estar lá: um backup
 * restaurado num aparelho novo traz o nome da foto sem trazer a foto, porque o
 * backup é do JSON. Conferir uma vez aqui é o que faz o retrato cair de volta
 * no broto em vez de virar um quadrado vazio.
 */
export function useFotoDePerfil() {
  const { data, updateProfile } = useAppState();
  const nome = data.profile.fotoDePerfil;

  /** O caminho pronto, ou `null` — porque não há foto, ou porque sumiu. */
  const foto = useMemo(() => (aFotoExiste(nome) ? caminhoDaFoto(nome) : null), [nome]);

  /**
   * O que dizer quando não deu.
   *
   * Cancelar não é "não deu": quem fecha a galeria sem escolher não precisa de
   * mensagem nenhuma, e um aviso ali seria o app comentando uma desistência.
   */
  const [aviso, setAviso] = useState<string | null>(null);

  const escolher = useCallback(async () => {
    setAviso(null);
    const r = await escolherFotoDePerfil();
    if (r.tipo === 'ok') {
      updateProfile({ fotoDePerfil: r.nome });
      return;
    }
    if (r.tipo === 'cancelou') return;
    setAviso(
      r.tipo === 'indisponivel'
        ? 'Não consegui abrir a galeria neste aparelho.'
        : 'Não consegui usar essa foto. Tente outra.',
    );
  }, [updateProfile]);

  const remover = useCallback(() => {
    setAviso(null);
    apagarFotoDePerfil();
    updateProfile({ fotoDePerfil: null });
  }, [updateProfile]);

  return { foto, temFoto: !!foto, escolher, remover, aviso };
}

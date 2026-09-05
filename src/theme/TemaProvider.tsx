import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import {
  TEMAS,
  type Cores,
  type Palette,
  type PreferenciaDeTema,
  type Sombra,
  type Sombras,
  type Tema,
  type TintDoTema,
  type Vidro,
} from './tokens';
import type { Mood } from './tokens';

/**
 * O tema em uso, e o que cada tela lê para saber de que cor pintar.
 *
 * ---
 *
 * **Por que as chaves não mudam.** Quem consome escreve `colors.bg` e
 * `palette.brown700` exatamente como antes — a única diferença é de onde vêm.
 * Isso foi decidido na camada da paleta e é o que torna a migração viável: são
 * 559 escritas de cor em 64 arquivos, e nenhuma delas precisa ser reescrita.
 * Cada arquivo troca a linha de import por uma chamada de gancho, e pronto.
 *
 * **Três estados, não dois.** "Sistema" é o padrão porque é o que a pessoa já
 * configurou no aparelho, e porque um app de diário usado de madrugada deve
 * seguir a escolha que ela já fez para tudo o mais. Claro e escuro fixos
 * existem para quem quer o app diferente do resto — caso comum aqui: gente que
 * usa o celular no claro e o diário no escuro.
 *
 * **O `ErrorBoundary` fica de fora deste provedor, de propósito.** Ele é a tela
 * que aparece quando alguma coisa quebrou, e depender do sistema de temas para
 * desenhá-la significaria não conseguir desenhá-la justamente quando o tema for
 * o que quebrou. Ele segue nas cores claras, sempre.
 */

export type ConteudoDoTema = {
  /** O tema resolvido: o que "sistema" virou depois de olhar o aparelho. */
  tema: Tema;
  colors: Cores;
  palette: Palette;
  moodColors: Record<Mood, string>;
  /** A mesma cor quando ela é superfície atrás do desenho — ver `tokens`. */
  moodColorsFundo: Record<Mood, string>;
  shadows: Sombras;
  /**
   * Um tom por tema de prática — o quadrado atrás do ícone na lista.
   *
   * Vem por aqui, e não da paleta, porque os treze precisam ser distintos
   * **entre si**, e a paleta não tem treze entradas livres: as que sobravam
   * eram cores de humor, e mexer nelas mudaria as carinhas. Ver `tokens`.
   */
  tintsDosTemas: Record<TintDoTema, string>;
  /** As superfícies translúcidas do redesenho — ver `vidros` em `tokens`. */
  vidros: { cartao: Vidro; destaque: Vidro };
  /** O gradiente e a sombra do botão principal — ver `botaoPrimario`. */
  botaoPrimario: Vidro & { sombra: Sombra };
};

function resolver(preferencia: PreferenciaDeTema, doSistema: 'light' | 'dark' | null): Tema {
  if (preferencia === 'claro') return 'claro';
  if (preferencia === 'escuro') return 'escuro';
  return doSistema === 'dark' ? 'escuro' : 'claro';
}

/**
 * O valor padrão do contexto é o tema claro inteiro, e não `null`.
 *
 * Um componente que renderize fora do provedor — num teste, numa árvore de
 * erro — recebe cores válidas em vez de estourar. Numa tela de saúde mental,
 * falhar mostrando cor errada é melhor do que falhar mostrando nada.
 */
const TemaContext = createContext<ConteudoDoTema>({
  tema: 'claro',
  colors: TEMAS.claro.colors,
  palette: TEMAS.claro.palette,
  moodColors: TEMAS.claro.moodColors,
  moodColorsFundo: TEMAS.claro.moodColorsFundo,
  shadows: TEMAS.claro.shadows,
  tintsDosTemas: TEMAS.claro.tintsDosTemas,
  vidros: TEMAS.claro.vidros,
  botaoPrimario: TEMAS.claro.botaoPrimario,
});

export function TemaProvider({
  preferencia,
  children,
}: {
  preferencia: PreferenciaDeTema;
  children: React.ReactNode;
}) {
  const doSistema = useColorScheme();
  const tema = resolver(preferencia, doSistema ?? null);

  const valor = useMemo<ConteudoDoTema>(
    () => ({
      tema,
      colors: TEMAS[tema].colors,
      palette: TEMAS[tema].palette,
      moodColors: TEMAS[tema].moodColors,
      moodColorsFundo: TEMAS[tema].moodColorsFundo,
      shadows: TEMAS[tema].shadows,
      tintsDosTemas: TEMAS[tema].tintsDosTemas,
      vidros: TEMAS[tema].vidros,
      botaoPrimario: TEMAS[tema].botaoPrimario,
    }),
    [tema],
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

/** As cores do tema em uso. Substitui o import direto de `theme`. */
export function useTema(): ConteudoDoTema {
  return useContext(TemaContext);
}

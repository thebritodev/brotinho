import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import {
  AbasVivas,
  BottomNav,
  CamadaEmpilhada,
  ProvedorDeCobertura,
  type TabKey,
} from '../components';
import { BrotinhoScreen } from '../screens/app/BrotinhoScreen';
import { HomeScreen } from '../screens/app/HomeScreen';
import { GardenScreen } from '../screens/app/GardenScreen';
import { JournalScreen } from '../screens/app/JournalScreen';
import { PracticesScreen } from '../screens/app/PracticesScreen';
import { PrivacyScreen } from '../screens/app/PrivacyScreen';
import { RemindersScreen } from '../screens/app/RemindersScreen';
import { ProfileScreen } from '../screens/app/ProfileScreen';
import { SettingsScreen } from '../screens/app/SettingsScreen';
import { TherapySummaryScreen } from '../screens/app/TherapySummaryScreen';
import { ConselhosGuardadosScreen } from '../screens/app/ConselhosGuardadosScreen';
import type { SubScreen } from '../screens/app/types';
import type { OrigemDoRegistro } from '../state/types';
import { CompostaScreen } from '../screens/composta/CompostaScreen';
import { ValuesScreen } from '../screens/app/ValuesScreen';
import { onNotificationTap } from '../services/notifications';
import { useBotaoVoltar } from './useBotaoVoltar';
import { ANCORA_RAPIDA } from '../data/practices';
import { useAppState } from '../state/AppStateProvider';
import { useTema } from '../theme';

/**
 * As abas **na ordem da barra de baixo**, da esquerda para a direita.
 *
 * É esta ordem que decide de que lado a aba nova entra na troca: o movimento na
 * tela é o mesmo movimento que o dedo fez na barra. Ver `AbasVivas`.
 *
 * Ela também serve para o aquecimento, e por sorte na ordem certa: o app abre
 * na Início, e o primeiro que falta é o Brotinho — que é a aba mais cara de
 * montar e a mais procurada. O Perfil vem por último, porque é o mais barato e
 * o menos visitado.
 *
 * Fora da função para a lista não mudar de identidade a cada render — o
 * aquecimento se reagendaria para sempre.
 */
const ABAS: readonly TabKey[] = ['broto', 'home', 'perfil'];

export function MainTabs() {
  const { colors } = useTema();
  const { data } = useAppState();
  const [tab, setTab] = useState<TabKey>('home');
  const [sub, setSub] = useState<SubScreen | null>(null);
  /**
   * A aba de baixo está coberta por uma tela empilhada?
   *
   * Não é `sub !== null`: esta resposta vira no fim da animação, e quem a
   * manda é a própria `CamadaEmpilhada` — ver o `aoCobrir` de lá.
   */
  const [coberta, setCoberta] = useState(false);
  /**
   * A pergunta que uma prática mandou para o diário.
   *
   * Mora aqui porque a viagem atravessa duas telas — a prática está dentro de
   * `praticas`, que é uma tela empilhada, e o diário é uma aba. Some ao trocar
   * de aba: voltar ao diário depois não é mais o mesmo pedido.
   */
  const [comecoDaPratica, setComecoDaPratica] = useState<string | null>(null);
  /**
   * De onde veio a pergunta que abriu o diário — a prática, ou a Composta.
   *
   * Viaja junto com a pergunta e pelo mesmo motivo: quem escreve está noutra
   * tela, e o registro precisa saber de onde nasceu. Some quando a pergunta
   * some.
   */
  const [origemDoRegistro, setOrigemDoRegistro] = useState<OrigemDoRegistro | null>(null);
  /** A prática oferecida na Home, para as Práticas já abrirem nela. */
  const [praticaAlvo, setPraticaAlvo] = useState<{ topico: string; pratica: string } | null>(null);

  const name = data.profile.name.trim() || 'você';
  /**
   * A altura em que a Home estava, guardada **fora** dela.
   *
   * Abrir uma subtela desmontava a Home: a tela empilhada e a aba ocupavam a
   * mesma posição na árvore, e voltar montava uma Home nova, com uma
   * `ScrollView` nova, que nasce no zero — a pessoa tocava num cartão no meio
   * da tela e voltava para o começo dela, perdendo o lugar. Hoje a
   * `CamadaEmpilhada` e a `AbasVivas` mantêm a aba montada, e isto virou o
   * cinto de segurança da primeira montagem.
   *
   * Uma `ref`, e não `useState`, porque isto muda a cada quadro de rolagem e
   * não deve provocar renderização nenhuma. E aqui em cima, e não na Home,
   * porque é justamente a Home que deixa de existir no meio do caminho.
   */
  const rolagemDaHome = useRef(0);
  /**
   * O mesmo, para a aba do broto.
   *
   * Ela precisa disto desde que o Diário mudou de lugar: o cartão do Diário fica
   * no meio da tela, e o diário é tela empilhada — abrir desmontava a aba, e
   * voltar montava uma aba nova, no topo. Quem tinha descido para escrever
   * voltava lá em cima e tinha de descer de novo, toda vez.
   */
  const rolagemDoBroto = useRef(0);

  /**
   * Fecha a tela empilhada — e joga fora a pergunta que trouxe alguém até aqui.
   *
   * A pergunta e a origem valem para **uma** ida ao diário. Sem esta limpeza
   * elas sobreviviam ao fechamento: quem compostava um pensamento, tocava em
   * "Escrever sobre isso", lia a pergunta e voltava, encontrava a mesma
   * pergunta esperando ao abrir o diário pelo carrossel meia hora depois — e o
   * registro novo saía etiquetado "depois de compostar um pensamento", o que
   * simplesmente não era verdade.
   *
   * O `JournalScreen` lê o começo uma vez só, ao montar, então quem apaga tem
   * de ser quem guarda.
   */
  const closeSub = () => {
    setSub(null);
    setComecoDaPratica(null);
    setOrigemDoRegistro(null);
  };

  const abrirPratica = (alvo: { topico: string; pratica: string }) => {
    setPraticaAlvo(alvo);
    setSub('praticas');
  };

  /**
   * O caminho curto de "estou muito mal agora" até o aterramento.
   *
   * Sai do CVV, no Diário e na Composta: quem abre aquela porta e não está
   * pronta para falar com alguém não recebia nada além de "Agora não".
   */
  const ancorarAgora = () => abrirPratica(ANCORA_RAPIDA);

  /**
   * O último degrau antes de o app fechar.
   *
   * A ordem é a mesma que a pessoa percorreu: fecha o que está empilhado, e
   * depois volta para o Início. Só na Home é que o voltar sai do app — que é
   * o comportamento que todo aplicativo Android tem.
   */
  useBotaoVoltar(() => {
    if (sub) {
      closeSub();
      return true;
    }
    if (tab !== 'home') {
      setTab('home');
      // A pergunta que uma prática mandou para o diário não sobrevive à saída
      // dele, igual ao que a barra de baixo faz.
      setComecoDaPratica(null);
      setOrigemDoRegistro(null);
      return true;
    }
    return false;
  });

  // Tocar no lembrete leva ao diário; tocar no resumo semanal, ao resumo.
  // Antes o toque só trazia o app de volta para onde ele tinha parado.
  useEffect(
    () =>
      onNotificationTap((destino) => {
        if (destino === 'diario') {
          /*
            O Diário é tela empilhada, e a aba por baixo dele é a do broto.

            Foi a Início por um tempo, quando o cartão do Diário morava no
            carrossel de lá. O cartão mudou de tela; a aba por baixo mudou
            junto. Voltar do diário devolve a pessoa ao lugar de onde ele é
            aberto, e não a um lugar onde ele não está mais.
          */
          setTab('broto');
          setSub('diario');
          return;
        }
        setTab('perfil');
        setSub('terapia');
      }),
    [],
  );

  /*
    Recebe a tela como argumento, e não lê o `sub`: a `CamadaEmpilhada`
    continua desenhando a tela que está **saindo** depois de o `sub` já ter
    virado `null`. Lendo o estado, a saída seria uma camada vazia.
  */
  const renderSub = (qual: SubScreen) => {
    switch (qual) {
      case 'terapia':
        return <TherapySummaryScreen onBack={closeSub} />;
      case 'config':
        return <SettingsScreen onBack={closeSub} />;
      case 'privacidade':
        return <PrivacyScreen onBack={closeSub} />;
      case 'composta':
        return (
          <CompostaScreen
            onClose={closeSub}
            aoFazerExercicio={ancorarAgora}
            aoEscreverNoDiario={(comeco) => {
              setComecoDaPratica(comeco);
              setOrigemDoRegistro({ tipo: 'composta' });
              setSub('diario');
            }}
          />
        );
      case 'praticas':
        return (
          <PracticesScreen
            alvo={praticaAlvo}
            onBack={closeSub}
            onEscreverNoDiario={(comeco, origem) => {
              setComecoDaPratica(comeco);
              setOrigemDoRegistro(origem);
              setSub('diario');
            }}
          />
        );
      case 'valores':
        return <ValuesScreen onBack={closeSub} />;
      case 'lembretes':
        return <RemindersScreen onBack={closeSub} />;
      case 'jardim':
        return <GardenScreen onBack={closeSub} />;
      case 'conselhos':
        return <ConselhosGuardadosScreen onBack={closeSub} />;
      case 'diario':
        return (
          <JournalScreen
            onBack={closeSub}
            comecoDaPratica={comecoDaPratica}
            origem={origemDoRegistro}
            aoFazerExercicio={ancorarAgora}
            aoAbrirPratica={abrirPratica}
          />
        );
      default:
        return null;
    }
  };

  /*
    Um elemento por aba, feito uma vez só.

    As abas ficam todas montadas — ver `AbasVivas` — e a `AbasVivas` pede o
    elemento de cada uma a cada render. Se ele fosse novo a cada vez, abrir uma
    prática (que muda o `sub` daqui) redesenharia as três abas por baixo, e a
    travada voltaria pela porta dos fundos. Congelados, o React nem entra
    nelas.

    O `name` é a única coisa daqui que elas leem e que muda.
  */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const abas = useMemo(
    () => ({
      home: (
        <HomeScreen
          name={name}
          onOpenComposta={() => setSub('composta')}
          onOpenSettings={() => setSub('config')}
          onOpenPractices={(alvo) => {
            setPraticaAlvo(alvo ?? null);
            setSub('praticas');
          }}
          onOpenConselhosGuardados={() => setSub('conselhos')}
          rolagemInicial={rolagemDaHome.current}
          aoRolar={(y) => {
            rolagemDaHome.current = y;
          }}
          onOpenReminders={() => setSub('lembretes')}
          onOpenGarden={() => setSub('jardim')}
        />
      ),
      broto: (
        <BrotinhoScreen
          onOpenGarden={() => setSub('jardim')}
          onOpenDiario={() => setSub('diario')}
          onOpenComposta={() => setSub('composta')}
          onOpenConselhosGuardados={() => setSub('conselhos')}
          onOpenValues={() => setSub('valores')}
          onOpenPractices={(alvo) => {
            setPraticaAlvo(alvo ?? null);
            setSub('praticas');
          }}
          rolagemInicial={rolagemDoBroto.current}
          aoRolar={(y) => {
            rolagemDoBroto.current = y;
          }}
        />
      ),
      perfil: <ProfileScreen name={name} onNavigate={setSub} />,
    }),
    [name],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/*
        As abas por baixo, e a tela empilhada por cima delas.

        Tela empilhada e aba ocupavam o mesmo lugar: abrir uma prática
        desmontava a Home, e voltar a montava do zero — 440 ms de linha de
        JavaScript travada, medidos, com a prática congelada na tela e a Home
        surgindo de uma vez. Agora a aba fica montada, parada, e a tela
        empilhada entra e **sai** deslizando por cima dela. Ver
        `CamadaEmpilhada`.

        As abas entre si tinham o mesmo problema, e ele sobreviveu àquele
        conserto: trocar de aba montava a de destino inteira dentro do toque —
        899 ms para chegar à Início. Agora as três ficam de pé, e a troca é um
        esmaecer. Ver `AbasVivas`.

        Trocar de aba continua só aparecendo: abas são vizinhas, não uma mais
        funda que a outra, e deslizar entre elas inventaria uma hierarquia que
        não existe.
      */}
      <View style={{ flex: 1 }}>
        <View
          style={{ flex: 1 }}
          /*
            Coberta, a aba some para o leitor de tela: sem isto o TalkBack
            navegaria pelos cartões da Home por baixo da prática aberta.
          */
          importantForAccessibility={sub ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={sub !== null}
        >
          <ProvedorDeCobertura value={coberta}>
            <AbasVivas ativa={tab} todas={ABAS} render={(chave) => abas[chave]} />
          </ProvedorDeCobertura>
        </View>
        <CamadaEmpilhada aberta={sub} render={renderSub} aoCobrir={setCoberta} />
      </View>
      <BottomNav
        active={tab}
        onChange={(next) => {
          setTab(next);
          setSub(null);
          setComecoDaPratica(null);
          setOrigemDoRegistro(null);
        }}
      />
    </View>
  );
}

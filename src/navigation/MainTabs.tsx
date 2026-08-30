import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { BottomNav, ScreenTransition, type TabKey } from '../components';
import { HomeScreen } from '../screens/app/HomeScreen';
import { GardenScreen } from '../screens/app/GardenScreen';
import { JournalScreen } from '../screens/app/JournalScreen';
import { PracticesScreen } from '../screens/app/PracticesScreen';
import { PrivacyScreen } from '../screens/app/PrivacyScreen';
import { RemindersScreen } from '../screens/app/RemindersScreen';
import { ProfileScreen } from '../screens/app/ProfileScreen';
import { SettingsScreen } from '../screens/app/SettingsScreen';
import { TherapySummaryScreen } from '../screens/app/TherapySummaryScreen';
import type { SubScreen } from '../screens/app/types';
import { CompostaScreen } from '../screens/composta/CompostaScreen';
import { ValuesScreen } from '../screens/app/ValuesScreen';
import { onNotificationTap } from '../services/notifications';
import { useBotaoVoltar } from './useBotaoVoltar';
import { ANCORA_RAPIDA } from '../data/practices';
import { useAppState } from '../state/AppStateProvider';
import { useTema } from '../theme';

export function MainTabs() {
  const { colors } = useTema();
  const { data } = useAppState();
  const [tab, setTab] = useState<TabKey>('home');
  const [sub, setSub] = useState<SubScreen | null>(null);
  /**
   * A pergunta que uma prática mandou para o diário.
   *
   * Mora aqui porque a viagem atravessa duas telas — a prática está dentro de
   * `praticas`, que é uma tela empilhada, e o diário é uma aba. Some ao trocar
   * de aba: voltar ao diário depois não é mais o mesmo pedido.
   */
  const [comecoDaPratica, setComecoDaPratica] = useState<string | null>(null);
  /** A prática oferecida na Home, para as Práticas já abrirem nela. */
  const [praticaAlvo, setPraticaAlvo] = useState<{ topico: string; pratica: string } | null>(null);

  const name = data.profile.name.trim() || 'você';
  const closeSub = () => setSub(null);

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
          setSub(null);
          setTab('diario');
          return;
        }
        setTab('perfil');
        setSub('terapia');
      }),
    [],
  );

  const renderSub = () => {
    switch (sub) {
      case 'terapia':
        return <TherapySummaryScreen onBack={closeSub} />;
      case 'config':
        return <SettingsScreen onBack={closeSub} />;
      case 'privacidade':
        return <PrivacyScreen onBack={closeSub} />;
      case 'composta':
        return <CompostaScreen onClose={closeSub} aoFazerExercicio={ancorarAgora} />;
      case 'praticas':
        return (
          <PracticesScreen
            alvo={praticaAlvo}
            onBack={closeSub}
            onEscreverNoDiario={(comeco) => {
              setComecoDaPratica(comeco);
              setSub(null);
              setTab('diario');
            }}
          />
        );
      case 'valores':
        return <ValuesScreen onBack={closeSub} />;
      case 'lembretes':
        return <RemindersScreen onBack={closeSub} />;
      case 'jardim':
        return <GardenScreen onBack={closeSub} />;
      default:
        return null;
    }
  };

  const renderTab = () => {
    switch (tab) {
      case 'diario':
        return (
          <JournalScreen comecoDaPratica={comecoDaPratica} aoFazerExercicio={ancorarAgora} />
        );
      case 'perfil':
        return <ProfileScreen name={name} onNavigate={setSub} />;
      case 'home':
      default:
        return (
          <HomeScreen
            name={name}
            onOpenComposta={() => setSub('composta')}
            onOpenSettings={() => setSub('config')}
            onOpenPractices={(alvo) => {
              setPraticaAlvo(alvo ?? null);
              setSub('praticas');
            }}
            onOpenValues={() => setSub('valores')}
            onOpenReminders={() => setSub('lembretes')}
            onOpenGarden={() => setSub('jardim')}
          />
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Abrir uma tela empilhada desliza da direita; trocar de aba só aparece. */}
      <ScreenTransition transitionKey={sub ?? tab} mode={sub ? 'forward' : 'fade'}>
        {sub ? renderSub() : renderTab()}
      </ScreenTransition>
      <BottomNav
        active={tab}
        onChange={(next) => {
          setTab(next);
          setSub(null);
          setComecoDaPratica(null);
        }}
      />
    </View>
  );
}

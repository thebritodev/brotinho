import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ScreenTransition } from '../components';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { PaywallGate } from '../screens/PaywallGate';
import { useAppState } from '../state/AppStateProvider';
import { loadRascunho } from '../storage/appStorage';
import { precisaAssinar, useAssinatura } from '../state/SubscriptionProvider';
import { colors } from '../theme';
import { MainTabs } from './MainTabs';
import { useBotaoVoltar } from './useBotaoVoltar';

export function RootNavigator() {
  const { hydrated, data } = useAppState();
  const { estado } = useAssinatura();

  /**
   * Não fica guardado: quem fechou o app na tela de boas-vindas ainda não
   * contou nada ao Brotinho, então rever a porta de entrada é o certo.
   */
  const [comecou, setComecou] = useState(false);

  /**
   * Quem foi interrompido no meio do onboarding volta direto para lá.
   *
   * O raciocínio acima continua valendo para quem parou **na porta**. Mas quem
   * já respondeu alguma coisa contou algo ao Brotinho — e cair de novo na tela
   * de boas-vindas, com o trabalho salvo escondido atrás dela, parece por um
   * instante que tudo se perdeu. Apareceu rodando o app, não lendo o código.
   *
   * Só vale com progresso de verdade (`step > 0`): um rascunho no passo zero é
   * um rascunho vazio, e pular a porta ali esconderia o "Já usei o Brotinho
   * antes" de quem ainda pode precisar dele.
   */
  const [retomando, setRetomando] = useState<boolean | null>(null);

  useEffect(() => {
    let vivo = true;
    void loadRascunho<{ step?: number }>('onboarding')
      .then((r) => vivo && setRetomando(typeof r?.step === 'number' && r.step > 0))
      .catch(() => vivo && setRetomando(false));
    return () => {
      vivo = false;
    };
  }, []);

  /**
   * Do onboarding de volta às boas-vindas, quando ele foi aberto agora.
   *
   * Não vale para quem está retomando um rascunho: ali o passo zero é o começo
   * de uma sessão que já existia, e mandar essa pessoa para a tela de abertura
   * pareceria ter perdido o que ela escreveu.
   *
   * Fica **acima** do `return` de carregamento logo abaixo, e não junto do
   * resto da lógica: hook depois de saída condicional roda em alguns renders e
   * não em outros, e o React derruba a tela inteira com "Rendered more hooks
   * than during the previous render". Foi exatamente o que aconteceu aqui.
   */
  useBotaoVoltar(() => {
    if (!data.profile.onboarded && comecou && !retomando) {
      setComecou(false);
      return true;
    }
    return false;
  });

  // Enquanto o AsyncStorage não responde, mantém a tela na cor de fundo
  // para não piscar o onboarding para quem já passou por ele — nem as
  // boas-vindas para quem está voltando de uma interrupção.
  if (!hydrated || retomando === null) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  const dentroDoApp = data.profile.onboarded;

  /**
   * Só tranca quem já passou pelo onboarding e perdeu o acesso depois.
   * `precisaAssinar` é falso enquanto verifica e quando não há SDK — ver o
   * porquê em SubscriptionProvider.
   */
  const trancado = dentroDoApp && precisaAssinar(estado);

  const tela = trancado
    ? 'paywall'
    : dentroDoApp
      ? 'app'
      : comecou || retomando
        ? 'onboarding'
        : 'boas-vindas';

  return (
    // A passagem do onboarding para o app é o corte mais marcante do fluxo:
    // entra suave em vez de trocar de tela de uma vez.
    <ScreenTransition transitionKey={tela} mode="fade">
      {trancado ? (
        <PaywallGate />
      ) : dentroDoApp ? (
        <MainTabs />
      ) : comecou || retomando ? (
        <OnboardingScreen />
      ) : (
        <WelcomeScreen onStart={() => setComecou(true)} />
      )}
    </ScreenTransition>
  );
}

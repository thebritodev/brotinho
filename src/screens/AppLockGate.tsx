import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Sprout } from '../components';
import {
  aoFecharJanelaDoSistema,
  janelaDoSistema,
  temJanelaDoSistema,
} from '../services/janelaDoSistema';
import { useAppState } from '../state/AppStateProvider';
import { fonts, useTema } from '../theme';

/**
 * Cobre o app com uma tela de bloqueio quando "Bloqueio do app" está ligado
 * em Privacidade. Também rebloqueia quando o app volta do segundo plano —
 * sem isso, deixar o celular na mão de alguém depois de destravar expõe o diário.
 */
export function AppLockGate({ children }: { children: React.ReactNode }) {
  const { colors } = useTema();
  const { data, hydrated } = useAppState();
  const enabled = data.settings.appLock && data.profile.onboarded && Platform.OS !== 'web';

  const [unlocked, setUnlocked] = useState(false);
  const [failed, setFailed] = useState(false);

  /**
   * Trava contra dois pedidos ao mesmo tempo.
   *
   * A tela agora é tocável, e tocar chama o mesmo `authenticate` que o retorno
   * do segundo plano dispara. Dois `authenticateAsync` vivos ao mesmo tempo
   * fazem o sistema cancelar o primeiro, o que chega aqui como falha — a
   * pessoa levaria "não consegui confirmar que é você" por ter tocado na tela.
   */
  const pedindo = useRef(false);

  const authenticate = useCallback(async () => {
    if (pedindo.current) return;
    pedindo.current = true;
    setFailed(false);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      // Sem biometria cadastrada não dá para exigir — trancar o usuário para
      // fora do próprio diário seria pior do que não bloquear.
      if (!hasHardware || !enrolled) {
        setUnlocked(true);
        return;
      }

      /*
        O prompt de biometria é uma janela do sistema como qualquer outra: ele
        pausa a atividade, e sem marcá-lo o próprio bloqueio se rebloquearia
        ao abrir a tela que existe para destrancá-lo.

        `avisaAoFechar: false` porque esta é a única janela que não precisa da
        rede de segurança: quando ela abre o diário **já está trancado**, não
        há o que proteger, e avisar só criaria a chance de retrancar no
        instante seguinte a um desbloqueio bem-sucedido.
      */
      const result = await janelaDoSistema(
        () =>
          LocalAuthentication.authenticateAsync({
            promptMessage: 'Desbloqueie seu diário',
            cancelLabel: 'Cancelar',
            disableDeviceFallback: false,
          }),
        { avisaAoFechar: false },
      );

      if (result.success) setUnlocked(true);
      else setFailed(true);
    } catch {
      // Falha do módulo não pode virar app inacessível.
      setUnlocked(true);
    } finally {
      pedindo.current = false;
    }
  }, []);

  /**
   * A digital só é pedida com o app **na frente**.
   *
   * O bloqueio acontece no evento `background`, e o efeito que pedia a
   * biometria disparava no mesmo instante — ou seja, com o app já saindo de
   * cena. O Android cancela um prompt aberto assim, e às vezes nem chega a
   * apresentá-lo: a pessoa voltava para uma tela que dizia "confirme que é
   * você" e não tinha nada para tocar. Era a queixa.
   *
   * Aqui, se o app já está ativo, pede na hora; se não está, espera a volta.
   */
  useEffect(() => {
    if (!hydrated) return;
    if (!enabled) {
      setUnlocked(true);
      return;
    }
    if (unlocked) return;

    if (AppState.currentState === 'active') {
      void authenticate();
      return;
    }
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void authenticate();
    });
    return () => sub.remove();
  }, [hydrated, enabled, unlocked, authenticate]);

  const trancar = useCallback(() => {
    setUnlocked(false);
    setFailed(false);
  }, []);

  /**
   * Rebloqueia quando a pessoa **sai do app**.
   *
   * Só em `background`, nunca em `inactive`: no iOS o próprio prompt de
   * biometria põe o app em `inactive`, e rebloquear ali seria o app se
   * trancando por causa da tela que abriu para destrancá-lo.
   *
   * E nunca por causa de uma janela que o próprio app abriu. No Android a
   * caixa de permissão pausa a atividade, e o React Native traduz essa pausa
   * para o mesmo `background` de quem larga o celular na mesa — ver
   * `janelaDoSistema`, que é onde essa distinção mora. Sem isto, pedir o
   * microfone trancava o diário, e a Composta não conseguia começar nenhuma
   * vez: a caixa aparecia, o bloqueio caía por cima dela, e a permissão nunca
   * chegava a ser respondida.
   */
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'background') return;
      if (temJanelaDoSistema()) return;
      trancar();
    });
    return () => sub.remove();
  }, [enabled, trancar]);

  /**
   * A contrapartida: sair do app **enquanto** a caixa do sistema estava aberta
   * não pode deixar o diário destrancado. Quando a última janela fecha e o app
   * não está na frente, a pessoa saiu mesmo — e o bloqueio cai ali.
   */
  useEffect(() => {
    if (!enabled) return;
    return aoFecharJanelaDoSistema(trancar);
  }, [enabled, trancar]);

  const trancado = enabled && !unlocked;

  /*
    A tela inteira é o botão.

    Antes, a única saída era um "Tentar de novo" que só existia depois de uma
    falha — e o caso mais comum não era falha, era o prompt nunca ter aparecido.
    Aí não havia falha para registrar, não havia botão, e não havia nada
    tocável: a pessoa ficava olhando para o próprio diário trancado.

    Agora tocar em qualquer lugar pede de novo, e o botão está sempre lá em vez
    de aparecer como consequência de um erro.
  */
  const camada = trancado ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Desbloquear"
      accessibilityViewIsModal
      onPress={authenticate}
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: 32,
        },
      ]}
    >
      <Sprout mood="neutro" stage={2} size={140} />
      <Text
        style={{
          fontFamily: fonts.display.bold,
          fontSize: 22,
          textAlign: 'center',
          color: colors.textPrimary,
        }}
      >
        Seu diário está protegido
      </Text>
      <Text
        style={{
          fontFamily: fonts.body.regular,
          fontSize: 15,
          lineHeight: 15 * 1.5,
          color: colors.textSecondary,
          textAlign: 'center',
        }}
      >
        {failed
          ? 'Não consegui confirmar que é você.'
          : 'Toque para confirmar que é você.'}
      </Text>
      <Button variant="primary" onPress={authenticate} style={{ width: '100%' }}>
        Desbloquear
      </Button>
    </Pressable>
  ) : null;

  /*
    O bloqueio é uma **camada por cima**, e não o app trocado por outra tela.

    Antes, trancado, este componente devolvia a tela de bloqueio *no lugar* dos
    filhos. Isso desmonta o app inteiro: o `MainTabs` perde a aba em que a
    pessoa estava e a tela que estava aberta dentro dela, a Composta perde a
    frase escrita e a sessão em andamento, o diário perde o rascunho. Ao
    desbloquear, tudo remontava do zero — e o zero é a tela inicial.

    Era a segunda metade da queixa: "quando eu desbloqueio volta para a tela de
    início". Qualquer interrupção cobrava esse preço — uma ligação, uma
    notificação, olhar as horas.

    Com os filhos montados atrás, desbloquear devolve exatamente o lugar de
    onde se saiu. A camada é opaca e cobre a tela inteira, então nada do que
    está atrás aparece; `accessibilityElementsHidden` faz o mesmo pelo leitor
    de tela, que atravessaria a camada sem isso.
  */
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{ flex: 1 }}
        accessibilityElementsHidden={trancado}
        importantForAccessibility={trancado ? 'no-hide-descendants' : 'auto'}
      >
        {children}
      </View>
      {camada}
    </View>
  );
}

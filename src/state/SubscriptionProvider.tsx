import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import {
  cobrancaDisponivel,
  comprarPlano,
  listarPlanos,
  observarAssinatura,
  restaurarCompras,
  verificarAssinatura,
  type EstadoDaAssinatura,
  type PlanoDaLoja,
  type ResultadoDaCompra,
} from '../services/subscription';

type Valor = {
  estado: EstadoDaAssinatura;
  /** Planos vindos da loja, com preço localizado. Vazio quando não deu para perguntar. */
  planos: PlanoDaLoja[];
  /** false no Expo Go e na web: ali não existe compra. */
  podeCobrar: boolean;
  comprar: (pacote: unknown) => Promise<ResultadoDaCompra>;
  restaurar: () => Promise<boolean>;
};

const Contexto = createContext<Valor | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const podeCobrar = cobrancaDisponivel();
  const [estado, setEstado] = useState<EstadoDaAssinatura>(
    podeCobrar ? 'verificando' : 'indisponivel',
  );
  const [planos, setPlanos] = useState<PlanoDaLoja[]>([]);

  useEffect(() => {
    if (!podeCobrar) return;
    let vivo = true;

    void verificarAssinatura().then((e) => vivo && setEstado(e));
    void listarPlanos().then((p) => vivo && setPlanos(p));

    // Renovação, cancelamento ou compra em outro aparelho chegam por aqui.
    observarAssinatura((e) => vivo && setEstado(e));

    /**
     * Reconfere ao voltar para o app. É quando o cancelamento feito nos ajustes
     * do celular aparece — a pessoa sai, cancela na loja e volta.
     */
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void verificarAssinatura().then((e) => vivo && setEstado(e));
    });

    return () => {
      vivo = false;
      sub.remove();
    };
  }, [podeCobrar]);

  const comprar = useCallback(async (pacote: unknown) => {
    const r = await comprarPlano(pacote);
    if (r === 'assinou') setEstado('assinante');
    return r;
  }, []);

  const restaurar = useCallback(async () => {
    const ok = await restaurarCompras();
    if (ok) setEstado('assinante');
    return ok;
  }, []);

  const valor = useMemo(
    () => ({ estado, planos, podeCobrar, comprar, restaurar }),
    [estado, planos, podeCobrar, comprar, restaurar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAssinatura(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useAssinatura precisa estar dentro de SubscriptionProvider');
  return v;
}

/**
 * Se o app deve trancar o conteúdo agora.
 *
 * `indisponivel` e `verificando` NÃO trancam: sem SDK (Expo Go) ou sem resposta
 * da loja, "não consegui verificar" viraria "não pagou", e quem pagou ficaria
 * de fora por um problema que não é dele.
 */
export const precisaAssinar = (estado: EstadoDaAssinatura) => estado === 'sem-assinatura';

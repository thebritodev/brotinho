import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * "Reduzir movimento" está ligado no sistema?
 *
 * Quem liga isso costuma ligar por enjoo, vertigem ou enxaqueca — movimento na
 * tela chega a passar mal de verdade. Então não é preferência estética: é um
 * pedido para o app parar de se mexer, e vale para toda animação decorativa
 * daqui.
 *
 * Escuta a mudança enquanto a tela está montada, e não só na montagem: dá para
 * ligar o ajuste com o app aberto, e sem o ouvinte a pessoa teria de reabrir o
 * app para ele obedecer.
 *
 * O `vivo` existe porque `isReduceMotionEnabled()` é assíncrono: uma tela que
 * desmonta antes da resposta receberia um `setState` em componente morto.
 */
export function useMenosMovimento(): boolean {
  const [menos, setMenos] = useState(false);

  useEffect(() => {
    let vivo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((ligado) => {
      if (vivo) setMenos(ligado);
    });
    const ouvinte = AccessibilityInfo.addEventListener('reduceMotionChanged', setMenos);
    return () => {
      vivo = false;
      ouvinte.remove();
    };
  }, []);

  return menos;
}

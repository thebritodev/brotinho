import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import {
  compartilharFrase,
  type ResultadoDoCompartilhar,
} from '../../services/compartilharFrase';
import { CardDoStory, STORY } from './CardDoStory';

/**
 * Monta o card do story fora da tela, fotografa e entrega ao sistema.
 *
 * Devolve quatro coisas: o `palco` (que quem usa precisa pôr na árvore em algum
 * lugar), a função `compartilhar`, um `compartilhando` para o botão poder dizer
 * que está trabalhando, e um `aviso` para quando não dá.
 *
 * ## Por que existe o `aviso`
 *
 * Porque a primeira versão disto engolia o resultado. Se a captura falhasse, o
 * botão simplesmente voltava ao normal e nada acontecia — a pessoa tocaria de
 * novo, e de novo, sem nunca descobrir que o problema não era o toque dela.
 *
 * O caso mais provável nem é exótico: quem está com um development build
 * anterior a esta biblioteca não tem o módulo nativo, e para essa pessoa
 * compartilhar não vai funcionar até atualizar. Ela merece ler isso.
 *
 * ## Por que a captura mora num efeito, e não dentro do `compartilhar`
 *
 * Porque o card precisa **existir** antes de ser fotografado, e ele só passa a
 * existir quando o React renderiza — o que não acontece dentro da função que
 * chamou `setState`. Fotografar ali pegaria a árvore anterior, em que o card
 * ainda não está, e o `captureRef` devolveria erro de view não encontrada.
 *
 * O efeito roda depois do commit, com as views nativas já criadas. O quadro
 * extra de espera é seguro adicional para o Android, onde a criação da view e a
 * medida dela não acontecem no mesmo passo.
 *
 * ## Por que o palco some quando não está em uso
 *
 * Uma `View` de 1080 × 1920 permanente na árvore da Home custa medida e memória
 * em toda renderização da tela, para servir a um toque que a maioria dos dias
 * não acontece. Montado só durante o compartilhamento, o custo existe pelos dois
 * segundos em que ele é necessário.
 */

/** Quanto tempo o aviso fica na tela antes de sair sozinho. */
const AVISO_MS = 6000;
/** Em desenvolvimento o aviso dura mais: alguém precisa conseguir ler e copiar. */
const AVISO_DEV_MS = 20000;

/**
 * O recado da falha — e, em build de desenvolvimento, o motivo cru junto.
 *
 * Um app não conta erro de biblioteca para quem só quer postar uma frase; por
 * isso a produção fica com a frase em português. Mas enquanto se está
 * desenvolvendo, quem tem o aparelho na mão é o **único instrumento de medida**
 * que existe — a captura e a folha de compartilhar são nativas e não rodam na
 * web, então nada disso aparece em teste automatizado. Esconder o motivo dele é
 * escolher continuar no escuro.
 */
function avisoDe(r: ResultadoDoCompartilhar): string | null {
  if (r.tipo === 'ok') return null;
  if (r.tipo === 'sem-compartilhamento') return 'Este aparelho não tem para onde compartilhar.';

  const frase =
    r.tipo === 'sem-modulo'
      ? 'Compartilhar chegou numa versão mais nova. Atualize o app para usar.'
      : 'Não consegui preparar a imagem. Tente de novo.';

  return __DEV__ ? `${frase}

[dev] ${r.motivo}` : frase;
}

export function useCompartilharFrase() {
  const alvo = useRef<View>(null);
  /** A frase que está sendo virada em imagem agora; `null` quando não há. */
  const [pedido, setPedido] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (pedido === null) return;
    let vivo = true;

    // Um quadro para o Android terminar de criar e medir a view do card.
    const id = requestAnimationFrame(() => {
      void compartilharFrase(alvo).then((r) => {
        if (!vivo) return;
        setAviso(avisoDe(r));
        setPedido(null);
      });
    });

    return () => {
      vivo = false;
      cancelAnimationFrame(id);
    };
  }, [pedido]);

  // O aviso sai sozinho: é um recado, não um estado em que a tela fica presa.
  useEffect(() => {
    if (aviso === null) return;
    const id = setTimeout(() => setAviso(null), __DEV__ ? AVISO_DEV_MS : AVISO_MS);
    return () => clearTimeout(id);
  }, [aviso]);

  const compartilhar = useCallback((texto: string) => {
    setAviso(null);
    // Sem capturar duas vezes se a pessoa tocar de novo enquanto trabalha.
    setPedido((atual) => atual ?? texto);
  }, []);

  const palco =
    pedido === null || Platform.OS === 'web' ? null : (
      <View
        /*
          Fora da tela pela esquerda, e não com `opacity: 0` nem `display:
          'none'`: o que não é desenhado não pode ser fotografado. Aqui ele é
          desenhado de verdade, só que num lugar que ninguém vê.
        */
        style={{ position: 'absolute', left: -STORY.largura - 100, top: 0 }}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <CardDoStory ref={alvo} texto={pedido} />
      </View>
    );

  return { palco, compartilhar, compartilhando: pedido !== null, aviso };
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type Svg from 'react-native-svg';

import {
  compartilharFrase,
  type ResultadoDoCompartilhar,
} from '../../services/compartilharFrase';
import { fonts, radius, useTema } from '../../theme';
import { Button } from '../core/Button';
import { CardDoStory, STORY } from './CardDoStory';
import { ESTILOS_DO_STORY, ESTILO_PADRAO, type EstiloDoStory } from './estilosDoStory';

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

  const frase = 'Não consegui preparar a imagem. Tente de novo.';

  return __DEV__ ? `${frase}

[dev] ${r.motivo}` : frase;
}

export function useCompartilharFrase() {
  const alvo = useRef<Svg>(null);
  /** A frase que está sendo virada em imagem agora; `null` quando não há. */
  const [pedido, setPedido] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  /**
   * A frase que está esperando a pessoa escolher o fundo.
   *
   * Entre tocar em "compartilhar" e a folha do sistema abrir havia zero
   * decisão: o card saía do jeito que saía, e a pessoa só descobria qual era
   * depois de o Instagram já estar aberto. A escolha entra aqui, antes — com
   * a prévia do que vai sair, que é a outra metade: postar uma frase é postar
   * algo sobre o próprio dia, e ninguém posta no escuro.
   */
  const [escolhendo, setEscolhendo] = useState<string | null>(null);
  const [estilo, setEstilo] = useState<EstiloDoStory>(ESTILO_PADRAO);

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
    setEscolhendo(texto);
  }, []);

  const confirmar = useCallback(() => {
    const texto = escolhendo;
    setEscolhendo(null);
    if (!texto) return;
    // Sem capturar duas vezes se a pessoa tocar de novo enquanto trabalha.
    setPedido((atual) => atual ?? texto);
  }, [escolhendo]);

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
        <CardDoStory ref={alvo} texto={pedido} estilo={estilo} />
      </View>
    );

  const folha = (
    <FolhaDeEscolha
      texto={escolhendo}
      estilo={estilo}
      aoEscolher={setEstilo}
      aoConfirmar={confirmar}
      aoFechar={() => setEscolhendo(null)}
    />
  );

  return {
    palco,
    folha,
    compartilhar,
    compartilhando: pedido !== null,
    aviso,
  };
}

/**
 * A folha que abre antes de compartilhar: a prévia e os quatro fundos.
 *
 * ## Por que a prévia é o card de verdade, encolhido
 *
 * Porque um retângulo colorido com a frase dentro mentiria sobre o resultado —
 * o card tem grão, manchas, vinheta, as folhas sangrando e a aspa gigante, e é
 * o conjunto disso que faz alguém querer postar. Encolhido por `scale`, é o
 * mesmo desenho que vai virar arquivo, com os mesmos pixels proporcionais.
 *
 * ## O que não está aqui, e por quê
 *
 * "Salvar imagem" e "Copiar texto", que o documento desenha. Os dois pedem
 * módulos nativos que este app não tem — galeria e área de transferência —, e
 * módulo nativo novo quer dizer build nova e revisão de loja. A folha do
 * sistema que o botão abre já oferece salvar e copiar em todo aparelho
 * moderno, pela interface que a pessoa conhece.
 */
function FolhaDeEscolha({
  texto,
  estilo,
  aoEscolher,
  aoConfirmar,
  aoFechar,
}: {
  texto: string | null;
  estilo: EstiloDoStory;
  aoEscolher: (e: EstiloDoStory) => void;
  aoConfirmar: () => void;
  aoFechar: () => void;
}) {
  const { colors, palette, shadows } = useTema();
  const { width, height } = useWindowDimensions();

  if (texto === null) return null;

  /* A prévia cabe na metade de cima da tela, sem passar da largura dela. */
  const alturaDaPrevia = Math.min(height * 0.42, 380);
  const escala = Math.min(alturaDaPrevia / STORY.altura, (width - 120) / STORY.largura);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={aoFechar}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          onPress={aoFechar}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.55)' }]}
        />
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: 22,
            paddingBottom: 30,
            gap: 18,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: fonts.display.bold,
              fontSize: 20,
              color: colors.textPrimary,
              alignSelf: 'flex-start',
            }}
          >
            Compartilhar a frase
          </Text>

          <View
            style={{
              width: STORY.largura * escala,
              height: STORY.altura * escala,
              borderRadius: radius.lg,
              overflow: 'hidden',
              ...shadows.md,
            }}
          >
            <View
              style={{
                width: STORY.largura,
                height: STORY.altura,
                transform: [{ scale: escala }],
                transformOrigin: 'top left',
              }}
            >
              <CardDoStory texto={texto} estilo={estilo} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 16 }}>
            {ESTILOS_DO_STORY.map((e) => {
              const escolhido = e.chave === estilo.chave;
              return (
                <Pressable
                  key={e.chave}
                  accessibilityRole="button"
                  accessibilityLabel={e.rotulo}
                  accessibilityState={{ selected: escolhido }}
                  onPress={() => aoEscolher(e)}
                  style={{ alignItems: 'center', gap: 6 }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: e.fundo,
                      borderWidth: escolhido ? 3 : 1.5,
                      borderColor: escolhido ? colors.primary : colors.border,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: fonts.body.bold,
                      fontSize: 12,
                      color: escolhido ? colors.primaryStrong : palette.brown400,
                    }}
                  >
                    {e.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button variant="primary" style={{ width: '100%' }} onPress={aoConfirmar}>
            Compartilhar
          </Button>
          <Pressable accessibilityRole="button" onPress={aoFechar} style={{ padding: 6 }}>
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 15, color: palette.brown400 }}
            >
              Agora não
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

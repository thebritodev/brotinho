import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  compartilharFrase,
  type ResultadoDoCompartilhar,
} from '../../services/compartilharFrase';
import { copiarFrase, salvarFrase, type ResultadoDeGuardar } from '../../services/guardarFrase';
import { fonts } from '../../theme';
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

/**
 * O recado de "Salvar imagem" e "Copiar texto".
 *
 * Os dois precisam dizer que deram certo, e o compartilhar não precisa: ali a
 * folha do sistema abre na cara da pessoa e **ela** é a confirmação. Salvar e
 * copiar não abrem nada — sem uma palavra de volta, o toque some no vazio e a
 * pessoa toca de novo.
 */
function recadoDe(r: ResultadoDeGuardar, oQue: 'salvou' | 'copiou'): string {
  if (r.tipo === 'ok') return oQue === 'salvou' ? 'Imagem salva na galeria.' : 'Frase copiada.';
  if (r.tipo === 'sem-permissao') {
    return 'Sem a permissão de salvar na galeria, não dá. Você pode mudar isso nos ajustes do aparelho.';
  }
  if (r.tipo === 'indisponivel') {
    /*
      "Indisponível" quer dizer que o módulo nativo não está neste binário —
      na web, que não tem nenhum, ou num development build anterior ao pacote.
      Para quem usa o app, é um recurso que não existe aqui; para quem está
      desenvolvendo, é a build que ficou para trás, e dizer isso economiza uma
      hora de procura. Ver `moduloTardio`, em `guardarFrase`.
    */
    return __DEV__
      ? 'Isto não funciona nesta build — o módulo nativo não está nela. Gere uma build nova.'
      : 'Isto não funciona neste aparelho.';
  }
  const frase = oQue === 'salvou' ? 'Não consegui salvar a imagem.' : 'Não consegui copiar.';
  return __DEV__ ? `${frase}

[dev] ${r.motivo}` : frase;
}

export function useCompartilharFrase() {
  const alvo = useRef<Svg>(null);
  /** O card da prévia, que é quem o "Salvar imagem" fotografa. */
  const previa = useRef<Svg>(null);
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

  /**
   * Salvar e copiar acontecem **com a tela aberta**.
   *
   * O compartilhar fecha a tela e monta o card fora dela, porque quem assume
   * dali em diante é a folha do sistema. Estes dois não: a pessoa continua
   * olhando a prévia, escolhe outro fundo, salva de novo. Fechar seria tirar
   * dela a coisa que ela está usando.
   *
   * Por isso eles fotografam a **prévia**, que é o mesmo `CardDoStory` em
   * tamanho de verdade dentro de um `scale` — o `Svg` tem o tamanho cheio, e
   * é dele que o PNG sai. Ver `TelaDoStory`.
   */
  const [trabalhando, setTrabalhando] = useState<'salvando' | 'copiando' | null>(null);

  const salvar = useCallback(async () => {
    if (trabalhando) return;
    setTrabalhando('salvando');
    const r = await salvarFrase(previa);
    setTrabalhando(null);
    setAviso(recadoDe(r, 'salvou'));
  }, [trabalhando]);

  const copiar = useCallback(async () => {
    const texto = escolhendo;
    if (!texto || trabalhando) return;
    setTrabalhando('copiando');
    const r = await copiarFrase(texto);
    setTrabalhando(null);
    setAviso(recadoDe(r, 'copiou'));
  }, [escolhendo, trabalhando]);

  const confirmar = useCallback(() => {
    const texto = escolhendo;
    /* O recado de "salvou" ou "copiou" morre com a tela: ele era sobre o que
       aconteceu ali dentro, e as telas de trás também desenham o aviso. */
    setAviso(null);
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
    <TelaDoStory
      texto={escolhendo}
      estilo={estilo}
      previa={previa}
      aviso={aviso}
      trabalhando={trabalhando}
      aoEscolher={setEstilo}
      aoConfirmar={confirmar}
      aoSalvar={() => void salvar()}
      aoCopiar={() => void copiar()}
      aoFechar={() => {
        setAviso(null);
        setEscolhendo(null);
      }}
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
 * A tela de compartilhar: a prévia do card, os fundos e o botão.
 *
 * ## Por que é tela, e não a folha que subia de baixo
 *
 * Porque o que acontece aqui é uma **composição**, e não uma confirmação. A
 * folha anterior cabia metade da prévia e empurrava os fundos para a beirada:
 * a pessoa escolhia o fundo olhando um recorte do resultado. Em tela cheia o
 * card inteiro aparece, na proporção em que vai sair, e trocar de fundo mostra
 * a troca no card de verdade — que é a coisa que a decisão depende.
 *
 * É também o que o documento desenha, e pela mesma razão: a tela é escura e
 * fixa, como o editor de qualquer aplicativo de foto, para o olho medir o card
 * contra um fundo neutro em vez de contra o creme do app.
 *
 * ## Por que o fundo não segue o tema
 *
 * Porque ele é o **estúdio**, não o aplicativo. No tema claro, um card de
 * fundo creme sobre o creme do app desapareceria dentro da tela, e a pessoa
 * escolheria o fundo "Terra" sem nunca ver onde ele termina. Escuro nos dois
 * temas, qualquer um dos fundos recorta.
 *
 * ## Por que a prévia é o card de verdade, encolhido
 *
 * Porque um retângulo colorido com a frase dentro mentiria sobre o resultado —
 * o card tem grão, manchas, vinheta, as folhas sangrando e a aspa gigante, e é
 * o conjunto disso que faz alguém querer postar. Encolhido por `scale`, é o
 * mesmo desenho que vai virar arquivo, com os mesmos pixels proporcionais.
 *
 * ## O que o documento tem e esta tela não, e por quê
 *
 * "Salvar imagem" e "Copiar texto". Os dois pedem módulo nativo que este app
 * não carrega — galeria e área de transferência —, e módulo nativo novo quer
 * dizer dependência nova, build nova e permissão a mais na ficha da loja. Um
 * botão desenhado que não faz nada seria pior do que a ausência dele: a folha
 * do sistema que "Postar nos stories" abre já oferece salvar e copiar em todo
 * aparelho moderno, pela interface que a pessoa já conhece.
 */

/**
 * Os botões secundários do estúdio: contorno de vidro, sem preenchimento.
 *
 * Eles não podem competir com o "Postar nos stories", que é verde cheio. O
 * contorno diz "também dá para isto" sem disputar o olho — e os dois ficam
 * iguais entre si porque salvar e copiar não têm hierarquia um sobre o outro.
 */
function BotaoDeVidro({
  rotulo,
  onPress,
  desligado,
}: {
  rotulo: string;
  onPress: () => void;
  desligado: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desligado }}
      onPress={desligado ? undefined : onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 46,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: ESTUDIO.contorno,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: desligado ? 0.5 : pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.body.bold, fontSize: 15, color: ESTUDIO.tinta }}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

/** O estúdio é escuro nos dois temas. Ver a nota acima. */
const ESTUDIO = {
  fundo: '#2B2824',
  tinta: '#FBF6EC',
  /* O vidro dos botões secundários: branco fraco, como no documento. */
  vidro: 'rgba(251,246,236,0.12)',
  contorno: 'rgba(251,246,236,0.25)',
};

function TelaDoStory({
  texto,
  estilo,
  previa,
  aviso,
  trabalhando,
  aoEscolher,
  aoConfirmar,
  aoSalvar,
  aoCopiar,
  aoFechar,
}: {
  texto: string | null;
  estilo: EstiloDoStory;
  previa: React.RefObject<Svg | null>;
  aviso: string | null;
  trabalhando: 'salvando' | 'copiando' | null;
  aoEscolher: (e: EstiloDoStory) => void;
  aoConfirmar: () => void;
  aoSalvar: () => void;
  aoCopiar: () => void;
  aoFechar: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (texto === null) return null;

  /*
    A prévia ocupa o que sobra entre o cabeçalho e o rodapé.

    A soma é escrita item por item de propósito: ela já ficou errada uma vez,
    quando "Salvar imagem" e "Copiar texto" entraram e ninguém somou os
    cinquenta e seis pontos deles — o resultado foi a última linha do rodapé
    saindo pela borda de baixo da tela, que é o tipo de defeito que só aparece
    no aparelho mais curto.
  */
  const reservado =
    insets.top
    + 10 // o respiro do alto
    + 44 // o cabeçalho
    + 18 // o vão até a prévia
    + 18 // o vão da prévia até os fundos
    + 76 // a fileira de fundos, com os rótulos
    + 18 // o vão até o rodapé
    + 52 // "Postar nos stories"
    + 10 + 46 // "Salvar imagem" e "Copiar texto"
    + 10 + 40 // "Agora não"
    + 18 // a linha do recado
    + insets.bottom
    + 16;
  const alturaLivre = Math.max(220, height - reservado);
  const escala = Math.min(alturaLivre / STORY.altura, (width - 110) / STORY.largura);

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={aoFechar}>
      <View
        style={{
          flex: 1,
          backgroundColor: ESTUDIO.fundo,
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 24,
          alignItems: 'center',
          gap: 18,
        }}
      >
        <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={aoFechar}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: ESTUDIO.vidro,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M6 6 L18 18 M18 6 L6 18"
                stroke={ESTUDIO.tinta}
                strokeWidth={2.6}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </Pressable>
          <Text style={{ fontFamily: fonts.display.bold, fontSize: 20, color: ESTUDIO.tinta }}>
            Compartilhar frase
          </Text>
        </View>

        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            width: STORY.largura * escala,
            height: STORY.altura * escala,
            borderRadius: 18,
            overflow: 'hidden',
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
            <CardDoStory ref={previa} texto={texto} estilo={estilo} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
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
                {/*
                  O anel fica **fora** do círculo, com uma folga escura no
                  meio: encostado, ele lê como borda do próprio fundo — e o
                  fundo "Terra" é creme, então a borda sumiria dentro dele.

                  São duas `View`, e não `outline`: `outlineWidth` só existe
                  nas versões recentes do React Native e não desenha em todas
                  as superfícies. Duas caixas concêntricas desenham em todas.
                */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    borderWidth: 2,
                    borderColor: escolhido ? '#A8CDB6' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: e.fundo,
                      borderWidth: 2,
                      borderColor: ESTUDIO.fundo,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: fonts.body.bold,
                    fontSize: 12,
                    color: ESTUDIO.tinta,
                    opacity: escolhido ? 1 : 0.7,
                  }}
                >
                  {e.rotulo}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ alignSelf: 'stretch', marginTop: 'auto', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Postar nos stories"
            onPress={aoConfirmar}
            style={({ pressed }) => ({
              height: 52,
              borderRadius: 12,
              backgroundColor: '#5B8A72',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            {/* O quadrado de cantos redondos com um círculo no meio: o ícone
                genérico de câmera que todo aplicativo de story usa. Não é a
                marca de nenhum deles — e não pode ser. */}
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Rect
                x={4}
                y={4}
                width={16}
                height={16}
                rx={5}
                stroke={ESTUDIO.tinta}
                strokeWidth={2.2}
                fill="none"
              />
              <Circle cx={12} cy={12} r={3.6} stroke={ESTUDIO.tinta} strokeWidth={2.2} fill="none" />
            </Svg>
            <Text style={{ fontFamily: fonts.body.bold, fontSize: 17, color: ESTUDIO.tinta }}>
              Postar nos stories
            </Text>
          </Pressable>

          {/*
            Os dois caminhos que não passam pela folha do sistema.

            Lado a lado e do mesmo tamanho porque são irmãos: nenhum dos dois é
            mais importante que o outro, e os dois são menores que o de cima,
            que é o que a tela vem oferecer. Ver `guardarFrase`.
          */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <BotaoDeVidro
              rotulo={trabalhando === 'salvando' ? 'Salvando…' : 'Salvar imagem'}
              onPress={aoSalvar}
              desligado={trabalhando !== null}
            />
            <BotaoDeVidro
              rotulo={trabalhando === 'copiando' ? 'Copiando…' : 'Copiar texto'}
              onPress={aoCopiar}
              desligado={trabalhando !== null}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={aoFechar}
            style={({ pressed }) => ({
              paddingVertical: 10,
              alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text
              style={{ fontFamily: fonts.body.bold, fontSize: 15, color: ESTUDIO.tinta }}
            >
              Agora não
            </Text>
          </Pressable>

          {/*
            Uma linha só, no mesmo lugar, para as duas coisas que ela pode
            dizer: o recado de quando algo acontece e a promessa de quando nada
            acontece. Duas linhas empilhadas fariam o rodapé pular de altura a
            cada toque.
          */}
          <Text
            accessibilityLiveRegion="polite"
            style={{
              textAlign: 'center',
              fontFamily: aviso ? fonts.body.bold : fonts.body.regular,
              fontSize: 13,
              lineHeight: 13 * 1.4,
              color: aviso ? '#A8CDB6' : ESTUDIO.tinta,
              opacity: aviso ? 1 : 0.6,
            }}
          >
            {aviso ?? 'Só você decide o que é compartilhado.'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { trazerDeUmArquivo, type MotivoDaRecusa, type Trazido } from '../../services/importarDados';
import { useAppState } from '../../state/AppStateProvider';
import { colors, fonts, palette, radius } from '../../theme';
import { Button } from '../core/Button';
import { Card } from '../core/Card';

/**
 * A volta do arquivo, com a confirmação que a antecede.
 *
 * Vive num componente só porque aparece em dois lugares muito distantes, e é
 * a única porta do app que **substitui** o diário de alguém: duas cópias desta
 * confirmação viveriam separadas até uma delas ficar para trás.
 *
 * - **Em Privacidade**, ao lado de "baixar" e de "apagar" — a ordem em que
 *   essas três coisas acontecem na vida de quem troca de celular.
 * - **Na tela de abertura**, atrás de "Já usei o Brotinho antes". É lá que a
 *   pessoa que acabou de reinstalar de fato está. Só em Privacidade, a saída
 *   ficaria atrás dos catorze passos do onboarding e do paywall — quem mais
 *   precisa dela seria quem menos consegue chegar.
 *
 * ---
 *
 * **Por que a confirmação não é sempre um `Modal`.** Foi assim na primeira
 * versão, e a tela mostrou dois defeitos em seguida. Na abertura este
 * componente mora dentro de um modal: o segundo abria por cima do primeiro,
 * ambos transparentes, os textos embaralhados e nenhum legível. Fechar o de
 * baixo não resolveu — ele é o dono deste componente, e fechá-lo desmontava
 * quem ia mostrar a confirmação, que então não aparecia nunca.
 *
 * Então a confirmação é **conteúdo**, e cada aparência a coloca onde cabe: em
 * Privacidade, dentro de um `Modal`; na abertura, no lugar do botão, como
 * segundo passo do modal que já estava aberto.
 */

/**
 * O que a pessoa lê quando o arquivo não serve.
 *
 * "Cancelado" não tem texto: ela fechou o seletor de propósito, e um aviso
 * vermelho por isso seria o app discutindo uma decisão dela.
 */
const RECUSA: Record<Exclude<MotivoDaRecusa, 'cancelado'>, string> = {
  ilegivel: 'Não consegui ler esse arquivo.',
  'nao-e-do-brotinho':
    'Esse arquivo não é uma cópia do Brotinho. Procure o arquivo .json que você baixou aqui.',
  'formato-mais-novo':
    'Esse arquivo veio de uma versão mais nova do Brotinho. Atualize o app e tente de novo.',
};

const soData = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
};

export function TrazerDeVolta({
  aparencia,
  aoMudarConfirmacao,
}: {
  /** Cartão na tela de Privacidade; botão na tela de abertura. */
  aparencia: 'cartao' | 'botao';
  /**
   * Avisa quando a confirmação abre e quando fecha.
   *
   * Só a aparência de botão usa: a tela de abertura esconde a própria
   * explicação enquanto a pergunta está na frente, para o modal ter um assunto
   * por vez.
   */
  aoMudarConfirmacao?: (aberta: boolean) => void;
}) {
  const { data, trazerDeVolta } = useAppState();

  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [restaurado, setRestaurado] = useState<number | null>(null);
  /** O arquivo já lido e conferido, esperando a pessoa confirmar. */
  const [pendente, setPendente] = useState<Extract<Trazido, { ok: true }> | null>(null);

  // Num efeito, e não nos três lugares que mexem em `pendente`: abrir,
  // cancelar e confirmar precisam avisar, e esquecer um deixaria a tela de
  // abertura escondendo a própria explicação para sempre.
  useEffect(() => {
    aoMudarConfirmacao?.(pendente !== null);
  }, [pendente, aoMudarConfirmacao]);

  const escolherArquivo = async () => {
    setAviso(null);
    setRestaurado(null);
    setOcupado(true);
    try {
      const r = await trazerDeUmArquivo();
      if (r.ok) setPendente(r);
      else if (r.motivo !== 'cancelado') setAviso(RECUSA[r.motivo]);
    } finally {
      setOcupado(false);
    }
  };

  const confirmarTroca = () => {
    if (!pendente) return;
    trazerDeVolta(pendente.dados);
    setRestaurado(pendente.dados.journal.length);
    setPendente(null);
  };

  const aparelhoVazio =
    data.journal.length === 0 && data.composts.length === 0 && data.moodHistory.length === 0;
  const dataDoArquivo = pendente?.exportadoEm ? soData(pendente.exportadoEm) : null;

  const recados = (
    <>
      {!!aviso && (
        <Text
          style={{
            fontFamily: fonts.body.bold,
            fontSize: 13,
            lineHeight: 13 * 1.5,
            color: colors.danger,
            marginTop: 8,
          }}
        >
          {aviso}
        </Text>
      )}
      {restaurado !== null && (
        <Text
          style={{
            fontFamily: fonts.body.bold,
            fontSize: 13,
            color: colors.primaryStrong,
            marginTop: 8,
          }}
        >
          {restaurado === 1
            ? 'Pronto. 1 registro voltou.'
            : `Pronto. ${restaurado} registros voltaram.`}
        </Text>
      )}
    </>
  );

  /**
   * A pergunta em si.
   *
   * A comparação lado a lado existe porque "vai substituir seus dados" é
   * abstrato, e "12 aqui, 40 no arquivo" deixa a pessoa ver, antes de tocar, se
   * está trocando na direção certa. Ela pode ter escolhido o arquivo errado —
   * de um backup velho, ou de outra pessoa da casa.
   */
  const pergunta = pendente && (
    <View style={{ gap: 14 }}>
      <Text
        style={{
          fontFamily: fonts.display.bold,
          fontSize: 22,
          color: colors.textPrimary,
        }}
      >
        Trazer de volta?
      </Text>

      <Text
        style={{
          fontFamily: fonts.body.regular,
          fontSize: 15,
          lineHeight: 15 * 1.55,
          color: palette.brown700,
        }}
      >
        {aparelhoVazio
          ? 'Não há nada guardado aqui agora. O arquivo entra no lugar do vazio.'
          : 'O que está guardado neste aparelho sai do lugar para o arquivo entrar. Não dá para desfazer.'}
      </Text>

      <View
        style={{
          backgroundColor: colors.surfaceSunken,
          borderRadius: radius.md,
          padding: 14,
          gap: 6,
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }} />
          {['aqui agora', 'no arquivo'].map((cabecalho) => (
            <Text
              key={cabecalho}
              style={{
                width: 78,
                textAlign: 'right',
                fontFamily: fonts.body.regular,
                fontSize: 11,
                color: palette.brown400,
              }}
            >
              {cabecalho}
            </Text>
          ))}
        </View>
        {(
          [
            ['diário', data.journal.length, pendente.dados.journal.length],
            ['compostagens', data.composts.length, pendente.dados.composts.length],
            ['humores', data.moodHistory.length, pendente.dados.moodHistory.length],
          ] as const
        ).map(([rotulo, aqui, la]) => (
          <View key={rotulo} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.body.regular,
                fontSize: 14,
                color: palette.brown700,
              }}
            >
              {rotulo}
            </Text>
            {[aqui, la].map((quantidade, coluna) => (
              <Text
                key={coluna}
                style={{
                  width: 78,
                  textAlign: 'right',
                  fontFamily: coluna === 1 ? fonts.body.extraBold : fonts.body.regular,
                  fontSize: 14,
                  fontVariant: ['tabular-nums'],
                  color: coluna === 1 ? colors.textPrimary : palette.brown400,
                }}
              >
                {quantidade}
              </Text>
            ))}
          </View>
        ))}
      </View>

      {!!dataDoArquivo && (
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 13,
            lineHeight: 13 * 1.5,
            color: colors.textSecondary,
          }}
        >
          Esse arquivo foi baixado em {dataDoArquivo}.
        </Text>
      )}

      <View style={{ gap: 10, marginTop: 4 }}>
        <Button variant="primary" style={{ width: '100%' }} onPress={confirmarTroca}>
          Sim, trazer de volta
        </Button>
        <Button variant="ghost" style={{ width: '100%' }} onPress={() => setPendente(null)}>
          Cancelar
        </Button>
      </View>
    </View>
  );

  const gatilho =
    aparencia === 'cartao' ? (
      <Card onPress={ocupado ? undefined : () => void escolherArquivo()} label="Trazer de volta">
        <Text
          style={{
            fontFamily: fonts.body.extraBold,
            fontSize: 15,
            color: colors.textPrimary,
            marginBottom: 4,
          }}
        >
          {ocupado ? 'Abrindo o arquivo…' : 'Trazer de volta'}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body.regular,
            fontSize: 13,
            lineHeight: 13 * 1.5,
            color: palette.brown700,
          }}
        >
          Se em algum momento você baixou o arquivo técnico (JSON) — em outro celular, antes de
          formatar, antes de apagar o app —, escolha ele aqui e o Brotinho volta a ser o que era.
        </Text>
        {recados}
      </Card>
    ) : (
      <View>
        <Button
          variant="secondary"
          style={{ width: '100%' }}
          onPress={ocupado ? undefined : () => void escolherArquivo()}
        >
          {ocupado ? 'Abrindo o arquivo…' : 'Não voltaram? Tenho o arquivo'}
        </Button>
        {recados}
      </View>
    );

  // Na abertura a pergunta toma o lugar do botão, dentro do modal que já
  // estava aberto. Ver o comentário no topo do arquivo.
  if (aparencia === 'botao') return pendente ? pergunta : gatilho;

  return (
    <>
      {gatilho}
      <Modal
        visible={pendente !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendente(null)}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => setPendente(null)}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,54,48,0.5)' }]}
          />
          <View
            style={{
              backgroundColor: colors.bg,
              borderRadius: radius.lg,
              padding: 22,
            }}
          >
            {pergunta}
          </View>
        </View>
      </Modal>
    </>
  );
}

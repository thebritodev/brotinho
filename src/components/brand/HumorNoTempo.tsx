import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ROTULO_DO_HUMOR } from '../../data/humores';
import { moodMeses, moodWeek } from '../../state/derived';
import { useAppState } from '../../state/AppStateProvider';
import { fonts, type Mood, radius, useTema } from '../../theme';
import { Card } from '../core/Card';
import { HumorComPalavra } from './HumorComPalavra';
import { MoodFace } from './MoodFace';

/**
 * O humor da pessoa na semana, no mês ou no trimestre — sempre do calendário.
 *
 * Existia só dentro de "Para minha terapia", e ali dizia respeito a outra
 * pessoa — o terapeuta. Quem não faz terapia registrava o humor todos os dias
 * e **nunca via o próprio arco**, que é o motivo de registrar.
 *
 * A comparação entre concorrentes é direta neste ponto: o Daylio retém cerca de
 * 40% no trigésimo dia contra 22% do Finch, e a análise credita isso à
 * simplicidade do registro diário somada à visualização de longo prazo — não à
 * gamificação, que é o que o Finch tem de sobra. Este gráfico é a metade que
 * faltava aparecer.
 *
 * A fita de 7 dias é a **semana do calendário**, de domingo a sábado — não os
 * últimos sete dias. Ver `moodWeek` para o porquê; em resumo, os últimos sete
 * dias faziam os rótulos girarem a cada dia, e ninguém lê calendário assim.
 *
 * Duas regras de leitura, herdadas de onde ele nasceu:
 *
 * - **Dia sem registro fica vazado, não colorido.** Preencher buraco com cor
 *   inventaria um humor que a pessoa não teve.
 * - **Não há nota, média nem pontuação.** O que se lê é o desenho do período,
 *   e não um número que sobe ou desce — nada aqui é para ser batido.
 *
 * ## A cor não pode ser o único canal
 *
 * Ele nasceu codificando humor só por matiz, e assim não diz nada a quem não
 * distingue as matizes — nem aos dois temas, porque contraste mede
 * luminosidade e as seis cores têm luminosidade parecida de propósito.
 *
 * A saída óbvia seria altura de barra, e ela está descartada pela segunda
 * regra acima: altura ordena os humores num eixo de melhor para pior, que é
 * exatamente a pontuação que este gráfico não tem. Um gráfico onde "Feliz" é
 * alto e "Triste" é baixo convida a bater o próprio recorde de felicidade.
 *
 * O segundo canal é a **carinha** — a mesma que a pessoa toca para registrar,
 * distinta por expressão e não por cor. Na semana ela cabe dentro da barra. No
 * mês e no trimestre a célula tem uns vinte pixels e não cabe nada, então ali o
 * segundo canal é **texto**: a conta por humor embaixo do gráfico. Some a
 * informação por outro caminho, sem inventar eixo nenhum.
 *
 * ## O mês e o trimestre são uma grade, não uma fita
 *
 * Eram uma fita: um retângulo por dia, lado a lado, com a largura em
 * porcentagem. A porcentagem não fecha. Trinta dias a 3% davam 265 pontos de
 * barra mais 58 de vão dentro de um cartão de 295 — e os três últimos dias
 * caíam sozinhos numa segunda fileira, que ninguém desenhou e que muda de
 * tamanho conforme o aparelho. Noventa dias davam barras de quatro pontos e
 * meio em duas fileiras de quarenta e cinco, número que não significa nada.
 *
 * Agora cada **coluna é uma semana** e cada **linha é um dia da semana**, com
 * as iniciais à esquerda. A quebra deixa de ser acidente e passa a ser a
 * informação: dá para correr o dedo numa linha e ver como foram todas as
 * segundas-feiras.
 *
 * ## E o período é o mês do calendário, não os últimos trinta dias
 *
 * A fita de sete dias já era a semana do calendário; estes dois continuavam
 * sendo janela corrida, e a incoerência aparecia. Numa janela de trinta dias a
 * mesma quarta-feira muda de coluna todo dia, o começo é uma data arbitrária
 * que ninguém guarda, e não existe mês nenhum para nomear — o desenho era um
 * pedaço de agosto grudado num pedaço de setembro.
 *
 * Fechado no mês, ele ganha nome: o rótulo aparece em cima da coluna em que o
 * mês começa, como num calendário de verdade. E "como foi o meu setembro", que
 * é o que se quer saber olhando para trás, passa a ser pergunta que o desenho
 * responde.
 *
 * O preço é que o mês corrente termina no futuro. Esses dias aparecem
 * apagados, como na semana — o mês tem o tamanho que tem, e ver quanto falta
 * encher é informação. O que eles não fazem é contar como falta.
 */
/** Altura de cada dia na grade do mês e do trimestre, e o vão entre eles. */
const GRADE_CELULA = 18;
const GRADE_VAO = 3;

/**
 * A largura da coluna das iniciais.
 *
 * Constante porque é usada duas vezes — na coluna das letras e no espaçador
 * que alinha a fileira dos meses. Se as duas discordarem, todo nome de mês cai
 * uma casa ao lado da coluna em que aquele mês começa.
 */
const LARGURA_DA_INICIAL = 11;

/**
 * As iniciais dos dias, de domingo a sábado.
 *
 * Três delas são "S" e duas são "Q", e é assim mesmo — é a abreviação que todo
 * calendário brasileiro usa, e a posição na coluna resolve o resto. Trocar por
 * duas letras roubaria largura das semanas para desfazer uma ambiguidade que
 * ninguém tem ao olhar uma grade de sete linhas.
 */
const INICIAIS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "Qua, 9 set" — curto, porque divide a linha com o humor e a palavra. */
function nomeDoDia(chave: string): string {
  const d = new Date(`${chave}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return `${DIAS_DA_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function HumorNoTempo() {
  const { colors, moodColors, palette } = useTema();
  const { data } = useAppState();

  /**
   * Os três períodos, e por que deixaram de ser números.
   *
   * Eram `7 | 30 | 90`, e os números passaram a mentir: o mês do calendário tem
   * 28, 30 ou 31 dias, e o trimestre tem entre 89 e 92. Um botão escrito "30
   * dias" abrindo uma grade de 31 é pequeno, mas é falso — e o rodapé embaixo
   * dele diria "12 de 31 dias", discordando do próprio botão.
   */
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'trimestre'>('semana');
  const semana = useMemo(() => moodWeek(data), [data]);

  /**
   * O dia da fita cujo humor e palavra aparecem embaixo dela.
   *
   * Sem toque nenhum, é o último dia registrado da semana — normalmente hoje.
   * Começar vazio, esperando um toque, deixaria a palavra escondida atrás de um
   * gesto que ninguém sabe que existe, que é o defeito que isto veio corrigir.
   */
  const [diaTocado, setDiaTocado] = useState<string | null>(null);
  const ultimoRegistrado = [...semana].reverse().find((d) => d.mood && !d.futuro)?.date ?? null;
  const escolhido = semana.find((d) => d.date === (diaTocado ?? ultimoRegistrado));
  const meses = useMemo(
    () => moodMeses(data, periodo === 'trimestre' ? 3 : 1),
    [data, periodo],
  );
  const longo = useMemo(() => meses.flatMap((m) => m.dias), [meses]);

  /**
   * A conta embaixo do gráfico.
   *
   * O denominador é sempre **quantos dias já vieram**, nos três períodos. Antes
   * valia só para a semana, porque só ela era do calendário: o mês e o
   * trimestre eram janela corrida e terminavam hoje, então todos os dias deles
   * já tinham acontecido.
   *
   * Fechados no calendário, os dois passam a ter futuro dentro — no dia 9 de
   * setembro, vinte e um dias do mês ainda não chegaram. Dizer "4 de 30"
   * contaria como falta o que ainda nem pôde acontecer, e a legenda passaria a
   * discordar do que está desenhado logo acima dela.
   */
  const diasQueVieram = (periodo === 'semana' ? semana : longo).filter((d) => !d.futuro);
  const registrados = {
    feitos: diasQueVieram.filter((d) => d.mood).length,
    de: diasQueVieram.length,
  };

  /**
   * O período em colunas de semana, uma linha por dia da semana.
   *
   * Uma coluna nova começa a cada domingo. A primeira e a última costumam vir
   * pela metade — o período não começa num domingo nem termina num sábado — e
   * os buracos das pontas ficam `null`: são dias fora do intervalo, e não dias
   * sem registro. Os dois se parecem e não são a mesma coisa, então só o dia
   * sem registro ganha contorno.
   */
  const colunas = useMemo(() => {
    type Celula = { date: string; mood: Mood | null; futuro: boolean } | null;
    /** `mes` só vem preenchido na coluna em que aquele mês começa. */
    type Coluna = { celulas: Celula[]; mes: number | null };

    const feitas: Coluna[] = [];
    let celulas: Celula[] = new Array(7).fill(null);
    let mesDaColuna: number | null = null;
    let ultimoRotulado: number | null = null;
    let comecou = false;

    const fechar = () => {
      feitas.push({ celulas, mes: mesDaColuna });
      celulas = new Array(7).fill(null);
      mesDaColuna = null;
    };

    for (const dia of longo) {
      if (dia.diaDaSemana === 0 && comecou) fechar();
      celulas[dia.diaDaSemana] = { date: dia.date, mood: dia.mood, futuro: dia.futuro };

      /*
        O rótulo do mês vai na coluna em que o mês estreia, e não naquela em que
        ele tem mais dias. É o que os calendários de contribuição fazem, e é o
        que o olho espera: o nome marca onde a coisa começa.

        Sai da chave "2026-09-14", e não de um `Date` novo — ver o comentário em
        `moodMeses` sobre por que refazer a data aqui erraria o fuso.
      */
      const mes = Number(dia.date.slice(5, 7)) - 1;
      if (mesDaColuna === null && mes !== ultimoRotulado) {
        mesDaColuna = mes;
        ultimoRotulado = mes;
      }
      comecou = true;
    }
    if (comecou) fechar();
    return feitas;
  }, [longo]);

  /** Quantos dias de cada humor no período, do mais frequente ao menos. */
  const contagem = useMemo(() => {
    const conta = new Map<Mood, number>();
    longo.forEach((d) => {
      if (d.mood) conta.set(d.mood, (conta.get(d.mood) ?? 0) + 1);
    });
    return [...conta.entries()].sort((a, b) => b[1] - a[1]);
  }, [longo]);

  // Sem nenhum humor marcado, um gráfico vazio só ocuparia espaço dizendo à
  // pessoa que ela ainda não fez nada.
  if (data.moodHistory.length === 0) return null;

  return (
    <Card>
      <View style={{ marginBottom: 12, gap: 10 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: fonts.display.semiBold, fontSize: 17 }}>
          Seu humor ao longo do tempo
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(
            [
              { chave: 'semana', rotulo: 'Esta semana' },
              { chave: 'mes', rotulo: 'Este mês' },
              { chave: 'trimestre', rotulo: '3 meses' },
            ] as const
          ).map(({ chave: d, rotulo }) => {
            const ativo = periodo === d;
            return (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityLabel={`Ver ${rotulo.toLowerCase()}`}
                accessibilityState={{ selected: ativo }}
                onPress={() => setPeriodo(d)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: radius.pill,
                  borderWidth: 1.5,
                  borderColor: ativo ? colors.primaryStrong : colors.border,
                  backgroundColor: ativo ? colors.primarySoft : colors.surface,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.body.bold,
                    fontSize: 12,
                    color: ativo ? colors.primaryStrong : palette.brown700,
                  }}
                >
                  {rotulo}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {periodo === 'semana' ? (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {semana.map((d, i) => {
            const tocado = escolhido?.date === d.date;
            return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              {/*
                A barra inteira é um alvo de leitor de tela, e não sete formas
                mudas: antes disto o gráfico simplesmente não existia para
                quem navega por voz. Tocar nela mostra, embaixo da fita, o
                humor e a palavra daquele dia.

                Dia que ainda não chegou não se toca: não há o que mostrar.
              */}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: tocado, disabled: d.futuro }}
                disabled={d.futuro}
                onPress={() => setDiaTocado(d.date)}
                accessibilityLabel={
                  d.futuro
                    ? `${d.day}: ainda não chegou`
                    : d.mood
                      ? `${d.day}: ${ROTULO_DO_HUMOR[d.mood]}${d.palavra ? `, ${d.palavra}` : ''}`
                      : `${d.day}: sem registro`
                }
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: radius.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Dia sem registro fica vazado, não colorido de mentira.
                  backgroundColor: d.mood ? moodColors[d.mood] : 'transparent',
                  // O dia tocado ganha um aro: é dele o que está escrito embaixo.
                  borderWidth: tocado ? 2 : d.mood ? 0 : 1,
                  borderColor: tocado ? colors.primaryStrong : palette.brown100,
                  /*
                    O dia que ainda não chegou aparece mais apagado que o dia
                    sem registro. Os dois estão vazios e não são a mesma coisa:
                    um é o tempo, o outro é uma ausência dela. Marcar como falta
                    o que ainda nem pôde acontecer seria cobrar o impossível.
                  */
                  opacity: d.futuro ? 0.35 : 1,
                }}
              >
                {/* A carinha é o segundo canal: expressão em vez de matiz. */}
                {!!d.mood && <MoodFace mood={d.mood} size={26} />}
              </Pressable>
              <Text
                style={{
                  fontFamily: tocado ? fonts.body.extraBold : fonts.body.bold,
                  fontSize: 11,
                  color: tocado ? colors.primaryStrong : palette.brown400,
                  marginTop: 5,
                }}
              >
                {d.day}
              </Text>
            </View>
            );
          })}
        </View>
      ) : (
        /* Com 30 ou 90 dias não cabe rótulo por dia: viram uma grade de
           semanas, onde o que se lê é o desenho do período.

           Escondida do leitor de tela de propósito. Noventa formas anunciadas
           uma a uma seriam noventa paradas para chegar ao fim de um cartão —
           a leitura deste bloco mora na conta por humor, logo abaixo, que diz
           a mesma coisa em quatro linhas. */
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {/* Os nomes dos meses, cada um em cima da coluna em que ele começa. */}
          <View style={{ flexDirection: 'row', gap: GRADE_VAO, marginBottom: 4 }}>
            <View style={{ width: LARGURA_DA_INICIAL }} />
            {colunas.map((coluna, c) => (
              <View key={c} style={{ flex: 1 }}>
                {coluna.mes !== null && (
                  <Text
                    /*
                      Sem quebrar e sem empurrar: o nome tem três letras e a
                      coluna pode ter vinte pontos, então ele transborda para a
                      direita, por cima da coluna seguinte, que naquele ponto
                      está vazia de rótulo. É como o calendário de contribuição
                      do GitHub resolve, e evita alargar a grade por causa do
                      texto.
                    */
                    numberOfLines={1}
                    style={{
                      fontFamily: fonts.body.bold,
                      fontSize: 10,
                      color: palette.brown400,
                      width: 30,
                    }}
                  >
                    {MESES[coluna.mes]}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: GRADE_VAO }}>
            {/* As iniciais dos dias da semana, uma vez, à esquerda de tudo. */}
            <View style={{ gap: GRADE_VAO }}>
              {INICIAIS.map((letra, i) => (
                <View key={i} style={{ height: GRADE_CELULA, justifyContent: 'center' }}>
                  <Text
                    style={{
                      fontFamily: fonts.body.bold,
                      fontSize: 10,
                      lineHeight: GRADE_CELULA,
                      color: palette.brown400,
                      width: LARGURA_DA_INICIAL,
                    }}
                  >
                    {letra}
                  </Text>
                </View>
              ))}
            </View>

            {colunas.map((coluna, c) => (
              <View key={c} style={{ flex: 1, gap: GRADE_VAO }}>
                {coluna.celulas.map((celula, i) => (
                  <View
                    key={i}
                    style={{
                      height: GRADE_CELULA,
                      borderRadius: 3,
                      // Dia fora do mês não é dia sem registro: fica vazio de
                      // verdade, sem contorno, para não contar um dia que não há.
                      backgroundColor: celula?.mood ? moodColors[celula.mood] : 'transparent',
                      borderWidth: celula && !celula.mood ? 1 : 0,
                      borderColor: palette.brown100,
                      /*
                        O dia que ainda não chegou aparece mais apagado que o dia
                        sem registro — a mesma regra da fita da semana, pelo mesmo
                        motivo: um é o tempo, o outro é uma ausência dela.
                      */
                      opacity: celula?.futuro ? 0.35 : 1,
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {/*
        A conta por humor: o segundo canal de 30 e 90 dias.

        Aparece só ali porque na semana a carinha já está dentro da barra, e
        repetir a mesma informação duas vezes na mesma altura da tela é ruído.
        Ordenada pela contagem, não por uma escala de humor — ordenar por humor
        seria escolher qual vem antes, e é aí que nasce a pontuação que este
        gráfico não tem.
      */}
      {periodo !== 'semana' && contagem.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 12,
          }}
        >
          {contagem.map(([mood, quantos]) => (
            <View
              key={mood}
              accessible
              accessibilityLabel={`${ROTULO_DO_HUMOR[mood]}: ${quantos} ${quantos === 1 ? 'dia' : 'dias'}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              <MoodFace mood={mood} size={18} />
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                {ROTULO_DO_HUMOR[mood]} · {quantos}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* O dia tocado da semana, com a palavra que ela escolheu para ele. */}
      {periodo === 'semana' && !!escolhido && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: radius.md,
            backgroundColor: colors.primarySoft,
          }}
        >
          <Text style={{ fontFamily: fonts.body.extraBold, fontSize: 13, color: colors.primaryStrong }}>
            {nomeDoDia(escolhido.date)}
          </Text>
          {escolhido.mood ? (
            <HumorComPalavra mood={escolhido.mood} palavra={escolhido.palavra} tamanho="pequeno" />
          ) : (
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 12, color: colors.textSecondary }}>
              sem registro
            </Text>
          )}
        </View>
      )}

      <Text
        style={{
          fontFamily: fonts.body.regular,
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 10,
        }}
      >
        {registrados.feitos} de {registrados.de}{' '}
        {periodo === 'semana'
          ? 'dias desta semana'
          : periodo === 'mes'
            ? 'dias deste mês'
            : 'dias destes três meses'}
      </Text>
    </Card>
  );
}

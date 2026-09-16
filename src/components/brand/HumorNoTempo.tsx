import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ROTULO_DO_HUMOR } from '../../data/humores';
import { type DiaDoCalendario, moodMeses, moodWeek } from '../../state/derived';
import { useAppState } from '../../state/AppStateProvider';
import { fonts, type Mood, radius, tracos, useTema } from '../../theme';
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
 * distinta por expressão e não por cor. Na semana ela cabe dentro da barra.
 *
 * No mês ela passou a caber, e isso mudou em 15/09/2026. Esta nota dizia que a
 * célula tinha "uns vinte pixels e não cabe nada", e era verdade da fita: um
 * retângulo por dia, lado a lado, trinta numa linha. A grade do calendário deu
 * à casa uns quarenta e cinco pontos quadrados — ela já carregava o número do
 * dia em doze —, e num quadrado desse tamanho cabem o número em dez e a carinha
 * em vinte e dois. A razão da exceção sumiu junto com a fita, e a exceção tinha
 * ficado.
 *
 * O trimestre continua só com a cor, e aqui a escolha é de leitura, não de
 * espaço: a casa tem vinte e quatro pontos de altura e a carinha caberia. Mas
 * são noventa dias, e noventa rostinhos numa tela não se leem um a um — viram
 * textura. O que se lê ali é o desenho da estação, e para ele a mancha de cor é
 * a representação certa.
 *
 * Nos dois casos a **conta por humor** embaixo do gráfico continua: ela é o
 * canal que diz *quanto* de cada humor teve o período, que nem a cor nem a
 * carinha dizem. No trimestre ela é o único segundo canal.
 *
 * Falta uma coisa, e está anotada porque não é resolvida: "Feliz" e "Leve" têm
 * a mesma boca sorrindo, uma mais funda que a outra, e a vinte e dois pontos a
 * diferença é de quase nada. Separá-las de verdade é mexer no conjunto de
 * rostos, que é a cara do app inteiro e não deste gráfico. Enquanto isso não
 * for feito, a ficha da App Store **não** declara "Diferenciação sem usar apenas
 * cor" — quatro dos seis humores se distinguem pela expressão, e quatro de seis
 * não é o que aquela caixinha promete.
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
 * Depois foram uma grade transposta — semanas em coluna, dias da semana em
 * linha. Cabia muita coisa e ninguém lia: mês não se lê de lado.
 *
 * Agora são **calendário**: sete colunas, iniciais em cima, as semanas descendo
 * em linhas. É a forma que todo mundo já sabe ler sem legenda, e quem bate o
 * olho reconhece o mês antes de entender que aquilo é um gráfico.
 *
 * ## E o período é o mês do calendário, não os últimos trinta dias
 *
 * A fita de sete dias já era a semana do calendário; estes dois continuavam
 * sendo janela corrida, e a incoerência aparecia. Numa janela de trinta dias a
 * mesma quarta-feira muda de coluna todo dia, o começo é uma data arbitrária
 * que ninguém guarda, e não existe mês nenhum para nomear — o desenho era um
 * pedaço de agosto grudado num pedaço de setembro.
 *
 * Fechado no mês, ele ganha nome — escrito por extenso em cima do calendário.
 * E "como foi o meu setembro", que é o que se quer saber olhando para trás,
 * passa a ser pergunta que o desenho responde.
 *
 * O preço é que o mês corrente termina no futuro. Esses dias aparecem
 * apagados, como na semana — o mês tem o tamanho que tem, e ver quanto falta
 * encher é informação. O que eles não fazem é contar como falta.
 */
/** O vão entre as casas do calendário. */
const GRADE_VAO = 3;

/**
 * As iniciais dos dias, de domingo a sábado.
 *
 * Três delas são "S" e duas são "Q", e é assim mesmo — é a abreviação que todo
 * calendário brasileiro usa, e a posição resolve o resto. Trocar por duas
 * letras roubaria largura das casas para desfazer uma ambiguidade que ninguém
 * tem ao olhar um calendário.
 */
const INICIAIS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** "Qua, 9 set" — curto, porque divide a linha com o humor e a palavra. */
function nomeDoDia(chave: string): string {
  const d = new Date(`${chave}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return `${DIAS_DA_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

/**
 * Os dias de um mês repartidos em linhas de domingo a sábado.
 *
 * As casas que sobram nas pontas ficam `null`, e é de propósito: o dia 30 de
 * agosto **não** aparece no calendário de setembro. Um calendário de papel
 * costuma mostrar esses dias em cinza, mas aqui cada casa é um humor — uma casa
 * de agosto dentro de setembro entraria na leitura de um mês a que ela não
 * pertence, e o rodapé embaixo contaria outra coisa.
 */
function semanasDoMes(dias: DiaDoCalendario[]): (DiaDoCalendario | null)[][] {
  const semanas: (DiaDoCalendario | null)[][] = [];
  let linha: (DiaDoCalendario | null)[] = new Array(7).fill(null);

  for (const dia of dias) {
    linha[dia.diaDaSemana] = dia;
    if (dia.diaDaSemana === 6) {
      semanas.push(linha);
      linha = new Array(7).fill(null);
    }
  }
  if (linha.some(Boolean)) semanas.push(linha);
  return semanas;
}

/**
 * Um mês desenhado como calendário: iniciais em cima, dias embaixo.
 *
 * ## Por que calendário, e não a grade transposta de antes
 *
 * A versão anterior punha as semanas em coluna e os dias da semana em linha —
 * era compacta e cabiam noventa dias, mas ninguém lê mês assim. Calendário tem
 * uma forma que todo mundo já sabe ler sem legenda: sete colunas, a semana
 * andando da esquerda para a direita, as linhas descendo. Quem bate o olho
 * reconhece o mês antes de entender o gráfico.
 *
 * ## A casa é quadrada quando cabe
 *
 * Com `alturaDaCelula` em branco ela usa `aspectRatio`, fica quadrada e o
 * número do dia cabe dentro. É o mês sozinho. No trimestre a altura vem
 * apertada e o número sai: três calendários quadrados empilhados passariam de
 * oitocentos pontos, e a conta por humor — que é onde mora o detalhe — ficaria
 * a dois telefones de rolagem do gráfico que ela resume.
 */
/**
 * O que o leitor de tela diz ao parar numa casa do calendario.
 *
 * Sem isto ele le so o numero — "12" —, que e a unica coisa que a casa tem
 * escrita. O humor esta na cor e na expressao, e nenhuma das duas e texto.
 */
function rotuloDaCasa(dia: DiaDoCalendario): string {
  const numero = Number(dia.date.slice(8, 10));
  const mes = MESES_LONGOS[Number(dia.date.slice(5, 7)) - 1];
  if (dia.futuro) return `${numero} de ${mes}, ainda nao chegou`;
  if (!dia.mood) return `${numero} de ${mes}, sem registro`;
  return `${numero} de ${mes}, ${ROTULO_DO_HUMOR[dia.mood]}`;
}

function CalendarioDoMes({
  mes,
  dias,
  alturaDaCelula,
}: {
  mes: number;
  dias: DiaDoCalendario[];
  /** Em branco, a casa fica quadrada e mostra o número do dia. */
  alturaDaCelula?: number;
}) {
  const { colors, moodColors, palette } = useTema();
  const semanas = semanasDoMes(dias);
  const comNumero = alturaDaCelula === undefined;

  return (
    <View style={{ gap: GRADE_VAO }}>
      <Text
        style={{
          fontFamily: fonts.body.bold,
          fontSize: 12,
          color: palette.brown400,
          marginBottom: 2,
        }}
      >
        {MESES_LONGOS[mes]}
      </Text>

      {/* As iniciais dos dias, uma vez, em cima das colunas. */}
      <View style={{ flexDirection: 'row', gap: GRADE_VAO }}>
        {INICIAIS.map((letra, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, color: palette.brown400 }}>
              {letra}
            </Text>
          </View>
        ))}
      </View>

      {semanas.map((linha, s) => (
        <View key={s} style={{ flexDirection: 'row', gap: GRADE_VAO }}>
          {linha.map((dia, i) => (
            <View
              key={i}
              accessible={comNumero && !!dia}
              accessibilityLabel={comNumero && dia ? rotuloDaCasa(dia) : undefined}
              style={{
                flex: 1,
                ...(comNumero ? { aspectRatio: 1 } : { height: alturaDaCelula }),
                borderRadius: 5,
                alignItems: 'center',
                justifyContent: 'center',
                // Dia sem registro fica vazado; casa fora do mês fica vazia de
                // verdade, sem contorno, para não contar um dia que não há.
                backgroundColor: dia?.mood ? moodColors[dia.mood] : 'transparent',
                borderWidth: dia && !dia.mood ? 1 : 0,
                borderColor: palette.brown100,
                /*
                  O dia que ainda não chegou aparece mais apagado que o dia sem
                  registro — a mesma regra da fita da semana, pelo mesmo motivo:
                  um é o tempo, o outro é uma ausência dela.
                */
                opacity: dia?.futuro ? 0.35 : 1,
              }}
            >
              {comNumero && !!dia && (
                <Text
                  style={{
                    fontFamily: fonts.body.bold,
                    /*
                      O número encolhe quando divide a casa com a carinha: os
                      dois em doze pontos passam da altura do quadrado, e o que
                      sobra cortado é o queixo do rosto.
                    */
                    fontSize: dia.mood ? 10 : 12,
                    lineHeight: dia.mood ? 12 : 16,
                    /*
                      Sobre a cor do humor o número usa a tinta do desenho, e
                      não `palette.brown900`.

                      Eram a mesma coisa no tema claro, e por isso o erro durou:
                      no escuro `brown900` troca de ponta e vira creme, enquanto
                      as cores de humor continuam claras nos dois temas — ver
                      `moodColorsEscuros`. O número saía creme sobre pastel, e o
                      dia registrado era o único do calendário sem data legível.

                      `tracos.contorno` é a tinta escura que não segue o tema; é
                      a mesma que a carinha usa, pelo mesmo motivo.

                      Sobre a casa vazada o número acompanha o texto do tema, que
                      no escuro é claro — ali o fundo é o do cartão, não o humor.
                    */
                    color: dia.mood ? tracos.contorno : colors.textSecondary,
                  }}
                >
                  {Number(dia.date.slice(8, 10))}
                </Text>
              )}
              {/*
                A carinha, sem o círculo dela: a cor já está na casa. É o
                segundo canal do mês — ver a nota do topo do arquivo.
              */}
              {comNumero && !!dia?.mood && <MoodFace mood={dia.mood} size={22} semFundo />}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
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
        /*
          No mês e no trimestre o desenho é um calendário: as iniciais dos dias
          em cima, os dias do mês embaixo, em linhas de domingo a sábado.

          Escondido do leitor de tela de propósito. Noventa formas anunciadas
          uma a uma seriam noventa paradas para chegar ao fim de um cartão — a
          leitura deste bloco mora na conta por humor, logo abaixo, que diz a
          mesma coisa em quatro linhas.
        */
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ gap: periodo === "mes" ? 0 : 16 }}
        >
          {meses.map((m) => (
            <CalendarioDoMes
              key={m.chave}
              mes={m.mes}
              dias={m.dias}
              /*
                Um mês sozinho cabe grande, com o número do dia dentro da
                casa. Três não cabem: seriam quase novecentos pontos de altura
                num cartão, e a pessoa rolaria dois telefones de calendário
                para chegar à conta que resume tudo. No trimestre a casa
                encolhe e o número sai — ali o que se lê é o desenho, e o
                detalhe está na conta por humor logo abaixo.
              */
              alturaDaCelula={periodo === "mes" ? undefined : 24}
            />
          ))}
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

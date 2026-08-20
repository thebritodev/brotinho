import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { colors, palette, radius } from '../theme';

/**
 * A última rede de segurança do app.
 *
 * O bug do `perfil.tentou.map` mostrou o pior jeito de falhar: um erro na
 * renderização derruba a árvore inteira e o React deixa a tela **em branco,
 * para sempre**. Fechar e abrir de novo não resolve — o mesmo dado quebrado
 * volta e quebra igual. A pessoa fica sem nenhuma saída e sem nenhuma pista.
 *
 * Aquele erro foi corrigido na origem, mas a *categoria* continuava aberta:
 * qualquer outro erro de renderização daria a mesma tela branca. É pior aqui do
 * que na maioria dos apps — quem abre o Brotinho às vezes está mal, e receber
 * o vazio é a última coisa que essa pessoa precisa.
 *
 * Este limite troca a tela branca por uma tela que explica, diz que os
 * registros continuam salvos e oferece um caminho.
 *
 * Não usa as fontes do app de propósito: ele fica acima do carregamento delas,
 * e uma tela de erro que depende do que pode ter falhado não é uma tela de erro.
 */

type Props = { children: React.ReactNode };
type State = { erro: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: React.ErrorInfo) {
    // Em produção não há para onde mandar isto sem um servidor — e mandar
    // exigiria enviar dados da pessoa, que é justamente o que o app promete
    // não fazer. Fica no console, onde aparece ao depurar com o cabo ligado.
    if (__DEV__) console.error('[brotinho] erro na renderização:', erro, info.componentStack);
  }

  /**
   * Tentar de novo vale a pena: boa parte dos erros vem de um estado passageiro
   * (uma tela específica, um registro específico). Remontar a árvore resolve
   * esses. Se voltar a quebrar, a mesma tela aparece — sem laço infinito e sem
   * perder nada.
   */
  private tentarDeNovo = () => this.setState({ erro: null });

  render() {
    const { erro } = this.state;
    if (!erro) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 28,
            gap: 16,
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: '700', color: colors.textPrimary }}>
            Alguma coisa quebrou aqui
          </Text>

          <Text style={{ fontSize: 16, lineHeight: 25, color: palette.brown700 }}>
            O erro é do app, não é nada que você fez.
          </Text>

          {/* O medo imediato de quem escreve um diário é ter perdido o diário.
              Responder isso antes de qualquer outra coisa. */}
          <Text style={{ fontSize: 16, lineHeight: 25, color: palette.brown700 }}>
            <Text style={{ fontWeight: '700' }}>Seus registros continuam salvos.</Text> Eles ficam
            guardados no aparelho e não foram apagados.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tentar de novo"
            onPress={this.tentarDeNovo}
            style={({ pressed }) => ({
              backgroundColor: colors.primaryStrong,
              borderRadius: radius.pill,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
              marginTop: 4,
            })}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textInverse }}>
              Tentar de novo
            </Text>
          </Pressable>

          <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSecondary }}>
            Se continuar acontecendo, me conte em brotinho.suporte@gmail.com. Saber em que tela
            aconteceu já ajuda bastante.
          </Text>

          {/* O texto do erro é inútil para a pessoa e essencial para consertar:
              fica no fim, discreto, para ela poder copiar se quiser ajudar. */}
          {__DEV__ && (
            <Text
              style={{
                fontSize: 12,
                lineHeight: 18,
                color: colors.textSecondary,
                fontFamily: 'monospace',
                marginTop: 8,
              }}
            >
              {erro.message}
            </Text>
          )}
        </ScrollView>
      </View>
    );
  }
}

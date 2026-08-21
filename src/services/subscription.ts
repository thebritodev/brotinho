import { NativeModules, Platform } from 'react-native';

/**
 * Assinatura, via RevenueCat.
 *
 * O SDK é um módulo nativo: ele não existe no Expo Go nem na web. Por isso
 * nada aqui importa `react-native-purchases` no topo do arquivo — o pacote é
 * pedido só depois de confirmar que o módulo nativo está presente. Já
 * derrubamos o app inteiro na abertura uma vez fazendo isso errado com o
 * reconhecimento de fala; a lição vale igual aqui.
 *
 * Quando o SDK não está disponível, o estado é `indisponivel` e o app NÃO
 * bloqueia ninguém. Bloquear em ambiente de desenvolvimento tornaria o app
 * impossível de testar, e "não consegui verificar" nunca deve virar "não pagou".
 */

/** O direito que libera o app. Precisa ter esse mesmo nome no RevenueCat. */
export const ENTITLEMENT = 'premium';

export type EstadoDaAssinatura =
  /** Ainda perguntando à loja. */
  | 'verificando'
  /** Tem direito ativo. */
  | 'assinante'
  /** Respondeu, e não tem. */
  | 'sem-assinatura'
  /** Sem SDK nativo (Expo Go, web) ou sem chave configurada. */
  | 'indisponivel';

export type PlanoDaLoja = {
  /** Identificador do produto, igual nas duas lojas. */
  id: string;
  /** Preço já formatado pela loja, na moeda e no idioma do aparelho. */
  preco: string;
  /**
   * O mesmo preço diluído por mês, já formatado — "R$ 14,95" para um plano
   * anual de R$ 179,40.
   *
   * Vem pronto da loja de propósito: dividir por 12 aqui daria um número sem
   * moeda, sem o arredondamento da região e errado em qualquer país que não
   * use vírgula decimal. `null` em produto que não é assinatura.
   */
  precoMensal: string | null;
  /** O pacote do RevenueCat. Opaco de propósito para quem chama. */
  pacote: unknown;
};

export type ResultadoDaCompra = 'assinou' | 'cancelou' | 'erro';

// --- Carregamento protegido do SDK ---------------------------------------

type Sdk = {
  configure: (opcoes: { apiKey: string }) => void;
  getCustomerInfo: () => Promise<CustomerInfo>;
  getOfferings: () => Promise<{ current: Offering | null }>;
  purchasePackage: (pacote: unknown) => Promise<{ customerInfo: CustomerInfo }>;
  restorePurchases: () => Promise<CustomerInfo>;
  addCustomerInfoUpdateListener: (cb: (info: CustomerInfo) => void) => void;
  setLogLevel?: (nivel: unknown) => void;
};

type CustomerInfo = { entitlements: { active: Record<string, unknown> } };
type Offering = { availablePackages: PacoteBruto[] };
type PacoteBruto = {
  product: {
    identifier: string;
    priceString: string;
    /** Já diluído por mês pela própria loja. Nulo em produto avulso. */
    pricePerMonthString?: string | null;
  };
};

let sdkResolvido: Sdk | null | undefined;

function obterSdk(): Sdk | null {
  if (sdkResolvido !== undefined) return sdkResolvido;

  // A checagem do NativeModules vem ANTES do require: no Expo Go o pacote
  // existe em JS, mas qualquer chamada dele estoura por falta do lado nativo.
  if (Platform.OS === 'web' || !NativeModules.RNPurchases) {
    sdkResolvido = null;
    return null;
  }

  try {
    const mod = require('react-native-purchases');
    sdkResolvido = (mod.default ?? mod) as Sdk;
  } catch {
    sdkResolvido = null;
  }
  return sdkResolvido;
}

/** Chave pública da loja atual. Vem do ambiente, nunca fica escrita no código. */
function chaveDaPlataforma(): string | null {
  const chave =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID;
  return chave && chave.trim() ? chave.trim() : null;
}

/** true quando dá para cobrar de verdade neste aparelho. */
export function cobrancaDisponivel(): boolean {
  return obterSdk() !== null && chaveDaPlataforma() !== null;
}

// --- Ciclo de vida --------------------------------------------------------

let configurado = false;

/** Liga o SDK. Chamar mais de uma vez não faz mal. */
export function iniciarAssinatura(): boolean {
  if (configurado) return true;

  const sdk = obterSdk();
  const apiKey = chaveDaPlataforma();
  if (!sdk || !apiKey) return false;

  try {
    sdk.configure({ apiKey });
    configurado = true;
    return true;
  } catch {
    return false;
  }
}

const temDireito = (info: CustomerInfo) =>
  Boolean(info?.entitlements?.active?.[ENTITLEMENT]);

/** Pergunta à loja se a assinatura está ativa agora. */
export async function verificarAssinatura(): Promise<EstadoDaAssinatura> {
  if (!iniciarAssinatura()) return 'indisponivel';

  try {
    const info = await obterSdk()!.getCustomerInfo();
    return temDireito(info) ? 'assinante' : 'sem-assinatura';
  } catch {
    // Sem rede, o SDK responde do cache local. Se nem isso deu, não é hora de
    // trancar a porta na cara de quem talvez tenha pago.
    return 'indisponivel';
  }
}

/**
 * Avisa quando a assinatura muda sozinha — renovação, cancelamento, reembolso,
 * ou compra feita em outro aparelho com a mesma conta da loja.
 */
export function observarAssinatura(aoMudar: (estado: EstadoDaAssinatura) => void): void {
  if (!iniciarAssinatura()) return;
  try {
    obterSdk()!.addCustomerInfoUpdateListener((info) =>
      aoMudar(temDireito(info) ? 'assinante' : 'sem-assinatura'),
    );
  } catch {
    // Sem o aviso, o app ainda verifica a cada abertura.
  }
}

// --- Planos ---------------------------------------------------------------

/**
 * Os planos como a loja os devolve.
 *
 * O preço TEM que vir daqui, e não do texto escrito no app: Apple e Google
 * exigem o valor convertido e localizado, e reprovam quando ele está fixo.
 * Uma lista vazia significa "não consegui perguntar" — quem chama decide o que
 * mostrar no lugar.
 */
export async function listarPlanos(): Promise<PlanoDaLoja[]> {
  if (!iniciarAssinatura()) return [];

  try {
    const { current } = await obterSdk()!.getOfferings();
    if (!current) return [];
    return current.availablePackages.map((p) => ({
      id: p.product.identifier,
      preco: p.product.priceString,
      precoMensal: p.product.pricePerMonthString ?? null,
      pacote: p,
    }));
  } catch {
    return [];
  }
}

// --- Comprar e restaurar --------------------------------------------------

export async function comprarPlano(pacote: unknown): Promise<ResultadoDaCompra> {
  if (!iniciarAssinatura()) return 'erro';

  try {
    const { customerInfo } = await obterSdk()!.purchasePackage(pacote);
    return temDireito(customerInfo) ? 'assinou' : 'erro';
  } catch (e) {
    // Desistir no meio não é falha: a loja devolve um erro marcado como
    // cancelamento do usuário, e mostrar "algo deu errado" nesse caso seria
    // acusar a pessoa de um problema que ela mesma escolheu.
    const cancelou = (e as { userCancelled?: boolean })?.userCancelled;
    return cancelou ? 'cancelou' : 'erro';
  }
}

/**
 * Devolve o acesso a quem já pagou — trocou de aparelho, reinstalou, formatou.
 *
 * A Apple reprova app de assinatura que não tenha isso funcionando, e como o
 * Brotinho não tem cadastro, é o único caminho de volta que existe.
 */
export async function restaurarCompras(): Promise<boolean> {
  if (!iniciarAssinatura()) return false;

  try {
    const info = await obterSdk()!.restorePurchases();
    return temDireito(info);
  } catch {
    return false;
  }
}

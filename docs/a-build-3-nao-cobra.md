# A build 3 não cobra de ninguém

**Descoberto em 23 de agosto de 2026, depois que o `.ipa` já estava com a Apple.**

A build que foi enviada ao App Store Connect **entrega o app inteiro de graça**.
O botão "Assinar por R$ 179,90/ano" não abre a loja: ele entra no app.

Não é um defeito de código. É o comportamento correto **para desenvolvimento**,
que foi para produção porque falta uma configuração.

---

## A cadeia, do começo ao fim

```
.env não tem EXPO_PUBLIC_REVENUECAT_IOS
EAS não tem variável nenhuma no ambiente production
        ↓
chaveDaPlataforma()   → null
cobrancaDisponivel()  → false
podeCobrar            → false
        ↓
OnboardingScreen, no botão do paywall:
    if (!podeCobrar) return finish(false);
        ↓
entra no app sem cobrar
```

E, em paralelo:

```
estado = 'indisponivel'
precisaAssinar(estado) → false      // só 'sem-assinatura' tranca
        ↓
nada é bloqueado, nunca
```

Verificado nos dois lados: `eas env:list production` responde
*"No variables found for this environment"*, e o `.env` local só tem o endereço
do transcritor.

---

## Por que isso provavelmente reprova na revisão

**As quatro compras foram enviadas junto com a versão 1.0.** A Apple é obrigada a
revisar cada uma, e para isso o revisor precisa **chegar até a tela de compra**.

Nesta build ele não chega. Ele toca em "Assinar", entra no app, e não há compra
nenhuma para testar.

Esse é um dos motivos de reprovação mais comuns que existem, e costuma vir com um
texto do tipo *"we were unable to locate the in-app purchases within your app"*.

Há um agravante: a ficha da loja anuncia quatro planos com preço, e a captura do
paywall está anexada aos quatro produtos. Um app que **mostra preço e não cobra**
também pode ser lido como propaganda enganosa.

---

## O que resolve

Só uma coisa: **as chaves públicas do RevenueCat**, e uma build nova.

1. Criar a conta e o projeto em <https://app.revenuecat.com> — o passo a passo
   está na FASE 4 de `ativar-assinaturas.md`
2. Ligar o app iOS (`com.brotinho.app`) à Apple, cadastrar os 4 identificadores,
   criar o direito `premium` e a oferta
3. Guardar as duas chaves públicas no EAS, que é onde a build as lê:

```
eas env:create --environment production --name EXPO_PUBLIC_REVENUECAT_IOS --value appl_xxx --visibility sensitive
eas env:create --environment production --name EXPO_PUBLIC_REVENUECAT_ANDROID --value goog_xxx --visibility sensitive
```

4. Compilar de novo e enviar. O EAS já guardou o certificado, o perfil e a chave
   de API — não pergunta mais senha nenhuma:

```
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

> **Guardar no EAS, não no `.env`.** O `.env` não sobe para a nuvem de build: foi
> exatamente por isso que a build 3 saiu sem chave. E `--visibility sensitive`
> impede que o valor apareça nos registros da compilação.

---

## E se você quiser lançar assim mesmo

Dá, mas mude a ficha para não prometer o que o app não faz:

- Remover os quatro produtos do envio da versão 1.0
- Tirar a captura do paywall dos produtos
- Ajustar a descrição, que hoje fala em planos

Aí o app entra como gratuito, e a cobrança vira uma atualização. **Não recomendo:**
significa reescrever a ficha duas vezes e refazer a revisão dos produtos depois.

O caminho curto é o RevenueCat.

---

## O que não fazer

**Não mexa no `if (!podeCobrar) return finish(false)`.** Ele existe para o app ser
testável no Expo Go, onde não há compra possível — sem ele, ninguém consegue
passar do onboarding durante o desenvolvimento.

O problema nunca foi essa linha. É a chave que não chegou até a build.

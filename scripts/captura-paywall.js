/**
 * Captura a tela de planos, que a Apple exige para revisar as assinaturas.
 *
 * O paywall é o último passo do onboarding, então o script força o fluxo a
 * abrir direto nele em vez de percorrer os catorze passos. A alteração é
 * temporária e desfeita ao fim, com conferência de que o arquivo voltou byte a
 * byte ao original.
 *
 * Uso: node scripts/captura-paywall.js   (com o Metro rodando em :8081)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ORIGEM = 'http://localhost:8081/';
const SAIDA = path.join(__dirname, '..', 'capturas');
const TELA = path.join(__dirname, '..', 'src', 'screens', 'onboarding', 'OnboardingScreen.tsx');

const LARGURA = 414;
const ALTURA = 896;
const DENSIDADE = 3;

const ORIGINAL = 'const [step, setStep] = useState(0);';
const FORCADO = 'const [step, setStep] = useState(PASSO.PAYWALL);';

(async () => {
  const antes = fs.readFileSync(TELA, 'utf8');
  if (!antes.includes(ORIGINAL)) throw new Error('não encontrei o passo inicial do onboarding');

  fs.writeFileSync(TELA, antes.replace(ORIGINAL, FORCADO), 'utf8');
  console.log('onboarding apontado para o paywall (temporário)');

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: LARGURA, height: ALTURA },
      deviceScaleFactor: DENSIDADE,
    });

    await page.goto(ORIGEM, { waitUntil: 'networkidle', timeout: 180000 });
    // Sem estado salvo o app abre nas boas-vindas; um toque leva ao fluxo,
    // que já está apontado para o paywall.
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle', timeout: 180000 });
    await page.waitForTimeout(3000);

    await page.evaluate(() => {
      const b = [...document.querySelectorAll('[role="button"]')].find((x) =>
        x.innerText.trim().startsWith('Começar'),
      );
      if (b) b.click();
    });
    await page.waitForTimeout(2500);

    fs.mkdirSync(SAIDA, { recursive: true });
    const arquivo = path.join(SAIDA, 'paywall.png');
    await page.screenshot({ path: arquivo });
    console.log(`paywall.png  ${LARGURA * DENSIDADE} × ${ALTURA * DENSIDADE}`);

    await browser.close();
  } finally {
    fs.writeFileSync(TELA, antes, 'utf8');
    const depois = fs.readFileSync(TELA, 'utf8');
    console.log(depois === antes ? 'arquivo restaurado, idêntico ao original' : 'ATENÇÃO: arquivo difere do original');
  }
})().catch((e) => {
  console.error('falhou:', e.message);
  process.exit(1);
});

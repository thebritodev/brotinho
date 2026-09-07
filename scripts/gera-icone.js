/**
 * Gera as variantes de ícone a partir de `assets/icon.png`.
 *
 * **Nada aqui redesenha nada.** A arte é a que está no `icon.png`; este script
 * só recorta, redimensiona e tira o fundo onde o formato pede transparência.
 * Existe porque são cinco arquivos com regras diferentes, e mantê-los à mão é
 * como o ícone antigo ficou anos fora de sincronia com o desenho do app.
 *
 * Cada arquivo tem a sua regra comentada no lugar onde é gerado. A que mais
 * engana é a do Android: o `foreground` não é o ícone — é a
 * camada de cima de um ícone adaptativo, que o sistema compõe com o
 * `background` e recorta em círculo, quadrado ou squircle conforme o launcher.
 * O que passar da zona segura central some, e some de forma diferente em cada
 * aparelho.
 *
 * Uso: node scripts/gera-icone.js
 */

const { execFileSync } = require('child_process');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

const PY = `
import io, json, os, sys
from PIL import Image

RAIZ = os.path.dirname(os.path.abspath(sys.argv[0])) if False else ${JSON.stringify(RAIZ)}
ASSETS = os.path.join(RAIZ, 'assets')
ORIGEM = os.path.join(ASSETS, 'icon.png')

base = Image.open(ORIGEM).convert('RGBA')
if base.size[0] != base.size[1]:
    raise SystemExit('o icone precisa ser quadrado; veio %sx%s' % base.size)

# A cor do fundo vem do canto, nao de palpite.
fundo = base.convert('RGB').getpixel((2, 2))
print('  fundo lido do arquivo: #%02X%02X%02X' % fundo)

def sem_fundo(im, tolerancia=10):
    """Deixa transparente o que for a cor de fundo. Só serve para fundo chapado."""
    px = im.load()
    L, A = im.size
    for y in range(A):
        for x in range(L):
            r, g, b, a = px[x, y]
            if abs(r - fundo[0]) <= tolerancia and abs(g - fundo[1]) <= tolerancia and abs(b - fundo[2]) <= tolerancia:
                px[x, y] = (r, g, b, 0)
    return im

def caixa_do_desenho(im):
    """Onde o desenho comeca e termina, ignorando o fundo."""
    return sem_fundo(im.copy()).getbbox()

recortado = base.crop(caixa_do_desenho(base))
print('  desenho ocupa %sx%s de %s' % (recortado.size[0], recortado.size[1], base.size[0]))

def em_canvas(desenho, lado, ocupacao, cor_de_fundo=None):
    """Poe o desenho centrado num quadrado, ocupando a fracao pedida."""
    alvo = int(round(lado * ocupacao))
    escala = alvo / max(desenho.size)
    novo = desenho.resize(
        (max(1, int(round(desenho.size[0] * escala))), max(1, int(round(desenho.size[1] * escala)))),
        Image.LANCZOS,
    )
    tela = Image.new('RGBA', (lado, lado), (cor_de_fundo + (255,)) if cor_de_fundo else (0, 0, 0, 0))
    tela.paste(novo, ((lado - novo.size[0]) // 2, (lado - novo.size[1]) // 2), novo)
    return tela

sem = sem_fundo(recortado.copy())

saidas = []

# splash: o app pinta o fundo creme por baixo (\`backgroundColor\` do app.json),
# entao aqui vai so o desenho, sem o barro, para ele pousar no papel.
em_canvas(sem, 1024, 0.9).save(os.path.join(ASSETS, 'splash-icon.png'))
saidas.append(('splash-icon.png', '1024, sem fundo'))

# O icone da loja NAO pode ter canal alfa.
#
# A Apple recusa o envio com "Invalid Image - The image has an alpha channel",
# e recusa mesmo quando o alfa e 255 em todo lugar, como e o caso aqui: o que
# ela olha e a existencia do canal, nao o conteudo dele. Achatar para RGB e a
# unica coisa que este script muda no arquivo que voce entregou.
base.convert('RGB').save(ORIGEM)
print('  icon.png achatado para RGB (a Apple recusa alfa no icone)')

# favicon: fica sobre a aba branca do navegador, entao mantem o fundo.
base.resize((256, 256), Image.LANCZOS).save(os.path.join(ASSETS, 'favicon.png'))
saidas.append(('favicon.png', '256, com fundo'))

# Android adaptativo. A zona segura do formato e o circulo central de 66%; o
# desenho fica em 62% para sobrar folga tambem no recorte em circulo.
em_canvas(sem, 1024, 0.62).save(os.path.join(ASSETS, 'android-icon-foreground.png'))
saidas.append(('android-icon-foreground.png', '1024, sem fundo, zona segura 62%'))

Image.new('RGB', (1024, 1024), fundo).save(os.path.join(ASSETS, 'android-icon-background.png'))
saidas.append(('android-icon-background.png', '1024, barro chapado'))

# Monocromatico do tema do Android: silhueta chapada, so o alfa importa.
silhueta = Image.new('RGBA', sem.size, (0, 0, 0, 0))
silhueta.putalpha(sem.getchannel('A'))
em_canvas(silhueta, 1024, 0.62).save(os.path.join(ASSETS, 'android-icon-monochrome.png'))
saidas.append(('android-icon-monochrome.png', '1024, silhueta'))

for nome, nota in saidas:
    print('  %-30s %s' % (nome, nota))

# O fundo do adaptativo no app.json acompanha a cor lida do arquivo.
app = os.path.join(RAIZ, 'app.json')
s = io.open(app, encoding='utf-8').read()
hexa = '#%02X%02X%02X' % fundo
import re
novo = re.sub(r'("adaptiveIcon":\\s*\\{[^}]*?"backgroundColor":\\s*")#[0-9A-Fa-f]{6}', r'\\g<1>' + hexa, s, count=1, flags=re.S)
if novo != s:
    io.open(app, 'w', encoding='utf-8', newline='\\n').write(novo)
    print('  app.json: fundo do adaptativo -> ' + hexa)
else:
    print('  app.json: fundo do adaptativo ja estava em ' + hexa)
`;

console.log('gerando a partir de assets/icon.png:');
execFileSync('python', ['-c', PY], { stdio: 'inherit', cwd: RAIZ });

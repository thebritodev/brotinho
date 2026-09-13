# ===========================================================================
#  Espera o tunel subir e anota o endereco em endereco-expo.txt.
#
#  O ngrok sorteia um subdominio novo a cada vez que sobe — num mesmo dia foi
#  0byg8lc e depois g2qcbem. Nao ha link fixo para guardar, entao quem sobe
#  anota onde ficou.
#
#  Isto vive num arquivo proprio, e nao embutido no .cmd, porque a primeira
#  versao estava la dentro quebrada em varias linhas com `^`. O cmd cortou o
#  comando no meio de 'dd/MM/yyyy HH:mm' e ficou tentando executar um programa
#  chamado "m". PowerShell dentro de .cmd cabe em uma linha ou em arquivo
#  proprio; no meio-termo, nao.
# ===========================================================================

param(
  [string]$Destino = (Join-Path (Split-Path $PSScriptRoot -Parent) 'endereco-expo.txt')
)

for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 3
  try {
    $tunel = (Invoke-RestMethod 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 3).tunnels |
      Where-Object { $_.proto -eq 'https' } | Select-Object -First 1
    if ($tunel) {
      $url = $tunel.public_url -replace '^https', 'exp'
      $quando = Get-Date -Format 'dd/MM/yyyy HH:mm'
      Set-Content -Path $Destino -Encoding utf8 -Value @(
        'Abra este endereco no BROTINHO (development build) instalado no celular:',
        '',
        $url,
        '',
        "anotado em $quando",
        'O endereco muda a cada vez que o servidor sobe.',
        '',
        'NAO use o Expo Go. A Play Store atualizou ele para o SDK 57 e o projeto',
        'esta no 54 — o Expo Go recusa o endereco com "error loading app". O app',
        'de desenvolvimento proprio vem de:',
        '  npx eas build --profile development --platform android'
      )
      exit 0
    }
  } catch { }
}
exit 1

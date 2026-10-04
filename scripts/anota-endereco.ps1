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
      # O `exp://` e o esquema do EXPO GO. Anotado assim, o Android entregava
      # o endereco para ele, que recusava o SDK e dizia "error loading app" —
      # o arquivo avisava para nao usar o Expo Go e, na linha de cima, dava o
      # endereco dele. O development build atende em dois formatos: o http
      # cru, que se cola no campo "Enter URL manually", e o `exp+<slug>://`,
      # que o `expo-dev-client` registra sozinho.
      $http = $tunel.public_url -replace '^https', 'http'
      $fundo = 'exp+brotinho-app://expo-development-client/?url=' + $http
      $quando = Get-Date -Format 'dd/MM/yyyy HH:mm'
      Set-Content -Path $Destino -Encoding utf8 -Value @(
        'Abra o BROTINHO (development build) instalado no celular e cole isto',
        'em "Enter URL manually":',
        '',
        $http,
        '',
        'Ou toque neste link, que abre o app direto:',
        '',
        $fundo,
        '',
        "anotado em $quando",
        'O endereco muda a cada vez que o servidor sobe.',
        '',
        'NAO use o Expo Go, e nao use endereco `exp://` — aquele esquema e o',
        'DELE. A Play Store atualizou o Expo Go para o SDK 57 e o projeto esta',
        'no 54: ele recusa com "error loading app". O app de desenvolvimento',
        'proprio vem de:',
        '  npx eas build --profile development --platform android'
      )
      exit 0
    }
  } catch { }
}
exit 1

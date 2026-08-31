# ===========================================================================
#  Encerra o laco, o servidor do Metro e o tunel.
#
#  Tres armadilhas ja pisadas aqui, e todas viraram regra:
#
#  1. `wmic ... call terminate` nao matava nada. Eu achei que tinha desligado,
#     lancei outro por cima, e passei a ter dois lacos brigando pela porta 8081
#     — com o antigo, de uma versao anterior do script, sendo o que de fato
#     atendia. Confundiu o diagnostico por vinte minutos.
#
#  2. Embutido no .cmd com continuacao de linha, o cmd leu o `|` de dentro das
#     aspas como pipe e quebrou o comando ao meio, tentando executar um
#     programa chamado "m". PowerShell dentro de .cmd cabe em uma linha ou em
#     arquivo proprio; no meio-termo, nao.
#
#  3. O filtro por linha de comando pegava 'expo' e 'ligar-expo' soltos, e
#     **matou o processo que estava chamando este script** — a linha de comando
#     dele mencionava os dois. Dai o EXCLUIR abaixo, que e a primeira coisa a
#     ser aplicada.
#
#  E o alvo principal nao e nome nenhum: e **quem esta na porta 8081**. O Metro
#  se apresenta como `node .../expo/bin/cli start --tunnel`, que nao casa com
#  "expo start" nem com "npx expo". Procurar pelo nome errava justamente o
#  processo que importa.
# ===========================================================================

# Qualquer processo cuja linha de comando mencione o proprio desligamento esta
# fora: e este script, ou quem o chamou.
$EXCLUIR = 'para-expo|desligar-expo'

function Mata($p, $rotulo) {
  if (-not $p) { return }
  if ($p.ProcessId -eq $PID) { return }
  if ($p.CommandLine -and $p.CommandLine -match $EXCLUIR) { return }
  Write-Output "  encerrando $rotulo (PID $($p.ProcessId))"
  Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}

$todos = Get-CimInstance Win32_Process |
  Where-Object { -not ($_.CommandLine -and $_.CommandLine -match $EXCLUIR) }

# 1. O laco primeiro. Ao contrario, ele veria o servidor cair e o subiria de
#    novo antes de ser encerrado.
foreach ($p in @($todos | Where-Object { $_.Name -eq 'cmd.exe' -and $_.CommandLine -match 'ligar-expo' })) {
  Mata $p 'o laco'
}
foreach ($p in @($todos | Where-Object { $_.Name -eq 'powershell.exe' -and $_.CommandLine -match 'anota-endereco' })) {
  Mata $p 'o anotador de endereco'
}

# 2. Quem estiver na porta 8081, seja qual for o nome.
$linha = netstat -ano | Select-String ':8081.*LISTENING' | Select-Object -First 1
if ($linha) {
  $donoPid = ($linha -split '\s+')[-1]
  Mata (Get-CimInstance Win32_Process -Filter "ProcessId=$donoPid") 'o Metro'
}

# 3. O tunel.
foreach ($p in @($todos | Where-Object { $_.Name -eq 'ngrok.exe' })) { Mata $p 'o tunel' }

Start-Sleep -Seconds 3

if (netstat -ano | Select-String ':8081.*LISTENING') {
  Write-Output 'ATENCAO: ainda ha algo escutando na porta 8081.'
  exit 1
}
Write-Output 'Pronto. O Expo Go esta desligado.'

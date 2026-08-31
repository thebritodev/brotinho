@echo off
rem ===========================================================================
rem  Sobe o servidor do Expo Go, com tunel, e o mantem de pe.
rem
rem  ATENCAO AO QUE NAO ESTA AQUI: nao ha CI=1.
rem
rem  O Expo encerra quando perde o terminal — foi o que derrubou o servidor
rem  duas vezes ao subir em segundo plano, sempre com codigo 4 e nenhum erro no
rem  log. A correcao obvia seria CI=1, que o poe em modo nao interativo. Mas CI
rem  tambem DESLIGA O WATCH MODE: "Metro is running in CI mode, reloads are
rem  disabled". Sem watch, editar codigo nao chega mais no celular, e o
rem  servidor de desenvolvimento deixa de servir para desenvolver.
rem
rem  A saida e dar a ele um console de verdade em vez de tira-lo do modo
rem  interativo. O atalho da pasta de inicializacao chama isto com
rem  `start /min cmd /c`, que abre um console minimizado com stdin aberto — o
rem  Expo fica de pe, interativo, e o watch continua funcionando.
rem
rem  O laco existe porque servidor de desenvolvimento morre: tunel que cai,
rem  maquina que dorme, ngrok que responde "remote gone away" quando ainda ha
rem  sessao anterior aberta (isso aconteceu duas vezes seguidas no primeiro
rem  teste, e a terceira subiu). Ele volta sozinho depois de 15 segundos, e
rem  cada volta fica anotada no log com hora.
rem
rem  Para desligar: scripts\desligar-expo.cmd
rem  Log: %TEMP%\brotinho-expo.log
rem ===========================================================================

cd /d "%~dp0.."

set "LOG=%TEMP%\brotinho-expo.log"
set "ENDERECO=%~dp0..\endereco-expo.txt"

echo. >> "%LOG%"
echo ===== ligado em %DATE% %TIME% ===== >> "%LOG%"

:laco

rem  Anota o endereco do tunel em endereco-expo.txt assim que ele subir. Roda em
rem  paralelo porque o `expo start` abaixo bloqueia ate cair.
start "" /b powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0anota-endereco.ps1"

call npx expo start --tunnel >> "%LOG%" 2>&1
echo ----- caiu em %DATE% %TIME%, subindo de novo em 15s ----- >> "%LOG%"
timeout /t 15 /nobreak > nul
goto laco

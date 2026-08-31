@echo off
rem ===========================================================================
rem  Desliga o servidor do Expo Go e o laco que o mantem de pe.
rem
rem  O trabalho de verdade esta em para-expo.ps1, junto do motivo de estar la e
rem  nao aqui. Este arquivo existe so para dar um duplo-clique.
rem
rem  Isto encerra a sessao de agora. Para o servidor parar de subir a cada boot,
rem  apague o atalho:
rem    %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\brotinho-expo.cmd
rem ===========================================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0para-expo.ps1"

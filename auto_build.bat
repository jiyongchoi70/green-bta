@echo off
chcp 65001 >nul
echo ========================================
echo 자동 빌드 시작
echo ========================================
echo.

python watch_and_build.py

pause

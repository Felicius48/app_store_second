@echo off
REM Скрипт запуска TechStore для Windows (CMD)
REM Использование: start.bat

echo.
echo ========================================
echo   TechStore - Скрипт запуска
echo ========================================
echo.

REM Проверка Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Node.js не установлен!
    echo Пожалуйста, установите Node.js 16+ с https://nodejs.org
    pause
    exit /b 1
)

REM Проверка npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] npm не установлен!
    pause
    exit /b 1
)

echo [OK] Node.js и npm установлены
echo.

REM Получение директории скрипта
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Проверка и создание .env
if not exist "backend\.env" (
    if exist "backend\env.example" (
        copy "backend\env.example" "backend\.env" >nul
        echo [OK] Файл .env создан
    ) else (
        echo [ПРЕДУПРЕЖДЕНИЕ] Файл env.example не найден
    )
)

REM Установка зависимостей backend
echo.
echo [1/4] Установка зависимостей backend...
cd backend
if not exist "node_modules" (
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ОШИБКА] Не удалось установить зависимости backend
        pause
        exit /b 1
    )
)

REM Установка зависимостей frontend
echo.
echo [2/4] Установка зависимостей frontend...
cd ..\frontend
if not exist "node_modules" (
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ОШИБКА] Не удалось установить зависимости frontend
        pause
        exit /b 1
    )
)

REM Инициализация базы данных
echo.
echo [3/4] Инициализация базы данных...
cd ..\backend
call npm run init-db
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Не удалось инициализировать базу данных
    pause
    exit /b 1
)

echo.
echo [4/4] Запуск серверов...
echo.

REM Запуск backend
echo [ЗАПУСК] Backend сервер...
start "TechStore Backend" cmd /k "cd /d %CD% && npm start"

REM Ожидание
timeout /t 3 /nobreak >nul

REM Запуск frontend
echo [ЗАПУСК] Frontend сервер...
cd ..\frontend
set PORT=3001

REM Проверка наличия react-scripts
if not exist "node_modules\.bin\react-scripts.cmd" (
    echo [УСТАНОВКА] Переустановка зависимостей frontend...
    call npm install
)

start "TechStore Frontend" cmd /k "cd /d %CD% && set PORT=3001 && npm start"

REM Ожидание
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   Серверы запущены!
echo ========================================
echo.
echo Frontend: http://localhost:3001
echo Backend:  http://localhost:5001
echo.
echo Тестовый админ:
echo   Email:    admin@example.com
echo   Пароль:   admin123
echo.
echo Для остановки закройте окна серверов
echo или нажмите Ctrl+C в каждом окне
echo.
echo ========================================
echo.

REM Открытие браузера через 10 секунд
timeout /t 10 /nobreak >nul
start http://localhost:3001

pause

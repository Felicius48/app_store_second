#!/bin/bash

echo "🚀 Запуск TechStore..."

set -o pipefail

# Получение директории скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js 16+"
    exit 1
fi

# Проверка наличия npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен. Пожалуйста, установите npm"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo ""

# Проверка и создание .env файла
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
        echo "✅ Файл .env создан из env.example"
    else
        echo "⚠️  Файл env.example не найден. Создайте .env вручную."
    fi
else
    echo "✅ Файл .env уже существует"
fi

echo ""

install_deps() {
    local target="$1"
    local name="$2"
    echo "📦 Установка зависимостей ${name}..."
    cd "$SCRIPT_DIR/$target"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
            echo "❌ Ошибка установки зависимостей ${name}"
        exit 1
    fi
        echo "✅ Зависимости ${name} установлены"
else
        echo "✅ Зависимости ${name} уже установлены"
fi
}

install_deps "backend" "backend"
install_deps "frontend" "frontend"

echo ""

# Миграции базы данных
echo "🗄️  Применение миграций..."
cd "$SCRIPT_DIR/backend"
npm run migrate
if [ $? -ne 0 ]; then
    echo "❌ Ошибка миграций базы данных"
        exit 1
fi
echo "✅ Миграции применены"
echo ""

# Инициализация базы данных выполняется вручную (если нужно заполнить демо-данные)
echo "ℹ️  Для заполнения демо-данных: cd backend && npm run init-db"
echo ""
echo "✅ Подготовка завершена!"
echo ""
echo "🔥 Запуск серверов..."
echo ""

# Функция для остановки серверов
cleanup() {
    echo ""
    echo "🛑 Остановка серверов..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo "✅ Серверы остановлены"
    exit 0
}

# Обработка Ctrl+C
trap cleanup SIGINT SIGTERM

echo "🚀 Запуск backend сервера..."
cd "$SCRIPT_DIR/backend"
npm start > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Ожидание запуска backend
sleep 3

# Проверка, что backend запустился
for i in {1..12}; do
    if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        echo "✅ Backend сервер запущен на http://localhost:5001"
        break
    fi
    sleep 1
done

# Запуск frontend в фоне
echo "🚀 Запуск frontend сервера..."
cd "$SCRIPT_DIR/frontend"
chmod -R +x node_modules/.bin >/dev/null 2>&1
export PATH="$(pwd)/node_modules/.bin:$PATH"
PORT=3001 npm start > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Ожидание запуска frontend
sleep 6

echo ""
echo "✅ Серверы запущены!"
echo ""
echo "═══════════════════════════════════════"
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend:  http://localhost:5001"
echo ""
echo "👤 Тестовый админ:"
echo "   Email:    admin@example.com"
echo "   Пароль:   admin123"
echo ""
echo "📦 В каталоге доступны тестовые товары"
echo ""
echo "🛑 Для остановки серверов нажмите Ctrl+C"
echo "═══════════════════════════════════════"
echo ""

# Открытие браузера (опционально, для macOS и Linux)
if command -v xdg-open &> /dev/null; then
    (sleep 10 && xdg-open http://localhost:3001) &
elif command -v open &> /dev/null; then
    (sleep 10 && open http://localhost:3001) &
fi

# Ожидание завершения
wait $BACKEND_PID $FRONTEND_PID
# 🔧 Устранение неполадок

## Проблема: "react-scripts не является внутренней или внешней командой"

### Причина
Зависимости frontend не установлены или установлены некорректно.

### Решение

#### Вариант 1: Автоматическое исправление (рекомендуется)
Просто запустите скрипт запуска заново - он автоматически проверит и переустановит зависимости:

**Windows PowerShell:**
```powershell
.\start.ps1
```

**Windows CMD:**
```cmd
start.bat
```

**Linux / macOS:**
```bash
./start.sh
```

#### Вариант 2: Ручное исправление

**Windows PowerShell:**
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
cd ..
```

**Windows CMD:**
```cmd
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
cd ..
```

**Linux / macOS:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
cd ..
```

После этого запустите проект снова.

## Проблема: Порт уже занят

### Windows
```powershell
# Найти процесс на порту 5001
netstat -ano | findstr ":5001"

# Найти процесс на порту 3001
netstat -ano | findstr ":3001"

# Завершить процесс (замените PID на номер процесса)
taskkill /PID <PID> /F
```

### Linux / macOS
```bash
# Найти процесс на порту
lsof -ti:5001
lsof -ti:3001

# Завершить процесс
kill -9 <PID>
```

## Проблема: База данных повреждена

```bash
cd backend
rm database.db database.sqlite
npm run init-db
```

## Проблема: Модуль sqlite3 не работает (Windows)

```powershell
cd backend
npm uninstall sqlite3
npm install sqlite3
```

## Проблема: Node.js не найден

1. Убедитесь, что Node.js установлен:
   ```powershell
   node --version
   npm --version
   ```

2. Если не установлен, скачайте с https://nodejs.org (версия 16 или выше)

3. После установки перезапустите терминал

## Проблема: Ошибки компиляции React

1. Очистите кэш:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

2. Если проблема сохраняется, попробуйте удалить `.cache`:
   ```bash
   cd frontend
   rm -rf node_modules/.cache
   ```

## Проблема: CORS ошибки

Убедитесь, что:
1. Backend запущен на порту 5001
2. Frontend запущен на порту 3001
3. В файле `backend/.env` указан правильный `FRONTEND_URL=http://localhost:3001`

## Полная переустановка проекта

Если ничего не помогает, выполните полную переустановку:

```powershell
# Windows PowerShell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules, package-lock.json, database.db, database.sqlite
npm install
npm run init-db

# Frontend
cd ../frontend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

```bash
# Linux / macOS
# Backend
cd backend
rm -rf node_modules package-lock.json database.db database.sqlite
npm install
npm run init-db

# Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

## Получение помощи

Если проблема не решена:
1. Проверьте логи серверов в терминале
2. Убедитесь, что используете Node.js версии 16 или выше
3. Проверьте, что все зависимости установлены корректно
4. Попробуйте запустить серверы вручную для более детальных ошибок

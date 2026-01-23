# Инструкция по запуску проекта

## Проблема с start.ps1

Если при запуске `.\start.ps1` возникает ошибка парсинга PowerShell, используйте альтернативные способы запуска:

## Способ 1: Использовать start.bat (рекомендуется)

```cmd
start.bat
```

Этот скрипт работает через командную строку Windows и не имеет проблем с кодировкой.

## Способ 2: Ручной запуск

### Терминал 1 - Backend:
```powershell
cd backend
npm install
npm run init-db
npm start
```

### Терминал 2 - Frontend:
```powershell
cd frontend
npm install
$env:PORT="3001"
npm start
```

## Способ 3: Исправить кодировку start.ps1

Если хотите использовать PowerShell скрипт:

1. Откройте `start.ps1` в редакторе (VS Code, Notepad++)
2. Сохраните файл с кодировкой **UTF-8 with BOM** или **UTF-8**
3. Убедитесь, что в файле нет проблемных символов

Или используйте команду:
```powershell
$content = Get-Content start.ps1 -Raw
[System.IO.File]::WriteAllText("start.ps1", $content, [System.Text.UTF8Encoding]::new($true))
```

## После запуска

- Frontend: http://localhost:3001
- Backend: http://localhost:5001
- Админ: admin@example.com / admin123

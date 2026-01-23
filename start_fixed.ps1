# РЎРєСЂРёРїС‚ Р·Р°РїСѓСЃРєР° TechStore РґР»СЏ Windows
# РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ: .\start.ps1

Write-Host "рџљЂ Р—Р°РїСѓСЃРє TechStore..." -ForegroundColor Cyan
Write-Host ""

# РџСЂРѕРІРµСЂРєР° РЅР°Р»РёС‡РёСЏ Node.js
Write-Host "рџ”Ќ РџСЂРѕРІРµСЂРєР° Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "вњ… Node.js СѓСЃС‚Р°РЅРѕРІР»РµРЅ: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "вќЊ Node.js РЅРµ СѓСЃС‚Р°РЅРѕРІР»РµРЅ. РџРѕР¶Р°Р»СѓР№СЃС‚Р°, СѓСЃС‚Р°РЅРѕРІРёС‚Рµ Node.js 16+" -ForegroundColor Red
    exit 1
}

# РџСЂРѕРІРµСЂРєР° РЅР°Р»РёС‡РёСЏ npm
Write-Host "рџ”Ќ РџСЂРѕРІРµСЂРєР° npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "вњ… npm СѓСЃС‚Р°РЅРѕРІР»РµРЅ: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "вќЊ npm РЅРµ СѓСЃС‚Р°РЅРѕРІР»РµРЅ. РџРѕР¶Р°Р»СѓР№СЃС‚Р°, СѓСЃС‚Р°РЅРѕРІРёС‚Рµ npm" -ForegroundColor Red
    exit 1
}

Write-Host ""

# РџРµСЂРµС…РѕРґ РІ РґРёСЂРµРєС‚РѕСЂРёСЋ РїСЂРѕРµРєС‚Р°
# РџРѕР»СѓС‡Р°РµРј РїСѓС‚СЊ Рє СЃРєСЂРёРїС‚Сѓ Р±РѕР»РµРµ РЅР°РґРµР¶РЅС‹Рј СЃРїРѕСЃРѕР±РѕРј
if ($PSScriptRoot) {
    $scriptPath = $PSScriptRoot
} elseif ($MyInvocation.MyCommand.Path) {
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
} else {
    # РСЃРїРѕР»СЊР·СѓРµРј С‚РµРєСѓС‰СѓСЋ РґРёСЂРµРєС‚РѕСЂРёСЋ РєР°Рє fallback
    $scriptPath = (Get-Location).Path
}

# РќРѕСЂРјР°Р»РёР·СѓРµРј РїСѓС‚СЊ
if ($scriptPath) {
    $scriptPath = [System.IO.Path]::GetFullPath($scriptPath)
    Set-Location $scriptPath
    Write-Host "рџ“Ѓ Р Р°Р±РѕС‡Р°СЏ РґРёСЂРµРєС‚РѕСЂРёСЏ: $scriptPath" -ForegroundColor Gray
} else {
    Write-Host "вќЊ РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ РґРёСЂРµРєС‚РѕСЂРёСЋ СЃРєСЂРёРїС‚Р°" -ForegroundColor Red
    exit 1
}

# РџСЂРѕРІРµСЂРєР° Рё СЃРѕР·РґР°РЅРёРµ .env С„Р°Р№Р»Р°
Write-Host "рџ“ќ РџСЂРѕРІРµСЂРєР° С„Р°Р№Р»Р° .env..." -ForegroundColor Yellow

# РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ scriptPath РѕРїСЂРµРґРµР»РµРЅ
if (-not $scriptPath) {
    Write-Host "вќЊ РћС€РёР±РєР°: РЅРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ РїСѓС‚СЊ Рє СЃРєСЂРёРїС‚Сѓ" -ForegroundColor Red
    exit 1
}

$envPath = Join-Path $scriptPath "backend\.env"
$envExamplePath = Join-Path $scriptPath "backend\env.example"

if (-not (Test-Path $envPath)) {
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        Write-Host "вњ… Р¤Р°Р№Р» .env СЃРѕР·РґР°РЅ РёР· env.example" -ForegroundColor Green
    } else {
        Write-Host "вљ пёЏ  Р¤Р°Р№Р» env.example РЅРµ РЅР°Р№РґРµРЅ. РЎРѕР·РґР°Р№С‚Рµ .env РІСЂСѓС‡РЅСѓСЋ." -ForegroundColor Yellow
    }
} else {
    Write-Host "вњ… Р¤Р°Р№Р» .env СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚" -ForegroundColor Green
}

Write-Host ""

# РЈСЃС‚Р°РЅРѕРІРєР° Р·Р°РІРёСЃРёРјРѕСЃС‚РµР№ backend
Write-Host "рџ“¦ РЈСЃС‚Р°РЅРѕРІРєР° Р·Р°РІРёСЃРёРјРѕСЃС‚РµР№ backend..." -ForegroundColor Yellow
$backendPath = Join-Path $scriptPath "backend"

# РџСЂРѕРІРµСЂСЏРµРј СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ РґРёСЂРµРєС‚РѕСЂРёРё backend
if (-not (Test-Path $backendPath)) {
    Write-Host "вќЊ Р”РёСЂРµРєС‚РѕСЂРёСЏ backend РЅРµ РЅР°Р№РґРµРЅР°: $backendPath" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath

if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "вќЊ РћС€РёР±РєР° СѓСЃС‚Р°РЅРѕРІРєРё Р·Р°РІРёСЃРёРјРѕСЃС‚РµР№ backend" -ForegroundColor Red
        exit 1
    }
    Write-Host "вњ… Р—Р°РІРёСЃРёРјРѕСЃС‚Рё backend СѓСЃС‚Р°РЅРѕРІР»РµРЅС‹" -ForegroundColor Green
} else {
    Write-Host "вњ… Р—Р°РІРёСЃРёРјРѕСЃС‚Рё backend СѓР¶Рµ СѓСЃС‚Р°РЅРѕРІР»РµРЅС‹" -ForegroundColor Green
}

Write-Host ""

# РЈСЃС‚Р°РЅРѕРІРєР° Р·Р°РІРёСЃРёРјРѕСЃС‚РµР№ frontend
Write-Host "рџ“¦ РЈСЃС‚Р°РЅРѕРІРєР° Р·Р°РІРёСЃРёРјРѕСЃС‚РµР№ frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $scriptPath "frontend"

# РџСЂРѕРІРµСЂСЏРµРј СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ РґРёСЂРµРєС‚РѕСЂРёРё frontend
if (-not (Test-Path $frontendPath)) {
    Write-Host "вќЊ Р”РёСЂРµРєС‚РѕСЂРёСЏ frontend РЅРµ РЅР°Р№РґРµРЅР°: $frontendPath" -ForegroundColor Red
    exit 1
}

Set-Location $frontendPath

if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "вќЊ РћС€РёР±РєР° СѓСЃС‚Р°РЅРѕРІРєРё Р·Р°РІРёСЃРёРјРѕСЃС‚РµР№ frontend" -ForegroundColor Red
        exit 1
    }
    Write-Host "вњ… Р—Р°РІРёСЃРёРјРѕСЃС‚Рё frontend СѓСЃС‚Р°РЅРѕРІР»РµРЅС‹" -ForegroundColor Green
} else {
    Write-Host "вњ… Р—Р°РІРёСЃРёРјРѕСЃС‚Рё frontend СѓР¶Рµ СѓСЃС‚Р°РЅРѕРІР»РµРЅС‹" -ForegroundColor Green
    # РџСЂРѕРІРµСЂСЏРµРј РЅР°Р»РёС‡РёРµ react-scripts
    if (-not (Test-Path "node_modules\.bin\react-scripts.cmd") -and -not (Test-Path "node_modules\.bin\react-scripts")) {
        Write-Host "вљ пёЏ  react-scripts РЅРµ РЅР°Р№РґРµРЅ, РїРµСЂРµСѓСЃС‚Р°РЅР°РІР»РёРІР°РµРј..." -ForegroundColor Yellow
        npm install
    }
}

Write-Host ""

# РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ Р±Р°Р·С‹ РґР°РЅРЅС‹С…
Write-Host "рџ—„пёЏ  РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ Р±Р°Р·С‹ РґР°РЅРЅС‹С…..." -ForegroundColor Yellow
Set-Location $backendPath
npm run init-db
if ($LASTEXITCODE -ne 0) {
    Write-Host "вќЊ РћС€РёР±РєР° РёРЅРёС†РёР°Р»РёР·Р°С†РёРё Р±Р°Р·С‹ РґР°РЅРЅС‹С…" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "вњ… РџРѕРґРіРѕС‚РѕРІРєР° Р·Р°РІРµСЂС€РµРЅР°!" -ForegroundColor Green
Write-Host ""
Write-Host "рџ”Ґ Р—Р°РїСѓСЃРє СЃРµСЂРІРµСЂРѕРІ..." -ForegroundColor Cyan
Write-Host ""

# Р¤СѓРЅРєС†РёСЏ РґР»СЏ РѕСЃС‚Р°РЅРѕРІРєРё СЃРµСЂРІРµСЂРѕРІ
function Stop-Servers {
    Write-Host ""
    Write-Host "рџ›‘ РћСЃС‚Р°РЅРѕРІРєР° СЃРµСЂРІРµСЂРѕРІ..." -ForegroundColor Yellow
    
    # РћСЃС‚Р°РЅРѕРІРєР° РїСЂРѕС†РµСЃСЃРѕРІ РїРѕ СЃРѕС…СЂР°РЅС‘РЅРЅС‹Рј ID
    if ($script:backendProcessId) {
        try {
            Stop-Process -Id $script:backendProcessId -Force -ErrorAction SilentlyContinue
            Write-Host "вњ… Backend СЃРµСЂРІРµСЂ РѕСЃС‚Р°РЅРѕРІР»РµРЅ" -ForegroundColor Green
        } catch {
            # РџСЂРѕС†РµСЃСЃ СѓР¶Рµ Р·Р°РІРµСЂС€С‘РЅ
        }
    }
    
    if ($script:frontendProcessId) {
        try {
            Stop-Process -Id $script:frontendProcessId -Force -ErrorAction SilentlyContinue
            Write-Host "вњ… Frontend СЃРµСЂРІРµСЂ РѕСЃС‚Р°РЅРѕРІР»РµРЅ" -ForegroundColor Green
        } catch {
            # РџСЂРѕС†РµСЃСЃ СѓР¶Рµ Р·Р°РІРµСЂС€С‘РЅ
        }
    }
    
    # Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅР°СЏ РѕС‡РёСЃС‚РєР°: РїРѕРёСЃРє РїСЂРѕС†РµСЃСЃРѕРІ Node.js РЅР° РїРѕСЂС‚Р°С…
    $backendPortProcess = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | 
        Select-Object -ExpandProperty OwningProcess -Unique
    $frontendPortProcess = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | 
        Select-Object -ExpandProperty OwningProcess -Unique
    
    if ($backendPortProcess) {
        Stop-Process -Id $backendPortProcess -Force -ErrorAction SilentlyContinue
    }
    
    if ($frontendPortProcess) {
        Stop-Process -Id $frontendPortProcess -Force -ErrorAction SilentlyContinue
    }
}

# РћР±СЂР°Р±РѕС‚РєР° Ctrl+C
[Console]::TreatControlCAsInput = $false
$null = Register-EngineEvent PowerShell.Exiting -Action { Stop-Servers }

# Р—Р°РїСѓСЃРє backend СЃРµСЂРІРµСЂР°
Write-Host "рџљЂ Р—Р°РїСѓСЃРє backend СЃРµСЂРІРµСЂР°..." -ForegroundColor Yellow
Set-Location $backendPath

# РџРѕР»СѓС‡Р°РµРј РїСѓС‚СЊ Рє npm
$npmPath = (Get-Command npm).Source

# Р—Р°РїСѓСЃРє РІ РѕС‚РґРµР»СЊРЅРѕРј РѕРєРЅРµ PowerShell СЃ СЏРІРЅРѕР№ СЂР°Р±РѕС‡РµР№ РґРёСЂРµРєС‚РѕСЂРёРµР№
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; & '$npmPath' start" -PassThru -WindowStyle Normal -WorkingDirectory $backendPath

# РћР¶РёРґР°РЅРёРµ Р·Р°РїСѓСЃРєР° backend
Start-Sleep -Seconds 3

# РџСЂРѕРІРµСЂРєР°, С‡С‚Рѕ backend Р·Р°РїСѓСЃС‚РёР»СЃСЏ
$backendRunning = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendRunning = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if ($backendRunning) {
    Write-Host "вњ… Backend СЃРµСЂРІРµСЂ Р·Р°РїСѓС‰РµРЅ РЅР° http://localhost:5001" -ForegroundColor Green
} else {
    Write-Host "вљ пёЏ  Backend СЃРµСЂРІРµСЂ Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ..." -ForegroundColor Yellow
}

Write-Host ""

# Р—Р°РїСѓСЃРє frontend СЃРµСЂРІРµСЂР°
Write-Host "рџљЂ Р—Р°РїСѓСЃРє frontend СЃРµСЂРІРµСЂР°..." -ForegroundColor Yellow
Set-Location $frontendPath

# РџСЂРѕРІРµСЂРєР° РЅР°Р»РёС‡РёСЏ react-scripts
if (-not (Test-Path "node_modules\.bin\react-scripts.cmd")) {
    Write-Host "вљ пёЏ  react-scripts РЅРµ РЅР°Р№РґРµРЅ, РїРµСЂРµСѓСЃС‚Р°РЅР°РІР»РёРІР°РµРј Р·Р°РІРёСЃРёРјРѕСЃС‚Рё..." -ForegroundColor Yellow
    npm install
}

# Р—Р°РїСѓСЃРє РІ РѕС‚РґРµР»СЊРЅРѕРј РѕРєРЅРµ PowerShell
# РСЃРїРѕР»СЊР·СѓРµРј РїРѕР»РЅС‹Р№ РїСѓС‚СЊ Рє npm Рё СЏРІРЅРѕ СѓРєР°Р·С‹РІР°РµРј СЂР°Р±РѕС‡СѓСЋ РґРёСЂРµРєС‚РѕСЂРёСЋ
$npmPath = (Get-Command npm).Source
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; `$env:PORT='3001'; & '$npmPath' start" -PassThru -WindowStyle Normal -WorkingDirectory $frontendPath

# РћР¶РёРґР°РЅРёРµ Р·Р°РїСѓСЃРєР° frontend
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "вњ… РЎРµСЂРІРµСЂС‹ Р·Р°РїСѓС‰РµРЅС‹!" -ForegroundColor Green
Write-Host ""
Write-Host "в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ" -ForegroundColor Cyan
Write-Host "рџЊђ Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "рџ”§ Backend:  http://localhost:5001" -ForegroundColor White
Write-Host ""
Write-Host "рџ‘¤ РўРµСЃС‚РѕРІС‹Р№ Р°РґРјРёРЅ:" -ForegroundColor Yellow
Write-Host "   Email:    admin@example.com" -ForegroundColor White
Write-Host "   РџР°СЂРѕР»СЊ:   admin123" -ForegroundColor White
Write-Host ""
Write-Host "рџ“¦ Р’ РєР°С‚Р°Р»РѕРіРµ РґРѕСЃС‚СѓРїРЅС‹ С‚РµСЃС‚РѕРІС‹Рµ С‚РѕРІР°СЂС‹" -ForegroundColor Yellow
Write-Host ""
Write-Host "рџ›‘ Р”Р»СЏ РѕСЃС‚Р°РЅРѕРІРєРё СЃРµСЂРІРµСЂРѕРІ Р·Р°РєСЂРѕР№С‚Рµ РѕРєРЅР°" -ForegroundColor Red
Write-Host "   РёР»Рё РЅР°Р¶РјРёС‚Рµ Ctrl+C РІ РєР°Р¶РґРѕРј РѕРєРЅРµ" -ForegroundColor Red
Write-Host "в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ" -ForegroundColor Cyan
Write-Host ""

# РћС‚РєСЂС‹С‚РёРµ Р±СЂР°СѓР·РµСЂР° С‡РµСЂРµР· 10 СЃРµРєСѓРЅРґ
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 10
    Start-Process "http://localhost:3001"
} | Out-Null

# РЎРѕС…СЂР°РЅРµРЅРёРµ ID РїСЂРѕС†РµСЃСЃРѕРІ РґР»СЏ С„СѓРЅРєС†РёРё РѕС‡РёСЃС‚РєРё
$script:backendProcessId = $backendProcess.Id
$script:frontendProcessId = $frontendProcess.Id

# РћР¶РёРґР°РЅРёРµ Р·Р°РІРµСЂС€РµРЅРёСЏ РёР»Рё Ctrl+C
Write-Host "РќР°Р¶РјРёС‚Рµ Р»СЋР±СѓСЋ РєР»Р°РІРёС€Сѓ РґР»СЏ РѕСЃС‚Р°РЅРѕРІРєРё СЃРµСЂРІРµСЂРѕРІ..." -ForegroundColor Gray
try {
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} catch {
    # Р•СЃР»Рё ReadKey РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ, РїСЂРѕСЃС‚Рѕ Р¶РґС‘Рј
    Write-Host "РћР¶РёРґР°РЅРёРµ Р·Р°РІРµСЂС€РµРЅРёСЏ СЂР°Р±РѕС‚С‹ СЃРµСЂРІРµСЂРѕРІ..." -ForegroundColor Gray
    while ($true) {
        Start-Sleep -Seconds 5
        
        # РџСЂРѕРІРµСЂРєР°, С‡С‚Рѕ РїСЂРѕС†РµСЃСЃС‹ РµС‰С‘ СЂР°Р±РѕС‚Р°СЋС‚
        $backendAlive = Get-Process -Id $script:backendProcessId -ErrorAction SilentlyContinue
        $frontendAlive = Get-Process -Id $script:frontendProcessId -ErrorAction SilentlyContinue
        
        if (-not $backendAlive -and -not $frontendAlive) {
            Write-Host ""
            Write-Host "вљ пёЏ  РЎРµСЂРІРµСЂС‹ РѕСЃС‚Р°РЅРѕРІР»РµРЅС‹" -ForegroundColor Yellow
            break
        }
    }
} finally {
    Stop-Servers
}

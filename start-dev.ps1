# Sri Venkateswara Boys Hostel Management System - Dev Launcher
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   Sri Venkateswara Boys Hostel Management System" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

$RootPath = $PSScriptRoot

# Pre-flight: Check and release lingering processes on ports 8081 & 5173
function Clear-Port($port) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($c in $conns) {
                if ($c.OwningProcess -and $c.OwningProcess -ne 0 -and $c.OwningProcess -ne $PID) {
                    Write-Host "Releasing port $port (closing previous process PID $($c.OwningProcess))..." -ForegroundColor Yellow
                    Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
                }
            }
            Start-Sleep -Seconds 1
        }
    } catch {
        # ignore if port is already free
    }
}

Clear-Port 8081
Clear-Port 5173

# 1. Start Backend in a dedicated PowerShell window
Write-Host "[1/2] Launching Backend (Spring Boot on port 8081)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootPath\backend'; Write-Host '>>> SVBH Backend Server (Port 8081) <<<' -ForegroundColor Cyan; powershell -ExecutionPolicy Bypass -File .\mvn.ps1 spring-boot:run"

# Wait a brief moment for backend to initialize
Start-Sleep -Seconds 3

# 2. Start Frontend in a dedicated PowerShell window
Write-Host "[2/2] Launching Frontend (Vite on port 5173)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootPath\frontend'; Write-Host '>>> SVBH Frontend Server (Port 5173) <<<' -ForegroundColor Magenta; npm run dev"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Both services are launching in dedicated terminal windows:" -ForegroundColor Green
Write-Host "  Backend API:  http://localhost:8081" -ForegroundColor Cyan
Write-Host "  Frontend App: http://localhost:5173" -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Green


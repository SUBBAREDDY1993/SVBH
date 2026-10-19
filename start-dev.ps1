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

# Detect active Wi-Fi / LAN IP for mobile testing
$LanIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*","Wireless*","Ethernet*" -ErrorAction SilentlyContinue |
          Where-Object { $_.IPAddress -notmatch '^169\.254' -and $_.IPAddress -notmatch '^127\.' } |
          Select-Object -First 1).IPAddress
if (-not $LanIp) { $LanIp = "localhost" }

# Check if pre-packaged JAR exists for fast startup (<4s) vs Maven compile (~20s)
$JarPath = Join-Path $RootPath "backend\target\hostel-management-backend-1.0.0.jar"
$BackendCommand = ""
if (Test-Path $JarPath) {
    Write-Host "[1/2] Launching Backend using pre-compiled JAR (fast boot)..." -ForegroundColor Cyan
    $BackendCommand = "cd '$RootPath\backend'; Write-Host '>>> SVBH Backend Server (Port 8081) <<<' -ForegroundColor Cyan; java -jar target\hostel-management-backend-1.0.0.jar"
} else {
    Write-Host "[1/2] Launching Backend using Maven..." -ForegroundColor Cyan
    $BackendCommand = "cd '$RootPath\backend'; Write-Host '>>> SVBH Backend Server (Port 8081) <<<' -ForegroundColor Cyan; powershell -ExecutionPolicy Bypass -File .\mvn.ps1 spring-boot:run"
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCommand

# Wait for Spring Boot to be healthy and listening on port 8081 before launching frontend
Write-Host "Waiting for Spring Boot backend to become ready on http://localhost:8081/api ..." -ForegroundColor Yellow
$BackendReady = $false
for ($i = 1; $i -le 40; $i++) {
    Start-Sleep -Seconds 1
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:8081/api" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($res -and $res.StatusCode -eq 200) {
            $BackendReady = $true
            break
        }
    } catch {
        # still booting
    }
    Write-Host -NoNewline "."
}
Write-Host ""

if ($BackendReady) {
    Write-Host ">>> Backend is ONLINE and healthy on port 8081! <<<" -ForegroundColor Green
} else {
    Write-Host ">>> Warning: Backend is taking longer than expected to initialize. Launching frontend now... <<<" -ForegroundColor Yellow
}

# 2. Start Frontend in a dedicated PowerShell window
Write-Host "[2/2] Launching Frontend (Vite on port 5173)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootPath\frontend'; Write-Host '>>> SVBH Frontend Server (Port 5173) <<<' -ForegroundColor Magenta; npm run dev"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "SVBH Application is Live and Ready:" -ForegroundColor Green
Write-Host "  Laptop Browser:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Mobile Phone:    http://${LanIp}:5173" -ForegroundColor Yellow
Write-Host "  Backend API:     http://localhost:8081/api" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green


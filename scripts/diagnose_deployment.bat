@echo off
echo ========================================
echo MES Deployment Diagnostic Tool
echo ========================================
echo.

echo [1] Checking system information...
echo OS: Windows
echo Date: %date% %time%
echo Current directory: %cd%
echo.

echo [2] Checking for Docker installation...
where docker >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker is installed
    docker --version
) else (
    echo ✗ Docker is NOT installed or not in PATH
    echo   Check if Docker Desktop is installed
    echo   Docker Desktop download: https://www.docker.com/products/docker-desktop/
)
echo.

echo [3] Checking for Docker Compose...
where docker-compose >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker Compose is installed
    docker-compose --version
) else (
    where docker-compose.exe >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ Docker Compose is installed (as docker-compose.exe)
        docker-compose.exe --version
    ) else (
        echo ✗ Docker Compose is NOT installed
        echo   Docker Compose is included with Docker Desktop
    )
)
echo.

echo [4] Checking Docker service status...
powershell -Command "Get-Service *docker* -ErrorAction SilentlyContinue | Format-Table -AutoSize" 2>nul
echo.

echo [5] Checking if Docker is running...
tasklist /FI "IMAGENAME eq dockerd.exe" /FO TABLE /NH >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker daemon is running
) else (
    echo ✗ Docker daemon is NOT running
    echo   Start Docker Desktop from Start Menu
)
echo.

echo [6] Checking running containers...
docker ps 2>nul
if %errorlevel% neq 0 (
    echo ✗ Cannot list containers (Docker may not be running)
)
echo.

echo [7] Checking port availability (localhost:8000)...
netstat -an | findstr ":8000" >nul
if %errorlevel% equ 0 (
    echo ✓ Port 8000 is in use
    netstat -an | findstr ":8000"
) else (
    echo ✗ Port 8000 is NOT in use
)
echo.

echo [8] Checking port availability (localhost:80)...
netstat -an | findstr ":80 " >nul
if %errorlevel% equ 0 (
    echo ✓ Port 80 is in use
    netstat -an | findstr ":80 "
) else (
    echo ✗ Port 80 is NOT in use
)
echo.

echo [9] Testing backend connectivity...
echo Testing http://localhost:8000/health...
powershell -Command "$response = Invoke-WebRequest -Uri 'http://localhost:8000/health' -TimeoutSec 5 -ErrorAction SilentlyContinue; if ($response) { '✓ Backend health check OK: ' + $response.Content } else { '✗ Backend not responding' }" 2>nul
if %errorlevel% neq 0 (
    echo ✗ Backend health check failed
)
echo.

echo [10] Testing frontend connectivity...
echo Testing http://localhost...
powershell -Command "$response = Invoke-WebRequest -Uri 'http://localhost' -TimeoutSec 5 -ErrorAction SilentlyContinue; if ($response) { '✓ Frontend is responding (Status: ' + $response.StatusCode + ')' } else { '✗ Frontend not responding' }" 2>nul
if %errorlevel% neq 0 (
    echo ✗ Frontend health check failed
)
echo.

echo [11] Checking project structure...
if exist "docker-compose.yml" (
    echo ✓ docker-compose.yml found
    echo   Project directory: %cd%
) else (
    echo ✗ docker-compose.yml not found in current directory
    echo   Please run this script from the project root directory
)
echo.

echo ========================================
echo DIAGNOSIS SUMMARY
echo ========================================

echo.
echo RECOMMENDED NEXT STEPS:
echo.

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo 1. INSTALL DOCKER DESKTOP
    echo    Download from: https://www.docker.com/products/docker-desktop/
    echo    Install and restart your computer
    echo.
)

tasklist /FI "IMAGENAME eq dockerd.exe" /FO TABLE /NH >nul 2>&1
if %errorlevel% neq 0 (
    echo 2. START DOCKER SERVICE
    echo    - Open Docker Desktop from Start Menu
    echo    - Wait for Docker to start (system tray icon shows "Docker is running")
    echo.
)

docker ps 2>nul | findstr "mes-backend" >nul
if %errorlevel% neq 0 (
    echo 3. START MES CONTAINERS
    echo    Run the following commands:
    echo    cd /d "%cd%"
    echo    docker-compose up -d
    echo.
)

netstat -an | findstr ":8000" >nul
if %errorlevel% neq 0 (
    echo 4. CHECK CONTAINER LOGS
    echo    If containers are running but ports not available:
    echo    docker-compose logs backend
    echo    docker-compose logs frontend
    echo.
)

echo 5. ALTERNATIVE: DEPLOYED ON REMOTE SERVER
echo    If you deployed to a remote server (not localhost):
echo    - Use the server's IP address instead of localhost
echo    - Check firewall/security group rules
echo    - Backend URL: http://<server-ip>:8000
echo    - Frontend URL: http://<server-ip>
echo.

echo ========================================
echo For more help, check the README.md file
echo ========================================
echo.
pause
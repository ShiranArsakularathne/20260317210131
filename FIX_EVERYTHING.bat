@echo off
echo ========================================
echo MES System - Complete Troubleshooting
echo ========================================
echo.
echo This script will help you resolve the most common issues:
echo   1. "docker-compose: command not found"
echo   2. "Failed to connect to localhost port 8000"
echo   3. Cannot login with admin/admin
echo.
echo Press Ctrl+C to cancel, or any key to continue...
pause >nul
echo.

echo [PHASE 1] Checking current system state...
echo.

echo [1.1] Operating System: Windows
echo.

echo [1.2] Checking Docker installation...
where docker >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker is installed
    docker --version
    set DOCKER_INSTALLED=1
) else (
    echo ✗ Docker is NOT installed
    set DOCKER_INSTALLED=0
)
echo.

if "%DOCKER_INSTALLED%"=="0" (
    echo ========================================
    echo DOCKER NOT INSTALLED - ACTION REQUIRED
    echo ========================================
    echo.
    echo Based on your errors, Docker is not installed on this machine.
    echo.
    echo TWO POSSIBLE SCENARIOS:
    echo.
    echo SCENARIO A: You deployed MES to a REMOTE SERVER
    echo   - Your system is running on a cloud server, not this machine
    echo   - DO NOT use localhost
    echo   - Use the server's public IP address:
    echo       Frontend: http://<server-ip>
    echo       Backend:  http://<server-ip>:8000
    echo   - To find server IP: check deployment logs or cloud console
    echo.
    echo SCENARIO B: You want to run MES LOCALLY on this machine
    echo   - You need to install Docker Desktop
    echo   - Download: https://www.docker.com/products/docker-desktop/
    echo   - Install and restart computer
    echo   - Then run start.bat
    echo.
    echo For detailed Docker installation guide, see INSTALL_DOCKER.md
    echo.
    goto :end
)

echo [1.3] Checking Docker service status...
tasklist /FI "IMAGENAME eq dockerd.exe" /FO TABLE /NH >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker daemon is running
    set DOCKER_RUNNING=1
) else (
    echo ✗ Docker daemon is NOT running
    echo   Start Docker Desktop from Start Menu
    set DOCKER_RUNNING=0
)
echo.

if "%DOCKER_RUNNING%"=="0" (
    echo ========================================
    echo DOCKER NOT RUNNING - ACTION REQUIRED
    echo ========================================
    echo.
    echo 1. Open Docker Desktop from Start Menu
    echo 2. Wait for system tray icon to show "Docker is running"
    echo 3. Run this script again
    echo.
    goto :end
)

echo [1.4] Checking Docker Compose...
where docker-compose >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ docker-compose command is available
    docker-compose --version
    set COMPOSE_CMD=docker-compose
) else (
    where docker-compose.exe >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ docker-compose.exe is available
        docker-compose.exe --version
        set COMPOSE_CMD=docker-compose.exe
    ) else (
        echo Checking for Docker Compose plugin...
        docker compose version >nul 2>&1
        if %errorlevel% equ 0 (
            echo ✓ Docker Compose plugin is available
            docker compose version
            set COMPOSE_CMD=docker compose
        ) else (
            echo ✗ Docker Compose is NOT available
            echo   Docker Compose is included with Docker Desktop
            set COMPOSE_CMD=
        )
    )
)
echo.

if "%COMPOSE_CMD%"=="" (
    echo ========================================
    echo DOCKER COMPOSE NOT FOUND
    echo ========================================
    echo.
    echo Docker Compose should be included with Docker Desktop.
    echo.
    echo Try these solutions:
    echo 1. Restart Docker Desktop
    echo 2. In Docker Desktop Settings → General:
    echo    - Enable "Add docker-compose to PATH"
    echo 3. Restart your terminal/command prompt
    echo.
    echo Alternative: Use docker compose (without hyphen):
    echo   docker compose ps
    echo   docker compose up -d
    echo.
    goto :end
)

echo [PHASE 2] Checking MES deployment...
echo.

echo [2.1] Checking project structure...
if exist "docker-compose.yml" (
    echo ✓ docker-compose.yml found
    echo   Directory: %cd%
) else (
    echo ✗ docker-compose.yml not found
    echo   Run this script from the project root directory
    goto :end
)
echo.

echo [2.2] Checking running containers...
%COMPOSE_CMD% ps 2>nul | findstr "mes-" >nul
if %errorlevel% equ 0 (
    echo ✓ MES containers are running:
    %COMPOSE_CMD% ps
    set CONTAINERS_RUNNING=1
) else (
    echo ✗ MES containers are NOT running
    set CONTAINERS_RUNNING=0
)
echo.

if "%CONTAINERS_RUNNING%"=="0" (
    echo ========================================
    echo CONTAINERS NOT RUNNING - STARTING THEM
    echo ========================================
    echo.
    echo Starting MES containers...
    %COMPOSE_CMD% up -d
    echo.
    echo Waiting 10 seconds for containers to start...
    timeout /t 10 /nobreak >nul
    echo.
    %COMPOSE_CMD% ps
    echo.
)

echo [2.3] Checking port 8000 (backend)...
netstat -an | findstr ":8000" >nul
if %errorlevel% equ 0 (
    echo ✓ Port 8000 is in use (backend should be accessible)
) else (
    echo ✗ Port 8000 is NOT in use
    echo   Backend may not be running or port mapping failed
)
echo.

echo [2.4] Checking port 80 (frontend)...
netstat -an | findstr ":80 " >nul
if %errorlevel% equ 0 (
    echo ✓ Port 80 is in use (frontend should be accessible)
) else (
    echo ✗ Port 80 is NOT in use
    echo   Frontend may not be running or port mapping failed
)
echo.

echo [PHASE 3] Testing connectivity...
echo.

echo [3.1] Testing backend health...
echo Testing http://localhost:8000/health...
powershell -Command "$response = Invoke-WebRequest -Uri 'http://localhost:8000/health' -TimeoutSec 5 -ErrorAction SilentlyContinue; if ($response) { '✓ Backend health check OK: ' + $response.Content } else { '✗ Backend not responding' }" 2>nul
if %errorlevel% neq 0 (
    echo ✗ Backend health check failed
)
echo.

echo [3.2] Testing frontend...
echo Testing http://localhost...
powershell -Command "$response = Invoke-WebRequest -Uri 'http://localhost' -TimeoutSec 5 -ErrorAction SilentlyContinue; if ($response) { '✓ Frontend is responding (Status: ' + $response.StatusCode + ')' } else { '✗ Frontend not responding' }" 2>nul
if %errorlevel% neq 0 (
    echo ✗ Frontend health check failed
)
echo.

echo [PHASE 4] Creating admin user if needed...
echo.

echo Checking if admin user exists...
if exist "backend\create_admin.py" (
    echo Running admin creation script...
    python backend\create_admin.py
) else (
    echo Admin creation script not found in backend\
    echo Trying alternative method...
    if exist "scripts\create_admin_api.py" (
        echo Creating admin via API...
        python scripts\create_admin_api.py
    ) else (
        echo No admin creation script found
        echo Manual creation required
    )
)
echo.

echo [PHASE 5] Summary & Access Instructions
echo ========================================
echo.

if "%CONTAINERS_RUNNING%"=="1" (
    echo ✓ MES system appears to be running LOCALLY
    echo.
    echo ACCESS URLs:
    echo   Frontend:    http://localhost
    echo   Backend API: http://localhost:8000
    echo   API Docs:    http://localhost:8000/docs
    echo.
    echo LOGIN CREDENTIALS:
    echo   Username: admin
    echo   Password: admin
    echo   (Change password after first login!)
    echo.
    echo TROUBLESHOOTING:
    echo   If URLs don't work:
    echo   1. Check firewall settings
    echo   2. View logs: %COMPOSE_CMD% logs -f
    echo   3. Check container health: %COMPOSE_CMD% ps
) else (
    echo ⚠ MES system may not be running locally
    echo.
    echo POSSIBLE SCENARIOS:
    echo.
    echo 1. Deployed to REMOTE SERVER (most likely):
    echo    - DO NOT use localhost
    echo    - Use server's public IP address
    echo    - Frontend: http://<server-ip>
    echo    - Backend:  http://<server-ip>:8000
    echo    - Find IP in deployment logs or cloud console
    echo.
    echo 2. Local deployment issues:
    echo    - Check Docker Desktop is running
    echo    - Run start.bat
    echo    - Check logs: %COMPOSE_CMD% logs backend
)
echo.

:end
echo ========================================
echo ADDITIONAL RESOURCES
echo ========================================
echo.
echo 1. Quick Start Guide: QUICK_START.bat
echo 2. System Diagnostics: check_system.bat
echo 3. Docker Installation: INSTALL_DOCKER.md
echo 4. Full Solution: SOLUTION.md
echo 5. Project README: README.md
echo.
echo ========================================
echo If problems persist, check these files:
echo   - docker-compose logs: %COMPOSE_CMD% logs -f
echo   - Container status: %COMPOSE_CMD% ps
echo   - Windows firewall: Allow ports 80 and 8000
echo ========================================
echo.
pause
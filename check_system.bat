@echo off
echo ========================================
echo MES System Deployment Check
echo ========================================
echo.

echo [1] Checking operating system...
echo Windows detected.
echo.

echo [2] Checking Docker installation...
where docker >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker is installed
    docker --version
) else (
    echo ✗ Docker is NOT installed or not in PATH
    echo.
    echo ACTION REQUIRED: Install Docker Desktop
    echo   1. Download from: https://www.docker.com/products/docker-desktop/
    echo   2. Install and restart your computer
    echo   3. Start Docker Desktop from Start Menu
    echo.
    goto :summary
)
echo.

echo [3] Checking Docker service status...
tasklist /FI "IMAGENAME eq dockerd.exe" /FO TABLE /NH >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker daemon is running
) else (
    echo ✗ Docker daemon is NOT running
    echo   Start Docker Desktop from Start Menu
    echo.
    goto :summary
)
echo.

echo [4] Checking Docker Compose...
where docker-compose >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ docker-compose command is available
    docker-compose --version
) else (
    where docker-compose.exe >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ docker-compose.exe is available
        docker-compose.exe --version
    ) else (
        echo Checking for Docker Compose plugin...
        docker compose version >nul 2>&1
        if %errorlevel% equ 0 (
            echo ✓ Docker Compose plugin is available
            docker compose version
        ) else (
            echo ✗ Docker Compose is NOT available
            echo   Docker Compose is included with Docker Desktop
            echo   Ensure Docker Desktop is installed and running
            echo.
            goto :summary
        )
    )
)
echo.

echo [5] Checking project structure...
if exist "docker-compose.yml" (
    echo ✓ docker-compose.yml found
    echo   Project directory: %cd%
) else (
    echo ✗ docker-compose.yml not found
    echo   Please run this script from the project root directory
    goto :summary
)
echo.

echo [6] Checking for existing containers...
docker ps --filter "name=mes-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul | findstr "mes-" >nul
if %errorlevel% equ 0 (
    echo ✓ MES containers are running:
    docker ps --filter "name=mes-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
) else (
    echo ✗ MES containers are NOT running
    echo   To start containers, run: start.bat
)
echo.

echo [7] Checking port availability (localhost:8000)...
netstat -an | findstr ":8000" >nul
if %errorlevel% equ 0 (
    echo ✓ Port 8000 is in use
    echo   This could be MES backend or another service
) else (
    echo ✗ Port 8000 is NOT in use
    echo   Backend service is not listening on localhost:8000
)
echo.

echo [8] Checking port availability (localhost:80)...
netstat -an | findstr ":80 " >nul
if %errorlevel% equ 0 (
    echo ✓ Port 80 is in use
    echo   This could be MES frontend or another service
) else (
    echo ✗ Port 80 is NOT in use
    echo   Frontend service is not listening on localhost:80
)
echo.

:summary
echo ========================================
echo SUMMARY & RECOMMENDATIONS
echo ========================================
echo.

REM Check Docker installation
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [URGENT] DOCKER NOT INSTALLED
    echo   1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
    echo   2. Restart computer
    echo   3. Start Docker Desktop
    echo.
    goto :end
)

REM Check Docker running
tasklist /FI "IMAGENAME eq dockerd.exe" /FO TABLE /NH >nul 2>&1
if %errorlevel% neq 0 (
    echo [URGENT] DOCKER NOT RUNNING
    echo   1. Start Docker Desktop from Start Menu
    echo   2. Wait for Docker to start (system tray icon)
    echo.
    goto :end
)

REM Check containers
docker ps --filter "name=mes-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul | findstr "mes-" >nul
if %errorlevel% neq 0 (
    echo [ACTION] START MES CONTAINERS
    echo   Run: start.bat
    echo   This will start backend and frontend services
    echo.
    goto :end
)

REM Check ports
netstat -an | findstr ":8000" >nul
if %errorlevel% neq 0 (
    echo [WARNING] Backend not listening on port 8000
    echo   Containers may be running but ports not mapped correctly
    echo   Check container logs: docker-compose logs backend
    echo.
)

netstat -an | findstr ":80 " >nul
if %errorlevel% neq 0 (
    echo [WARNING] Frontend not listening on port 80
    echo   Check container logs: docker-compose logs frontend
    echo.
)

echo [SUCCESS] System appears to be running locally
echo   Frontend: http://localhost
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo If you cannot access these URLs:
echo   1. Check firewall settings
echo   2. Ensure containers are healthy: docker-compose ps
echo   3. View logs: docker-compose logs -f
echo.

:end
echo ========================================
echo IMPORTANT: If deployed to REMOTE SERVER
echo ========================================
echo.
echo If you deployed MES to a remote server (cloud):
echo   DO NOT use localhost
echo   Use the server's public IP address:
echo     Frontend: http://<server-ip>
echo     Backend:  http://<server-ip>:8000
echo.
echo To find your server IP:
echo   1. Check deployment logs
echo   2. Check cloud provider console (Oracle Cloud, AWS, Azure, etc.)
echo   3. Look for "Public IP" or "External IP"
echo.
echo To create admin user on remote server:
echo   1. SSH to server: ssh opc@<server-ip>
echo   2. cd /path/to/ElastiMES
echo   3. docker exec mes-backend python /app/create_admin.py
echo.
echo ========================================
echo Run QUICK_START.bat for step-by-step guide
echo ========================================
echo.
pause
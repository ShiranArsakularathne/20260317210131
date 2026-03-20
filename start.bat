@echo off
echo Starting MES System...
echo ======================

REM Check if Docker is running
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not running. Please start Docker first.
    echo.
    echo For Windows:
    echo   1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/
    echo   2. Start Docker Desktop from Start Menu
    echo   3. Wait for Docker to start (system tray icon shows "Docker is running")
    echo   4. Run this script again
    exit /b 1
)

REM Check if docker-compose is available
where docker-compose >nul 2>&1
if %errorlevel% equ 0 (
    set DOCKER_COMPOSE_CMD=docker-compose
) else (
    where docker-compose.exe >nul 2>&1
    if %errorlevel% equ 0 (
        set DOCKER_COMPOSE_CMD=docker-compose.exe
    ) else (
        echo Checking for Docker Compose plugin...
        docker compose version >nul 2>&1
        if %errorlevel% equ 0 (
            set DOCKER_COMPOSE_CMD=docker compose
        ) else (
            echo Error: docker-compose is not installed.
            echo Docker Compose is included with Docker Desktop.
            echo Please ensure Docker Desktop is installed and running.
            exit /b 1
        )
    )
)

REM Create data directory
if not exist data mkdir data

REM Start services
echo Starting services with Docker Compose...
%DOCKER_COMPOSE_CMD% up -d

echo.
echo Services started successfully!
echo.
echo Access the application at:
echo   Frontend: http://localhost
echo   Backend API: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo To view logs: %DOCKER_COMPOSE_CMD% logs -f
echo To stop: %DOCKER_COMPOSE_CMD% down
echo.
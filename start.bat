@echo off
echo Starting MES System...
echo ======================

REM Check if Docker is running
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not running. Please start Docker first.
    exit /b 1
)

REM Create data directory
if not exist data mkdir data

REM Start services
echo Starting services with Docker Compose...
docker-compose up -d

echo.
echo Services started successfully!
echo.
echo Access the application at:
echo   Frontend: http://localhost
echo   Backend API: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
@echo off
echo === MES Admin User Creation ===
echo.

REM Method 1: Try to register via API
echo Method 1: Register via API...
curl -s -f --max-time 10 -X POST "http://localhost:8000/api/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\": \"admin\", \"password\": \"admin\", \"email\": \"admin@example.com\", \"full_name\": \"Administrator\", \"is_admin\": true}" > nul 2>&1

if %errorlevel% equ 0 (
  echo ✓ Admin user created via API
  echo.
  echo Login credentials:
  echo   Username: admin
  echo   Password: admin
  pause
  exit /b 0
) else (
  echo ✗ API method failed (backend may not be accessible)
)

echo.

REM Method 2: Run script inside container
echo Method 2: Run script inside backend container...
docker ps --filter "name=mes-backend" --format "{{.Names}}" | findstr mes-backend > nul 2>&1

if %errorlevel% equ 0 (
  echo Container 'mes-backend' found, executing script...
  
  REM Copy script to container
  docker cp ..\backend\create_admin.py mes-backend:/app/create_admin.py 2>nul || echo Script already exists in container or copy failed, continuing...
  
  REM Execute script
  docker exec mes-backend python /app/create_admin.py
  
  if %errorlevel% equ 0 (
    echo ✓ Admin user created via container
    echo.
    echo Login credentials:
    echo   Username: admin
    echo   Password: admin
    pause
    exit /b 0
  ) else (
    echo ✗ Container method failed
  )
) else (
  echo ✗ Container 'mes-backend' not running
)

echo.

REM Method 3: Direct database access (SQLite)
echo Method 3: Direct database access (SQLite)...
if exist "..\data\mes.db" (
  echo Database file found: ..\data\mes.db
  echo.
  echo You can manually create a user by:
  echo 1. Install SQLite from https://sqlite.org/download.html
  echo 2. Run: sqlite3 ..\data\mes.db
  echo 3. Execute: INSERT INTO users (username, email, full_name, hashed_password, is_admin, is_active, created_at) VALUES ('admin', 'admin@example.com', 'Administrator', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 1, 1, datetime('now'));
  echo    Note: The hash is SHA256 of 'admin'
) else (
  echo Database file not found at: ..\data\mes.db
)

echo.
echo === All methods failed ===
echo Please ensure:
echo 1. Backend container is running: docker-compose ps
echo 2. Backend service is accessible: curl http://localhost:8000/health
echo 3. Or run this script from inside the container: docker exec -it mes-backend bash
echo.
pause
exit /b 1
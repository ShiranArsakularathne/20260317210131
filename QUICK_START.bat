@echo off
echo ========================================
echo MES System Quick Start Guide
echo ========================================
echo.

echo Based on your deployment output, you likely deployed to a REMOTE SERVER.
echo.
echo To access your MES system:
echo.
echo 1. FIND YOUR SERVER IP ADDRESS
echo    - Check deployment logs
echo    - Check cloud provider console (Oracle Cloud, AWS, Azure, etc.)
echo    - Look for "Public IP" or "External IP"
echo.
echo 2. ACCESS THE SYSTEM
echo    - Frontend: http://<server-ip>
echo    - Backend API: http://<server-ip>:8000
echo    - API Docs: http://<server-ip>:8000/docs
echo.
echo 3. CREATE ADMIN USER (if not already created)
echo    SSH to your server and run:
echo    ssh opc@<server-ip>
echo    cd /path/to/ElastiMES
echo    docker exec mes-backend python /app/create_admin.py
echo.
echo 4. LOGIN CREDENTIALS
echo    Username: admin
echo    Password: admin
echo    (Change password after first login!)
echo.
echo ========================================
echo If deployment was LOCAL (on this machine):
echo ========================================
echo.
echo 1. Install Docker Desktop:
echo    https://www.docker.com/products/docker-desktop/
echo.
echo 2. Start Docker Desktop
echo.
echo 3. Run:
echo    cd %~dp0
echo    start.bat
echo.
echo ========================================
echo For detailed diagnostics, run:
echo scripts\diagnose_deployment.bat
echo ========================================
echo.
pause
@echo off
echo ========================================
echo MES System - Path Selection
echo ========================================
echo.
echo Based on diagnostic results:
echo   - Docker is NOT installed on this machine
echo   - No services running on ports 80 or 8000
echo   - Python IS installed
echo   - Windows 11 Enterprise
echo.
echo You have TWO possible paths:
echo.
echo [1] REMOTE SERVER ACCESS (Most Likely)
echo     If you deployed MES to a cloud server (Oracle Cloud, AWS, Azure, etc.)
echo     Your system is running on a remote server, NOT on this machine.
echo.
echo [2] LOCAL INSTALLATION
echo     If you want to run MES on THIS Windows machine
echo     You need to install Docker Desktop first.
echo.
echo ========================================
echo Which path do you want to take?
echo ========================================
echo.
echo Enter 1 or 2, then press Enter:
set /p CHOICE=

if "%CHOICE%"=="1" goto :remote
if "%CHOICE%"=="2" goto :local

echo Invalid choice. Please run again and enter 1 or 2.
pause
exit /b 1

:remote
echo.
echo ========================================
echo REMOTE SERVER ACCESS
echo ========================================
echo.
echo Since you deployed to a remote server:
echo.
echo 1. FIND YOUR SERVER IP ADDRESS:
echo    - Check your deployment logs
echo    - Check cloud provider console (Oracle Cloud, AWS, Azure, etc.)
echo    - Look for "Public IP" or "External IP"
echo.
echo 2. ACCESS THE SYSTEM:
echo    - Frontend: http://<server-ip>
echo    - Backend API: http://<server-ip>:8000
echo    - API Docs: http://<server-ip>:8000/docs
echo.
echo 3. CREATE ADMIN USER (on the server):
echo    Open PowerShell and run:
echo      ssh opc@<server-ip>
echo      cd /path/to/ElastiMES
echo      docker exec mes-backend python /app/create_admin.py
echo.
echo 4. LOGIN CREDENTIALS:
echo    Username: admin
echo    Password: admin
echo    (Change password after first login!)
echo.
echo ========================================
echo TROUBLESHOOTING REMOTE ACCESS:
echo ========================================
echo.
echo If you cannot access the server:
echo 1. Check firewall/security group rules:
echo    - Port 80 (HTTP) must be open
echo    - Port 8000 must be open
echo    - Port 22 (SSH) must be open for admin access
echo.
echo 2. Verify server is running:
echo    - Check cloud console for instance status
echo    - Try to ping the server IP
echo.
echo 3. Check deployment logs for errors.
echo.
echo Press any key to open SOLUTION.md for more details...
pause >nul
start notepad.exe SOLUTION.md
goto :end

:local
echo.
echo ========================================
echo LOCAL INSTALLATION
echo ========================================
echo.
echo To run MES on THIS Windows machine:
echo.
echo STEP 1: Install Docker Desktop
echo   1. Download: https://www.docker.com/products/docker-desktop/
echo   2. Run the installer (Docker Desktop Installer.exe)
echo   3. Accept license, use default options
echo   4. RESTART YOUR COMPUTER when prompted
echo.
echo STEP 2: Start Docker Desktop
echo   1. After restart, find "Docker Desktop" in Start Menu
echo   2. Launch it
echo   3. Wait for system tray icon: "Docker Desktop is running"
echo   4. This may take 2-3 minutes on first run
echo.
echo STEP 3: Verify Installation
echo   Open NEW Command Prompt or PowerShell and run:
echo     docker --version
echo     docker-compose --version
echo.
echo STEP 4: Start MES System
echo   In Command Prompt, run:
echo     cd c:\Users\shirana\CodeBuddy\ElastiMES
echo     start.bat
echo.
echo STEP 5: Create Admin User
echo   After containers are running:
echo     python backend\create_admin.py
echo.
echo STEP 6: Access the Application
echo   - Frontend: http://localhost
echo   - Backend: http://localhost:8000
echo   - API Docs: http://localhost:8000/docs
echo.
echo Login with: admin / admin
echo.
echo ========================================
echo Need more help?
echo ========================================
echo.
echo 1. Run check_system.bat after Docker installation
echo 2. Read INSTALL_DOCKER.md for detailed instructions
echo 3. Run FIX_EVERYTHING.bat for comprehensive troubleshooting
echo.
echo Press any key to open INSTALL_DOCKER.md...
pause >nul
start notepad.exe INSTALL_DOCKER.md

:end
echo.
echo ========================================
echo Quick Commands for Your Chosen Path:
echo ========================================
echo.
if "%CHOICE%"=="1" (
    echo For REMOTE SERVER:
    echo   Find server IP in deployment logs
    echo   Access: http://<server-ip>
    echo   SSH: ssh opc@<server-ip>
)
if "%CHOICE%"=="2" (
    echo For LOCAL INSTALLATION:
    echo   Install Docker Desktop first
    echo   Then run: start.bat
    echo   Create admin: python backend\create_admin.py
)
echo.
echo ========================================
echo Run QUICK_START.bat for step-by-step guide
echo ========================================
echo.
pause
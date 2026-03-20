# Docker Installation Guide for Windows

## Problem: `docker-compose: command not found` and `curl: (7) Failed to connect to localhost port 8000`

These errors indicate that **Docker is not installed** on your current machine, and the MES system is not running locally.

## Solution: Choose Your Deployment Scenario

### Scenario 1: You Deployed to a Remote Server (Most Likely)
If you previously deployed MES to a cloud server (Oracle Cloud, AWS, Azure, etc.):

1. **DO NOT use `localhost`** - Your system is running on a remote server
2. **Find your server's public IP address**:
   - Check deployment logs
   - Check cloud provider console
   - Look for "Public IP" or "External IP"
3. **Access using the server IP**:
   - Frontend: `http://<server-ip>`
   - Backend API: `http://<server-ip>:8000`
   - API Docs: `http://<server-ip>:8000/docs`
4. **Create admin user on the server**:
   ```bash
   ssh opc@<server-ip>
   cd /path/to/ElastiMES
   docker exec mes-backend python /app/create_admin.py
   ```

### Scenario 2: You Want to Run Locally on This Windows Machine
If you want to run MES on your local computer:

## Step 1: Install Docker Desktop

1. **Download Docker Desktop**:
   - Go to https://www.docker.com/products/docker-desktop/
   - Click "Download for Windows"
   - Run the installer (`Docker Desktop Installer.exe`)

2. **Installation Options**:
   - Accept the license agreement
   - Choose "Use WSL 2 instead of Hyper-V" (recommended for Windows 10/11)
   - Follow the default installation steps
   - **Restart your computer** when prompted

3. **Start Docker Desktop**:
   - After restart, find "Docker Desktop" in Start Menu
   - Launch it
   - Wait for Docker to start (system tray icon shows "Docker Desktop is running")
   - This may take a few minutes on first run

## Step 2: Verify Installation

Open PowerShell or Command Prompt and run:

```cmd
docker --version
docker-compose --version
```

Expected output:
```
Docker version 20.10.x, build ...
docker-compose version 1.29.x, build ...
```

If `docker-compose` not found, try:
```cmd
docker compose version
```

## Step 3: Start MES System

1. **Open PowerShell or Command Prompt as Administrator**
2. **Navigate to your project**:
   ```cmd
   cd c:\Users\shirana\CodeBuddy\ElastiMES
   ```
3. **Run the start script**:
   ```cmd
   start.bat
   ```
   Or use the quick start guide:
   ```cmd
   QUICK_START.bat
   ```

## Step 4: Create Admin User

After containers are running, create the admin user:

```cmd
cd c:\Users\shirana\CodeBuddy\ElastiMES
python backend\create_admin.py
```

Or use the API method:
```cmd
python scripts\create_admin_api.py
```

## Step 5: Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

**Default credentials**:
- Username: `admin`
- Password: `admin`
- **Change password immediately after first login!**

## Troubleshooting

### Docker Desktop Won't Start
- Ensure virtualization is enabled in BIOS
- Check Windows Features: "Windows Subsystem for Linux" and "Virtual Machine Platform" should be enabled
- Run Docker Desktop as Administrator

### Port Conflicts
If ports 80 or 8000 are already in use:
- Stop other services using these ports
- Or modify `docker-compose.yml` to use different ports

### "docker-compose: command not found"
Docker Compose is included with Docker Desktop. If command not found:
1. Ensure Docker Desktop is running
2. Add Docker to PATH (Docker Desktop settings → General → "Add docker-compose to PATH")
3. Restart your terminal

### Still Having Issues?
Run the diagnostic script:
```cmd
check_system.bat
```

Or the comprehensive diagnostic:
```cmd
scripts\diagnose_deployment.bat
```

## Next Steps

1. **Test the system**: Access http://localhost
2. **Login**: Use admin/admin
3. **Configure devices**: Set up PLC, RFID, barcode scanner in Settings
4. **Database sync**: Configure SQL Server connection in `.env` file

## Need Help?

- Check `SOLUTION.md` for common issues
- Run `check_system.bat` for automated diagnosis
- Refer to `README.md` for system architecture details
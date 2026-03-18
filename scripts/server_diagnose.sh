#!/bin/bash
# Server-side diagnostic script
# Run this on the server where MES is deployed

set -e

echo "========================================"
echo "MES Server Diagnostic Tool"
echo "========================================"
echo

echo "[1] Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "✓ Docker is installed"
    docker --version
else
    echo "✗ Docker is NOT installed"
    exit 1
fi
echo

echo "[2] Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo "✓ Docker Compose is installed"
    docker-compose --version
elif docker compose version &> /dev/null; then
    echo "✓ Docker Compose (plugin) is installed"
    docker compose version
else
    echo "✗ Docker Compose is NOT installed"
    exit 1
fi
echo

echo "[3] Checking Docker service status..."
sudo systemctl status docker --no-pager | head -20
echo

echo "[4] Checking running containers..."
docker ps
echo

echo "[5] Checking MES containers..."
if docker ps --filter "name=mes-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q mes-; then
    echo "✓ MES containers are running:"
    docker ps --filter "name=mes-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "✗ MES containers are NOT running"
    echo "  Starting containers..."
    cd "$(dirname "$0")/.."
    docker-compose up -d
    sleep 10
fi
echo

echo "[6] Checking container health..."
echo "Backend health:"
curl -s -f --max-time 10 http://localhost:8000/health || echo "✗ Backend not responding"
echo
echo "Frontend health:"
curl -s -f --max-time 10 -I http://localhost | head -1 || echo "✗ Frontend not responding"
echo

echo "[7] Checking port availability..."
echo "Ports in use:"
sudo netstat -tlnp | grep -E ':(80|8000)' || echo "  No services listening on ports 80 or 8000"
echo

echo "[8] Checking container logs (last 20 lines)..."
echo "Backend logs:"
docker-compose logs --tail=20 backend
echo
echo "Frontend logs:"
docker-compose logs --tail=20 frontend
echo

echo "[9] Checking admin user..."
echo "Creating admin user if not exists..."
cd "$(dirname "$0")/.."
if [ -f "backend/create_admin.py" ]; then
    python backend/create_admin.py
else
    echo "Admin creation script not found, using direct SQL..."
    echo "To create admin manually, run:"
    echo "  docker exec mes-backend python -c \"import sys; sys.path.append('/app'); from create_admin import create_admin_user; create_admin_user()\""
fi
echo

echo "[10] Network configuration..."
echo "Server IP addresses:"
hostname -I 2>/dev/null || ip addr show | grep -oP 'inet \K[\d.]+' | grep -v '127.0.0.1'
echo
echo "Firewall status:"
if command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --list-ports
elif command -v ufw &> /dev/null; then
    sudo ufw status
fi
echo

echo "========================================"
echo "SUMMARY"
echo "========================================"
echo
echo "ACCESS URLs:"
echo "  Frontend:    http://$(hostname -I | awk '{print $1}')"
echo "  Backend API: http://$(hostname -I | awk '{print $1}'):8000"
echo "  API Docs:    http://$(hostname -I | awk '{print $1}'):8000/docs"
echo
echo "Admin credentials (if created):"
echo "  Username: admin"
echo "  Password: admin"
echo
echo "Next steps:"
echo "  1. Access the frontend URL in browser"
echo "  2. Login with admin/admin"
echo "  3. Change password immediately"
echo "========================================"
#!/bin/bash
# Script to create admin user for MES system

set -e

echo "=== MES Admin User Creation ==="
echo ""

# Check if running inside container or on host
if [ -f /.dockerenv ]; then
    echo "Running inside container, using direct database connection..."
    cd /app
    python create_admin.py
else
    echo "Running on host, trying multiple methods..."
    echo ""
    
    # Method 1: Try to register via API
    echo "Method 1: Register via API..."
    API_URL="http://localhost:8000/api/auth/register"
    
    if curl -s -f --max-time 10 -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "admin",
            "password": "admin",
            "email": "admin@example.com",
            "full_name": "Administrator",
            "is_admin": true
        }' > /dev/null 2>&1; then
        echo "✓ Admin user created via API"
        echo ""
        echo "Login credentials:"
        echo "  Username: admin"
        echo "  Password: admin"
        exit 0
    else
        echo "✗ API method failed (backend may not be accessible)"
    fi
    
    echo ""
    
    # Method 2: Run script inside container
    echo "Method 2: Run script inside backend container..."
    if docker ps --filter "name=mes-backend" --format "{{.Names}}" | grep -q mes-backend; then
        echo "Container 'mes-backend' found, executing script..."
        
        # Copy script to container
        docker cp ../backend/create_admin.py mes-backend:/app/create_admin.py 2>/dev/null || \
            echo "Script already exists in container or copy failed, continuing..."
        
        # Execute script
        docker exec mes-backend python /app/create_admin.py
        
        if [ $? -eq 0 ]; then
            echo "✓ Admin user created via container"
            echo ""
            echo "Login credentials:"
            echo "  Username: admin"
            echo "  Password: admin"
            exit 0
        else
            echo "✗ Container method failed"
        fi
    else
        echo "✗ Container 'mes-backend' not running"
    fi
    
    echo ""
    echo "Method 3: Direct database access (SQLite)..."
    DB_FILE="../data/mes.db"
    if [ -f "$DB_FILE" ]; then
        echo "Database file found: $DB_FILE"
        echo "You can manually create a user by:"
        echo "1. Install sqlite3: sudo apt-get install sqlite3"
        echo "2. Run: sqlite3 $DB_FILE"
        echo "3. Execute: INSERT INTO users (username, email, full_name, hashed_password, is_admin, is_active, created_at) VALUES ('admin', 'admin@example.com', 'Administrator', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 1, 1, datetime('now'));"
        echo "   Note: The hash is SHA256 of 'admin'"
    else
        echo "Database file not found at: $DB_FILE"
    fi
    
    echo ""
    echo "=== All methods failed ==="
    echo "Please ensure:"
    echo "1. Backend container is running: docker-compose ps"
    echo "2. Backend service is accessible: curl http://localhost:8000/health"
    echo "3. Or run this script from inside the container: docker exec -it mes-backend bash"
    exit 1
fi
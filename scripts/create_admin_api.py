#!/usr/bin/env python3
"""
Create admin user via API call.
Works from any machine that can reach the backend.
"""

import requests
import json
import sys
import time

def create_admin_via_api(base_url="http://localhost:8000"):
    """Create admin user via API"""
    url = f"{base_url}/api/auth/register"
    
    user_data = {
        "username": "admin",
        "password": "admin", 
        "email": "admin@example.com",
        "full_name": "Administrator",
        "is_admin": True
    }
    
    try:
        print(f"Attempting to create admin user via API at {url}...")
        response = requests.post(url, json=user_data, timeout=10)
        
        if response.status_code == 200:
            print("✓ Admin user created successfully via API!")
            print(f"  Username: admin")
            print(f"  Password: admin")
            return True
        elif response.status_code == 400:
            error_data = response.json()
            if "detail" in error_data and "already registered" in error_data["detail"]:
                print("✓ Admin user already exists")
                return True
            else:
                print(f"✗ API error: {error_data.get('detail', 'Unknown error')}")
                return False
        else:
            print(f"✗ API returned status code: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend. Ensure:")
        print("  1. Backend service is running (docker-compose ps)")
        print("  2. Backend is accessible at the URL")
        print("  3. Firewall/security group allows access to port 8000")
        return False
    except requests.exceptions.Timeout:
        print("✗ Connection timeout. Backend may be slow or unreachable.")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

def check_backend_health(base_url="http://localhost:8000"):
    """Check if backend is responding"""
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print(f"✓ Backend is healthy at {base_url}")
            return True
        else:
            print(f"✗ Backend responded with status {response.status_code}")
            return False
    except:
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Create admin user for MES system")
    parser.add_argument("--url", default="http://localhost:8000", 
                       help="Base URL of backend (default: http://localhost:8000)")
    parser.add_argument("--skip-health-check", action="store_true",
                       help="Skip health check before attempting registration")
    
    args = parser.parse_args()
    
    print("=== MES Admin User Creation ===\n")
    
    # Check backend health
    if not args.skip_health_check:
        print("Checking backend connectivity...")
        if not check_backend_health(args.url):
            print("\nTrying alternative URLs...")
            # Try common alternatives
            alternatives = [
                "http://127.0.0.1:8000",
                f"http://{args.url.split('://')[1] if '://' in args.url else args.url}:8000"
            ]
            
            for alt_url in alternatives:
                if alt_url != args.url and check_backend_health(alt_url):
                    args.url = alt_url
                    break
            else:
                print("\nCould not connect to backend. Please ensure:")
                print("1. Backend container is running: docker-compose ps")
                print("2. Service is accessible at the correct URL")
                print("3. If using a cloud server, check security group/firewall rules")
                print("\nYou can also try:")
                print(f"  python {__file__} --url http://<server-ip>:8000")
                print(f"  python {__file__} --skip-health-check")
                sys.exit(1)
    
    # Attempt to create admin user
    print("\nCreating admin user...")
    success = create_admin_via_api(args.url)
    
    if success:
        print("\n=== Login Credentials ===")
        print("Username: admin")
        print("Password: admin")
        print("\nYou can now login at the frontend interface.")
        sys.exit(0)
    else:
        print("\nFailed to create admin user. Try alternative methods:")
        print("1. Run script inside container: docker exec mes-backend python /app/create_admin.py")
        print("2. Direct database access (see documentation)")
        sys.exit(1)
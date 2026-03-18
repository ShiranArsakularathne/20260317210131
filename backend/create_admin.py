#!/usr/bin/env python3
"""
Script to create default admin user.
Run this inside the backend container or with proper database connection.
"""

import sys
import hashlib
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError

# Import models and settings
sys.path.append('.')  # Ensure current directory is in path

from database import SessionLocal, Base, engine
from models import User
from config import settings

def get_password_hash(password: str) -> str:
    """Hash password using SHA256 (same as in auth.py)"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_admin_user():
    """Create default admin user if it doesn't exist"""
    db: Session = SessionLocal()
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        if admin_user:
            print(f"Admin user already exists: {admin_user.username}")
            return False
        
        # Create admin user
        hashed_password = get_password_hash("admin")
        admin = User(
            username="admin",
            email="admin@example.com",
            full_name="Administrator",
            hashed_password=hashed_password,
            is_admin=True,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Admin user created successfully:")
        print(f"  Username: admin")
        print(f"  Password: admin")
        print(f"  Email: admin@example.com")
        print(f"  ID: {admin.id}")
        return True
        
    except IntegrityError as e:
        db.rollback()
        print(f"Error creating admin user: {e}")
        return False
    except Exception as e:
        db.rollback()
        print(f"Unexpected error: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating default admin user...")
    print(f"Database URL: {settings.DATABASE_URL}")
    
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    success = create_admin_user()
    if success:
        print("Script completed successfully.")
    else:
        print("Script completed with issues.")
    sys.exit(0 if success else 1)
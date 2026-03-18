import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mes.db")
    
    # SQL Server
    SQL_SERVER_CONNECTION_STRING = os.getenv("SQL_SERVER_CONNECTION_STRING", "")
    
    # ERP API
    ERP_API_URL = os.getenv("ERP_API_URL", "http://erp.example.com/api")
    ERP_API_KEY = os.getenv("ERP_API_KEY", "")
    
    # Sync
    SYNC_INTERVAL_MINUTES = int(os.getenv("SYNC_INTERVAL_MINUTES", "20"))
    
    # Devices
    PLC_HOST = os.getenv("PLC_HOST", "localhost")
    PLC_PORT = int(os.getenv("PLC_PORT", "502"))
    RFID_SERIAL_PORT = os.getenv("RFID_SERIAL_PORT", "/dev/ttyUSB0")
    BARCODE_SERIAL_PORT = os.getenv("BARCODE_SERIAL_PORT", "/dev/ttyUSB1")
    
    # Application
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

settings = Settings()
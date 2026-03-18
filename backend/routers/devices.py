import serial
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import DeviceReading
from config import settings
import threading
import time
import json

router = APIRouter()
logger = logging.getLogger(__name__)

# Device connection states
device_connections = {
    "plc": None,
    "rfid": None,
    "barcode": None
}

# WebSocket connections
active_connections = []

# Pydantic models for device data
class PLCReading(BaseModel):
    address: int
    value: float
    timestamp: str

class RFIDReading(BaseModel):
    tag_id: str
    timestamp: str

class BarcodeReading(BaseModel):
    barcode: str
    timestamp: str

class DeviceCommand(BaseModel):
    device_type: str
    command: str
    parameters: Optional[dict] = None

# PLC Simulator (Modbus TCP)
class PLCSimulator:
    def __init__(self, host="localhost", port=502):
        self.host = host
        self.port = port
        self.connected = False
        self.readings = {
            40001: 0.0,  # Load cell 1
            40002: 0.0,  # Load cell 2
            40003: 0.0,  # Load cell 3
            40004: 0.0,  # Load cell 4
        }
    
    def connect(self):
        try:
            # In real implementation, use pymodbus or similar
            logger.info(f"PLC simulator connecting to {self.host}:{self.port}")
            self.connected = True
            return True
        except Exception as e:
            logger.error(f"PLC connection error: {e}")
            return False
    
    def read_register(self, address):
        if not self.connected:
            return None
        
        # Simulate changing values
        import random
        if address in self.readings:
            # Add some random variation
            self.readings[address] += random.uniform(-0.1, 0.1)
            self.readings[address] = max(0, self.readings[address])  # No negative weights
            return self.readings[address]
        return None
    
    def write_register(self, address, value):
        if not self.connected:
            return False
        
        if address in self.readings:
            self.readings[address] = value
            return True
        return False

# RFID Reader Simulator
class RFIDSimulator:
    def __init__(self, port="/dev/ttyUSB0", baudrate=9600):
        self.port = port
        self.baudrate = baudrate
        self.connected = False
        self.last_tag = None
    
    def connect(self):
        try:
            # In real implementation, use serial library
            logger.info(f"RFID simulator connecting to {self.port}")
            self.connected = True
            return True
        except Exception as e:
            logger.error(f"RFID connection error: {e}")
            return False
    
    def read_tag(self):
        if not self.connected:
            return None
        
        # Simulate RFID tags
        tags = ["RFID001", "RFID002", "RFID003", "RFID004", "RFID005"]
        import random
        self.last_tag = random.choice(tags)
        return self.last_tag

# Barcode Scanner Simulator
class BarcodeSimulator:
    def __init__(self, port="/dev/ttyUSB1", baudrate=9600):
        self.port = port
        self.baudrate = baudrate
        self.connected = False
        self.last_barcode = None
    
    def connect(self):
        try:
            logger.info(f"Barcode simulator connecting to {self.port}")
            self.connected = True
            return True
        except Exception as e:
            logger.error(f"Barcode connection error: {e}")
            return False
    
    def read_barcode(self):
        if not self.connected:
            return None
        
        # Simulate barcodes
        barcodes = ["BEAM001", "BEAM002", "BEAM003", "MACH001", "MACH002"]
        import random
        self.last_barcode = random.choice(barcodes)
        return self.last_barcode

# Initialize device simulators
plc_simulator = PLCSimulator(settings.PLC_HOST, settings.PLC_PORT)
rfid_simulator = RFIDSimulator(settings.RFID_SERIAL_PORT)
barcode_simulator = BarcodeSimulator(settings.BARCODE_SERIAL_PORT)

# Background task for reading devices
def read_devices_continuously():
    """Continuously read from devices"""
    while True:
        try:
            # Just keep the devices "alive" by periodically checking connection
            # Actual reading happens on demand via API endpoints
            time.sleep(5)  # Check every 5 seconds
            
        except Exception as e:
            logger.error(f"Error in device reading loop: {e}")
            time.sleep(1)

# Start device reading thread
device_thread = threading.Thread(target=read_devices_continuously, daemon=True)
device_thread.start()

@router.on_event("startup")
async def startup_event():
    """Connect to devices on startup"""
    try:
        # Connect to PLC
        if plc_simulator.connect():
            device_connections["plc"] = "connected"
            logger.info("PLC simulator connected")
        
        # Connect to RFID
        if rfid_simulator.connect():
            device_connections["rfid"] = "connected"
            logger.info("RFID simulator connected")
        
        # Connect to barcode scanner
        if barcode_simulator.connect():
            device_connections["barcode"] = "connected"
            logger.info("Barcode simulator connected")
            
    except Exception as e:
        logger.error(f"Device startup error: {e}")

@router.get("/status")
async def get_device_status():
    """Get status of all devices"""
    return {
        "plc": device_connections["plc"],
        "rfid": device_connections["rfid"],
        "barcode": device_connections["barcode"]
    }

@router.post("/connect/{device_type}")
async def connect_device(device_type: str):
    """Manually connect to a device"""
    if device_type == "plc":
        if plc_simulator.connect():
            device_connections["plc"] = "connected"
            return {"message": "PLC connected"}
    elif device_type == "rfid":
        if rfid_simulator.connect():
            device_connections["rfid"] = "connected"
            return {"message": "RFID connected"}
    elif device_type == "barcode":
        if barcode_simulator.connect():
            device_connections["barcode"] = "connected"
            return {"message": "Barcode scanner connected"}
    else:
        return {"error": f"Unknown device type: {device_type}"}
    
    return {"error": f"Failed to connect {device_type}"}

@router.get("/plc/read/{address}")
async def read_plc_register(address: int):
    """Read a value from PLC register"""
    if not plc_simulator.connected:
        return {"error": "PLC not connected"}
    
    value = plc_simulator.read_register(address)
    if value is None:
        return {"error": f"Invalid address: {address}"}
    
    # Store reading in database
    db = next(get_db())
    try:
        reading = DeviceReading(
            device_type="plc",
            device_id=f"register_{address}",
            reading=str(value)
        )
        db.add(reading)
        db.commit()
    finally:
        db.close()
    
    return {"address": address, "value": value}

@router.post("/plc/write/{address}")
async def write_plc_register(address: int, value: float):
    """Write a value to PLC register"""
    if not plc_simulator.connected:
        return {"error": "PLC not connected"}
    
    success = plc_simulator.write_register(address, value)
    if success:
        return {"message": f"Register {address} set to {value}"}
    else:
        return {"error": f"Failed to write to address {address}"}

@router.get("/rfid/read")
async def read_rfid():
    """Read RFID tag"""
    if not rfid_simulator.connected:
        return {"error": "RFID not connected"}
    
    tag = rfid_simulator.read_tag()
    if tag:
        # Store reading in database
        db = next(get_db())
        try:
            reading = DeviceReading(
                device_type="rfid",
                device_id="reader_1",
                reading=tag
            )
            db.add(reading)
            db.commit()
        finally:
            db.close()
        
        return {"tag_id": tag}
    else:
        return {"error": "No tag detected"}

@router.get("/barcode/read")
async def read_barcode():
    """Read barcode"""
    if not barcode_simulator.connected:
        return {"error": "Barcode scanner not connected"}
    
    barcode = barcode_simulator.read_barcode()
    if barcode:
        # Store reading in database
        db = next(get_db())
        try:
            reading = DeviceReading(
                device_type="barcode",
                device_id="scanner_1",
                reading=barcode
            )
            db.add(reading)
            db.commit()
        finally:
            db.close()
        
        return {"barcode": barcode}
    else:
        return {"error": "No barcode scanned"}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time device data"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            # Wait for commands from client
            data = await websocket.receive_text()
            try:
                command = json.loads(data)
                device_type = command.get("device_type")
                cmd = command.get("command")
                
                if device_type == "plc" and cmd == "read":
                    address = command.get("parameters", {}).get("address", 40001)
                    value = plc_simulator.read_register(address)
                    await websocket.send_json({
                        "type": "plc_reading",
                        "address": address,
                        "value": value
                    })
                    
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON"})
            except Exception as e:
                await websocket.send_json({"error": str(e)})
                
    except WebSocketDisconnect:
        active_connections.remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)

@router.get("/readings")
async def get_device_readings(limit: int = 100, db: Session = Depends(get_db)):
    """Get recent device readings from database"""
    readings = db.query(DeviceReading).order_by(DeviceReading.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "device_type": r.device_type,
            "device_id": r.device_id,
            "reading": r.reading,
            "timestamp": r.timestamp,
            "processed": r.processed
        }
        for r in readings
    ]
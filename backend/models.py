from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    beam_loadings = relationship("BeamLoading", back_populates="operator")

class Machine(Base):
    __tablename__ = "machines"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)  # Machine code from barcode
    name = Column(String)
    location = Column(String)
    status = Column(String, default="idle")  # idle, running, maintenance
    last_maintenance = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String, unique=True, index=True)  # ERP plan ID
    machine_code = Column(String, ForeignKey("machines.code"))
    yarn_code = Column(String)
    beam_size = Column(Float)
    number_of_ends = Column(Integer)
    scheduled_start = Column(DateTime)
    scheduled_end = Column(DateTime)
    status = Column(String, default="pending")  # pending, in_progress, completed
    erp_sync_status = Column(String, default="pending")  # pending, synced, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    machine = relationship("Machine")
    beam_loadings = relationship("BeamLoading", back_populates="plan")

class BeamLoading(Base):
    __tablename__ = "beam_loadings"
    
    id = Column(Integer, primary_key=True, index=True)
    beam_code = Column(String, unique=True, index=True)  # Scanned beam barcode
    plan_id = Column(Integer, ForeignKey("plans.id"))
    operator_id = Column(Integer, ForeignKey("users.id"))
    machine_code = Column(String, ForeignKey("machines.code"))
    empty_beam_weight = Column(Float)  # From master data
    actual_empty_beam_weight = Column(Float)  # After editing/weighing
    loaded_beam_weight = Column(Float)  # After loading
    net_yarn_weight = Column(Float)  # Calculated
    load_cell_reading = Column(Float)
    status = Column(String, default="pending")  # pending, loaded, weighed, completed
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    plan = relationship("Plan", back_populates="beam_loadings")
    operator = relationship("User", back_populates="beam_loadings")
    machine = relationship("Machine")
    warp_operations = relationship("WarpOperation", back_populates="beam_loading")
    unload_operations = relationship("UnloadOperation", back_populates="beam_loading")

class WarpOperation(Base):
    __tablename__ = "warp_operations"
    
    id = Column(Integer, primary_key=True, index=True)
    beam_loading_id = Column(Integer, ForeignKey("beam_loadings.id"))
    warp_speed = Column(Float)
    tension = Column(Float)
    length_warped = Column(Float)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    status = Column(String, default="pending")  # pending, in_progress, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    beam_loading = relationship("BeamLoading", back_populates="warp_operations")

class UnloadOperation(Base):
    __tablename__ = "unload_operations"
    
    id = Column(Integer, primary_key=True, index=True)
    beam_loading_id = Column(Integer, ForeignKey("beam_loadings.id"))
    unload_weight = Column(Float)
    quality_check = Column(String)  # pass, fail
    notes = Column(Text)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    beam_loading = relationship("BeamLoading", back_populates="unload_operations")

class SyncLog(Base):
    __tablename__ = "sync_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String)
    record_id = Column(Integer)
    operation = Column(String)  # insert, update, delete
    sync_status = Column(String)  # pending, synced, failed
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    synced_at = Column(DateTime)

class DeviceReading(Base):
    __tablename__ = "device_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    device_type = Column(String)  # plc, rfid, barcode
    device_id = Column(String)
    reading = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    is_admin: bool = False

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Machine schemas
class MachineBase(BaseModel):
    code: str
    name: str
    location: Optional[str] = None
    status: str = "idle"

class MachineCreate(MachineBase):
    pass

class Machine(MachineBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Plan schemas
class PlanBase(BaseModel):
    plan_id: str
    machine_code: str
    yarn_code: str
    beam_size: float
    number_of_ends: int
    scheduled_start: datetime
    scheduled_end: datetime

class PlanCreate(PlanBase):
    pass

class Plan(PlanBase):
    id: int
    status: str
    erp_sync_status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# BeamLoading schemas
class BeamLoadingBase(BaseModel):
    beam_code: str
    plan_id: int
    operator_id: int
    machine_code: str
    empty_beam_weight: float
    actual_empty_beam_weight: Optional[float] = None
    loaded_beam_weight: Optional[float] = None
    net_yarn_weight: Optional[float] = None
    load_cell_reading: Optional[float] = None
    status: str = "pending"

class BeamLoadingCreate(BeamLoadingBase):
    pass

class BeamLoading(BeamLoadingBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# WarpOperation schemas
class WarpOperationBase(BaseModel):
    beam_loading_id: int
    warp_speed: Optional[float] = None
    tension: Optional[float] = None
    length_warped: Optional[float] = None
    status: str = "pending"

class WarpOperationCreate(WarpOperationBase):
    pass

class WarpOperation(WarpOperationBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# UnloadOperation schemas
class UnloadOperationBase(BaseModel):
    beam_loading_id: int
    unload_weight: Optional[float] = None
    quality_check: Optional[str] = None
    notes: Optional[str] = None
    status: str = "pending"

class UnloadOperationCreate(UnloadOperationBase):
    pass

class UnloadOperation(UnloadOperationBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# ERP API schemas
class ERPPlanResponse(BaseModel):
    plan_id: str
    yarn_code: str
    beam_size: float
    number_of_ends: int
    scheduled_start: datetime
    scheduled_end: datetime

class ERPBeamData(BaseModel):
    beam_code: str
    empty_beam_weight: float
    yarn_code: Optional[str] = None

# Device reading schemas
class DeviceReadingBase(BaseModel):
    device_type: str
    device_id: str
    reading: str

class DeviceReadingCreate(DeviceReadingBase):
    pass

class DeviceReading(DeviceReadingBase):
    id: int
    timestamp: datetime
    processed: bool
    
    class Config:
        from_attributes = True

# Sync schemas
class SyncRequest(BaseModel):
    table_name: str
    record_id: int

class SyncResponse(BaseModel):
    success: bool
    message: str
    synced_records: int = 0
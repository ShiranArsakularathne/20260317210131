from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Machine, Plan, BeamLoading, WarpOperation, UnloadOperation
from schemas import (
    Plan as PlanSchema,
    BeamLoading as BeamLoadingSchema,
    BeamLoadingCreate,
    WarpOperation as WarpOperationSchema,
    WarpOperationCreate,
    UnloadOperation as UnloadOperationSchema,
    UnloadOperationCreate,
    ERPPlanResponse
)
from routers.erp import fetch_plans_from_erp  # We'll implement this later

router = APIRouter()

# Machine endpoints
@router.get("/machines", response_model=List[dict])
async def get_machines(db: Session = Depends(get_db)):
    machines = db.query(Machine).all()
    return [{"code": m.code, "name": m.name, "status": m.status} for m in machines]

@router.get("/machines/{machine_code}/plans", response_model=List[PlanSchema])
async def get_plans_for_machine(machine_code: str, db: Session = Depends(get_db)):
    # First check if machine exists
    machine = db.query(Machine).filter(Machine.code == machine_code).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    # Fetch plans from ERP (simulated)
    erp_plans = fetch_plans_from_erp(machine_code)
    
    # Store plans in local DB if not exists
    for erp_plan in erp_plans:
        existing = db.query(Plan).filter(Plan.plan_id == erp_plan.plan_id).first()
        if not existing:
            plan = Plan(
                plan_id=erp_plan.plan_id,
                machine_code=machine_code,
                yarn_code=erp_plan.yarn_code,
                beam_size=erp_plan.beam_size,
                number_of_ends=erp_plan.number_of_ends,
                scheduled_start=erp_plan.scheduled_start,
                scheduled_end=erp_plan.scheduled_end
            )
            db.add(plan)
    db.commit()
    
    # Return plans for this machine
    plans = db.query(Plan).filter(Plan.machine_code == machine_code).all()
    return plans

@router.post("/beam-loading", response_model=BeamLoadingSchema)
async def create_beam_loading(beam_loading: BeamLoadingCreate, db: Session = Depends(get_db)):
    # Check if plan exists
    plan = db.query(Plan).filter(Plan.id == beam_loading.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Check if machine exists
    machine = db.query(Machine).filter(Machine.code == beam_loading.machine_code).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    # Check if beam code already used
    existing = db.query(BeamLoading).filter(BeamLoading.beam_code == beam_loading.beam_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Beam code already used")
    
    db_beam_loading = BeamLoading(**beam_loading.dict())
    db.add(db_beam_loading)
    db.commit()
    db.refresh(db_beam_loading)
    
    # Update plan status
    plan.status = "in_progress"
    db.commit()
    
    return db_beam_loading

@router.get("/beam-loading/{beam_loading_id}", response_model=BeamLoadingSchema)
async def get_beam_loading(beam_loading_id: int, db: Session = Depends(get_db)):
    beam_loading = db.query(BeamLoading).filter(BeamLoading.id == beam_loading_id).first()
    if not beam_loading:
        raise HTTPException(status_code=404, detail="Beam loading not found")
    return beam_loading

@router.put("/beam-loading/{beam_loading_id}/weight")
async def update_beam_weight(
    beam_loading_id: int, 
    actual_empty_beam_weight: float, 
    load_cell_reading: float = None,
    db: Session = Depends(get_db)
):
    beam_loading = db.query(BeamLoading).filter(BeamLoading.id == beam_loading_id).first()
    if not beam_loading:
        raise HTTPException(status_code=404, detail="Beam loading not found")
    
    beam_loading.actual_empty_beam_weight = actual_empty_beam_weight
    if load_cell_reading:
        beam_loading.load_cell_reading = load_cell_reading
        # Calculate net yarn weight if loaded_beam_weight exists
        if beam_loading.loaded_beam_weight:
            beam_loading.net_yarn_weight = beam_loading.loaded_beam_weight - actual_empty_beam_weight
    
    beam_loading.status = "weighed"
    db.commit()
    
    return {"message": "Beam weight updated successfully"}

@router.put("/beam-loading/{beam_loading_id}/loaded-weight")
async def update_loaded_weight(
    beam_loading_id: int, 
    loaded_beam_weight: float,
    db: Session = Depends(get_db)
):
    beam_loading = db.query(BeamLoading).filter(BeamLoading.id == beam_loading_id).first()
    if not beam_loading:
        raise HTTPException(status_code=404, detail="Beam loading not found")
    
    beam_loading.loaded_beam_weight = loaded_beam_weight
    if beam_loading.actual_empty_beam_weight:
        beam_loading.net_yarn_weight = loaded_beam_weight - beam_loading.actual_empty_beam_weight
    
    beam_loading.status = "loaded"
    db.commit()
    
    return {"message": "Loaded weight updated successfully"}

# Warp operation endpoints
@router.post("/warp-operation", response_model=WarpOperationSchema)
async def create_warp_operation(warp_op: WarpOperationCreate, db: Session = Depends(get_db)):
    beam_loading = db.query(BeamLoading).filter(BeamLoading.id == warp_op.beam_loading_id).first()
    if not beam_loading:
        raise HTTPException(status_code=404, detail="Beam loading not found")
    
    db_warp_op = WarpOperation(**warp_op.dict())
    db.add(db_warp_op)
    db.commit()
    db.refresh(db_warp_op)
    
    # Update beam loading status
    beam_loading.status = "warping"
    db.commit()
    
    return db_warp_op

@router.put("/warp-operation/{warp_op_id}/complete")
async def complete_warp_operation(
    warp_op_id: int,
    length_warped: float,
    db: Session = Depends(get_db)
):
    warp_op = db.query(WarpOperation).filter(WarpOperation.id == warp_op_id).first()
    if not warp_op:
        raise HTTPException(status_code=404, detail="Warp operation not found")
    
    warp_op.length_warped = length_warped
    warp_op.end_time = datetime.utcnow()
    warp_op.status = "completed"
    db.commit()
    
    # Update beam loading status
    beam_loading = warp_op.beam_loading
    beam_loading.status = "warped"
    db.commit()
    
    return {"message": "Warp operation completed"}

# Unload operation endpoints
@router.post("/unload-operation", response_model=UnloadOperationSchema)
async def create_unload_operation(unload_op: UnloadOperationCreate, db: Session = Depends(get_db)):
    beam_loading = db.query(BeamLoading).filter(BeamLoading.id == unload_op.beam_loading_id).first()
    if not beam_loading:
        raise HTTPException(status_code=404, detail="Beam loading not found")
    
    db_unload_op = UnloadOperation(**unload_op.dict())
    db.add(db_unload_op)
    db.commit()
    db.refresh(db_unload_op)
    
    beam_loading.status = "unloading"
    db.commit()
    
    return db_unload_op

@router.put("/unload-operation/{unload_op_id}/complete")
async def complete_unload_operation(
    unload_op_id: int,
    unload_weight: float,
    quality_check: str,
    notes: str = None,
    db: Session = Depends(get_db)
):
    unload_op = db.query(UnloadOperation).filter(UnloadOperation.id == unload_op_id).first()
    if not unload_op:
        raise HTTPException(status_code=404, detail="Unload operation not found")
    
    unload_op.unload_weight = unload_weight
    unload_op.quality_check = quality_check
    unload_op.notes = notes
    unload_op.end_time = datetime.utcnow()
    unload_op.status = "completed"
    db.commit()
    
    # Update beam loading status
    beam_loading = unload_op.beam_loading
    beam_loading.status = "completed"
    beam_loading.end_time = datetime.utcnow()
    db.commit()
    
    # Update plan status if all beam loadings completed
    plan = beam_loading.plan
    incomplete = db.query(BeamLoading).filter(
        BeamLoading.plan_id == plan.id,
        BeamLoading.status != "completed"
    ).count()
    if incomplete == 0:
        plan.status = "completed"
        db.commit()
    
    return {"message": "Unload operation completed"}

# Get beam loading progress for a plan
@router.get("/plan/{plan_id}/progress")
async def get_plan_progress(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    beam_loadings = db.query(BeamLoading).filter(BeamLoading.plan_id == plan_id).all()
    
    progress = {
        "plan": plan,
        "beam_loadings": beam_loadings,
        "total": len(beam_loadings),
        "completed": sum(1 for bl in beam_loadings if bl.status == "completed"),
        "in_progress": sum(1 for bl in beam_loadings if bl.status in ["loaded", "weighed", "warping", "unloading"])
    }
    
    return progress
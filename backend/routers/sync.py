import pyodbc
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import logging

from database import get_db
from models import SyncLog, Plan, BeamLoading, WarpOperation, UnloadOperation
from schemas import SyncRequest, SyncResponse
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# SQL Server connection
def get_sql_server_conn():
    if not settings.SQL_SERVER_CONNECTION_STRING:
        raise Exception("SQL Server connection string not configured")
    return pyodbc.connect(settings.SQL_SERVER_CONNECTION_STRING)

# Sync functions for each table
def sync_plan_to_sql_server(plan_id: int, db: Session, operation: str = "insert"):
    try:
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            return
        
        conn = get_sql_server_conn()
        cursor = conn.cursor()
        
        if operation == "insert":
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Plans WHERE plan_id = ?)
                INSERT INTO Plans (plan_id, machine_code, yarn_code, beam_size, number_of_ends, 
                                  scheduled_start, scheduled_end, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, plan.plan_id, plan.plan_id, plan.machine_code, plan.yarn_code, plan.beam_size,
               plan.number_of_ends, plan.scheduled_start, plan.scheduled_end, plan.status,
               plan.created_at, plan.updated_at)
        elif operation == "update":
            cursor.execute("""
                UPDATE Plans SET 
                    yarn_code = ?, beam_size = ?, number_of_ends = ?,
                    scheduled_start = ?, scheduled_end = ?, status = ?,
                    updated_at = ?
                WHERE plan_id = ?
            """, plan.yarn_code, plan.beam_size, plan.number_of_ends,
               plan.scheduled_start, plan.scheduled_end, plan.status,
               plan.updated_at, plan.plan_id)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # Update sync log
        sync_log = SyncLog(
            table_name="plans",
            record_id=plan_id,
            operation=operation,
            sync_status="synced",
            synced_at=datetime.utcnow()
        )
        db.add(sync_log)
        db.commit()
        
        # Update plan sync status
        plan.erp_sync_status = "synced"
        db.commit()
        
        return True
    except Exception as e:
        logger.error(f"Error syncing plan {plan_id}: {str(e)}")
        # Log sync failure
        sync_log = SyncLog(
            table_name="plans",
            record_id=plan_id,
            operation=operation,
            sync_status="failed",
            error_message=str(e),
            created_at=datetime.utcnow()
        )
        db.add(sync_log)
        db.commit()
        return False

def sync_beam_loading_to_sql_server(beam_loading_id: int, db: Session, operation: str = "insert"):
    try:
        beam_loading = db.query(BeamLoading).filter(BeamLoading.id == beam_loading_id).first()
        if not beam_loading:
            return
        
        conn = get_sql_server_conn()
        cursor = conn.cursor()
        
        if operation == "insert":
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM BeamLoadings WHERE id = ?)
                INSERT INTO BeamLoadings (id, beam_code, plan_id, operator_id, machine_code,
                                         empty_beam_weight, actual_empty_beam_weight, loaded_beam_weight,
                                         net_yarn_weight, load_cell_reading, status, start_time, end_time,
                                         created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, beam_loading.id, beam_loading.id, beam_loading.beam_code, beam_loading.plan_id,
               beam_loading.operator_id, beam_loading.machine_code, beam_loading.empty_beam_weight,
               beam_loading.actual_empty_beam_weight, beam_loading.loaded_beam_weight,
               beam_loading.net_yarn_weight, beam_loading.load_cell_reading, beam_loading.status,
               beam_loading.start_time, beam_loading.end_time, beam_loading.created_at,
               beam_loading.updated_at)
        elif operation == "update":
            cursor.execute("""
                UPDATE BeamLoadings SET 
                    actual_empty_beam_weight = ?, loaded_beam_weight = ?,
                    net_yarn_weight = ?, load_cell_reading = ?, status = ?,
                    end_time = ?, updated_at = ?
                WHERE id = ?
            """, beam_loading.actual_empty_beam_weight, beam_loading.loaded_beam_weight,
               beam_loading.net_yarn_weight, beam_loading.load_cell_reading, beam_loading.status,
               beam_loading.end_time, beam_loading.updated_at, beam_loading.id)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # Update sync log
        sync_log = SyncLog(
            table_name="beam_loadings",
            record_id=beam_loading_id,
            operation=operation,
            sync_status="synced",
            synced_at=datetime.utcnow()
        )
        db.add(sync_log)
        db.commit()
        
        return True
    except Exception as e:
        logger.error(f"Error syncing beam loading {beam_loading_id}: {str(e)}")
        sync_log = SyncLog(
            table_name="beam_loadings",
            record_id=beam_loading_id,
            operation=operation,
            sync_status="failed",
            error_message=str(e),
            created_at=datetime.utcnow()
        )
        db.add(sync_log)
        db.commit()
        return False

def sync_warp_operation_to_sql_server(warp_op_id: int, db: Session, operation: str = "insert"):
    try:
        warp_op = db.query(WarpOperation).filter(WarpOperation.id == warp_op_id).first()
        if not warp_op:
            return
        
        conn = get_sql_server_conn()
        cursor = conn.cursor()
        
        cursor.execute("""
            IF NOT EXISTS (SELECT 1 FROM WarpOperations WHERE id = ?)
            INSERT INTO WarpOperations (id, beam_loading_id, warp_speed, tension, length_warped,
                                       start_time, end_time, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, warp_op.id, warp_op.id, warp_op.beam_loading_id, warp_op.warp_speed,
           warp_op.tension, warp_op.length_warped, warp_op.start_time, warp_op.end_time,
           warp_op.status, warp_op.created_at)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        sync_log = SyncLog(
            table_name="warp_operations",
            record_id=warp_op_id,
            operation=operation,
            sync_status="synced",
            synced_at=datetime.utcnow()
        )
        db.add(sync_log)
        db.commit()
        
        return True
    except Exception as e:
        logger.error(f"Error syncing warp operation {warp_op_id}: {str(e)}")
        sync_log = SyncLog(
            table_name="warp_operations",
            record_id=warp_op_id,
            operation=operation,
            sync_status="failed",
            error_message=str(e),
            created_at=datetime.utcnow()
        )
        db.add(sync_log)
        db.commit()
        return False

def sync_unload_operation_to_sql_server(unload_op_id: int, db: Session, operation: str = "insert"):
    try:
        unload_op = db.query(UnloadOperation).filter(UnloadOperation.id == unload_op_id).first()
        if not unload_op:
            return
        
        conn = get_sql_server_conn()
        cursor = conn.cursor()
        
        cursor.execute("""
            IF NOT EXISTS (SELECT 1 FROM UnloadOperations WHERE id = ?)
            INSERT INTO UnloadOperations (id, beam_loading_id, unload_weight, quality_check, notes,
                                         start_time, end_time, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, unload_op.id, unload_op.id, unload_op.beam_loading_id, unload_op.unload_weight,
           unload_op.quality_check, unload_op.notes, unload_op.start_time, unload_op.end_time,
           unload_op.status, unload_op.created_at)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        sync_log = SyncLog(
            table_name="unload_operations",
            record_id=unload_op_id,
            operation=operation,
            sync_status="synced",
            synced_at=datetime.utcnow()
        )
        db.add(sync_log)
        db.commit()
        
        return True
    except Exception as e:
        logger.error(f"Error syncing unload operation {unload_op_id}: {str(e)}")
        sync_log = SyncLog(
            table_name="unload_operations",
            record_id=unload_op_id,
            operation=operation,
            sync_status="failed",
            error_message=str(e),
            created_at=datetime.utcnow()
        )
        db.add(sync_log)
        db.commit()
        return False

# API endpoints
@router.post("/sync", response_model=SyncResponse)
async def sync_single_record(sync_request: SyncRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    sync_functions = {
        "plans": sync_plan_to_sql_server,
        "beam_loadings": sync_beam_loading_to_sql_server,
        "warp_operations": sync_warp_operation_to_sql_server,
        "unload_operations": sync_unload_operation_to_sql_server,
    }
    
    if sync_request.table_name not in sync_functions:
        raise HTTPException(status_code=400, detail=f"Unsupported table: {sync_request.table_name}")
    
    # Queue sync in background
    background_tasks.add_task(
        sync_functions[sync_request.table_name],
        sync_request.record_id,
        db
    )
    
    return SyncResponse(
        success=True,
        message=f"Sync queued for {sync_request.table_name} record {sync_request.record_id}"
    )

@router.post("/sync-all", response_model=SyncResponse)
async def sync_all_pending(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Find pending sync logs
    pending_syncs = db.query(SyncLog).filter(SyncLog.sync_status == "pending").all()
    
    # Also sync records that might not have sync logs yet
    # For example, plans with pending sync status
    pending_plans = db.query(Plan).filter(Plan.erp_sync_status == "pending").all()
    for plan in pending_plans:
        background_tasks.add_task(sync_plan_to_sql_server, plan.id, db)
    
    # Beam loadings without sync logs (simplified logic)
    recent_beam_loadings = db.query(BeamLoading).filter(
        BeamLoading.created_at > datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    ).all()
    for bl in recent_beam_loadings:
        # Check if already synced
        existing_log = db.query(SyncLog).filter(
            SyncLog.table_name == "beam_loadings",
            SyncLog.record_id == bl.id
        ).first()
        if not existing_log:
            background_tasks.add_task(sync_beam_loading_to_sql_server, bl.id, db)
    
    return SyncResponse(
        success=True,
        message=f"Sync queued for {len(pending_plans) + len(recent_beam_loadings)} records",
        synced_records=len(pending_plans) + len(recent_beam_loadings)
    )

@router.get("/sync-status")
async def get_sync_status(db: Session = Depends(get_db)):
    total = db.query(SyncLog).count()
    synced = db.query(SyncLog).filter(SyncLog.sync_status == "synced").count()
    failed = db.query(SyncLog).filter(SyncLog.sync_status == "failed").count()
    pending = db.query(SyncLog).filter(SyncLog.sync_status == "pending").count()
    
    return {
        "total": total,
        "synced": synced,
        "failed": failed,
        "pending": pending,
        "success_rate": (synced / total * 100) if total > 0 else 0
    }

@router.post("/retry-failed")
async def retry_failed_syncs(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    failed_syncs = db.query(SyncLog).filter(SyncLog.sync_status == "failed").all()
    
    for sync_log in failed_syncs:
        sync_functions = {
            "plans": sync_plan_to_sql_server,
            "beam_loadings": sync_beam_loading_to_sql_server,
            "warp_operations": sync_warp_operation_to_sql_server,
            "unload_operations": sync_unload_operation_to_sql_server,
        }
        
        if sync_log.table_name in sync_functions:
            background_tasks.add_task(
                sync_functions[sync_log.table_name],
                sync_log.record_id,
                db,
                sync_log.operation
            )
    
    return {"message": f"Retry queued for {len(failed_syncs)} failed syncs"}
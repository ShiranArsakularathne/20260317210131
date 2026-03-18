from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import logging
from sqlalchemy.orm import Session

from database import SessionLocal
from routers.sync import sync_all_pending
from config import settings

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

async def periodic_sync():
    """Periodic sync job that runs every SYNC_INTERVAL_MINUTES"""
    logger.info(f"Starting periodic sync at {datetime.utcnow()}")
    
    db = SessionLocal()
    try:
        # Import here to avoid circular imports
        from routers.sync import sync_all_pending
        
        # We need to simulate the sync_all_pending functionality
        # since we can't directly call the endpoint
        
        # Sync pending plans
        from models import Plan, BeamLoading, SyncLog
        from routers.sync import (
            sync_plan_to_sql_server,
            sync_beam_loading_to_sql_server,
            sync_warp_operation_to_sql_server,
            sync_unload_operation_to_sql_server
        )
        
        # Sync plans with pending status
        pending_plans = db.query(Plan).filter(Plan.erp_sync_status == "pending").all()
        for plan in pending_plans:
            try:
                sync_plan_to_sql_server(plan.id, db)
                logger.info(f"Synced plan {plan.id}")
            except Exception as e:
                logger.error(f"Failed to sync plan {plan.id}: {e}")
        
        # Sync recent beam loadings
        recent_beam_loadings = db.query(BeamLoading).filter(
            BeamLoading.created_at > datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        ).all()
        for bl in recent_beam_loadings:
            existing_log = db.query(SyncLog).filter(
                SyncLog.table_name == "beam_loadings",
                SyncLog.record_id == bl.id
            ).first()
            if not existing_log:
                try:
                    sync_beam_loading_to_sql_server(bl.id, db)
                    logger.info(f"Synced beam loading {bl.id}")
                except Exception as e:
                    logger.error(f"Failed to sync beam loading {bl.id}: {e}")
        
        # Retry failed syncs
        failed_syncs = db.query(SyncLog).filter(SyncLog.sync_status == "failed").all()
        for sync_log in failed_syncs:
            try:
                if sync_log.table_name == "plans":
                    sync_plan_to_sql_server(sync_log.record_id, db, sync_log.operation)
                elif sync_log.table_name == "beam_loadings":
                    sync_beam_loading_to_sql_server(sync_log.record_id, db, sync_log.operation)
                elif sync_log.table_name == "warp_operations":
                    sync_warp_operation_to_sql_server(sync_log.record_id, db, sync_log.operation)
                elif sync_log.table_name == "unload_operations":
                    sync_unload_operation_to_sql_server(sync_log.record_id, db, sync_log.operation)
                logger.info(f"Retried sync for {sync_log.table_name} {sync_log.record_id}")
            except Exception as e:
                logger.error(f"Failed to retry sync for {sync_log.table_name} {sync_log.record_id}: {e}")
        
        logger.info(f"Periodic sync completed at {datetime.utcnow()}")
        
    except Exception as e:
        logger.error(f"Error in periodic sync: {e}")
    finally:
        db.close()

def start_scheduler():
    """Start the scheduler with periodic sync job"""
    if not scheduler.running:
        # Add periodic sync job
        scheduler.add_job(
            periodic_sync,
            trigger=IntervalTrigger(minutes=settings.SYNC_INTERVAL_MINUTES),
            id="periodic_sync",
            name="Periodic sync to SQL Server",
            replace_existing=True
        )
        
        # Start the scheduler
        scheduler.start()
        logger.info(f"Scheduler started with {settings.SYNC_INTERVAL_MINUTES} minute interval")
        
        # Also run immediate sync on startup
        scheduler.add_job(
            periodic_sync,
            trigger="date",
            run_date=datetime.utcnow(),
            id="initial_sync",
            name="Initial sync on startup"
        )

def stop_scheduler():
    """Stop the scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
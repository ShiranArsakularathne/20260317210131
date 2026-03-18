import requests
from datetime import datetime, timedelta
from typing import List
import logging
from fastapi import APIRouter, HTTPException

from schemas import ERPPlanResponse, ERPBeamData
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# Mock ERP data for demonstration
MOCK_PLANS = {
    "MACH001": [
        {
            "plan_id": "PLAN001",
            "yarn_code": "YC001",
            "beam_size": 150.0,
            "number_of_ends": 1200,
            "scheduled_start": datetime.utcnow() + timedelta(hours=1),
            "scheduled_end": datetime.utcnow() + timedelta(hours=8)
        },
        {
            "plan_id": "PLAN002",
            "yarn_code": "YC002",
            "beam_size": 180.0,
            "number_of_ends": 1500,
            "scheduled_start": datetime.utcnow() + timedelta(hours=9),
            "scheduled_end": datetime.utcnow() + timedelta(hours=16)
        }
    ],
    "MACH002": [
        {
            "plan_id": "PLAN003",
            "yarn_code": "YC003",
            "beam_size": 200.0,
            "number_of_ends": 1800,
            "scheduled_start": datetime.utcnow() + timedelta(hours=2),
            "scheduled_end": datetime.utcnow() + timedelta(hours=10)
        }
    ]
}

MOCK_BEAM_DATA = {
    "BEAM001": {"beam_code": "BEAM001", "empty_beam_weight": 25.5, "yarn_code": "YC001"},
    "BEAM002": {"beam_code": "BEAM002", "empty_beam_weight": 28.0, "yarn_code": "YC002"},
    "BEAM003": {"beam_code": "BEAM003", "empty_beam_weight": 30.0, "yarn_code": "YC003"},
}

def fetch_plans_from_erp(machine_code: str) -> List[ERPPlanResponse]:
    """Fetch plans from ERP system for a specific machine"""
    try:
        if settings.ERP_API_URL and settings.ERP_API_KEY:
            # Real ERP API call
            headers = {"Authorization": f"Bearer {settings.ERP_API_KEY}"}
            response = requests.get(
                f"{settings.ERP_API_URL}/plans",
                params={"machine_code": machine_code},
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            plans_data = response.json()
            
            return [
                ERPPlanResponse(**plan_data) 
                for plan_data in plans_data.get("plans", [])
            ]
        else:
            # Mock data for development
            logger.info(f"Using mock ERP data for machine {machine_code}")
            plans = MOCK_PLANS.get(machine_code, [])
            return [ERPPlanResponse(**plan) for plan in plans]
            
    except requests.exceptions.RequestException as e:
        logger.error(f"ERP API error for machine {machine_code}: {e}")
        # Fall back to mock data
        plans = MOCK_PLANS.get(machine_code, [])
        return [ERPPlanResponse(**plan) for plan in plans]
    except Exception as e:
        logger.error(f"Error fetching plans from ERP: {e}")
        return []

def fetch_beam_data_from_erp(beam_code: str) -> ERPBeamData:
    """Fetch beam data from ERP system"""
    try:
        if settings.ERP_API_URL and settings.ERP_API_KEY:
            # Real ERP API call
            headers = {"Authorization": f"Bearer {settings.ERP_API_KEY}"}
            response = requests.get(
                f"{settings.ERP_API_URL}/beams/{beam_code}",
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            beam_data = response.json()
            
            return ERPBeamData(**beam_data)
        else:
            # Mock data for development
            logger.info(f"Using mock ERP data for beam {beam_code}")
            beam_data = MOCK_BEAM_DATA.get(beam_code, {
                "beam_code": beam_code,
                "empty_beam_weight": 25.0,
                "yarn_code": "YC000"
            })
            return ERPBeamData(**beam_data)
            
    except requests.exceptions.RequestException as e:
        logger.error(f"ERP API error for beam {beam_code}: {e}")
        # Fall back to mock data
        beam_data = MOCK_BEAM_DATA.get(beam_code, {
            "beam_code": beam_code,
            "empty_beam_weight": 25.0,
            "yarn_code": "YC000"
        })
        return ERPBeamData(**beam_data)
    except Exception as e:
        logger.error(f"Error fetching beam data from ERP: {e}")
        return ERPBeamData(
            beam_code=beam_code,
            empty_beam_weight=25.0,
            yarn_code="YC000"
        )

@router.get("/plans/{machine_code}", response_model=List[ERPPlanResponse])
async def get_erp_plans(machine_code: str):
    """API endpoint to get plans from ERP for a machine"""
    plans = fetch_plans_from_erp(machine_code)
    if not plans:
        raise HTTPException(status_code=404, detail=f"No plans found for machine {machine_code}")
    return plans

@router.get("/beams/{beam_code}", response_model=ERPBeamData)
async def get_erp_beam_data(beam_code: str):
    """API endpoint to get beam data from ERP"""
    beam_data = fetch_beam_data_from_erp(beam_code)
    return beam_data

@router.post("/sync-plan/{plan_id}")
async def sync_plan_to_erp(plan_id: str):
    """Sync plan completion to ERP system"""
    try:
        if settings.ERP_API_URL and settings.ERP_API_KEY:
            headers = {"Authorization": f"Bearer {settings.ERP_API_KEY}"}
            # In real implementation, you would fetch plan data from local DB
            # and send it to ERP
            payload = {
                "plan_id": plan_id,
                "status": "completed",
                "completion_time": datetime.utcnow().isoformat()
            }
            response = requests.post(
                f"{settings.ERP_API_URL}/plans/{plan_id}/complete",
                json=payload,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            return {"message": f"Plan {plan_id} synced to ERP successfully"}
        else:
            logger.info(f"Mock sync to ERP for plan {plan_id}")
            return {"message": f"Plan {plan_id} would be synced to ERP in production"}
            
    except requests.exceptions.RequestException as e:
        logger.error(f"ERP sync error for plan {plan_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync plan to ERP: {e}")
    except Exception as e:
        logger.error(f"Error syncing plan to ERP: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")

@router.get("/health")
async def erp_health():
    """Check ERP API connectivity"""
    try:
        if settings.ERP_API_URL and settings.ERP_API_KEY:
            headers = {"Authorization": f"Bearer {settings.ERP_API_KEY}"}
            response = requests.get(
                f"{settings.ERP_API_URL}/health",
                headers=headers,
                timeout=5
            )
            response.raise_for_status()
            return {"status": "connected", "erp_system": "online"}
        else:
            return {"status": "mock_mode", "erp_system": "using_mock_data"}
    except requests.exceptions.RequestException as e:
        logger.error(f"ERP health check failed: {e}")
        return {"status": "disconnected", "erp_system": "offline", "error": str(e)}
    except Exception as e:
        logger.error(f"ERP health check error: {e}")
        return {"status": "error", "erp_system": "unknown", "error": str(e)}
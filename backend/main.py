from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from database import engine, Base
from routers import auth, wrp, sync, erp, devices
from scheduler import start_scheduler
from config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MES System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(wrp.router, prefix="/api/wrp", tags=["WRP"])
app.include_router(sync.router, prefix="/api/sync", tags=["Synchronization"])
app.include_router(erp.router, prefix="/api/erp", tags=["ERP"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])

@app.on_event("startup")
async def startup_event():
    # Start the scheduler for periodic sync
    start_scheduler()

@app.get("/")
async def root():
    return {"message": "MES System API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
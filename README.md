# MES System for Elastic Manufacturer

A comprehensive Manufacturing Execution System (MES) designed for elastic manufacturing, featuring touch panel interfaces, local SQLite databases with central SQL Server synchronization, and integration with PLC, RFID, and barcode scanning devices.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Touch Panel (Linux)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   Frontend  │  │   Backend   │  │   Nginx Proxy    │   │
│  │  (React)    │  │  (FastAPI)  │  │                  │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
│         │                │                      │          │
│         └────────────────┼──────────────────────┘          │
│                          │                                 │
│                  ┌──────────────┐                         │
│                  │  SQLite DB   │  (Local Database)       │
│                  └──────────────┘                         │
│                          │                                 │
├──────────────────────────┼─────────────────────────────────┤
│                    Every 20 minutes                        │
│                    + Event-based                           │
│                          │                                 │
│                  ┌──────────────┐                         │
│                  │ SQL Server   │  (Central Database)     │
│                  └──────────────┘                         │
│                          │                                 │
├──────────────────────────┼─────────────────────────────────┤
│                    ERP System                              │
│                    (API Integration)                       │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Core Functionality
- **User Authentication**: Standard login + RFID login support
- **Modular Interface**: Sidebar navigation with modules (WRP, LOOM, RANGE, EXHST, PACK, INSPC, USERS)
- **WRP Module**: Complete warp preparation workflow
  - Beam Loading (barcode scanning, plan retrieval from ERP)
  - Warp Operation (real-time monitoring, parameter control)
  - Unload Operation (quality checks, final weighing)

### Database Management
- **Local SQLite Database**: Each touch panel has its own database
- **Central SQL Server**: Cloud/on-premise central database
- **Automatic Sync**: Every 20 minutes + event-based synchronization
- **Conflict Resolution**: Local-first with queued central updates

### Device Integration
- **PLC Integration**: Modbus TCP communication for load cell readings
- **RFID Reader**: Employee authentication and asset tracking
- **Barcode Scanner**: Beam and machine identification
- **Real-time Monitoring**: WebSocket connections for live data

### Deployment
- **Docker-based**: Easy deployment on Linux touch panels
- **Nginx Reverse Proxy**: Localhost:8000 backend, port 80 frontend
- **Auto-restart**: Daily restart with latest code from Git
- **Cron Jobs**: Automated database synchronization

## Project Structure

```
mes-system/
├── backend/                 # FastAPI backend
│   ├── routers/            # API endpoints
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── database.py         # Database configuration
│   ├── scheduler.py        # Periodic sync scheduler
│   ├── main.py            # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # Backend Dockerfile
├── frontend/              # React frontend
│   ├── src/
│   │   ├── pages/         # Application pages
│   │   ├── components/    # Reusable components
│   │   ├── stores/        # Zustand state management
│   │   └── App.tsx       # Main application
│   ├── package.json       # Node.js dependencies
│   ├── vite.config.ts    # Build configuration
│   └── Dockerfile        # Frontend Dockerfile
├── docker-compose.yml     # Multi-container orchestration
├── scripts/              # Deployment scripts
├── .env.example          # Environment variables template
└── README.md            # This file
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- Linux-based touch panel

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-company/mes-system.git
   cd mes-system
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Deploy the application**
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh deploy
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Default Credentials
- Username: `admin`
- Password: `admin`

## Module Details

### WRP Module Workflow

#### 1. Beam Loading
- Scan machine barcode
- Retrieve available plans from ERP
- Select production plan
- Scan beam barcode
- Verify empty beam weight (from master data)
- Edit weight if needed
- Record load cell readings from PLC

#### 2. Warp Operation
- Select loaded beam
- Set warp speed and tension parameters
- Start warp operation
- Real-time monitoring of speed, tension, and progress
- Record length warped
- Complete warp operation

#### 3. Unload Operation
- Select warped beam
- Record unload weight
- Perform quality checks
- Add notes and observations
- Complete unload operation
- Update plan status

## Device Configuration

### PLC Configuration
```bash
PLC_HOST=localhost
PLC_PORT=502
```

### RFID Reader
```bash
RFID_SERIAL_PORT=/dev/ttyUSB0
```

### Barcode Scanner
```bash
BARCODE_SERIAL_PORT=/dev/ttyUSB1
```

## Database Synchronization

### Sync Strategy
1. **Periodic Sync**: Every 20 minutes, all pending changes are synced
2. **Event-based Sync**: Immediate sync on critical operations
3. **Queue Mechanism**: Failed syncs are queued and retried
4. **Conflict Resolution**: Local-first, with timestamp-based resolution

### Sync Tables
- Plans (from ERP)
- Beam Loadings
- Warp Operations
- Unload Operations
- Device Readings
- Sync Logs

## Deployment to Touch Panels

### Daily Update Process
Each touch panel should be configured to:
1. Restart daily (cron job)
2. Pull latest code from Git
3. Rebuild Docker images
4. Restart containers

### Sample Cron Job
```bash
# Daily restart at 2 AM
0 2 * * * /path/to/mes-system/scripts/deploy.sh update
```

## API Documentation

### Authentication
- `POST /api/auth/token` - Login with username/password
- `POST /api/auth/rfid-login` - Login with RFID tag
- `GET /api/auth/me` - Get current user info

### WRP Module
- `GET /api/wrp/machines/{code}/plans` - Get plans for machine
- `POST /api/wrp/beam-loading` - Create beam loading record
- `POST /api/wrp/warp-operation` - Create warp operation
- `POST /api/wrp/unload-operation` - Create unload operation

### Sync Management
- `POST /api/sync/sync-all` - Sync all pending changes
- `GET /api/sync/sync-status` - Get sync status
- `POST /api/sync/retry-failed` - Retry failed syncs

### Device Management
- `GET /api/devices/status` - Get device connection status
- `GET /api/devices/plc/read/{address}` - Read PLC register
- `GET /api/devices/rfid/read` - Read RFID tag
- `GET /api/devices/barcode/read` - Read barcode
- `WS /api/devices/ws` - WebSocket for real-time data

## Troubleshooting

### Common Issues

1. **Database Sync Fails**
   - Check SQL Server connectivity
   - Verify connection string in .env
   - Check sync logs at `/api/sync/sync-status`

2. **Devices Not Connecting**
   - Verify serial port permissions
   - Check device configuration in .env
   - Restart device services

3. **Application Not Starting**
   - Check Docker logs: `docker-compose logs`
   - Verify port availability
   - Check environment variables

### Logs Location
- Docker logs: `docker-compose logs -f`
- Application logs: Container stdout/stderr
- Sync logs: SQLite database `sync_logs` table

## Development

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
cd backend
pytest
```

## License

Proprietary - All rights reserved.

## Support

For technical support, contact:
- Email: support@your-company.com
- Phone: +1 (555) 123-4567
- Documentation: https://docs.your-company.com/mes

-I have added this line just to check git commit
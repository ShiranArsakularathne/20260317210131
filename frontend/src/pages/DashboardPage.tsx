import { Box, Grid, Paper, Typography, Card, CardContent, LinearProgress } from '@mui/material'
import {
  Factory as FactoryIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { useAuthStore } from '../stores/authStore'

// Mock data for dashboard
const machineStatus = [
  { id: 1, name: 'WRP Machine 1', status: 'running', production: 85 },
  { id: 2, name: 'WRP Machine 2', status: 'idle', production: 0 },
  { id: 3, name: 'WRP Machine 3', status: 'maintenance', production: 0 },
  { id: 4, name: 'LOOM Machine 1', status: 'running', production: 92 },
  { id: 5, name: 'LOOM Machine 2', status: 'running', production: 78 },
]

const recentActivities = [
  { id: 1, action: 'Beam Loading', machine: 'WRP-001', user: 'Operator 1', time: '10:30 AM' },
  { id: 2, action: 'Warp Operation', machine: 'WRP-001', user: 'Operator 1', time: '11:45 AM' },
  { id: 3, action: 'Unload', machine: 'WRP-001', user: 'Operator 1', time: '1:15 PM' },
  { id: 4, action: 'Quality Check', machine: 'INSPC-001', user: 'Inspector 1', time: '2:30 PM' },
  { id: 5, action: 'Beam Loading', machine: 'WRP-002', user: 'Operator 2', time: '3:00 PM' },
]

const statsCards = [
  { title: 'Active Machines', value: '3/5', icon: <FactoryIcon />, color: '#1976d2' },
  { title: 'Completed Today', value: '24', icon: <CheckCircleIcon />, color: '#2e7d32' },
  { title: 'In Progress', value: '8', icon: <ScheduleIcon />, color: '#ed6c02' },
  { title: 'Issues', value: '2', icon: <ErrorIcon />, color: '#d32f2f' },
]

const columns: GridColDef[] = [
  { field: 'action', headerName: 'Action', width: 150 },
  { field: 'machine', headerName: 'Machine', width: 120 },
  { field: 'user', headerName: 'User', width: 120 },
  { field: 'time', headerName: 'Time', width: 120 },
]

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Welcome back, {user?.full_name || user?.username}! Here's an overview of your manufacturing operations.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {statsCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: card.color, mr: 1 }}>
                    {card.icon}
                  </Box>
                  <Typography variant="h6" component="div">
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Machine Status */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Machine Status
            </Typography>
            {machineStatus.map((machine) => (
              <Box key={machine.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">{machine.name}</Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: machine.status === 'running' ? '#2e7d32' : 
                            machine.status === 'maintenance' ? '#ed6c02' : '#757575',
                      fontWeight: 'bold'
                    }}
                  >
                    {machine.status.toUpperCase()}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={machine.production}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: machine.status === 'running' ? '#2e7d32' : '#757575'
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Production: {machine.production}%
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Recent Activities
            </Typography>
            <Box sx={{ height: 400 }}>
              <DataGrid
                rows={recentActivities}
                columns={columns}
                pageSizeOptions={[5]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 5 },
                  },
                }}
                disableRowSelectionOnClick
                sx={{ border: 0 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* System Info */}
      <Paper sx={{ p: 3, mt: 3, borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          System Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Local Database:</strong> SQLite (on each touch panel)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Central Database:</strong> SQL Server (cloud/on-premise)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Sync Interval:</strong> Every 20 minutes
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Connected Devices:</strong> PLC, RFID, Barcode Scanner
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>ERP Integration:</strong> Active
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Last Sync:</strong> 15 minutes ago
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
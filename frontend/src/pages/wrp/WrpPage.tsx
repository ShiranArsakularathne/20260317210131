import { Box, Typography, Paper, Grid, Button, Card, CardContent } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import {
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Timeline as ProgressIcon,
  Info as InfoIcon,
} from '@mui/icons-material'

export default function WrpPage() {
  const navigate = useNavigate()

  const steps = [
    {
      title: 'Beam Loading',
      description: 'Load beams onto the machine, scan barcodes, and record weights',
      status: 'pending',
      path: '/wrp/beam-loading',
      icon: <StartIcon fontSize="large" />,
      color: '#1976d2',
    },
    {
      title: 'Warp',
      description: 'Monitor warp operation, speed, tension, and length',
      status: 'pending',
      path: '/wrp/warp',
      icon: <ProgressIcon fontSize="large" />,
      color: '#ed6c02',
    },
    {
      title: 'Unload',
      description: 'Unload completed beams, quality check, and final weighing',
      status: 'pending',
      path: '/wrp/unload',
      icon: <CompleteIcon fontSize="large" />,
      color: '#2e7d32',
    },
  ]

  const activeJobs = [
    { id: 1, machine: 'WRP-001', plan: 'PLAN-001', progress: 65, status: 'Warping' },
    { id: 2, machine: 'WRP-002', plan: 'PLAN-002', progress: 30, status: 'Loading' },
    { id: 3, machine: 'WRP-003', plan: 'PLAN-003', progress: 0, status: 'Pending' },
  ]

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        WRP Module - Warp Preparation
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage the complete warp preparation process from beam loading to final unloading.
        Follow the sequential steps to ensure proper manufacturing workflow.
      </Typography>

      {/* Process Steps */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Process Steps
        </Typography>
        <Grid container spacing={3}>
          {steps.map((step, index) => (
            <Grid item xs={12} sm={4} key={step.title}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: 3,
                  borderLeft: `4px solid ${step.color}`,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: step.color, mr: 2 }}>
                      {step.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {step.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {step.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Step {index + 1} of 3
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(step.path)}
                      sx={{ bgcolor: step.color, '&:hover': { bgcolor: step.color, opacity: 0.9 } }}
                    >
                      Start
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Active Jobs */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Active Jobs
        </Typography>
        <Grid container spacing={2}>
          {activeJobs.map((job) => (
            <Grid item xs={12} md={4} key={job.id}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {job.machine}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Plan: {job.plan}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                      <Box
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e0e0e0',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${job.progress}%`,
                            backgroundColor: job.progress > 50 ? '#2e7d32' : 
                                          job.progress > 25 ? '#ed6c02' : '#1976d2',
                            borderRadius: 4,
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {job.progress}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Status: {job.status}
                    </Typography>
                    <Button size="small" startIcon={<InfoIcon />}>
                      Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/wrp/beam-loading')}
              sx={{ py: 1.5 }}
            >
              New Beam Loading
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/wrp/warp')}
              sx={{ py: 1.5 }}
            >
              Start Warp
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/wrp/unload')}
              sx={{ py: 1.5 }}
            >
              Unload Beam
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="contained"
              sx={{ py: 1.5 }}
            >
              View Reports
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
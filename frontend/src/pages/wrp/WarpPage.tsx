import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  IconButton,
  Slider,
  Divider,
  Chip,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Straighten as TensionIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'

interface BeamLoading {
  id: number
  beam_code: string
  plan_id: number
  machine_code: string
  empty_beam_weight: number
  actual_empty_beam_weight: number
  loaded_beam_weight: number
  net_yarn_weight: number
  status: string
}

interface WarpOperationForm {
  beamLoadingId: number
  warpSpeed: number
  tension: number
  lengthWarped: number
}

export default function WarpPage() {
  const navigate = useNavigate()
  const [beamLoadings, setBeamLoadings] = useState<BeamLoading[]>([])
  const [selectedBeam, setSelectedBeam] = useState<BeamLoading | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [warpInProgress, setWarpInProgress] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [currentTension, setCurrentTension] = useState(0)

  const { control, handleSubmit, setValue, reset } = useForm<WarpOperationForm>({
    defaultValues: {
      beamLoadingId: 0,
      warpSpeed: 100,
      tension: 50,
      lengthWarped: 0,
    }
  })

  // Timer for warp operation
  useEffect(() => {
    let interval: number | null = null
    if (warpInProgress) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
        // Simulate some variation in speed and tension
        setCurrentSpeed(prev => Math.max(80, Math.min(120, prev + (Math.random() - 0.5) * 5)))
        setCurrentTension(prev => Math.max(40, Math.min(60, prev + (Math.random() - 0.5) * 2)))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [warpInProgress])

  // Fetch beam loadings ready for warp
  useEffect(() => {
    fetchBeamLoadings()
  }, [])

  const fetchBeamLoadings = async () => {
    try {
      setLoading(true)
      // In real app, this would be an API call
      const mockData: BeamLoading[] = [
        {
          id: 1,
          beam_code: 'BEAM-001',
          plan_id: 1,
          machine_code: 'WRP-001',
          empty_beam_weight: 25.5,
          actual_empty_beam_weight: 25.5,
          loaded_beam_weight: 85.3,
          net_yarn_weight: 59.8,
          status: 'loaded',
        },
        {
          id: 2,
          beam_code: 'BEAM-002',
          plan_id: 2,
          machine_code: 'WRP-001',
          empty_beam_weight: 28.0,
          actual_empty_beam_weight: 28.2,
          loaded_beam_weight: 92.1,
          net_yarn_weight: 63.9,
          status: 'loaded',
        },
      ]
      setBeamLoadings(mockData.filter(bl => bl.status === 'loaded'))
      setError('')
    } catch (err: any) {
      setError('Failed to fetch beam loadings')
    } finally {
      setLoading(false)
    }
  }

  const handleBeamSelect = (beam: BeamLoading) => {
    setSelectedBeam(beam)
    setValue('beamLoadingId', beam.id)
    reset({ beamLoadingId: beam.id, warpSpeed: 100, tension: 50, lengthWarped: 0 })
  }

  const handleStartWarp = () => {
    if (!selectedBeam) {
      setError('Please select a beam first')
      return
    }
    setWarpInProgress(true)
    setElapsedTime(0)
    setCurrentSpeed(100)
    setCurrentTension(50)
    setSuccess('Warp operation started')
  }

  const handlePauseWarp = () => {
    setWarpInProgress(false)
    setSuccess('Warp operation paused')
  }

  const handleStopWarp = () => {
    setWarpInProgress(false)
    setSuccess('Warp operation stopped')
  }

  const onSubmit = async (data: WarpOperationForm) => {
    try {
      setLoading(true)
      setError('')
      
      const payload = {
        beam_loading_id: data.beamLoadingId,
        warp_speed: data.warpSpeed,
        tension: data.tension,
        length_warped: data.lengthWarped,
      }
      
      await axios.post('/api/wrp/warp-operation', payload)
      
      // Update the beam loading status
      await axios.put(`/api/warp-operation/${data.beamLoadingId}/complete`, {
        length_warped: data.lengthWarped,
      })
      
      setSuccess('Warp operation completed and recorded successfully!')
      setWarpInProgress(false)
      setSelectedBeam(null)
      fetchBeamLoadings()
      
      // Navigate to next step after delay
      setTimeout(() => {
        navigate('/wrp/unload')
      }, 2000)
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record warp operation')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/wrp')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Warp Operation
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Monitor and control the warp operation. Set speed and tension parameters, then start the process.
        Real-time monitoring of load cell readings and progress.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Available Beams */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Available Beams
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select a beam that has been loaded and is ready for warp operation.
            </Typography>

            {beamLoadings.length === 0 ? (
              <Alert severity="info">No beams available for warp operation</Alert>
            ) : (
              <Grid container spacing={2}>
                {beamLoadings.map((beam) => (
                  <Grid item xs={12} key={beam.id}>
                    <Card
                      variant={selectedBeam?.id === beam.id ? 'elevation' : 'outlined'}
                      elevation={selectedBeam?.id === beam.id ? 3 : 0}
                      onClick={() => handleBeamSelect(beam)}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 3,
                        },
                      }}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {beam.beam_code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Machine: {beam.machine_code}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption">
                            Net Yarn: {beam.net_yarn_weight?.toFixed(1)} kg
                          </Typography>
                          <Chip
                            label="Ready"
                            size="small"
                            color="success"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Warp Control Panel */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Warp Control Panel
            </Typography>

            {selectedBeam ? (
              <>
                {/* Selected Beam Info */}
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Beam Code</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedBeam.beam_code}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Machine</Typography>
                        <Typography variant="body1">{selectedBeam.machine_code}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Empty Weight</Typography>
                        <Typography variant="body1">{selectedBeam.actual_empty_beam_weight} kg</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Loaded Weight</Typography>
                        <Typography variant="body1">{selectedBeam.loaded_beam_weight} kg</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Real-time Metrics */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <TimelineIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">{formatTime(elapsedTime)}</Typography>
                        <Typography variant="caption" color="text.secondary">Elapsed Time</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <SpeedIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">{currentSpeed.toFixed(0)}</Typography>
                        <Typography variant="caption" color="text.secondary">Speed (m/min)</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <TensionIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">{currentTension.toFixed(1)}</Typography>
                        <Typography variant="caption" color="text.secondary">Tension (N)</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Control Buttons */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<StartIcon />}
                    onClick={handleStartWarp}
                    disabled={warpInProgress}
                    fullWidth
                  >
                    Start Warp
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<PauseIcon />}
                    onClick={handlePauseWarp}
                    disabled={!warpInProgress}
                    fullWidth
                  >
                    Pause
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={handleStopWarp}
                    disabled={!warpInProgress}
                    fullWidth
                  >
                    Stop
                  </Button>
                </Box>

                {/* Parameter Controls */}
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <SpeedIcon sx={{ mr: 1 }} /> Warp Speed
                      </Typography>
                      <Controller
                        name="warpSpeed"
                        control={control}
                        rules={{ required: 'Warp speed is required', min: 50, max: 150 }}
                        render={({ field }) => (
                          <>
                            <Slider
                              {...field}
                              min={50}
                              max={150}
                              step={1}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(value) => `${value} m/min`}
                              disabled={warpInProgress}
                            />
                            <TextField
                              {...field}
                              type="number"
                              fullWidth
                              InputProps={{
                                endAdornment: <Typography variant="caption">m/min</Typography>,
                              }}
                              disabled={warpInProgress}
                            />
                          </>
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <TensionIcon sx={{ mr: 1 }} /> Tension
                      </Typography>
                      <Controller
                        name="tension"
                        control={control}
                        rules={{ required: 'Tension is required', min: 20, max: 100 }}
                        render={({ field }) => (
                          <>
                            <Slider
                              {...field}
                              min={20}
                              max={100}
                              step={0.5}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(value) => `${value} N`}
                              disabled={warpInProgress}
                            />
                            <TextField
                              {...field}
                              type="number"
                              fullWidth
                              InputProps={{
                                endAdornment: <Typography variant="caption">N</Typography>,
                              }}
                              disabled={warpInProgress}
                            />
                          </>
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Controller
                        name="lengthWarped"
                        control={control}
                        rules={{ required: 'Length warped is required', min: 0 }}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Length Warped (meters)"
                            type="number"
                            error={!!error}
                            helperText={error?.message}
                            InputProps={{
                              endAdornment: <Typography variant="caption">m</Typography>,
                            }}
                            disabled={warpInProgress}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                          variant="outlined"
                          onClick={() => navigate('/wrp')}
                          disabled={loading || warpInProgress}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={loading || warpInProgress}
                          sx={{ minWidth: 150 }}
                        >
                          Complete Warp
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              </>
            ) : (
              <Alert severity="info">
                Please select a beam from the available beams list to start warp operation.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {loading && <LinearProgress sx={{ mt: 3 }} />}
    </Box>
  )
}
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
  Chip,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Rating,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Scale as ScaleIcon,
  Assignment as AssignmentIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
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

interface UnloadOperationForm {
  beamLoadingId: number
  unloadWeight: number
  qualityCheck: string
  notes: string
}

export default function UnloadPage() {
  const navigate = useNavigate()
  const [beamLoadings, setBeamLoadings] = useState<BeamLoading[]>([])
  const [selectedBeam, setSelectedBeam] = useState<BeamLoading | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [weightDifference, setWeightDifference] = useState(0)

  const { control, handleSubmit, setValue, watch, reset } = useForm<UnloadOperationForm>({
    defaultValues: {
      beamLoadingId: 0,
      unloadWeight: 0,
      qualityCheck: 'pass',
      notes: '',
    }
  })

  const unloadWeight = watch('unloadWeight')
  const qualityCheck = watch('qualityCheck')

  // Fetch beam loadings ready for unload (status = 'warped')
  useEffect(() => {
    fetchBeamLoadings()
  }, [])

  // Calculate weight difference when unload weight changes
  useEffect(() => {
    if (selectedBeam && unloadWeight > 0) {
      const diff = unloadWeight - selectedBeam.loaded_beam_weight
      setWeightDifference(diff)
    }
  }, [unloadWeight, selectedBeam])

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
          status: 'warped',
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
          status: 'warped',
        },
      ]
      setBeamLoadings(mockData.filter(bl => bl.status === 'warped'))
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
    setValue('unloadWeight', beam.loaded_beam_weight) // Default to loaded weight
    reset({
      beamLoadingId: beam.id,
      unloadWeight: beam.loaded_beam_weight,
      qualityCheck: 'pass',
      notes: '',
    })
  }

  const handleScanWeight = () => {
    if (!selectedBeam) return
    
    // Simulate weight scan from load cells
    const simulatedWeight = selectedBeam.loaded_beam_weight + (Math.random() - 0.5) * 0.2
    setValue('unloadWeight', parseFloat(simulatedWeight.toFixed(2)))
  }

  const onSubmit = async (data: UnloadOperationForm) => {
    try {
      setLoading(true)
      setError('')
      
      const payload = {
        beam_loading_id: data.beamLoadingId,
        unload_weight: data.unloadWeight,
        quality_check: data.qualityCheck,
        notes: data.notes,
      }
      
      await axios.post('/api/wrp/unload-operation', payload)
      
      // Complete the unload operation
      await axios.put(`/api/unload-operation/${data.beamLoadingId}/complete`, {
        unload_weight: data.unloadWeight,
        quality_check: data.qualityCheck,
        notes: data.notes,
      })
      
      setSuccess('Unload operation completed successfully!')
      setSelectedBeam(null)
      fetchBeamLoadings()
      
      // Navigate back to WRP main page after delay
      setTimeout(() => {
        navigate('/wrp')
      }, 2000)
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record unload operation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/wrp')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Unload Operation
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Unload completed beams, perform quality checks, and record final weights.
        Compare with initial loaded weights to identify any discrepancies.
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
        {/* Available Beams for Unload */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Completed Warp Beams
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select a beam that has completed warp operation and is ready for unloading.
            </Typography>

            {beamLoadings.length === 0 ? (
              <Alert severity="info">No beams available for unload operation</Alert>
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
                            Loaded: {beam.loaded_beam_weight} kg
                          </Typography>
                          <Chip
                            label="Warped"
                            size="small"
                            color="warning"
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

        {/* Unload and Quality Check */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Unload and Quality Check
            </Typography>

            {selectedBeam ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Selected Beam Summary */}
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Beam Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Beam Code</Typography>
                        <Typography variant="body1">{selectedBeam.beam_code}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Machine</Typography>
                        <Typography variant="body1">{selectedBeam.machine_code}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Initial Weight</Typography>
                        <Typography variant="body1">{selectedBeam.actual_empty_beam_weight} kg</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Loaded Weight</Typography>
                        <Typography variant="body1">{selectedBeam.loaded_beam_weight} kg</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Net Yarn Weight</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {selectedBeam.net_yarn_weight?.toFixed(2)} kg
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Unload Weight */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <ScaleIcon sx={{ mr: 1 }} /> Unload Weight
                    </Typography>
                    <Controller
                      name="unloadWeight"
                      control={control}
                      rules={{ 
                        required: 'Unload weight is required',
                        min: { value: 0.1, message: 'Weight must be positive' }
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Unload Weight (kg)"
                          type="number"
                          error={!!error}
                          helperText={error?.message}
                          InputProps={{
                            endAdornment: (
                              <Button
                                size="small"
                                onClick={handleScanWeight}
                                startIcon={<ScaleIcon />}
                                sx={{ mr: -1 }}
                              >
                                Scan
                              </Button>
                            ),
                          }}
                        />
                      )}
                    />

                    {unloadWeight > 0 && selectedBeam && (
                      <Alert 
                        severity={Math.abs(weightDifference) < 0.5 ? "success" : "warning"} 
                        sx={{ mt: 2 }}
                      >
                        Difference from loaded weight: {weightDifference.toFixed(2)} kg
                        {Math.abs(weightDifference) < 0.5 ? 
                          " (Within tolerance ✓)" : 
                          " (Outside tolerance - check required)"}
                      </Alert>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon sx={{ mr: 1 }} /> Quality Check
                    </Typography>
                    <Controller
                      name="qualityCheck"
                      control={control}
                      rules={{ required: 'Quality check is required' }}
                      render={({ field }) => (
                        <FormControl component="fieldset">
                          <RadioGroup {...field} row>
                            <FormControlLabel
                              value="pass"
                              control={<Radio color="success" />}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <ThumbUpIcon sx={{ mr: 1, color: 'success.main' }} />
                                  Pass
                                </Box>
                              }
                            />
                            <FormControlLabel
                              value="fail"
                              control={<Radio color="error" />}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <ThumbDownIcon sx={{ mr: 1, color: 'error.main' }} />
                                  Fail
                                </Box>
                              }
                            />
                          </RadioGroup>
                        </FormControl>
                      )}
                    />

                    {qualityCheck === 'fail' && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        Beam failed quality check. Please add notes explaining the issue.
                      </Alert>
                    )}
                  </Grid>
                </Grid>

                {/* Quality Parameters */}
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Quality Parameters
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Surface Quality</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating size="small" value={4} readOnly />
                        <Typography variant="body2" sx={{ ml: 1 }}>Good</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Tension Uniformity</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating size="small" value={5} readOnly />
                        <Typography variant="body2" sx={{ ml: 1 }}>Excellent</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Ends Alignment</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating size="small" value={3} readOnly />
                        <Typography variant="body2" sx={{ ml: 1 }}>Average</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Notes */}
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Notes"
                      multiline
                      rows={3}
                      placeholder="Add any notes about the unload operation, quality issues, or special instructions..."
                      sx={{ mb: 3 }}
                    />
                  )}
                />

                {/* Summary and Actions */}
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Operation Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Beam Code</Typography>
                        <Typography variant="body1">{selectedBeam.beam_code}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Quality Status</Typography>
                        <Chip
                          label={qualityCheck === 'pass' ? 'PASS' : 'FAIL'}
                          color={qualityCheck === 'pass' ? 'success' : 'error'}
                          size="small"
                          icon={qualityCheck === 'pass' ? <CheckIcon /> : <ErrorIcon />}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Weight Difference</Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: Math.abs(weightDifference) < 0.5 ? 'success.main' : 'warning.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {weightDifference.toFixed(2)} kg
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Final Net Weight</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {((unloadWeight || 0) - selectedBeam.actual_empty_beam_weight).toFixed(2)} kg
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedBeam(null)
                      reset()
                    }}
                    disabled={loading}
                  >
                    Select Different Beam
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={<CheckIcon />}
                    sx={{ minWidth: 150 }}
                  >
                    {loading ? 'Processing...' : 'Complete Unload'}
                  </Button>
                </Box>
              </form>
            ) : (
              <Alert severity="info">
                Please select a beam from the completed warp beams list to proceed with unload operation.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {loading && <LinearProgress sx={{ mt: 3 }} />}
    </Box>
  )
}
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  QrCodeScanner as ScannerIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'

interface Plan {
  id: number
  plan_id: string
  yarn_code: string
  beam_size: number
  number_of_ends: number
  scheduled_start: string
  scheduled_end: string
  status: string
}

interface BeamLoadingForm {
  machineCode: string
  beamCode: string
  planId: string
  emptyBeamWeight: number
  actualEmptyBeamWeight: number
  loadCellReading: number
}

export default function BeamLoadingPage() {
  const navigate = useNavigate()
  const [machineCode, setMachineCode] = useState('')
  const [scannedBeamCode, setScannedBeamCode] = useState('')
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { control, handleSubmit, setValue, watch, reset } = useForm<BeamLoadingForm>({
    defaultValues: {
      machineCode: '',
      beamCode: '',
      planId: '',
      emptyBeamWeight: 0,
      actualEmptyBeamWeight: 0,
      loadCellReading: 0,
    }
  })

  const actualEmptyBeamWeight = watch('actualEmptyBeamWeight')
  const loadCellReading = watch('loadCellReading')

  // Fetch plans when machine code changes
  useEffect(() => {
    if (machineCode.length >= 3) {
      fetchPlans(machineCode)
    }
  }, [machineCode])

  // Auto-calculate if we have both values
  useEffect(() => {
    if (actualEmptyBeamWeight > 0 && loadCellReading > 0) {
      const diff = Math.abs(actualEmptyBeamWeight - loadCellReading)
      if (diff < 0.5) {
        setValue('actualEmptyBeamWeight', loadCellReading)
      }
    }
  }, [actualEmptyBeamWeight, loadCellReading, setValue])

  const fetchPlans = async (code: string) => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/wrp/machines/${code}/plans`)
      setPlans(response.data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch plans')
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  const handleMachineCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setMachineCode(value)
  }

  const handleBeamCodeScan = () => {
    // Simulate barcode scan
    const mockBeamCode = `BEAM-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
    setScannedBeamCode(mockBeamCode)
    setValue('beamCode', mockBeamCode)
    
    // Simulate fetching beam data from ERP
    setValue('emptyBeamWeight', 25.5) // Mock data
  }

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan)
    setValue('planId', plan.id.toString())
  }

  const onSubmit = async (data: BeamLoadingForm) => {
    try {
      setLoading(true)
      setError('')
      
      const payload = {
        beam_code: data.beamCode,
        plan_id: parseInt(data.planId),
        operator_id: 1, // TODO: Get from auth
        machine_code: machineCode,
        empty_beam_weight: data.emptyBeamWeight,
        actual_empty_beam_weight: data.actualEmptyBeamWeight,
        load_cell_reading: data.loadCellReading,
      }
      
      await axios.post('/api/wrp/beam-loading', payload)
      
      setSuccess('Beam loading recorded successfully!')
      reset()
      setMachineCode('')
      setScannedBeamCode('')
      setSelectedPlan(null)
      setPlans([])
      
      // Navigate to next step after delay
      setTimeout(() => {
        navigate('/wrp/warp')
      }, 2000)
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record beam loading')
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
          Beam Loading
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Scan machine barcode, retrieve plans from ERP, select a job, then scan beam barcode to load.
        Use load cell readings to verify empty beam weight.
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Step 1: Machine Code */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <Chip label="1" size="small" sx={{ mr: 1 }} />
                Machine Identification
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <Controller
                    name="machineCode"
                    control={control}
                    rules={{ required: 'Machine code is required' }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Machine Code"
                        placeholder="Scan or enter machine barcode"
                        value={machineCode}
                        onChange={(e) => {
                          field.onChange(e)
                          handleMachineCodeChange(e as React.ChangeEvent<HTMLInputElement>)
                        }}
                        error={!!error}
                        helperText={error?.message}
                        InputProps={{
                          endAdornment: (
                            <IconButton onClick={handleBeamCodeScan}>
                              <ScannerIcon />
                            </IconButton>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => fetchPlans(machineCode)}
                    disabled={!machineCode || loading}
                    startIcon={loading ? <RefreshIcon /> : <SearchIcon />}
                    sx={{ py: 1.5 }}
                  >
                    {loading ? 'Loading...' : 'Retrieve Plans'}
                  </Button>
                </Grid>
              </Grid>

              {/* Plans Table */}
              {plans.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Available Plans for Machine: {machineCode}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Plan ID</TableCell>
                          <TableCell>Yarn Code</TableCell>
                          <TableCell>Beam Size</TableCell>
                          <TableCell>Ends</TableCell>
                          <TableCell>Start Time</TableCell>
                          <TableCell>End Time</TableCell>
                          <TableCell>Select</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {plans.map((plan) => (
                          <TableRow 
                            key={plan.id}
                            hover
                            selected={selectedPlan?.id === plan.id}
                            onClick={() => handlePlanSelect(plan)}
                          >
                            <TableCell>{plan.plan_id}</TableCell>
                            <TableCell>{plan.yarn_code}</TableCell>
                            <TableCell>{plan.beam_size}</TableCell>
                            <TableCell>{plan.number_of_ends}</TableCell>
                            <TableCell>{new Date(plan.scheduled_start).toLocaleString()}</TableCell>
                            <TableCell>{new Date(plan.scheduled_end).toLocaleString()}</TableCell>
                            <TableCell>
                              {selectedPlan?.id === plan.id ? (
                                <CheckIcon color="success" />
                              ) : (
                                <Button size="small" onClick={() => handlePlanSelect(plan)}>
                                  Select
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Step 2: Beam Code and Weight */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <Chip label="2" size="small" sx={{ mr: 1 }} />
                Beam Scanning and Weight Verification
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="beamCode"
                    control={control}
                    rules={{ required: 'Beam code is required' }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Beam Code"
                        placeholder="Scan beam barcode"
                        value={scannedBeamCode}
                        onChange={(e) => {
                          field.onChange(e)
                          setScannedBeamCode(e.target.value)
                        }}
                        error={!!error}
                        helperText={error?.message}
                        InputProps={{
                          endAdornment: (
                            <IconButton onClick={handleBeamCodeScan}>
                              <ScannerIcon />
                            </IconButton>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="emptyBeamWeight"
                    control={control}
                    rules={{ required: 'Empty beam weight is required', min: { value: 0.1, message: 'Weight must be positive' } }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Empty Beam Weight (kg)"
                        type="number"
                        InputProps={{ readOnly: true }}
                        error={!!error}
                        helperText={error?.message || "From master data (ERP)"}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="actualEmptyBeamWeight"
                    control={control}
                    rules={{ required: 'Actual weight is required', min: { value: 0.1, message: 'Weight must be positive' } }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Actual Empty Beam Weight (kg)"
                        type="number"
                        placeholder="Edit if different from master data"
                        error={!!error}
                        helperText={error?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="loadCellReading"
                    control={control}
                    rules={{ min: { value: 0, message: 'Reading must be positive' } }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Load Cell Reading (kg)"
                        type="number"
                        placeholder="From PLC/load cells"
                        error={!!error}
                        helperText={error?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {actualEmptyBeamWeight > 0 && loadCellReading > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Difference: {Math.abs(actualEmptyBeamWeight - loadCellReading).toFixed(2)} kg
                  {Math.abs(actualEmptyBeamWeight - loadCellReading) < 0.5 ? 
                    " (Within tolerance ✓)" : " (Check required)"}
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Step 3: Summary and Submit */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <Chip label="3" size="small" sx={{ mr: 1 }} />
                Summary and Confirmation
              </Typography>
              
              {selectedPlan && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Selected Plan Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Plan ID</Typography>
                        <Typography variant="body1">{selectedPlan.plan_id}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Yarn Code</Typography>
                        <Typography variant="body1">{selectedPlan.yarn_code}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Beam Size</Typography>
                        <Typography variant="body1">{selectedPlan.beam_size} cm</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Number of Ends</Typography>
                        <Typography variant="body1">{selectedPlan.number_of_ends}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/wrp')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || !selectedPlan || !scannedBeamCode}
                  startIcon={loading ? <RefreshIcon /> : <CheckIcon />}
                  sx={{ minWidth: 150 }}
                >
                  {loading ? 'Processing...' : 'Confirm Loading'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </form>

      {loading && <LinearProgress sx={{ mt: 3 }} />}
    </Box>
  )
}
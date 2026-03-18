import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  RadioButtonChecked as RfidIcon,
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rfidTag, setRfidTag] = useState('')
  const [showRfidInput, setShowRfidInput] = useState(false)
  const navigate = useNavigate()
  
  const { login, rfidLogin, isLoading, error, clearError, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    await login(username, password)
  }

  const handleRfidLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    await rfidLogin(rfidTag)
  }

  const handleToggleRfidInput = () => {
    setShowRfidInput(!showRfidInput)
    clearError()
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              MES System
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Elastic Manufacturer - Manufacturing Execution System
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          {!showRfidInput ? (
            <form onSubmit={handleLogin}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <LoginIcon />}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRfidLogin}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="rfidTag"
                label="RFID Tag"
                name="rfidTag"
                autoComplete="off"
                autoFocus
                value={rfidTag}
                onChange={(e) => setRfidTag(e.target.value)}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <RfidIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <LoginIcon />}
              >
                {isLoading ? 'Signing in with RFID...' : 'RFID Login'}
              </Button>
            </form>
          )}

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RfidIcon />}
              onClick={handleToggleRfidInput}
              disabled={isLoading}
            >
              {showRfidInput ? 'Switch to Username/Password' : 'Login with RFID'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              For demonstration, use username: admin, password: admin
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Each touch panel runs locally with SQLite database, syncing to central SQL Server every 20 minutes
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
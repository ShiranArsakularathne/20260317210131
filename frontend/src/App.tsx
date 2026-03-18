import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import LoginPage from './pages/LoginPage'
import MainLayout from './components/layout/MainLayout'
import DashboardPage from './pages/DashboardPage'
import WrpPage from './pages/wrp/WrpPage'
import BeamLoadingPage from './pages/wrp/BeamLoadingPage'
import WarpPage from './pages/wrp/WarpPage'
import UnloadPage from './pages/wrp/UnloadPage'
import { useAuthStore } from './stores/authStore'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {isAuthenticated ? (
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="wrp" element={<WrpPage />} />
            <Route path="wrp/beam-loading" element={<BeamLoadingPage />} />
            <Route path="wrp/warp" element={<WarpPage />} />
            <Route path="wrp/unload" element={<UnloadPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Box>
  )
}

export default App
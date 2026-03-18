import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Collapse,
  Divider,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Factory as FactoryIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Person as PersonIcon,
} from '@mui/icons-material'
import { useAuthStore } from '../../stores/authStore'

const drawerWidth = 280

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  {
    text: 'WRP',
    icon: <FactoryIcon />,
    path: '/wrp',
    subItems: [
      { text: 'Beam Loading', path: '/wrp/beam-loading' },
      { text: 'Warp', path: '/wrp/warp' },
      { text: 'Unload', path: '/wrp/unload' },
    ]
  },
  // Other modules can be added here
  { text: 'LOOM', icon: <FactoryIcon />, path: '/loom' },
  { text: 'RANGE', icon: <FactoryIcon />, path: '/range' },
  { text: 'EXHST', icon: <FactoryIcon />, path: '/exhst' },
  { text: 'PACK', icon: <FactoryIcon />, path: '/pack' },
  { text: 'INSPC', icon: <FactoryIcon />, path: '/inspc' },
  { text: 'USERS', icon: <PersonIcon />, path: '/users' },
]

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSubMenu, setOpenSubMenu] = useState<string | null>('WRP')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleSubMenuClick = (text: string) => {
    setOpenSubMenu(openSubMenu === text ? null : text)
  }

  const handleMenuClick = (path: string) => {
    navigate(path)
    setMobileOpen(false)
  }

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    handleUserMenuClose()
  }

  const drawer = (
    <div>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          MES System
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <div key={item.text}>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => item.subItems ? handleSubMenuClick(item.text) : handleMenuClick(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
                {item.subItems && (openSubMenu === item.text ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>
            </ListItem>
            {item.subItems && (
              <Collapse in={openSubMenu === item.text} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItem key={subItem.text} disablePadding>
                      <ListItemButton
                        sx={{ pl: 4 }}
                        onClick={() => handleMenuClick(subItem.path)}
                        selected={location.pathname === subItem.path}
                      >
                        <ListItemText primary={subItem.text} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </div>
        ))}
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Manufacturing Execution System
          </Typography>
          <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {user?.username} ({user?.full_name})
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
        <Box sx={{ mt: 'auto', pt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            MES System v1.0 • Elastic Manufacturer
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
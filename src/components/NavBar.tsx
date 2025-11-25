import React from 'react'
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { useColorMode } from '../theme/ThemeProvider'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'

export default function NavBar() {
  const { user, isAdmin, logout } = useAuth()
  const nav = useNavigate()
  const { mode, toggle } = useColorMode()

  const handleLogout = async () => {
    try {
      await logout()
      nav('/')
    } catch (e) {
      console.error('Logout failed', e)
      nav('/')
    }
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }} component={RouterLink} to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          Book2Trip
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Theme toggle - moved before Browse Trips */}
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton color="inherit" onClick={toggle} size="small" aria-label="toggle theme">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          <Button color="inherit" component={RouterLink} to="/trips">Browse Trips</Button>

          {user ? (
            <>
              {isAdmin && (
                <Button color="inherit" component={RouterLink} to="/admin">Admin</Button>
              )}
              <Button color="inherit" component={RouterLink} to={isAdmin ? '/admin/bookings' : '/app/dashboard'}>{isAdmin ? 'Bookings' : 'My Bookings'}</Button>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button color="inherit" component={RouterLink} to="/register">Sign Up</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

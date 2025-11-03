import { Box, Button, Container, Link as MuiLink, Stack, TextField, Typography, Alert } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useAuth } from './AuthProvider'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'

export default function LoginPage() {
  const { register: reg, handleSubmit } = useForm<{ email: string; password: string }>()
  const { login, isAdmin } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const redirectTo = new URLSearchParams(location.search).get('redirectTo') || '/app'

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

    const onSubmit = handleSubmit(async (values) => {
        setError(null)
        setSubmitting(true)
        try {
            await login(values.email, values.password)
            // If the logged-in user is an admin, send them to /admin regardless of redirect param
            if (isAdmin) {
              nav('/admin')
            } else {
              nav(redirectTo)
            }
        } catch (err: any) {
            // Provide clearer messages for common Appwrite errors
            const msg = (err?.message) || String(err)
            console.error('Login failed:', err)

            if (msg.includes('Creation of a session is prohibited when a session is active')) {
              setError('A session is already active. We attempted to clear it — please try again.')
            } else if (msg.includes('Unauthorized') || msg.includes('401')) {
              setError('Invalid credentials or unauthorized. Check your email/password.')
            } else {
              setError('Login failed. ' + msg)
            }
        } finally {
            setSubmitting(false)
        }
    })

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Typography variant="h4" gutterBottom>Login</Typography>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Email" type="email" {...reg('email', { required: true })} />
          <TextField label="Password" type="password" {...reg('password', { required: true })} />
          <Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Logging in…' : 'Login'}</Button>
          <Typography variant="body2">No account? <MuiLink component={Link} to="/register">Register</MuiLink></Typography>
        </Stack>
      </Box>
    </Container>
  )
}

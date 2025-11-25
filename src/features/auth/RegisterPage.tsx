import { Box, Button, Container, Link as MuiLink, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useAuth } from './AuthProvider'
import { useNavigate, Link } from 'react-router-dom'

export default function RegisterPage() {
  const { register: reg, handleSubmit } = useForm<{ name?: string; email: string; password: string }>()
  const { register: doRegister } = useAuth()
  const nav = useNavigate()

  const onSubmit = handleSubmit(async (values) => {
    await doRegister(values.email, values.password, values.name)
    nav('/app/dashboard')
  })

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Typography variant="h4" gutterBottom>Register</Typography>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField label="Name" {...reg('name')} />
          <TextField label="Email" type="email" {...reg('email', { required: true })} />
          <TextField label="Password" type="password" {...reg('password', { required: true, minLength: 6 })} />
          <Button type="submit" variant="contained">Create account</Button>
          <Typography variant="body2">Already have an account? <MuiLink component={Link} to="/login">Login</MuiLink></Typography>
        </Stack>
      </Box>
    </Container>
  )
}

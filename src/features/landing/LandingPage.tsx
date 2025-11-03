import { Box, Container, Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <Box>
      {/* Use the global NavBar (rendered in App.tsx). Keep hero content below. */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h3" gutterBottom>Discover Your Next Adventure</Typography>
        <Typography variant="body1" gutterBottom>
          Explore curated trips by land, sea, and air. Book in minutes and manage your journeys with ease.
        </Typography>
        <Button variant="contained" size="large" component={Link} to="/trips">Get Started</Button>
      </Container>
    </Box>
  )
}

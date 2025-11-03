import { useQuery } from '@tanstack/react-query'
import { listTrips } from '../../api/trips'
import { Box, Card, CardActions, CardContent, CardMedia, Container, Grid, IconButton, MenuItem, Select, Stack, TextField, Typography, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function TripsCatalog() {
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('')
  const { data: trips } = useQuery({ queryKey: ['trips', search, mode], queryFn: () => listTrips({ search, transportMode: mode || undefined }) })

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField label="Search" fullWidth value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select displayEmpty value={mode} onChange={(e) => setMode(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value=""><em>All modes</em></MenuItem>
          <MenuItem value="land">Land</MenuItem>
          <MenuItem value="sea">Sea</MenuItem>
          <MenuItem value="air">Air</MenuItem>
        </Select>
      </Stack>

      <Grid container spacing={2}>
        {(trips || []).map((t) => (
          <Grid item xs={12} sm={6} md={4} key={t.$id}>
            <Card>
              {/* Placeholder image */}
              <CardMedia sx={{ height: 160, bgcolor: 'grey.300' }} />
              <CardContent>
                <Typography variant="h6">{t.title}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>{t.description}</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>{t.transportMode.toUpperCase()} • {t.currency} {t.price.toFixed(2)}</Typography>
              </CardContent>
              <CardActions>
                <Button component={Link} to={`/trips/${t.$id}`}>View</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}

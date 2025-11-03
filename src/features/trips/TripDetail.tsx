import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getTrip } from '../../api/trips'
import { Box, Button, Container, Stack, TextField, Typography, Alert, List, ListItem, ListItemText, Divider, Paper } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useBookTrip } from '../bookings/hooks'
import { useState } from 'react'

export default function TripDetail() {
  const { tripId } = useParams()
  const { data: trip } = useQuery({ queryKey: ['trip', tripId], queryFn: () => getTrip(tripId!), enabled: !!tripId })
  const { register, handleSubmit, watch } = useForm<{ passengers: number }>({ defaultValues: { passengers: 1 } })
  const passengers = Number(watch('passengers') || 1)
  const { user } = useAuth()
  const { isAdmin } = useAuth()
  const book = useBookTrip()
  const nav = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = handleSubmit(async () => {
    setError(null)
    setSuccess(null)
    if (!user) {
      setError('You must be logged in to book.')
      return
    }
    if (isAdmin) {
      setError('Admin accounts are not allowed to create bookings')
      return
    }
    if (!trip) {
      setError('Trip data not loaded')
      return
    }

    // Re-fetch latest trip from server to avoid stale cache causing incorrect seat count
    let latest: any = null
    try {
      latest = await getTrip(trip.$id)
    } catch (e: any) {
      console.error('[TripDetail] failed to fetch latest trip data before booking', e)
      setError('Failed to validate trip availability — please try again')
      return
    }

    const rawSeats = latest?.seatsAvailable ?? (trip as any).seatsAvailable
    const rawTotal = latest?.seatsTotal ?? (trip as any).seatsTotal
    let seatsAvailableNum = Number(rawSeats)
    if (rawSeats === undefined || rawSeats === null || String(rawSeats).trim() === '' || isNaN(seatsAvailableNum)) {
      seatsAvailableNum = Number(rawTotal) || 0
    }

    console.debug('[TripDetail] refreshed booking check, seatsAvailable/raw:', rawSeats, 'seatsTotal:', rawTotal, 'computedAvailable:', seatsAvailableNum, 'requestedPassengers:', passengers)

    if (passengers <= 0) {
      setError('Invalid passengers count')
      return
    }

    if (seatsAvailableNum < passengers) {
      setError('Not enough seats available')
      return
    }



    const payload = {
      tripId: trip.$id,
      userId: user.$id,
      passengers,
      totalPrice: Number(((trip as any).price * passengers).toFixed(2)),
    }

    setSubmitting(true)
    try {
      // mutateAsync typing across query versions can differ; cast to any to call
      const res = await (book as any).mutateAsync(payload)
      setSuccess('Booking created')
      nav(`/app/bookings/${(res as any).$id}`)
    } catch (err: any) {
      setError(err?.message || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  })

  if (!trip) return null

  const itineraries = (trip as any).itineraries || []
  const sorted = Array.isArray(itineraries) ? [...itineraries].sort((a: any, b: any) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0)) : []

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>{trip.title}</Typography>
      <Typography sx={{ mb: 2 }}>{trip.description}</Typography>
      <Typography variant="subtitle1">Price: {trip.currency} {trip.price.toFixed(2)}</Typography>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>Available seats: {(() => {
        const raw = (trip as any).seatsAvailable
        const total = (trip as any).seatsTotal
        let n = Number(raw)
        if (raw === undefined || raw === null || String(raw).trim() === '' || isNaN(n)) n = Number(total) || 0
        return n
      })()}</Typography>

      {/* Itinerary section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Itinerary</Typography>
        {sorted.length === 0 ? (
          <Typography color="text.secondary">No itinerary available for this trip.</Typography>
        ) : (
          <List component={Paper} sx={{ mt: 1 }}>
            {sorted.map((it: any) => (
              <div key={it.$id || `${it.dayNumber}-${it.title}`}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={<strong>Day {it.dayNumber}: {it.title}</strong>}
                    secondary={<>
                      {it.description && <Typography component="span" display="block" color="text.primary">{it.description}</Typography>}
                      {it.location && <Typography component="span" display="block" color="text.secondary">Location: {it.location}</Typography>}
                      {(it.startTime || it.endTime) && <Typography component="span" display="block" color="text.secondary">Time: {it.startTime || '—'} {it.endTime ? `— ${it.endTime}` : ''}</Typography>}
                    </>}
                  />
                </ListItem>
                <Divider component="li" />
              </div>
            ))}
          </List>
        )}
      </Box>

      <Box component="form" onSubmit={onSubmit}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField type="number" label="Passengers" {...register('passengers', { valueAsNumber: true, min: 1 })} sx={{ width: 160 }} />
          <Typography>Total: {trip.currency} {(trip.price * passengers).toFixed(2)}</Typography>
          {isAdmin ? (
            <Button variant="contained" disabled>Admin cannot book</Button>
          ) : (
            <Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Booking…' : 'Book Now'}</Button>
          )}
        </Stack>
      </Box>
    </Container>
  )
}

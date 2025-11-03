import React, { useState } from 'react'
import { Container, Typography, Button, Stack, Paper, Alert } from '@mui/material'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBooking } from '../../api/bookings'
import { useAuth } from '../auth/AuthProvider'
import { useCancelBooking } from './hooks'

export default function BookingDetail() {
  const { bookingId } = useParams()
  const nav = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { data: booking, isLoading } = useQuery({ queryKey: ['booking', bookingId], queryFn: () => getBooking(bookingId!), enabled: !!bookingId })
  const cancel = useCancelBooking()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (isLoading || authLoading) return <Container sx={{ py: 4 }}>Loading…</Container>
  if (!booking) return <Container sx={{ py: 4 }}>Booking not found</Container>

  const bookingObj = booking as any
  const isOwner = user && user.$id === bookingObj.userId
  const canCancel = isOwner && bookingObj.status === 'pending'

  const handleCancel = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      await cancel.mutateAsync(bookingObj.$id)
      setSuccessMsg('Booking cancelled')
      // navigate back to dashboard after a short delay so user sees the message
      setTimeout(() => nav('/app/dashboard'), 600)
    } catch (e: any) {
      console.error('Cancel failed', e)
      setErrorMsg(e?.message || 'Cancel failed')
    }
  }

  // Safe formatting for fields that might be missing
  const tripId = bookingObj?.tripId || null
  const userId = bookingObj?.userId || '—'
  const passengers = typeof bookingObj?.passengers === 'number' ? bookingObj.passengers : '—'
  const totalPrice = typeof bookingObj?.totalPrice === 'number' ? bookingObj.totalPrice.toFixed(2) : '—'
  const status = bookingObj?.status || '—'
  const paymentStatus = bookingObj?.paymentStatus || '—'
  let bookedAtDisplay = '—'
  try {
    if (bookingObj?.bookedAt) {
      const d = new Date(bookingObj.bookedAt)
      if (!isNaN(d.getTime())) bookedAtDisplay = d.toLocaleString()
    }
  } catch {
    bookedAtDisplay = '—'
  }

  return (
    <Container sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          {successMsg && <Alert severity="success">{successMsg}</Alert>}

          <Typography variant="h5">Booking {bookingObj.$id ?? '—'}</Typography>

          <Typography>
            Trip: {tripId ? <Link to={`/trips/${tripId}`}>View trip</Link> : '—'}
          </Typography>

          <Typography>User ID: {userId}</Typography>
          <Typography>Passengers: {passengers}</Typography>
          <Typography>Total: {totalPrice}</Typography>
          <Typography>Status: {status} / {paymentStatus}</Typography>
          <Typography>Booked At: {bookedAtDisplay}</Typography>

          {canCancel && (
            <Button color="error" variant="contained" onClick={handleCancel} disabled={cancel.status === 'pending'}>
              {cancel.status === 'pending' ? 'Cancelling…' : 'Cancel Booking'}
            </Button>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}

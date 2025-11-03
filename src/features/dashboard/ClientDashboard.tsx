import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, CircularProgress } from '@mui/material'
import { useAuth } from '../auth/AuthProvider'
import { useBookingsByUser, useCancelBooking } from '../bookings/hooks'
import { Link } from 'react-router-dom'

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.$id
  const { data: bookings, isLoading } = useBookingsByUser(userId)
  const cancel = useCancelBooking()

  if (authLoading || isLoading) return (
    <Container sx={{ py: 4 }}>
      <CircularProgress />
    </Container>
  )

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Your Booking History</Typography>
      {!bookings || bookings.length === 0 ? (
        <Typography color="text.secondary">You have no bookings yet.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking ID</TableCell>
              <TableCell>Trip</TableCell>
              <TableCell>Passengers</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Booked At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((b: any) => (
              <TableRow key={b.$id}>
                <TableCell>{b.$id}</TableCell>
                <TableCell><Link to={`/trips/${b.tripId}`}>View Trip</Link></TableCell>
                <TableCell>{b.passengers}</TableCell>
                <TableCell>{b.totalPrice}</TableCell>
                <TableCell>{b.status} / {b.paymentStatus}</TableCell>
                <TableCell>{new Date(b.bookedAt).toLocaleString()}</TableCell>
                <TableCell>
                  {b.status === 'pending' ? (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => cancel.mutate(b.$id)}
                      disabled={cancel.status === 'loading'}
                    >Cancel</Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  )
}

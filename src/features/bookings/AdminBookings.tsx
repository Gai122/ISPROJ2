import React from 'react'
import { Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Select, MenuItem } from '@mui/material'
import { useAllBookings, useUpdateBooking } from './hooks'

export default function AdminBookings() {
  const { data: bookings, isLoading } = useAllBookings()
  const update = useUpdateBooking()

  if (isLoading) return <Container sx={{ py: 4 }}>Loading…</Container>

  const handleStatus = (id: string, status: string) => {
    update.mutate({ id, patch: { status } })
  }

  const handlePayment = (id: string, paymentStatus: string) => {
    update.mutate({ id, patch: { paymentStatus } })
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5">All Bookings</Typography>
      {!bookings || bookings.length === 0 ? (
        <Typography color="text.secondary">No bookings found.</Typography>
      ) : (
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Trip</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Passengers</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Booked At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((b: any) => (
              <TableRow key={b.$id}>
                <TableCell>{b.$id}</TableCell>
                <TableCell>{b.tripId}</TableCell>
                <TableCell>{b.userId}</TableCell>
                <TableCell>{b.passengers}</TableCell>
                <TableCell>{b.totalPrice}</TableCell>
                <TableCell>
                  <Select value={b.status || 'pending'} onChange={(e) => handleStatus(b.$id, e.target.value)} size="small">
                    <MenuItem value="pending">pending</MenuItem>
                    <MenuItem value="confirmed">confirmed</MenuItem>
                    <MenuItem value="cancelled">cancelled</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={b.paymentStatus || 'unpaid'} onChange={(e) => handlePayment(b.$id, e.target.value)} size="small">
                    <MenuItem value="unpaid">unpaid</MenuItem>
                    <MenuItem value="paid">paid</MenuItem>
                    <MenuItem value="refunded">refunded</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>{new Date(b.bookedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button size="small" href={`/admin/bookings/${b.$id}`} target="_blank">Open</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  )
}

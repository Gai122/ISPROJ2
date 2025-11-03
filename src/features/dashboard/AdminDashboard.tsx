import React, { useMemo } from 'react'
import { Container, Typography, Grid, Paper, Box, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material'
import { useAllBookings } from '../bookings/hooks'
import { Link } from 'react-router-dom'
import AdminTrips from '../trips/admin/AdminTrips'

export default function AdminDashboard() {
  const { data: bookings, isLoading: bookingsLoading } = useAllBookings()

  const totalBookings = bookings?.length ?? 0
  const revenue = useMemo(() => (bookings || []).reduce((s: number, b: any) => s + (Number(b.totalPrice || 0)), 0), [bookings])

  const recent = (bookings || []).slice().sort((a: any, b: any) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()).slice(0, 8)

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5">Admin Dashboard</Typography>

      {/* Replace KPI cards with Manage Trips UI */}
      <Box sx={{ mt: 2 }}>
        <AdminTrips />
      </Box>

      <Box mt={4}>
        <Typography variant="h6">Recent Bookings</Typography>
        <Paper sx={{ mt: 2, p: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Trip</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Passengers</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Booked At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recent.map((b: any) => (
                <TableRow key={b.$id}>
                  <TableCell>{b.$id}</TableCell>
                  <TableCell><Link to={`/admin/trips/${b.tripId}`}>{b.tripId}</Link></TableCell>
                  <TableCell>{b.userId}</TableCell>
                  <TableCell>{b.passengers}</TableCell>
                  <TableCell>{b.totalPrice}</TableCell>
                  <TableCell>{b.status} / {b.paymentStatus}</TableCell>
                  <TableCell>{new Date(b.bookedAt).toLocaleString()}</TableCell>
                  <TableCell><Button size="small" component={Link as any} to={`/admin/bookings`}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Container>
  )
}

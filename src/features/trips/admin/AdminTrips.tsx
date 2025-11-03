import React, { useMemo, useState } from 'react'
import { Container, Typography, Button, Dialog, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Alert } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useTrips, useCreateTrip, useUpdateTrip, useDeleteTrip } from '../hooks'
import TripForm from './TripForm'
import { getTrip } from '../../../api/trips'

export default function AdminTrips() {
  const tripsQuery = useTrips()
  const { data: trips, isLoading } = tripsQuery
  const create = useCreateTrip()
  const update = useUpdateTrip()
  const del = useDeleteTrip()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rows = useMemo(() => Array.isArray(trips) ? trips.map((t: any) => ({ id: t.$id, ...t })) : [], [trips])

  async function handleDelete(id: string) {
    setMsg(null)
    setError(null)
    try {
      await del.mutateAsync(id)
      console.log('Trip deleted', id)
      setMsg('Trip deleted')
      await tripsQuery.refetch()
    } catch (e: any) {
      console.error('Delete failed', e)
      setError(e?.message || 'Delete failed')
    }
  }

  async function startEdit(row: any) {
    setMsg(null)
    setError(null)
    try {
      // fetch full trip including itineraries
      const full = await getTrip(row.id)
      setEditing(full)
      setOpen(true)
    } catch (e: any) {
      console.error('Failed to load trip details', e)
      setError(e?.message || 'Failed to load trip details')
    }
  }

  return (
    <Container sx={{ py: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Typography variant="h5">Manage Trips</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setOpen(true) }}>New Trip</Button>
      </div>

      {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Start</TableCell>
            <TableCell>End</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Seats</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row: any) => (
            <TableRow key={row.id}>
              <TableCell>{row.title}</TableCell>
              <TableCell>{row.startDate}</TableCell>
              <TableCell>{row.endDate}</TableCell>
              <TableCell>{row.price}</TableCell>
              <TableCell>{row.seatsAvailable}</TableCell>
              <TableCell>
                <IconButton size="small" onClick={() => startEdit(row)}><EditIcon /></IconButton>
                <IconButton size="small" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <TripForm
          initial={editing}
          onSave={async (payload: any) => {
            setMsg(null)
            setError(null)
            try {
              if (editing) {
                const res = await update.mutateAsync({ id: editing.$id, data: payload })
                console.log('Trip updated', res)
                setMsg('Trip updated')
              } else {
                const res = await create.mutateAsync(payload)
                console.log('Trip created', res)
                setMsg('Trip created')
              }
            } catch (e: any) {
              console.error('Save failed', e)
              setError(e?.message || 'Save failed')
            } finally {
              setOpen(false)
              // Ensure the manage list is refreshed after the mutation
              tripsQuery.refetch()
            }
          }}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </Container>
  )
}

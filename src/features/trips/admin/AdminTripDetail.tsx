import React, { useEffect, useMemo, useState } from 'react'
import { Container, Typography, Box, Button, IconButton, Stack, TextField, Paper } from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import { useParams, Link } from 'react-router-dom'
import { useTrip } from '../hooks'
import { useUpdateTrip } from '../hooks'

export default function AdminTripDetail() {
  const { tripId } = useParams()
  const { data: trip, isLoading } = useTrip(tripId)
  const update = useUpdateTrip()

  const [items, setItems] = useState<any[]>([])
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [draft, setDraft] = useState<any>({ title: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (trip) {
      setItems((trip as any).itineraries || [])
    }
  }, [trip])

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return
    const copy = [...items]
    const [moved] = copy.splice(from, 1)
    copy.splice(to, 0, moved)
    // reassign dayNumber
    const re = copy.map((it, idx) => ({ ...it, dayNumber: idx + 1 }))
    setItems(re)
  }

  const remove = (idx: number) => {
    const copy = [...items]
    copy.splice(idx, 1)
    setItems(copy.map((it, i) => ({ ...it, dayNumber: i + 1 })))
  }

  const startEdit = (idx: number | null) => {
    setEditingIdx(idx)
    if (idx == null) setDraft({ title: '', description: '' })
    else setDraft({ title: items[idx].title || '', description: items[idx].description || '' })
  }

  const saveEdit = () => {
    if (editingIdx == null) {
      const newItems = [...items, { ...draft, dayNumber: items.length + 1 }]
      setItems(newItems)
    } else {
      const copy = [...items]
      copy[editingIdx] = { ...copy[editingIdx], ...draft }
      setItems(copy)
    }
    setEditingIdx(null)
    setDraft({ title: '', description: '' })
  }

  const persist = async () => {
    if (!trip) return
    setSaving(true)
    try {
      // Sanitize items to avoid sending client-side id fields
      const sanitized = items.map((it) => ({
        ...(it.$id ? { $id: it.$id } : {}),
        dayNumber: it.dayNumber,
        title: it.title,
        description: it.description,
        location: it.location,
        startTime: it.startTime || null,
        endTime: it.endTime || null,
      }))

      await update.mutateAsync({ id: trip.$id, data: { itineraries: sanitized } })
    } catch (e) {
      console.error('Failed to save itineraries', e)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !trip) return <Container sx={{ py: 4 }}>Loading…</Container>

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h5">Trip: {(trip as any).title}</Typography>
          <Typography color="text.secondary">ID: {trip.$id}</Typography>
        </div>
        <div>
          <Button component={Link as any} to="/admin/trips" variant="outlined">Back to trips</Button>
        </div>
      </Stack>

      <Box mt={3}>
        <Typography variant="h6">Itineraries</Typography>
        <Stack spacing={2} mt={2}>
          {items.length === 0 && <Typography color="text.secondary">No itinerary items. Add one below.</Typography>}
          {items.map((it, idx) => (
            <Paper key={it.$id || idx} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Typography><strong>Day {it.dayNumber}</strong> — {it.title}</Typography>
                <Typography color="text.secondary">{it.description}</Typography>
              </div>
              <div>
                <IconButton size="small" onClick={() => move(idx, idx - 1)}><ArrowUpwardIcon /></IconButton>
                <IconButton size="small" onClick={() => move(idx, idx + 1)}><ArrowDownwardIcon /></IconButton>
                <IconButton size="small" onClick={() => { startEdit(idx) }}><SaveIcon /></IconButton>
                <IconButton size="small" onClick={() => remove(idx)}><DeleteIcon /></IconButton>
              </div>
            </Paper>
          ))}

          <Box>
            <Typography variant="subtitle1">{editingIdx == null ? 'Add new item' : `Edit item ${editingIdx + 1}`}</Typography>
            <Stack spacing={1} mt={1}>
              <TextField label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              <TextField label="Description" multiline minRows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={saveEdit}>{editingIdx == null ? 'Add' : 'Save'}</Button>
                <Button onClick={() => startEdit(null)}>Clear</Button>
              </Stack>
            </Stack>
          </Box>

          <Box>
            <Button variant="contained" color="primary" onClick={persist} disabled={saving}>{saving ? 'Saving…' : 'Save itineraries'}</Button>
          </Box>
        </Stack>
      </Box>
    </Container>
  )
}

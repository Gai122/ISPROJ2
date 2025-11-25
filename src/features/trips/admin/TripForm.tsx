import React, { useState } from 'react'
import { Box, Button, TextField, Stack, MenuItem, Typography, IconButton, Grid, Paper, Select, FormControl, InputLabel } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { uploadTripImage } from '../../../api/trips'

export default function TripForm({ initial, onSave, onCancel }: any) {
  const [form, setForm] = useState<any>(initial || {
    title: '',
    description: '',
    price: 0,
    currency: 'PHP',
    seatsTotal: 0,
    seatsAvailable: 0,
    startDate: '',
    endDate: '',
    // remove top-level transportMode UI — transportMode is per-itinerary now
    transportMode: 'land',
    imageIds: [],
    itineraries: [],
  })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { ...form }
      if (file) {
        const fileId = await uploadTripImage(file)
        payload.imageIds = [...(payload.imageIds || []), fileId]
      }
      // ensure seatsAvailable is set
      if (payload.seatsAvailable == null) payload.seatsAvailable = payload.seatsTotal

      // sanitize payload: remove any top-level id or $id fields and clean itineraries
      const { id, $id, ...restPayload } = payload
      const cleanedItineraries = (restPayload.itineraries || []).map((it: any) => {
        const { id: iid, $id: iid2, ...rest } = it || {}
        // ensure transportMode exists on itinerary
        return {
          dayNumber: rest.dayNumber,
          title: rest.title,
          description: rest.description,
          location: rest.location,
          transportMode: rest.transportMode || 'land',
          startTime: rest.startTime || null,
          endTime: rest.endTime || null,
          ...(it.$id ? { $id: it.$id } : {}),
        }
      })

      // Preserve trip-level transportMode as chosen in the form (do not override from itineraries)
      const cleaned = { ...restPayload, transportMode: restPayload.transportMode || 'land', itineraries: cleanedItineraries }

      await onSave(cleaned)
    } finally {
      setSaving(false)
    }
  }

  function updateItinerary(index: number, changes: Partial<any>) {
    const list = Array.isArray(form.itineraries) ? [...form.itineraries] : []
    list[index] = { ...(list[index] || {}), ...changes }
    setForm({ ...form, itineraries: list })
  }

  function addItinerary() {
    const list = Array.isArray(form.itineraries) ? [...form.itineraries] : []
    list.push({ dayNumber: (list.length || 0) + 1, title: '', description: '', location: '', transportMode: 'land', startTime: '', endTime: '' })
    setForm({ ...form, itineraries: list })
  }

  function removeItinerary(index: number) {
    const list = Array.isArray(form.itineraries) ? [...form.itineraries] : []
    list.splice(index, 1)
    // reassign day numbers
    const re = list.map((it, i) => ({ ...it, dayNumber: i + 1 }))
    setForm({ ...form, itineraries: re })
  }

  return (
    <Box p={3}>
      <Stack spacing={2}>
        <Typography variant="h6">{initial ? 'Edit Trip' : 'Create Trip'}</Typography>
        <TextField label="Title" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <TextField label="Description" fullWidth multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Stack direction="row" spacing={2}>
          <TextField label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <TextField label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField label="Seats total" type="number" value={form.seatsTotal} onChange={(e) => setForm({ ...form, seatsTotal: Number(e.target.value) })} />
          <TextField label="Seats available" type="number" value={form.seatsAvailable} onChange={(e) => setForm({ ...form, seatsAvailable: Number(e.target.value) })} />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField label="Start date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField label="End date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} InputLabelProps={{ shrink: true }} />
        </Stack>

        {/* Trip-level transport mode selector */}
        <FormControl fullWidth>
          <InputLabel id="trip-transport-label">Transport Mode</InputLabel>
          <Select
            labelId="trip-transport-label"
            value={form.transportMode || 'land'}
            label="Transport Mode"
            onChange={(e) => setForm({ ...form, transportMode: e.target.value })}
            size="small"
          >
            <MenuItem value="land">Land</MenuItem>
            <MenuItem value="sea">Sea</MenuItem>
            <MenuItem value="air">Air</MenuItem>
          </Select>
        </FormControl>

        <div>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        {/* Itineraries editor */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">Itineraries</Typography>
            <Button size="small" onClick={addItinerary}>Add Item</Button>
          </Stack>

          <Stack spacing={1} sx={{ mt: 1 }}>
            {(form.itineraries || []).map((it: any, idx: number) => (
              <Paper key={idx} sx={{ p: 1 }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} sm={1}>
                    <TextField label="#" type="number" value={it.dayNumber} onChange={(e) => updateItinerary(idx, { dayNumber: Number(e.target.value) })} sx={{ width: 72 }} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Title" fullWidth value={it.title} onChange={(e) => updateItinerary(idx, { title: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField label="Location" fullWidth value={it.location} onChange={(e) => updateItinerary(idx, { location: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    {/* Transport select per itinerary */}
                    <FormControl fullWidth>
                      <InputLabel id={`transport-label-${idx}`}>Transport</InputLabel>
                      <Select
                        labelId={`transport-label-${idx}`}
                        value={it.transportMode || 'land'}
                        label="Transport"
                        onChange={(e) => updateItinerary(idx, { transportMode: e.target.value })}
                        size="small"
                      >
                        <MenuItem value="land">Land</MenuItem>
                        <MenuItem value="sea">Sea</MenuItem>
                        <MenuItem value="air">Air</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <IconButton size="small" onClick={() => removeItinerary(idx)} aria-label="remove-itinerary">
                      <DeleteIcon />
                    </IconButton>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField label="Description" fullWidth multiline minRows={2} value={it.description} onChange={(e) => updateItinerary(idx, { description: e.target.value })} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField label="Start Time" type="time" fullWidth value={it.startTime || ''} onChange={(e) => updateItinerary(idx, { startTime: e.target.value })} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="End Time" type="time" fullWidth value={it.endTime || ''} onChange={(e) => updateItinerary(idx, { endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Stack>
      </Stack>
    </Box>
  )
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../../api/bookings'

export function useBookingsByUser(userId?: string) {
  return useQuery({ queryKey: ['bookings', 'user', userId], queryFn: () => api.listBookingsByUser(userId!), enabled: !!userId })
}

export function useAllBookings() {
  return useQuery({ queryKey: ['bookings', 'all'], queryFn: api.listAllBookings })
}

export function useUpdateBooking() {
  const qc = useQueryClient()
  return useMutation<any, Error, { id: string; patch: any }, { snapshots?: any[] }>({
    mutationFn: (payload: { id: string; patch: any }) => api.updateBooking(payload.id, payload.patch),
    onMutate: async ({ id, patch }) => {
      // Cancel relevant queries to avoid race conditions
      await qc.cancelQueries({ queryKey: ['bookings'] })

      // Take snapshots of all bookings-related caches to allow rollback
      const snapshots = qc.getQueriesData({ queryKey: ['bookings'] }).map(([key, data]) => [key, data])

      // Helper to apply patch to a list of bookings
      const applyPatch = (list: any) => {
        if (!Array.isArray(list)) return list
        return list.map((b: any) => (b && b.$id === id ? { ...b, ...patch } : b))
      }

      // Update all matching bookings caches optimistically
      const queries = qc.getQueriesData({ queryKey: ['bookings'] })
      queries.forEach(([key, data]) => {
        qc.setQueryData(key as any, applyPatch(data as any))
      })

      return { snapshots }
    },
    onError: (_err, _vars, ctx) => {
      // Rollback caches from snapshots on error
      if (ctx?.snapshots) {
        ctx.snapshots.forEach(([key, data]: any) => qc.setQueryData(key as any, data))
      }
    },
    onSuccess: (updatedDoc) => {
      // Merge the server-updated document into all bookings caches to prevent UI reversion/flicker
      const updatedId = updatedDoc?.$id
      const merge = (list: any) => {
        if (!Array.isArray(list)) return list
        return list.map((b: any) => (b && b.$id === updatedId ? { ...b, ...updatedDoc } : b))
      }
      const queries = qc.getQueriesData({ queryKey: ['bookings'] })
      queries.forEach(([key, data]) => {
        qc.setQueryData(key as any, merge(data as any))
      })
    },
    onSettled: () => {
      // Ensure final data is fetched from server
      qc.invalidateQueries({ queryKey: ['bookings'] })
      qc.invalidateQueries({ queryKey: ['bookings', 'all'] })
      qc.invalidateQueries({ queryKey: ['bookings', 'user'] })
    },
  })
}

export function useBookTrip() {
  const qc = useQueryClient()
  return useMutation<any, Error, api.BookingPayload, { prev?: any }>({
    mutationFn: (payload: api.BookingPayload) => api.createBooking(payload),
    // optimistic update: decrement seatsAvailable in trip cache
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ['trip', payload.tripId] })
      const prev = qc.getQueryData(['trip', payload.tripId]) as any
      if (prev) {
        qc.setQueryData(['trip', payload.tripId], { ...prev, seatsAvailable: (prev.seatsAvailable ?? 0) - payload.passengers })
      }
      return { prev }
    },
    onError: (err, payload, context: any) => {
      if (context?.prev) qc.setQueryData(['trip', payload.tripId], context.prev)
    },
    onSettled: (data, err, payload: any) => {
      if (payload?.tripId) qc.invalidateQueries({ queryKey: ['trip', payload.tripId] })
      if (payload?.userId) qc.invalidateQueries({ queryKey: ['bookings', 'user', payload.userId] })
      qc.invalidateQueries({ queryKey: ['bookings', 'all'] })
    },
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation<void, Error, string, unknown>({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      qc.invalidateQueries({ queryKey: ['bookings', 'all'] })
      qc.invalidateQueries({ queryKey: ['bookings', 'user'] })
      qc.invalidateQueries({ queryKey: ['trips'] })
      qc.invalidateQueries({ queryKey: ['trip'] })
    },
  })
}

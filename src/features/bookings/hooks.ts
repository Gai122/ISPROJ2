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
  return useMutation<any, Error, { id: string; patch: any }, unknown>({
    mutationFn: (payload: { id: string; patch: any }) => api.updateBooking(payload.id, payload.patch),
    onSuccess: () => {
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

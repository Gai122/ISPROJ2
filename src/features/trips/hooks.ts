import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../../api/trips'

export function useTrips(params?: any) {
  return useQuery({ queryKey: ['trips', params || 'all'], queryFn: () => api.listTrips(params) })
}

export function useTrip(tripId?: string) {
  return useQuery({ queryKey: ['trip', tripId], queryFn: () => api.getTrip(tripId!), enabled: !!tripId })
}

export function useCreateTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.createTrip(data),
    onMutate: async (newTrip: any) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: ['trips'] })

      // Snapshot previous values for rollback
      const previous = qc.getQueriesData({ queryKey: ['trips'] })

      // Create a temporary optimistic trip entry
      const tmp = { ...newTrip, $id: `tmp-${Date.now()}` }

      // Prepend the optimistic trip into every cached trips query result
      previous.forEach(([key, data]: any) => {
        if (!Array.isArray(data)) return
        qc.setQueryData(key as any, [tmp, ...data])
      })

      return { previous }
    },
    onError: (_err, _variables, context: any) => {
      // Rollback to previous cache state
      if (context?.previous) {
        context.previous.forEach(([key, data]: any) => qc.setQueryData(key as any, data))
      }
    },
    onSuccess: (created: any) => {
      // Replace any temporary entries with the server-provided created document
      const queries = qc.getQueriesData({ queryKey: ['trips'] })
      queries.forEach(([key, data]: any) => {
        if (!Array.isArray(data)) return
        // remove temp entries that match by title/price fallback then add created if missing
        const filtered = data.filter((d: any) => !String(d.$id || '').startsWith('tmp-'))
        const exists = filtered.some((d: any) => d.$id === created.$id)
        const next = exists ? filtered : [created, ...filtered]
        qc.setQueryData(key as any, next)
      })

      // Ensure server-authoritative data is eventually fetched
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  })
}

export function useUpdateTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: any) => api.updateTrip(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['trips'] })
      if (variables?.id) qc.invalidateQueries({ queryKey: ['trip', variables.id] })
    },
  })
}

export function useDeleteTrip() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => api.deleteTrip(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }) })
}

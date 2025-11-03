import { databases, ids, storage, account } from './appwriteClient'
import type { Trip } from '../types'
import { ID, Models, Query } from 'appwrite'

function deepSanitize(obj: any, forbiddenKeys: string[] = []) {
  if (obj == null) return obj
  if (Array.isArray(obj)) return obj.map((v) => deepSanitize(v, forbiddenKeys))
  if (typeof obj !== 'object') return obj
  const copy: any = {}
  for (const [k, v] of Object.entries(obj)) {
    if (forbiddenKeys.includes(k)) continue
    if (k.startsWith('$')) continue
    // skip any explicit forbidden keys
    if (k === 'id' || k === '$id' || k === 'createdAt' || k === 'updatedAt' || k === '$createdAt' || k === '$updatedAt') continue
    copy[k] = deepSanitize(v as any, forbiddenKeys)
  }
  return copy
}

function sanitizeTripObject(obj: any) {
  if (!obj || typeof obj !== 'object') return obj
  // remove top-level forbidden fields and any $-prefixed fields
  return deepSanitize(obj)
}

function sanitizeItineraryObject(obj: any) {
  // produce a shallow-cleaned plus deep-sanitized copy without id fields
  if (!obj || typeof obj !== 'object') return obj
  const copy = { ...obj }
  // remove common forbidden keys
  delete copy.id
  delete copy.$id
  delete copy.createdAt
  delete copy.updatedAt
  delete copy.$createdAt
  delete copy.$updatedAt
  // now deep sanitize nested fields as well
  return deepSanitize(copy)
}

function ensureTripsConfigured() {
  if (!ids.databaseId) throw new Error('Appwrite database ID not configured (VITE_APPWRITE_DATABASE_ID)')
  if (!ids.tripsCollectionId) throw new Error('Trips collection ID not configured (VITE_APPWRITE_TRIPS_COLLECTION_ID)')
}

export async function listTrips(params?: { search?: string; transportMode?: string }) {
  ensureTripsConfigured()
  const { search, transportMode } = params || {}
  const queries: string[] = []
  if (search) queries.push(Query.search('title', search))
  if (transportMode) queries.push(Query.equal('transportMode', transportMode))
  const res = await databases.listDocuments(ids.databaseId, ids.tripsCollectionId, queries)
  const trips = res.documents as unknown as Trip[]

  // normalize seatsAvailable for each trip
  const normalizedTrips = (trips || []).map((t: any) => {
    const raw = t.seatsAvailable
    const total = t.seatsTotal
    let seatsAvailableNum = Number(raw)
    if (raw === undefined || raw === null || String(raw).trim() === '' || isNaN(seatsAvailableNum)) {
      seatsAvailableNum = Number(total) || 0
    }
    return { ...t, seatsAvailable: seatsAvailableNum }
  })

  // If itineraries collection is configured, fetch all itineraries and attach per trip
  if (ids.itinerariesCollectionId) {
    try {
      const itinRes = await databases.listDocuments(ids.databaseId, ids.itinerariesCollectionId)
      const allItins = itinRes.documents || []
      const byTrip: Record<string, any[]> = {}
      for (const it of allItins) {
        const tId = (it as any).tripId
        if (!tId) continue
        if (!byTrip[tId]) byTrip[tId] = []
        byTrip[tId].push(it)
      }

      // attach merged itineraries to each trip (merge with embedded itineraries for compatibility)
      return (normalizedTrips || []).map((t: any) => {
        const embedded = t.itineraries || []
        const fetched = byTrip[t.$id] || []
        // merge fetched and embedded: prefer fetched items (they have $id), then add embedded ones that don't match
        const merged = [...fetched]
        for (const e of embedded) {
          const exists = merged.some((m: any) => m && m.$id && e && (e.$id ? e.$id === m.$id : false))
          if (!exists) merged.push(e)
        }
        const sorted = merged.sort((a: any, b: any) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0))
        return { ...t, itineraries: sorted }
      })
    } catch (e) {
      // if itineraries fetch fails, return trips as-is (no itineraries)
      console.warn('Failed to fetch itineraries for listTrips', e)
      return normalizedTrips
    }
  }

  // If no itineraries collection, return normalized trips as-is (they may have embedded itineraries)
  return normalizedTrips
}

export async function getTrip(id: string) {
  ensureTripsConfigured()
  let doc: any
  try {
    doc = await databases.getDocument(ids.databaseId, ids.tripsCollectionId, id)
  } catch (e: any) {
    console.error('[getTrip] failed to fetch trip', { id, databaseId: ids.databaseId, collectionId: ids.tripsCollectionId, err: e })
    throw new Error(e?.message || 'Failed to load trip')
  }

  // normalize seatsAvailable on trip
  const tripObj = { ...(doc as any) }
  const raw = tripObj.seatsAvailable
  const total = tripObj.seatsTotal
  let seatsAvailableNum = Number(raw)
  if (raw === undefined || raw === null || String(raw).trim() === '' || isNaN(seatsAvailableNum)) {
    seatsAvailableNum = Number(total) || 0
  }
  tripObj.seatsAvailable = seatsAvailableNum

  // fetch itineraries related to this trip (if the collection is configured)
  let fetchedItineraries: any[] = []
  try {
    if (ids.itinerariesCollectionId) {
      const res = await databases.listDocuments(ids.databaseId, ids.itinerariesCollectionId, [Query.equal('tripId', id)])
      fetchedItineraries = res.documents || []
    }
  } catch (err) {
    console.warn('[getTrip] failed to fetch itineraries for trip', { id, err })
    fetchedItineraries = []
  }

  const embedded = (doc as any).itineraries || []
  const merged = [...(fetchedItineraries || [])]
  for (const e of embedded) {
    const exists = merged.some((m: any) => (m && m.$id && e && (e.$id ? e.$id === m.$id : false)))
    if (!exists) merged.push(e)
  }

  const sorted = merged.sort((a: any, b: any) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0))

  return { ...(tripObj as any), itineraries: sorted } as unknown as Trip
}

export async function createTrip(data: Omit<Trip, '$id' | 'createdBy' | 'updatedAt' | 'seatsAvailable'> & { itineraries?: any[] }) {
  // Ensure we have an authenticated user to record as creator
  let creatorId: string | null = null
  try {
    const u = await account.get()
    creatorId = (u as any).$id || null
  } catch (e) {
    // account.get() may throw if not authenticated
    // For security, require an authenticated admin to create trips
    throw new Error('Authentication required to create trips')
  }

  // Extract itineraries from payload to avoid unknown attribute errors when writing trip document
  const itineraries = (data as any).itineraries || []
  let tripPayload: any = sanitizeTripObject({ ...data })
  delete tripPayload.itineraries

  tripPayload.seatsAvailable = data.seatsTotal
  tripPayload.createdBy = creatorId
  // If tripPayload.transportMode is missing, try to infer from first itinerary (handled by the caller ideally)
  // NOTE: don't add custom createdAt/updatedAt fields here; Appwrite provides $createdAt

  const doc = await databases.createDocument(ids.databaseId, ids.tripsCollectionId, ID.unique(), tripPayload)

  // If there are itineraries, create them in the itineraries collection and attach tripId
  let createdItineraries: any[] = []
  try {
    if (ids.itinerariesCollectionId && Array.isArray(itineraries) && itineraries.length > 0) {
      for (const item of itineraries) {
        const itemClean = sanitizeItineraryObject(item)
        // Build strict payload (whitelist) to avoid any unknown attributes
        const itemPayload = {
          tripId: (doc as any).$id,
          dayNumber: itemClean.dayNumber,
          title: itemClean.title,
          description: itemClean.description,
          location: itemClean.location,
          transportMode: itemClean.transportMode || null,
          startTime: itemClean.startTime || null,
          endTime: itemClean.endTime || null,
        }
        // debug log
        try {
          console.debug('[createTrip] creating itinerary payload:', itemPayload)
        } catch {}
        const created = await databases.createDocument(ids.databaseId, ids.itinerariesCollectionId, ID.unique(), itemPayload)
        createdItineraries.push(created)
      }
    }
  } catch (e) {
    // Best-effort: if itinerary creation fails, log and continue; trip was created
    console.warn('Failed to create itineraries for trip', e)
  }

  return { ...(doc as any), itineraries: createdItineraries } as unknown as Trip
}

export async function updateTrip(id: string, patch: Partial<Trip> & { itineraries?: any[] }) {
  // If itineraries are present in the patch, handle create/update of itinerary docs separately
  const itineraries = (patch as any).itineraries
  if (itineraries && ids.itinerariesCollectionId) {
    // fetch existing itinerary docs for this trip
    let existingIds: string[] = []
    try {
      const resExisting = await databases.listDocuments(ids.databaseId, ids.itinerariesCollectionId, [Query.equal('tripId', id)])
      existingIds = (resExisting.documents || []).map((d: any) => d.$id)
    } catch (e) {
      existingIds = []
    }

    const incomingIds: string[] = []

    for (const item of itineraries) {
      try {
        const docId = item.$id || item.id || null
        if (docId) {
          incomingIds.push(docId)
          // update existing itinerary
          // Build a whitelist payload to avoid sending unknown attributes like 'id'
          const itemClean = sanitizeItineraryObject(item)
          const payload: any = {
            dayNumber: itemClean.dayNumber,
            title: itemClean.title,
            description: itemClean.description,
            location: itemClean.location,
            transportMode: itemClean.transportMode || null,
            startTime: itemClean.startTime || null,
            endTime: itemClean.endTime || null,
          }
          // debug log
          try {
            console.debug('[updateTrip] updating itinerary', docId, 'payload:', payload)
          } catch {}
          await databases.updateDocument(ids.databaseId, ids.itinerariesCollectionId, docId, payload)
        } else {
          // create new itinerary linked to this trip
          const itemClean = sanitizeItineraryObject(item)
          const itemPayload = {
            tripId: id,
            dayNumber: itemClean.dayNumber,
            title: itemClean.title,
            description: itemClean.description,
            location: itemClean.location,
            transportMode: itemClean.transportMode || null,
            startTime: itemClean.startTime || null,
            endTime: itemClean.endTime || null,
          }
          try {
            console.debug('[updateTrip] creating itinerary payload:', itemPayload)
          } catch {}
          const created = await databases.createDocument(ids.databaseId, ids.itinerariesCollectionId, ID.unique(), itemPayload)
          if (created && (created as any).$id) incomingIds.push((created as any).$id)
        }
      } catch (e) {
        console.warn('Failed to create/update itinerary item', e)
      }
    }

    // delete itineraries that existed but were not included in incoming list
    const toDelete = existingIds.filter((x) => !incomingIds.includes(x))
    for (const delId of toDelete) {
      try {
        await databases.deleteDocument(ids.databaseId, ids.itinerariesCollectionId, delId)
      } catch (e) {
        console.warn('Failed to delete itinerary', delId, e)
      }
    }

    // remove itineraries from patch so trips document update doesn't include unknown attribute
    delete (patch as any).itineraries
  }

  let payload: any = sanitizeTripObject({ ...patch })
  // NOTE: don't add custom updatedAt; Appwrite has system timestamps ($updatedAt)
  const doc = await databases.updateDocument(ids.databaseId, ids.tripsCollectionId, id, payload)

  // Fetch and attach itineraries to returned trip
  let currentItineraries: any[] = []
  try {
    if (ids.itinerariesCollectionId) {
      const res = await databases.listDocuments(ids.databaseId, ids.itinerariesCollectionId, [Query.equal('tripId', id)])
      currentItineraries = res.documents || []
    }
  } catch {
    currentItineraries = []
  }

  return { ...(doc as any), itineraries: currentItineraries } as unknown as Trip
}

export async function deleteTrip(id: string) {
  // Optionally delete associated itineraries (best-effort)
  try {
    if (ids.itinerariesCollectionId) {
      const res = await databases.listDocuments(ids.databaseId, ids.itinerariesCollectionId, [Query.equal('tripId', id)])
      const docs = res.documents || []
      for (const it of docs) {
        try {
          await databases.deleteDocument(ids.databaseId, ids.itinerariesCollectionId, (it as any).$id)
        } catch {
          // ignore individual delete failures
        }
      }
    }
  } catch (e) {
    // ignore
  }

  await databases.deleteDocument(ids.databaseId, ids.tripsCollectionId, id)
}

export async function uploadTripImage(file: File) {
  const bucketId = ids.imagesBucketId
  if (!bucketId) throw new Error('Images bucket not configured')
  const res = await storage.createFile(bucketId, ID.unique(), file)
  return res.$id
}

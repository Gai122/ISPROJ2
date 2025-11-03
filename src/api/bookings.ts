import { databases, ids, account } from './appwriteClient'
import { ID, Query } from 'appwrite'

export type BookingPayload = {
  tripId: string
  userId: string
  passengers: number
  totalPrice: number
  status?: 'pending' | 'confirmed' | 'cancelled'
  paymentStatus?: 'unpaid' | 'paid' | 'refunded'
  notes?: string
}

function ensureCollectionsConfigured() {
  if (!ids.tripsCollectionId) throw new Error('Trips collection ID not configured (VITE_APPWRITE_TRIPS_COLLECTION_ID)')
  if (!ids.bookingsCollectionId) throw new Error('Bookings collection ID not configured (VITE_APPWRITE_BOOKINGS_COLLECTION_ID)')
}

const ADMINS_TEAM_ID = import.meta.env.VITE_APPWRITE_ADMINS_TEAM_ID as string | undefined

export async function createBooking(payload: BookingPayload) {
  ensureCollectionsConfigured()

  // Require authenticated user and ensure it's a client account (not admin)
  let currentUser: any
  try {
    currentUser = await account.get()
  } catch (e: any) {
    console.error('[createBooking] user not authenticated', e)
    throw new Error('You must be logged in to create a booking')
  }

  // disallow admins from creating bookings via client UI
  const role = (currentUser as any)?.prefs?.role
  if (role === 'admin') {
    throw new Error('Admin accounts are not allowed to create bookings')
  }

  // check seats and decrement seatsAvailable on the trip
  let trip: any
  try {
    trip = await databases.getDocument(ids.databaseId, ids.tripsCollectionId, payload.tripId)
  } catch (e: any) {
    console.error('[createBooking] failed to fetch trip', e)
    throw new Error(e?.message || 'Trip not found')
  }

  const tripObj = trip as any
  // Handle empty-string or missing seatsAvailable as missing
  const rawSeatsAvailable = tripObj?.seatsAvailable
  const rawSeatsTotal = tripObj?.seatsTotal

  let seatsAvailable: number
  if (rawSeatsAvailable === undefined || rawSeatsAvailable === null || String(rawSeatsAvailable).trim() === '') {
    seatsAvailable = Number(rawSeatsTotal) || 0
  } else {
    seatsAvailable = Number(rawSeatsAvailable)
    if (isNaN(seatsAvailable)) seatsAvailable = Number(rawSeatsTotal) || 0
  }

  const passengers = Number(payload.passengers) || 0

  console.debug('[createBooking] trip seatsAvailable/raw:', rawSeatsAvailable, 'seatsTotal:', rawSeatsTotal, 'computedAvailable:', seatsAvailable, 'requestedPassengers:', passengers)

  if (passengers <= 0) throw new Error('Invalid passengers count')

  if (seatsAvailable < passengers) {
    const msg = `Not enough seats available (requested=${passengers}, available=${seatsAvailable})`
    console.warn('[createBooking]', msg)
    throw new Error(msg)
  }

  // build read/write permissions so document can be created/updated by owner and admins
  const ownerId = currentUser.$id
  const readPerms: string[] = [`user:${ownerId}`]
  const writePerms: string[] = [`user:${ownerId}`]
  if (ADMINS_TEAM_ID) {
    readPerms.push(`team:${ADMINS_TEAM_ID}`)
    writePerms.push(`team:${ADMINS_TEAM_ID}`)
  }

  // create booking with explicit permissions
  let bookingDoc: any
  try {
    // Create document using collection-level permissions (do not pass custom permissions from client)
    bookingDoc = await databases.createDocument(
      ids.databaseId,
      ids.bookingsCollectionId,
      ID.unique(),
      {
        ...payload,
        userId: ownerId, // enforce owner as the authenticated user
        status: payload.status ?? 'pending',
        paymentStatus: payload.paymentStatus ?? 'unpaid',
        bookedAt: new Date().toISOString(),
      }
    )
  } catch (e: any) {
    console.error('[createBooking] failed to create booking document', e)
    // Provide a clearer actionable error for Appwrite authorization failures
    const msg = (e && e.message) ? String(e.message) : 'Failed to create booking'
    if (msg.toLowerCase().includes('not authorized') || msg.toLowerCase().includes('permission') || (e && e.code === 401) || (e && e.code === 403)) {
      // If a server-side function is configured, use it as fallback
      const { functions, ids: clientIds } = await import('./appwriteClient')
      const funcId = clientIds.bookingFunctionId
      if (funcId) {
        try {
          console.debug('[createBooking] attempting server function fallback for booking')
          const exec = await functions.createExecution(funcId, JSON.stringify({ payload: { ...payload, userId: ownerId } }))
          const result = JSON.parse(String(exec.response))
          return result
        } catch (fnErr: any) {
          console.error('[createBooking] booking function fallback failed', fnErr)
          throw new Error('Booking blocked by permissions, and server function fallback failed: ' + (fnErr?.message || String(fnErr)))
        }
      }
      throw new Error('Booking creation blocked by Appwrite permissions: ensure your bookings collection allows authenticated users to create documents (check collection "Reads/Writes" rules), or configure a server-side booking function (VITE_APPWRITE_BOOKING_FUNCTION_ID). Original message: ' + msg)
    }
    throw new Error(msg)
  }

  // decrement seatsAvailable — only send allowed fields
  try {
    await databases.updateDocument(ids.databaseId, ids.tripsCollectionId, payload.tripId, {
      seatsAvailable: seatsAvailable - passengers,
    })
  } catch (e: any) {
    console.warn('[createBooking] failed to decrement seatsAvailable on trip:', e)
  }

  return bookingDoc
}

export async function listBookingsByUser(userId: string) {
  if (!ids.bookingsCollectionId) throw new Error('Bookings collection ID not configured (VITE_APPWRITE_BOOKINGS_COLLECTION_ID)')
  const res = await databases.listDocuments(ids.databaseId, ids.bookingsCollectionId, [Query.equal('userId', userId)])
  return res.documents
}

export async function listAllBookings() {
  if (!ids.bookingsCollectionId) throw new Error('Bookings collection ID not configured (VITE_APPWRITE_BOOKINGS_COLLECTION_ID)')
  const res = await databases.listDocuments(ids.databaseId, ids.bookingsCollectionId)
  return res.documents
}

export async function updateBooking(id: string, patch: Partial<BookingPayload> & { status?: string; paymentStatus?: string }) {
  if (!ids.bookingsCollectionId) throw new Error('Bookings collection ID not configured (VITE_APPWRITE_BOOKINGS_COLLECTION_ID)')
  const doc = await databases.updateDocument(ids.databaseId, ids.bookingsCollectionId, id, patch)
  return doc
}

export async function cancelBooking(bookingId: string) {
  if (!ids.bookingsCollectionId) throw new Error('Bookings collection ID not configured (VITE_APPWRITE_BOOKINGS_COLLECTION_ID)')
  const booking = await databases.getDocument(ids.databaseId, ids.bookingsCollectionId, bookingId).catch(() => null)
  if (!booking) throw new Error('Booking not found')

  if ((booking as any).status !== 'pending') throw new Error('Only pending bookings can be cancelled')

  // update booking status
  await databases.updateDocument(ids.databaseId, ids.bookingsCollectionId, bookingId, { status: 'cancelled' })

  // increment seats on trip
  const tripId = (booking as any).tripId
  try {
    const trip = await databases.getDocument(ids.databaseId, ids.tripsCollectionId, tripId)
    const tripObj = trip as any
    let seatsAvailable = Number(tripObj.seatsAvailable)
    if (isNaN(seatsAvailable) || seatsAvailable == null) seatsAvailable = Number(tripObj.seatsTotal) || 0
    const passengers = Number((booking as any).passengers) || 0
    await databases.updateDocument(ids.databaseId, ids.tripsCollectionId, tripId, {
      seatsAvailable: seatsAvailable + passengers,
    })
  } catch (err) {
    console.warn('Failed to increment trip seats; server-side reconciliation may be required', err)
  }
}

export async function getBooking(id: string) {
  if (!ids.bookingsCollectionId) throw new Error('Bookings collection ID not configured (VITE_APPWRITE_BOOKINGS_COLLECTION_ID)')
  const doc = await databases.getDocument(ids.databaseId, ids.bookingsCollectionId, id)
  return doc
}

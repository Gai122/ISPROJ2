export type TransportMode = 'land' | 'sea' | 'air'

export type Trip = {
  $id: string
  title: string
  description: string
  transportMode: TransportMode
  startDate: string
  endDate: string
  price: number
  currency: string
  seatsTotal: number
  seatsAvailable: number
  locations: string[]
  imageIds: string[]
  isActive: boolean
  createdBy: string
  updatedAt: string
}

export type ItineraryItem = {
  $id: string
  tripId: string
  dayNumber: number
  title: string
  description: string
  location: string
  startTime?: string
  endTime?: string
}

export type Booking = {
  $id: string
  tripId: string
  userId: string
  status: 'pending' | 'confirmed' | 'cancelled'
  passengers: number
  totalPrice: number
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  notes?: string
  bookedAt: string
}

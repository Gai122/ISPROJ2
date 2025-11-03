import { Client, Account, Databases, Storage, Teams, Functions } from 'appwrite'

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT as string)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID as string)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const teams = new Teams(client)
export const functions = new Functions(client)

export const ids = {
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID as string,
  tripsCollectionId: import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID as string,
  itinerariesCollectionId: import.meta.env.VITE_APPWRITE_ITINERARIES_COLLECTION_ID as string,
  bookingsCollectionId: import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID as string,
  imagesBucketId: import.meta.env.VITE_APPWRITE_IMAGES_BUCKET_ID as string,
  bookingFunctionId: import.meta.env.VITE_APPWRITE_BOOKING_FUNCTION_ID as string | undefined,
}

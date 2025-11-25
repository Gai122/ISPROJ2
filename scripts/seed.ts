git remote add origin https://github.com/Gai122/ISPROJ2.gitimport { Client, Databases, ID, Account, Teams } from 'appwrite'
import 'dotenv/config'

const endpoint = process.env.VITE_APPWRITE_ENDPOINT!
const projectId = process.env.VITE_APPWRITE_PROJECT_ID!
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID!
const tripsId = process.env.VITE_APPWRITE_TRIPS_COLLECTION_ID!
const itinerariesId = process.env.VITE_APPWRITE_ITINERARIES_COLLECTION_ID!
const bookingsId = process.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID!

async function main() {
  if (!endpoint || !projectId) throw new Error('Missing Appwrite env vars')
  const client = new Client().setEndpoint(endpoint).setProject(projectId)
  const databases = new Databases(client)
  const account = new Account(client)
  const teams = new Teams(client)

  console.log('Seeding sample trips...')
  const sampleTrips = [
    {
      title: 'Bohol Countryside Tour',
      description: 'Explore Chocolate Hills, Loboc River, and more.',
      transportMode: 'land',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      price: 150.0,
      currency: 'PHP',
      seatsTotal: 30,
      seatsAvailable: 30,
      locations: ['Bohol'],
      imageIds: [],
      isActive: true,
      createdBy: 'seed',
      updatedAt: new Date().toISOString(),
    },
  ]

  for (const t of sampleTrips) {
    await databases.createDocument(databaseId, tripsId, ID.unique(), t)
  }

  console.log('Done. Add your admin user to the admins team via Appwrite console.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

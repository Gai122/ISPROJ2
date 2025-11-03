# Appwrite Setup (TravelAgency)

Follow these steps to configure Appwrite for this app. Use Appwrite Cloud or self-hosted.

1) Create Project
- Name: TravelAgency
- Record the Project ID

2) Authentication
- Enable Email/Password auth
- (Optional) Configure OAuth providers

3) Teams
- Create team `admins` and team `clients`
- Copy their Team IDs

4) Database
- Create a database: `travel_agency` (copy Database ID)
- Create collections (copy each Collection ID):

Collection: `trips`
- Attributes:
  - title (string, required) x
  - description (string) x
  - transportMode (enum: land, sea, air) x
  - startDate (datetime) x
  - endDate (datetime) x
  - price (float) x
  - currency (string, default: PHP) x
  - seatsTotal (integer) x
  - seatsAvailable (integer) x
  - locations (string[]) — type: string array x
  - imageIds (string[]) — type: string array x
  - isActive (boolean, default: true) 
  - createdBy (string) x
  - updatedAt (datetime)
- Permissions:
  - Read: role:all
  - Create/Update/Delete: team:admins

Collection: `itineraries`
- Attributes:
  - tripId (string) — use relationship to `trips` if available
  - dayNumber (integer)
  - title (string)
  - description (string)
  - location (string)
  - startTime (datetime, optional)
  - endTime (datetime, optional)
- Permissions:
  - Read: role:all
  - Create/Update/Delete: team:admins

Collection: `bookings`
- Attributes:
  - tripId (string) x
  - userId (string) x
  - status (enum: pending, confirmed, cancelled) x
  - passengers (integer) x 
  - totalPrice (float) x
  - paymentStatus (enum: unpaid, paid, refunded) x
  - notes (string, optional)
  - bookedAt (datetime)
- Permissions:
  - Create: role:member (authenticated)
  - Read/Update: only owner (userId == requester) using Appwrite permissions
  - Read/Update/Delete: team:admins

5) Storage
- Create a bucket `trip-images` (copy Bucket ID)
- Permissions: Read: role:all (public), Write: team:admins

6) Environment Variables (.env)
Create `.env` in repo root with actual IDs:

VITE_APPWRITE_ENDPOINT=YOUR_ENDPOINT
VITE_APPWRITE_PROJECT_ID=YOUR_PROJECT_ID
VITE_APPWRITE_DATABASE_ID=YOUR_DATABASE_ID
VITE_APPWRITE_TRIPS_COLLECTION_ID=YOUR_TRIPS_ID
VITE_APPWRITE_ITINERARIES_COLLECTION_ID=YOUR_ITINERARIES_ID
VITE_APPWRITE_BOOKINGS_COLLECTION_ID=YOUR_BOOKINGS_ID
VITE_APPWRITE_IMAGES_BUCKET_ID=YOUR_BUCKET_ID
VITE_APPWRITE_ADMINS_TEAM_ID=YOUR_ADMINS_TEAM_ID

7) Test Users
- Create a test admin user and a test client user
- Add the admin user to the `admins` team; add the client to `clients` team

8) Optional: Functions/Seeding
- You can run `scripts/seed.ts` locally to create sample data. Ensure `.env` is set up first.

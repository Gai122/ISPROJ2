# Travel Agency Booking App

A full-stack booking web app scaffold using React + TypeScript + Vite, Material UI, React Router, React Query, and Appwrite (Auth, Database, Storage, Teams).

This repository provides a working scaffold with routing, authentication context, guards, and key pages for Admin and Client flows. You must configure Appwrite and environment variables to run end-to-end.

## Tech Stack
- React + TypeScript + Vite
- Material UI (MUI) + MUI X Date Pickers
- React Router v6
- React Hook Form + Zod (you can add schemas)
- React Query (TanStack Query)
- Appwrite SDK (Auth, Database, Storage, Teams)
- Vitest + Testing Library, Playwright (placeholders)

## Requirements Covered
- Admin and client roles; protected routes with `ProtectedRoute` and `AdminRoute`.
- Admin space under `/admin` (dashboard, trips CRUD, bookings) — scaffolded pages.
- Client space under `/app` (home, dashboard, booking detail) — scaffolded pages.
- Public landing at `/` that is distinct from admin UI.
- Trips catalog `/trips` and trip detail `/trips/:tripId` with a booking form stub.

## Getting Started

1. Clone and install dependencies
```
npm install
# or: pnpm install / yarn
```

2. Create a `.env` file in the project root with:
```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=YOUR_PROJECT_ID
VITE_APPWRITE_DATABASE_ID=travel_agency
VITE_APPWRITE_TRIPS_COLLECTION_ID=trips
VITE_APPWRITE_ITINERARIES_COLLECTION_ID=itineraries
VITE_APPWRITE_BOOKINGS_COLLECTION_ID=bookings
VITE_APPWRITE_IMAGES_BUCKET_ID=trip-images
VITE_APPWRITE_ADMINS_TEAM_ID=admins
```

3. Set up Appwrite
- Follow `scripts/appwrite-setup.md` for step-by-step setup and exact permissions.
- After creation, paste the actual IDs into `.env` (IDs may differ from names above).

4. Run the app
```
npm run dev
```
The app opens at http://localhost:5173

5. Seed sample data (optional)
```
npm run seed
```
Edit `scripts/seed.ts` with your IDs and run it after you created the Appwrite project. Then manually add the created test user to the `admins` team.

## Scripts
- `npm run dev` — Vite dev server
- `npm run build` — build for production
- `npm run preview` — preview build
- `npm test` — Vitest unit tests
- `npm run e2e` — Playwright tests (placeholder)
- `npm run seed` — seed example data to Appwrite

## Project Structure
```
src/
  api/            # Appwrite SDK wrappers (client + trips implemented)
  app/            # (reserved)
  features/
    auth/         # AuthProvider, guards, Login/Register
    bookings/     # Booking pages (stubs)
    dashboard/    # Client/Admin dashboards (stubs)
    landing/      # Public landing page
    trips/        # Catalog and detail; admin stubs
  theme/          # MUI Theme provider + toggle
  types/          # Shared types
scripts/
  appwrite-setup.md
  seed.ts
```

## Notes
- This scaffold focuses on structure and wiring. Implement the remaining CRUD forms/tables and booking logic using the provided APIs.
- Ensure server-side Appwrite permissions as documented to complement client-side guards.

## License
MIT

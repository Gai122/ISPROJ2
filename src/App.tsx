import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import LandingPage from './features/landing/LandingPage'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import TripsCatalog from './features/trips/TripsCatalog'
import TripDetail from './features/trips/TripDetail'
import ClientHome from './features/dashboard/ClientHome'
import ClientDashboard from './features/dashboard/ClientDashboard'
import BookingDetail from './features/bookings/BookingDetail'
import AdminDashboard from './features/dashboard/AdminDashboard'
import AdminTrips from './features/trips/admin/AdminTrips'
import AdminTripDetail from './features/trips/admin/AdminTripDetail'
import AdminBookings from './features/bookings/AdminBookings'
import { AdminRoute, ProtectedRoute } from './features/auth/RouteGuards'
import NavBar from './components/NavBar'

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/trips" element={<TripsCatalog />} />
        <Route path="/trips/:tripId" element={<TripDetail />} />

        {/* Client */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientHome />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="bookings/:bookingId" element={<BookingDetail />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Outlet />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="trips" element={<AdminTrips />} />
          <Route path="trips/:tripId" element={<AdminTripDetail />} />
          <Route path="bookings" element={<AdminBookings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

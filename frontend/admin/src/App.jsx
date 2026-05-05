import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RoomList from "./pages/rooms/RoomList";
import RoomForm from "./pages/rooms/RoomForm";
import BookingList from "./pages/bookings/BookingList";
import BookingDetail from "./pages/bookings/BookingDetail";
import GuestList from "./pages/guests/GuestList";
import GuestDetail from "./pages/guests/GuestDetail";
import Reports from "./pages/reports/Reports";
import Promos from "./pages/Promos";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/rooms" element={<RoomList />} />
        <Route path="/rooms/new" element={<RoomForm />} />
        <Route path="/rooms/:id/edit" element={<RoomForm />} />
        <Route path="/bookings" element={<BookingList />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/guests" element={<GuestList />} />
        <Route path="/guests/:id" element={<GuestDetail />} />
        <Route path="/promos" element={<Promos />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
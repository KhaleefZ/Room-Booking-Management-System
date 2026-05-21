import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RoomList from "./pages/rooms/RoomList";
import RoomForm from "./pages/rooms/RoomForm";
import BookingList from "./pages/bookings/BookingList";
import BookingForm from "./pages/bookings/BookingForm";
import BookingDetail from "./pages/bookings/BookingDetail";
import GuestList from "./pages/guests/GuestList";
import GuestDetail from "./pages/guests/GuestDetail";
import GuestForm from "./pages/guests/GuestForm";
import Reports from "./pages/reports/Reports";
import Promos from "./pages/Promos";
import Settings from "./pages/Settings";
import ContactMessages from "./pages/contacts/ContactMessages";

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
        <Route path="/bookings/new" element={<BookingForm />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/guests" element={<GuestList />} />
        <Route path="/guests/new" element={<GuestForm />} />
        <Route path="/guests/:id" element={<GuestDetail />} />
        <Route path="/guests/:id/edit" element={<GuestForm />} />
        <Route path="/promos" element={<Promos />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/contacts" element={<ContactMessages />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Signup from "./pages/Signup";
import CompleteProfile from "./pages/CompleteProfile";

import PatientLayout from "./components/PatientLayout";
import {
  Dashboard,
  Doctors,
  Appointments,
  Prescriptions,
  Payment,
  Profile,
  ChangePassword,
} from "./pages/PatientPages";

import DoctorLayout from "./components/DoctorLayout";
import {
  DoctorDashboard,
  DoctorAppointments,
  DoctorAvailability,
  DoctorPrescriptions,
  DoctorPatients,
  DoctorProfile,
  DoctorChangePassword,
} from "./pages/DoctorPages";

import DoctorSearch from "./pages/DoctorSearch";

import AdminLayout from "./components/AdminLayout";
import {
  AdminDashboard,
  AdminDoctors,
  AdminPatients,
  AdminAppointments,
} from "./pages/AdminPages";

import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";

function Protected({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (role && user.role !== role) {
    return (
      <Navigate
        to={
          user.role === "doctor"
            ? "/doctor/dashboard"
            : user.role === "admin"
            ? "/admin/dashboard"
            : "/patient/dashboard"
        }
        replace
      />
    );
  }

  if (
    user.role === "patient" &&
    user.profileCompleted === false &&
    location.pathname !== "/complete-profile"
  ) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<Protected role="patient" />}>
        <Route
          path="/complete-profile"
          element={<CompleteProfile />}
        />

        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="payment" element={<Payment />} />
          <Route path="profile" element={<Profile />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        <Route path="/search-doctors" element={<DoctorSearch />} />
      </Route>

      <Route element={<Protected role="doctor" />}>
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="availability" element={<DoctorAvailability />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="change-password" element={<DoctorChangePassword />} />
        </Route>
      </Route>

      <Route element={<Protected role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="appointments" element={<AdminAppointments />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
        <AppRoutes />
    </AuthProvider>
  );
}
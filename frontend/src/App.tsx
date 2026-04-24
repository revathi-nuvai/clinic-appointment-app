import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public pages
const Landing    = lazy(() => import('./pages/Landing'));
const Login      = lazy(() => import('./pages/Login'));
const Register   = lazy(() => import('./pages/Register'));
const NotFound   = lazy(() => import('./pages/NotFound'));

// Patient pages
const PatientDashboard    = lazy(() => import('./pages/patient/Dashboard'));
const Doctors             = lazy(() => import('./pages/patient/Doctors'));
const DoctorDetail        = lazy(() => import('./pages/patient/DoctorDetail'));
const BookAppointment     = lazy(() => import('./pages/patient/BookAppointment'));
const MyAppointments      = lazy(() => import('./pages/patient/MyAppointments'));

// Doctor pages
const DoctorDashboard     = lazy(() => import('./pages/doctor/Dashboard'));
const DoctorAppointments  = lazy(() => import('./pages/doctor/Appointments'));
const DoctorProfile       = lazy(() => import('./pages/doctor/Profile'));

// Admin pages
const AdminDashboard      = lazy(() => import('./pages/admin/Dashboard'));
const AdminDoctors        = lazy(() => import('./pages/admin/Doctors'));
const AdminUsers          = lazy(() => import('./pages/admin/Users'));
const AdminAppointments   = lazy(() => import('./pages/admin/Appointments'));

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* Public */}
          <Route path="/"          element={<Landing />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />

          {/* Patient */}
          <Route path="/dashboard"        element={<PatientDashboard />} />
          <Route path="/doctors"          element={<Doctors />} />
          <Route path="/doctors/:id"      element={<DoctorDetail />} />
          <Route path="/book/:doctorId"   element={<BookAppointment />} />
          <Route path="/appointments"     element={<MyAppointments />} />

          {/* Doctor */}
          <Route path="/doctor/dashboard"    element={<DoctorDashboard />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/profile"      element={<DoctorProfile />} />

          {/* Admin */}
          <Route path="/admin/dashboard"    element={<AdminDashboard />} />
          <Route path="/admin/doctors"      element={<AdminDoctors />} />
          <Route path="/admin/users"        element={<AdminUsers />} />
          <Route path="/admin/appointments" element={<AdminAppointments />} />

          {/* Fallback */}
          <Route path="/404"  element={<NotFound />} />
          <Route path="*"     element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

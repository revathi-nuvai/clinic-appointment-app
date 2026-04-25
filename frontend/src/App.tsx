import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Public pages
const Landing    = lazy(() => import('./pages/Landing'));
const Login      = lazy(() => import('./pages/Login'));
const Register   = lazy(() => import('./pages/Register'));
const NotFound   = lazy(() => import('./pages/NotFound'));

// Patient pages
const PatientDashboard = lazy(() => import('./pages/patient/Dashboard'));
const Doctors          = lazy(() => import('./pages/patient/Doctors'));
const DoctorDetail     = lazy(() => import('./pages/patient/DoctorDetail'));
const BookAppointment  = lazy(() => import('./pages/patient/BookAppointment'));
const MyAppointments   = lazy(() => import('./pages/patient/MyAppointments'));

// Doctor pages
const DoctorDashboard    = lazy(() => import('./pages/doctor/Dashboard'));
const DoctorAppointments = lazy(() => import('./pages/doctor/Appointments'));
const DoctorProfile      = lazy(() => import('./pages/doctor/Profile'));

// Admin pages
const AdminDashboard    = lazy(() => import('./pages/admin/Dashboard'));
const AdminDoctors      = lazy(() => import('./pages/admin/Doctors'));
const AdminUsers        = lazy(() => import('./pages/admin/Users'));
const AdminAppointments = lazy(() => import('./pages/admin/Appointments'));

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Spinner />}>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<Landing />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Patient — requires patient role */}
            <Route path="/dashboard"      element={<PrivateRoute roles={['patient']}><PatientDashboard /></PrivateRoute>} />
            <Route path="/doctors"        element={<PrivateRoute roles={['patient']}><Doctors /></PrivateRoute>} />
            <Route path="/doctors/:id"    element={<PrivateRoute roles={['patient']}><DoctorDetail /></PrivateRoute>} />
            <Route path="/book/:doctorId" element={<PrivateRoute roles={['patient']}><BookAppointment /></PrivateRoute>} />
            <Route path="/appointments"   element={<PrivateRoute roles={['patient']}><MyAppointments /></PrivateRoute>} />

            {/* Doctor — requires doctor role */}
            <Route path="/doctor/dashboard"    element={<PrivateRoute roles={['doctor']}><DoctorDashboard /></PrivateRoute>} />
            <Route path="/doctor/appointments" element={<PrivateRoute roles={['doctor']}><DoctorAppointments /></PrivateRoute>} />
            <Route path="/doctor/profile"      element={<PrivateRoute roles={['doctor']}><DoctorProfile /></PrivateRoute>} />

            {/* Admin — requires admin role */}
            <Route path="/admin/dashboard"    element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/doctors"      element={<PrivateRoute roles={['admin']}><AdminDoctors /></PrivateRoute>} />
            <Route path="/admin/users"        element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
            <Route path="/admin/appointments" element={<PrivateRoute roles={['admin']}><AdminAppointments /></PrivateRoute>} />

            {/* Fallback */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*"    element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

// User
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Doctor
export interface Doctor {
  id: string;
  user_id: string;
  specialization: string;
  experience_years: number;
  available_days: string[];
  available_from: string;
  available_to: string;
  slot_duration: number;
  profile_image: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  users?: User;
}

// Appointment
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  reason: string;
  notes: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  patient?: User;
  doctor?: Doctor;
}

// Notification
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
  details?: string[];
}

// Paginated Response
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

// Auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Time Slot
export interface TimeSlot {
  time: string;
  available: boolean;
}

// Book Appointment
export interface BookAppointmentPayload {
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
}

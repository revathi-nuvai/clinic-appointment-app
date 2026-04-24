-- ============================================
-- Clinic Appointment Booking System
-- Run this in Supabase SQL Editor
-- Run each block one at a time
-- ============================================

-- Block 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Block 2: Users table
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin','doctor','patient')),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Block 3: Doctors table
CREATE TABLE doctors (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization   VARCHAR(100) NOT NULL,
  experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
  available_days   TEXT[] DEFAULT '{"Monday","Tuesday","Wednesday","Thursday","Friday"}',
  available_from   TIME DEFAULT '09:00',
  available_to     TIME DEFAULT '17:00',
  slot_duration    INTEGER DEFAULT 30,
  profile_image    TEXT,
  bio              TEXT,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Block 4: Appointments table
CREATE TABLE appointments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id        UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status           VARCHAR(20) DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','cancelled','completed')),
  reason           TEXT NOT NULL,
  notes            TEXT,
  cancelled_by     UUID REFERENCES users(id),
  cancel_reason    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (doctor_id, appointment_date, appointment_time)
);

-- Block 5: Notifications table
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(50) DEFAULT 'info'
             CHECK (type IN ('info','success','warning','error')),
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Block 6: Audit logs table
CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id),
  action     VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id  UUID,
  old_data   JSONB,
  new_data   JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Block 7: Performance indexes
CREATE INDEX idx_appointments_patient    ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor     ON appointments(doctor_id);
CREATE INDEX idx_appointments_date       ON appointments(appointment_date);
CREATE INDEX idx_appointments_status     ON appointments(status);
CREATE INDEX idx_notifications_user      ON notifications(user_id, is_read);
CREATE INDEX idx_doctors_specialization  ON doctors(specialization);
CREATE INDEX idx_audit_logs_user         ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table        ON audit_logs(table_name);

-- Block 8: Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Block 9: Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Block 10: Refresh tokens table (for secure logout + token rotation)
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token   ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

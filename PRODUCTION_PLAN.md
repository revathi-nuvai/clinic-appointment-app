# Clinic Appointment Booking System — Production-Ready Plan
# Role: Senior System Architect + DevOps Engineer
# Version: 2.0 — Complete, Correct, Production-Ready

---

## GAPS IDENTIFIED IN ORIGINAL PLAN

| # | Gap | Risk | Fix |
|---|-----|------|-----|
| 1 | No input validation | SQL injection, bad data | Add Joi/Zod validation |
| 2 | No rate limiting | API abuse, DDoS | Add express-rate-limit |
| 3 | No CORS config | Frontend blocked | Add cors middleware |
| 4 | No pagination | App crashes with large data | Add limit/offset to all list APIs |
| 5 | No refresh token | Users logged out every hour | Add refresh token flow |
| 6 | No double booking check | Doctor booked twice at same time | Add conflict check before insert |
| 7 | No env validation | App crashes with missing env | Add env check on startup |
| 8 | No health check endpoint | Render/Vercel can't verify app | Add /health route |
| 9 | No database indexes | Slow queries at scale | Add indexes on foreign keys |
| 10 | No error logging | Can't debug production issues | Add Winston logger |
| 11 | No API versioning | Breaking changes in future | Add /api/v1/ prefix |
| 12 | No password policy | Weak passwords | Add password strength check |
| 13 | No file size limit | Storage abuse | Add multer limits |
| 14 | No DB connection pool | Too many connections | Configure Supabase pool |
| 15 | No rollback plan | Bad deploy = downtime | Add rollback steps |
| 16 | Missing notifications API | Frontend has no real-time alerts | Add notifications endpoints |
| 17 | No appointment time slots | Double booking possible | Add time slot management |
| 18 | No audit trail | No way to track changes | Add updated_at to all tables |

---

## PRODUCTION STACK (ALL FREE)

```
Frontend   : React 18 + TypeScript + Tailwind CSS  → Vercel
Backend    : Node.js 20 LTS + Express 4            → Render.com
Database   : Supabase (PostgreSQL 15)              → Free 500MB
Auth       : Supabase Auth (JWT + Refresh tokens)  → Free 50K users
Storage    : Supabase Storage                      → Free 1GB
Email      : Resend                                → Free 3K/month
CI/CD      : GitHub Actions                        → Free 2K min/month
Monitoring : Sentry                                → Free 5K errors/month
Logging    : Winston (local) + Sentry              → Free
Domain     : yourclinic.vercel.app                 → Free
```

---

## COMPLETE DATABASE SCHEMA (PRODUCTION-READY)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
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

-- DOCTORS TABLE
CREATE TABLE doctors (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization   VARCHAR(100) NOT NULL,
  experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
  available_days   TEXT[] DEFAULT '{"Monday","Tuesday","Wednesday","Thursday","Friday"}',
  available_from   TIME DEFAULT '09:00',
  available_to     TIME DEFAULT '17:00',
  slot_duration    INTEGER DEFAULT 30, -- minutes per appointment
  profile_image    TEXT,
  bio              TEXT,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- APPOINTMENTS TABLE
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
  -- Prevent double booking: same doctor, date, time
  UNIQUE (doctor_id, appointment_date, appointment_time)
);

-- NOTIFICATIONS TABLE
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

-- AUDIT LOG TABLE (track all changes)
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

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_appointments_patient    ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor     ON appointments(doctor_id);
CREATE INDEX idx_appointments_date       ON appointments(appointment_date);
CREATE INDEX idx_appointments_status     ON appointments(status);
CREATE INDEX idx_notifications_user      ON notifications(user_id, is_read);
CREATE INDEX idx_doctors_specialization  ON doctors(specialization);
CREATE INDEX idx_audit_logs_user         ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table        ON audit_logs(table_name);

-- AUTO UPDATE updated_at TRIGGER
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

-- ROW LEVEL SECURITY (RLS) — patients see only their data
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

---

## COMPLETE API ENDPOINTS (V1)

```
Base URL: /api/v1

AUTH
  POST   /api/v1/auth/register          → register new user
  POST   /api/v1/auth/login             → login, get JWT + refresh token
  POST   /api/v1/auth/logout            → invalidate token
  POST   /api/v1/auth/refresh           → get new access token
  POST   /api/v1/auth/forgot-password   → send reset email
  POST   /api/v1/auth/reset-password    → reset with token

DOCTORS
  GET    /api/v1/doctors                → list (paginated, filterable)
  GET    /api/v1/doctors/:id            → doctor detail
  GET    /api/v1/doctors/:id/slots      → available time slots for a date
  POST   /api/v1/doctors                → [admin] add doctor
  PUT    /api/v1/doctors/:id            → [admin] update doctor
  DELETE /api/v1/doctors/:id            → [admin] soft delete doctor
  PATCH  /api/v1/doctors/:id/image      → [admin/doctor] upload profile image

APPOINTMENTS
  GET    /api/v1/appointments           → [admin] all appointments (paginated)
  GET    /api/v1/appointments/mine      → [patient] own appointments
  GET    /api/v1/appointments/doctor    → [doctor] own appointments
  GET    /api/v1/appointments/:id       → appointment detail
  POST   /api/v1/appointments           → [patient] book appointment
  PATCH  /api/v1/appointments/:id/status → update status (confirm/cancel/complete)
  DELETE /api/v1/appointments/:id       → [patient/admin] cancel appointment

USERS (Admin only)
  GET    /api/v1/users                  → all users (paginated)
  GET    /api/v1/users/:id              → user detail
  PATCH  /api/v1/users/:id/status       → activate/deactivate user
  DELETE /api/v1/users/:id              → soft delete user

NOTIFICATIONS
  GET    /api/v1/notifications          → own notifications
  PATCH  /api/v1/notifications/:id/read → mark as read
  PATCH  /api/v1/notifications/read-all → mark all as read
  DELETE /api/v1/notifications/:id      → delete notification

HEALTH
  GET    /api/v1/health                 → server health check
  GET    /api/v1/health/db              → database connection check
```

---

## COMPLETE FOLDER STRUCTURE

```
clinic-appointment-app/
│
├── .github/
│   └── workflows/
│       ├── backend-deploy.yml      → auto deploy backend on push
│       └── frontend-deploy.yml     → auto deploy frontend on push
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── supabase.js         → supabase client setup
│   │   │   ├── env.js              → env validation on startup
│   │   │   └── logger.js           → winston logger setup
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── doctor.routes.js
│   │   │   ├── appointment.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── notification.routes.js
│   │   │   └── health.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── doctor.controller.js
│   │   │   ├── appointment.controller.js
│   │   │   ├── user.controller.js
│   │   │   └── notification.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   → verify JWT token
│   │   │   ├── role.middleware.js   → check role permissions
│   │   │   ├── validate.middleware.js → Joi/Zod input validation
│   │   │   ├── rateLimit.middleware.js → rate limiting
│   │   │   └── errorHandler.middleware.js → global error handler
│   │   ├── validators/
│   │   │   ├── auth.validator.js    → register/login schema
│   │   │   ├── doctor.validator.js
│   │   │   └── appointment.validator.js
│   │   ├── services/
│   │   │   ├── email.service.js     → Resend email logic
│   │   │   ├── storage.service.js   → Supabase storage logic
│   │   │   ├── notification.service.js
│   │   │   └── audit.service.js     → audit log writer
│   │   ├── utils/
│   │   │   ├── response.js          → standard API response format
│   │   │   ├── pagination.js        → pagination helper
│   │   │   └── slots.js             → time slot generator
│   │   └── index.js                 → app entry point
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── doctor.test.js
│   │   └── appointment.test.js
│   ├── .env                         → local env (never commit)
│   ├── .env.example                 → env template (commit this)
│   ├── .gitignore
│   ├── Dockerfile                   → for containerized deploy
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── patient/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Doctors.tsx
│   │   │   │   ├── DoctorDetail.tsx
│   │   │   │   ├── BookAppointment.tsx
│   │   │   │   └── MyAppointments.tsx
│   │   │   ├── doctor/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Appointments.tsx
│   │   │   │   └── Profile.tsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Doctors.tsx
│   │   │       ├── Users.tsx
│   │   │       └── Appointments.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── Spinner.tsx
│   │   │   ├── DoctorCard.tsx
│   │   │   ├── AppointmentCard.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── services/
│   │   │   ├── api.ts               → axios instance + interceptors
│   │   │   ├── auth.service.ts
│   │   │   ├── doctor.service.ts
│   │   │   ├── appointment.service.ts
│   │   │   └── notification.service.ts
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── NotificationContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useDoctors.ts
│   │   │   └── useAppointments.ts
│   │   ├── types/
│   │   │   └── index.ts             → all TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── formatDate.ts
│   │   │   └── constants.ts
│   │   └── App.tsx
│   ├── public/
│   ├── .env.local                   → local env (never commit)
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── PLAN.md                          → original plan
├── PRODUCTION_PLAN.md               → this file
└── README.md
```

---

## ENVIRONMENT VARIABLES

### Backend (.env)
```bash
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Supabase
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_very_long_random_secret_minimum_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=another_very_long_random_secret
JWT_REFRESH_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=re_your_key
FROM_EMAIL=noreply@yourclinic.vercel.app

# Sentry
SENTRY_DSN=https://your_sentry_dsn

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```bash
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_SENTRY_DSN=https://your_sentry_dsn
```

---

## LINUX VERIFICATION COMMANDS

### Step 1 — Verify System Tools Installed
```bash
# Check Node.js version (must be 18+)
node --version
# Expected: v20.x.x

# Check npm version
npm --version
# Expected: 10.x.x

# Check Git version
git --version
# Expected: git version 2.x.x

# Check all at once
node --version && npm --version && git --version && echo "ALL TOOLS OK"
```

### Step 2 — Verify Project Structure Created
```bash
# Create full structure at once
mkdir -p clinic-appointment-app/{backend/src/{config,routes,controllers,middleware,validators,services,utils,tests},frontend/src/{pages/{patient,doctor,admin},components/{layout,ui},services,context,hooks,types,utils},.github/workflows}

# Verify structure
find clinic-appointment-app -type d | sort
# Expected: all directories listed above
```

### Step 3 — Verify Backend Dependencies Installed
```bash
cd clinic-appointment-app/backend

# Install all production dependencies
npm install express @supabase/supabase-js cors helmet morgan \
  express-rate-limit jsonwebtoken bcryptjs joi resend \
  winston @sentry/node dotenv uuid

# Install dev dependencies
npm install --save-dev nodemon jest supertest

# Verify installed
npm list --depth=0
# Expected: all packages listed with versions

# Check for vulnerabilities
npm audit
# Expected: 0 critical vulnerabilities
```

### Step 4 — Verify Backend Server Starts
```bash
# Start backend
cd clinic-appointment-app/backend
npm run dev &

# Wait 2 seconds then test health endpoint
sleep 2 && curl -s http://localhost:5000/api/v1/health | python3 -m json.tool
# Expected: {"status":"ok","timestamp":"...","uptime":...}

# Test DB health
curl -s http://localhost:5000/api/v1/health/db | python3 -m json.tool
# Expected: {"status":"ok","database":"connected"}

# Kill background server
kill %1
```

### Step 5 — Verify Frontend Dependencies Installed
```bash
cd clinic-appointment-app/frontend

# Create React app with TypeScript
npx create-react-app . --template typescript

# Install additional dependencies
npm install axios react-router-dom react-query \
  @headlessui/react @heroicons/react \
  react-hook-form zod @hookform/resolvers \
  date-fns react-datepicker @sentry/react

# Install Tailwind
npm install --save-dev tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Verify
npm list --depth=0
npm audit
```

### Step 6 — Verify Frontend Builds
```bash
cd clinic-appointment-app/frontend

npm run build
# Expected: Build successful, no errors

# Check build output size
du -sh build/
# Expected: under 5MB for initial build

ls -lh build/static/js/
# Expected: main chunk + smaller chunks (code splitting works)
```

### Step 7 — Verify Supabase Connection
```bash
# Test Supabase URL is reachable
curl -s -o /dev/null -w "%{http_code}" \
  "https://yourproject.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY"
# Expected: 200 or 400 (not 000 which means unreachable)

# Test DB tables exist
curl -s "https://yourproject.supabase.co/rest/v1/users?limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
# Expected: [] (empty array, not 404)
```

### Step 8 — Verify API Endpoints Work
```bash
# Register a test user
curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Patient","email":"test@test.com","password":"Test@1234","role":"patient"}' \
  | python3 -m json.tool
# Expected: {"success":true,"data":{"id":"...","token":"..."}}

# Login
curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234"}' \
  | python3 -m json.tool
# Expected: {"success":true,"data":{"accessToken":"...","refreshToken":"..."}}

# List doctors (authenticated)
TOKEN="your_token_here"
curl -s http://localhost:5000/api/v1/doctors \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool
# Expected: {"success":true,"data":[],"pagination":{"total":0,"page":1}}
```

### Step 9 — Verify Rate Limiting Works
```bash
# Send 101 requests — 101st should be blocked
for i in $(seq 1 101); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/v1/health)
  echo "Request $i: $STATUS"
done | tail -5
# Expected: last requests show 429 (Too Many Requests)
```

### Step 10 — Verify Input Validation
```bash
# Send invalid data — should be rejected
curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"notanemail","password":"123"}' \
  | python3 -m json.tool
# Expected: {"success":false,"error":"Validation failed","details":[...]}
```

### Step 11 — Verify Double Booking Prevention
```bash
TOKEN="patient_token_here"

# Book same slot twice — second should fail
curl -s -X POST http://localhost:5000/api/v1/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"doctor_id":"doc-uuid","appointment_date":"2025-02-01","appointment_time":"10:00","reason":"Checkup"}' \
  | python3 -m json.tool
# Expected: {"success":true,...}

curl -s -X POST http://localhost:5000/api/v1/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"doctor_id":"doc-uuid","appointment_date":"2025-02-01","appointment_time":"10:00","reason":"Another"}' \
  | python3 -m json.tool
# Expected: {"success":false,"error":"This time slot is already booked"}
```

### Step 12 — Verify GitHub Actions Pipeline
```bash
# Check workflow files exist
ls -la clinic-appointment-app/.github/workflows/
# Expected: backend-deploy.yml, frontend-deploy.yml

# Verify git remote is set
git remote -v
# Expected: origin https://github.com/yourname/clinic-app.git

# Push and check actions triggered
git add . && git commit -m "initial: project setup"
git push origin main

# Check pipeline status
gh run list --limit 5
# Expected: shows running or completed workflows
```

### Step 13 — Verify Production Deploy (Render)
```bash
# Test live backend health
curl -s https://your-clinic-api.onrender.com/api/v1/health
# Expected: {"status":"ok",...}

# Check response time (should be under 2s)
curl -s -w "\nTime: %{time_total}s\n" \
  https://your-clinic-api.onrender.com/api/v1/health
# Expected: Time: under 2.000s
```

### Step 14 — Verify Production Frontend (Vercel)
```bash
# Check frontend loads
curl -s -o /dev/null -w "%{http_code}" https://yourclinic.vercel.app
# Expected: 200

# Check HTTPS works
curl -s -I https://yourclinic.vercel.app | grep -i "strict-transport"
# Expected: strict-transport-security header present
```

### Step 15 — Load Test (Scale Check)
```bash
# Install load testing tool
npm install -g artillery

# Create load test config
cat > load-test.yml << 'EOF'
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Ramp up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
scenarios:
  - name: "Health check"
    requests:
      - get:
          url: "/api/v1/health"
  - name: "List doctors"
    requests:
      - get:
          url: "/api/v1/doctors"
          headers:
            Authorization: "Bearer {{ $processEnvironment.TEST_TOKEN }}"
EOF

# Run load test
artillery run load-test.yml

# Expected results:
# - p95 response time under 500ms
# - 0 errors
# - all requests completed
```

---

## FAILURE CHECKS AND RECOVERY STEPS

### Failure 1 — Backend Crashes on Startup
```bash
# Check what's wrong
npm run dev 2>&1 | head -50

# Common causes and fixes:
# Missing env variable → check .env file exists and has all required keys
cat .env | grep -c "=" # Should match number of required vars

# Port already in use
lsof -i :5000
kill -9 $(lsof -t -i:5000)
npm run dev

# Node version wrong
nvm use 20
npm run dev
```

### Failure 2 — Supabase Connection Fails
```bash
# Test connection directly
node -e "
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
s.from('users').select('count').then(r => console.log(r.error ? 'FAIL: ' + r.error.message : 'OK'));
"

# If fails:
# 1. Check SUPABASE_URL format: https://xxxxx.supabase.co (no trailing slash)
# 2. Check service key (not anon key) is used for backend
# 3. Check Supabase project is not paused (free tier pauses after 1 week inactive)
```

### Failure 3 — Frontend Can't Reach Backend (CORS Error)
```bash
# Check backend CORS config in index.js
grep -n "cors" backend/src/index.js

# Fix: ensure FRONTEND_URL in .env matches exactly what browser shows
# Include protocol: http://localhost:3000 NOT localhost:3000

# Test CORS manually
curl -s -I -X OPTIONS http://localhost:5000/api/v1/health \
  -H "Origin: http://localhost:3000" | grep -i "access-control"
# Expected: Access-Control-Allow-Origin: http://localhost:3000
```

### Failure 4 — JWT Token Errors
```bash
# Verify JWT_SECRET is set and long enough
echo ${#JWT_SECRET} # Should be 32+ characters

# Generate a strong secret if needed
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# If tokens expire too fast: increase JWT_EXPIRES_IN in .env
# If refresh token not working: check JWT_REFRESH_SECRET is different from JWT_SECRET
```

### Failure 5 — Render.com Deploy Fails
```bash
# Check build logs on Render dashboard
# Common fixes:

# 1. Add start script to package.json
cat backend/package.json | grep '"start"'
# Should be: "start": "node src/index.js"

# 2. Set Node version in package.json
cat backend/package.json | grep '"engines"'
# Should be: "engines": {"node": ">=20.0.0"}

# 3. Check all env variables are set in Render dashboard
# Go to: Render Dashboard → Your Service → Environment → Add all .env vars

# Rollback if new deploy breaks production:
# Render Dashboard → Deploys → Click previous deploy → Rollback
```

### Failure 6 — Vercel Deploy Fails
```bash
# Test build locally first
cd frontend && npm run build
# Fix all errors before pushing

# Check build output
cat frontend/build/asset-manifest.json | python3 -m json.tool

# If env variables missing in production:
# Vercel Dashboard → Project → Settings → Environment Variables → Add all

# Rollback:
# Vercel Dashboard → Deployments → Previous deployment → Promote to Production
```

### Failure 7 — Database Migration Needed (Schema Change)
```bash
# NEVER drop tables in production — only add columns
# Safe migration example:

# 1. Add new column (safe — no data loss)
# Run in Supabase SQL editor:
# ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meeting_link TEXT;

# 2. Test migration on dev Supabase project first
# 3. Then apply to production Supabase project

# 4. Verify migration
curl -s "https://yourproject.supabase.co/rest/v1/appointments?limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  | python3 -m json.tool | grep meeting_link
```

### Failure 8 — Supabase Free Tier Paused
```bash
# Supabase pauses free projects after 1 week of inactivity
# Prevention: Set up a ping cron job

# Add to GitHub Actions — runs every 3 days
cat > .github/workflows/keep-alive.yml << 'EOF'
name: Keep Supabase Alive
on:
  schedule:
    - cron: '0 12 */3 * *'  # every 3 days
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: curl -s ${{ secrets.SUPABASE_URL }}/rest/v1/ -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}"
EOF

# Recovery if already paused:
# Go to supabase.com → Your project → Click "Restore project"
```

### Failure 9 — Render Free Tier Sleeping (Slow First Request)
```bash
# Render free tier sleeps after 15 min inactivity
# First request takes 30-60 seconds to wake up

# Prevention: ping backend every 10 minutes
# Add to GitHub Actions:
cat > .github/workflows/keep-render-alive.yml << 'EOF'
name: Keep Render Alive
on:
  schedule:
    - cron: '*/10 * * * *'  # every 10 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: curl -s https://your-clinic-api.onrender.com/api/v1/health
EOF
```

### Failure 10 — High Error Rate in Sentry
```bash
# Check Sentry dashboard for error details
# Common production errors:

# 1. Unhandled promise rejections → add try/catch to all async functions
# 2. Database timeout → check Supabase project not paused
# 3. Invalid JWT → check JWT_SECRET matches between env and production
# 4. CORS errors → check FRONTEND_URL env var in Render matches Vercel URL

# Check error logs locally
tail -f backend/logs/error.log
tail -f backend/logs/combined.log
```

---

## SECURITY CHECKLIST

```
[ ] Passwords hashed with bcrypt (cost factor 12)
[ ] JWT tokens expire in 15 minutes
[ ] Refresh tokens expire in 7 days
[ ] All routes protected by auth middleware
[ ] Admin routes protected by role middleware
[ ] Input validation on ALL endpoints (Joi)
[ ] Rate limiting on auth endpoints (stricter: 5 req/15min)
[ ] Rate limiting on all endpoints (100 req/15min)
[ ] CORS restricted to frontend URL only
[ ] Helmet.js security headers enabled
[ ] .env files in .gitignore (never committed)
[ ] Supabase service key NEVER sent to frontend
[ ] File uploads: type check + size limit (5MB max)
[ ] SQL injection: impossible (Supabase uses parameterized queries)
[ ] XSS: React escapes by default (never use dangerouslySetInnerHTML)
[ ] HTTPS enforced on Vercel and Render
[ ] Sentry DSN restricted to your domain
[ ] Audit log for all admin actions
```

---

## PERFORMANCE CHECKLIST (LARGE SCALE)

```
[ ] All list APIs paginated (default 10, max 100 per page)
[ ] Database indexes on all foreign keys and filter columns
[ ] Frontend images lazy loaded
[ ] React code splitting (lazy + Suspense)
[ ] API responses cached with React Query (5 min stale time)
[ ] Supabase connection pooled (pgBouncer enabled in Supabase settings)
[ ] Appointment slots pre-generated (not computed on every request)
[ ] Frontend bundle analyzed (npm run build -- --analyze)
[ ] Images compressed before upload (client-side)
[ ] Debounce search inputs (300ms)
```

---

## STANDARD API RESPONSE FORMAT

Every API endpoint returns this exact format:

```json
// Success
{
  "success": true,
  "data": { ... },
  "pagination": {           // only on list endpoints
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}

// Error
{
  "success": false,
  "error": "Human readable message",
  "code": "ERROR_CODE",
  "details": [...]          // only on validation errors
}
```

---

## GITHUB ACTIONS CI/CD PIPELINES

### Backend Deploy (backend-deploy.yml)
```yaml
name: Deploy Backend
on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: cd backend && npm ci
      - run: cd backend && npm test
      - run: cd backend && npm audit --audit-level=high

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

### Frontend Deploy (frontend-deploy.yml)
```yaml
name: Deploy Frontend
on:
  push:
    branches: [main]
    paths: ['frontend/**']

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}
      # Vercel auto-deploys on push — no extra step needed
```

---

## COMPLETE WEEK-BY-WEEK EXECUTION PLAN

### Day 1 — Account Setup (All Parallel, ~2 hours)

```bash
# Verify after each account created:

# GitHub
gh auth status
# Expected: Logged in to github.com

# Supabase — do via browser, then verify:
curl -s https://yourproject.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY" | head -c 100
# Expected: {"hint":"..."}

# Vercel — install CLI and verify:
npm install -g vercel
vercel whoami
# Expected: your username

# Git global config
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git config --list | grep user
# Expected: user.name and user.email set correctly
```

### Week 1 — Project Init (Parallel Tracks)

```bash
# TRACK A: Backend setup verification
cd clinic-appointment-app/backend
node src/index.js &
curl -s http://localhost:5000/api/v1/health
kill %1
# Expected: {"status":"ok"}

# TRACK B: Frontend setup verification
cd clinic-appointment-app/frontend
npm start &
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
kill %1
# Expected: 200

# After both: Push to GitHub
git init
git add .
git commit -m "initial: project structure setup"
git remote add origin https://github.com/yourname/clinic-app.git
git push -u origin main
# Verify:
gh repo view --web
```

### Week 2 — Backend API Verification

```bash
# After each route is built, test it:

# Auth routes
curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@clinic.com","password":"Admin@1234","role":"admin"}' \
  | python3 -m json.tool

# Doctor routes
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinic.com","password":"Admin@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

curl -s http://localhost:5000/api/v1/doctors \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Run all tests
cd backend && npm test
# Expected: All tests pass
```

### Week 3-5 — Feature Verification

```bash
# Full booking flow test (automated)
cat > test-booking-flow.sh << 'EOF'
#!/bin/bash
BASE="http://localhost:5000/api/v1"

echo "1. Register patient..."
PATIENT=$(curl -s -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Patient","email":"patient@test.com","password":"Test@1234","role":"patient"}')
PATIENT_TOKEN=$(echo $PATIENT | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
echo "Patient token: OK"

echo "2. List doctors..."
DOCTORS=$(curl -s $BASE/doctors -H "Authorization: Bearer $PATIENT_TOKEN")
DOCTOR_ID=$(echo $DOCTORS | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
echo "Doctor ID: $DOCTOR_ID"

echo "3. Book appointment..."
BOOKING=$(curl -s -X POST $BASE/appointments \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"doctor_id\":\"$DOCTOR_ID\",\"appointment_date\":\"2025-03-01\",\"appointment_time\":\"10:00\",\"reason\":\"Checkup\"}")
echo $BOOKING | python3 -m json.tool

echo "4. View my appointments..."
curl -s $BASE/appointments/mine \
  -H "Authorization: Bearer $PATIENT_TOKEN" | python3 -m json.tool

echo "FLOW TEST COMPLETE"
EOF

chmod +x test-booking-flow.sh
./test-booking-flow.sh
```

### Week 6 — Deploy Verification

```bash
# After deploying to Render and Vercel:

# 1. Backend live check
curl -s https://your-clinic-api.onrender.com/api/v1/health | python3 -m json.tool
# Expected: {"status":"ok"}

# 2. Frontend live check
curl -s -o /dev/null -w "Status: %{http_code}\nTime: %{time_total}s\n" \
  https://yourclinic.vercel.app
# Expected: Status: 200, Time: under 2s

# 3. Full end-to-end test on production
BASE="https://your-clinic-api.onrender.com/api/v1"
curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinic.com","password":"Admin@1234"}' \
  | python3 -m json.tool
# Expected: access token returned

# 4. Check GitHub Actions ran successfully
gh run list --limit 5
# Expected: all runs show "completed" status

# 5. Check Sentry receiving events
# Trigger a test error from frontend and verify it appears in Sentry dashboard
```

---

## ROLLBACK PLAN

### Backend Rollback (Render)
```
1. Go to render.com → Dashboard → Your Service
2. Click "Deploys" tab
3. Find last working deploy
4. Click "..." → "Rollback to this deploy"
5. Verify: curl https://your-api.onrender.com/api/v1/health
```

### Frontend Rollback (Vercel)
```
1. Go to vercel.com → Your Project
2. Click "Deployments" tab
3. Find last working deployment
4. Click "..." → "Promote to Production"
5. Verify: curl https://yourclinic.vercel.app
```

### Database Rollback
```
# Supabase does NOT auto-rollback
# Prevention: NEVER drop columns — only add
# If bad data inserted:
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Run targeted DELETE/UPDATE to fix bad data
# 3. Use created_at timestamp to identify bad records
```

---

## FINAL CHECKLIST BEFORE GOING LIVE

```
BACKEND
[ ] Health endpoint returns 200
[ ] All API endpoints tested with Postman
[ ] Rate limiting working (test with 101 requests)
[ ] Input validation rejecting bad data
[ ] Auth middleware blocking unauthorized requests
[ ] Role middleware blocking wrong roles
[ ] Double booking prevented
[ ] Errors logged to Sentry
[ ] No .env file committed to GitHub
[ ] npm audit shows 0 critical vulnerabilities

FRONTEND
[ ] npm run build succeeds with 0 errors
[ ] 0 TypeScript errors
[ ] All pages load without console errors
[ ] Login/Register flow works
[ ] Patient can book appointment
[ ] Doctor can accept/reject
[ ] Admin can manage doctors/users
[ ] Works on mobile (responsive)
[ ] Error boundary catches crashes gracefully

DATABASE
[ ] All tables created with correct schema
[ ] All indexes created
[ ] RLS policies enabled
[ ] Supabase Auth configured
[ ] Storage bucket created and public read enabled

DEPLOYMENT
[ ] Backend live on Render with correct env vars
[ ] Frontend live on Vercel with correct env vars
[ ] GitHub Actions pipelines passing
[ ] Keep-alive cron jobs active (Supabase + Render)
[ ] Sentry receiving events from both frontend and backend
[ ] Custom domain connected (optional)
```

---

## TIMELINE SUMMARY

| Period   | Work                                    | Verify With |
|----------|-----------------------------------------|-------------|
| Day 1    | All account setups + tool installs      | gh auth status, vercel whoami |
| Week 1   | Project init + Supabase schema          | curl /health, npm start |
| Week 2   | Backend API + middleware                | npm test, Postman |
| Week 3   | Frontend core + auth flow               | npm run build |
| Week 4-5 | All role features + integration         | test-booking-flow.sh |
| Week 5   | Email + file upload integration         | Check inbox, check storage |
| Week 6   | Deploy + final testing + go live        | curl production URLs |

```
Total time : 6 weeks
Total cost : $0/month
Final URL  : https://yourclinic.vercel.app
Scale ready: up to 50,000 users (Supabase free limit)
```

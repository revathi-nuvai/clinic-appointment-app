# Clinic Appointment Booking System — Master Plan

## Stack
- Frontend  : React + TypeScript  → Vercel
- Backend   : Node.js + Express   → Render.com
- Database  : Supabase (PostgreSQL)
- Auth      : Supabase Auth
- Storage   : Supabase Storage
- Email     : Resend
- CI/CD     : GitHub Actions
- Monitoring: Sentry
- Domain    : yourapp.vercel.app (free)

---

## Roles
- Admin   → Add/Remove doctors, view all appointments, manage users
- Doctor  → View appointments, accept/reject/complete, view patient info
- Patient → Register, browse doctors, book appointments, get email confirmation

---

## Database Schema

### Users
- id, name, email, password (hashed), role (admin/doctor/patient), created_at

### Doctors
- id, user_id, specialization, experience_years, available_days, profile_image

### Appointments
- id, patient_id, doctor_id, appointment_date, appointment_time, status (pending/confirmed/cancelled/completed), reason, created_at

### Notifications
- id, user_id, message, is_read, created_at

---

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout

### Doctors
- GET    /api/doctors
- GET    /api/doctors/:id
- POST   /api/doctors
- PUT    /api/doctors/:id
- DELETE /api/doctors/:id

### Appointments
- GET    /api/appointments
- GET    /api/appointments/mine
- GET    /api/appointments/doctor
- POST   /api/appointments
- PUT    /api/appointments/:id
- DELETE /api/appointments/:id

### Users (Admin only)
- GET    /api/users
- DELETE /api/users/:id

---

## Frontend Pages

### Public
- /           → Landing page
- /login      → Login
- /register   → Register

### Patient
- /dashboard        → Welcome + upcoming appointments
- /doctors          → Browse all doctors
- /doctors/:id      → Doctor detail + Book button
- /appointments     → My appointments
- /book/:doctorId   → Book appointment form

### Doctor
- /doctor/dashboard     → Today's appointments
- /doctor/appointments  → All appointments
- /doctor/profile       → Edit profile

### Admin
- /admin/dashboard     → Stats overview
- /admin/doctors       → Manage doctors
- /admin/users         → Manage users
- /admin/appointments  → All appointments

---

## Folder Structure

```
clinic-appointment-app/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── doctor.routes.js
│   │   │   ├── appointment.routes.js
│   │   │   └── user.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── doctor.controller.js
│   │   │   ├── appointment.controller.js
│   │   │   └── user.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── role.middleware.js
│   │   ├── config/
│   │   │   └── supabase.js
│   │   └── index.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── patient/
│   │   │   ├── doctor/
│   │   │   └── admin/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── DoctorCard.tsx
│   │   │   ├── AppointmentCard.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   └── appointment.service.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── App.tsx
│   └── package.json
│
└── PLAN.md
```

---

## Parallel Execution Plan

### Day 1 — One-Time Setup (All Parallel)
- [ ] Create GitHub repo
- [ ] Create Supabase account + project
- [ ] Create Vercel account
- [ ] Create Render.com account
- [ ] Create Resend account
- [ ] Create Sentry account
- [ ] Install VS Code + extensions
- [ ] Install Node.js + npm
- [ ] Install Git

---

### Week 1 — Project Initialization

PARALLEL:

| Track A (Backend)             | Track B (Frontend)              |
|-------------------------------|---------------------------------|
| mkdir backend                 | npx create-react-app            |
| npm init                      | Install dependencies            |
| Install express               | Setup folder structure          |
| Install supabase client       | Setup React Router              |
| Setup .env file               | Setup Tailwind CSS              |
| Setup folder structure        | Setup Sentry frontend           |
| Connect Supabase              | Create base layout              |
| Test server runs              | Test app runs                   |

SEQUENTIAL (after both tracks):
- [ ] Setup Supabase tables
- [ ] Setup Supabase Auth
- [ ] Push to GitHub

---

### Week 2 — Backend API

PARALLEL:

| Track A (Auth)        | Track B (Doctors)       | Track C (Appointments)      |
|-----------------------|-------------------------|-----------------------------|
| POST /register        | GET /doctors            | GET /appointments           |
| POST /login           | GET /doctors/:id        | POST /appointments          |
| POST /logout          | POST /doctors           | PUT /appointments/:id       |
|                       | PUT /doctors/:id        | DELETE /appointments/:id    |
|                       | DELETE /doctors/:id     |                             |

SEQUENTIAL (after all routes):
- [ ] Add auth middleware
- [ ] Add role middleware
- [ ] Add error handling
- [ ] Test all APIs with Postman

---

### Week 3 — Frontend Core

PARALLEL:

| Track A (Public Pages)  | Track B (Core Setup)         |
|-------------------------|------------------------------|
| Landing page            | AuthContext                  |
| Login page              | ProtectedRoute component     |
| Register page           | API service (axios setup)    |
| Navbar component        | Role-based routing           |

SEQUENTIAL (after both tracks):
- [ ] Connect Login to backend
- [ ] Connect Register to backend
- [ ] Test auth flow end to end
- [ ] Test role redirect works

---

### Week 4-5 — Feature Development

PARALLEL:

| Patient Features      | Doctor Features         | Admin Features          |
|-----------------------|-------------------------|-------------------------|
| Browse doctors        | Doctor dashboard        | Admin dashboard         |
| Doctor detail         | View appointments       | Manage doctors          |
| Book appointment      | Accept / Reject         | Manage users            |
| My appointments       | Complete appointment    | View all appointments   |
| Cancel booking        | View patient info       | Stats overview          |

SEQUENTIAL (after all features):
- [ ] Connect all pages to backend APIs
- [ ] Test patient booking flow
- [ ] Test doctor accept/reject flow
- [ ] Test admin management flow

---

### Week 5 — Integration

PARALLEL:

| Track A (Email)               | Track B (File Upload)          |
|-------------------------------|--------------------------------|
| Setup Resend                  | Setup Supabase Storage         |
| Email on booking              | Doctor profile image upload    |
| Email on confirmation         | Image preview on frontend      |
| Email on cancellation         |                                |

SEQUENTIAL (after both):
- [ ] Test full booking flow with email
- [ ] Test image upload works
- [ ] Fix any bugs

---

### Week 6 — Deployment

PARALLEL:

| Track A (Backend)             | Track B (Frontend)             |
|-------------------------------|--------------------------------|
| Add Render config             | Add Vercel config              |
| Set env variables             | Set env variables              |
| Deploy to Render              | Deploy to Vercel               |
| Test live API                 | Test live frontend             |

SEQUENTIAL (after both deployed):
- [ ] Connect frontend to live backend URL
- [ ] Setup GitHub Actions (auto deploy)
- [ ] Setup Sentry error monitoring
- [ ] Test complete app live
- [ ] Fix production bugs

---

### Week 6 End — Final Testing

PARALLEL:

| Patient Testing       | Doctor Testing          | Admin Testing           |
|-----------------------|-------------------------|-------------------------|
| Register              | Login as doctor         | Login as admin          |
| Login                 | View appointments       | Add doctor              |
| Book appointment      | Accept booking          | Remove user             |
| Get email             | Complete appointment    | View all appointments   |
| Cancel booking        | View patient info       | Dashboard stats         |

---

## What Cannot Be Parallel (Sequential Only)

1. Supabase setup → must finish before backend connects
2. Backend API → must finish before frontend connects
3. Auth middleware → must finish before protected routes work
4. Deploy backend → must finish before frontend points to it

---

## Timeline Summary

| Period  | Work                        |
|---------|-----------------------------|
| Day 1   | All account setups          |
| Week 1  | Project initialization      |
| Week 2  | Backend API                 |
| Week 3  | Frontend core               |
| Week 4-5| Feature development         |
| Week 5  | Integration                 |
| Week 6  | Deploy + Final testing      |

Total: 6 weeks
Cost: $0
Final URL: yourclinic.vercel.app

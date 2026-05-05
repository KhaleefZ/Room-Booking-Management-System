# RBMS — Room Booking & Management System
### HaizoTech · Coimbatore, Tamil Nadu, India

A complete, production-grade hotel management platform with a public booking website and a private admin dashboard — built with Django, React, PostgreSQL, Celery, and Razorpay.

---

## Project Structure

```
RBMS/
├── backend/                  # Django REST API
│   ├── core/                 # Project settings, URLs, Celery config
│   ├── rooms/                # Room, RoomPhoto, Amenity models + API
│   ├── bookings/             # Booking model, availability, auto-cancel task
│   ├── guests/               # Guest model + API
│   ├── payments/             # Razorpay integration + email tasks
│   ├── promos/               # Promo code model + validate API
│   ├── reports/              # Revenue, occupancy reports + CSV export
│   ├── settings_app/         # HotelSettings singleton
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/               # Public hotel website (React + Vite)
│   └── admin/                # Admin dashboard (React + Vite)
├── .env.example
├── .gitignore
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2 + Django REST Framework |
| Auth | SimpleJWT (access 15min + refresh 7 days) |
| Database | PostgreSQL 17 |
| Cache / Broker | Redis |
| Task Queue | Celery + Celery Beat |
| Frontend | React 18 + Vite + Tailwind CSS |
| State | TanStack Query + Zustand |
| Payments | Razorpay (UPI, cards, net banking) |
| Media | Cloudinary (room photo CDN) |
| Email | Django SMTP → Gmail (dev) / SendGrid (prod) |
| Deployment | Nginx + Gunicorn + Supervisor |

---

## Features

### Public Website (`frontend/public/`)
- Landing page with hero, amenities, and featured rooms
- Rooms listing with filter by type and sort by price
- Room detail page with photo gallery and availability calendar
- 3-step booking flow — dates → guest details → Razorpay payment
- Promo code validation with live price breakdown
- Booking confirmation page + automatic confirmation email
- Gallery, About, and Contact pages

### Admin Dashboard (`frontend/admin/`)
- JWT-secured login
- Dashboard with today's check-ins/outs, revenue chart, room status
- Room management — CRUD, photo upload to Cloudinary, amenity tagging
- Booking management — filterable list, detail view, manual status updates
- Guest records with full booking history
- Promo code manager — create, enable/disable, track usage
- Revenue and occupancy reports with CSV export
- Hotel settings — check-in/out times, tax rate, email templates

### Backend
- Availability conflict prevention — no double bookings
- Auto-cancellation — pending bookings expire after 15 minutes via Celery Beat
- Admin-only cancellation — guests cannot cancel via the public API
- Razorpay HMAC signature verification on every payment
- Webhook fallback for missed payment events
- Streaming CSV export for large booking datasets

---

## Local Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 20 LTS |
| PostgreSQL | 17 |
| Redis | 7+ |

### 1. Clone the repository

```bash
git clone https://github.com/gokuls2503/RBMS.git
cd RBMS
```

### 2. Backend setup

```bash
# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt
```

### 3. Environment variables

```bash
# Copy the example file
cp .env.example backend/.env
```

Edit `backend/.env` with your actual values:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DATABASE_URL=postgres://rbms_user:rbms_password@localhost:5432/rbms_db

REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
ADMIN_EMAIL=admin@yourhotel.com
DEFAULT_FROM_EMAIL=RBMS <noreply@yourhotel.com>
```

### 4. Database setup

```sql
-- Run in psql as postgres superuser
CREATE DATABASE rbms_db;
CREATE USER rbms_user WITH PASSWORD 'rbms_password';
GRANT ALL PRIVILEGES ON DATABASE rbms_db TO rbms_user;
GRANT ALL ON SCHEMA public TO rbms_user;
ALTER DATABASE rbms_db OWNER TO rbms_user;
```

### 5. Run migrations and create superuser

```bash
python manage.py makemigrations rooms guests promos settings_app bookings payments reports
python manage.py migrate
python manage.py createsuperuser
```

### 6. Start all services

Open 3 separate terminals:

**Terminal 1 — Django API:**
```bash
cd backend
python manage.py runserver 8000
```

**Terminal 2 — Celery Worker:**
```bash
cd backend
# Windows requires --pool=solo
celery -A core worker --loglevel=info --pool=solo
```

**Terminal 3 — Celery Beat:**
```bash
cd backend
celery -A core beat --loglevel=info
```

### 7. Frontend setup

**Public website** (port 5173):
```bash
cd frontend/public
npm install
# Create .env file
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
echo "VITE_RAZORPAY_KEY_ID=rzp_test_XXXX" >> .env
npm run dev
```

**Admin dashboard** (port 5174):
```bash
cd frontend/admin
npm install
# Create .env file
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
npm run dev -- --port 5174
```

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/token/` | None | Admin login |
| POST | `/api/v1/auth/token/refresh/` | None | Refresh token |
| GET | `/api/v1/rooms/` | None | List all rooms |
| GET | `/api/v1/rooms/{id}/` | None | Room detail |
| GET | `/api/v1/rooms/{id}/availability/` | None | Unavailable dates |
| POST | `/api/v1/rooms/` | Admin | Create room |
| POST | `/api/v1/rooms/{id}/photos/` | Admin | Upload photo |
| POST | `/api/v1/bookings/` | None | Create booking |
| GET | `/api/v1/bookings/` | Admin | List bookings |
| PATCH | `/api/v1/bookings/{id}/update_status/` | Admin | Update status |
| POST | `/api/v1/payments/create-order/` | None | Create Razorpay order |
| POST | `/api/v1/payments/verify/` | None | Verify payment |
| POST | `/api/v1/payments/webhook/` | None | Razorpay webhook |
| POST | `/api/v1/promos/validate/` | None | Validate promo code |
| GET | `/api/v1/reports/revenue/` | Admin | Revenue report |
| GET | `/api/v1/reports/occupancy/` | Admin | Occupancy report |
| GET | `/api/v1/reports/export/` | Admin | CSV export |
| GET/PUT | `/api/v1/hotel-settings/` | Admin | Hotel settings |

---

## Key Business Rules

- **No double booking** — availability is checked before every booking is created
- **15-minute expiry** — pending (unpaid) bookings are auto-cancelled by Celery Beat
- **Admin-only cancellation** — guests cannot cancel via the public website
- **Payment verification** — bookings are only confirmed after HMAC-SHA256 signature is verified
- **Price formula** — `total = (base_price × nights − discount) × (1 + tax_rate/100)`

---

## Deployment (Phase 4)

Production deployment uses:
- **Linux VPS** (Ubuntu 22.04) on AWS / Azure / DigitalOcean
- **Nginx** — reverse proxy + static file serving
- **Gunicorn** — Django WSGI server
- **Supervisor** — process manager for Gunicorn + Celery
- **SSL** — Let's Encrypt via Certbot
- **SendGrid** — transactional email in production

---

## Built By

**HaizoTech** — Technology Solutions  
Coimbatore, Tamil Nadu, India  
[haizotechsolution](https://github.com/haizotechsolution)

---

*RBMS v1.0 · May 2026 · Confidential*
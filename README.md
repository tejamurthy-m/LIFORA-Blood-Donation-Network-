# LIFORA – Complete Blood Donation Network

> **Tagline:** *Every Drop Connects. Every Life Matters.*

**LIFORA** is an enterprise-grade full-stack healthcare network uniting voluntary blood donors, patients/recipients, and accredited hospital blood centres in real time. Designed with a modern healthcare startup aesthetic, it prioritizes emergency dispatch speed, donor confidentiality, spatial proximity matching, certified medical report verification, and clinical hemovigilance compliance.

---

## 🛠️ Complete Full-Stack Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Modern React architecture with Tailwind CSS v4 |
| **Backend API** | Node.js + Express.js (ESM) | High-performance RESTful API with helmet, CORS, rate limiting, Winston logging |
| **Database** | PostgreSQL hosted on Supabase | 13 relational models with UUIDs, indexes, constraints, and cascading rules |
| **ORM** | Prisma Client v6.19 | Schema management, type safety, seeders, and migrations |
| **Authentication** | JWT + bcryptjs (12 rounds) | Dual-token authentication (Access Token + Refresh Token rotation), RBAC |
| **Real-Time Communication** | Socket.IO v4.8 | Low-latency bi-directional WebSocket events with room multiplexing |
| **Email Notifications** | Nodemailer v10.6 | Formatted HTML emergency dispatch alerts and verification receipts |
| **File Storage** | Supabase Storage Bucket | Private medical document uploads with presigned temporary URLs |
| **Interactive Mapping** | Leaflet + OpenStreetMap | Spatial radius search and interactive donor coordinates |
| **Data Analytics** | Recharts | Blood inventory metrics, fulfillment rates, and operational trends |

---

## 🚀 Architectural Phases Completed

- **Phase 0 – Architecture & Audit:** Comprehensive repository audit, schema specification in `docs/BACKEND_IMPLEMENTATION_PLAN.md`.
- **Phase 1 – Backend Foundation:** Express ESM server with security headers, centralized error handler, rate limiters, Winston logger.
- **Phase 2 – Database & Prisma Setup:** 13-model normalized PostgreSQL schema deployed to Supabase with demo seeder.
- **Phase 3 – JWT Authentication & RBAC:** Multi-role authentication (Donor, Recipient, Hospital Staff, Admin), password hashing, token rotation.
- **Phase 4 – Donor Management API:** Haversine geospatial search, blood group compatibility engine, privacy-shielded donor profiles.
- **Phase 5 – Medical Verification & Storage:** Supabase Storage integration with signed report URLs, clinical review workflow.
- **Phase 6 – Blood Requests & Matching Engine:** Public tracking codes (`LIF-xxxx`), 4-step live timelines, donor response management.
- **Phase 7 – Hospital Portal API:** Single shared hospital portal with staff roster, arrivals tracking, and clinical phlebotomy recording.
- **Phase 8 – Real-Time Sockets & Email:** Socket.IO server, room multiplexing (`user:*`, `hospital:*`, `request:*`), Nodemailer dispatchers.
- **Phase 9 – Full-Stack React Integration:** Decoupled service layer (`api.js`, `authService.js`, `requestService.js`, `donorService.js`, `hospitalPortalService.js`).
- **Phase 10 – Verification & Test Suite:** 59 automated test suites with 100% pass rate.

---

## 🔑 Pre-Seeded Accounts & Test Credentials

The database comes pre-seeded with verified test accounts across all three portals:

| Portal | Role | Email | Password | Details |
|---|---|---|---|---|
| **Donor Portal** | Donor | `donor@lifora.org` | `donor123` | Dr. Aryan Sharma (O+, Mumbai, 9 Donations, Verified) |
| **Recipient Portal** | Recipient | `recipient@lifora.org` | `recipient123` | Priya Nair (Bangalore, Active Blood Requests) |
| **Hospital Portal** | Hospital Admin | `hospital@lifora.org` | `hospital123` | Dr. Anita Joshi (Lilavati Hospital Transfusion Head) |
| **Hospital Portal** | Medical Staff | `medical@lilavati.org` | `hospital123` | Dr. Vikram Malhotra (Phlebotomy & Donor Screening) |
| **Hospital Portal** | Donor Coordinator | `coordinator@lilavati.org` | `hospital123` | Sneha Fernandez (Community Donor Outreach) |
| **Hospital Portal** | Request Manager | `requests@lilavati.org` | `hospital123` | Rajesh Kadam (Emergency Requisitions Desk) |
| **Central Admin** | Super Admin | `admin@lifora.org` | `admin123` | Central Dispatch Operations Team |

---

## 🏃 Running the Application Locally

### 1. Backend Server Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Seed the database (Supabase PostgreSQL)
npm run seed

# Run automated test suite (59 tests)
npm test

# Start the Express API + Socket.IO server on port 5000
npm start
```

### 2. Frontend Application Setup
```bash
# In project root
npm install

# Start Vite React development server on port 5173
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 📁 Repository Structure

```
FullStack_Proj/
├── backend/                             # Complete Node.js + Express + Prisma Backend
│   ├── prisma/
│   │   ├── schema.prisma                # 13 relational entities (PostgreSQL)
│   │   └── seed.js                      # Database seeder
│   ├── src/
│   │   ├── config/                      # Environment, database, logger, storage, socket
│   │   ├── controllers/                 # REST controllers (auth, donor, request, hospital, verification, notif)
│   │   ├── middleware/                  # JWT authenticate, RBAC requireRole, error handling
│   │   ├── routes/                      # API v1 routes
│   │   ├── services/                    # Core business logic & database queries
│   │   ├── utils/                       # Haversine distance, blood compatibility matrix, tokens
│   │   ├── validators/                  # Zod input schemas
│   │   ├── app.js                       # Express application factory
│   │   └── server.js                    # HTTP + WebSocket server bootstrap
│   └── tests/                           # 59 automated test cases across 8 suites
├── src/                                 # Existing React 19 Frontend (UI/UX 100% Preserved)
│   ├── components/                      # UI components (common, donor, recipient, hospital, landing)
│   ├── context/                         # AuthContext, ToastContext
│   ├── pages/                           # Application views (Home, Auth, FindDonors, Dashboards)
│   ├── routes/                          # AppRoutes (React Router v7)
│   └── services/                        # Full-stack API clients (api.js, authService.js, requestService.js, etc.)
├── docs/
│   └── BACKEND_IMPLEMENTATION_PLAN.md   # Architectural design document
├── package.json
└── README.md
```

---

## 🧪 Automated Test Suite Results

```
✔ LIFORA Phase 1 Health Endpoint Tests (4 tests)
✔ LIFORA Phase 2 Supabase PostgreSQL Database Integration Tests (6 tests)
✔ LIFORA Phase 3 Authentication & Authorization Tests (8 tests)
✔ LIFORA Phase 4 Donor Management & Search API Tests (7 tests)
✔ LIFORA Phase 5 Medical Report Storage & Verification Tests (7 tests)
✔ LIFORA Phase 6 Blood Requests & Matching Engine Tests (6 tests)
✔ LIFORA Phase 7 Hospital Portal & Staff Operations API Tests (13 tests)
✔ LIFORA Phase 8 Real-time Socket.IO & Notification Tests (8 tests)

ℹ tests 59
ℹ suites 14
ℹ pass 59
ℹ fail 0
```

---

## 🛡️ License

This project was developed for the LIFORA Blood Donation Network. All rights reserved.

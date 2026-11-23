# LIFORA – Blood Donation Network

> **Tagline:** *Every Drop Connects. Every Life Matters.*

**LIFORA** is a next-generation healthcare technology frontend platform uniting voluntary blood donors, patients/recipients, and hospital blood banks in real time. Designed with a premium healthcare startup aesthetic, it prioritizes speed, trust, privacy-shielded profiles, and clinical compliance.

---

## 🩸 1. Technology Stack

- **Framework:** React 19 with Vite 8
- **Styling:** Tailwind CSS v4 with `@tailwindcss/vite`
- **Routing:** React Router DOM v7
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Visual Analytics:** Recharts
- **Interactive Mapping:** Leaflet & React Leaflet
- **HTTP Client:** Axios with JWT request/response interceptors

---

## 🎨 2. Brand Identity & Visual Language

- **Primary:** Deep Crimson (`#C1123F`)
- **Secondary:** Soft Red (`#F04462`)
- **Background:** Warm White (`#FAF9F6`)
- **Dark Neutral:** Midnight Navy (`#172033`)
- **Success:** Emerald Green (`#16A36A`)
- **Muted Slate:** (`#64748B`)
- **Typography:** Plus Jakarta Sans & Inter
- **Logo:** Custom stylized heart merged with a suspended blood drop

---

## 🚀 3. Features & Pages

### A. Landing Page (`/`)
- **Sticky Glass Navbar:** Dynamic blur on scroll with navigation, active links, emergency quick-trigger, and an instant **Demo Role Switcher**.
- **Hero Section:** "One Connection Can Save a Life", animated glass cards, 3D pulsing heart-drop core, and trust indicators.
- **Animated Impact Counters:** Dynamic count-up statistics for Donors, Requests Fulfilled, Cities, and Lives Impacted (with demonstration notice).
- **Interactive 3-Step Process:** Clear cards outlining Account Creation, Spatial Matching, and Hospital Coordination.
- **Blood Groups Directory:** Interactive compatibility cards for all 8 blood groups (A+, A-, B+, B-, AB+, AB-, O+, O-) with instant search navigation.
- **Emergency CTA Banner:** High-visibility banner for rapid emergency assistance.
- **5 Pillars of Lifora & Clinical Safety:** Highlighting location-based matching, donor privacy, and medical compliance.
- **Testimonials & FAQs:** Verified patient and donor feedback alongside medical disclaimers.

### B. Find Donors (`/find-donors`)
- **Dual View Modes:** Toggle seamlessly between **List View** (cards) and **Map View** (interactive Leaflet map with custom pins).
- **Search Filters:** Filter by blood group, city, radius slider (2–25 km), and availability status.
- **Privacy Protection:** No phone numbers or home addresses exposed; initial contacts occur via verified pings.
- **Direct Connect Modal:** Send requests to specific donors with immediate notifications.
- **Donor Profile Modal:** Inspect donor credentials, badges, donation counts, and response rates.

### C. Donor Dashboard (`/donor/dashboard`)
- **Availability Toggle:** Instant switch between *Available Now* and *Paused* with immediate toast feedback.
- **Welcome & Profile Score:** Visual completion bar with verified identity indicators.
- **Stat Cards:** Total donations, pending requests, lives saved, and next eligible donation date.
- **Medical Disclaimer:** Explicit notice that voluntary acceptance precedes hospital blood-bank eligibility screening.
- **Incoming Blood Requests Feed:** Accept and Decline requests with live updates.
- **Donation History:** Certified contribution timeline.

### D. Recipient Dashboard (`/recipient/dashboard`)
- **Active Requests Tracker:** 4-stage live progress bar (Submitted → Notified → Responses → Coordination).
- **Quick Emergency CTAs:** Direct shortcut to broadcast high-priority blood requests.
- **Real-Time Responses:** View donor response count and hospital coordination notes.

### E. Create Blood Request (`/create-request`)
- **Guided Form:** Patient name, blood group, units, hospital name, city, date, urgency level, instructions, and contact details.
- **Instant Tracking ID:** Generates official tracking code (e.g. `LIF-9042`) with copy-to-clipboard functionality.

### F. Emergency Request Interface (`/emergency-request`)
- **High-Urgency Red Scheme:** High-contrast emergency interface.
- **Rapid Broadcast Form:** Immediate priority submission.
- **Live 4-Stage Emergency Tracker:** Real-time simulated updates notifying donors and confirming preliminary response readiness.

### G. Central Operations Admin Portal (`/admin/dashboard`)
- **Operational Metrics:** 6 summary stats covering users, donors, recipients, active emergencies, and verification backlogs.
- **Visual Analytics with Recharts:**
  - Area chart displaying monthly requests vs. hospital fulfillment rates.
  - Bar chart showing blood group distribution across registered donors.
- **User Management Table:** Search, filter by role (donor, recipient, admin), and toggle suspension/activation.
- **Request Dispatch Table:** Update request statuses directly to "Fulfilled".
- **Audit & Flagged Accounts:** Zero-flag reputation monitoring.

---

## 🔑 4. Demo Accounts & One-Click Switcher

LIFORA includes pre-seeded demo accounts with persistent `localStorage` synchronization. Use the **Demo Persona Switcher** in the top navigation or log in manually:

| Role | Email | Password | Details |
|------|-------|----------|---------|
| **Donor** | `donor@lifora.org` | `donor123` | Dr. Aryan Sharma (O+, Mumbai, 9 Donations) |
| **Recipient** | `recipient@lifora.org` | `recipient123` | Priya Nair (Bangalore, Active Requests) |
| **Admin** | `admin@lifora.org` | `admin123` | Central Dispatch Operations Team |

---

## 📁 5. Folder Structure

```
FullStack_Proj/
├── public/
│   └── logo-icon.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   │   ├── LiforaLogo.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── DonorCard.jsx
│   │   │   ├── BloodGroupCard.jsx
│   │   │   ├── RequestCard.jsx
│   │   │   ├── SearchFilters.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── ConfirmationDialog.jsx
│   │   │   ├── LoadingSkeleton.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── NotificationPanel.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── landing/
│   │       ├── HeroSection.jsx
│   │       ├── ImpactStats.jsx
│   │       ├── HowItWorks.jsx
│   │       ├── BloodGroupsSection.jsx
│   │       ├── EmergencyBanner.jsx
│   │       ├── WhyChooseSection.jsx
│   │       └── TestimonialsSection.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── layouts/
│   │   ├── MainLayout.jsx
│   │   └── DashboardLayout.jsx
│   ├── pages/
│   │   ├── Home/HomePage.jsx
│   │   ├── Auth/LoginPage.jsx
│   │   ├── Auth/RegisterPage.jsx
│   │   ├── FindDonors/FindDonorsPage.jsx
│   │   ├── FindDonors/DonorMap.jsx
│   │   ├── Donor/DonorDashboard.jsx
│   │   ├── Recipient/RecipientDashboard.jsx
│   │   ├── Admin/AdminDashboard.jsx
│   │   └── Requests/
│   │       ├── CreateRequestPage.jsx
│   │       └── EmergencyRequestPage.jsx
│   ├── routes/
│   │   └── AppRoutes.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── donorService.js
│   │   ├── requestService.js
│   │   └── mockData.js
│   ├── index.css
│   ├── App.jsx
│   └── main.jsx
├── .env
├── .env.example
├── package.json
└── vite.config.js
```

---

## 🔌 6. Node.js + Express + PostgreSQL + Prisma Integration

All API calls are decoupled inside `src/services/api.js`. To connect your Node.js backend:

1. Configure `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
2. Required Backend Endpoints:
   - `POST /api/auth/login` & `POST /api/auth/register`
   - `GET /api/donors?bloodGroup=&city=&radius=`
   - `PATCH /api/donors/:id/availability`
   - `GET /api/requests` & `POST /api/requests`
   - `POST /api/requests/:id/accept`

---

## 💻 7. Getting Started

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

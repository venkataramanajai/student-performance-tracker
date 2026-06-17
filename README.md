# 🎓 EduPulse — Student Performance Tracker

> **A full-stack academic management dashboard for MCA students, built as an internship project.**  
> Track grades, attendance, analytics, and generate reports — all in one elegant, dark-themed interface.

<br>

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Database Schema](#-database-schema)
6. [System Architecture & Workflow Diagrams](#-system-architecture--workflow-diagrams)
   - [High-Level Architecture](#1-high-level-architecture)
   - [Application Workflow](#2-application-workflow)
   - [Database Entity-Relationship Diagram](#3-database-entity-relationship-diagram-erd)
   - [REST API Endpoints Flow](#4-rest-api-endpoints-flow)
   - [Data Flow: Adding a Student](#5-data-flow-adding-a-student)
   - [Data Flow: Attendance Tracking](#6-data-flow-attendance-tracking)
   - [Risk Alert Logic Flow](#7-risk-alert-logic-flow)
7. [Application Screens & Modules](#-application-screens--modules)
8. [REST API Reference](#-rest-api-reference)
9. [Getting Started](#-getting-started)
10. [Sample Data (Seed)](#-sample-data-seed)
11. [Development Notes](#-development-notes)
12. [Future Enhancements](#-future-enhancements)
13. [Author](#-author)

---

## 🚀 Project Overview

**EduPulse** is a comprehensive, end-to-end **Student Performance Tracker** designed for MCA (Master of Computer Applications) academic programs. It provides faculty with a real-time, data-driven dashboard to:

- Monitor student academic performance across multiple subjects and exam types
- Record and track daily attendance with status classification (Present / Absent / Late)
- Visualize performance trends using interactive Chart.js charts
- Identify at-risk students based on grade thresholds and attendance percentages
- Generate consolidated academic report cards with subject-wise rankings
- Export data to CSV for offline record keeping

The application follows a **classic full-stack web architecture**: a Node.js + Express.js backend serves RESTful APIs backed by an SQLite database, while a vanilla HTML/CSS/JavaScript frontend consumes these APIs and renders a rich single-page application (SPA) experience — all without any frontend frameworks.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎯 **Animated Landing Page** | Splash screen with orb animations, gradient background, and feature pills |
| 📊 **Live Dashboard** | Real-time KPI cards (students, class average, attendance rate, top performer) |
| 📈 **Interactive Charts** | Subject averages (bar), attendance trends (line), grade distribution (doughnut) via Chart.js |
| ⚠️ **Risk Alerts Panel** | Automatically flags students with avg score < 50% OR attendance < 75% |
| 👩‍🎓 **Student Management** | Full CRUD — add, edit, view profile, and delete students |
| 🔍 **Search & Filter** | Search by name/roll number, filter by class (Sem-I / Sem-II) |
| 📝 **Grades Entry** | Record Mid-term & Final exam scores per subject with upsert logic (update if exists) |
| 📅 **Bulk Attendance** | Date-based attendance sheet with Present / Late / Absent toggles, saved in bulk |
| 📋 **Consolidated Reports** | Academic grid with per-subject Mid/Final scores, ranking, and attendance summary |
| 📤 **CSV Export** | One-click export of the full report table to CSV |
| 🖨️ **Print Report Cards** | Browser print dialog triggered for printable report sheets |
| 👤 **Student Profile Modal** | Per-student profile card with grades sheet + attendance log tabs |
| 🔔 **Toast Notifications** | Success/error feedback toasts for all CRUD actions |
| 🌙 **Dark Theme UI** | Premium glassmorphism dark interface with gradient accents |
| 📱 **Responsive Layout** | Adapts across desktops and tablets |

---

## 🛠 Tech Stack

```
Frontend
├── HTML5             — Semantic single-page markup
├── CSS3 (Vanilla)    — Custom dark theme, glassmorphism, animations
├── JavaScript (ES6+) — Vanilla JS SPA logic, fetch API, DOM manipulation
├── Chart.js (CDN)    — Bar, Line, and Doughnut chart visualizations
├── Font Awesome 6    — Icon library
└── Google Fonts      — Inter & Outfit typefaces

Backend
├── Node.js           — Runtime environment
├── Express.js 4.x    — RESTful API server & static file serving
├── SQLite3           — Embedded relational database (file-based, zero config)
├── Morgan            — HTTP request logger middleware
└── CORS              — Cross-origin resource sharing middleware

Tooling
├── npm               — Package management
├── start.bat         — One-click Windows launch (CMD)
└── start.ps1         — One-click Windows launch (PowerShell)
```

---

## 📁 Project Structure

```
STUDENT PERFORMANCE TRACKER/
│
├── 📂 server/                   # Backend — Node.js + Express
│   ├── server.js                # Main API server (all routes defined here)
│   └── database.js              # SQLite connection, schema init, seed data
│
├── 📂 public/                   # Frontend — Static SPA served by Express
│   ├── index.html               # Single HTML file (landing + all tabs)
│   ├── style.css                # Full dark-theme stylesheet (glassmorphism)
│   └── app.js                   # All client-side JavaScript (~37 KB)
│
├── performance.db               # SQLite database file (auto-created on first run)
├── package.json                 # npm manifest & scripts
├── package-lock.json            # Locked dependency versions
├── start.bat                    # Windows CMD launcher
├── start.ps1                    # Windows PowerShell launcher
└── README.md                    # This file
```

---

## 🗄 Database Schema

The application uses **SQLite** with three normalized tables connected by foreign key relationships.

### `students` table
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `roll_number` | TEXT | UNIQUE, NOT NULL |
| `name` | TEXT | NOT NULL |
| `email` | TEXT | NOT NULL |
| `class_name` | TEXT | NOT NULL |

### `marks` table
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `student_id` | INTEGER | FK → students.id ON DELETE CASCADE |
| `subject` | TEXT | NOT NULL |
| `score` | REAL | NOT NULL |
| `max_score` | REAL | NOT NULL |
| `exam_type` | TEXT | NOT NULL (Mid-term / Final) |

### `attendance` table
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `student_id` | INTEGER | FK → students.id ON DELETE CASCADE |
| `date` | TEXT | NOT NULL (YYYY-MM-DD) |
| `status` | TEXT | CHECK IN ('Present', 'Absent', 'Late') |
| — | — | UNIQUE(student_id, date) |

> **Foreign Keys:** `ON DELETE CASCADE` ensures that deleting a student automatically removes all their marks and attendance records.

---

## 🏗 System Architecture & Workflow Diagrams

### 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                                                                   │
│   ┌───────────────────────────────────────────────────────┐     │
│   │           Single-Page Application (SPA)               │     │
│   │                                                         │     │
│   │   index.html  ◄──  style.css  ◄──  app.js             │     │
│   │       │                               │                │     │
│   │  (Structure)                   (Fetch API calls)       │     │
│   └───────────────────────────────────────────────────────┘     │
│                              │                                    │
│                    HTTP Requests (REST)                           │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Express.js Server  │
                    │   (server.js)        │
                    │                      │
                    │  • Serve /public     │
                    │  • REST API Routes   │
                    │  • Morgan logging    │
                    │  • CORS middleware   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   SQLite Database    │
                    │   (performance.db)   │
                    │                      │
                    │  • students          │
                    │  • marks             │
                    │  • attendance        │
                    └─────────────────────┘
```

---

### 2. Application Workflow

```
User Opens Browser (localhost:3000)
         │
         ▼
┌─────────────────────┐
│  Landing / Splash    │  ← Animated background, feature pills
│  Screen (EduPulse)   │
└──────────┬──────────┘
           │ Click "Get Started"
           ▼
┌─────────────────────┐
│    Main App SPA      │  ← Sidebar navigation appears
│    (Dashboard Tab)   │  ← Automatic API calls on load
└──────────┬──────────┘
           │
     ┌─────┴──────────────────────────────────────────┐
     │                                                  │
     ▼                                                  ▼
┌──────────────┐    ┌──────────────┐    ┌────────────────────┐
│  Dashboard   │    │   Students   │    │   Grades Entry     │
│  (Tab 1)     │    │   (Tab 2)    │    │   (Tab 3)          │
│              │    │              │    │                    │
│ • KPI Cards  │    │ • Table list │    │ • Select Student   │
│ • 3 Charts   │    │ • Search     │    │ • Select Subject   │
│ • Risk Panel │    │ • Filter     │    │ • Enter Score      │
└──────────────┘    │ • Add/Edit/  │    │ • Save (upsert)    │
                    │   Delete     │    └────────────────────┘
                    │ • View       │
                    │   Profile    │    ┌────────────────────┐
                    └──────────────┘    │   Attendance       │
                                        │   (Tab 4)          │
                                        │                    │
                                        │ • Pick Date        │
                                        │ • Bulk Status      │
                                        │   Toggle           │
                                        │ • Save Sheet       │
                                        └────────────────────┘
                                        
                                        ┌────────────────────┐
                                        │   Reports          │
                                        │   (Tab 5)          │
                                        │                    │
                                        │ • Full Grid        │
                                        │ • Rank Column      │
                                        │ • Export CSV       │
                                        │ • Print Cards      │
                                        └────────────────────┘
```

---

### 3. Database Entity-Relationship Diagram (ERD)

```
┌─────────────────────┐          ┌─────────────────────────┐
│       STUDENTS       │          │          MARKS           │
│─────────────────────│          │─────────────────────────│
│ PK  id              │◄─────────│ FK  student_id           │
│     roll_number (UQ)│  1 : M   │     subject              │
│     name            │          │     score                │
│     email           │          │     max_score            │
│     class_name      │          │     exam_type            │
└─────────────────────┘          │     (Mid-term / Final)   │
           │                     └─────────────────────────┘
           │
           │ 1 : M
           │
           ▼
┌─────────────────────────┐
│       ATTENDANCE         │
│─────────────────────────│
│ FK  student_id           │
│     date (YYYY-MM-DD)    │
│     status               │
│     (Present/Absent/Late)│
│     UNIQUE(student_id,   │
│            date)         │
└─────────────────────────┘

Relationships:
• One Student → Many Marks (across subjects and exam types)
• One Student → Many Attendance Records (one per date)
• CASCADE DELETE: Removing a student removes ALL their marks & attendance
```

---

### 4. REST API Endpoints Flow

```
                        ┌──────────────────────────────────────────┐
                        │              API ROUTES                   │
                        │           (Express.js server)            │
                        └──────────────────────────────────────────┘

  DASHBOARD
  ─────────
  GET  /api/dashboard/stats     →  KPI summary (total students, class avg, 
                                   attendance rate, top performer, risk list)
  GET  /api/dashboard/charts    →  Chart data (subject averages, attendance
                                   trends, grade distribution buckets)

  STUDENTS
  ────────
  GET  /api/students            →  All students with aggregated avg_score 
                                   and attendance_rate
  GET  /api/students/:id        →  Single student full profile (marks + 
                                   attendance + computed stats)
  POST /api/students            →  Add new student (name, roll_number, 
                                   email, class_name)
  PUT  /api/students/:id        →  Update student details
  DEL  /api/students/:id        →  Delete student + cascade delete all data

  MARKS
  ─────
  GET  /api/marks               →  All marks joined with student info
  POST /api/marks               →  Record/update mark (upsert by student +
                                   subject + exam_type)

  ATTENDANCE
  ──────────
  GET  /api/attendance?date=    →  Attendance sheet for a date (all students
                                   + their status for that date)
  POST /api/attendance          →  Save bulk attendance for a date
                                   body: { date, records: [{student_id, status}] }

  REPORTS
  ───────
  GET  /api/reports             →  Full consolidated report for all students
                                   (subject-wise scores, rank, attendance%)
```

---

### 5. Data Flow: Adding a Student

```
  Faculty (Browser)                  Express Server              SQLite DB
       │                                   │                        │
       │  Fill form (Name, Roll,           │                        │
       │  Email, Class)                    │                        │
       │                                   │                        │
       │──── POST /api/students ──────────►│                        │
       │     { name, roll_number,          │                        │
       │       email, class_name }         │                        │
       │                                   │── Validate fields ────►│
       │                                   │                        │
       │                                   │── INSERT INTO         │
       │                                   │   students ...        │
       │                                   │                        │
       │                                   │◄── lastID (new id) ───│
       │                                   │                        │
       │◄── 201 Created ─────────────────-│                        │
       │    { id, roll_number, name,       │                        │
       │      email, class_name }          │                        │
       │                                   │                        │
       │  Show ✅ Toast "Student Added"    │                        │
       │  Refresh students table           │                        │
       │                                   │                        │

  ──── On Duplicate Roll Number:
       │◄── 409 Conflict ─────────────────│
       │    { error: "Roll number         │
       │      already exists." }          │
       │  Show ❌ Toast (error)            │
```

---

### 6. Data Flow: Attendance Tracking

```
  Faculty (Browser)                  Express Server              SQLite DB
       │                                   │                        │
       │  Select Date                      │                        │
       │──── GET /api/attendance?date= ───►│                        │
       │                                   │                        │
       │                                   │── LEFT JOIN students  │
       │                                   │   + attendance table  │
       │                                   │   for given date      │
       │◄── 200 { date, list[] } ─────────│                        │
       │                                   │                        │
       │  Render attendance sheet with     │                        │
       │  Present / Late / Absent toggles  │                        │
       │                                   │                        │
       │  Faculty marks each student       │                        │
       │                                   │                        │
       │──── POST /api/attendance ────────►│                        │
       │     { date, records: [           │                        │
       │        { student_id, status },   │                        │
       │        { student_id, status },   │── INSERT OR REPLACE   │
       │        ...                       │   INTO attendance...  │
       │     ]}                           │                        │
       │                                   │                        │
       │◄── 200 { message: "Saved" } ─────│                        │
       │  Show ✅ Toast "Attendance Saved" │                        │
       │  Live summary badge updates       │                        │
       │  (Present: X, Late: Y, Absent: Z) │                        │
```

---

### 7. Risk Alert Logic Flow

```
  GET /api/dashboard/stats
           │
           ▼
  For each student, compute:
  ┌─────────────────────────────────────────────────────┐
  │                                                       │
  │   avg_score     = AVG(marks.score) per student       │
  │   attendance %  = (Present + Late) / Total * 100     │
  │                                                       │
  │   AT-RISK condition:                                  │
  │     avg_score < 50  OR  attendance_rate < 75         │
  │                                                       │
  └─────────────────────────────────────────────────────┘
           │
           ▼
  ┌────────────────────┐     ┌──────────────────────────┐
  │   Student is SAFE   │     │   Student is AT-RISK      │
  │   (green status)    │     │   → Added to risk list   │
  └────────────────────┘     │   → Risk card rendered   │
                              │   → Badge count updates  │
                              └──────────────────────────┘

  Risk Card shows:
  • Student name & roll number
  • Current average score (colored: red if < 50)
  • Attendance rate (colored: red if < 75%)
  • Visual warning icon
```

---

## 📱 Application Screens & Modules

### Module 1 — Landing / Splash Screen
- Animated floating orbs (CSS keyframes) on a deep gradient background
- Grid texture overlay for depth
- Brand logo with pulsing ring animation
- Feature pills: Live Analytics, Attendance Tracking, Grades Management, Risk Alerts
- "Get Started" CTA button with glow effect
- Smooth fade-out transition to main app

### Module 2 — Dashboard (Tab 1)
- **4 KPI Summary Cards:** Total Students | Class Average | Attendance Rate | Top Performer
- **3 Interactive Charts (Chart.js):**
  - Bar chart: Average score per subject
  - Line chart: Attendance trend over last 15 weekdays
  - Doughnut chart: Grade distribution (A/B/C/D/F)
- **Risk & Performance Alerts Panel:** Cards for at-risk students with metrics

### Module 3 — Students (Tab 2)
- Searchable, filterable student table (name/roll, class filter)
- Columns: Roll No, Name, Class, Email, Avg Score, Attendance %, Actions
- **View Profile** → Opens detailed modal with grades sheet & attendance log tabs
- **Edit** → Opens pre-filled Add/Edit modal
- **Delete** → Confirmation + cascade delete

### Module 4 — Grades Entry (Tab 3)
- Left pane: Entry form (Student, Subject, Exam Type, Score, Max Score)
- Right pane: Recent grades log table
- Upsert logic: re-entering a score for same student+subject+exam type updates the record

### Module 5 — Attendance (Tab 4)
- Date picker → loads full student list with their status for that date
- Toggle buttons per student: Present 🟢 | Late 🟡 | Absent 🔴
- Live summary badges (count of P/L/A updates as toggles change)
- "Save Daily Attendance" → bulk POST to backend using INSERT OR REPLACE

### Module 6 — Reports (Tab 5)
- Consolidated academic grid: Rank | Roll No | Name | DSA Mid/Fin | DBMS Mid/Fin | Java Mid/Fin | Web Tech Mid/Fin | SE Mid/Fin | Avg % | Attendance
- Dynamic rank assignment based on avg score
- **Export CSV** → Generates and downloads a `.csv` file
- **Print Report Cards** → Triggers browser print dialog

---

## 📡 REST API Reference

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | KPI stats + at-risk student list |
| GET | `/api/dashboard/charts` | Subject averages, attendance trends, grade distribution |

### Students

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/students` | — | All students with aggregated metrics |
| GET | `/api/students/:id` | — | Full student profile (marks + attendance) |
| POST | `/api/students` | `{ name, roll_number, email, class_name }` | Create student |
| PUT | `/api/students/:id` | `{ name, roll_number, email, class_name }` | Update student |
| DELETE | `/api/students/:id` | — | Delete student (cascade) |

### Marks

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/marks` | — | All marks with student info |
| POST | `/api/marks` | `{ student_id, subject, score, max_score, exam_type }` | Add/update mark |

### Attendance

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/attendance?date=YYYY-MM-DD` | — | Attendance sheet for a date |
| POST | `/api/attendance` | `{ date, records: [{student_id, status}] }` | Save bulk attendance |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports` | Full consolidated academic report for all students |

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** (v16 or higher) — [Download here](https://nodejs.org/)
- **npm** (bundled with Node.js)

### Installation & Running

**Option A — PowerShell (Recommended on Windows)**
```powershell
# Right-click start.ps1 → "Run with PowerShell"
# OR in a PowerShell terminal:
.\start.ps1
```

**Option B — Command Prompt / Batch**
```bat
# Double-click start.bat
# OR in CMD:
start.bat
```

**Option C — Manual**
```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
# http://localhost:3000
```

> **Note:** On first run, if `performance.db` does not exist, the application automatically creates the database schema and seeds it with 6 sample MCA students, 60 marks records, and 90 attendance records.

### Development Mode (with auto-reload)
```bash
npm run dev
# Uses Node.js --watch flag to restart on file changes
```

---

## 🌱 Sample Data (Seed)

The database seeds **6 pre-configured MCA students** on first launch:

| Roll Number | Name | Class | Profile |
|---|---|---|---|
| 25M11MC001 | Aarav Sharma | MCA Sem-I | Strong in DSA & Java, avg elsewhere |
| 25M11MC002 | Diya Patel | MCA Sem-I | **Top overall performer** |
| 25M11MC003 | Rohan Das | MCA Sem-II | **At-risk / struggling** across all subjects |
| 25M11MC004 | Ananya Iyer | MCA Sem-I | High performer, consistent |
| 25M11MC005 | Kabir Singh | MCA Sem-II | Average, steady performer |
| 25M11MC006 | Meera Sen | MCA Sem-II | Strong in DBMS & Software Engineering |

**Subjects covered:**
- Data Structures & Algorithms (DSA)
- Database Systems (DBMS)
- Java Programming
- Web Technologies
- Software Engineering

**Exam Types:** Mid-term | Final  
**Attendance:** Last 15 weekdays (deterministic patterns per student)

---

## 🔧 Development Notes

### Key Design Decisions

1. **Vanilla JS SPA** — No React/Vue/Angular. All tab switching, modals, toast notifications, and DOM updates are handled with plain JavaScript using the Fetch API and DOM manipulation. This demonstrates core fundamentals.

2. **SQLite + Promise Wrappers** — The sqlite3 library uses callbacks; `database.js` wraps all calls in `dbRun`, `dbGet`, `dbAll` Promise functions to enable clean `async/await` usage in route handlers.

3. **Upsert on Marks** — `POST /api/marks` first checks if a record already exists for the same `(student_id, subject, exam_type)` combination. If it does, it updates; otherwise it inserts. This prevents duplicate entries.

4. **Attendance INSERT OR REPLACE** — The attendance table has a `UNIQUE(student_id, date)` constraint. The bulk save uses SQLite's `INSERT OR REPLACE` syntax to handle re-saves gracefully.

5. **Cascade Deletes** — `PRAGMA foreign_keys = ON` is set at database initialization. Deleting a student removes all their marks and attendance automatically.

6. **Risk Algorithm** — Risk is computed server-side in the SQL query itself using `AVG(score) < 50 OR attendance_rate < 75` thresholds, avoiding complex client-side processing.

7. **No Build Step** — Zero bundlers, zero transpilers. The project runs directly with `node server/server.js`. SQLite database file (`performance.db`) is auto-created on first run.

### File Size Overview
| File | Size | Purpose |
|---|---|---|
| `public/app.js` | ~37 KB | Entire SPA logic |
| `public/style.css` | ~34 KB | Complete dark-theme stylesheet |
| `public/index.html` | ~22 KB | Full app markup |
| `server/server.js` | ~14 KB | All REST API routes |
| `server/database.js` | ~13 KB | DB init, helpers, seed data |

---

## 🔮 Future Enhancements

- [ ] **Authentication System** — Faculty login with JWT sessions
- [ ] **Student Self-Portal** — Student-facing view to check own grades
- [ ] **Email Notifications** — Alert emails to at-risk students
- [ ] **PDF Export** — Generate formatted PDF report cards
- [ ] **Multi-Semester Support** — Archive and compare across semesters
- [ ] **Assignments & Homework Tracker** — Extend marks to assignment-level granularity
- [ ] **Bulk CSV Import** — Upload student/marks data via CSV file
- [ ] **PostgreSQL Migration** — Swap SQLite for a production-grade database
- [ ] **REST API Pagination** — Handle large datasets efficiently
- [ ] **Dark/Light Theme Toggle** — User preference theming

---

## 👨‍💻 Developer

# **NAME:** M. VENKATA RAMANA
🎓 **Degree:** Master of Computer Applications (MCA)  
🏫 **University:** Aditya University, Surampalem  
📅 **Batch:** 2025 – 2027  
🪪 **Roll Number:** 25M11MC089

### 💼 About This Project

**EduPulse — Student Performance Tracker** was developed as a full-stack internship project, demonstrating practical expertise in:

- ⚙️ Full-stack **Node.js + Express.js** REST API development
- 🗄️ Relational database design and querying with **SQLite**
- 🌐 Vanilla **JavaScript SPA** architecture (no frameworks)
- 🎨 Modern **dark-theme glassmorphism UI/UX** design
- 📊 Interactive data visualization with **Chart.js**
- 🧩 Academic management domain problem-solving and system design

---

*Built with ❤️ using Node.js, Express, SQLite, and Vanilla JavaScript*

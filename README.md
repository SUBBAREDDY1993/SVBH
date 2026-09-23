# Sri Venkateswara Boys Hostel Management System

A **complete, production-ready, enterprise-grade Hostel Management Web Application** designed for **Sri Venkateswara Boys Hostel**. The system operates with a default capacity of **70 beds** across **16 rooms on 6 floors** (Floors 1-5 have rooms X01 with 4 beds, X02 with 4 beds, and X03 with 5 beds; Floor 6 has room 601 with 5 beds).

---

## 🌟 Key Features

- 🏠 **Executive Operations Dashboard**: Live KPIs calculating Total Beds (70 default), Occupied Beds, Available Beds, Reserved Beds, Total Students, Pending Amount (₹), Payments Due Soon, Students Leaving Soon, and Occupancy Rate.
- 🛏 **Visual Bed Matrix & Room Management**: Floor-by-floor room grid showing each bed's status (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`), occupant name, one-click allocation, and dynamic bed scaling.
- 👨🎓 **Complete Student Lifecycle Management**:
  - Admission form with personal, contact, emergency details, rent, deposit, and due day.
  - Automatic validation preventing double-booking of any bed.
  - Notice Period tracking with expected vacation dates and alerts.
  - Vacating workflow that records deposit refund/final settlements, marks student `VACATED`, and automatically releases the allocated bed to `AVAILABLE`.
- 🔄 **Bed Allocation & Transfer Module**: Seamlessly transfer a resident from Room A to Room B with automatic bed release and a complete allocation audit log.
- 💰 **Fee & Payment Management**:
  - Records payments via UPI, Cash, Bank Transfer, or Card.
  - **Automatic Due-Date Calculation**: Advances next payment due date by 1 month on monthly rent collection.
  - Dedicated **Payment Due Tracking** page categorizing dues into *Due Today*, *Due Soon (Next 7 Days)*, and *Overdue* with days overdue badge.
- 🧾 **Official Payment Receipts & Print Support**:
  - Generates official computer-generated receipts branded with **Sri Venkateswara Boys Hostel**.
  - One-click print with tailored `@media print` CSS layout for clean A4 printing.
- 📊 **Reports & Analytics**:
  - Occupancy Report (Floor and Room occupancy breakdowns).
  - Monthly Revenue Report (Month-by-month revenue collection).
  - Payment Collection breakdown by payment method.
  - Instant CSV export for student directories and payment transaction records.
- 🔐 **Security & Role-Based Access Control**:
  - Stateless JWT (JSON Web Token) authentication with BCrypt password hashing.
  - `ROLE_ADMIN` (full control, room deletion, settings, and demo resets) and `ROLE_STAFF`.
- 📦 **Docker & Multi-Stage Production Builds**: Ready to deploy with `docker-compose`.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Java 17+, Spring Boot 3.2.5, Maven, Spring Security, JWT (JJWT 0.12.5), Lombok |
| **Database** | MongoDB (Database: `svboys_hostel`, compatible with MongoDB Compass) |
| **API Docs** | Swagger / OpenAPI 3.0 (`springdoc-openapi-starter-webmvc-ui 2.5.0`) |
| **Frontend** | React 18, Vite 5, TypeScript, Material UI (MUI v5), Emotion, Axios, React Router v6 |
| **Container** | Docker & Docker Compose |

---

## 🚀 Quick Start Guide

### Prerequisites

Ensure you have the following installed on your machine:
- **Java**: JDK 17 or JDK 21 (`java -version`)
- **Maven**: 3.8+ (`mvn -version`)
- **Node.js**: v18+ or v20+ (`node -v`)
- **npm**: 9+ (`npm -v`)
- **MongoDB**: Community Edition or MongoDB Compass running locally on port `27017`

---

### Option A: Running Simultaneously with Single Command (Fastest & Recommended)

From the project root directory (`d:\SVBH`), simply run:
```bash
npm run dev
```
This runs both the **Spring Boot Backend** and **React Frontend** concurrently:
- `[BACKEND]` logs are highlighted in **Cyan**: `http://localhost:8081` (Swagger docs at `http://localhost:8081/swagger-ui/index.html`)
- `[FRONTEND]` logs are highlighted in **Magenta**: `http://localhost:5173`
- Pressing `Ctrl + C` cleanly terminates both processes together.

---

### Option B: Running Individually (Separate Terminals)

#### Step 1: Start MongoDB
Make sure your local MongoDB server is running on `mongodb://localhost:27017`.
- On Windows: Check that the **MongoDB Server** service is running in `services.msc`, or run `net start MongoDB`.

#### Step 2: Start Spring Boot Backend
Open a terminal in the project directory:
```bash
cd backend
mvn spring-boot:run
```
> **Note**: On the first start, the system automatically initializes:
> 1. Default Admin (`admin` / `admin123`) and Staff (`staff` / `staff123`) accounts.
> 2. The full **70 beds layout across 16 rooms on 6 floors**.
> 3. Sample demo students, active allocations, sample payment receipts, and overdue records so the dashboard is immediately populated.

The backend will start at: `http://localhost:8081`
Swagger API Documentation: `http://localhost:8081/swagger-ui/index.html`

#### Step 3: Start React Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start at: `http://localhost:5173`

#### Step 4: Open Application in Browser
Navigate to **`http://localhost:5173`** in your browser.

---

### Option C: Running with Docker Compose

To start MongoDB, Backend, and Frontend all together in Docker containers:
```bash
cd d:\SVBH
docker compose up --build
```
This automatically starts:
- MongoDB on `localhost:27017`
- Spring Boot Backend on `localhost:8080`
- React Production Frontend (served by Nginx) on `localhost:5173`

To stop all containers:
```bash
docker compose down
```

---

## 🔑 Default Login Credentials

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Complete administrative control, room deletion, system settings |
| **Staff / Warden** | `staff` | `staff123` | View residents, admit students, record payments, view bed matrix |

> **Security Note**: You can change your password anytime by clicking your profile avatar at the top right of the navigation bar and selecting **Change Password**.

---

## 📖 Step-by-Step User Workflows

### 1. Visual Bed Matrix & Room Navigation
1. Go to **Rooms & Beds** in the sidebar.
2. Filter by floor tabs (**Floor 1**, **Floor 2**, **Floor 3**, **Floor 4**, **Floor 5**, **Floor 6**).
3. Each room card displays all beds with status indicators:
   - 🟢 **AVAILABLE**: Green badge. Click the green `+` icon to immediately admit a student to that specific bed.
   - 🔴 **OCCUPIED**: Red badge with the resident's name. Click the profile icon to inspect their profile, or transfer icon to switch beds.
   - 🟡 **RESERVED**: Yellow badge for advance holds.
   - ⚪ **MAINTENANCE**: Grey badge for cleaning or repairs.

### 2. Admitting a New Student
1. Click **+ Add Student** in the top navigation bar or sidebar.
2. Enter personal info (Name, 10-digit mobile, father/mother name, Aadhaar, address).
3. Select an available room from the dropdown. The system automatically populates the available beds list for that room.
4. Select the bed, enter joining date, monthly rent, and security deposit.
5. Click **Confirm Admission & Allocate Bed**.
6. The resident is created with status `ACTIVE`, the selected bed becomes `OCCUPIED`, room counts update, and dashboard KPIs reflect the new resident.

### 3. Transferring a Student to Another Bed
1. Go to **Allocations** in the sidebar.
2. Click **Transfer Resident Bed**.
3. Select the resident, pick the target room and target available bed, and enter an optional reason.
4. Click **Confirm Bed Transfer**.
5. The resident's previous bed immediately becomes `AVAILABLE`, the new bed becomes `OCCUPIED`, and an audit record is logged with timestamp and administrator details.

### 4. Recording Fee Payments & Automatic Due Date
1. Go to **Payments** in the sidebar.
2. Click **Record Payment** (or click **Pay** next to any student on the Students page).
3. Select the resident, enter amount (e.g. ₹5,000), payment mode (UPI, Cash, Bank Transfer), and billing month.
4. Click **Confirm & Generate Receipt**.
5. The payment receipt is generated with an official receipt number (e.g., `REC-2026-0010`).
6. **Automatic Due Calculation**: If the payment type is *Monthly Rent*, the student's next payment due date is automatically advanced by 1 month!

### 5. Managing Payment Dues & Overdue Rents
1. Go to **Payment Due** in the sidebar.
2. Three interactive tabs display:
   - **Overdue**: Shows students who crossed their due date along with days overdue (e.g., `17 days late`).
   - **Due Today**: Rents due today.
   - **Due Soon**: Rents due in the next 7 days.
3. Click the green **Record Payment** button next to any resident to immediately log their payment.

### 6. Printing Official Receipts
1. On any payment record, click the **Receipt** button.
2. An official, professional Sri Venkateswara Boys Hostel receipt opens with:
   - Official hostel header and SR Nagar, Hyderabad address.
   - Receipt number, student ID, resident name, room and bed number.
   - Billing month, payment method, transaction ID, and amount paid.
3. Click **Print Receipt** to open the browser's print dialog, formatted for crisp A4 portrait printing.

### 7. Vacating a Student
1. Open the resident's profile (click **View** on the student's row or search their name).
2. Click the red **Vacate Student** button at the top right.
3. Enter the vacating date, reason, deposit refund amount, and settlement remarks.
4. Click **Confirm Vacate & Release Bed**.
5. The student status becomes `VACATED`, their allocated bed immediately returns to `AVAILABLE`, and room occupancy updates. The student's complete historical payment and stay records remain preserved for audits.

### 8. Resetting to Fresh Demo Data
1. Log in as `admin`.
2. Go to **Settings** in the sidebar.
3. Scroll to **Demo Data Control** and click **Reset Database to 70 Beds Demo State**.
4. Confirm the prompt. The system will cleanly re-seed exactly 70 beds, 18 rooms, 12 sample students, payments, and overdue records.

---

## 🧪 Running Automated Tests

### Backend Tests
The backend includes a comprehensive suite of unit and integration tests verifying authentication, student admissions, duplicate bed allocation prevention, bed transfers, fee recording, next due-date advancement, overdue calculations, and vacating workflows.

To run the backend test suite:
```bash
cd d:\SVBH\backend
mvn clean test
```
All 7 tests pass with zero failures.

### Frontend Typecheck & Production Build
To verify frontend TypeScript compilation and build:
```bash
cd d:\SVBH\frontend
npm run build
```
Builds cleanly with zero errors.

---

## 📂 Project Structure

```
sri-venkateswara-hostel/
│
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   ├── .env.example
│   └── src/
│       ├── main/
│       │   ├── java/com/srivenkateswarahostel/
│       │   │   ├── config/             # OpenAPI and app configuration
│       │   │   ├── controller/         # REST Controllers (Auth, Rooms, Beds, Students, Payments, Reports, Settings)
│       │   │   ├── dto/                # Request/Response Data Transfer Objects
│       │   │   ├── exception/          # Global exception handler & custom exceptions
│       │   │   ├── model/              # MongoDB Documents & Enums (Room, Bed, Student, Payment, etc.)
│       │   │   ├── repository/         # Spring Data MongoDB Repositories
│       │   │   ├── security/           # JWT Provider, Auth Filter, SecurityConfig
│       │   │   ├── service/            # Core business logic & DataInitializerService
│       │   │   └── HostelManagementApplication.java
│       │   └── resources/
│       │       └── application.properties
│       └── test/java/com/srivenkateswarahostel/
│           ├── HostelManagementApplicationTests.java
│           ├── StudentServiceTest.java
│           └── PaymentServiceTest.java
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── nginx.conf
│   ├── Dockerfile
│   ├── .env.example
│   ├── public/
│   │   └── logo.svg                    # Official SVBH vector branding logo
│   └── src/
│       ├── components/                 # Reusable UI components (Sidebar, Navbar, Layout, BedCard, ReceiptModal, etc.)
│       ├── context/                    # AuthContext and NotificationContext
│       ├── pages/                      # Dashboard, Rooms, Students, StudentForm, StudentDetails, Allocations, Payments, Reports, Settings
│       ├── services/                   # Axios API service clients
│       ├── types/                      # Full TypeScript interfaces
│       ├── theme.ts                    # Custom Material UI theme
│       ├── index.css                   # Global styles & print stylesheet
│       ├── App.tsx                     # Route configuration
│       └── main.tsx                    # Entry point
│
├── docker-compose.yml                  # Multi-container orchestration (Mongo, Backend, Frontend)
├── .gitignore                          # Standard git ignore rules
└── README.md                           # Documentation
```

---

## 📞 Support & Institution Details

**Sri Venkateswara Boys Hostel**  
Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038  
Phone: +91 9441843574  
Email: svbhostel2026@gmail.com

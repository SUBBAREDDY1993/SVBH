# SRI VENKATESWARA BOYS HOSTEL
## Complete Operations Handbook & Standard Operating Procedures (SOP)
**Document Version:** 1.0.0  
**Effective Date:** September 2026  
**Institution:** Sri Venkateswara Boys Hostel  
**Location:** Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038  
**Helpline:** +91 9441843574  
**Official Email:** svbhostel2026@gmail.com  

---

## Table of Contents
1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Access Control & User Roles](#2-access-control--user-roles)
3. [Room & Bed Inventory Management](#3-room--bed-inventory-management)
4. [Resident Admission & Onboarding](#4-resident-admission--onboarding)
5. [Bed Allocation & Room Transfers](#5-bed-allocation--room-transfers)
6. [Fee Collection & Receipt Generation](#6-fee-collection--receipt-generation)
7. [Payment Due Tracking & Automated Reminders](#7-payment-due-tracking--automated-reminders)
8. [Daily Expense Management & Net Profit Tracking](#8-daily-expense-management--net-profit-tracking)
9. [Notice Period & Vacating Procedures](#9-notice-period--vacating-procedures)
10. [Operational Alerts & Notifications](#10-operational-alerts--notifications)
11. [Reports, Analytics & Financial Reconciliation](#11-reports-analytics--financial-reconciliation)
12. [System Settings & Data Management](#12-system-settings--data-management)
13. [Daily & Monthly Operational Checklists](#13-daily--monthly-operational-checklists)

---

## 1. System Overview & Architecture

### 1.1 Purpose
The **Sri Venkateswara Boys Hostel Management System** is an enterprise-grade digital management platform engineered to automate all daily administrative, financial, and operational tasks of the hostel.

### 1.2 Capacity & Facility Profile
- **Total Floors:** 6 Floors (Floors 1 through 6)
- **Total Rooms:** 16 Rooms (Rooms 101 to 602)
- **Total Bed Capacity:** Exactly 70 Beds
- **Room Categories:** Standard Non-AC, Air Conditioned (AC), Attached Bathroom, Standard Deluxe

### 1.3 Technology Stack
- **Backend:** Java 17, Spring Boot 3.2.5 (Spring Security, Spring Data MongoDB, Scheduled Tasks)
- **Database:** MongoDB 6.0+ (NoSQL document store with compound indexes and auditing)
- **Frontend:** React 18, TypeScript, Vite, Material UI (MUI 5), Axios
- **Authentication:** Stateless JWT (JSON Web Tokens) with 24-hour expiration
- **Scheduling:** Spring `@EnableScheduling` running daily cron jobs

---

## 2. Access Control & User Roles

### 2.1 Role Hierarchy
| Role | Privileges | Target Users |
| :--- | :--- | :--- |
| **ROLE_ADMIN** | Full administrative rights: admitting/vacating students, room management, adding beds, fee collections, automated reminder triggers, reports, system settings, database resets. | Hostel Owner, Chief Warden |
| **ROLE_STAFF** | Operational rights: admitting students, recording payments, viewing dues, sending WhatsApp reminders, printing receipts, and searching records. | Assistant Wardens, Reception Desk Staff |

### 2.2 Default Credentials
- **Admin Account:**
  - **Username:** `admin`
  - **Password:** `admin123`
  - **Access Level:** Complete Administrative Control
- **Staff Account:**
  - **Username:** `staff`
  - **Password:** `staff123`
  - **Access Level:** Daily Operations & Fee Recording

### 2.3 Password Management
1. Log in to your account.
2. Click on the user profile menu at the top right of the navigation bar.
3. Select **Change Password**.
4. Enter your current password and your new password (minimum 6 characters).
5. Click **Save Password**.

---

## 3. Room & Bed Inventory Management

### 3.1 Room Numbering & Layout
- **Floor 1:** Rooms 101 (4 Beds), 102 (4 Beds), 103 (5 Beds) - *13 Beds*
- **Floor 2:** Rooms 201 (4 Beds), 202 (4 Beds), 203 (5 Beds) - *13 Beds*
- **Floor 3:** Rooms 301 (4 Beds), 302 (4 Beds), 303 (5 Beds) - *13 Beds*
- **Floor 4:** Rooms 401 (4 Beds), 402 (4 Beds), 403 (5 Beds) - *13 Beds*
- **Floor 5:** Rooms 501 (4 Beds), 502 (4 Beds) - *8 Beds*
- **Floor 6:** Rooms 601 (5 Beds), 602 (5 Beds) - *10 Beds*
- **Total Capacity:** 70 Beds across 16 Rooms.

### 3.2 Bed Identifier Standards
Every bed has a globally unique code format: `B<RoomNumber>-<BedNumber>`
- *Example:* Bed 1 in Room 101 is designated `B101-1`.
- *Example:* Bed 3 in Room 204 is designated `B204-3`.

### 3.3 Adding a New Room
1. Navigate to **Rooms & Beds** (`/rooms`) from the sidebar.
2. Click the **+ Add Room** button.
3. Enter:
   - **Room Number:** Unique identifier (e.g. `104`, `204`).
   - **Floor:** Building floor number (1 to 6).
   - **Number of Beds:** Total bed slots to automatically create (1 to 10).
   - **Room Type:** `Standard Non-AC`, `Air Conditioned (AC)`, `Attached Bathroom`, or `Standard`.
   - **Default Monthly Rent (₹):** Standard rent per bed (e.g. `₹5,000`).
   - **Notes:** Remarks (e.g. "Balcony view", "Near staircase").
4. Click **Create Room**. The backend automatically instantiates the room and generates all sequential bed records in `AVAILABLE` status.

### 3.4 Editing an Existing Room
1. On the **Rooms & Beds** page, locate the room card.
2. Click the **Edit Room** (pencil) icon.
3. Modify the floor, room type, default rent, or notes as needed.
4. Click **Save Changes**. The room attributes update safely without affecting existing resident bed allocations.

### 3.5 Adding an Extra Bed to a Room
1. On the **Rooms & Beds** page, locate the desired room card.
2. Click the **+ Add Extra Bed to Room [X]** button (Admin only).
3. The system automatically computes the next bed index, generates the bed ID (e.g. `B101-5`), and increments the room's total capacity by 1.

### 3.6 Bed Status Workflow
- 🟢 **AVAILABLE:** Clean, unoccupied, ready for immediate student admission.
- 🔴 **OCCUPIED:** Currently allocated to an active resident.
- 🟡 **RESERVED:** Temporarily held for incoming resident with advance payment.
- ⚪ **MAINTENANCE:** Under repair, painting, or sanitization; cannot be allocated.

---

## 4. Resident Admission & Onboarding

### 4.1 Admission Prerequisites
Before registering a student, collect:
- Full Legal Name and Mobile Number.
- Parent / Guardian Contact Details.
- Government ID (Aadhaar Card number and copy).
- Permanent Home Address and Emergency Contact.
- Agreed Monthly Rent, Security Deposit, and Monthly Due Day.

### 4.2 Admission Procedure
1. Navigate to **Students** (`/students`) and click **+ Admit Student** or navigate directly to `/students/new`.
2. **Step 1: Personal & Contact Information:**
   - Full Name, Date of Birth, Gender.
   - Mobile Number (10 digits) and Email Address.
   - Father's Name, Mother's Name, Alternate Mobile.
   - Aadhaar Number (12 digits), Permanent Address, City, State, Pincode.
3. **Step 2: Emergency Contact:**
   - Contact Person Name, Relationship (Father, Mother, Brother, Local Guardian), Phone Number.
4. **Step 3: Room & Bed Allocation:**
   - Select an available bed from the real-time bed selector dropdown. Beds indicate their room number, bed ID, and default rent.
5. **Step 4: Financial Terms:**
   - **Monthly Rent (₹):** Agreed monthly fee (e.g. `₹5,500`).
   - **Security Deposit (₹):** Refundable deposit collected at check-in (e.g. `₹5,000`).
   - **Payment Due Day:** Day of the month on which rent becomes due (e.g. `1` for 1st of every month).
   - **Next Payment Due Date:** Defaults to next month's due day or custom start date.
6. Click **Admit Student**.
7. **System Actions upon Admission:**
   - Generates a unique Student ID (e.g. `SVBH-2026-0042`).
   - Marks the chosen bed as `OCCUPIED` and links the student ID and name.
   - Creates an entry in the **Allocation History** audit trail.
   - Sets student status to `ACTIVE`.

---

## 5. Bed Allocation & Room Transfers

### 5.1 Transferring a Resident to Another Bed
When a resident requests a room change:
1. Navigate to **Allocations** (`/allocations`) from the sidebar.
2. Click **Transfer Bed**.
3. Select the resident from the active student dropdown.
4. The system automatically displays their current room and bed (e.g. `Room 101 - B101-2`).
5. Select the destination bed from the list of currently **AVAILABLE** beds.
6. Enter a transfer reason (e.g. "Upgraded to AC room", "Requested lower floor").
7. Click **Confirm Transfer**.
8. **System Actions upon Transfer:**
   - Updates previous bed status to `AVAILABLE` (vacated).
   - Updates target bed status to `OCCUPIED` with resident details.
   - Updates student profile with new `roomNumber` and `bedId`.
   - Records an immutable transfer entry in the database allocation history.

---

## 6. Fee Collection & Receipt Generation

### 6.1 Recording a Rent Payment
1. Navigate to **Payments** (`/payments`) and click **+ Record Payment**, or click the **Pay** button on any student row in **Payment Due Tracking**.
2. Select or verify the **Student ID / Resident**.
3. Enter payment details:
   - **Amount Paid (₹):** e.g. `₹5,000`.
   - **Payment Date:** Defaults to today.
   - **Payment Method:** `UPI (GPay / PhonePe / Paytm)`, `Cash`, `Bank Transfer / NEFT`, or `Card`.
   - **Payment Type:** `MONTHLY_RENT`, `SECURITY_DEPOSIT`, `MAINTENANCE`, or `ADVANCE`.
   - **Rent For Month:** Billing period (e.g. `September 2026`).
   - **Transaction Reference:** UPI Ref / UTR / Cheque Number.
   - **Remarks:** Additional administrative notes.
4. Click **Submit Payment**.
5. **System Actions upon Payment:**
   - Generates an official Receipt Number: `REC-YYYY-XXXX` (e.g. `REC-2026-0015`).
   - Updates student's `lastPaymentDate` to the transaction date.
   - Automatically advances student's `nextPaymentDueDate` by 1 month.
   - Calculates any remaining balance or advance carry-forward.
   - Logs the financial transaction in the audit trail.

### 6.2 Printing Official Receipts
1. Immediately after recording a payment, click **Print Receipt**, or navigate to **Payments** and click **Receipt** on any historical row.
2. The modal displays the official branded receipt containing:
   - Official Institution Logo and Header.
   - Full Address: *Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038*.
   - Helpline (+91 9441843574) and Official Email (svbhostel2026@gmail.com).
   - Receipt Number, Date, Student Name, Student ID, Room & Bed Number.
   - Billing Month, Payment Mode, Transaction ID, Amount in Words & Figures.
3. Click **Print Receipt** to open the browser print dialog formatted for A4 portrait printing.

---

## 7. Payment Due Tracking & Automated Reminders

### 7.1 Due Categories
On the **Payment Due Tracking** page (`/payments/due`), residents are classified into 3 tabs:
1. 🔴 **Overdue Rents:** Next payment due date has passed. Shows exact days overdue (e.g. `4d late`).
2. 🟡 **Due Today:** Next payment due date matches the current calendar date.
3. 🔵 **Due Soon in 3 to 7 Days:** Upcoming collections within the next 3 to 7 days.

### 7.2 Automated Daily Scheduled Reminders
The backend scheduler automatically evaluates fee payments **3 days prior to due dates, daily in the morning and evening**:
- **Morning Batch:** Executes daily at **9:00 AM** (`@Scheduled(cron = "0 0 9 * * *")`).
- **Evening Batch:** Executes daily at **6:00 PM** (`@Scheduled(cron = "0 0 18 * * *")`).
- **Target Audience:** All non-vacated students whose `nextPaymentDueDate <= today + 3 days` (including due today and overdue).
- **Duplicate Protection:** The system checks `PaymentReminderRepository` and will **not** send multiple automated reminders to the same resident in the same slot on the same day.

### 7.3 Manual Batch Triggering
Staff or Administrators can run reminder batches on demand:
- On `/payments/due`, click **Run Morning Batch (9 AM)** or **Run Evening Batch (6 PM)** at the top banner.
- The system returns the count of reminders dispatched and skipped.

### 7.4 1-Click WhatsApp Reminders
1. In the **Payment Due** table, locate the student row.
2. Click the green **WhatsApp** icon button.
3. The system generates a personalized reminder and opens WhatsApp Web / Mobile App with pre-filled text:
   ```
   📢 Sri Venkateswara Boys Hostel - Fee Reminder
   
   Hello [Student Name],
   
   This is a friendly reminder that your monthly hostel rent of ₹5,000 is due soon on [Date].
   
   🏠 Room & Bed: Room 101 (Bed B101-2)
   💰 Amount Due: ₹5,000
   📅 Due Date: [Date]
   
   💳 Payment Options:
   Please pay via UPI or Cash at the hostel office. Kindly share the transaction screenshot to collect your receipt.
   
   If already paid, kindly ignore this notice.
   
   Thank you,
   Sri Venkateswara Boys Hostel Management
   📍 Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038
   📞 Phone: +91 9441843574 | ✉️ svbhostel2026@gmail.com
   ```
4. Click **Send** in WhatsApp. The reminder is recorded in the student's audit history.

### 7.5 Interactive Reminder Dialog
Clicking the **Remind** button opens the full dialog with:
- **Morning Friendly Template:** Warm morning greeting with rent notice.
- **Evening Follow-up Template:** Evening reminder to settle outstanding fees.
- **Urgent Notice Template:** Strong overdue warning for delinquent payments.
- **Actions:** WhatsApp, SMS (`sms:+91...`), Call (`tel:...`), and Copy to Clipboard.

---

## 8. Daily Expense Management & Net Profit Tracking

Hostel financial sustainability requires rigorous tracking of operational expenditures alongside resident fee collections. The **Expenses & Profit** module (`/expenses`) automates daily ledger logging, category-wise expenditure analytics, and real-time Profit & Loss (P&L) statements.

### 8.1 Key Financial Formula
$$\text{Net Operating Profit} = \text{Total Resident Collections} - \text{Total Operational Expenses}$$
$$\text{Profit Margin (\%)} = \left(\frac{\text{Net Profit}}{\text{Total Collections}}\right) \times 100$$

### 8.2 Standard Operational Expense Categories
| Category | Scope & Eligible Items | Typical Payment Cycle |
| :--- | :--- | :--- |
| **FOOD_MESS** | Provisions, rice, lentils, fresh vegetables, cooking oil, spices, daily milk supply, commercial LPG cylinders, drinking water cans. | Daily & Weekly |
| **UTILITIES** | Monthly electricity bills (TGSPDCL), municipal water board charges, generator fuel/diesel. | Monthly |
| **MAINTENANCE** | Plumbing repairs, electrical maintenance, RO plant servicing, carpentry, painting, drain cleaning. | On-demand / Weekly |
| **SALARIES** | Head cook, kitchen assistants, room & floor sweepers, night security watchman, administrative staff. | Monthly (1st - 5th) |
| **INTERNET_CABLE** | Commercial high-speed Wi-Fi fiber connection and cable television subscriptions. | Monthly |
| **CLEANING_SUPPLIES** | Bleaching powder, phenyl, floor disinfectants, broomsticks, mops, trash bags, pest control treatment. | Bi-weekly |
| **MISCELLANEOUS** | Printing, stationery, hostel license renewals, first-aid/medical supplies, emergency transport. | Ad-hoc |

### 8.3 Recording a Daily Expense
1. Navigate to **Expenses & Profit** (`/expenses`) from the sidebar.
2. Click the **+ Record Expense** button.
3. Complete the ledger entry form:
   - **Expense Category:** Select from the standard categories above.
   - **Amount (₹):** Enter exact expense incurred.
   - **Expense Date:** Date of payment (defaults to current date).
   - **Payment Method:** `Cash`, `UPI`, `Bank Transfer`, `Card`, or `Cheque`.
   - **Paid To / Vendor:** Name of merchant or employee (e.g. *Sri Balaji Vegetables*, *Cook Somanna*).
   - **Description / Itemized Particulars:** Detailed notes (e.g. "Rice 50kg bag, 15L sunflower oil, onion/potato sack").
   - **Invoice / Receipt Number:** Cash memo number or bill reference for audit compliance.
4. Click **Save Expense Entry**. The ledger, monthly totals, and net profit calculations update instantaneously.

### 8.4 Profit & Loss (P&L) Analysis
Switch to the **Profit & Loss Statement** tab on the Expenses page:
- **Total Revenue (Income):** Sum of all paid room rents, admission fees, and utility adjustments collected in that month.
- **Total Operating Expenses:** Sum of all recorded operational expenses.
- **Net Profit:** Clear indicator of surplus (green) or deficit (red).
- **Profit Margin Percentage:** Gauge of hostel operational efficiency.
- **Expense Breakdown Bars:** Visual insight into which departments consume the largest share of hostel capital.

---

## 9. Notice Period & Vacating Procedures

### 9.1 Putting a Student on Notice Period
When a student informs the warden that they plan to vacate:
1. Navigate to the student's profile: `/students/:id`.
2. Click the yellow **Notice Period** button.
3. Enter:
   - **Notice Date:** Date notice was served (defaults to today).
   - **Expected Vacate Date:** Defaults to 15 days from today.
   - **Reason for Leaving:** e.g. "Course completed", "Job relocation".
   - **Remarks:** Bed handover inspection notes.
4. Click **Confirm Notice Period**.
5. The student's status changes to `NOTICE_PERIOD`. They appear under the **Leaving Soon** alerts on the Dashboard and Notifications page.

### 9.2 Vacating a Resident (Final Settlement)
On the resident's departure date:
1. Open the student's profile (`/students/:id`).
2. Click the red **Vacate Student** button (Admin only).
3. The settlement modal displays:
   - Original Security Deposit collected (e.g. `₹5,000`).
   - Deductions (damage repairs, electricity excess, or unpaid rent).
   - **Final Refund Amount:** Calculated net balance to return to student.
   - **Vacate Date:** Actual checkout date.
   - **Remarks:** Final settlement sign-off.
4. Click **Confirm Vacate**.
5. **System Actions upon Vacating:**
   - Student status changes to `VACATED`.
   - The resident's allocated bed is **immediately released to `AVAILABLE`** for new admissions.
   - The bed is unlinked from the student's active profile while preserving historical audit logs.

---

## 10. Operational Alerts & Notifications

Navigate to **Notifications** (`/notifications`) from the sidebar to review live system alerts:
- 🔴 **Overdue Payment Alerts:** Count of delinquent residents and total pending revenue requiring immediate collection.
- 🟡 **Due Soon Alerts:** Payments maturing within the upcoming 7 days.
- 🟣 **Departures / Leaving Soon:** Residents on active notice period scheduled to vacate within 7 days.
- 🟢 **Bed Availability Status:** Live count of unoccupied beds ready for intake.

---

## 11. Reports, Analytics & Financial Reconciliation

Navigate to **Reports** (`/reports`) to access analytical tools:

### 11.1 Revenue Analytics
- **Total Annual Revenue:** Aggregated income across the calendar year.
- **Monthly Revenue Breakdown:** Month-by-month bar chart comparing fee collections.

### 11.2 Collection Breakdown by Payment Method
- Pie chart and summary metrics showing distribution across **UPI**, **Cash**, **Bank Transfer**, and **Card**.

### 11.3 Bed Occupancy Metrics
- Live occupancy rate percentage: `(Occupied Beds / Total Beds) * 100`.
- Floor-by-floor occupancy heat map.
- Distribution by room type (AC vs Non-AC vs Attached Bathroom).

### 11.4 Exporting Reports
- Click **Export Report / Print** to generate clean, printable audit reports for hostel accounting and tax filings.

---

## 12. System Settings & Data Management

Administrators can navigate to **Settings** (`/settings`):

### 12.1 General Institution Profile
- **Hostel Name:** Sri Venkateswara Boys Hostel
- **Address:** Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038
- **Contact Number:** +91 9441843574
- **Official Email:** svbhostel2026@gmail.com
- **Payment Grace Period:** Default 5 days before overdue flags trigger.

### 12.2 Database Tools
- **Reset to Full 70-Bed Layout:** Re-initializes all 16 rooms and 70 beds across 6 floors without deleting admitted students.
- **Clear Demonstration Data:** Empties mock records when transitioning to real-world production data.

---

## 13. Daily & Monthly Operational Checklists

### 🌅 Daily Morning Routine (09:00 AM - 10:00 AM)
1. **Log in** to the system with your credentials.
2. Check the **Dashboard** for:
   - Overdue payments count and pending collection amount.
   - Beds available for new student inquiries.
3. Review **Automated Morning Reminders**:
   - Verify automated 9:00 AM batch dispatch on `/payments/due`.
   - Click the green **WhatsApp** button for critical overdue residents.
4. Process new student admissions for arrivals scheduled for the morning.

### 🌆 Daily Evening Routine (05:30 PM - 07:00 PM)
1. Verify automated **6:00 PM Evening Reminder Batch** execution.
2. Record all cash and UPI fee payments collected at the reception during the day:
   - Verify transaction reference numbers.
   - Issue printed receipts to residents.
3. Record daily operational expenses in **Expenses & Profit** (`/expenses`) - including mess provisions, daily vegetable purchases, maintenance disbursements, or staff advances.
4. Check the **Notice Period** tab for residents scheduled to vacate today; conduct room inspection and complete final settlement.

### 📅 Monthly Closing Routine (28th - 31st of each month)
1. Open **Reports** (`/reports`) and review **Total Collection This Month**.
2. Review the **Profit & Loss Statement** in `/expenses` to verify monthly net profit margin:
   $$\text{Net Profit} = \text{Total Resident Collections} - \text{Total Operating Expenses}$$
3. Audit category expenditures (Mess vs Electricity vs Maintenance vs Salaries) against monthly budget targets.
4. Reconcile recorded UPI/Cash receipts against bank account statements.
5. Follow up with all residents in the **Overdue Rents** category.
6. Export monthly collection and profit report and backup database archives.

---

**Sri Venkateswara Boys Hostel Administration**  
*Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038*  
*Helpline: +91 9441843574 | Email: svbhostel2026@gmail.com*

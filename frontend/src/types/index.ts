export type Role = 'ROLE_ADMIN' | 'ROLE_STAFF';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  expiresInMs: number;
}

export type RoomType = 'STANDARD' | 'AC' | 'NON_AC' | 'ATTACHED_BATHROOM';
export type RoomStatus = 'AVAILABLE' | 'PARTIALLY_OCCUPIED' | 'FULLY_OCCUPIED' | 'UNDER_MAINTENANCE';

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  status: RoomStatus;
  roomType: RoomType;
  defaultRent?: number;
  notes?: string;
  beds?: Bed[];
}

export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export interface Bed {
  id: string;
  bedId: string;
  roomNumber: string;
  bedNumber: number;
  status: BedStatus;
  studentId?: string;
  studentName?: string;
  allocationDate?: string;
  notes?: string;
}

export type StudentStatus = 'ACTIVE' | 'NOTICE_PERIOD' | 'VACATED';

export interface EmergencyContact {
  name: string;
  relationship: string;
  mobileNumber: string;
}

export interface StudentDocument {
  id?: string;
  documentType: string;
  documentName: string;
  fileUrl?: string;
  uploadedAt?: string;
}

export interface NoticeInfo {
  noticeDate: string;
  expectedVacateDate: string;
  reason?: string;
  remarks?: string;
}

export interface VacateInfo {
  vacateDate: string;
  reason?: string;
  refundAmount?: number;
  finalPayment?: number;
  remarks?: string;
}

export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  email?: string;
  aadhaarNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  joiningDate: string;
  roomNumber?: string;
  bedId?: string;
  bedNumber?: number;
  monthlyRent: number;
  securityDeposit?: number;
  paymentDueDay: number;
  nextPaymentDueDate?: string;
  lastPaymentDate?: string;
  admissionStatus: string;
  status: StudentStatus;
  emergencyContact?: EmergencyContact;
  documents?: StudentDocument[];
  noticeInfo?: NoticeInfo;
  vacateInfo?: VacateInfo;
  isOverdue?: boolean;
  daysOverdue?: number;
  paymentStatus?: 'PAID' | 'PENDING' | 'HALF_PAID';
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAdmissionRequest {
  fullName: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  email?: string;
  aadhaarNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  joiningDate: string;
  roomNumber: string;
  bedId: string;
  monthlyRent: number;
  securityDeposit?: number;
  paymentDueDay?: number;
  emergencyContact?: EmergencyContact;
  documents?: StudentDocument[];
}

export interface StudentUpdateRequest {
  fullName: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  email?: string;
  aadhaarNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  paymentDueDay?: number;
  emergencyContact?: EmergencyContact;
  documents?: StudentDocument[];
}

export interface BedTransferRequest {
  targetRoomNumber: string;
  targetBedId: string;
  reason?: string;
}

export interface VacateStudentRequest {
  vacateDate: string;
  reason?: string;
  refundAmount?: number;
  finalPayment?: number;
  remarks?: string;
}

export interface NoticePeriodRequest {
  noticeDate: string;
  expectedVacateDate: string;
  reason?: string;
  remarks?: string;
}

export interface AllocationHistory {
  id: string;
  studentId: string;
  studentName: string;
  fromRoom?: string;
  fromBedId?: string;
  toRoom?: string;
  toBedId?: string;
  allocationDate?: string;
  vacatedDate?: string;
  type: 'INITIAL' | 'TRANSFER' | 'VACATE';
  allocatedBy?: string;
  remarks?: string;
  createdAt?: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';
export type PaymentType = 'MONTHLY_RENT' | 'SECURITY_DEPOSIT' | 'ADVANCE' | 'OTHER';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';

export interface Payment {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  roomNumber?: string;
  bedNumber?: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  transactionReference?: string;
  previousBalance?: number;
  remainingBalance?: number;
  rentForMonth?: string;
  remarks?: string;
  recordedBy?: string;
  createdAt?: string;
}

export interface PaymentRequest {
  studentId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  transactionReference?: string;
  rentForMonth?: string;
  remarks?: string;
}

export interface PaymentDue {
  studentId: string;
  studentName: string;
  mobileNumber: string;
  roomNumber: string;
  bedId: string;
  bedNumber: number;
  monthlyRent: number;
  nextPaymentDueDate: string;
  lastPaymentDate?: string;
  overdue: boolean;
  daysOverdue: number;
  dueCategory: 'DUE_TODAY' | 'DUE_SOON' | 'OVERDUE';
}

export interface DashboardStats {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  maintenanceBeds: number;
  totalStudents: number;
  activeStudents: number;
  noticePeriodStudents: number;
  vacatedStudents: number;
  totalPendingAmount: number;
  paymentsDueSoonCount: number;
  studentsLeavingSoonCount: number;
  overduePaymentsCount: number;
  occupancyPercentage: number;
  recentAdmissions: Student[];
  recentPayments: Payment[];
  upcomingDues: PaymentDue[];
  recentlyVacated: Student[];
  alerts: string[];
}

export interface FloorOccupancy {
  floor: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyPercentage: number;
}

export interface OccupancyReport {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  maintenanceBeds: number;
  occupancyPercentage: number;
  floorBreakdown: FloorOccupancy[];
  roomBreakdown: Room[];
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  amount: number;
  transactionCount: number;
}

export interface RevenueReport {
  totalRevenueYear: number;
  monthlyRevenues: MonthlyRevenue[];
}

export interface CollectionReport {
  totalCollection: number;
  totalPending: number;
  totalOverdue: number;
  collectionToday: number;
  collectionThisMonth: number;
  collectionByMethod: Record<PaymentMethod, number>;
}

export interface HostelSetting {
  id?: string;
  hostelName: string;
  address: string;
  contactNumber: string;
  email: string;
  totalBeds: number;
  defaultMonthlyRent: number;
  defaultSecurityDeposit: number;
  paymentGracePeriodDays: number;
  currency: string;
  demoDataLoaded?: boolean;
}

export interface PaymentReminder {
  id?: string;
  studentId: string;
  studentName: string;
  mobileNumber: string;
  roomNumber: string;
  bedId: string;
  amountDue: number;
  nextPaymentDueDate: string;
  daysUntilDue: number;
  reminderSlot: 'MORNING' | 'EVENING' | 'MANUAL';
  reminderDate: string;
  sentAt: string;
  channel: string;
  message: string;
  status: string;
  whatsappUrl?: string;
}

export interface ReminderBatchResult {
  slot: string;
  date: string;
  totalEligibleStudents: number;
  remindersSent: number;
  alreadyRemindedCount: number;
  message: string;
  reminders: PaymentReminder[];
}

export type ExpenseCategory =
  | 'FOOD_MESS'
  | 'UTILITIES'
  | 'MAINTENANCE'
  | 'SALARIES'
  | 'SUPPLIES'
  | 'MISCELLANEOUS';

export interface Expense {
  id?: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  paymentMethod: PaymentMethod;
  vendor?: string;
  billNumber?: string;
  notes?: string;
  recordedBy?: string;
  createdAt?: string;
}

export interface ExpenseSummary {
  totalExpensesMonth: number;
  expensesToday: number;
  totalExpensesYear: number;
  expenseCountMonth: number;
  expensesByCategory: Record<ExpenseCategory, number>;
}

export interface MonthlyProfitLoss {
  month: string;
  monthNumber: number;
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercentage: number;
  profitable: boolean;
}

export interface ProfitLossReport {
  year: number;
  totalAnnualRevenue: number;
  totalAnnualExpenses: number;
  netAnnualProfit: number;
  annualProfitMarginPercentage: number;
  monthlyBreakdown: MonthlyProfitLoss[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
  timestamp?: string;
}



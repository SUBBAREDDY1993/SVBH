import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Skeleton,
} from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { dashboardService } from '../services/dashboardService';
import { DashboardStats, Payment } from '../types';
import { StatusChip } from '../components/StatusChip';
import { ReceiptModal } from '../components/ReceiptModal';
import { MetricSkeleton } from '../components/Skeletons';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const navigate = useNavigate();

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const openReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setReceiptOpen(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ pb: 4 }}>
        <Box sx={{ mb: 3.5 }}>
          <Skeleton variant="text" width={260} height={40} />
          <Skeleton variant="text" width={420} height={22} />
        </Box>
        <MetricSkeleton count={8} />
      </Box>
    );
  }

  if (!stats) return null;

  return (
    <div className="pb-5">
      {/* Top Banner with Bootstrap 5 Layout & Badges */}
      <div className="row align-items-center justify-content-between mb-4 g-3">
        <div className="col-12 col-lg-7">
          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
            <span className="badge badge-soft-primary rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5">
              <i className="bi bi-building"></i> Sri Venkateswara Boys Hostel
            </span>
            <span className="badge bg-light text-secondary border rounded-pill px-3 py-1.5 fw-medium">
              <i className="bi bi-geo-alt me-1 text-danger"></i> SR Nagar, Ameerpet, Hyderabad
            </span>
            <span className="badge bg-light text-secondary border rounded-pill px-3 py-1.5 fw-medium">
              <i className="bi bi-telephone me-1 text-primary"></i> +91 9441843574
            </span>
          </div>
          <h2 className="fw-bolder text-dark mb-1 tracking-tight">
            Dashboard & Operations Overview
          </h2>
          <p className="text-muted mb-0 small">
            Live occupancy metrics, resident rent status, daily expense ledger, and automated fee reminders
          </p>
        </div>

        {/* Quick Action Buttons with Bootstrap 5 styles */}
        <div className="col-12 col-lg-5">
          <div className="d-flex gap-2 justify-content-lg-end flex-wrap">
            <button
              type="button"
              className="btn btn-primary d-inline-flex align-items-center gap-2 fw-semibold px-3 py-2 shadow-sm rounded-3"
              onClick={() => navigate('/students/new')}
            >
              <i className="bi bi-person-plus-fill"></i>
              <span>New Admission</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 fw-semibold px-3 py-2 bg-white rounded-3 shadow-2xs"
              onClick={() => navigate('/payments')}
            >
              <i className="bi bi-credit-card-2-front-fill text-primary"></i>
              <span>Record Payment</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-success d-inline-flex align-items-center gap-2 fw-semibold px-3 py-2 bg-white rounded-3 shadow-2xs"
              onClick={() => navigate('/expenses')}
            >
              <i className="bi bi-graph-up-arrow text-success"></i>
              <span>Daily Expenses & Profit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overdue / High Priority Alerts */}
      {stats.alerts && stats.alerts.length > 0 && (
        <div className="mb-4">
          {stats.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`alert ${idx === 0 && stats.overduePaymentsCount > 0 ? 'alert-danger border-danger' : 'alert-warning border-warning'} d-flex align-items-center justify-content-between rounded-3 py-2.5 px-3 mb-2 shadow-sm`}
              role="alert"
            >
              <div className="d-flex align-items-center gap-2">
                <i className={`bi ${idx === 0 && stats.overduePaymentsCount > 0 ? 'bi-exclamation-octagon-fill fs-5 text-danger' : 'bi-exclamation-triangle-fill fs-5 text-warning'}`}></i>
                <span className="fw-semibold text-dark small">{alert}</span>
              </div>
              {idx === 0 && stats.overduePaymentsCount > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger fw-bold rounded-pill px-3 py-1"
                  onClick={() => navigate('/payments/due')}
                >
                  Resolve Overdue <i className="bi bi-arrow-right ms-1"></i>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 8 Primary KPI Metric Cards (Bootstrap 5 Grid) */}
      <div className="row g-3 g-xl-4 mb-4">
        {/* Card 1: Total Capacity */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-kpi-card h-100 p-3 p-lg-4 border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="metric-label text-primary">Total Capacity</span>
                <div className="metric-val text-dark">{stats.totalBeds}</div>
                <div className="metric-sub text-muted">
                  <i className="bi bi-door-open me-1"></i> Across 16 rooms (6 floors)
                </div>
              </div>
              <div className="kpi-icon-box badge-soft-primary">
                <HotelIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Occupied Beds */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-kpi-card h-100 p-3 p-lg-4 border-start border-4 border-danger">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="metric-label text-danger">Occupied Beds</span>
                <div className="metric-val text-danger">{stats.occupiedBeds}</div>
                <div className="metric-sub text-danger fw-semibold">
                  <i className="bi bi-pie-chart-fill me-1"></i> {stats.occupancyPercentage}% current occupancy
                </div>
              </div>
              <div className="kpi-icon-box badge-soft-danger">
                <DoNotDisturbAltIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Available Beds */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-kpi-card h-100 p-3 p-lg-4 border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="metric-label text-success">Available Beds</span>
                <div className="metric-val text-success">{stats.availableBeds}</div>
                <div className="metric-sub text-success fw-semibold">
                  <i className="bi bi-check-circle-fill me-1"></i> Ready for intake
                </div>
              </div>
              <div className="kpi-icon-box badge-soft-success">
                <CheckCircleIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Reserved Beds */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-kpi-card h-100 p-3 p-lg-4 border-start border-4 border-warning">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="metric-label text-warning">Reserved Beds</span>
                <div className="metric-val text-warning">{stats.reservedBeds}</div>
                <div className="metric-sub text-muted">
                  <i className="bi bi-bookmark-fill me-1 text-warning"></i> Advance hold bookings
                </div>
              </div>
              <div className="kpi-icon-box badge-soft-warning">
                <BookmarkIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Total Residents */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-kpi-card h-100 p-3 p-lg-4 border-start border-4 border-info">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="metric-label text-info">Active Residents</span>
                <div className="metric-val text-dark">{stats.totalStudents}</div>
                <div className="metric-sub text-muted">
                  <span className="badge badge-soft-success me-1">{stats.activeStudents} Active</span>
                  <span className="badge badge-soft-purple">{stats.noticePeriodStudents} Notice</span>
                </div>
              </div>
              <div className="kpi-icon-box badge-soft-info">
                <PeopleAltIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 6: Pending Dues */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-kpi-card h-100 p-3 p-lg-4 border-start border-4 border-danger">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="metric-label text-danger">Pending Dues</span>
                <div className="metric-val text-danger">₹{stats.totalPendingAmount?.toLocaleString('en-IN')}</div>
                <div className="metric-sub text-danger fw-semibold">
                  <i className="bi bi-clock-history me-1"></i> {stats.overduePaymentsCount} resident(s) overdue
                </div>
              </div>
              <div className="kpi-icon-box badge-soft-danger">
                <AccountBalanceWalletIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 7: Due Soon (7 Days) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-kpi-card h-100 p-3 p-lg-4 border-start border-4 border-warning">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="metric-label text-warning">Due Within 7 Days</span>
                <div className="metric-val text-dark">{stats.paymentsDueSoonCount}</div>
                <div className="metric-sub text-muted">
                  <i className="bi bi-calendar-event me-1"></i> Upcoming rent cycle
                </div>
              </div>
              <div className="kpi-icon-box badge-soft-warning">
                <NotificationImportantIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 8: Notice Period Departures */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-kpi-card h-100 p-3 p-lg-4 border-start border-4 border-secondary">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="metric-label text-secondary">Departures Soon</span>
                <div className="metric-val text-dark">{stats.studentsLeavingSoonCount}</div>
                <div className="metric-sub text-muted">
                  <i className="bi bi-box-arrow-right me-1"></i> 15-day notice active
                </div>
              </div>
              <div className="kpi-icon-box badge-soft-purple">
                <ExitToAppIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hostel Capacity & Occupancy Bar (Bootstrap 5 Progress) */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h5 className="fw-bold text-dark mb-1">
              Hostel Capacity & Live Utilization Rate
            </h5>
            <p className="text-muted small mb-0">
              {stats.occupiedBeds} out of {stats.totalBeds} beds occupied • {stats.availableBeds} beds available for immediate booking
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className={`badge ${stats.occupancyPercentage > 85 ? 'bg-danger' : stats.occupancyPercentage > 50 ? 'bg-primary' : 'bg-success'} fs-6 px-3 py-1.5 rounded-pill`}>
              {stats.occupancyPercentage}% Occupied
            </span>
          </div>
        </div>

        {/* Bootstrap 5 Animated Progress Bar */}
        <div className="progress rounded-pill bg-light" style={{ height: '14px' }}>
          <div
            className={`progress-bar progress-bar-striped progress-bar-animated ${stats.occupancyPercentage > 85 ? 'bg-danger' : stats.occupancyPercentage > 50 ? 'bg-primary' : 'bg-success'}`}
            role="progressbar"
            style={{ width: `${Math.min(stats.occupancyPercentage, 100)}%` }}
            aria-valuenow={stats.occupancyPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>

        {/* Quick stat legend strip */}
        <div className="d-flex justify-content-between mt-3 pt-2 border-top text-muted small flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger rounded-circle p-1"></span>
            <span>Occupied: <strong>{stats.occupiedBeds}</strong></span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success rounded-circle p-1"></span>
            <span>Available: <strong>{stats.availableBeds}</strong></span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning rounded-circle p-1"></span>
            <span>Reserved: <strong>{stats.reservedBeds}</strong></span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-secondary rounded-circle p-1"></span>
            <span>Total Capacity: <strong>{stats.totalBeds} Beds</strong></span>
          </div>
        </div>
      </div>

      {/* Daily Expenses & Profit Summary Banner (Bootstrap 5 Dark Gradient Card) */}
      <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-7">
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className="kpi-icon-box bg-success bg-opacity-25 text-success rounded-3">
                <i className="bi bi-cash-stack fs-4 text-success"></i>
              </div>
              <h5 className="fw-bolder text-white mb-0">
                Daily Expenses & Net Profit Tracking
              </h5>
            </div>
            <p className="text-secondary small mb-3">
              Maintain daily hostel expenditures (Mess/Food groceries, Electricity bills, Repairs, Salaries) and monitor real-time monthly Net Profit statements against resident fee collections.
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <span className="badge bg-dark border border-secondary text-light small px-2.5 py-1">
                <i className="bi bi-egg-fried me-1 text-warning"></i> Mess & Food
              </span>
              <span className="badge bg-dark border border-secondary text-light small px-2.5 py-1">
                <i className="bi bi-lightning-charge me-1 text-info"></i> Electricity & Water
              </span>
              <span className="badge bg-dark border border-secondary text-light small px-2.5 py-1">
                <i className="bi bi-tools me-1 text-danger"></i> Maintenance
              </span>
              <span className="badge bg-dark border border-secondary text-light small px-2.5 py-1">
                <i className="bi bi-people me-1 text-primary"></i> Staff Salaries
              </span>
            </div>
          </div>
          <div className="col-12 col-md-5">
            <div className="d-flex gap-2 justify-content-md-end flex-wrap">
              <button
                type="button"
                className="btn btn-success d-inline-flex align-items-center gap-2 fw-bold px-3 py-2 rounded-3 shadow-sm"
                onClick={() => navigate('/expenses')}
              >
                <i className="bi bi-journal-plus"></i> Open Expense Ledger
              </button>
              <button
                type="button"
                className="btn btn-outline-light d-inline-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-3"
                onClick={() => navigate('/expenses')}
              >
                <i className="bi bi-bar-chart-line"></i> P&L Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Table Section: Upcoming Dues & Recent Admissions */}
      <div className="row g-3 g-xl-4 mb-4">
        {/* Table 1: Upcoming & Overdue Rent Dues */}
        <div className="col-12 col-lg-6">
          <div className="dashboard-table-card h-100">
            <div className="card-header-bar">
              <div>
                <h6 className="fw-bold text-dark mb-0">Upcoming & Overdue Rent Dues</h6>
                <span className="text-muted small">Resident fees requiring immediate attention</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none fw-bold text-primary p-0 d-inline-flex align-items-center gap-1"
                onClick={() => navigate('/payments/due')}
              >
                <span>View All</span>
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>

            {stats.upcomingDues && stats.upcomingDues.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Resident</th>
                      <th>Room / Bed</th>
                      <th>Due Date</th>
                      <th>Rent</th>
                      <th className="text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.upcomingDues.slice(0, 5).map((due) => (
                      <tr key={due.studentId}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar rounded-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}>
                              {due.studentName?.charAt(0) || 'R'}
                            </div>
                            <span className="fw-semibold text-dark">{due.studentName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border me-1">Rm {due.roomNumber}</span>
                          <span className="badge badge-soft-primary">{due.bedId}</span>
                        </td>
                        <td className="small text-muted">{due.nextPaymentDueDate}</td>
                        <td className="fw-bold text-danger">₹{due.monthlyRent?.toLocaleString('en-IN')}</td>
                        <td className="text-end">
                          <StatusChip status={due.dueCategory} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center">
                <i className="bi bi-check2-circle fs-1 text-success mb-2 d-block"></i>
                <h6 className="fw-bold text-dark">All Rents Settled</h6>
                <p className="text-muted small mb-0">No overdue or pending rent payments recorded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Table 2: Recent Student Admissions */}
        <div className="col-12 col-lg-6">
          <div className="dashboard-table-card h-100">
            <div className="card-header-bar">
              <div>
                <h6 className="fw-bold text-dark mb-0">Recent Admissions</h6>
                <span className="text-muted small">Latest resident registrations in SVBH</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none fw-bold text-primary p-0 d-inline-flex align-items-center gap-1"
                onClick={() => navigate('/students')}
              >
                <span>View All</span>
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>

            {stats.recentAdmissions && stats.recentAdmissions.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Resident</th>
                      <th>Student ID</th>
                      <th>Allocation</th>
                      <th>Joining</th>
                      <th className="text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentAdmissions.slice(0, 5).map((student) => (
                      <tr
                        key={student.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/students/${student.studentId}`)}
                      >
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar rounded-circle bg-success bg-opacity-10 text-success fw-bold d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}>
                              {student.fullName?.charAt(0) || 'S'}
                            </div>
                            <span className="fw-semibold text-dark">{student.fullName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-primary border font-monospace">{student.studentId}</span>
                        </td>
                        <td className="small">
                          Room {student.roomNumber} ({student.bedId})
                        </td>
                        <td className="small text-muted">{student.joiningDate}</td>
                        <td className="text-end">
                          <StatusChip status={student.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center">
                <i className="bi bi-person-x fs-1 text-muted mb-2 d-block"></i>
                <h6 className="fw-bold text-dark">No Admissions Yet</h6>
                <p className="text-muted small mb-3">Database is clean and ready for onboarding.</p>
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-3 fw-semibold px-3"
                  onClick={() => navigate('/students/new')}
                >
                  Admit First Resident
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Payments Section (Bootstrap 5 Table Card) */}
      <div className="dashboard-table-card">
        <div className="card-header-bar">
          <div>
            <h6 className="fw-bold text-dark mb-0">Recent Payment Transactions</h6>
            <span className="text-muted small">Confirmed fee collection receipts and payment vouchers</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none fw-bold text-primary p-0 d-inline-flex align-items-center gap-1"
            onClick={() => navigate('/payments')}
          >
            <span>View All Payments</span>
            <i className="bi bi-arrow-right"></i>
          </button>
        </div>

        {stats.recentPayments && stats.recentPayments.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Resident</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Payment Mode</th>
                  <th>Fee Category</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.slice(0, 5).map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <span className="badge badge-soft-primary font-monospace fw-bold px-2.5 py-1">
                        {payment.receiptNumber}
                      </span>
                    </td>
                    <td className="fw-semibold text-dark">{payment.studentName}</td>
                    <td>
                      <span className="fw-bolder text-success fs-6">
                        ₹{payment.amount?.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="small text-muted">{payment.paymentDate}</td>
                    <td>
                      <span className="badge bg-light text-dark border px-2.5 py-1">
                        {payment.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className="small text-secondary text-capitalize">
                        {payment.paymentType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 rounded-pill px-3 py-1 fw-bold shadow-2xs"
                        onClick={() => openReceipt(payment)}
                      >
                        <i className="bi bi-printer"></i>
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5 text-center">
            <i className="bi bi-receipt fs-1 text-muted mb-2 d-block"></i>
            <h6 className="fw-bold text-dark">No Payment Transactions Recorded</h6>
            <p className="text-muted small mb-0">Collected fees and receipts will appear here automatically.</p>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        payment={selectedPayment}
      />
    </div>
  );
};

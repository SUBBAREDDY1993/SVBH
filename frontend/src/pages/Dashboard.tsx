import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Skeleton,
  Tooltip,
} from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import RefreshIcon from '@mui/icons-material/Refresh';
import PaymentIcon from '@mui/icons-material/Payment';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { dashboardService } from '../services/dashboardService';
import { reminderService } from '../services/reminderService';
import { DashboardStats, FeeReminder, Payment, ReminderCounts } from '../types';
import { StatusChip } from '../components/StatusChip';
import { ReceiptModal } from '../components/ReceiptModal';
import { MetricSkeleton } from '../components/Skeletons';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Live Fee Reminders State (Requirements 1, 2, 3, 4, 8, 9, 10)
  const [reminders, setReminders] = useState<FeeReminder[]>([]);
  const [reminderCounts, setReminderCounts] = useState<ReminderCounts | null>(null);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderFilter, setReminderFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_TODAY' | 'DUE_TOMORROW' | 'UPCOMING'>('ALL');

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

  const loadReminders = async () => {
    try {
      setIsLoadingReminders(true);
      setReminderError(null);
      const [rems, counts] = await Promise.all([
        reminderService.getActiveReminders(),
        reminderService.getReminderCounts(),
      ]);
      setReminders(rems);
      setReminderCounts(counts);
    } catch (error) {
      console.error('Failed to load fee reminders:', error);
      setReminderError('Unable to load reminders. Please try again.');
    } finally {
      setIsLoadingReminders(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadReminders();

    // Auto Refresh on student add/update, fee due change, payment record (Requirement 8)
    const handleRefresh = () => {
      loadDashboard();
      loadReminders();
    };

    window.addEventListener('svbh-refresh-data', handleRefresh);
    return () => window.removeEventListener('svbh-refresh-data', handleRefresh);
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

  const filteredReminders = reminders.filter((r) => {
    if (reminderFilter === 'OVERDUE') return r.status === 'OVERDUE' || r.daysRemaining < 0;
    if (reminderFilter === 'DUE_TODAY') return r.status === 'DUE_TODAY' || r.daysRemaining === 0;
    if (reminderFilter === 'DUE_TOMORROW') return r.daysRemaining === 1;
    if (reminderFilter === 'UPCOMING') return r.daysRemaining >= 2 && r.daysRemaining <= 7;
    return true;
  });

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

      {/* Dynamic Summary Counts (Requirement 4: Upcoming Fees, Due Today, Overdue, Paid) */}
      <div className="row g-3 mb-4">
        {/* Card 1: Upcoming Fees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className={`dashboard-kpi-card h-100 p-3 p-lg-4 border-start border-4 border-primary rounded-4 bg-white ${reminderFilter === 'UPCOMING' ? 'shadow-md border-primary' : ''}`}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setReminderFilter(reminderFilter === 'UPCOMING' ? 'ALL' : 'UPCOMING')}
            title="Filter by upcoming fees"
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="metric-label text-primary">Upcoming Fees</span>
                <div className="metric-val text-dark">
                  {reminderCounts ? reminderCounts.upcomingFees : <Skeleton width={50} height={36} />}
                </div>
                <div className="metric-sub text-muted">
                  <i className="bi bi-calendar-event me-1 text-primary"></i> Due within 7 days
                </div>
              </div>
              <div className="kpi-icon-box badge-soft-primary">
                <ScheduleIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Due Today */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className={`dashboard-kpi-card h-100 p-3 p-lg-4 border-start border-4 border-warning rounded-4 bg-white ${reminderFilter === 'DUE_TODAY' ? 'shadow-md' : ''}`}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setReminderFilter(reminderFilter === 'DUE_TODAY' ? 'ALL' : 'DUE_TODAY')}
            title="Filter by due today"
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="metric-label text-warning">Due Today</span>
                <div className="metric-val text-warning">
                  {reminderCounts ? reminderCounts.dueToday : <Skeleton width={50} height={36} />}
                </div>
                <div className="metric-sub text-warning fw-semibold">
                  <i className="bi bi-clock-fill me-1"></i> Payable today
                </div>
              </div>
              <div className="kpi-icon-box badge-soft-warning">
                <NotificationImportantIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Overdue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className={`dashboard-kpi-card h-100 p-3 p-lg-4 border-start border-4 border-danger rounded-4 bg-white ${reminderFilter === 'OVERDUE' ? 'shadow-md' : ''}`}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setReminderFilter(reminderFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
            title="Filter by overdue"
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="metric-label text-danger">Overdue</span>
                <div className="metric-val text-danger">
                  {reminderCounts ? reminderCounts.overdue : <Skeleton width={50} height={36} />}
                </div>
                <div className="metric-sub text-danger fw-semibold">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i> Past due date
                </div>
              </div>
              <div className="kpi-icon-box badge-soft-danger">
                <WarningAmberIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Paid */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="dashboard-kpi-card h-100 p-3 p-lg-4 border-start border-4 border-success rounded-4 bg-white"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => navigate('/payments')}
            title="View completed payments"
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="metric-label text-success">Paid</span>
                <div className="metric-val text-success">
                  {reminderCounts ? reminderCounts.paid : <Skeleton width={50} height={36} />}
                </div>
                <div className="metric-sub text-success fw-semibold">
                  <i className="bi bi-check-circle-fill me-1"></i> Settled this cycle
                </div>
              </div>
              <div className="kpi-icon-box badge-soft-success">
                <CheckCircleIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clearly Visible FEE REMINDERS Section (Requirements 1, 2, 3, 8, 9, 10) */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white" id="fee-reminders">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2.5">
            <div className="kpi-icon-box badge-soft-warning rounded-3" style={{ width: '42px', height: '42px' }}>
              <NotificationsActiveIcon sx={{ color: '#d97706', fontSize: 24 }} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bolder text-dark mb-0 tracking-tight text-uppercase">
                  FEE REMINDERS
                </h5>
                <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1 fw-bold font-monospace">
                  {reminders.length} Active
                </span>
              </div>
              <p className="text-muted small mb-0">
                Student fee due notices, countdowns, and instant collection alerts
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Filter buttons */}
            <div className="btn-group btn-group-sm rounded-3 shadow-2xs" role="group">
              <button
                type="button"
                className={`btn ${reminderFilter === 'ALL' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                onClick={() => setReminderFilter('ALL')}
              >
                All ({reminders.length})
              </button>
              <button
                type="button"
                className={`btn ${reminderFilter === 'OVERDUE' ? 'btn-danger' : 'btn-outline-secondary bg-white'}`}
                onClick={() => setReminderFilter('OVERDUE')}
              >
                Overdue ({reminderCounts?.overdue ?? 0})
              </button>
              <button
                type="button"
                className={`btn ${reminderFilter === 'DUE_TODAY' ? 'btn-warning text-dark' : 'btn-outline-secondary bg-white'}`}
                onClick={() => setReminderFilter('DUE_TODAY')}
              >
                Due Today ({reminderCounts?.dueToday ?? 0})
              </button>
              <button
                type="button"
                className={`btn ${reminderFilter === 'UPCOMING' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                onClick={() => setReminderFilter('UPCOMING')}
              >
                Upcoming ({reminderCounts?.upcomingFees ?? 0})
              </button>
            </div>

            <IconButton
              size="small"
              onClick={loadReminders}
              disabled={isLoadingReminders}
              title="Refresh Fee Reminders"
              sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}
            >
              <RefreshIcon
                fontSize="small"
                sx={{
                  animation: isLoadingReminders ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
            </IconButton>

            <button
              type="button"
              className="btn btn-sm btn-outline-primary fw-semibold px-3 rounded-3"
              onClick={() => navigate('/payments/due')}
            >
              Due Matrix <i className="bi bi-arrow-right ms-1"></i>
            </button>
          </div>
        </div>

        {/* Loading State (Requirement 10) */}
        {isLoadingReminders && reminders.length === 0 ? (
          <div className="p-5 text-center my-2">
            <CircularProgress size={36} sx={{ color: '#2563eb', mb: 2 }} />
            <h6 className="fw-bold text-dark mb-1">Loading reminders...</h6>
            <p className="text-muted small mb-0">Checking upcoming fee due dates and payment records</p>
          </div>
        ) : reminderError ? (
          /* Error State (Requirement 10) */
          <div className="p-4 text-center my-2 border border-danger-subtle rounded-3 bg-danger-subtle bg-opacity-25">
            <WarningAmberIcon sx={{ color: '#dc2626', fontSize: 36, mb: 1 }} />
            <h6 className="fw-bold text-danger mb-1">Unable to load reminders.</h6>
            <p className="text-muted small mb-3">Please try again.</p>
            <button
              type="button"
              className="btn btn-sm btn-danger fw-semibold px-4 rounded-pill shadow-sm"
              onClick={loadReminders}
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Retry
            </button>
          </div>
        ) : filteredReminders.length === 0 ? (
          /* Empty State (Requirement 9) */
          <div className="p-5 text-center my-2 rounded-3 bg-light border border-dashed">
            <span className="display-5 d-block mb-2">🎉</span>
            <h5 className="fw-bold text-dark mb-1">No pending fee reminders 🎉</h5>
            <p className="text-muted small mb-3">
              {reminderFilter !== 'ALL'
                ? `No reminders matching the selected "${reminderFilter.toLowerCase().replace('_', ' ')}" filter.`
                : 'All student fee payments are up to date and no fees are due or overdue at this time.'}
            </p>
            {reminderFilter !== 'ALL' && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary fw-semibold px-3 rounded-pill"
                onClick={() => setReminderFilter('ALL')}
              >
                Show All Reminders
              </button>
            )}
          </div>
        ) : (
          /* Cards Grid (Requirement 3: Ravi Kumar, Room 203 | Bed 2, Fee ₹5,000, Due Date 05-Oct-2026, ⚠ Payment due in 2 days) */
          <div className="row g-3 pt-2">
            {filteredReminders.map((rem) => {
              const isOverdue = rem.daysRemaining < 0;
              const isToday = rem.daysRemaining === 0;
              const isTomorrow = rem.daysRemaining === 1;

              // Border and styling accents
              const borderColor = isOverdue
                ? '#ef4444'
                : isToday
                ? '#f59e0b'
                : isTomorrow
                ? '#f97316'
                : rem.daysRemaining <= 3
                ? '#eab308'
                : '#3b82f6';

              const urgencyBadgeClass = isOverdue
                ? 'bg-danger-subtle text-danger border border-danger-subtle'
                : isToday
                ? 'bg-warning-subtle text-dark border border-warning-subtle'
                : isTomorrow
                ? 'bg-warning-subtle text-dark border border-warning'
                : rem.daysRemaining <= 3
                ? 'bg-warning-subtle text-dark border border-warning-subtle'
                : 'bg-primary-subtle text-primary border border-primary-subtle';

              // Requirement 2:
              // Due in 7 days -> Upcoming reminder
              // Due in 3 days -> Payment reminder
              // Due tomorrow -> Urgent reminder / Payment due tomorrow
              // Due today -> Payment due today
              // Past due date -> Overdue reminder
              const statusText = isOverdue
                ? `Payment overdue by ${Math.abs(rem.daysRemaining)} day${Math.abs(rem.daysRemaining) === 1 ? '' : 's'}`
                : isToday
                ? 'Payment due today'
                : isTomorrow
                ? 'Payment due tomorrow'
                : `Payment due in ${rem.daysRemaining} days`;

              return (
                <div key={rem.studentId} className="col-12 col-md-6 col-xl-4">
                  <div
                    className="card h-100 border-0 shadow-sm rounded-4 p-3.5 bg-white position-relative"
                    style={{
                      borderLeft: `5px solid ${borderColor}`,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    {/* Header: Student Name & Payment Status */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6
                          className="fw-bolder text-dark mb-0 text-truncate"
                          style={{ cursor: 'pointer', maxWidth: '210px' }}
                          title={rem.studentName}
                          onClick={() => navigate(`/students/${rem.studentId}`)}
                        >
                          {rem.studentName}
                        </h6>
                        <div className="text-muted small mt-0.5">
                          <i className="bi bi-door-closed me-1"></i>
                          Room: <strong>{rem.roomNumber}</strong> | Bed: <strong>{rem.bedNumber || rem.bedId}</strong>
                        </div>
                      </div>
                      <span
                        className={`badge ${rem.paymentStatus === 'HALF_PAID' ? 'bg-warning text-dark' : 'bg-secondary-subtle text-secondary'} rounded-pill px-2.5 py-1 fw-bold`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        {rem.paymentStatus === 'HALF_PAID' ? 'HALF PAID' : 'PENDING'}
                      </span>
                    </div>

                    {/* Fee & Due Date Box */}
                    <div className="d-flex justify-content-between align-items-center py-2 px-3 my-2 rounded-3 bg-light border">
                      <div>
                        <span className="text-muted d-block" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                          FEE AMOUNT
                        </span>
                        <span className="fw-bolder fs-5 text-dark">
                          ₹{rem.feeAmount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="text-muted d-block" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                          DUE DATE
                        </span>
                        <span className="fw-bold text-dark font-monospace" style={{ fontSize: '0.9rem' }}>
                          {rem.dueDateFormatted || rem.dueDate}
                        </span>
                      </div>
                    </div>

                    {/* Urgency / Due Condition Notice */}
                    <div className={`p-2 rounded-3 mb-3 d-flex align-items-center gap-2 ${urgencyBadgeClass}`}>
                      <i className={`bi ${isOverdue ? 'bi-exclamation-octagon-fill text-danger' : isToday ? 'bi-exclamation-circle-fill text-warning' : 'bi-clock-history text-primary'}`}></i>
                      <span className="fw-bold small">
                        ⚠ {statusText}
                      </span>
                    </div>

                    {/* Action Buttons: WhatsApp & Record Payment */}
                    <div className="d-flex gap-2 mt-auto">
                      {rem.whatsappUrl ? (
                        <a
                          href={rem.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-success flex-grow-1 fw-bold d-inline-flex align-items-center justify-content-center gap-1.5 rounded-3 shadow-2xs"
                        >
                          <i className="bi bi-whatsapp"></i>
                          <span>WhatsApp</span>
                        </a>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn-sm btn-primary flex-grow-1 fw-bold d-inline-flex align-items-center justify-content-center gap-1.5 rounded-3 shadow-sm"
                        onClick={() => navigate('/payments')}
                      >
                        <i className="bi bi-credit-card"></i>
                        <span>Collect Fee</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

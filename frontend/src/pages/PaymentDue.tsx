import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TodayIcon from '@mui/icons-material/Today';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ReplayIcon from '@mui/icons-material/Replay';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EmailIcon from '@mui/icons-material/Email';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import Collapse from '@mui/material/Collapse';
import { paymentService } from '../services/paymentService';
import { reminderService } from '../services/reminderService';
import { AdminDueAlert, PaymentDue as PaymentDueType, PaymentReminder } from '../types';
import { StatusChip } from '../components/StatusChip';
import { PaymentReminderModal } from '../components/PaymentReminderModal';
import { WhatsAppBatchModal } from '../components/WhatsAppBatchModal';
import { useNotification } from '../context/NotificationContext';

export const PaymentDue: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [tabIndex, setTabIndex] = useState(0); // 0: Overdue, 1: Due Today, 2: Due Soon

  const [overdueList, setOverdueList] = useState<PaymentDueType[]>([]);
  const [dueTodayList, setDueTodayList] = useState<PaymentDueType[]>([]);
  const [dueSoonList, setDueSoonList] = useState<PaymentDueType[]>([]);
  const [todayReminders, setTodayReminders] = useState<PaymentReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  // Selected student for reminder modal
  const [selectedDueItem, setSelectedDueItem] = useState<PaymentDueType | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  // Force Resend toggle and Skipped confirmation state
  const [forceResend, setForceResend] = useState(false);
  const [skipPrompt, setSkipPrompt] = useState<{
    open: boolean;
    slot: 'MORNING' | 'EVENING' | 'NIGHT';
    skippedCount: number;
    sentCount: number;
  }>({
    open: false,
    slot: 'EVENING',
    skippedCount: 0,
    sentCount: 0,
  });

  // WhatsApp Batch Dispatcher Modal State
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchModalReminders, setBatchModalReminders] = useState<PaymentReminder[]>([]);
  const [batchModalSlot, setBatchModalSlot] = useState<string>('EVENING');

  // Management 5-day & 3-day Alert State
  const [adminAlert, setAdminAlert] = useState<AdminDueAlert | null>(null);
  const [isSendingAdminAlert, setIsSendingAdminAlert] = useState(false);
  const [showAdminAlertDetails, setShowAdminAlertDetails] = useState(false);

  const loadDues = async () => {
    try {
      setIsLoading(true);
      const [overdue, today, soon] = await Promise.all([
        paymentService.getOverdue(),
        paymentService.getDueToday(),
        paymentService.getDueSoon(),
      ]);
      setOverdueList(overdue);
      setDueTodayList(today);
      setDueSoonList(soon);
    } catch (err) {
      console.error('Failed to load dues:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      const data = await reminderService.getTodayReminders();
      setTodayReminders(data);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    }
  };

  const loadAdminAlert = async () => {
    try {
      const data = await reminderService.getAdminDueAlert();
      setAdminAlert(data);
    } catch (err) {
      console.warn('Could not load management due alert preview:', err);
    }
  };

  useEffect(() => {
    loadDues();
    loadReminders();
    loadAdminAlert();
  }, []);

  const handleSendAdminAlert = async (force = true) => {
    try {
      setIsSendingAdminAlert(true);
      const res = await reminderService.sendAdminDueAlert(force);
      showSuccess(res.emailDeliveryMessage || `Management fee alert processed for ${res.recipientEmail || 'svbhostel2026@gmail.com'}`);
      setAdminAlert(res);
      loadReminders();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to dispatch management alert');
    } finally {
      setIsSendingAdminAlert(false);
    }
  };

  const handleOpenWhatsAppAdminAlert = async () => {
    if (adminAlert?.whatsappUrl) {
      window.open(adminAlert.whatsappUrl, '_blank');
      return;
    }
    try {
      const fresh = await reminderService.getAdminDueAlert();
      setAdminAlert(fresh);
      if (fresh?.whatsappUrl) {
        window.open(fresh.whatsappUrl, '_blank');
        return;
      }
    } catch (e) {
      console.warn('Could not fetch latest alert for WhatsApp, using direct URL:', e);
    }
    const defaultMsg = encodeURIComponent(
      `📢 *Sri Venkateswara Boys Hostel - Management Fee Alert*\n\n` +
      `📅 *Alert Date:* ${new Date().toLocaleDateString('en-GB')}\n` +
      `✉️ *Target Email:* svbhostel2026@gmail.com\n` +
      `📞 *Target Mobile:* 8985010694\n\n` +
      `🔔 *Management 5-Day & 3-Day Fee Due Digest*\n` +
      `Status: All resident fees are currently up to date!\n\n` +
      `📍 *Sri Venkateswara Boys Hostel Management*\n` +
      `SR Nagar, Ameerpet, Hyderabad - 500038\n` +
      `📞 +91 9441843574 | ✉️ svbhostel2026@gmail.com`
    );
    window.open(`https://wa.me/918985010694?text=${defaultMsg}`, '_blank');
  };


  const handleTriggerBatch = async (slot: 'MORNING' | 'EVENING' | 'NIGHT', _force = true) => {
    try {
      setIsBatchRunning(true);
      // Always force refresh so residents are never blocked or skipped by duplicate lock
      const res = await reminderService.triggerBatch(slot, true);

      if (res.reminders && res.reminders.length > 0) {
        setBatchModalReminders(res.reminders);
        setBatchModalSlot(slot);
        setBatchModalOpen(true);
        showSuccess(`Prepared WhatsApp reminders for ${res.reminders.length} residents!`);
      } else {
        showSuccess(res.message || `No residents due for ${slot} reminders.`);
      }
      loadReminders();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to trigger reminder batch');
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleOpenReminderModal = (item: PaymentDueType) => {
    setSelectedDueItem(item);
    setReminderModalOpen(true);
  };

  const handleQuickWhatsApp = async (item: PaymentDueType) => {
    if (!item.mobileNumber) {
      showError('No mobile number available for this resident');
      return;
    }
    const cleanPhone = item.mobileNumber.replace(/[^0-9]/g, '');
    const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const daysOverdue = item.daysOverdue || 0;
    const isOverdue = item.overdue || daysOverdue > 0;
    const dueDateStr = item.nextPaymentDueDate || 'N/A';
    const isHalfPaid = item.paymentStatus === 'HALF_PAID';
    const amountDue = isHalfPaid ? Math.round((item.monthlyRent || 0) / 2) : (item.monthlyRent || 0);
    const amountStr = amountDue.toLocaleString('en-IN');
    const totalRentStr = (item.monthlyRent || 0).toLocaleString('en-IN');

    let statusLine = '';
    if (isHalfPaid) {
      statusLine = `you have paid partial fee, and your remaining *HALF FEE BALANCE of ₹${amountStr} is PENDING* (Due date: ${dueDateStr})`;
    } else if (isOverdue) {
      statusLine = `your monthly hostel rent is *${daysOverdue} days OVERDUE* (Due date: ${dueDateStr})`;
    } else if (daysOverdue === 0 && item.dueCategory === 'DUE_TODAY') {
      statusLine = `your monthly hostel rent is *DUE TODAY* (${dueDateStr})`;
    } else if (item.daysUntilDue !== undefined && item.daysUntilDue > 0) {
      statusLine = `your monthly hostel rent of ₹${amountStr} is *due in ${item.daysUntilDue} day${item.daysUntilDue === 1 ? '' : 's'} on ${dueDateStr}*`;
    } else {
      statusLine = `your monthly hostel rent of ₹${amountStr} is *due soon on ${dueDateStr}*`;
    }

    const message =
      `📢 *Sri Venkateswara Boys Hostel - Fee Reminder*\n\n` +
      `Hello ${item.studentName},\n\n` +
      `This is a friendly reminder that ${statusLine}.\n\n` +
      `🏠 *Room & Bed:* Room ${item.roomNumber} (Bed ${item.bedId})\n` +
      (isHalfPaid ? `💰 *Total Monthly Rent:* ₹${totalRentStr}\n` : '') +
      `💳 *${isHalfPaid ? 'Remaining Balance Pending' : 'Amount Due'}:* ₹${amountStr}\n` +
      `📅 *Due Date:* ${dueDateStr}\n\n` +
      `💳 *Payment Options:*\n` +
      `Please pay via UPI or Cash at the hostel office. Kindly share the transaction screenshot to collect your receipt.\n\n` +
      `_If already paid, kindly ignore this notice._\n\n` +
      `Thank you,\n*Sri Venkateswara Boys Hostel Management*\n` +
      `📍 Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038\n` +
      `📞 Phone: +91 9441843574 | ✉️ svbhostel2026@gmail.com`;

    try {
      await reminderService.recordManualReminder(item.studentId, 'WHATSAPP', message);
      loadReminders();
    } catch (e) {
      console.warn('Could not record reminder log:', e);
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const totalOverdueAmount = overdueList.reduce((sum, d) => sum + (d.monthlyRent || 0), 0);
  const totalDueTodayAmount = dueTodayList.reduce((sum, d) => sum + (d.monthlyRent || 0), 0);
  const totalDueSoonAmount = dueSoonList.reduce((sum, d) => sum + (d.monthlyRent || 0), 0);

  const currentList =
    tabIndex === 0 ? overdueList : tabIndex === 1 ? dueTodayList : dueSoonList;

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
          Payment Due Tracking & Reminders
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Monitor overdue rents, payments due today, upcoming collections, and dispatch fee reminders
        </Typography>
      </Box>

      {/* Automated Reminder Schedule Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3.5,
          borderRadius: 3,
          bgcolor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <NotificationsActiveIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#166534' }}>
                Automated Daily Fee Reminders Active
              </Typography>
              <Chip
                label="3 Days Prior • Morning (9 AM), Evening (6 PM) & Night (9 PM)"
                size="small"
                sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.72rem' }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#15803d', mt: 0.3 }}>
              The system automatically scans and logs fee reminders 3 days before payment due dates, daily at 9:00 AM, 6:00 PM, and 9:00 PM.
            </Typography>
            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600, display: 'block', mt: 0.3 }}>
              📊 {todayReminders.length} reminder(s) logged today
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Tooltip title="When enabled, reminders will be resent to all eligible residents even if they already received one today">
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  color="warning"
                  checked={forceResend}
                  onChange={(e) => setForceResend(e.target.checked)}
                />
              }
              label={
                <Typography variant="caption" sx={{ fontWeight: 700, color: forceResend ? '#b45309' : '#334155' }}>
                  Force Resend
                </Typography>
              }
              sx={{ mr: 0.5 }}
            />
          </Tooltip>

          <Button
            variant="outlined"
            size="small"
            color={forceResend ? 'warning' : 'success'}
            startIcon={forceResend ? <ReplayIcon /> : <WbSunnyIcon />}
            disabled={isBatchRunning}
            onClick={() => handleTriggerBatch('MORNING', forceResend)}
            sx={{ fontWeight: 700, bgcolor: '#ffffff', textTransform: 'none' }}
          >
            {forceResend ? 'Force Resend Morning' : 'Run Morning Batch (9 AM)'}
          </Button>
          <Button
            variant="contained"
            size="small"
            color="success"
            startIcon={forceResend ? <ReplayIcon /> : <WhatsAppIcon />}
            disabled={isBatchRunning}
            onClick={() => handleTriggerBatch('EVENING', forceResend)}
            sx={{
              fontWeight: 800,
              bgcolor: '#059669',
              color: '#ffffff',
              textTransform: 'none',
              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
              '&:hover': { bgcolor: '#047857' },
            }}
          >
            {forceResend ? 'Force Resend Evening' : 'Run Evening Batch (WhatsApp)'}
          </Button>
          <Button
            variant="contained"
            size="small"
            color={forceResend ? 'warning' : 'primary'}
            startIcon={forceResend ? <ReplayIcon /> : <DarkModeIcon />}
            disabled={isBatchRunning}
            onClick={() => handleTriggerBatch('NIGHT', forceResend)}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              ...(forceResend
                ? {}
                : { bgcolor: '#312e81', '&:hover': { bgcolor: '#1e1b4b' } }),
            }}
          >
            {forceResend ? 'Force Resend Night' : 'Run Night Batch (9 PM)'}
          </Button>
        </Box>
      </Paper>

      {/* Management 5-Day & 3-Day Payment Due Alerts Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3.5,
          borderRadius: 3,
          bgcolor: '#f8fafc',
          border: '1px solid #cbd5e1',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MarkEmailReadIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Management Due Date Alerts (5-Day & 3-Day Prior)
                </Typography>
                <Chip
                  icon={<EmailIcon sx={{ fontSize: '13px !important' }} />}
                  label="svbhostel2026@gmail.com"
                  size="small"
                  sx={{ bgcolor: '#e0e7ff', color: '#3730a3', fontWeight: 700, fontSize: '0.72rem' }}
                />
                <Chip
                  icon={<WhatsAppIcon sx={{ fontSize: '13px !important', color: '#16a34a' }} />}
                  label="+91 8985010694"
                  size="small"
                  sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: '0.72rem' }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#475569', mt: 0.3 }}>
                Automated daily management digest sent at 8:30 AM tracking upcoming fee collections 5 days and 3 days before due dates.
              </Typography>
            </Box>
          </Box>

          {/* Quick Dispatch Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<WhatsAppIcon sx={{ color: '#16a34a' }} />}
              onClick={handleOpenWhatsAppAdminAlert}
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: '#ffffff',
                borderColor: '#22c55e',
                color: '#15803d',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                '&:hover': { bgcolor: '#f0fdf4', borderColor: '#16a34a' },
              }}
            >
              WhatsApp Digest (8985010694)
            </Button>
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<EmailIcon />}
              disabled={isSendingAdminAlert}
              onClick={() => handleSendAdminAlert(true)}
              sx={{ fontWeight: 700, textTransform: 'none', bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
            >
              {isSendingAdminAlert ? 'Sending Email...' : 'Send Email Alert'}
            </Button>
            {adminAlert && adminAlert.totalStudentsCount > 0 && (
              <Button
                size="small"
                variant="text"
                endIcon={showAdminAlertDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowAdminAlertDetails(!showAdminAlertDetails)}
                sx={{ fontWeight: 700, textTransform: 'none', color: '#475569' }}
              >
                {showAdminAlertDetails ? 'Hide List' : 'View Residents'}
              </Button>
            )}
          </Box>
        </Box>

        {/* Counts summary chips */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', pt: 1.5, borderTop: '1px solid #e2e8f0' }}>
          {adminAlert?.dueTodayCount !== undefined && adminAlert.dueTodayCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626' }}>
                DUE TODAY:
              </Typography>
              <Chip
                label={`${adminAlert.dueTodayCount} Residents`}
                size="small"
                sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 800, fontSize: '0.72rem' }}
              />
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
              DUE IN 1-3 DAYS (URGENT):
            </Typography>
            <Chip
              label={`${adminAlert?.dueIn3DaysCount || 0} Residents`}
              size="small"
              sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 800, fontSize: '0.72rem' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
              DUE IN 4-5 DAYS:
            </Typography>
            <Chip
              label={`${adminAlert?.dueIn5DaysCount || 0} Residents`}
              size="small"
              sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '0.72rem' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
              TOTAL EXPECTED:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
              ₹{(adminAlert?.totalAmountDue || 0).toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Box>

        {/* Collapsible Details Table */}
        <Collapse in={showAdminAlertDetails}>
          <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #cbd5e1' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
              Upcoming Resident Fee Dues (1-5 Days Prior Window Breakdown):
            </Typography>
            <Grid container spacing={2}>
              {/* Due Today (if any) */}
              {adminAlert?.studentsDueToday && adminAlert.studentsDueToday.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #fecaca' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#dc2626', display: 'block', mb: 1 }}>
                      🚨 Due Today ({adminAlert.studentsDueToday.length})
                    </Typography>
                    {adminAlert.studentsDueToday.map((s) => (
                      <Box key={s.studentId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.8, borderBottom: '1px solid #f1f5f9' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            {s.studentName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Room {s.roomNumber} ({s.bedId}) • Due Today ({s.nextPaymentDueDate})
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626' }}>
                            ₹{s.monthlyRent?.toLocaleString('en-IN')}
                          </Typography>
                          <Tooltip title="Send WhatsApp">
                            <IconButton size="small" sx={{ color: '#16a34a' }} onClick={() => handleQuickWhatsApp(s)}>
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                </Grid>
              )}

              {/* 1-3 day list (Urgent) */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #fde68a' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#b45309', display: 'block', mb: 1 }}>
                    🟡 Due in 1 to 3 Days (Urgent) ({adminAlert?.studentsDueIn3Days?.length || 0})
                  </Typography>
                  {(!adminAlert?.studentsDueIn3Days || adminAlert.studentsDueIn3Days.length === 0) ? (
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      No residents due in next 3 days
                    </Typography>
                  ) : (
                    adminAlert.studentsDueIn3Days.map((s) => (
                      <Box key={s.studentId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.8, borderBottom: '1px solid #f1f5f9' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            {s.studentName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Room {s.roomNumber} ({s.bedId}) • Due: {s.nextPaymentDueDate}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#b45309' }}>
                            ₹{s.monthlyRent?.toLocaleString('en-IN')}
                          </Typography>
                          <Tooltip title="Send WhatsApp">
                            <IconButton size="small" sx={{ color: '#16a34a' }} onClick={() => handleQuickWhatsApp(s)}>
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))
                  )}
                </Paper>
              </Grid>

              {/* 4-5 day list (Upcoming) */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#166534', display: 'block', mb: 1 }}>
                    🟢 Due in 4 to 5 Days (Upcoming) ({adminAlert?.studentsDueIn5Days?.length || 0})
                  </Typography>
                  {(!adminAlert?.studentsDueIn5Days || adminAlert.studentsDueIn5Days.length === 0) ? (
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      No residents due in 4-5 days
                    </Typography>
                  ) : (
                    adminAlert.studentsDueIn5Days.map((s) => (
                      <Box key={s.studentId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.8, borderBottom: '1px solid #f1f5f9' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            {s.studentName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Room {s.roomNumber} ({s.bedId}) • Due: {s.nextPaymentDueDate}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#166534' }}>
                            ₹{s.monthlyRent?.toLocaleString('en-IN')}
                          </Typography>
                          <Tooltip title="Send WhatsApp">
                            <IconButton size="small" sx={{ color: '#16a34a' }} onClick={() => handleQuickWhatsApp(s)}>
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* Summary KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={4}>
          <Card
            className="pro-card"
            sx={{
              borderTop: '4px solid #ef4444',
              cursor: 'pointer',
              bgcolor: tabIndex === 0 ? '#fef2f2' : '#ffffff',
            }}
            onClick={() => setTabIndex(0)}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  OVERDUE RENTS
                </Typography>
                <ErrorOutlineIcon sx={{ color: '#ef4444' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#dc2626' }}>
                {overdueList.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700 }}>
                ₹{totalOverdueAmount.toLocaleString('en-IN')} pending collection
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            className="pro-card"
            sx={{
              borderTop: '4px solid #f59e0b',
              cursor: 'pointer',
              bgcolor: tabIndex === 1 ? '#fffbeb' : '#ffffff',
            }}
            onClick={() => setTabIndex(1)}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  DUE TODAY
                </Typography>
                <TodayIcon sx={{ color: '#f59e0b' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#d97706' }}>
                {dueTodayList.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 700 }}>
                ₹{totalDueTodayAmount.toLocaleString('en-IN')} due today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            className="pro-card"
            sx={{
              borderTop: '4px solid #3b82f6',
              cursor: 'pointer',
              bgcolor: tabIndex === 2 ? '#eff6ff' : '#ffffff',
            }}
            onClick={() => setTabIndex(2)}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  DUE IN NEXT 7 DAYS
                </Typography>
                <ScheduleIcon sx={{ color: '#3b82f6' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#2563eb' }}>
                {dueSoonList.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700 }}>
                ₹{totalDueSoonAmount.toLocaleString('en-IN')} upcoming
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_e, v) => setTabIndex(v)}>
          <Tab
            label={`Overdue (${overdueList.length})`}
            sx={{ fontWeight: 700, color: overdueList.length > 0 ? '#ef4444 !important' : 'inherit' }}
          />
          <Tab label={`Due Today (${dueTodayList.length})`} sx={{ fontWeight: 600 }} />
          <Tab label={`Due Soon in 7 Days (${dueSoonList.length})`} sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* Table */}
      <Paper className="pro-card" sx={{ overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : currentList.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#f0fdf4',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 32, color: '#10b981' }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#334155', fontWeight: 800 }}>
              No payments in this category
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1, maxWidth: 420, mx: 'auto' }}>
              All residents in this category are fully up to date on their rent payments.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Student ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Resident Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Mobile Number</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Room & Bed</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Monthly Rent</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Payment Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Status / Delay</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Today's Reminders</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentList.map((item) => {
                  const initial = item.studentName ? item.studentName.charAt(0).toUpperCase() : 'S';

                  const studentRemindersToday = todayReminders.filter((r) => r.studentId === item.studentId);
                  const morningSent = studentRemindersToday.some((r) => r.reminderSlot === 'MORNING');
                  const eveningSent = studentRemindersToday.some((r) => r.reminderSlot === 'EVENING');
                  const nightSent = studentRemindersToday.some((r) => r.reminderSlot === 'NIGHT');
                  const manualSent = studentRemindersToday.some((r) => r.reminderSlot === 'MANUAL');
                  const anySentToday = morningSent || eveningSent || nightSent || manualSent;

                  return (
                    <TableRow key={item.studentId} hover sx={{ '&:hover': { bgcolor: '#fcfdfd' } }}>
                      <TableCell sx={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                        {item.studentId}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              bgcolor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                            }}
                          >
                            {initial}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {item.studentName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>{item.mobileNumber}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                          <Chip label={`Room ${item.roomNumber}`} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600, fontSize: '0.75rem' }} />
                          <Chip label={item.bedId} size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.75rem' }} />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                        ₹{item.monthlyRent?.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: item.overdue ? '#dc2626' : '#334155' }}>
                        {item.nextPaymentDueDate}
                      </TableCell>
                      <TableCell>
                        {item.overdue ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StatusChip status="OVERDUE" />
                            <Chip
                              label={`${item.daysOverdue}d late`}
                              size="small"
                              sx={{
                                bgcolor: '#fee2e2',
                                color: '#b91c1c',
                                fontWeight: 800,
                                fontSize: '0.68rem',
                                height: 20,
                              }}
                            />
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StatusChip status={item.dueCategory} />
                            {item.daysUntilDue !== undefined && item.daysUntilDue > 0 && (
                              <Chip
                                label={`in ${item.daysUntilDue}d`}
                                size="small"
                                sx={{
                                  bgcolor: item.daysUntilDue <= 3 ? '#fef3c7' : '#dcfce7',
                                  color: item.daysUntilDue <= 3 ? '#b45309' : '#15803d',
                                  fontWeight: 800,
                                  fontSize: '0.68rem',
                                  height: 20,
                                }}
                              />
                            )}
                          </Box>
                        )}
                      </TableCell>

                      {/* Reminder Status Column */}
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {morningSent && (
                            <Chip
                              icon={<WbSunnyIcon sx={{ fontSize: '14px !important', color: '#d97706' }} />}
                              label="Morning"
                              size="small"
                              sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                            />
                          )}
                          {eveningSent && (
                            <Chip
                              icon={<NightsStayIcon sx={{ fontSize: '14px !important', color: '#4338ca' }} />}
                              label="Evening"
                              size="small"
                              sx={{ bgcolor: '#e0e7ff', color: '#3730a3', fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                            />
                          )}
                          {nightSent && (
                            <Chip
                              icon={<DarkModeIcon sx={{ fontSize: '14px !important', color: '#4c1d95' }} />}
                              label="Night"
                              size="small"
                              sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                            />
                          )}
                          {manualSent && !morningSent && !eveningSent && !nightSent && (
                            <Chip
                              label="WhatsApp Sent"
                              size="small"
                              sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                            />
                          )}
                          {!anySentToday && (
                            <Chip
                              label="Pending"
                              size="small"
                              sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '0.68rem', height: 22 }}
                            />
                          )}
                        </Box>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                          {/* Quick 1-click WhatsApp */}
                          <Tooltip title="Instant WhatsApp Reminder">
                            <IconButton
                              size="small"
                              onClick={() => handleQuickWhatsApp(item)}
                              sx={{
                                bgcolor: '#ecfdf5',
                                color: '#059669',
                                '&:hover': { bgcolor: '#25D366', color: '#ffffff' },
                              }}
                            >
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Full Reminder Modal */}
                          <Tooltip title={anySentToday ? 'Resend custom fee reminder' : 'Preview & send custom reminder'}>
                            <Button
                              variant={anySentToday ? 'contained' : 'outlined'}
                              size="small"
                              color={anySentToday ? 'inherit' : 'primary'}
                              startIcon={anySentToday ? <ReplayIcon fontSize="small" /> : <NotificationsActiveIcon fontSize="small" />}
                              onClick={() => handleOpenReminderModal(item)}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                py: 0.3,
                                px: 1,
                                textTransform: 'none',
                                ...(anySentToday
                                  ? { bgcolor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', '&:hover': { bgcolor: '#e2e8f0' } }
                                  : {}),
                              }}
                            >
                              {anySentToday ? 'Resend' : 'Remind'}
                            </Button>
                          </Tooltip>

                          {/* Record Payment */}
                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            startIcon={<PaymentIcon fontSize="small" />}
                            onClick={() => navigate(`/payments?studentId=${item.studentId}&action=pay`)}
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              py: 0.4,
                              textTransform: 'none',
                            }}
                          >
                            Pay
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Payment Reminder Modal */}
      <PaymentReminderModal
        open={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        dueItem={selectedDueItem}
        onReminderLogged={loadReminders}
      />

      {/* Skipped Reminders / Force Resend Confirmation Dialog */}
      <Dialog
        open={skipPrompt.open}
        onClose={() => setSkipPrompt((prev) => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              bgcolor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <WarningAmberIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {skipPrompt.skippedCount} Reminders Skipped (Already Sent Today)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Duplicate protection: All {skipPrompt.skippedCount} eligible residents already received an {skipPrompt.slot} reminder today
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 1.5 }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Duplicate protection notice: To prevent spamming residents, the system remembers students who already had reminders recorded for this slot today.
          </Alert>
          <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
            You can <strong>Open the WhatsApp Dispatcher</strong> directly to message all <b>{skipPrompt.skippedCount} residents</b> on WhatsApp now, or <strong>Reset & Force Resend</strong> to refresh the log.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => setSkipPrompt((prev) => ({ ...prev, open: false }))}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
            onClick={async () => {
              const currentSlot = skipPrompt.slot;
              setSkipPrompt((prev) => ({ ...prev, open: false }));
              if (!batchModalReminders || batchModalReminders.length === 0) {
                await handleTriggerBatch(currentSlot, true);
              } else {
                setBatchModalOpen(true);
              }
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              bgcolor: '#059669',
              '&:hover': { bgcolor: '#047857' },
            }}
          >
            Open WhatsApp Dispatcher ({skipPrompt.skippedCount} Residents)
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<ReplayIcon />}
            disabled={isBatchRunning}
            onClick={async () => {
              const currentSlot = skipPrompt.slot;
              setSkipPrompt((prev) => ({ ...prev, open: false }));
              await handleTriggerBatch(currentSlot, true);
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Reset Lock & Force Resend
          </Button>
        </DialogActions>
      </Dialog>

      {/* WhatsApp Batch Dispatcher Modal */}
      <WhatsAppBatchModal
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        slot={batchModalSlot}
        reminders={batchModalReminders}
        onRefresh={() => {
          loadReminders();
          handleTriggerBatch(batchModalSlot as any, true);
        }}
      />
    </Box>
  );
};

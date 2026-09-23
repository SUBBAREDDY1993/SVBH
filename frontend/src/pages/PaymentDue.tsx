import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
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
import { paymentService } from '../services/paymentService';
import { reminderService } from '../services/reminderService';
import { PaymentDue as PaymentDueType, PaymentReminder } from '../types';
import { StatusChip } from '../components/StatusChip';
import { PaymentReminderModal } from '../components/PaymentReminderModal';
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

  useEffect(() => {
    loadDues();
    loadReminders();
  }, []);

  const handleTriggerBatch = async (slot: 'MORNING' | 'EVENING') => {
    try {
      setIsBatchRunning(true);
      const res = await reminderService.triggerBatch(slot, false);
      showSuccess(res.message || `Processed ${slot} fee payment reminders`);
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
    const rentStr = item.monthlyRent?.toLocaleString('en-IN') || '0';

    let statusLine = '';
    if (isOverdue) {
      statusLine = `your monthly hostel rent is *${daysOverdue} days OVERDUE* (Due date: ${dueDateStr})`;
    } else if (daysOverdue === 0 && item.dueCategory === 'DUE_TODAY') {
      statusLine = `your monthly hostel rent is *DUE TODAY* (${dueDateStr})`;
    } else {
      statusLine = `your monthly hostel rent of ₹${rentStr} is *due soon on ${dueDateStr}*`;
    }

    const message =
      `📢 *Sri Venkateswara Boys Hostel - Fee Reminder*\n\n` +
      `Hello ${item.studentName},\n\n` +
      `This is a friendly reminder that ${statusLine}.\n\n` +
      `🏠 *Room & Bed:* Room ${item.roomNumber} (Bed ${item.bedId})\n` +
      `💰 *Amount Due:* ₹${rentStr}\n` +
      `📅 *Due Date:* ${dueDateStr}\n\n` +
      `💳 *Payment Options:*\n` +
      `Please pay via UPI or Cash at the hostel office. Kindly share the transaction screenshot to collect your receipt.\n\n` +
      `_If already paid, kindly ignore this notice._\n\n` +
      `Thank you,\n*Sri Venkateswara Boys Hostel Management*\n` +
      `📍 Opp. SV University Main Gate, Tirupati, Andhra Pradesh - 517502\n` +
      `📞 Phone: +91 98765 43210 | ✉️ svboyshostel.tirupati@gmail.com`;

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
                label="3 Days Prior • Morning (9 AM) & Evening (6 PM)"
                size="small"
                sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.72rem' }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#15803d', mt: 0.3 }}>
              The system automatically scans and logs fee reminders 3 days before payment due dates, daily in the morning and evening.
            </Typography>
            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600, display: 'block', mt: 0.3 }}>
              📊 {todayReminders.length} reminder(s) logged today
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            color="success"
            startIcon={<WbSunnyIcon />}
            disabled={isBatchRunning}
            onClick={() => handleTriggerBatch('MORNING')}
            sx={{ fontWeight: 700, bgcolor: '#ffffff', textTransform: 'none' }}
          >
            Run Morning Batch (9 AM)
          </Button>
          <Button
            variant="contained"
            size="small"
            color="success"
            startIcon={<NightsStayIcon />}
            disabled={isBatchRunning}
            onClick={() => handleTriggerBatch('EVENING')}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Run Evening Batch (6 PM)
          </Button>
        </Box>
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
                  DUE NEXT 3 TO 7 DAYS
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
                  const manualSent = studentRemindersToday.some((r) => r.reminderSlot === 'MANUAL');

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
                          <StatusChip status={item.dueCategory} />
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
                          {manualSent && !morningSent && !eveningSent && (
                            <Chip
                              label="WhatsApp Sent"
                              size="small"
                              sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                            />
                          )}
                          {!morningSent && !eveningSent && !manualSent && (
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
                          <Tooltip title="Preview & Send Custom Reminder">
                            <Button
                              variant="outlined"
                              size="small"
                              color="primary"
                              startIcon={<NotificationsActiveIcon fontSize="small" />}
                              onClick={() => handleOpenReminderModal(item)}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                py: 0.3,
                                px: 1,
                                textTransform: 'none',
                              }}
                            >
                              Remind
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
    </Box>
  );
};

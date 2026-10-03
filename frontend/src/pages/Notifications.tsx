import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import Chip from '@mui/material/Chip';
import { dashboardService } from '../services/dashboardService';
import { reminderService } from '../services/reminderService';
import { AdminDueAlert, DashboardStats, FeeReminder } from '../types';
import { useNotification } from '../context/NotificationContext';

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [adminAlert, setAdminAlert] = useState<AdminDueAlert | null>(null);
  const [feeReminders, setFeeReminders] = useState<FeeReminder[]>([]);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const [statsData, alertData, remData] = await Promise.all([
        dashboardService.getStats(),
        reminderService.getAdminDueAlert().catch(() => null),
        reminderService.getActiveReminders().catch(() => []),
      ]);
      setStats(statsData);
      setAdminAlert(alertData);
      setFeeReminders(remData);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const handleRefresh = () => fetchAll();
    window.addEventListener('svbh-refresh-data', handleRefresh);
    return () => window.removeEventListener('svbh-refresh-data', handleRefresh);
  }, []);

  const handleOpenWhatsAppAlert = async () => {
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
      console.warn('Could not load whatsapp URL:', e);
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

  const handleSendEmailAlert = async () => {
    try {
      setIsSendingAlert(true);
      const res = await reminderService.sendAdminDueAlert(true);
      showSuccess(`Management fee alert sent to ${res.recipientEmail || 'svbhostel2026@gmail.com'}`);
      setAdminAlert(res);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to dispatch management alert');
    } finally {
      setIsSendingAlert(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) return null;

  return (
    <Box sx={{ pb: 4, maxWidth: 850 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Alerts & Operational Notifications
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Real-time notices on fee dues, departures, and bed availability
        </Typography>
      </Box>

      {/* Management 5-Day & 3-Day Payment Due Alert Card */}
      <Card sx={{ mb: 3, borderRadius: 3, borderLeft: '6px solid #2563eb', bgcolor: '#f8fafc', border: '1px solid #cbd5e1' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
                }}
              >
                <MarkEmailReadIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Management Payment Due Alerts (5-Day & 3-Day Prior)
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
                <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                  Automated daily digest tracking residents with fees due in 1-3 days ({adminAlert?.dueIn3DaysCount || 0} residents) and 4-5 days ({adminAlert?.dueIn5DaysCount || 0} residents){adminAlert?.dueTodayCount !== undefined && adminAlert.dueTodayCount > 0 ? `, plus ${adminAlert.dueTodayCount} due today` : ''}. Total expected: <strong>₹{(adminAlert?.totalAmountDue || 0).toLocaleString('en-IN')}</strong>.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<WhatsAppIcon sx={{ color: '#16a34a' }} />}
                onClick={handleOpenWhatsAppAlert}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: '#22c55e',
                  color: '#15803d',
                  bgcolor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  '&:hover': { bgcolor: '#f0fdf4', borderColor: '#16a34a' },
                }}
              >
                WhatsApp (8985010694)
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<EmailIcon />}
                disabled={isSendingAlert}
                onClick={handleSendEmailAlert}
                sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
              >
                {isSendingAlert ? 'Sending...' : 'Send Email'}
              </Button>
              <Button
                variant="text"
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/payments/due')}
                sx={{ textTransform: 'none', fontWeight: 700, color: '#475569' }}
              >
                View Due List
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Individual Resident Fee Reminders (Requirements 1, 2, 3, 5, 9, 10) */}
      <Card sx={{ mb: 3, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Active Student Fee Reminders ({feeReminders.length})
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Automated student fee due notices, countdowns, and direct WhatsApp reminders
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/payments/due')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Open Due Matrix
            </Button>
          </Box>

          {feeReminders.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>🎉</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                No pending fee reminders 🎉
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                All student rent dues are settled for the current billing cycle!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {feeReminders.map((rem) => {
                const isOverdue = rem.daysRemaining < 0;
                const isToday = rem.daysRemaining === 0;
                const isTomorrow = rem.daysRemaining === 1;

                const borderColor = isOverdue ? '#ef4444' : isToday ? '#f59e0b' : isTomorrow ? '#f97316' : '#3b82f6';
                const bgTint = isOverdue ? '#fef2f2' : isToday ? '#fffbeb' : '#f8fafc';

                return (
                  <Paper
                    key={rem.studentId}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      borderLeft: `5px solid ${borderColor}`,
                      border: '1px solid #e2e8f0',
                      bgcolor: bgTint,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 800, color: '#0f172a', cursor: 'pointer' }}
                          onClick={() => navigate(`/students/${rem.studentId}`)}
                        >
                          {rem.studentName}
                        </Typography>
                        <Chip
                          label={`Room ${rem.roomNumber} • Bed ${rem.bedNumber || rem.bedId}`}
                          size="small"
                          sx={{ bgcolor: '#e2e8f0', color: '#334155', fontWeight: 600, fontSize: '0.75rem' }}
                        />
                        <Chip
                          label={rem.paymentStatus === 'HALF_PAID' ? 'Half Paid' : 'Pending'}
                          size="small"
                          color={rem.paymentStatus === 'HALF_PAID' ? 'warning' : 'default'}
                          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
                        Fee: <strong>₹{rem.feeAmount?.toLocaleString('en-IN')}</strong> • Due Date: <strong>{rem.dueDateFormatted || rem.dueDate}</strong>
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: isOverdue ? '#dc2626' : isToday ? '#d97706' : '#2563eb',
                          display: 'block',
                          mt: 0.25,
                        }}
                      >
                        ⚠ {isOverdue
                          ? `Payment overdue by ${Math.abs(rem.daysRemaining)} day${Math.abs(rem.daysRemaining) === 1 ? '' : 's'}`
                          : isToday
                          ? 'Payment due today'
                          : isTomorrow
                          ? 'Payment due tomorrow'
                          : `Payment due in ${rem.daysRemaining} days`}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {rem.whatsappUrl && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<WhatsAppIcon sx={{ color: '#16a34a' }} />}
                          onClick={() => window.open(rem.whatsappUrl, '_blank')}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderColor: '#22c55e',
                            color: '#15803d',
                            bgcolor: '#ffffff',
                            '&:hover': { bgcolor: '#f0fdf4', borderColor: '#16a34a' },
                          }}
                        >
                          WhatsApp
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate('/payments')}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Collect Fee
                      </Button>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Overdue Payments Alert Card */}
      {stats.overduePaymentsCount > 0 && (
        <Card sx={{ mb: 2.5, borderRadius: 3, borderLeft: '6px solid #ef4444', bgcolor: '#fef2f2' }}>
          <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <WarningAmberIcon sx={{ color: '#dc2626', fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#991b1b' }}>
                  {stats.overduePaymentsCount} Student(s) with Overdue Rent
                </Typography>
                <Typography variant="body2" sx={{ color: '#7f1d1d' }}>
                  Total pending collection: <strong>₹{stats.totalPendingAmount?.toLocaleString('en-IN')}</strong>. Immediate action recommended.
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="error"
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/payments/due')}
            >
              Review Overdues
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Due Soon Alert Card */}
      {stats.paymentsDueSoonCount > 0 && (
        <Card sx={{ mb: 2.5, borderRadius: 3, borderLeft: '6px solid #f59e0b', bgcolor: '#fffbeb' }}>
          <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <ScheduleIcon sx={{ color: '#d97706', fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#92400e' }}>
                  {stats.paymentsDueSoonCount} Payment(s) Due Within Next 7 Days
                </Typography>
                <Typography variant="body2" sx={{ color: '#78350f' }}>
                  Billing reminders can be communicated to residents.
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="warning"
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/payments/due')}
            >
              View Upcoming
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Students Leaving Soon Card */}
      {stats.studentsLeavingSoonCount > 0 && (
        <Card sx={{ mb: 2.5, borderRadius: 3, borderLeft: '6px solid #6366f1', bgcolor: '#eef2ff' }}>
          <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <ExitToAppIcon sx={{ color: '#4f46e5', fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#3730a3' }}>
                  {stats.studentsLeavingSoonCount} Resident(s) in Notice Period
                </Typography>
                <Typography variant="body2" sx={{ color: '#312e81' }}>
                  Expected to vacate within the next two weeks. Prepare security deposit refunds.
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/students?status=NOTICE_PERIOD')}
              sx={{ bgcolor: '#4f46e5' }}
            >
              View Notice Residents
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bed Vacancy Status Card */}
      <Card sx={{ mb: 2.5, borderRadius: 3, borderLeft: '6px solid #10b981', bgcolor: '#f0fdf4' }}>
        <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <CheckCircleIcon sx={{ color: '#059669', fontSize: 32 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#166534' }}>
                {stats.availableBeds} Bed(s) Available for Allocation
              </Typography>
              <Typography variant="body2" sx={{ color: '#14532d' }}>
                Current occupancy is at <strong>{stats.occupancyPercentage}%</strong> ({stats.occupiedBeds} / {stats.totalBeds} beds).
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            color="success"
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/rooms')}
          >
            Check Bed Matrix
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

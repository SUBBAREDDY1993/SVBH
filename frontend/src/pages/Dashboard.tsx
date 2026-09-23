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
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
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
    <Box sx={{ pb: 4 }}>
      {/* Welcome Banner */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Sri Venkateswara Boys Hostel Management & Operation Metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/students/new')}
            sx={{ bgcolor: '#2563eb' }}
          >
            + New Admission
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/payments')}
            sx={{ borderColor: '#cbd5e1', color: '#334155' }}
          >
            Record Payment
          </Button>
        </Box>
      </Box>

      {/* Alerts section */}
      {stats.alerts && stats.alerts.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {stats.alerts.map((alert, idx) => (
            <Alert
              key={idx}
              severity={idx === 0 && stats.overduePaymentsCount > 0 ? 'error' : 'warning'}
              sx={{ borderRadius: 2, fontWeight: 500 }}
            >
              {alert}
            </Alert>
          ))}
        </Box>
      )}

      {/* 8 Primary Cards: Top 4 Beds, Bottom 4 Financial/Students */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Total Beds */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            className="pro-card"
            sx={{
              p: 2.5,
              position: 'relative',
              overflow: 'hidden',
              borderTop: '4px solid #1e3a8a',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
                  TOTAL CAPACITY
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, my: 0.75, color: '#0f172a' }}>
                  {stats.totalBeds}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Configured across 16 rooms
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1e3a8a',
                }}
              >
                <HotelIcon sx={{ fontSize: 24 }} />
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Occupied Beds */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            className="pro-card"
            sx={{
              p: 2.5,
              position: 'relative',
              overflow: 'hidden',
              borderTop: '4px solid #ef4444',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700, letterSpacing: '0.04em' }}>
                  OCCUPIED BEDS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, my: 0.75, color: '#dc2626' }}>
                  {stats.occupiedBeds}
                </Typography>
                <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>
                  {stats.occupancyPercentage}% current occupancy
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                }}
              >
                <DoNotDisturbAltIcon sx={{ fontSize: 24 }} />
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Available Beds */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            className="pro-card"
            sx={{
              p: 2.5,
              position: 'relative',
              overflow: 'hidden',
              borderTop: '4px solid #10b981',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700, letterSpacing: '0.04em' }}>
                  AVAILABLE BEDS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, my: 0.75, color: '#059669' }}>
                  {stats.availableBeds}
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                  Ready for admission
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 24 }} />
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Reserved Beds */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            className="pro-card"
            sx={{
              p: 2.5,
              position: 'relative',
              overflow: 'hidden',
              borderTop: '4px solid #f59e0b',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 700, letterSpacing: '0.04em' }}>
                  RESERVED BEDS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, my: 0.75, color: '#d97706' }}>
                  {stats.reservedBeds}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Advance hold bookings
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: '#fffbeb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}
              >
                <BookmarkIcon sx={{ fontSize: 24 }} />
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Total Students */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            className="pro-card"
            sx={{
              p: 2.5,
              position: 'relative',
              overflow: 'hidden',
              borderTop: '4px solid #3b82f6',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.04em' }}>
                  ACTIVE RESIDENTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, my: 0.75, color: '#1e40af' }}>
                  {stats.totalStudents}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {stats.activeStudents} Active • {stats.noticePeriodStudents} Notice
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                }}
              >
                <PeopleAltIcon sx={{ fontSize: 24 }} />
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Pending Payments */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            className="pro-card"
            sx={{
              p: 2.5,
              position: 'relative',
              overflow: 'hidden',
              borderTop: '4px solid #dc2626',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700, letterSpacing: '0.04em' }}>
                  PENDING DUES
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, my: 0.75, color: '#dc2626' }}>
                  ₹{stats.totalPendingAmount?.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600 }}>
                  {stats.overduePaymentsCount} resident(s) overdue
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                }}
              >
                <AccountBalanceWalletIcon sx={{ fontSize: 24 }} />
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Due Soon */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            className="pro-card"
            sx={{
              p: 2.5,
              position: 'relative',
              overflow: 'hidden',
              borderTop: '4px solid #f59e0b',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 700, letterSpacing: '0.04em' }}>
                  DUE WITHIN 7 DAYS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, my: 0.75, color: '#b45309' }}>
                  {stats.paymentsDueSoonCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Upcoming billing dates
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: '#fffbeb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}
              >
                <NotificationImportantIcon sx={{ fontSize: 24 }} />
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Students Leaving Soon */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            className="pro-card"
            sx={{
              p: 2.5,
              position: 'relative',
              overflow: 'hidden',
              borderTop: '4px solid #6366f1',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#4338ca', fontWeight: 700, letterSpacing: '0.04em' }}>
                  DEPARTURES SOON
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, my: 0.75, color: '#4338ca' }}>
                  {stats.studentsLeavingSoonCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Notice period active
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: '#eef2ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6366f1',
                }}
              >
                <ExitToAppIcon sx={{ fontSize: 24 }} />
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Occupancy Progress Bar Section */}
      <Card className="pro-card" sx={{ mb: 3.5, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Hostel Capacity & Occupancy Rate
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
              {stats.occupiedBeds} out of {stats.totalBeds} beds occupied ({stats.availableBeds} beds available for immediate booking)
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: stats.occupancyPercentage > 85 ? '#dc2626' : '#2563eb' }}>
              {stats.occupancyPercentage}%
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>Total utilization</Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(stats.occupancyPercentage, 100)}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: '#e2e8f0',
            '& .MuiLinearProgress-bar': {
              bgcolor: stats.occupancyPercentage > 85 ? '#ef4444' : stats.occupancyPercentage > 50 ? '#3b82f6' : '#10b981',
              borderRadius: 5,
            },
          }}
        />
      </Card>

      {/* Dual Table Section: Upcoming Dues & Recent Admissions */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        {/* Upcoming Dues / Overdue */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%', border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Upcoming & Overdue Rent Dues
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Fees requiring immediate attention
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/payments/due')}
                sx={{ fontWeight: 700 }}
              >
                View All
              </Button>
            </Box>

            {stats.upcomingDues && stats.upcomingDues.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Resident</TableCell>
                      <TableCell>Room / Bed</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Rent Amount</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.upcomingDues.slice(0, 5).map((due) => (
                      <TableRow key={due.studentId} hover>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem', bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 800 }}>
                              {due.studentName?.charAt(0) || 'R'}
                            </Avatar>
                            {due.studentName}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={`Room ${due.roomNumber}`} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                          <Chip label={due.bedId} size="small" sx={{ bgcolor: '#f1f5f9' }} />
                        </TableCell>
                        <TableCell>{due.nextPaymentDueDate}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#dc2626' }}>
                          ₹{due.monthlyRent?.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right">
                          <StatusChip status={due.dueCategory} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 36, color: '#10b981', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                  All rents are currently settled
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  No pending or overdue payments recorded in the system.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Admissions */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%', border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Recent Student Admissions
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Latest resident registrations
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/students')}
                sx={{ fontWeight: 700 }}
              >
                View All
              </Button>
            </Box>

            {stats.recentAdmissions && stats.recentAdmissions.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>Allocation</TableCell>
                      <TableCell>Joining Date</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.recentAdmissions.slice(0, 5).map((student) => (
                      <TableRow
                        key={student.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/students/${student.studentId}`)}
                      >
                        <TableCell sx={{ fontWeight: 700 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem', bgcolor: '#ecfdf5', color: '#047857', fontWeight: 800 }}>
                              {student.fullName?.charAt(0) || 'S'}
                            </Avatar>
                            {student.fullName}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#1e3a8a' }}>
                          {student.studentId}
                        </TableCell>
                        <TableCell>
                          Room {student.roomNumber} ({student.bedId})
                        </TableCell>
                        <TableCell>{student.joiningDate}</TableCell>
                        <TableCell align="right">
                          <StatusChip status={student.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <PeopleAltIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                  No residents admitted yet
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
                  Database is clean and ready for new admissions.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/students/new')}
                  sx={{ fontWeight: 700 }}
                >
                  Admit First Resident
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Payments Section */}
      <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Recent Payment Transactions
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Confirmed fee collection receipts
            </Typography>
          </Box>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/payments')}
            sx={{ fontWeight: 700 }}
          >
            View All Payments
          </Button>
        </Box>

        {stats.recentPayments && stats.recentPayments.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Receipt No</TableCell>
                  <TableCell>Resident</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Payment Mode</TableCell>
                  <TableCell>Fee Category</TableCell>
                  <TableCell align="right">Receipt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.recentPayments.slice(0, 5).map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#1e3a8a' }}>
                      {payment.receiptNumber}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{payment.studentName}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                      ₹{payment.amount?.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>{payment.paymentDate}</TableCell>
                    <TableCell>
                      <Chip label={payment.paymentMethod} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{payment.paymentType?.replace('_', ' ')}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReceiptIcon />}
                        onClick={() => openReceipt(payment)}
                        sx={{ fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <ReceiptIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
              No payments recorded yet
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Transactions will appear here once resident rents or security deposits are collected.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Receipt Modal */}
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        payment={selectedPayment}
      />
    </Box>
  );
};

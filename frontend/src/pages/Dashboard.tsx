import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
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
          <Card sx={{ bgcolor: '#ffffff', borderLeft: '4px solid #1e3a8a' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Total Beds
                </Typography>
                <HotelIcon sx={{ color: '#1e3a8a' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#0f172a' }}>
                {stats.totalBeds}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Configured hostel capacity
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Occupied Beds */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderLeft: '4px solid #ef4444' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Occupied Beds
                </Typography>
                <DoNotDisturbAltIcon sx={{ color: '#ef4444' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#dc2626' }}>
                {stats.occupiedBeds}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {stats.occupancyPercentage}% current occupancy
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Beds */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderLeft: '4px solid #10b981' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Available Beds
                </Typography>
                <CheckCircleIcon sx={{ color: '#10b981' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#059669' }}>
                {stats.availableBeds}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                Ready for immediate allocation
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Reserved Beds */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderLeft: '4px solid #f59e0b' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Reserved Beds
                </Typography>
                <BookmarkIcon sx={{ color: '#f59e0b' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#d97706' }}>
                {stats.reservedBeds}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Advance reservation bookings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Students */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderLeft: '4px solid #3b82f6' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Total Students
                </Typography>
                <PeopleAltIcon sx={{ color: '#3b82f6' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#1e40af' }}>
                {stats.totalStudents}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {stats.activeStudents} Active | {stats.noticePeriodStudents} Notice
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Payments */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderLeft: '4px solid #dc2626' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Pending Payments
                </Typography>
                <AccountBalanceWalletIcon sx={{ color: '#dc2626' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#dc2626' }}>
                ₹{stats.totalPendingAmount?.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600 }}>
                {stats.overduePaymentsCount} students overdue
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Due Soon */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderLeft: '4px solid #f59e0b' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Payments Due Soon
                </Typography>
                <NotificationImportantIcon sx={{ color: '#f59e0b' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#b45309' }}>
                {stats.paymentsDueSoonCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Due in the next 7 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Students Leaving Soon */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderLeft: '4px solid #6366f1' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Students Leaving Soon
                </Typography>
                <ExitToAppIcon sx={{ color: '#6366f1' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#4338ca' }}>
                {stats.studentsLeavingSoonCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Notice period active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Occupancy Progress Bar Section */}
      <Card sx={{ mb: 3.5 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Hostel Capacity & Occupancy Rate
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {stats.occupiedBeds} out of {stats.totalBeds} beds occupied ({stats.availableBeds} beds free)
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#2563eb' }}>
              {stats.occupancyPercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(stats.occupancyPercentage, 100)}
            sx={{
              height: 12,
              borderRadius: 6,
              bgcolor: '#e2e8f0',
              '& .MuiLinearProgress-bar': {
                bgcolor: stats.occupancyPercentage > 85 ? '#ef4444' : '#2563eb',
                borderRadius: 6,
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Dual Table Section: Upcoming Dues & Recent Admissions */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        {/* Upcoming Dues / Overdue */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Upcoming & Overdue Rent Dues
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/payments/due')}
              >
                View All
              </Button>
            </Box>

            {stats.upcomingDues && stats.upcomingDues.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Room/Bed</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.upcomingDues.slice(0, 5).map((due) => (
                      <TableRow key={due.studentId} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{due.studentName}</TableCell>
                        <TableCell>Room {due.roomNumber} ({due.bedId})</TableCell>
                        <TableCell>{due.nextPaymentDueDate}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>₹{due.monthlyRent?.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">
                          <StatusChip status={due.dueCategory} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" sx={{ color: '#64748b', py: 3, textAlign: 'center' }}>
                No pending or overdue payments at this time.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Admissions */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Recent Student Admissions
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/students')}
              >
                View All
              </Button>
            </Box>

            {stats.recentAdmissions && stats.recentAdmissions.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Room</TableCell>
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
                        <TableCell sx={{ fontWeight: 600, color: '#1e3a8a' }}>
                          {student.studentId}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{student.fullName}</TableCell>
                        <TableCell>Room {student.roomNumber} ({student.bedId})</TableCell>
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
              <Typography variant="body2" sx={{ color: '#64748b', py: 3, textAlign: 'center' }}>
                No admissions recorded yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Payments Section */}
      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Recent Payment Transactions
          </Typography>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/payments')}
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
                  <TableCell>Student</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Receipt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.recentPayments.slice(0, 5).map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                      {payment.receiptNumber}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{payment.studentName}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#10b981' }}>
                      ₹{payment.amount?.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>{payment.paymentDate}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{payment.paymentType?.replace('_', ' ')}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<ReceiptIcon />}
                        onClick={() => openReceipt(payment)}
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
          <Typography variant="body2" sx={{ color: '#64748b', py: 3, textAlign: 'center' }}>
            No payment records found.
          </Typography>
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

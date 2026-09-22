import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TodayIcon from '@mui/icons-material/Today';
import { paymentService } from '../services/paymentService';
import { PaymentDue as PaymentDueType } from '../types';
import { StatusChip } from '../components/StatusChip';

export const PaymentDue: React.FC = () => {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0); // 0: Overdue, 1: Due Today, 2: Due Soon

  const [overdueList, setOverdueList] = useState<PaymentDueType[]>([]);
  const [dueTodayList, setDueTodayList] = useState<PaymentDueType[]>([]);
  const [dueSoonList, setDueSoonList] = useState<PaymentDueType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    loadDues();
  }, []);

  const totalOverdueAmount = overdueList.reduce((sum, d) => sum + (d.monthlyRent || 0), 0);
  const totalDueTodayAmount = dueTodayList.reduce((sum, d) => sum + (d.monthlyRent || 0), 0);
  const totalDueSoonAmount = dueSoonList.reduce((sum, d) => sum + (d.monthlyRent || 0), 0);

  const currentList =
    tabIndex === 0 ? overdueList : tabIndex === 1 ? dueTodayList : dueSoonList;

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Payment Due Tracking
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Monitor overdue rents, payments due today, and upcoming collections
        </Typography>
      </Box>

      {/* Summary KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              bgcolor: '#ffffff',
              borderRadius: 3,
              borderLeft: '4px solid #ef4444',
              cursor: 'pointer',
              boxShadow: tabIndex === 0 ? '0 4px 12px rgba(239, 68, 68, 0.15)' : 'none',
            }}
            onClick={() => setTabIndex(0)}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  OVERDUE RENTS
                </Typography>
                <ErrorOutlineIcon sx={{ color: '#ef4444' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#dc2626' }}>
                {overdueList.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 700 }}>
                ₹{totalOverdueAmount.toLocaleString('en-IN')} pending collection
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              bgcolor: '#ffffff',
              borderRadius: 3,
              borderLeft: '4px solid #f59e0b',
              cursor: 'pointer',
              boxShadow: tabIndex === 1 ? '0 4px 12px rgba(245, 158, 11, 0.15)' : 'none',
            }}
            onClick={() => setTabIndex(1)}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
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
            sx={{
              bgcolor: '#ffffff',
              borderRadius: 3,
              borderLeft: '4px solid #3b82f6',
              cursor: 'pointer',
              boxShadow: tabIndex === 2 ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none',
            }}
            onClick={() => setTabIndex(2)}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  DUE NEXT 7 DAYS
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
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : currentList.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#475569' }}>
              No payments in this category
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
              All residents in this category have paid their dues on time.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Mobile Number</TableCell>
                  <TableCell>Room & Bed</TableCell>
                  <TableCell>Monthly Rent</TableCell>
                  <TableCell>Payment Due Date</TableCell>
                  <TableCell>Status / Overdue Days</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentList.map((item) => (
                  <TableRow key={item.studentId} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#1e3a8a' }}>{item.studentId}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{item.studentName}</TableCell>
                    <TableCell>{item.mobileNumber}</TableCell>
                    <TableCell>Room {item.roomNumber} ({item.bedId})</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>₹{item.monthlyRent?.toLocaleString('en-IN')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{item.nextPaymentDueDate}</TableCell>
                    <TableCell>
                      {item.overdue ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StatusChip status="OVERDUE" />
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>
                            {item.daysOverdue} days late
                          </span>
                        </Box>
                      ) : (
                        <StatusChip status={item.dueCategory} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        startIcon={<PaymentIcon />}
                        onClick={() => navigate(`/payments?studentId=${item.studentId}&action=pay`)}
                      >
                        Record Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

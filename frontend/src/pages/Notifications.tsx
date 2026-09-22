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
import { dashboardService } from '../services/dashboardService';
import { DashboardStats } from '../types';

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

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

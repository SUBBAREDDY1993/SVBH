import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PaymentIcon from '@mui/icons-material/Payment';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ClearIcon from '@mui/icons-material/Clear';
import { studentService } from '../services/studentService';
import { reportService } from '../services/reportService';
import { Student, StudentStatus } from '../types';
import { StatusChip } from '../components/StatusChip';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'HALF_PAID' | 'PENDING'>('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { isAdmin } = useAuth();

  // Delete Confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const [filteredData, allData] = await Promise.all([
        studentService.getAllStudents(statusFilter || undefined, search || undefined),
        studentService.getAllStudents(),
      ]);
      setStudents(filteredData);
      setAllStudents(allData);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [statusFilter]);

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      setIsDeleting(true);
      await studentService.deleteStudent(studentToDelete.id || studentToDelete.studentId);
      showSuccess(`Resident ${studentToDelete.fullName} has been permanently deleted.`);
      loadStudents();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  const handleExportCsv = () => {
    reportService.downloadStudentsCsv();
  };

  // Payment status calculation helpers
  const getPaymentStatus = (s: Student): 'PAID' | 'HALF_PAID' | 'PENDING' => {
    if (s.status === 'VACATED') return 'PAID';
    if (s.paymentStatus === 'PAID') return 'PAID';
    if (s.paymentStatus === 'HALF_PAID') return 'HALF_PAID';
    if (s.paymentStatus === 'PENDING') return 'PENDING';
    if (s.isOverdue) return 'PENDING';
    if (!s.nextPaymentDueDate) return 'PENDING';
    const today = new Date().toISOString().split('T')[0];
    return s.nextPaymentDueDate <= today ? 'PENDING' : 'PAID';
  };

  const isPending = (s: Student): boolean => getPaymentStatus(s) === 'PENDING';
  const isPaid = (s: Student): boolean => getPaymentStatus(s) === 'PAID';
  const isHalfPaid = (s: Student): boolean => getPaymentStatus(s) === 'HALF_PAID';

  // KPI calculations based on all students
  const totalCount = allStudents.length;
  const activeCount = allStudents.filter((s) => s.status === 'ACTIVE').length;
  const paidCount = allStudents.filter(isPaid).length;
  const halfPaidCount = allStudents.filter(isHalfPaid).length;
  const pendingCount = allStudents.filter(isPending).length;

  // Filter students based on payment status toggle button
  const displayedStudents = students.filter((s) => {
    if (paymentFilter === 'PAID') return isPaid(s);
    if (paymentFilter === 'HALF_PAID') return isHalfPaid(s);
    if (paymentFilter === 'PENDING') return isPending(s);
    return true;
  });

  // Security Confirmation State for Payment Status Changes
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    student: Student;
    newStatus: 'PAID' | 'HALF_PAID' | 'PENDING';
    oldStatus: 'PAID' | 'HALF_PAID' | 'PENDING';
  } | null>(null);

  const initiatePaymentStatusChange = (student: Student, newStatus: 'PAID' | 'HALF_PAID' | 'PENDING') => {
    const currentStatus = getPaymentStatus(student);
    if (currentStatus === newStatus) return;

    if (!isAdmin) {
      showError('Security: Only administrators have permission to alter resident fee payment status.');
      return;
    }

    setPendingStatusChange({
      student,
      newStatus,
      oldStatus: currentStatus,
    });
    setStatusConfirmOpen(true);
  };

  const confirmPaymentStatusChange = async () => {
    if (!pendingStatusChange) return;
    const { student, newStatus } = pendingStatusChange;
    setStatusConfirmOpen(false);
    setUpdatingStudentId(student.studentId);

    // Optimistically update local UI state immediately
    const updater = (list: Student[]) =>
      list.map((s) => {
        if (s.studentId === student.studentId || (s.id && s.id === student.id)) {
          return { ...s, paymentStatus: newStatus };
        }
        return s;
      });

    setStudents(updater);
    setAllStudents(updater);

    try {
      const updated = await studentService.updatePaymentStatus(student.id || student.studentId, newStatus);
      const label = newStatus === 'PAID' ? 'Paid' : newStatus === 'HALF_PAID' ? 'Half Paid' : 'Pending';
      showSuccess(`[Security Verified] Fee status for ${student.fullName} (${student.studentId}) updated to ${label}`);
      if (updated) {
        setStudents((prev) => prev.map((s) => (s.studentId === updated.studentId ? { ...s, ...updated } : s)));
        setAllStudents((prev) => prev.map((s) => (s.studentId === updated.studentId ? { ...s, ...updated } : s)));
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update payment status');
      loadStudents(); // revert on failure
    } finally {
      setUpdatingStudentId(null);
      setPendingStatusChange(null);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
            Student Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Live resident directory, room assignments, payment statuses & records
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCsv}
            sx={{
              borderColor: '#cbd5e1',
              color: '#334155',
              bgcolor: '#ffffff',
              fontWeight: 600,
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
            }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/students/admit')}
            sx={{
              bgcolor: '#2563eb',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            Admit Student
          </Button>
        </Box>
      </Box>

      {/* KPI Metric Cards (Total, Active, Fee Paid, Half Paid, Fee Pending) */}
      <Grid container spacing={2} sx={{ mb: 3.5 }}>
        {/* Total Enrolled */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            className="pro-card"
            onClick={() => {
              setPaymentFilter('ALL');
              setStatusFilter('');
            }}
            sx={{
              cursor: 'pointer',
              borderTop: paymentFilter === 'ALL' && statusFilter === '' ? '4px solid #2563eb' : '4px solid transparent',
              bgcolor: paymentFilter === 'ALL' && statusFilter === '' ? '#f0f7ff' : '#ffffff',
              transition: 'all 0.2s ease',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Total Enrolled
                </Typography>
                <PeopleIcon sx={{ color: '#2563eb', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.8, color: '#0f172a' }}>
                {totalCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                All registered residents
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Residents */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            className="pro-card"
            onClick={() => {
              setStatusFilter('ACTIVE');
              setPaymentFilter('ALL');
            }}
            sx={{
              cursor: 'pointer',
              borderTop: statusFilter === 'ACTIVE' && paymentFilter === 'ALL' ? '4px solid #3b82f6' : '4px solid transparent',
              bgcolor: statusFilter === 'ACTIVE' && paymentFilter === 'ALL' ? '#eff6ff' : '#ffffff',
              transition: 'all 0.2s ease',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Active Residents
                </Typography>
                <PeopleIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.8, color: '#1e40af' }}>
                {activeCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                Currently in hostel beds
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Fee Paid Button Card */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            className="pro-card"
            onClick={() => {
              setPaymentFilter('PAID');
              setPage(0);
            }}
            sx={{
              cursor: 'pointer',
              borderTop: paymentFilter === 'PAID' ? '4px solid #10b981' : '4px solid transparent',
              bgcolor: paymentFilter === 'PAID' ? '#f0fdf4' : '#ffffff',
              boxShadow: paymentFilter === 'PAID' ? '0 8px 20px -4px rgba(16, 185, 129, 0.2)' : undefined,
              transition: 'all 0.2s ease',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Fee Paid
                </Typography>
                <CheckCircleOutlineIcon sx={{ color: '#10b981', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.8, color: '#047857' }}>
                {paidCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                {paymentFilter === 'PAID' ? '✓ Filter Active (Paid)' : 'Show paid residents'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Fee Half Paid Button Card */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            className="pro-card"
            onClick={() => {
              setPaymentFilter(paymentFilter === 'HALF_PAID' ? 'ALL' : 'HALF_PAID');
              setPage(0);
            }}
            sx={{
              cursor: 'pointer',
              borderTop: paymentFilter === 'HALF_PAID' ? '4px solid #f59e0b' : '4px solid transparent',
              bgcolor: paymentFilter === 'HALF_PAID' ? '#fffbeb' : '#ffffff',
              boxShadow: paymentFilter === 'HALF_PAID' ? '0 8px 20px -4px rgba(245, 158, 11, 0.2)' : undefined,
              transition: 'all 0.2s ease',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Half Paid
                </Typography>
                <AccessTimeIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.8, color: '#b45309' }}>
                {halfPaidCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600 }}>
                {paymentFilter === 'HALF_PAID' ? '◐ Filter Active (Half Paid)' : 'Show half paid dues'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Fee Pending Button Card */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            className="pro-card"
            onClick={() => {
              setPaymentFilter('PENDING');
              setPage(0);
            }}
            sx={{
              cursor: 'pointer',
              borderTop: paymentFilter === 'PENDING' ? '4px solid #ef4444' : '4px solid transparent',
              bgcolor: paymentFilter === 'PENDING' ? '#fef2f2' : '#ffffff',
              boxShadow: paymentFilter === 'PENDING' ? '0 8px 20px -4px rgba(239, 68, 68, 0.2)' : undefined,
              transition: 'all 0.2s ease',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Fee Pending
                </Typography>
                <ErrorOutlineIcon sx={{ color: '#ef4444', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.8, color: '#dc2626' }}>
                {pendingCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>
                {paymentFilter === 'PENDING' ? '⚠ Filter Active (Pending)' : 'Show pending dues'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar with the 3 Status Buttons */}
      <Card className="pro-card" sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          {/* Dedicated Status Buttons Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-3 mb-3 border-bottom">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="text-muted fw-bold small text-uppercase me-1">
                <i className="bi bi-funnel-fill text-primary me-1"></i> Payment Filter:
              </span>

              {/* Button 1: Fee Paid */}
              <button
                type="button"
                className={`btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill fw-bold transition-all shadow-2xs ${
                  paymentFilter === 'PAID'
                    ? 'btn-success text-white shadow-sm'
                    : 'btn-outline-success bg-white text-success'
                }`}
                onClick={() => {
                  setPaymentFilter(paymentFilter === 'PAID' ? 'ALL' : 'PAID');
                  setPage(0);
                }}
              >
                <i className="bi bi-check-circle-fill"></i>
                <span>Fee Paid</span>
                <span className={`badge ${paymentFilter === 'PAID' ? 'bg-white text-success' : 'bg-success text-white'} rounded-pill ms-1`}>
                  {paidCount}
                </span>
              </button>

              {/* Button 2: Half Paid */}
              <button
                type="button"
                className={`btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill fw-bold transition-all shadow-2xs ${
                  paymentFilter === 'HALF_PAID'
                    ? 'btn-warning text-dark shadow-sm'
                    : 'btn-outline-warning bg-white text-warning-emphasis'
                }`}
                onClick={() => {
                  setPaymentFilter(paymentFilter === 'HALF_PAID' ? 'ALL' : 'HALF_PAID');
                  setPage(0);
                }}
              >
                <i className="bi bi-pie-chart-fill"></i>
                <span>Half Paid</span>
                <span className={`badge ${paymentFilter === 'HALF_PAID' ? 'bg-dark text-white' : 'bg-warning text-dark'} rounded-pill ms-1`}>
                  {halfPaidCount}
                </span>
              </button>

              {/* Button 3: Fee Pending */}
              <button
                type="button"
                className={`btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill fw-bold transition-all shadow-2xs ${
                  paymentFilter === 'PENDING'
                    ? 'btn-danger text-white shadow-sm'
                    : 'btn-outline-danger bg-white text-danger'
                }`}
                onClick={() => {
                  setPaymentFilter(paymentFilter === 'PENDING' ? 'ALL' : 'PENDING');
                  setPage(0);
                }}
              >
                <i className="bi bi-clock-history"></i>
                <span>Fee Pending</span>
                <span className={`badge ${paymentFilter === 'PENDING' ? 'bg-white text-danger' : 'bg-danger text-white'} rounded-pill ms-1`}>
                  {pendingCount}
                </span>
              </button>

              {/* All Residents Reset Button */}
              {paymentFilter !== 'ALL' && (
                <button
                  type="button"
                  className="btn btn-sm btn-light border text-muted d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill fw-semibold"
                  onClick={() => {
                    setPaymentFilter('ALL');
                    setPage(0);
                  }}
                >
                  <i className="bi bi-x-circle"></i>
                  <span>Clear Filter ({totalCount})</span>
                </button>
              )}
            </div>

            {/* Filter indication */}
            {paymentFilter !== 'ALL' && (
              <div className="small fw-semibold text-muted">
                Showing <strong>{displayedStudents.length}</strong> resident(s) with status:
                <span
                  className={`badge ms-1.5 px-2.5 py-1 rounded-pill ${
                    paymentFilter === 'PAID'
                      ? 'bg-success'
                      : paymentFilter === 'HALF_PAID'
                      ? 'bg-warning text-dark'
                      : 'bg-danger'
                  }`}
                >
                  {paymentFilter === 'PAID' ? '✓ PAID' : paymentFilter === 'HALF_PAID' ? '◐ HALF PAID' : '⚠ PENDING'}
                </span>
              </div>
            )}
          </div>

          <Grid container spacing={2} alignItems="center" component="form" onSubmit={handleSearchSubmit}>
            <Grid item xs={12} sm={6} md={5}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search by name, ID, phone, room, father name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <ClearIcon
                        sx={{ cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}
                        onClick={() => {
                          setSearch('');
                          loadStudents();
                        }}
                      />
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={4}>
              <TextField
                select
                size="small"
                fullWidth
                label="Filter by Resident Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StudentStatus | '');
                  setPage(0);
                }}
              >
                <MenuItem value="">All Resident Types ({totalCount})</MenuItem>
                <MenuItem value="ACTIVE">Active Residents ({activeCount})</MenuItem>
                <MenuItem value="NOTICE_PERIOD">Notice Period ({allStudents.filter((s) => s.status === 'NOTICE_PERIOD').length})</MenuItem>
                <MenuItem value="VACATED">Vacated Residents ({allStudents.filter((s) => s.status === 'VACATED').length})</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={2} md={3}>
              <Button type="submit" variant="contained" fullWidth sx={{ bgcolor: '#1e3a8a', py: 0.9, fontWeight: 700 }}>
                Search
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Paper className="pro-card" sx={{ overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : displayedStudents.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#f1f5f9',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <PeopleIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#334155', fontWeight: 800 }}>
              {paymentFilter === 'PAID'
                ? 'No students found with Paid status'
                : paymentFilter === 'HALF_PAID'
                ? 'No students found with Half Paid fees'
                : paymentFilter === 'PENDING'
                ? 'No students found with Pending fees'
                : 'No residents registered yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1, mb: 3, maxWidth: 440, mx: 'auto' }}>
              {paymentFilter !== 'ALL'
                ? 'Try resetting the payment filter or searching with different keywords.'
                : 'Your database is clean and ready for real hostel records.'}
            </Typography>
            {paymentFilter !== 'ALL' ? (
              <Button
                variant="outlined"
                onClick={() => setPaymentFilter('ALL')}
                sx={{ fontWeight: 700, px: 3, py: 1 }}
              >
                Reset Payment Filter
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/students/admit')}
                sx={{ bgcolor: '#2563eb', fontWeight: 700, px: 3, py: 1 }}
              >
                Admit First Student
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
                      Resident
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
                      ID & Contact
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
                      Room & Bed
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
                      Monthly Rent
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
                      Next Due Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
                      Payment Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
                      Status
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedStudents
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((student) => {
                      const initial = student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S';
                      const currentPaymentStatus = getPaymentStatus(student);
                      const pending = currentPaymentStatus === 'PENDING';
                      const halfPaid = currentPaymentStatus === 'HALF_PAID';

                      let avatarBg = '#eff6ff';
                      let avatarColor = '#1d4ed8';
                      let avatarBorder = '1.5px solid #bfdbfe';
                      if (pending) {
                        avatarBg = '#fef2f2';
                        avatarColor = '#dc2626';
                        avatarBorder = '1.5px solid #fecaca';
                      } else if (halfPaid) {
                        avatarBg = '#fffbeb';
                        avatarColor = '#b45309';
                        avatarBorder = '1.5px solid #fde68a';
                      }

                      return (
                        <TableRow key={student.id} hover sx={{ '&:hover': { bgcolor: '#fcfdfd' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                sx={{
                                  width: 38,
                                  height: 38,
                                  fontSize: '0.9rem',
                                  fontWeight: 800,
                                  bgcolor: avatarBg,
                                  color: avatarColor,
                                  border: avatarBorder,
                                }}
                              >
                                {initial}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    cursor: 'pointer',
                                    '&:hover': { color: '#2563eb' },
                                  }}
                                  onClick={() => navigate(`/students/${student.studentId}`)}
                                >
                                  {student.fullName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  {student.fatherName ? `S/o ${student.fatherName}` : 'Resident'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                              {student.studentId}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {student.mobileNumber}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                              <Chip
                                label={`Room ${student.roomNumber || 'N/A'}`}
                                size="small"
                                sx={{
                                  bgcolor: '#f1f5f9',
                                  color: '#334155',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              />
                              <Chip
                                label={`Bed ${student.bedNumber || student.bedId || 'N/A'}`}
                                size="small"
                                sx={{
                                  bgcolor: '#eff6ff',
                                  color: '#1d4ed8',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  border: '1px solid #bfdbfe',
                                }}
                              />
                            </Box>
                          </TableCell>

                          <TableCell sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                            ₹{student.monthlyRent?.toLocaleString('en-IN')}
                          </TableCell>

                          <TableCell>
                            {student.nextPaymentDueDate ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: pending ? '#dc2626' : halfPaid ? '#b45309' : '#334155' }}>
                                  {student.nextPaymentDueDate}
                                </Typography>
                                {student.isOverdue && (
                                  <Chip
                                    label={`${student.daysOverdue}d overdue`}
                                    size="small"
                                    sx={{
                                      bgcolor: '#fee2e2',
                                      color: '#b91c1c',
                                      fontWeight: 800,
                                      fontSize: '0.68rem',
                                      height: 20,
                                      mt: 0.3,
                                      alignSelf: 'flex-start',
                                    }}
                                  />
                                )}
                              </Box>
                            ) : (
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                None
                              </Typography>
                            )}
                          </TableCell>

                          {/* Payment Status Dropdown Column */}
                          <TableCell>
                            <div className="position-relative d-inline-flex align-items-center">
                              <select
                                aria-label="Payment Status"
                                disabled={!isAdmin || updatingStudentId === student.studentId}
                                title={!isAdmin ? 'Administrator privileges required to change fee status' : 'Change payment status (Requires confirmation)'}
                                value={currentPaymentStatus}
                                onChange={(e) =>
                                  initiatePaymentStatusChange(
                                    student,
                                    e.target.value as 'PAID' | 'HALF_PAID' | 'PENDING'
                                  )
                                }
                                className={`form-select form-select-sm fw-bold rounded-pill shadow-2xs transition-all ${
                                  currentPaymentStatus === 'PAID'
                                    ? 'bg-success-subtle text-success border-success'
                                    : currentPaymentStatus === 'HALF_PAID'
                                    ? 'bg-warning-subtle text-warning-emphasis border-warning'
                                    : 'bg-danger-subtle text-danger border-danger'
                                }`}
                                style={{
                                  cursor: !isAdmin ? 'not-allowed' : updatingStudentId === student.studentId ? 'wait' : 'pointer',
                                  opacity: !isAdmin ? 0.75 : 1,
                                  minWidth: '135px',
                                  fontSize: '0.78rem',
                                  paddingTop: '0.35rem',
                                  paddingBottom: '0.35rem',
                                  paddingLeft: '0.85rem',
                                  paddingRight: '1.85rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.3px',
                                }}
                              >
                                <option value="PAID">🟢 Paid</option>
                                <option value="HALF_PAID">🟡 Half Paid</option>
                                <option value="PENDING">🔴 Pending</option>
                              </select>
                              {updatingStudentId === student.studentId && (
                                <span
                                  className="spinner-border spinner-border-sm text-primary position-absolute"
                                  style={{
                                    right: '26px',
                                    width: '0.75rem',
                                    height: '0.75rem',
                                    pointerEvents: 'none',
                                  }}
                                  role="status"
                                />
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <StatusChip status={student.status} />
                          </TableCell>

                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityIcon fontSize="small" />}
                                onClick={() => navigate(`/students/${student.studentId}`)}
                                sx={{
                                  borderColor: '#e2e8f0',
                                  color: '#334155',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  py: 0.4,
                                  '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
                                }}
                              >
                                View
                              </Button>

                              {student.status !== 'VACATED' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color={pending ? 'error' : halfPaid ? 'warning' : 'success'}
                                  startIcon={<PaymentIcon fontSize="small" />}
                                  onClick={() => navigate(`/payments?studentId=${student.studentId}&action=pay`)}
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    py: 0.4,
                                  }}
                                >
                                  {pending ? 'Pay Fee' : halfPaid ? 'Balance' : 'Payment'}
                                </Button>
                              )}

                              {isAdmin && (
                                <Button
                                  size="small"
                                  color="error"
                                  startIcon={<DeleteOutlineIcon fontSize="small" />}
                                  onClick={() => {
                                    setStudentToDelete(student);
                                    setDeleteDialogOpen(true);
                                  }}
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    py: 0.4,
                                  }}
                                >
                                  Delete
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={displayedStudents.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Resident Permanently"
        message={`Are you sure you want to permanently delete ${studentToDelete?.fullName} (${studentToDelete?.studentId})? This action cannot be undone.`}
        confirmText="Yes, Delete Permanently"
        cancelText="Cancel"
        confirmColor="error"
        isLoading={isDeleting}
        onConfirm={handleDeleteStudent}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setStudentToDelete(null);
        }}
      />

      {/* Security Confirmation Dialog for Payment Status Change */}
      <ConfirmationDialog
        open={statusConfirmOpen}
        title="Security Confirmation: Change Fee Status"
        message={
          pendingStatusChange
            ? `Are you sure you want to update the payment status for ${pendingStatusChange.student.fullName} (${pendingStatusChange.student.studentId}, Room ${pendingStatusChange.student.roomNumber || 'N/A'}) from ${pendingStatusChange.oldStatus} to ${pendingStatusChange.newStatus}? ${
                pendingStatusChange.newStatus === 'PAID'
                  ? 'This will record the fee as fully paid and advance their next due date by 1 month.'
                  : pendingStatusChange.newStatus === 'HALF_PAID'
                  ? 'This will record partial fee payment received.'
                  : 'This will flag this resident with pending fee dues.'
              }`
            : ''
        }
        confirmText="Yes, Update Status"
        cancelText="Cancel"
        confirmColor={
          pendingStatusChange?.newStatus === 'PAID'
            ? 'primary'
            : pendingStatusChange?.newStatus === 'HALF_PAID'
            ? 'warning'
            : 'error'
        }
        isLoading={!!updatingStudentId}
        onConfirm={confirmPaymentStatusChange}
        onCancel={() => {
          setStatusConfirmOpen(false);
          setPendingStatusChange(null);
        }}
      />
    </Box>
  );
};

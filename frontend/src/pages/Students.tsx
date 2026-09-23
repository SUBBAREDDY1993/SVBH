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
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // KPI calculations
  const totalCount = allStudents.length;
  const activeCount = allStudents.filter((s) => s.status === 'ACTIVE').length;
  const noticeCount = allStudents.filter((s) => s.status === 'NOTICE_PERIOD').length;
  const vacatedCount = allStudents.filter((s) => s.status === 'VACATED').length;

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

      {/* KPI Metric Filter Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            className="pro-card"
            onClick={() => setStatusFilter('')}
            sx={{
              cursor: 'pointer',
              borderTop: statusFilter === '' ? '4px solid #2563eb' : '4px solid transparent',
              bgcolor: statusFilter === '' ? '#f0f7ff' : '#ffffff',
              transition: 'all 0.2s ease',
            }}
          >
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Total Enrolled
                </Typography>
                <PeopleIcon sx={{ color: '#2563eb', fontSize: 22 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#0f172a' }}>
                {totalCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                {statusFilter === '' ? 'Showing all records' : 'Click to view all'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            className="pro-card"
            onClick={() => setStatusFilter('ACTIVE')}
            sx={{
              cursor: 'pointer',
              borderTop: statusFilter === 'ACTIVE' ? '4px solid #10b981' : '4px solid transparent',
              bgcolor: statusFilter === 'ACTIVE' ? '#f0fdf4' : '#ffffff',
              transition: 'all 0.2s ease',
            }}
          >
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Active Residents
                </Typography>
                <CheckCircleOutlineIcon sx={{ color: '#10b981', fontSize: 22 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#047857' }}>
                {activeCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                Currently in hostel beds
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            className="pro-card"
            onClick={() => setStatusFilter('NOTICE_PERIOD')}
            sx={{
              cursor: 'pointer',
              borderTop: statusFilter === 'NOTICE_PERIOD' ? '4px solid #f59e0b' : '4px solid transparent',
              bgcolor: statusFilter === 'NOTICE_PERIOD' ? '#fffbeb' : '#ffffff',
              transition: 'all 0.2s ease',
            }}
          >
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Notice Period
                </Typography>
                <HourglassEmptyIcon sx={{ color: '#f59e0b', fontSize: 22 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#b45309' }}>
                {noticeCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600 }}>
                Pending vacate date
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            className="pro-card"
            onClick={() => setStatusFilter('VACATED')}
            sx={{
              cursor: 'pointer',
              borderTop: statusFilter === 'VACATED' ? '4px solid #64748b' : '4px solid transparent',
              bgcolor: statusFilter === 'VACATED' ? '#f8fafc' : '#ffffff',
              transition: 'all 0.2s ease',
            }}
          >
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Vacated
                </Typography>
                <ExitToAppIcon sx={{ color: '#64748b', fontSize: 22 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#475569' }}>
                {vacatedCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                Past residents archive
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Card className="pro-card" sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
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

            <Grid item xs={12} sm={4} md={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StudentStatus | '')}
              >
                <MenuItem value="">All Statuses ({totalCount})</MenuItem>
                <MenuItem value="ACTIVE">Active Residents ({activeCount})</MenuItem>
                <MenuItem value="NOTICE_PERIOD">Notice Period ({noticeCount})</MenuItem>
                <MenuItem value="VACATED">Vacated Residents ({vacatedCount})</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={2} md={2}>
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
        ) : students.length === 0 ? (
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
              No residents registered yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1, mb: 3, maxWidth: 440, mx: 'auto' }}>
              Your database is clean and ready for real hostel records. Click below to enroll your first resident into Sri Venkateswara Boys Hostel.
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate('/students/admit')}
              sx={{ bgcolor: '#2563eb', fontWeight: 700, px: 3, py: 1 }}
            >
              Admit First Student
            </Button>
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
                      Joining Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
                      Monthly Rent
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>
                      Next Due Date
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
                  {students
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((student) => {
                      const initial = student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S';
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
                                  bgcolor: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1.5px solid #bfdbfe',
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
                                label={`Room ${student.roomNumber}`}
                                size="small"
                                sx={{
                                  bgcolor: '#f1f5f9',
                                  color: '#334155',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              />
                              <Chip
                                label={`Bed ${student.bedNumber}`}
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

                          <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                            {student.joiningDate}
                          </TableCell>

                          <TableCell sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                            ₹{student.monthlyRent?.toLocaleString('en-IN')}
                          </TableCell>

                          <TableCell>
                            {student.nextPaymentDueDate ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: student.isOverdue ? '#dc2626' : '#334155' }}>
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
                                  color="success"
                                  startIcon={<PaymentIcon fontSize="small" />}
                                  onClick={() => navigate(`/payments?studentId=${student.studentId}&action=pay`)}
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    py: 0.4,
                                  }}
                                >
                                  Pay
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
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={students.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_e, newPage) => setPage(newPage)}
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
        title={studentToDelete?.status === 'VACATED' ? 'Delete Vacated Student' : 'Delete Resident & Release Bed'}
        message={
          studentToDelete
            ? studentToDelete.status === 'VACATED'
              ? `Are you sure you want to permanently delete resident ${studentToDelete.fullName} (${studentToDelete.studentId})? This will remove their record from the database.`
              : `Are you sure you want to delete resident ${studentToDelete.fullName} (${studentToDelete.studentId})? Since this resident is currently ${studentToDelete.status}, their allocated Bed ${studentToDelete.bedId || ''} will be automatically released back to AVAILABLE.`
            : ''
        }
        confirmText="Delete Resident"
        confirmColor="error"
        onConfirm={handleDeleteStudent}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setStudentToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </Box>
  );
};


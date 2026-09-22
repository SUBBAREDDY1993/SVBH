import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
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
import { studentService } from '../services/studentService';
import { reportService } from '../services/reportService';
import { Student, StudentStatus } from '../types';
import { StatusChip } from '../components/StatusChip';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const data = await studentService.getAllStudents(
        statusFilter || undefined,
        search || undefined
      );
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  const handleExportCsv = () => {
    reportService.downloadStudentsCsv();
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Student Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Directory of active, notice period, and vacated hostel residents
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCsv}
            sx={{ borderColor: '#cbd5e1', color: '#334155' }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/students/new')}
            sx={{ bgcolor: '#2563eb' }}
          >
            Add Student
          </Button>
        </Box>
      </Box>

      {/* Filter and Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center" component="form" onSubmit={handleSearchSubmit}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search by name, ID, phone, Aadhaar, room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
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
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="ACTIVE">Active Residents</MenuItem>
                <MenuItem value="NOTICE_PERIOD">Notice Period</MenuItem>
                <MenuItem value="VACATED">Vacated Residents</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={2} md={2}>
              <Button type="submit" variant="contained" fullWidth sx={{ bgcolor: '#1e3a8a' }}>
                Search
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : students.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#475569' }}>
              No students found
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
              Try adjusting your search criteria or click "Add Student" to admit a resident.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Mobile Number</TableCell>
                    <TableCell>Room & Bed</TableCell>
                    <TableCell>Joining Date</TableCell>
                    <TableCell>Monthly Rent</TableCell>
                    <TableCell>Next Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((student) => (
                      <TableRow key={student.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                          {student.studentId}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{student.fullName}</TableCell>
                        <TableCell>{student.mobileNumber}</TableCell>
                        <TableCell>
                          {student.roomNumber ? (
                            <span>
                              Room <strong>{student.roomNumber}</strong> (Bed #{student.bedNumber})
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>None</span>
                          )}
                        </TableCell>
                        <TableCell>{student.joiningDate}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          ₹{student.monthlyRent?.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          {student.nextPaymentDueDate ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <span>{student.nextPaymentDueDate}</span>
                              {student.isOverdue && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: '#ef4444',
                                    backgroundColor: '#fee2e2',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                  }}
                                >
                                  {student.daysOverdue}d overdue
                                </span>
                              )}
                            </Box>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={student.status} />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Button
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => navigate(`/students/${student.studentId}`)}
                            >
                              View
                            </Button>
                            {student.status !== 'VACATED' && (
                              <Button
                                size="small"
                                color="success"
                                startIcon={<PaymentIcon />}
                                onClick={() => navigate(`/payments?studentId=${student.studentId}&action=pay`)}
                              >
                                Pay
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
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
    </Box>
  );
};

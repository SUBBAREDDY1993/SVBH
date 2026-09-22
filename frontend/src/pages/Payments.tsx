import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
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
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { paymentService } from '../services/paymentService';
import { studentService } from '../services/studentService';
import { reportService } from '../services/reportService';
import { Payment, PaymentMethod, PaymentRequest, PaymentStatus, PaymentType, Student } from '../types';
import { StatusChip } from '../components/StatusChip';
import { ReceiptModal } from '../components/ReceiptModal';
import { useNotification } from '../context/NotificationContext';

export const Payments: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [searchParams] = useSearchParams();
  const prefillStudentId = searchParams.get('studentId') || '';
  const prefillAction = searchParams.get('action') || '';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | ''>('');
  const [filterStudentId, setFilterStudentId] = useState<string>(prefillStudentId);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Record Payment Modal
  const [modalOpen, setModalOpen] = useState(prefillAction === 'pay');
  const [selectedStudentId, setSelectedStudentId] = useState(prefillStudentId);
  const [amount, setAmount] = useState<number>(5000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentType, setPaymentType] = useState<PaymentType>('MONTHLY_RENT');
  const [transactionRef, setTransactionRef] = useState('');
  const [rentForMonth, setRentForMonth] = useState('October 2026');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt Modal
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [paymentList, studentList] = await Promise.all([
        paymentService.getPayments(filterStudentId || undefined, filterStatus || undefined),
        studentService.getAllStudents(),
      ]);
      setPayments(paymentList);
      setStudents(studentList);

      if (prefillStudentId) {
        const found = studentList.find((s) => s.studentId === prefillStudentId);
        if (found) setAmount(found.monthlyRent);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterStudentId]);

  const handleStudentSelect = (studId: string) => {
    setSelectedStudentId(studId);
    const found = students.find((s) => s.studentId === studId);
    if (found) {
      setAmount(found.monthlyRent);
    }
  };

  const handleOpenRecordPayment = () => {
    setSelectedStudentId('');
    setAmount(5000);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('UPI');
    setPaymentType('MONTHLY_RENT');
    setTransactionRef('');
    setRemarks('');
    setModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      showError('Please select a student');
      return;
    }
    if (amount <= 0) {
      showError('Payment amount must be greater than 0');
      return;
    }

    const payload: PaymentRequest = {
      studentId: selectedStudentId,
      amount,
      paymentDate,
      paymentMethod,
      paymentType,
      transactionReference: transactionRef.trim() || undefined,
      rentForMonth: rentForMonth.trim() || undefined,
      remarks: remarks.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      const created = await paymentService.recordPayment(payload);
      showSuccess(`Payment of ₹${created.amount} recorded! Receipt: ${created.receiptNumber}`);
      setModalOpen(false);
      loadData();
      // Promptly show the receipt
      setActiveReceipt(created);
      setReceiptOpen(true);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCollected = payments
    .filter((p) => p.paymentStatus === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Payment & Rent Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Fee collection, receipts, billing cycles, and payment archives
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => reportService.downloadPaymentsCsv()}
            sx={{ borderColor: '#cbd5e1', color: '#334155' }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenRecordPayment}
            sx={{ bgcolor: '#2563eb' }}
          >
            Record Payment
          </Button>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 3, borderLeft: '4px solid #10b981' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>TOTAL COLLECTED</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#059669' }}>
                ₹{totalCollected.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Across all filtered transactions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 3, borderLeft: '4px solid #1e3a8a' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>TRANSACTIONS COUNT</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#1e3a8a' }}>
                {payments.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Receipts generated</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 3, borderLeft: '4px solid #f59e0b' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>AVERAGE PAYMENT</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#d97706' }}>
                ₹{payments.length > 0 ? Math.round(totalCollected / payments.length).toLocaleString('en-IN') : 0}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Per recorded receipt</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                size="small"
                fullWidth
                label="Filter by Student"
                value={filterStudentId}
                onChange={(e) => setFilterStudentId(e.target.value)}
              >
                <MenuItem value="">All Students</MenuItem>
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.studentId}>
                    {s.fullName} ({s.studentId})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Filter by Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | '')}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="OVERDUE">Overdue</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : payments.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#475569' }}>No payment records found</Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
              Click "Record Payment" to register a payment receipt.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Receipt No</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Receipt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontWeight: 800, color: '#1e3a8a' }}>
                          {p.receiptNumber}
                        </TableCell>
                        <TableCell>{p.studentId}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{p.studentName}</TableCell>
                        <TableCell>{p.roomNumber ? `Room ${p.roomNumber}` : 'N/A'}</TableCell>
                        <TableCell>{p.paymentDate}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#10b981' }}>
                          ₹{p.amount?.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>{p.paymentMethod}</TableCell>
                        <TableCell>{p.paymentType?.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <StatusChip status={p.paymentStatus} />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<ReceiptIcon />}
                            onClick={() => {
                              setActiveReceipt(p);
                              setReceiptOpen(true);
                            }}
                          >
                            Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={payments.length}
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

      {/* Record Payment Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Fee Payment</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            select
            label="Select Resident *"
            fullWidth
            size="small"
            value={selectedStudentId}
            onChange={(e) => handleStudentSelect(e.target.value)}
          >
            <MenuItem value="">-- Select Resident --</MenuItem>
            {students
              .filter((s) => s.status !== 'VACATED')
              .map((s) => (
                <MenuItem key={s.id} value={s.studentId}>
                  {s.fullName} ({s.studentId} • Room {s.roomNumber})
                </MenuItem>
              ))}
          </TextField>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount (₹) *"
                type="number"
                fullWidth
                size="small"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Payment Date *"
                type="date"
                fullWidth
                size="small"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Payment Mode *"
                fullWidth
                size="small"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <MenuItem value="UPI">UPI (Google Pay / PhonePe)</MenuItem>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer / NEFT</MenuItem>
                <MenuItem value="CARD">Debit / Credit Card</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Payment Type *"
                fullWidth
                size="small"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              >
                <MenuItem value="MONTHLY_RENT">Monthly Rent</MenuItem>
                <MenuItem value="SECURITY_DEPOSIT">Security Deposit</MenuItem>
                <MenuItem value="ADVANCE">Advance</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <TextField
            label="Transaction Reference / UPI ID"
            fullWidth
            size="small"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="e.g. UPI-998822 or Cash Receipt"
          />

          <TextField
            label="Rent Billing Period"
            fullWidth
            size="small"
            value={rentForMonth}
            onChange={(e) => setRentForMonth(e.target.value)}
            placeholder="e.g. October 2026"
            helperText="For monthly rent, student's next due date will automatically advance by 1 month."
          />

          <TextField
            label="Remarks"
            fullWidth
            multiline
            rows={2}
            size="small"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitPayment}
            disabled={isSubmitting || !selectedStudentId || amount <= 0}
            sx={{ bgcolor: '#2563eb' }}
          >
            Confirm & Generate Receipt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Official Receipt Modal */}
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        payment={activeReceipt}
      />
    </Box>
  );
};

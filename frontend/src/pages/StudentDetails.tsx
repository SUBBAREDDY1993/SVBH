import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Divider,
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
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PaymentIcon from '@mui/icons-material/Payment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { studentService } from '../services/studentService';
import { paymentService } from '../services/paymentService';
import { allocationService } from '../services/allocationService';
import { AllocationHistory, Payment, Student } from '../types';
import { StatusChip } from '../components/StatusChip';
import { ReceiptModal } from '../components/ReceiptModal';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const StudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { isAdmin } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allocations, setAllocations] = useState<AllocationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  // Vacate Modal
  const [vacateModalOpen, setVacateModalOpen] = useState(false);
  const [vacateDate, setVacateDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacateReason, setVacateReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(5000);
  const [finalPayment, setFinalPayment] = useState(0);
  const [vacateRemarks, setVacateRemarks] = useState('');
  const [isVacating, setIsVacating] = useState(false);

  // Notice Period Modal
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedVacateDate, setExpectedVacateDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [noticeReason, setNoticeReason] = useState('');
  const [noticeRemarks, setNoticeRemarks] = useState('');
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);

  // Receipt Modal
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const studentData = await studentService.getStudent(id);
      setStudent(studentData);
      setRefundAmount(studentData.securityDeposit || 0);

      // Load payments
      const paymentData = await paymentService.getPayments(studentData.studentId);
      setPayments(paymentData);

      // Load allocations
      const allocationData = await allocationService.getAllocations(studentData.studentId);
      setAllocations(allocationData);
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleVacateConfirm = async () => {
    if (!student) return;
    try {
      setIsVacating(true);
      await studentService.vacateStudent(student.id, {
        vacateDate,
        reason: vacateReason,
        refundAmount,
        finalPayment,
        remarks: vacateRemarks,
      });
      showSuccess(`Resident ${student.fullName} vacated successfully. Bed released to AVAILABLE.`);
      setVacateModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to vacate student');
    } finally {
      setIsVacating(false);
    }
  };

  const handleNoticeConfirm = async () => {
    if (!student) return;
    try {
      setIsSubmittingNotice(true);
      await studentService.markNoticePeriod(student.id, {
        noticeDate,
        expectedVacateDate,
        reason: noticeReason,
        remarks: noticeRemarks,
      });
      showSuccess(`Resident ${student.fullName} marked as NOTICE_PERIOD until ${expectedVacateDate}.`);
      setNoticeModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update notice period');
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Student not found</Typography>
        <Button onClick={() => navigate('/students')} sx={{ mt: 2 }}>Back to Directory</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Top Action Bar */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }} className="no-print">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/students')} color="inherit">
          Back to Students
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ borderColor: '#cbd5e1', color: '#334155' }}
          >
            Print Profile
          </Button>

          {student.status !== 'VACATED' && (
            <>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<SwapHorizIcon />}
                onClick={() => navigate(`/allocations`)}
              >
                Transfer Bed
              </Button>

              <Button
                variant="contained"
                color="success"
                startIcon={<PaymentIcon />}
                onClick={() => navigate(`/payments?studentId=${student.studentId}&action=pay`)}
              >
                Record Payment
              </Button>

              {student.status === 'ACTIVE' && (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<WarningAmberIcon />}
                  onClick={() => setNoticeModalOpen(true)}
                >
                  Notice Period
                </Button>
              )}

              {isAdmin && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ExitToAppIcon />}
                  onClick={() => setVacateModalOpen(true)}
                >
                  Vacate Student
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Profile Header Banner */}
      <Card sx={{ mb: 3.5, bgcolor: '#ffffff', borderRadius: 3 }} className="print-card">
        <CardContent sx={{ p: 3.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {student.fullName}
                </Typography>
                <StatusChip status={student.status} size="medium" />
                {student.isOverdue && (
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#ef4444',
                      backgroundColor: '#fee2e2',
                      padding: '4px 8px',
                      borderRadius: 6,
                    }}
                  >
                    ⚠️ {student.daysOverdue} Days Overdue
                  </span>
                )}
              </Box>

              <Typography variant="subtitle1" sx={{ color: '#1e3a8a', fontWeight: 700 }}>
                Student ID: {student.studentId}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                Resident at Sri Venkateswara Boys Hostel since {student.joiningDate}
              </Typography>
            </Box>

            {/* Quick Room & Bed Highlight Card */}
            <Box
              sx={{
                bgcolor: '#f8fafc',
                p: 2,
                borderRadius: 2,
                border: '1.5px solid #e2e8f0',
                minWidth: 220,
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                CURRENT ALLOCATION
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {student.roomNumber ? `Room ${student.roomNumber}` : 'No Active Room'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#059669', fontWeight: 700 }}>
                {student.bedId ? `Bed ${student.bedNumber} (${student.bedId})` : 'No Bed'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.5 }}>
                Rent: ₹{student.monthlyRent?.toLocaleString('en-IN')}/month
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }} className="no-print">
        <Tabs value={tabIndex} onChange={(_e, v) => setTabIndex(v)}>
          <Tab label="Profile & Information" sx={{ fontWeight: 600 }} />
          <Tab label={`Payment History (${payments.length})`} sx={{ fontWeight: 600 }} />
          <Tab label={`Allocation History (${allocations.length})`} sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* Tab 0: Information Details */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          {/* Personal Info */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
                Personal Information
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Father's Name:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.fatherName || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Mother's Name:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.motherName || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Mobile Number:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.mobileNumber}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Alternate Phone:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.alternateMobileNumber || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Email:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.email || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Date of Birth:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.dateOfBirth || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Gender:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.gender || 'Male'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Aadhaar Number:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{student.aadhaarNumber || 'N/A'}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Permanent Address:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {student.address ? `${student.address}, ${student.city}, ${student.state} - ${student.pincode}` : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Hostel Financial & Allocation Info */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
                Hostel & Billing Details
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Joining Date:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.joiningDate}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Monthly Rent:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    ₹{student.monthlyRent?.toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Security Deposit:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₹{student.securityDeposit?.toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Last Payment Date:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.lastPaymentDate || 'None'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Next Payment Due Date:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: student.isOverdue ? '#ef4444' : '#0f172a' }}>
                    {student.nextPaymentDueDate || 'N/A'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                  Emergency Contact
                </Typography>
                {student.emergencyContact ? (
                  <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.emergencyContact.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Relation: {student.emergencyContact.relationship}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#1e3a8a', fontWeight: 600 }}>
                      Phone: {student.emergencyContact.mobileNumber}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>No emergency contact recorded</Typography>
                )}

                {/* Vacate Info if vacated */}
                {student.status === 'VACATED' && student.vacateInfo && (
                  <Box sx={{ mt: 1, p: 2, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fecaca' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#991b1b' }}>
                      Vacate Settlement Details
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#7f1d1d' }}>
                      Vacate Date: {student.vacateInfo.vacateDate}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#7f1d1d' }}>
                      Reason: {student.vacateInfo.reason}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#7f1d1d' }}>
                      Refund Amount: ₹{student.vacateInfo.refundAmount?.toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Payment History */}
      {tabIndex === 1 && (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {payments.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#64748b' }}>No payments recorded for this resident yet.</Typography>
              <Button
                variant="contained"
                sx={{ mt: 2, bgcolor: '#2563eb' }}
                onClick={() => navigate(`/payments?studentId=${student.studentId}&action=pay`)}
              >
                Record First Payment
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Receipt Number</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Month</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Receipt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#1e3a8a' }}>{p.receiptNumber}</TableCell>
                      <TableCell>{p.paymentDate}</TableCell>
                      <TableCell>{p.paymentType?.replace('_', ' ')}</TableCell>
                      <TableCell>{p.rentForMonth || 'N/A'}</TableCell>
                      <TableCell>{p.paymentMethod}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#10b981' }}>
                        ₹{p.amount?.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell><StatusChip status={p.paymentStatus} /></TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<ReceiptIcon />}
                          onClick={() => {
                            setSelectedPayment(p);
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
          )}
        </Paper>
      )}

      {/* Tab 2: Allocation History */}
      {tabIndex === 2 && (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {allocations.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#64748b' }}>No allocation history found.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Action Type</TableCell>
                    <TableCell>From Room/Bed</TableCell>
                    <TableCell>To Room/Bed</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Allocated By</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allocations.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{a.type}</TableCell>
                      <TableCell>{a.fromRoom ? `Room ${a.fromRoom} (${a.fromBedId})` : '-'}</TableCell>
                      <TableCell>{a.toRoom ? `Room ${a.toRoom} (${a.toBedId})` : '-'}</TableCell>
                      <TableCell>{a.allocationDate ? new Date(a.allocationDate).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell>{a.allocatedBy || 'ADMIN'}</TableCell>
                      <TableCell>{a.remarks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Vacate Modal */}
      <Dialog open={vacateModalOpen} onClose={() => setVacateModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Vacate Student: {student.fullName}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Vacating will mark the student as <strong>VACATED</strong> and automatically release <strong>Bed {student.bedId}</strong> back to <strong>AVAILABLE</strong> status.
          </Typography>

          <TextField
            label="Vacating Date *"
            type="date"
            fullWidth
            size="small"
            value={vacateDate}
            onChange={(e) => setVacateDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Reason for Leaving *"
            fullWidth
            size="small"
            value={vacateReason}
            onChange={(e) => setVacateReason(e.target.value)}
            placeholder="e.g. Course completed, Relocating to Bangalore"
          />

          <TextField
            label="Security Deposit Refund Amount (₹)"
            type="number"
            fullWidth
            size="small"
            value={refundAmount}
            onChange={(e) => setRefundAmount(Number(e.target.value))}
          />

          <TextField
            label="Final Pending Dues Collected (₹)"
            type="number"
            fullWidth
            size="small"
            value={finalPayment}
            onChange={(e) => setFinalPayment(Number(e.target.value))}
          />

          <TextField
            label="Settlement Remarks"
            multiline
            rows={2}
            fullWidth
            size="small"
            value={vacateRemarks}
            onChange={(e) => setVacateRemarks(e.target.value)}
            placeholder="e.g. Room inspected, keys returned, deposit refunded via UPI"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVacateModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleVacateConfirm}
            disabled={isVacating || !vacateReason.trim()}
          >
            Confirm Vacate & Release Bed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notice Period Modal */}
      <Dialog open={noticeModalOpen} onClose={() => setNoticeModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Put Student on Notice Period
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This student will be marked with status <strong>NOTICE_PERIOD</strong> and will appear on the Dashboard under "Students Leaving Soon".
          </Typography>

          <TextField
            label="Notice Submission Date"
            type="date"
            fullWidth
            size="small"
            value={noticeDate}
            onChange={(e) => setNoticeDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Expected Vacating Date *"
            type="date"
            fullWidth
            size="small"
            value={expectedVacateDate}
            onChange={(e) => setExpectedVacateDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Reason"
            fullWidth
            size="small"
            value={noticeReason}
            onChange={(e) => setNoticeReason(e.target.value)}
            placeholder="e.g. Final semester exams ending"
          />

          <TextField
            label="Remarks"
            multiline
            rows={2}
            fullWidth
            size="small"
            value={noticeRemarks}
            onChange={(e) => setNoticeRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNoticeModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleNoticeConfirm}
            disabled={isSubmittingNotice}
          >
            Mark on Notice Period
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Modal */}
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        payment={selectedPayment}
      />
    </Box>
  );
};

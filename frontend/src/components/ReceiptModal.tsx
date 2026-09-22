import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Payment } from '../types';

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ open, onClose, payment }) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 4 }} className="print-card">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <img src="/logo.svg" alt="SVBH Logo" style={{ width: 50, height: 50 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.02em' }}>
            Sri Venkateswara Boys Hostel
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            Opp. SV University Main Gate, Tirupati, Andhra Pradesh - 517502
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Phone: +91 98765 43210 | Email: svboyshostel.tirupati@gmail.com
          </Typography>

          <Box sx={{ display: 'inline-block', bgcolor: '#f1f5f9', px: 2, py: 0.5, borderRadius: 1, mt: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              FEE PAYMENT RECEIPT
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* Receipt Meta */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Receipt Number</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e3a8a' }}>{payment.receiptNumber}</Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Payment Date</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{payment.paymentDate}</Typography>
          </Grid>
        </Grid>

        {/* Student Meta */}
        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, mb: 3, border: '1px solid #e2e8f0' }}>
          <Grid container spacing={1.5}>
            <Grid item xs={7}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Student Name</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{payment.studentName}</Typography>
            </Grid>
            <Grid item xs={5}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Student ID</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{payment.studentId}</Typography>
            </Grid>
            <Grid item xs={7}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Room & Bed</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Room {payment.roomNumber || 'N/A'}, Bed {payment.bedNumber || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={5}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Billing Period</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{payment.rentForMonth || 'Current Cycle'}</Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Payment Breakdown */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Payment Type</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{payment.paymentType?.replace('_', ' ')}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Payment Mode</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{payment.paymentMethod}</Typography>
          </Box>
          {payment.transactionReference && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Transaction Reference</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{payment.transactionReference}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '2px solid #1e3a8a', mt: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Total Amount Paid</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#10b981' }}>
              ₹{payment.amount?.toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Box>

        {/* Success confirmation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#10b981', mb: 3 }}>
          <CheckCircleOutlineIcon fontSize="small" />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Payment Verified & Recorded by {payment.recordedBy || 'Admin'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 2, borderTop: '1px dashed #cbd5e1' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            * This is a computer-generated official receipt from SVBH Management.
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ height: 30 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, borderTop: '1px solid #94a3b8', pt: 0.5, px: 2 }}>
              Authorized Signatory
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }} className="no-print">
        <Button onClick={onClose} startIcon={<CloseIcon />} color="inherit">
          Close
        </Button>
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>
          Print Receipt
        </Button>
      </DialogActions>
    </Dialog>
  );
};

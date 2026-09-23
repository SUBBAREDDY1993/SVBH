import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { paymentService } from '../services/paymentService';
import { Payment } from '../types';

export const PaymentReceipt: React.FC = () => {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!receiptNumber) return;
      try {
        setIsLoading(true);
        const data = await paymentService.getReceipt(receiptNumber);
        setPayment(data);
      } catch (err) {
        console.error('Failed to load receipt:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [receiptNumber]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!payment) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Receipt Not Found</Typography>
        <Button onClick={() => navigate('/payments')} sx={{ mt: 2 }}>Back to Payments</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', pb: 4 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/payments')} color="inherit">
          Back
        </Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
          Print Receipt
        </Button>
      </Box>

      <Card sx={{ p: 3, borderRadius: 3 }} className="print-card">
        <CardContent>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <img src="/logo.svg" alt="SVBH Logo" style={{ width: 56, height: 56 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e3a8a' }}>
              Sri Venkateswara Boys Hostel
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Contact: +91 9441843574 | svbhostel2026@gmail.com
            </Typography>

            <Box sx={{ display: 'inline-block', bgcolor: '#f1f5f9', px: 2, py: 0.5, borderRadius: 1, mt: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                FEE PAYMENT RECEIPT
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Receipt Number</Typography>
              <Typography variant="body1" sx={{ fontWeight: 800, color: '#1e3a8a' }}>{payment.receiptNumber}</Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Payment Date</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{payment.paymentDate}</Typography>
            </Grid>
          </Grid>

          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, mb: 3, border: '1px solid #e2e8f0' }}>
            <Grid container spacing={1.5}>
              <Grid item xs={7}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Resident Full Name</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{payment.studentName}</Typography>
              </Grid>
              <Grid item xs={5}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Student ID</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{payment.studentId}</Typography>
              </Grid>
              <Grid item xs={7}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Room & Bed</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Room {payment.roomNumber || 'N/A'}, Bed #{payment.bedNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={5}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Billing Period</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{payment.rentForMonth || 'Current Cycle'}</Typography>
              </Grid>
            </Grid>
          </Box>

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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#10b981', mb: 3 }}>
            <CheckCircleOutlineIcon fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Payment Verified & Recorded by {payment.recordedBy || 'Administrator'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 2, borderTop: '1px dashed #cbd5e1' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              * Official system receipt from Sri Venkateswara Boys Hostel.
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ height: 30 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, borderTop: '1px solid #94a3b8', pt: 0.5, px: 2 }}>
                Authorized Signatory
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

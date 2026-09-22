import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { settingService } from '../services/settingService';
import { HostelSetting } from '../types';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useNotification } from '../context/NotificationContext';

export const Settings: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [settings, setSettings] = useState<HostelSetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Form Fields
  const [hostelName, setHostelName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [totalBeds, setTotalBeds] = useState(70);
  const [defaultMonthlyRent, setDefaultMonthlyRent] = useState(5000);
  const [defaultSecurityDeposit, setDefaultSecurityDeposit] = useState(5000);
  const [paymentGracePeriodDays, setPaymentGracePeriodDays] = useState(5);
  const [currency, setCurrency] = useState('INR');

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await settingService.getSettings();
      setSettings(data);
      setHostelName(data.hostelName);
      setAddress(data.address);
      setContactNumber(data.contactNumber);
      setEmail(data.email);
      setTotalBeds(data.totalBeds);
      setDefaultMonthlyRent(data.defaultMonthlyRent);
      setDefaultSecurityDeposit(data.defaultSecurityDeposit);
      setPaymentGracePeriodDays(data.paymentGracePeriodDays);
      setCurrency(data.currency);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await settingService.updateSettings({
        hostelName,
        address,
        contactNumber,
        email,
        totalBeds,
        defaultMonthlyRent,
        defaultSecurityDeposit,
        paymentGracePeriodDays,
        currency,
      });
      setSettings(updated);
      showSuccess('Hostel settings updated successfully');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    try {
      setIsResetting(true);
      await settingService.resetDemoData();
      showSuccess('Demo data successfully re-seeded with 70 beds, 18 rooms, 12 sample students, and payments.');
      setResetConfirmOpen(false);
      loadSettings();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to reset demo data');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4, maxWidth: 800 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Hostel System Settings
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Configure institution branding, defaults, and demo data controls
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3, mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSave}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
              General Information
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  label="Hostel Name *"
                  fullWidth
                  size="small"
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Official Address *"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Phone *"
                  fullWidth
                  size="small"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Official Email *"
                  fullWidth
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
              Hostel Capacity & Billing Defaults
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Hostel Total Beds Capacity"
                  type="number"
                  fullWidth
                  size="small"
                  value={totalBeds}
                  onChange={(e) => setTotalBeds(Number(e.target.value))}
                  helperText="Default: 70 beds (scalable)"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Default Monthly Rent (₹)"
                  type="number"
                  fullWidth
                  size="small"
                  value={defaultMonthlyRent}
                  onChange={(e) => setDefaultMonthlyRent(Number(e.target.value))}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Default Security Deposit (₹)"
                  type="number"
                  fullWidth
                  size="small"
                  value={defaultSecurityDeposit}
                  onChange={(e) => setDefaultSecurityDeposit(Number(e.target.value))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Payment Grace Period (Days)"
                  type="number"
                  fullWidth
                  size="small"
                  value={paymentGracePeriodDays}
                  onChange={(e) => setPaymentGracePeriodDays(Number(e.target.value))}
                  helperText="Days before flagging overdue"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Currency Code"
                  fullWidth
                  size="small"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isSaving}
                sx={{ bgcolor: '#2563eb', px: 4, fontWeight: 700 }}
              >
                {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Settings'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Demo Data Management Card */}
      <Card sx={{ borderRadius: 3, border: '1px solid #fecaca', bgcolor: '#fff5f5' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#991b1b', mb: 1 }}>
            Demo Data Control
          </Typography>
          <Typography variant="body2" sx={{ color: '#7f1d1d', mb: 3 }}>
            Need to reset your database back to the fresh demo state? This will recreate 70 beds, 18 rooms, 12 sample students, and payment records.
          </Typography>

          <Button
            variant="outlined"
            color="error"
            startIcon={<RestartAltIcon />}
            onClick={() => setResetConfirmOpen(true)}
            sx={{ fontWeight: 700 }}
          >
            Reset Database to 70 Beds Demo State
          </Button>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        open={resetConfirmOpen}
        title="Reset Demo Data"
        message="Are you sure you want to reset all data back to the demo state (70 beds, 18 rooms, sample students)? Any custom changes made will be re-initialized."
        confirmText="Yes, Reset Database"
        confirmColor="error"
        isLoading={isResetting}
        onConfirm={handleResetDemoData}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </Box>
  );
};

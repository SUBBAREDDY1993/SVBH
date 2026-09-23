import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
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
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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
      showSuccess('Demo data successfully re-seeded with 70 beds, 16 rooms, 12 sample students, and payments.');
      setResetConfirmOpen(false);
      loadSettings();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to reset demo data');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearDemoData = async () => {
    try {
      setIsClearing(true);
      await settingService.clearDemoData();
      showSuccess('All dummy data deleted successfully! 70 beds across 16 rooms are now AVAILABLE for real student admissions.');
      setClearConfirmOpen(false);
      loadSettings();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to clear dummy data');
    } finally {
      setIsClearing(false);
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
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Hostel System Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure institution branding, defaults, and data management controls
          </Typography>
        </Box>
        <Box>
          {settings?.demoDataLoaded ? (
            <Chip
              label="Demo Mode (Sample Data Active)"
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />
          ) : (
            <Chip
              icon={<CheckCircleOutlineIcon />}
              label="Live Operations Mode (Clean Real Data)"
              color="success"
              variant="filled"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />
          )}
        </Box>
      </Box>

      {/* Main Configuration Card */}
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSave}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Hostel Details & Policies
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Hostel Name"
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Full Physical Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Primary Contact Number"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="email"
                  label="Official Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
                  Fee & Allocation Defaults
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Hostel Bed Capacity"
                  value={totalBeds}
                  onChange={(e) => setTotalBeds(parseInt(e.target.value) || 0)}
                  helperText="Default capacity is 70 beds across 16 rooms"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Currency Symbol / Code"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Default Monthly Rent (₹)"
                  value={defaultMonthlyRent}
                  onChange={(e) => setDefaultMonthlyRent(parseFloat(e.target.value) || 0)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Default Security Deposit (₹)"
                  value={defaultSecurityDeposit}
                  onChange={(e) => setDefaultSecurityDeposit(parseFloat(e.target.value) || 0)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Payment Due Grace Period (Days)"
                  value={paymentGracePeriodDays}
                  onChange={(e) => setPaymentGracePeriodDays(parseInt(e.target.value) || 0)}
                  helperText="Days past due date before marking overdue"
                  required
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

      {/* Real Data & Dummy Data Controls */}
      <Stack spacing={3}>
        {/* Clear Dummy Data Card */}
        <Card sx={{ borderRadius: 3, border: '1px solid #fed7aa', bgcolor: '#fffaf0' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <DeleteSweepIcon sx={{ color: '#c2410c', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#9a3412' }}>
                Prepare for Real Data (Delete All Dummy Records)
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#7c2d12', mb: 3, lineHeight: 1.6 }}>
              Wipe all sample dummy students, demo fee receipts, and allocation records. Your <strong>16 rooms and 70 beds across 6 floors</strong> will remain intact and will be reset to <strong>AVAILABLE</strong> so you can immediately begin enrolling real students.
            </Typography>

            <Button
              variant="contained"
              color="warning"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setClearConfirmOpen(true)}
              sx={{ fontWeight: 700, bgcolor: '#ea580c', '&:hover': { bgcolor: '#c2410c' } }}
            >
              Clear All Dummy Data (Ready for Real Residents)
            </Button>
          </CardContent>
        </Card>

        {/* Demo Data Management Card */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
              Demo / Testing Data Controls
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              Need to load sample test data for demonstration or evaluation? This will populate the 70 beds with 12 sample students, payments, and overdue alerts.
            </Typography>

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RestartAltIcon />}
              onClick={() => setResetConfirmOpen(true)}
              sx={{ fontWeight: 600 }}
            >
              Load Sample Demo Data (12 Test Students)
            </Button>
          </CardContent>
        </Card>
      </Stack>

      {/* Clear Confirmation Dialog */}
      <ConfirmationDialog
        open={clearConfirmOpen}
        title="Clear All Dummy Data"
        message="Are you sure you want to delete all dummy students and payments? The 16 rooms and 70 beds layout will be preserved and all beds will be marked AVAILABLE for real student admissions."
        confirmText="Yes, Clear Dummy Data"
        confirmColor="warning"
        isLoading={isClearing}
        onConfirm={handleClearDemoData}
        onCancel={() => setClearConfirmOpen(false)}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        open={resetConfirmOpen}
        title="Load Demo Data"
        message="Are you sure you want to populate demo students and payment records? Any custom students currently added will be replaced by demo data."
        confirmText="Yes, Load Demo Data"
        confirmColor="primary"
        isLoading={isResetting}
        onConfirm={handleResetDemoData}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </Box>
  );
};

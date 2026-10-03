import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import SaveIcon from '@mui/icons-material/Save';
import { Student, StudentUpdateRequest } from '../types';
import { studentService } from '../services/studentService';
import { useNotification } from '../context/NotificationContext';

interface EditStudentModalProps {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  initialTab?: number;
  onSuccess: (updatedStudent: Student) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  open,
  onClose,
  student,
  initialTab = 0,
  onSuccess,
}) => {
  const { showSuccess, showError } = useNotification();
  const [tabIndex, setTabIndex] = useState(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields - Personal Info
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternateMobileNumber, setAlternateMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Form Fields - Hostel & Billing
  const [joiningDate, setJoiningDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState<number | string>('');
  const [securityDeposit, setSecurityDeposit] = useState<number | string>('');
  const [paymentDueDay, setPaymentDueDay] = useState<number | string>(5);
  const [nextPaymentDueDate, setNextPaymentDueDate] = useState('');

  // Form Fields - Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Father');
  const [emergencyMobile, setEmergencyMobile] = useState('');

  // Populate state when student changes or modal opens
  useEffect(() => {
    if (student && open) {
      setTabIndex(initialTab);
      setErrorMessage('');
      setFullName(student.fullName || '');
      setFatherName(student.fatherName || '');
      setMotherName(student.motherName || '');
      setDateOfBirth(student.dateOfBirth || '');
      setGender(student.gender || 'Male');
      setMobileNumber(student.mobileNumber || '');
      setAlternateMobileNumber(student.alternateMobileNumber || '');
      setEmail(student.email || '');
      setAadhaarNumber(student.aadhaarNumber || '');
      setAddress(student.address || '');
      setCity(student.city || 'Hyderabad');
      setState(student.state || 'Telangana');
      setPincode(student.pincode || '');

      setJoiningDate(student.joiningDate || '');
      setMonthlyRent(student.monthlyRent ?? 5000);
      setSecurityDeposit(student.securityDeposit ?? 1000);
      setPaymentDueDay(student.paymentDueDay ?? 5);
      setNextPaymentDueDate(student.nextPaymentDueDate || '');

      if (student.emergencyContact) {
        setEmergencyName(student.emergencyContact.name || '');
        setEmergencyRelation(student.emergencyContact.relationship || 'Father');
        setEmergencyMobile(student.emergencyContact.mobileNumber || '');
      } else {
        setEmergencyName('');
        setEmergencyRelation('Father');
        setEmergencyMobile('');
      }
    }
  }, [student, open, initialTab]);

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      setTabIndex(0);
      return;
    }

    const cleanMobile = mobileNumber.trim();
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      setTabIndex(0);
      return;
    }

    if (alternateMobileNumber.trim() && !/^[6-9]\d{9}$/.test(alternateMobileNumber.trim())) {
      setErrorMessage('Alternate phone must be a valid 10-digit mobile number.');
      setTabIndex(0);
      return;
    }

    if (aadhaarNumber.trim() && !/^\d{12}$/.test(aadhaarNumber.trim())) {
      setErrorMessage('Aadhaar number must be exactly 12 digits.');
      setTabIndex(0);
      return;
    }

    const rentNum = Number(monthlyRent);
    if (isNaN(rentNum) || rentNum <= 0) {
      setErrorMessage('Monthly rent must be greater than ₹0.');
      setTabIndex(1);
      return;
    }

    const dueDayNum = Number(paymentDueDay);
    if (dueDayNum && (dueDayNum < 1 || dueDayNum > 31)) {
      setErrorMessage('Payment due day must be between 1 and 31.');
      setTabIndex(1);
      return;
    }

    if (emergencyMobile.trim() && !/^[6-9]\d{9}$/.test(emergencyMobile.trim())) {
      setErrorMessage('Emergency contact phone must be a valid 10-digit mobile number.');
      setTabIndex(2);
      return;
    }

    const payload: StudentUpdateRequest = {
      fullName: fullName.trim(),
      fatherName: fatherName.trim() || undefined,
      motherName: motherName.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender,
      mobileNumber: cleanMobile,
      alternateMobileNumber: alternateMobileNumber.trim() || undefined,
      email: email.trim() || undefined,
      aadhaarNumber: aadhaarNumber.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      pincode: pincode.trim() || undefined,
      joiningDate: joiningDate || undefined,
      nextPaymentDueDate: nextPaymentDueDate || undefined,
      monthlyRent: rentNum,
      securityDeposit: securityDeposit !== '' ? Number(securityDeposit) : undefined,
      paymentDueDay: dueDayNum || 5,
      emergencyContact: emergencyName.trim()
        ? {
            name: emergencyName.trim(),
            relationship: emergencyRelation.trim() || 'Parent',
            mobileNumber: emergencyMobile.trim(),
          }
        : undefined,
    };

    try {
      setIsSaving(true);
      const studentIdentifier = student.id || student.studentId;
      const updated = await studentService.updateStudent(studentIdentifier, payload);
      showSuccess(`Student details for ${updated.fullName} updated successfully!`);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update student details.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: '#1e3a8a',
          color: '#ffffff',
          py: 2.2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
              Edit Student Details
            </Typography>
            <Chip
              label={student.studentId}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            />
            {student.roomNumber && (
              <Chip
                label={`Room ${student.roomNumber} - Bed ${student.bedNumber || student.bedId}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(56, 189, 248, 0.25)',
                  color: '#e0f2fe',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: '#bfdbfe', display: 'block', mt: 0.5 }}>
            Update personal record, contact details, emergency contacts, or fee parameters
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#bfdbfe',
            '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' },
          }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Tabs Bar */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc', px: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_e, val) => setTabIndex(val)}
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              gap: 1,
            },
          }}
        >
          <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Personal Info" />
          <Tab icon={<AccountBalanceWalletIcon fontSize="small" />} iconPosition="start" label="Hostel & Billing" />
          <Tab icon={<ContactEmergencyIcon fontSize="small" />} iconPosition="start" label="Emergency Contact" />
        </Tabs>
      </Box>

      {/* Form Content */}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <DialogContent sx={{ p: 3.5, bgcolor: '#ffffff' }}>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}

          {/* TAB 0: Personal Information */}
          {tabIndex === 0 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name *"
                  fullWidth
                  size="small"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Reddy"
                  required
                  helperText="Official student name as per documents"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mobile Number *"
                  fullWidth
                  size="small"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                  helperText="Primary 10-digit WhatsApp / contact number"
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Father's Name"
                  fullWidth
                  size="small"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="e.g. Srinivasa Rao"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mother's Name"
                  fullWidth
                  size="small"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="e.g. Lakshmi Devi"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  size="small"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Gender"
                  select
                  fullWidth
                  size="small"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Alternate Mobile"
                  fullWidth
                  size="small"
                  value={alternateMobileNumber}
                  onChange={(e) => setAlternateMobileNumber(e.target.value)}
                  placeholder="e.g. 9123456789"
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student@gmail.com"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Aadhaar Card Number"
                  fullWidth
                  size="small"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="12-digit Aadhaar number"
                  inputProps={{ maxLength: 12 }}
                  helperText="Government identification number"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', my: 1 }}>
                  Permanent Address
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Street Address / House No."
                  fullWidth
                  size="small"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. D.No: 4-56/1, Gandhi Road"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="City / Town"
                  fullWidth
                  size="small"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Hyderabad / Tirupati"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="State"
                  fullWidth
                  size="small"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Andhra Pradesh / Telangana"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Pincode"
                  fullWidth
                  size="small"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 500038"
                  inputProps={{ maxLength: 6 }}
                />
              </Grid>
            </Grid>
          )}

          {/* TAB 1: Hostel & Billing Details */}
          {tabIndex === 1 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: '#166534', fontWeight: 700 }}>
                    Active Allocation
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#15803d', mt: 0.5 }}>
                    Room: <strong>{student.roomNumber || 'None'}</strong> | Bed:{' '}
                    <strong>{student.bedNumber ? `Bed ${student.bedNumber}` : student.bedId || 'None'}</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#166534', display: 'block', mt: 0.5 }}>
                    To relocate bed or change room, please use the <strong>Transfer Bed</strong> action on the profile.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Joining Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Date of admission into the hostel"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Monthly Rent (₹) *"
                  type="number"
                  fullWidth
                  size="small"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  required
                  helperText="Standard monthly fee charged"
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Security Deposit (₹)"
                  type="number"
                  fullWidth
                  size="small"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  helperText="Refundable deposit collected at admission"
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Monthly Payment Due Day"
                  type="number"
                  fullWidth
                  size="small"
                  value={paymentDueDay}
                  onChange={(e) => setPaymentDueDay(e.target.value)}
                  helperText="Day of every month (e.g. 5 for 5th of each month)"
                  inputProps={{ min: 1, max: 31 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Next Payment Due Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={nextPaymentDueDate}
                  onChange={(e) => setNextPaymentDueDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Custom due date for upcoming rent collection"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    LAST RECORDED PAYMENT DATE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
                    {student.lastPaymentDate || 'No payment recorded yet'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* TAB 2: Emergency Contact */}
          {tabIndex === 2 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                  Contact person details in case of emergency, medical attention, or fee escalation.
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Person Name"
                  fullWidth
                  size="small"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. K. Srinivasa Rao"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Relationship"
                  select
                  fullWidth
                  size="small"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                >
                  <MenuItem value="Father">Father</MenuItem>
                  <MenuItem value="Mother">Mother</MenuItem>
                  <MenuItem value="Guardian">Guardian</MenuItem>
                  <MenuItem value="Brother">Brother</MenuItem>
                  <MenuItem value="Sister">Sister</MenuItem>
                  <MenuItem value="Uncle">Uncle</MenuItem>
                  <MenuItem value="Friend">Friend</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Emergency Contact Phone"
                  fullWidth
                  size="small"
                  value={emergencyMobile}
                  onChange={(e) => setEmergencyMobile(e.target.value)}
                  placeholder="e.g. 9441843574"
                  inputProps={{ maxLength: 10 }}
                  helperText="10-digit primary emergency phone number"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <Divider />

        {/* Dialog Actions */}
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', gap: 1 }}>
          <Button onClick={onClose} disabled={isSaving} sx={{ color: '#64748b', fontWeight: 600 }}>
            Cancel
          </Button>

          {tabIndex > 0 && (
            <Button onClick={() => setTabIndex(tabIndex - 1)} disabled={isSaving} variant="outlined" sx={{ fontWeight: 600 }}>
              Previous
            </Button>
          )}

          {tabIndex < 2 ? (
            <Button
              onClick={() => setTabIndex(tabIndex + 1)}
              variant="contained"
              sx={{ bgcolor: '#2563eb', fontWeight: 600 }}
            >
              Next
            </Button>
          ) : null}

          <Button
            type="submit"
            variant="contained"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            sx={{
              bgcolor: '#1e3a8a',
              fontWeight: 700,
              px: 3,
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

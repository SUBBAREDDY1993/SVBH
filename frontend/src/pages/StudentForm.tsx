import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { studentService } from '../services/studentService';
import { roomService } from '../services/roomService';
import { Bed, Room, StudentAdmissionRequest } from '../types';
import { useNotification } from '../context/NotificationContext';

export const StudentForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillRoom = searchParams.get('room') || '';
  const prefillBed = searchParams.get('bed') || '';

  const { showSuccess, showError } = useNotification();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
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
  const [city, setCity] = useState('Tirupati');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('517502');

  // Hostel Allocation
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState(prefillRoom);
  const [selectedBed, setSelectedBed] = useState(prefillBed);
  const [monthlyRent, setMonthlyRent] = useState(5000);
  const [securityDeposit, setSecurityDeposit] = useState(5000);
  const [paymentDueDay, setPaymentDueDay] = useState(5);

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Father');
  const [emergencyMobile, setEmergencyMobile] = useState('');

  // Load rooms with beds
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoadingRooms(true);
        const data = await roomService.getAllRooms(true);
        setRooms(data);

        if (prefillRoom) {
          const matched = data.find((r) => r.roomNumber === prefillRoom);
          if (matched && matched.beds) {
            const avail = matched.beds.filter((b) => b.status === 'AVAILABLE');
            setAvailableBeds(avail);
            if (matched.defaultRent) setMonthlyRent(matched.defaultRent);
          }
        }
      } catch (err) {
        console.error('Failed to load rooms:', err);
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [prefillRoom]);

  // When room changes, filter available beds
  const handleRoomChange = (roomNum: string) => {
    setSelectedRoom(roomNum);
    setSelectedBed('');
    const matched = rooms.find((r) => r.roomNumber === roomNum);
    if (matched && matched.beds) {
      const avail = matched.beds.filter((b) => b.status === 'AVAILABLE');
      setAvailableBeds(avail);
      if (matched.defaultRent) {
        setMonthlyRent(matched.defaultRent);
      }
    } else {
      setAvailableBeds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showError('Please enter student full name');
      return;
    }
    if (!mobileNumber.trim() || !/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
      showError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!selectedRoom) {
      showError('Please select a room');
      return;
    }
    if (!selectedBed) {
      showError('Please select an available bed');
      return;
    }
    if (monthlyRent <= 0) {
      showError('Monthly rent must be greater than 0');
      return;
    }

    const payload: StudentAdmissionRequest = {
      fullName: fullName.trim(),
      fatherName: fatherName.trim() || undefined,
      motherName: motherName.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender,
      mobileNumber: mobileNumber.trim(),
      alternateMobileNumber: alternateMobileNumber.trim() || undefined,
      email: email.trim() || undefined,
      aadhaarNumber: aadhaarNumber.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      pincode: pincode.trim() || undefined,
      joiningDate,
      roomNumber: selectedRoom,
      bedId: selectedBed,
      monthlyRent,
      securityDeposit,
      paymentDueDay,
      emergencyContact: emergencyName.trim()
        ? {
            name: emergencyName.trim(),
            relationship: emergencyRelation.trim(),
            mobileNumber: emergencyMobile.trim(),
          }
        : undefined,
    };

    try {
      setIsSubmitting(true);
      const admitted = await studentService.admitStudent(payload);
      showSuccess(`Student ${admitted.fullName} successfully admitted! Allocated to Bed ${selectedBed}.`);
      navigate(`/students/${admitted.studentId}`);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to admit student');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ pb: 4, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/students')} color="inherit">
          Back to Students
        </Button>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            New Student Admission
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Register new resident and assign available room & bed
          </Typography>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
              1. Personal Information
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name *"
                  fullWidth
                  size="small"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Reddy"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mobile Number (10 digits) *"
                  fullWidth
                  size="small"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Father's Name"
                  fullWidth
                  size="small"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mother's Name"
                  fullWidth
                  size="small"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
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
                  select
                  label="Gender"
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
                  label="Aadhaar Number (12 digits)"
                  fullWidth
                  size="small"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="e.g. 123456789012"
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
                  label="Alternate Mobile"
                  fullWidth
                  size="small"
                  value={alternateMobileNumber}
                  onChange={(e) => setAlternateMobileNumber(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Permanent Address"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House number, Street, Village/Town"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="City"
                  fullWidth
                  size="small"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="State"
                  fullWidth
                  size="small"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Pincode"
                  fullWidth
                  size="small"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Step 2: Room & Bed Allocation */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
              2. Room & Bed Allocation
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Select Room *"
                  fullWidth
                  size="small"
                  value={selectedRoom}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  disabled={isLoadingRooms}
                >
                  <MenuItem value="">-- Select Room --</MenuItem>
                  {rooms.map((r) => (
                    <MenuItem key={r.id} value={r.roomNumber}>
                      Room {r.roomNumber} (Floor {r.floor} • {r.availableBeds} beds available)
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Select Available Bed *"
                  fullWidth
                  size="small"
                  value={selectedBed}
                  onChange={(e) => setSelectedBed(e.target.value)}
                  disabled={!selectedRoom || availableBeds.length === 0}
                  helperText={
                    selectedRoom && availableBeds.length === 0
                      ? 'No available beds in this room'
                      : 'Only AVAILABLE beds are shown'
                  }
                >
                  <MenuItem value="">-- Select Bed --</MenuItem>
                  {availableBeds.map((b) => (
                    <MenuItem key={b.id} value={b.bedId}>
                      Bed #{b.bedNumber} ({b.bedId})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Joining Date *"
                  type="date"
                  fullWidth
                  size="small"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Monthly Rent (₹) *"
                  type="number"
                  fullWidth
                  size="small"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Security Deposit (₹)"
                  type="number"
                  fullWidth
                  size="small"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Monthly Payment Due Day of Month"
                  type="number"
                  fullWidth
                  size="small"
                  value={paymentDueDay}
                  onChange={(e) => setPaymentDueDay(Number(e.target.value))}
                  helperText="e.g. 5 = due on 5th of every month"
                  inputProps={{ min: 1, max: 28 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Step 3: Emergency Contact */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
              3. Emergency Contact Details
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Contact Person Name"
                  fullWidth
                  size="small"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Relationship"
                  fullWidth
                  size="small"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  placeholder="e.g. Father, Brother, Guardian"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Emergency Mobile Number"
                  fullWidth
                  size="small"
                  value={emergencyMobile}
                  onChange={(e) => setEmergencyMobile(e.target.value)}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={() => navigate('/students')} color="inherit">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<PersonAddIcon />}
                disabled={isSubmitting}
                sx={{ bgcolor: '#2563eb', px: 4, fontWeight: 700 }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Confirm Admission & Allocate Bed'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

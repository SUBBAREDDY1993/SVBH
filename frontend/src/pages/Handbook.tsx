import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PeopleIcon from '@mui/icons-material/People';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PaymentIcon from '@mui/icons-material/Payment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import ChecklistIcon from '@mui/icons-material/Checklist';
import SecurityIcon from '@mui/icons-material/Security';

export const Handbook: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/HOSTEL_OPERATIONS_HANDBOOK.md';
    link.download = 'SVBH_Hostel_Operations_Handbook.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems = [
    { id: 'overview', title: '1. System & Facility Overview', icon: <MenuBookIcon fontSize="small" /> },
    { id: 'roles', title: '2. Access Control & User Roles', icon: <SecurityIcon fontSize="small" /> },
    { id: 'rooms', title: '3. Room & Bed Inventory', icon: <MeetingRoomIcon fontSize="small" /> },
    { id: 'admission', title: '4. Resident Admission', icon: <PeopleIcon fontSize="small" /> },
    { id: 'allocation', title: '5. Bed Transfers', icon: <SwapHorizIcon fontSize="small" /> },
    { id: 'payments', title: '6. Fee Collection & Receipts', icon: <PaymentIcon fontSize="small" /> },
    { id: 'reminders', title: '7. Dues & Automated Reminders', icon: <NotificationsActiveIcon fontSize="small" /> },
    { id: 'vacate', title: '8. Notice Period & Vacating', icon: <ExitToAppIcon fontSize="small" /> },
    { id: 'reports', title: '9. Reports & Analytics', icon: <AssessmentIcon fontSize="small" /> },
    { id: 'settings', title: '10. System Administration', icon: <SettingsIcon fontSize="small" /> },
    { id: 'checklist', title: '11. Daily Operations Checklist', icon: <ChecklistIcon fontSize="small" /> },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: '#eff6ff',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MenuBookIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
                Hostel Operations Handbook
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Standard Operating Procedures (SOP) & Complete User Manual
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }} className="no-print">
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ fontWeight: 700, borderColor: '#cbd5e1', color: '#334155', textTransform: 'none' }}
          >
            Print / Save PDF
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Download Handbook (.md)
          </Button>
        </Box>
      </Box>

      {/* Official Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3.5,
          borderRadius: 3,
          bgcolor: '#f8fafc',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e3a8a' }}>
            Sri Venkateswara Boys Hostel - Administrative Manual
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569', mt: 0.3 }}>
            📍 Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3 }}>
            📞 Helpline: <strong>+91 9441843574</strong> • ✉️ Email: <strong>svbhostel2026@gmail.com</strong>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label="Version 1.0.0" size="small" sx={{ fontWeight: 700, bgcolor: '#e2e8f0' }} />
          <Chip label="Capacity: 70 Beds" color="primary" size="small" sx={{ fontWeight: 700 }} />
          <Chip label="6 Floors" color="secondary" size="small" sx={{ fontWeight: 700 }} />
        </Box>
      </Paper>

      {/* Content Layout */}
      <Grid container spacing={3}>
        {/* Left Side: Table of Contents */}
        <Grid item xs={12} md={3.5} className="no-print">
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              position: 'sticky',
              top: 84,
              border: '1px solid #e2e8f0',
            }}
          >
            <TextField
              size="small"
              fullWidth
              placeholder="Search operations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
              }}
              sx={{ mb: 2 }}
            />

            <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, px: 1 }}>
              Table of Contents
            </Typography>

            <List sx={{ mt: 1, p: 0 }}>
              {navItems.map((item) => (
                <ListItemButton
                  key={item.id}
                  selected={activeSection === item.id}
                  onClick={() => scrollTo(item.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    py: 0.8,
                    '&.Mui-selected': {
                      bgcolor: '#eff6ff',
                      color: '#1d4ed8',
                      fontWeight: 700,
                    },
                  }}
                >
                  <Box sx={{ mr: 1.5, display: 'flex', color: activeSection === item.id ? '#1d4ed8' : '#64748b' }}>
                    {item.icon}
                  </Box>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.84rem',
                      fontWeight: activeSection === item.id ? 700 : 500,
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Right Side: Handbook Documentation Chapters */}
        <Grid item xs={12} md={8.5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Section 1: Overview */}
            <Card id="overview" sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                  1. System & Facility Overview
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, mb: 2 }}>
                  The <strong>Sri Venkateswara Boys Hostel Management System</strong> is a full-featured management software designed to automate admissions, bed tracking, fee collections, automated morning and evening payment reminders, and room maintenance across 6 building floors.
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e3a8a' }}>6</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Floors</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e3a8a' }}>16</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Rooms</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#16a34a' }}>70</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Total Beds</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#9333ea' }}>₹5,000</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Base Rent</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mt: 2 }}>
                  Floor Distribution:
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, lineHeight: 1.6 }}>
                  • <strong>Floors 1 to 4:</strong> 3 Rooms each (13 beds per floor)<br />
                  • <strong>Floor 5:</strong> 2 Rooms (8 beds)<br />
                  • <strong>Floor 6:</strong> 2 Rooms (10 beds)
                </Typography>
              </CardContent>
            </Card>

            {/* Section 2: Roles */}
            <Card id="roles" sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                  2. Access Control & User Roles
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, mb: 2 }}>
                  Authentication uses secure JSON Web Tokens (JWT). The system provides two role levels:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Paper sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e3a8a' }}>
                      👑 ROLE_ADMIN (Owner / Chief Warden)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                      Full administrative access: Admitting and vacating residents, creating/editing rooms, adding extra beds, recording payments, triggering reminder batches, accessing financial reports, changing institutional settings, and database reset tools.
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#059669' }}>
                      👔 ROLE_STAFF (Reception / Assistant Warden)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                      Operational access: Admitting students, recording cash/UPI payments, viewing payment dues, generating receipts, sending individual WhatsApp reminders, and conducting bed transfers.
                    </Typography>
                  </Paper>
                </Box>
              </CardContent>
            </Card>

            {/* Section 3: Room & Bed Inventory */}
            <Card id="rooms" sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                  3. Room & Bed Inventory Management
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, mb: 2 }}>
                  Bed identifiers strictly follow the international format: <code>B&lt;RoomNumber&gt;-&lt;BedNumber&gt;</code> (e.g. <code>B101-1</code>, <code>B204-3</code>).
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mt: 2 }}>
                  Bed Status Flow:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, my: 1.5, flexWrap: 'wrap' }}>
                  <Chip label="AVAILABLE (Vacant & Ready)" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
                  <Chip label="OCCUPIED (Resident Staying)" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }} />
                  <Chip label="RESERVED (Advance Paid)" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }} />
                  <Chip label="MAINTENANCE (Repair/Cleaning)" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700 }} />
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mt: 2 }}>
                  Operations on Rooms:
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, mt: 0.5 }}>
                  1. <strong>Create Room:</strong> Click <em>+ Add Room</em> on <code>/rooms</code>. Specify Room Number, Floor, Beds count (auto-creates beds 1..N), Room Type, and Default Rent.<br />
                  2. <strong>Edit Room:</strong> Click pencil icon. You can modify Floor, Room Type, Default Monthly Rent, and remarks without altering bed records.<br />
                  3. <strong>Add Extra Bed:</strong> Click <em>Add Extra Bed to Room X</em>. The system automatically computes the next bed ID (e.g. <code>B101-5</code>) and updates capacity.
                </Typography>
              </CardContent>
            </Card>

            {/* Section 4: Admission */}
            <Card id="admission" sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                  4. Resident Admission & Onboarding
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                  Admitting a resident registers their profile, assigns a unique Student ID (e.g. <code>SVBH-2026-0012</code>), and immediately switches the selected bed from <code>AVAILABLE</code> to <code>OCCUPIED</code>.
                </Typography>

                <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Admission Steps:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, mt: 0.5 }}>
                    1. Navigate to <strong>Students</strong> &rarr; <strong>+ Admit Student</strong>.<br />
                    2. Fill in Resident Full Name, Mobile Number, Father/Mother Name, Date of Birth, and Aadhaar ID.<br />
                    3. Provide Emergency Contact person and relationship.<br />
                    4. Select an <strong>Available Bed</strong> from the live bed picker dropdown.<br />
                    5. Set Monthly Rent (₹), Security Deposit (₹), and Payment Due Day (e.g. 1st or 5th of each month).<br />
                    6. Submit to complete admission.
                  </Typography>
                </Paper>
              </CardContent>
            </Card>

            {/* Section 5: Bed Allocation & Transfers */}
            <Card id="allocation" sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                  5. Bed Allocation & Room Transfers
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                  When a student wishes to change rooms or floors:
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
                  1. Navigate to <strong>Allocations</strong> (<code>/allocations</code>).<br />
                  2. Click <strong>Transfer Bed</strong>.<br />
                  3. Pick the student from the active list.<br />
                  4. Select the target bed from available beds.<br />
                  5. Enter a brief reason (e.g. "Shifted to AC room", "Lower floor").<br />
                  6. Confirm: Previous bed automatically becomes <strong>AVAILABLE</strong>; new bed becomes <strong>OCCUPIED</strong>.
                </Typography>
              </CardContent>
            </Card>

            {/* Section 6: Fee Collection */}
            <Card id="payments" sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                  6. Fee Collection & Official Receipts
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                  Recording payments automatically updates the resident's ledger, advances their next due date by 1 month, and produces official print-ready receipts.
                </Typography>

                <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Payment Workflow:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, mt: 0.5 }}>
                    • Select Student &rarr; Enter Amount Paid (₹) & Payment Mode (UPI / Cash / Bank Transfer).<br />
                    • Select billing month (e.g. September 2026) and enter transaction UTR number.<br />
                    • Submit: System generates receipt code <code>REC-2026-XXXX</code>.<br />
                    • Click <strong>Print Receipt</strong> to print an official A4 portrait copy with institution letterhead, stamp space, and barcode.
                  </Typography>
                </Paper>
              </CardContent>
            </Card>

            {/* Section 7: Dues & Reminders */}
            <Card id="reminders" sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                  7. Payment Due Tracking & Automated Reminders
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, mb: 2 }}>
                  The hostel operates an automated fee reminder system running twice daily:
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                  <Paper sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534' }}>
                      ⏰ Automated Daily Schedulers (3 Days Before Due Date)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#15803d', mt: 0.5 }}>
                      • <strong>Morning Batch:</strong> 9:00 AM (Daily)<br />
                      • <strong>Evening Batch:</strong> 6:00 PM (Daily)<br />
                      • Targets residents whose rent is due within 3 days, due today, or overdue.<br />
                      • Prevents duplicate reminder spamming for the same slot on the same day.
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1d4ed8' }}>
                      🟢 1-Click WhatsApp Reminders
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1e40af', mt: 0.5 }}>
                      Click the green WhatsApp icon on any student row in <code>/payments/due</code> to immediately open WhatsApp Web or mobile with a pre-filled, professional fee reminder containing student name, room, bed, rent, due date, and hostel payment instructions.
                    </Typography>
                  </Paper>
                </Box>
              </CardContent>
            </Card>

            {/* Section 8: Vacating */}
            <Card id="vacate" sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                  8. Notice Period & Vacating Procedures
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                  Hostel policy requires a 15-day notice period before departure:
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
                  1. <strong>Placing on Notice:</strong> Open student profile &rarr; Click <em>Notice Period</em> &rarr; Set expected vacate date (default 15 days).<br />
                  2. <strong>Vacating Student:</strong> On checkout day, click <em>Vacate Student</em> (Admin only).<br />
                  3. <strong>Deposit Settlement:</strong> System calculates security deposit refund minus any outstanding rent or room repair charges.<br />
                  4. <strong>Bed Auto-Release:</strong> The student is marked <code>VACATED</code> and the bed is instantly restored to <strong>AVAILABLE</strong> status.
                </Typography>
              </CardContent>
            </Card>

            {/* Section 9: Reports */}
            <Card id="reports" sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                  9. Reports, Analytics & Financial Reconciliation
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                  Access comprehensive metrics under <strong>Reports</strong> (<code>/reports</code>):
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
                  • <strong>Revenue Analytics:</strong> Monthly revenue charts and annual totals.<br />
                  • <strong>Payment Mode Distribution:</strong> Percentage and rupees collected via UPI vs Cash vs Bank Transfer.<br />
                  • <strong>Occupancy Rates:</strong> Overall hostel occupancy percentage and breakdown by floor.<br />
                  • <strong>Printable Reports:</strong> Click <em>Print Report</em> for monthly accounting audits.
                </Typography>
              </CardContent>
            </Card>

            {/* Section 10: Settings */}
            <Card id="settings" sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                  10. System Administration & Institution Settings
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                  Administrators can customize institutional parameters from <strong>Settings</strong> (<code>/settings</code>):
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
                  • <strong>Hostel Details:</strong> Sri Venkateswara Boys Hostel, Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038.<br />
                  • <strong>Helpline Phone:</strong> +91 9441843574 • <strong>Email:</strong> svbhostel2026@gmail.com.<br />
                  • <strong>Financial Defaults:</strong> Default monthly rent, security deposit, and 5-day grace period.
                </Typography>
              </CardContent>
            </Card>

            {/* Section 11: Daily Checklist */}
            <Card id="checklist" sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                  11. Daily Operations Checklist
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper sx={{ p: 2, bgcolor: '#fefce8', border: '1px solid #fef08a', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#854d0e' }}>
                      🌅 Morning Routine (9:00 AM - 10:00 AM)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#713f12', lineHeight: 1.7, mt: 0.5 }}>
                      ☑ Check Dashboard for overdue payments and pending collections.<br />
                      ☑ Verify automated 9:00 AM morning reminder batch dispatch.<br />
                      ☑ Click WhatsApp button for critical overdue residents.<br />
                      ☑ Check Available beds for incoming inquiries.
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, bgcolor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#5b21b6' }}>
                      🌆 Evening Routine (5:30 PM - 7:00 PM)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4c1d95', lineHeight: 1.7, mt: 0.5 }}>
                      ☑ Verify automated 6:00 PM evening reminder batch.<br />
                      ☑ Record all cash and UPI fee payments collected during the day.<br />
                      ☑ Issue printed official receipts to paying students.<br />
                      ☑ Review departure notices scheduled for today.
                    </Typography>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

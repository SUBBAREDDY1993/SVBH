import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsIcon from '@mui/icons-material/Sms';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PhoneIcon from '@mui/icons-material/Phone';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { PaymentDue } from '../types';
import { reminderService } from '../services/reminderService';
import { useNotification } from '../context/NotificationContext';

interface PaymentReminderModalProps {
  open: boolean;
  onClose: () => void;
  dueItem: PaymentDue | null;
  onReminderLogged?: () => void;
}

export const PaymentReminderModal: React.FC<PaymentReminderModalProps> = ({
  open,
  onClose,
  dueItem,
  onReminderLogged,
}) => {
  const { showSuccess, showError } = useNotification();
  const [templateType, setTemplateType] = useState<number>(0); // 0: Morning, 1: Evening, 2: Urgent
  const [customMessage, setCustomMessage] = useState<string>('');

  useEffect(() => {
    if (!dueItem) return;

    const daysOverdue = dueItem.daysOverdue || 0;
    const isOverdue = dueItem.overdue || daysOverdue > 0;
    const dueDateStr = dueItem.nextPaymentDueDate || 'N/A';
    const rentStr = dueItem.monthlyRent?.toLocaleString('en-IN') || '0';

    let statusLine = '';
    if (isOverdue) {
      statusLine = `your monthly hostel rent is *${daysOverdue} days OVERDUE* (Due date: ${dueDateStr})`;
    } else if (daysOverdue === 0 && dueItem.dueCategory === 'DUE_TODAY') {
      statusLine = `your monthly hostel rent is *DUE TODAY* (${dueDateStr})`;
    } else {
      statusLine = `your monthly hostel rent of ₹${rentStr} is *due soon on ${dueDateStr}*`;
    }

    if (templateType === 0) {
      // Morning Template
      setCustomMessage(
        `📢 *Sri Venkateswara Boys Hostel - Fee Reminder*\n\n` +
          `Good morning ${dueItem.studentName},\n\n` +
          `This is a gentle morning reminder that ${statusLine}.\n\n` +
          `🏠 *Room & Bed:* Room ${dueItem.roomNumber} (Bed ${dueItem.bedId})\n` +
          `💰 *Amount Due:* ₹${rentStr}\n` +
          `📅 *Due Date:* ${dueDateStr}\n\n` +
          `💳 *Payment Options:*\n` +
          `Please pay via UPI or Cash at the hostel office. Kindly share the screenshot to collect your receipt.\n\n` +
          `_If you have already paid, kindly ignore this message._\n\n` +
          `Have a great day ahead!\n` +
          `- Sri Venkateswara Boys Hostel Management\n` +
          `📍 Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038\n` +
          `📞 Phone: +91 9441843574 | ✉️ svbhostel2026@gmail.com`
      );
    } else if (templateType === 1) {
      // Evening Template
      setCustomMessage(
        `📢 *Sri Venkateswara Boys Hostel - Fee Reminder*\n\n` +
          `Good evening ${dueItem.studentName},\n\n` +
          `Following up on your hostel accommodation fee: ${statusLine}.\n\n` +
          `🏠 *Room & Bed:* Room ${dueItem.roomNumber} (Bed ${dueItem.bedId})\n` +
          `💰 *Amount Due:* ₹${rentStr}\n` +
          `📅 *Due Date:* ${dueDateStr}\n\n` +
          `Please ensure the payment is completed today to avoid any inconvenience.\n\n` +
          `_If already paid, please ignore this notice._\n\n` +
          `Thank you,\n` +
          `- Sri Venkateswara Boys Hostel Management\n` +
          `📍 Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038\n` +
          `📞 Phone: +91 9441843574 | ✉️ svbhostel2026@gmail.com`
      );
    } else {
      // Urgent / Overdue Notice Template
      setCustomMessage(
        `⚠️ *IMPORTANT NOTICE: Hostel Fee Overdue*\n\n` +
          `Dear ${dueItem.studentName},\n\n` +
          `Your hostel fee of *₹${rentStr}* for Room ${dueItem.roomNumber} (Bed ${dueItem.bedId}) is pending (Due Date: ${dueDateStr}).\n\n` +
          `Please clear your outstanding balance immediately at the office or via UPI to keep your accommodation active.\n\n` +
          `_Kindly ignore if payment is already in progress._\n\n` +
          `Hostel Office Helpline:\n` +
          `Sri Venkateswara Boys Hostel\n` +
          `📍 Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038\n` +
          `📞 Phone: +91 9441843574 | ✉️ svbhostel2026@gmail.com`
      );
    }
  }, [dueItem, templateType]);

  if (!dueItem) return null;

  const sanitizePhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9]/g, '');
    return digits.length === 10 ? `91${digits}` : digits;
  };

  const cleanPhone = sanitizePhone(dueItem.mobileNumber);

  const handleWhatsApp = async () => {
    if (!cleanPhone) {
      showError('No valid mobile number found for this student');
      return;
    }
    try {
      await reminderService.recordManualReminder(dueItem.studentId, 'WHATSAPP', customMessage);
      onReminderLogged?.();
    } catch (e) {
      console.warn('Could not record reminder log:', e);
    }

    const encoded = encodeURIComponent(customMessage);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
    showSuccess(`Opened WhatsApp for ${dueItem.studentName}`);
    onClose();
  };

  const handleSms = async () => {
    if (!cleanPhone) {
      showError('No valid mobile number found');
      return;
    }
    try {
      await reminderService.recordManualReminder(dueItem.studentId, 'SMS', customMessage);
      onReminderLogged?.();
    } catch (e) {
      console.warn('Could not record reminder log:', e);
    }

    const encoded = encodeURIComponent(customMessage);
    window.location.href = `sms:+${cleanPhone}?body=${encoded}`;
    showSuccess(`Launched SMS for ${dueItem.studentName}`);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    showSuccess('Reminder message copied to clipboard!');
  };

  const handleCall = () => {
    if (!dueItem.mobileNumber) return;
    window.location.href = `tel:${dueItem.mobileNumber}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              bgcolor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WhatsAppIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#0f172a' }}>
              Send Fee Reminder
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Communicate fee due via WhatsApp, SMS, or Phone Call
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5, pb: 2 }}>
        {/* Resident Summary Info Card */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 2.5,
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#3b82f6', fontWeight: 800 }}>
              {dueItem.studentName ? dueItem.studentName.charAt(0).toUpperCase() : 'S'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {dueItem.studentName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                ID: {dueItem.studentId} • Room {dueItem.roomNumber} ({dueItem.bedId})
              </Typography>
              <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 700 }}>
                📞 {dueItem.mobileNumber || 'No number'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#dc2626', lineHeight: 1.1 }}>
              ₹{dueItem.monthlyRent?.toLocaleString('en-IN')}
            </Typography>
            <Chip
              label={
                dueItem.overdue
                  ? `${dueItem.daysOverdue}d Overdue`
                  : dueItem.dueCategory === 'DUE_TODAY'
                  ? 'Due Today'
                  : 'Due in 3d'
              }
              size="small"
              sx={{
                mt: 0.5,
                fontWeight: 700,
                fontSize: '0.72rem',
                bgcolor: dueItem.overdue ? '#fee2e2' : '#fef3c7',
                color: dueItem.overdue ? '#b91c1c' : '#b45309',
              }}
            />
          </Box>
        </Paper>

        {/* Template Selectors */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', mb: 1, display: 'block' }}>
          Choose Message Tone
        </Typography>
        <Tabs
          value={templateType}
          onChange={(_e, v) => setTemplateType(v)}
          variant="fullWidth"
          sx={{
            minHeight: 38,
            mb: 2,
            bgcolor: '#f1f5f9',
            borderRadius: 2,
            p: 0.5,
            '& .MuiTab-root': {
              minHeight: 32,
              borderRadius: 1.5,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              transition: 'all 0.2s',
            },
            '& .Mui-selected': {
              bgcolor: '#ffffff',
              color: '#1e40af !important',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            },
            '& .MuiTabs-indicator': {
              display: 'none',
            },
          }}
        >
          <Tab icon={<WbSunnyIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Morning" />
          <Tab icon={<NightsStayIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Evening" />
          <Tab icon={<WarningAmberIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Urgent Notice" />
        </Tabs>

        {/* Message Preview / Editor */}
        <TextField
          label="Reminder Message Preview (Editable)"
          multiline
          rows={7}
          fullWidth
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              bgcolor: '#ffffff',
            },
          }}
        />
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Copy message text">
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopy}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#475569', borderColor: '#cbd5e1' }}
            >
              Copy
            </Button>
          </Tooltip>

          {dueItem.mobileNumber && (
            <Tooltip title="Call resident now">
              <Button
                variant="outlined"
                size="small"
                color="info"
                startIcon={<PhoneIcon />}
                onClick={handleCall}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Call
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Open device SMS app">
            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<SmsIcon />}
              onClick={handleSms}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              SMS
            </Button>
          </Tooltip>
        </Box>

        <Button
          variant="contained"
          size="medium"
          startIcon={<WhatsAppIcon />}
          onClick={handleWhatsApp}
          sx={{
            bgcolor: '#25D366',
            color: '#ffffff',
            fontWeight: 800,
            textTransform: 'none',
            px: 3,
            '&:hover': {
              bgcolor: '#1eb857',
            },
          }}
        >
          Send on WhatsApp
        </Button>
      </DialogActions>
    </Dialog>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import ReplayIcon from '@mui/icons-material/Replay';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { PaymentReminder } from '../types';
import { reminderService } from '../services/reminderService';
import { useNotification } from '../context/NotificationContext';

interface WhatsAppBatchModalProps {
  open: boolean;
  onClose: () => void;
  slot: string;
  reminders: PaymentReminder[];
  onRefresh?: () => void;
}

export const WhatsAppBatchModal: React.FC<WhatsAppBatchModalProps> = ({
  open,
  onClose,
  slot,
  reminders,
  onRefresh,
}) => {
  const { showSuccess, showError } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'SENT'>('ALL');
  const [sentStudentIds, setSentStudentIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Initialize sent set from reminders that already have status "SENT" or "DISPATCHED"
  useEffect(() => {
    if (reminders && reminders.length > 0) {
      const alreadySent = new Set<string>();
      reminders.forEach((r) => {
        if (r.status === 'SENT' && r.channel?.includes('SMS')) {
          alreadySent.add(r.studentId);
        }
      });
      setSentStudentIds(alreadySent);
    }
  }, [reminders]);

  const sanitizePhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9]/g, '');
    return digits.length === 10 ? `91${digits}` : digits;
  };

  const handleOpenSingleWhatsApp = (reminder: PaymentReminder) => {
    const cleanPhone = sanitizePhone(reminder.mobileNumber);
    if (!cleanPhone) {
      showError(`No valid mobile number found for ${reminder.studentName}`);
      return;
    }

    // Build URL if not present
    let url = reminder.whatsappUrl;
    if (!url) {
      const encodedMsg = encodeURIComponent(reminder.message);
      url = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
    }

    // Mark as sent in local state
    setSentStudentIds((prev) => new Set(prev).add(reminder.studentId));

    // Record in backend log
    reminderService.recordManualReminder(reminder.studentId, 'WHATSAPP', reminder.message).catch(() => {});

    // Open WhatsApp
    window.open(url, '_blank');
    showSuccess(`Opened WhatsApp chat for ${reminder.studentName}`);
  };

  const handleCopyMessage = (reminder: PaymentReminder) => {
    navigator.clipboard.writeText(reminder.message);
    setCopiedId(reminder.studentId);
    showSuccess(`Personalized fee message for ${reminder.studentName} copied!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyAllPhones = () => {
    const phones = reminders
      .map((r) => r.mobileNumber?.replace(/[^0-9]/g, ''))
      .filter((p) => !!p && p.length === 10);
    const uniquePhones = Array.from(new Set(phones)).join(', ');
    navigator.clipboard.writeText(uniquePhones);
    showSuccess(`Copied ${phones.length} phone numbers to clipboard for WhatsApp Broadcast!`);
  };

  const handleCopyNoticeTemplate = () => {
    const template =
      `📢 *Sri Venkateswara Boys Hostel - Fee Reminder*\n\n` +
      `Dear Residents,\n\n` +
      `This is a friendly reminder that hostel monthly rent dues are pending for this month.\n\n` +
      `💳 *Payment Options:*\n` +
      `• Pay via UPI: *9441843574@ybl* (PhonePe / Google Pay / Paytm: *9441843574*)\n` +
      `• Or pay in cash at the hostel office\n\n` +
      `Kindly reply with your transaction screenshot to receive your official rent receipt.\n\n` +
      `Thank you,\n*Sri Venkateswara Boys Hostel Management*\n` +
      `📍 Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038\n` +
      `📞 Phone: +91 9441843574 | ✉️ svbhostel2026@gmail.com`;
    navigator.clipboard.writeText(template);
    showSuccess('Copied general fee reminder notice template to clipboard!');
  };

  // Find next pending resident for 1-click Auto-Advance
  const nextPendingStudent = reminders.find((r) => !sentStudentIds.has(r.studentId));

  const handleSendNext = () => {
    if (nextPendingStudent) {
      handleOpenSingleWhatsApp(nextPendingStudent);
    }
  };

  const handleResetLock = async () => {
    try {
      setIsResetting(true);
      await reminderService.resetToday(slot);
      showSuccess(`Today's duplicate lock for ${slot} reminders cleared! You can now resend.`);
      setSentStudentIds(new Set());
      onRefresh?.();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to clear reminder duplicate lock');
    } finally {
      setIsResetting(false);
    }
  };

  // Filtered list
  const filteredList = reminders.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.roomNumber && r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.mobileNumber && r.mobileNumber.includes(searchTerm));

    if (!matchesSearch) return false;

    const isSent = sentStudentIds.has(r.studentId);
    if (filterTab === 'PENDING') return !isSent;
    if (filterTab === 'SENT') return isSent;
    return true;
  });

  const sentCount = sentStudentIds.size;
  const totalCount = reminders.length;
  const progressPercent = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;
  const totalAmount = reminders.reduce((sum, r) => sum + (r.amountDue || 0), 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          maxHeight: '90vh',
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          bgcolor: '#065f46',
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
            <WhatsAppIcon sx={{ fontSize: 26, color: '#34d399' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              WhatsApp Batch Reminder Dispatcher
            </Typography>
            <Chip
              label={`${slot} SLOT`}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            />
            <Chip
              label={`${totalCount} Residents • ₹${totalAmount.toLocaleString('en-IN')}`}
              size="small"
              sx={{
                bgcolor: '#34d399',
                color: '#064e3b',
                fontWeight: 800,
                fontSize: '0.75rem',
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#a7f3d0', display: 'block', mt: 0.5 }}>
            Send personalized WhatsApp reminders directly to each resident's phone with pre-filled fee details and UPI instructions
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#a7f3d0',
            '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' },
          }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Progress & Quick Action Bar */}
      <Box sx={{ bgcolor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065f46' }}>
              Dispatch Progress:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#047857' }}>
              {sentCount} of {totalCount} sent ({progressPercent}%)
            </Typography>
          </Box>

          {/* Quick Buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon fontSize="small" />}
              onClick={handleCopyAllPhones}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                borderColor: '#6ee7b7',
                color: '#065f46',
                bgcolor: '#ffffff',
                '&:hover': { bgcolor: '#ecfdf5', borderColor: '#34d399' },
              }}
            >
              Copy Phone Numbers (Broadcast)
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon fontSize="small" />}
              onClick={handleCopyNoticeTemplate}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                borderColor: '#6ee7b7',
                color: '#065f46',
                bgcolor: '#ffffff',
                '&:hover': { bgcolor: '#ecfdf5', borderColor: '#34d399' },
              }}
            >
              Copy Notice Template
            </Button>

            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<ReplayIcon fontSize="small" />}
              disabled={isResetting}
              onClick={handleResetLock}
              title="Clears the system duplicate lock so batch reminders can be re-run freshly"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                bgcolor: '#ffffff',
              }}
            >
              Reset Duplicate Lock
            </Button>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: '#d1fae5',
            '& .MuiLinearProgress-bar': { bgcolor: '#059669', borderRadius: 4 },
          }}
        />

        {/* 1-Click Send Next Button */}
        {nextPendingStudent ? (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: '#ffffff',
              borderRadius: 2,
              border: '1.5px solid #34d399',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#047857', letterSpacing: 0.5 }}>
                ⚡ NEXT RESIDENT IN QUEUE:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {nextPendingStudent.studentName}{' '}
                <span style={{ color: '#64748b', fontWeight: 600 }}>
                  (Room {nextPendingStudent.roomNumber} - Bed {nextPendingStudent.bedId})
                </span>
                {' • '}
                <span style={{ color: '#dc2626', fontWeight: 800 }}>
                  ₹{nextPendingStudent.amountDue?.toLocaleString('en-IN')}
                </span>
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="medium"
              color="success"
              startIcon={<SendIcon />}
              onClick={handleSendNext}
              sx={{
                bgcolor: '#059669',
                fontWeight: 800,
                textTransform: 'none',
                px: 2.5,
                boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)',
                '&:hover': { bgcolor: '#047857' },
              }}
            >
              Send Next via WhatsApp
            </Button>
          </Box>
        ) : (
          <Alert severity="success" icon={<DoneAllIcon />} sx={{ mt: 2, borderRadius: 2 }}>
            <strong>All {totalCount} residents have been dispatched via WhatsApp!</strong> Great job!
          </Alert>
        )}
      </Box>

      {/* Filter and Search Bar */}
      <Box sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, borderBottom: '1px solid #e2e8f0' }}>
        <Tabs
          value={filterTab}
          onChange={(_e, v) => setFilterTab(v)}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              py: 0.5,
              px: 1.5,
            },
          }}
        >
          <Tab value="ALL" label={`All Residents (${totalCount})`} />
          <Tab value="PENDING" label={`Pending (${totalCount - sentCount})`} />
          <Tab value="SENT" label={`Sent on WhatsApp (${sentCount})`} />
        </Tabs>

        <TextField
          size="small"
          placeholder="Search resident, room, phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Residents List */}
      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
        {filteredList.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              No residents match your filter.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredList.map((item, idx) => {
              const isSent = sentStudentIds.has(item.studentId);
              const cleanPhone = sanitizePhone(item.mobileNumber);
              const daysUntil = item.daysUntilDue;

              return (
                <Paper
                  key={item.studentId}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1.5px solid',
                    borderColor: isSent ? '#bbf7d0' : '#e2e8f0',
                    bgcolor: isSent ? '#f0fdf4' : '#ffffff',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#34d399',
                      boxShadow: '0 4px 12px -2px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    {/* Student Info */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: isSent ? '#dcfce7' : '#f1f5f9',
                          color: isSent ? '#059669' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          flexShrink: 0,
                          mt: 0.3,
                        }}
                      >
                        {isSent ? <CheckCircleIcon fontSize="small" /> : idx + 1}
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            {item.studentName}
                          </Typography>
                          <Chip
                            label={item.studentId}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#f1f5f9' }}
                          />
                          {item.roomNumber && (
                            <Chip
                              label={`Room ${item.roomNumber} - Bed ${item.bedId}`}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#e0f2fe', color: '#0369a1' }}
                            />
                          )}
                          {isSent && (
                            <Chip
                              icon={<CheckCircleIcon sx={{ fontSize: '0.85rem !important' }} />}
                              label="Sent on WhatsApp"
                              size="small"
                              color="success"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }}
                            />
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                            📞 {item.mobileNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>•</Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Due: <strong>{item.nextPaymentDueDate || 'N/A'}</strong>
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>•</Typography>
                          {daysUntil < 0 ? (
                            <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 800 }}>
                              ⚠️ {Math.abs(daysUntil)} days overdue
                            </Typography>
                          ) : daysUntil === 0 ? (
                            <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 800 }}>
                              🚨 Due Today
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 700 }}>
                              ⏳ Due in {daysUntil} days
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {/* Amount & Direct Action Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ textAlign: 'right', mr: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>
                          AMOUNT DUE
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                          ₹{item.amountDue?.toLocaleString('en-IN')}
                        </Typography>
                      </Box>

                      {/* WhatsApp Button */}
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        startIcon={<WhatsAppIcon />}
                        onClick={() => handleOpenSingleWhatsApp(item)}
                        sx={{
                          bgcolor: isSent ? '#059669' : '#16a34a',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          textTransform: 'none',
                          py: 0.5,
                          px: 1.8,
                          '&:hover': { bgcolor: '#15803d' },
                        }}
                      >
                        {isSent ? 'Resend' : 'Send WhatsApp'}
                      </Button>

                      {/* Copy message button */}
                      <Tooltip title="Copy message text">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyMessage(item)}
                          sx={{
                            color: copiedId === item.studentId ? '#059669' : '#64748b',
                            bgcolor: copiedId === item.studentId ? '#dcfce7' : '#f8fafc',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* Direct SMS link for mobile devices */}
                      <Tooltip title="Open SMS (Mobile / SMS App)">
                        <IconButton
                          size="small"
                          component="a"
                          href={`sms:${cleanPhone}?body=${encodeURIComponent(item.message)}`}
                          sx={{
                            color: '#2563eb',
                            bgcolor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                          }}
                        >
                          <SmsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <Divider />

      {/* Dialog Footer Actions */}
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          💡 Pro-tip: Click <strong>"Send Next via WhatsApp"</strong> above to send to each resident one after another seamlessly!
        </Typography>

        <Button onClick={onClose} variant="outlined" sx={{ color: '#475569', fontWeight: 600 }}>
          Close Dispatcher
        </Button>
      </DialogActions>
    </Dialog>
  );
};

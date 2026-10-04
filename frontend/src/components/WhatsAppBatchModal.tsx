import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import ReplayIcon from '@mui/icons-material/Replay';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
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
  reminders: initialReminders,
  onRefresh,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [remindersList, setRemindersList] = useState<PaymentReminder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'SENT' | 'FAILED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [sendingStudentId, setSendingStudentId] = useState<string | null>(null);
  const [isDispatchingAll, setIsDispatchingAll] = useState(false);

  useEffect(() => {
    setRemindersList(initialReminders || []);
  }, [initialReminders]);

  const sanitizePhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9]/g, '');
    return digits.length === 10 ? `91${digits}` : digits;
  };

  /**
   * Live dispatch via Meta WhatsApp Cloud API (or fallback to WhatsApp Web).
   * Enforces:
   * - Only marks SENT upon confirmed API response with message ID.
   * - Sets FAILED with exact error message if API fails, and allows Retry.
   * - Never skips manual send.
   */
  const handleSendLiveWhatsApp = async (reminder: PaymentReminder, force = true) => {
    setSendingStudentId(reminder.studentId);
    try {
      const updated = await reminderService.sendStudentReminder(reminder.studentId, slot, force);

      setRemindersList((prev) =>
        prev.map((r) => (r.studentId === reminder.studentId ? { ...r, ...updated } : r))
      );

      if (updated.status === 'SENT') {
        showSuccess(`WhatsApp fee reminder sent successfully to ${reminder.studentName}! (ID: ${updated.whatsappMessageId || 'Confirmed'})`);
      } else if (updated.status === 'FAILED') {
        showError(`WhatsApp dispatch failed for ${reminder.studentName}: ${updated.lastError || 'API rejected'}`);
      } else {
        // Fallback: Open WhatsApp Web / App
        const cleanPhone = sanitizePhone(reminder.mobileNumber);
        const encoded = encodeURIComponent(reminder.message);
        window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
        showWarning(`Opened WhatsApp chat for ${reminder.studentName}. (Set Meta Cloud API keys for direct background dispatch).`);
      }
      onRefresh?.();
    } catch (err: any) {
      showError(err.response?.data?.message || `Failed to dispatch reminder to ${reminder.studentName}`);
    } finally {
      setSendingStudentId(null);
    }
  };

  /**
   * Manual retry for failed reminder.
   */
  const handleRetry = async (reminder: PaymentReminder) => {
    setSendingStudentId(reminder.studentId);
    try {
      const updated = await reminderService.retryStudentReminder(reminder.studentId);
      setRemindersList((prev) =>
        prev.map((r) => (r.studentId === reminder.studentId ? { ...r, ...updated } : r))
      );

      if (updated.status === 'SENT') {
        showSuccess(`Retry succeeded! Fee reminder delivered to ${reminder.studentName}`);
      } else {
        showError(`Retry attempt failed for ${reminder.studentName}: ${updated.lastError || 'Error'}`);
      }
      onRefresh?.();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Retry failed');
    } finally {
      setSendingStudentId(null);
    }
  };

  /**
   * Open direct WhatsApp chat via WhatsApp Web / App link.
   */
  const handleOpenWhatsAppWeb = (reminder: PaymentReminder) => {
    const cleanPhone = sanitizePhone(reminder.mobileNumber);
    if (!cleanPhone) {
      showError(`No valid mobile number found for ${reminder.studentName}`);
      return;
    }
    let url = reminder.whatsappUrl;
    if (!url) {
      const encodedMsg = encodeURIComponent(reminder.message);
      url = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
    }
    reminderService.recordManualReminder(reminder.studentId, 'WHATSAPP', reminder.message).catch(() => {});
    window.open(url, '_blank');
    showSuccess(`Opened WhatsApp chat for ${reminder.studentName}`);
  };

  /**
   * Dispatch reminders to all residents, including those previously skipped or sent manually.
   */
  const handleDispatchAllIncludingSkipped = async () => {
    try {
      setIsDispatchingAll(true);
      const res = await reminderService.sendSkippedReminders(slot);
      showSuccess(`Dispatched reminders to all eligible residents! Sent: ${res.remindersSent}, Already Logged: ${res.alreadyRemindedCount}`);
      if (res.reminders && res.reminders.length > 0) {
        setRemindersList(res.reminders);
      }
      onRefresh?.();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to dispatch skipped reminders');
    } finally {
      setIsDispatchingAll(false);
    }
  };

  const handleResetLock = async () => {
    try {
      setIsResetting(true);
      await reminderService.resetToday(slot);
      showSuccess(`Today's duplicate lock for ${slot} reminders cleared! You can now resend.`);
      onRefresh?.();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to clear reminder duplicate lock');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyMessage = (reminder: PaymentReminder) => {
    navigator.clipboard.writeText(reminder.message);
    setCopiedId(reminder.studentId);
    showSuccess(`Personalized fee message for ${reminder.studentName} copied!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyAllPhones = () => {
    const phones = remindersList
      .map((r) => r.mobileNumber?.replace(/[^0-9]/g, ''))
      .filter((p) => !!p && p.length === 10);
    const uniquePhones = Array.from(new Set(phones)).join(', ');
    navigator.clipboard.writeText(uniquePhones);
    showSuccess(`Copied ${phones.length} phone numbers to clipboard for WhatsApp Broadcast!`);
  };

  // Filtered list
  const filteredList = remindersList.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.roomNumber && r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.mobileNumber && r.mobileNumber.includes(searchTerm));

    if (!matchesSearch) return false;

    const isSent = r.status === 'SENT' || r.status === 'DELIVERED' || r.status === 'READ';
    const isFailed = r.status === 'FAILED';

    if (filterTab === 'PENDING') return !isSent && !isFailed;
    if (filterTab === 'SENT') return isSent;
    if (filterTab === 'FAILED') return isFailed;
    return true;
  });

  const totalCount = remindersList.length;
  const sentCount = remindersList.filter((r) => r.status === 'SENT' || r.status === 'DELIVERED' || r.status === 'READ').length;
  const failedCount = remindersList.filter((r) => r.status === 'FAILED').length;
  const pendingCount = totalCount - sentCount - failedCount;
  const progressPercent = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;
  const totalAmount = remindersList.reduce((sum, r) => sum + (r.amountDue || 0), 0);

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
          maxHeight: '92vh',
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
              WhatsApp Fee Reminder Dispatcher
            </Typography>
            <Chip
              label={`${slot} SLOT`}
              size="small"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontWeight: 700, fontSize: '0.75rem' }}
            />
            <Chip
              label={`${totalCount} Residents • ₹${totalAmount.toLocaleString('en-IN')}`}
              size="small"
              sx={{ bgcolor: '#34d399', color: '#064e3b', fontWeight: 800, fontSize: '0.75rem' }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#a7f3d0', display: 'block', mt: 0.5 }}>
            Sends live Meta WhatsApp Cloud API reminders, tracks message IDs, auto-retries failed dispatches, and supports WhatsApp Web.
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#a7f3d0', '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' } }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Progress & Quick Action Bar */}
      <Box sx={{ bgcolor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#065f46' }}>
              Progress: {sentCount} / {totalCount} Sent ({progressPercent}%)
            </Typography>
            {failedCount > 0 && (
              <Chip
                icon={<ErrorOutlineIcon sx={{ fontSize: '14px !important', color: '#dc2626' }} />}
                label={`${failedCount} Failed (Retryable)`}
                size="small"
                sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: '0.72rem' }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={isDispatchingAll ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              disabled={isDispatchingAll}
              onClick={handleDispatchAllIncludingSkipped}
              sx={{
                bgcolor: '#059669',
                color: '#ffffff',
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 2px 4px rgba(5,150,105,0.2)',
                '&:hover': { bgcolor: '#047857' },
              }}
            >
              {isDispatchingAll ? 'Dispatching All...' : 'Send to All (Include Skipped)'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ReplayIcon />}
              onClick={handleResetLock}
              disabled={isResetting}
              sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#059669', color: '#059669' }}
            >
              {isResetting ? 'Clearing...' : 'Clear Lock'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyAllPhones}
              sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#059669', color: '#059669' }}
            >
              Copy Phone List
            </Button>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: '#dcfce7',
            '& .MuiLinearProgress-bar': { bgcolor: '#10b981', borderRadius: 4 },
          }}
        />
      </Box>

      {/* Filter Tabs & Search */}
      <Box sx={{ px: 3, pt: 2, pb: 1, bgcolor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Tabs
          value={filterTab}
          onChange={(_, val) => setFilterTab(val)}
          sx={{
            minHeight: 38,
            '& .MuiTab-root': { minHeight: 38, py: 0.5, fontWeight: 700, textTransform: 'none', fontSize: '0.85rem' },
          }}
        >
          <Tab label={`All (${totalCount})`} value="ALL" />
          <Tab label={`Pending (${pendingCount})`} value="PENDING" />
          <Tab label={`Sent (${sentCount})`} value="SENT" />
          {failedCount > 0 && <Tab label={`Failed (${failedCount})`} value="FAILED" sx={{ color: '#dc2626 !important' }} />}
        </Tabs>

        <TextField
          size="small"
          placeholder="Search by student, room, mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', sm: 260 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Divider />

      {/* Residents List */}
      <DialogContent sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
        {filteredList.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#64748b' }}>
              No residents found for current filter
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredList.map((rem) => {
              const isSent = rem.status === 'SENT' || rem.status === 'DELIVERED' || rem.status === 'READ';
              const isDelivered = rem.status === 'DELIVERED';
              const isRead = rem.status === 'READ';
              const isFailed = rem.status === 'FAILED';
              const isSending = sendingStudentId === rem.studentId;

              const borderLeftColor = isRead
                ? '#2563eb'
                : isDelivered
                ? '#0891b2'
                : isSent
                ? '#16a34a'
                : isFailed
                ? '#dc2626'
                : '#f59e0b';

              const bgTint = isFailed ? '#fef2f2' : isSent ? '#f0fdf4' : '#ffffff';

              return (
                <Paper
                  key={rem.studentId}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1px solid #e2e8f0',
                    borderLeft: `5px solid ${borderLeftColor}`,
                    bgcolor: bgTint,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ minWidth: 260, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {rem.studentName}
                      </Typography>
                      <Chip
                        label={`Room ${rem.roomNumber} • Bed ${rem.bedId}`}
                        size="small"
                        sx={{ bgcolor: '#e2e8f0', color: '#334155', fontWeight: 600, fontSize: '0.72rem' }}
                      />
                      {isRead ? (
                        <Chip label="Read ✓✓" size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                      ) : isDelivered ? (
                        <Chip label="Delivered ✓" size="small" color="info" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                      ) : isSent ? (
                        <Chip label="Sent ✓" size="small" color="success" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                      ) : isFailed ? (
                        <Chip label="Failed ✗" size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                      ) : (
                        <Chip label="Pending" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: '0.72rem' }} />
                      )}
                      {rem.attemptCount !== undefined && rem.attemptCount > 0 && (
                        <Chip
                          label={`Attempt #${rem.attemptCount}`}
                          size="small"
                          sx={{ bgcolor: '#f1f5f9', color: '#475569', fontSize: '0.68rem', fontWeight: 600 }}
                        />
                      )}
                    </Box>

                    <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
                      Due: <strong>{rem.nextPaymentDueDate}</strong> • Fee: <strong>₹{rem.amountDue?.toLocaleString('en-IN')}</strong> • 📞 {rem.mobileNumber || 'No phone'}
                    </Typography>

                    {/* WhatsApp Message ID */}
                    {rem.whatsappMessageId && (
                      <Typography variant="caption" sx={{ color: '#059669', display: 'block', mt: 0.25, fontFamily: 'monospace' }}>
                        Meta WAMID: {rem.whatsappMessageId}
                      </Typography>
                    )}

                    {/* Failure details if any */}
                    {isFailed && rem.lastError && (
                      <Alert severity="error" sx={{ py: 0.25, px: 1, mt: 1, fontSize: '0.75rem', borderRadius: 1.5 }}>
                        {rem.lastError}
                      </Alert>
                    )}
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Tooltip title="Copy personalized fee text">
                      <IconButton size="small" onClick={() => handleCopyMessage(rem)} sx={{ color: '#64748b' }}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {isFailed ? (
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        startIcon={isSending ? <CircularProgress size={14} color="inherit" /> : <ReplayIcon />}
                        disabled={isSending}
                        onClick={() => handleRetry(rem)}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        {isSending ? 'Retrying...' : 'Retry'}
                      </Button>
                    ) : isSent ? (
                      <Button
                        variant="outlined"
                        size="small"
                        color="success"
                        startIcon={isSending ? <CircularProgress size={14} color="inherit" /> : <ReplayIcon />}
                        disabled={isSending}
                        onClick={() => handleSendLiveWhatsApp(rem, true)}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        {isSending ? 'Sending...' : 'Send Again'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={isSending ? <CircularProgress size={14} color="inherit" /> : <WhatsAppIcon />}
                        disabled={isSending}
                        onClick={() => handleSendLiveWhatsApp(rem, true)}
                        sx={{
                          bgcolor: '#16a34a',
                          color: '#ffffff',
                          fontWeight: 700,
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#15803d' },
                        }}
                      >
                        {isSending ? 'Sending...' : 'Send WhatsApp'}
                      </Button>
                    )}

                    {/* Fallback to WhatsApp Web / App */}
                    <Tooltip title="Open in WhatsApp Web / App directly">
                      <IconButton size="small" onClick={() => handleOpenWhatsAppWeb(rem)} sx={{ color: '#16a34a' }}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, px: 3, justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          💡 When Meta WhatsApp Cloud API credentials are set, reminders dispatch automatically. Otherwise, click WhatsApp to dispatch via Web/App.
        </Typography>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

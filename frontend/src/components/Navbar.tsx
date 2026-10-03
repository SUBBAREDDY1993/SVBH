import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  TextField,
  Toolbar,
  Typography,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PaymentIcon from '@mui/icons-material/Payment';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyIcon from '@mui/icons-material/Key';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { authService } from '../services/authService';
import { reminderService } from '../services/reminderService';
import { FeeReminder } from '../types';

interface NavbarProps {
  onDrawerToggle: () => void;
  drawerWidth: number;
  onOpenCommandPalette: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onDrawerToggle,
  drawerWidth,
  onOpenCommandPalette,
}) => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Live Fee Reminders State (Requirement 5 & 8)
  const [reminders, setReminders] = useState<FeeReminder[]>([]);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);

  const loadReminders = async () => {
    try {
      setIsLoadingReminders(true);
      const data = await reminderService.getActiveReminders();
      setReminders(data);
    } catch (err) {
      console.error('Failed to load reminders for navbar bell:', err);
    } finally {
      setIsLoadingReminders(false);
    }
  };

  useEffect(() => {
    loadReminders();
    const handleRefresh = () => loadReminders();
    window.addEventListener('svbh-refresh-data', handleRefresh);
    return () => window.removeEventListener('svbh-refresh-data', handleRefresh);
  }, []);

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      showError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('New password and confirm password do not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      await authService.changePassword(currentPassword, newPassword);
      showSuccess('Password updated successfully');
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        className="glass-header no-print"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          color: '#0f172a',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 }, minHeight: 64 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={onDrawerToggle}
              sx={{ mr: 0.5, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Interactive Spotlight Command Palette Trigger */}
            <Box
              onClick={onOpenCommandPalette}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onOpenCommandPalette();
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.75,
                py: 0.9,
                borderRadius: 2.5,
                bgcolor: 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                cursor: 'pointer',
                width: { xs: 180, sm: 280, md: 340 },
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#ffffff',
                  borderColor: '#cbd5e1',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon sx={{ color: '#94a3b8', fontSize: 19 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748b',
                    fontSize: '0.825rem',
                    fontWeight: 500,
                    userSelect: 'none',
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  Search student, room, cmd...
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748b',
                    fontSize: '0.825rem',
                    fontWeight: 500,
                    userSelect: 'none',
                    display: { xs: 'block', sm: 'none' },
                  }}
                >
                  Search...
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span className="shortcut-kbd">{isMac ? '⌘' : 'Ctrl'}</span>
                <span className="shortcut-kbd">K</span>
              </Box>
            </Box>

            {/* Live Operational Status Indicator */}
            <Box
              sx={{
                display: { xs: 'none', xl: 'flex' },
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                py: 0.4,
                borderRadius: 9999,
                bgcolor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <Box
                className="status-dot-pulse-success"
                sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981' }}
              />
              <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 700, fontSize: '0.72rem' }}>
                System Live • 70 Beds Active
              </Typography>
            </Box>
          </Box>

          {/* Quick Actions & Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate('/students/new')}
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                fontSize: '0.825rem',
              }}
            >
              Add Student
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<PaymentIcon />}
              onClick={() => navigate('/payments')}
              sx={{
                borderColor: '#cbd5e1',
                color: '#334155',
                display: { xs: 'none', md: 'inline-flex' },
                fontSize: '0.825rem',
              }}
            >
              Record Payment
            </Button>

            <Tooltip title={reminders.length > 0 ? `${reminders.length} Fee Reminder(s) Pending` : 'Fee Reminders & Notifications'}>
              <IconButton
                onClick={(e) => setNotificationAnchorEl(e.currentTarget)}
                sx={{
                  color: reminders.length > 0 ? '#d97706' : '#64748b',
                  bgcolor: reminders.length > 0 ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.2)' },
                  transition: 'all 0.2s ease',
                }}
                aria-label="Fee reminders"
              >
                <Badge badgeContent={reminders.length} color="error" max={99}>
                  {reminders.length > 0 ? (
                    <NotificationsActiveIcon sx={{ color: '#ea580c' }} />
                  ) : (
                    <NotificationsNoneIcon />
                  )}
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Profile Avatar */}
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                cursor: 'pointer',
                p: 0.5,
                borderRadius: 2.5,
                transition: 'background-color 0.15s',
                '&:hover': { bgcolor: 'rgba(241, 245, 249, 0.8)' },
              }}
            >
              <Avatar
                sx={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                  width: 36,
                  height: 36,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                }}
              >
                {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', lg: 'block' }, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#0f172a' }}>
                  {user?.fullName || 'Administrator'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  {user?.role === 'ROLE_ADMIN' ? 'Admin' : 'Staff'}
                </Typography>
              </Box>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: { width: 220, mt: 1, borderRadius: 3, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
              }}
            >
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  setPasswordModalOpen(true);
                }}
              >
                <KeyIcon fontSize="small" sx={{ mr: 1.5, color: '#64748b' }} />
                Change Password
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  logout();
                }}
                sx={{ color: '#ef4444' }}
              >
                <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                Logout
              </MenuItem>
            </Menu>

            {/* Fee Reminders Dropdown / Popover (Requirement 5) */}
            <Popover
              open={Boolean(notificationAnchorEl)}
              anchorEl={notificationAnchorEl}
              onClose={() => setNotificationAnchorEl(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  width: { xs: 320, sm: 380 },
                  maxHeight: 520,
                  borderRadius: 3,
                  boxShadow: '0 14px 35px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                },
              }}
            >
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Notifications
                  </Typography>
                  <Chip
                    label={`${reminders.length} Due`}
                    size="small"
                    color={reminders.length > 0 ? 'error' : 'default'}
                    sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
                  />
                </Box>
                <IconButton
                  size="small"
                  onClick={loadReminders}
                  disabled={isLoadingReminders}
                  title="Refresh reminders"
                >
                  <RefreshIcon
                    fontSize="small"
                    sx={{
                      animation: isLoadingReminders ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                </IconButton>
              </Box>

              <Box sx={{ maxHeight: 370, overflowY: 'auto' }}>
                {isLoadingReminders && reminders.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5, gap: 1.5 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Loading reminders...
                    </Typography>
                  </Box>
                ) : reminders.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontSize: '1.75rem', mb: 1 }}>
                      🎉
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      No pending fee reminders 🎉
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                      All resident fees are up to date!
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {reminders.map((rem) => {
                      const isOverdue = rem.status === 'OVERDUE';
                      const isToday = rem.status === 'DUE_TODAY';
                      const isTomorrow = rem.daysRemaining === 1;

                      return (
                        <ListItem
                          key={rem.studentId}
                          sx={{
                            py: 1.5,
                            px: 2,
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.15s',
                            bgcolor: isOverdue ? 'rgba(239, 68, 68, 0.04)' : isToday ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
                            '&:hover': { bgcolor: 'rgba(241, 245, 249, 0.8)' },
                          }}
                          secondaryAction={
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {rem.whatsappUrl && (
                                <Tooltip title="Send WhatsApp reminder">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(rem.whatsappUrl, '_blank');
                                    }}
                                  >
                                    <WhatsAppIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          }
                        >
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                bgcolor: isOverdue ? '#fee2e2' : isToday ? '#fef3c7' : '#e0e7ff',
                                color: isOverdue ? '#b91c1c' : isToday ? '#b45309' : '#3730a3',
                              }}
                            >
                              {rem.studentName?.charAt(0) || 'S'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
                                  onClick={() => {
                                    setNotificationAnchorEl(null);
                                    navigate(`/students/${rem.studentId}`);
                                  }}
                                >
                                  • {rem.studentName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 700,
                                    color: isOverdue ? '#dc2626' : isToday ? '#d97706' : '#2563eb',
                                  }}
                                >
                                  - {rem.message || (isOverdue ? 'Fee overdue' : isToday ? 'Fee due today' : isTomorrow ? 'Fee due tomorrow' : `Fee due in ${rem.daysRemaining} days`)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                  Room {rem.roomNumber} {rem.bedNumber ? `| Bed ${rem.bedNumber}` : ''} • <strong style={{ color: '#0f172a' }}>₹{rem.feeAmount?.toLocaleString('en-IN')}</strong> • Due {rem.dueDateFormatted || rem.dueDate}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Box>

              <Divider />
              <Box sx={{ p: 1.5, bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  size="small"
                  color="primary"
                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
                  onClick={() => {
                    setNotificationAnchorEl(null);
                    navigate('/payments/due');
                  }}
                >
                  View All Dues ({reminders.length})
                </Button>
                <Button
                  size="small"
                  color="inherit"
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', color: '#64748b' }}
                  onClick={() => {
                    setNotificationAnchorEl(null);
                    navigate('/notifications');
                  }}
                >
                  All Alerts
                </Button>
              </Box>
            </Popover>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Change Password Dialog */}
      <Dialog open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Change Account Password</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            size="small"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            size="small"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Minimum 6 characters"
          />
          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            size="small"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPasswordModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={isChangingPassword || !currentPassword || !newPassword}
          >
            Update Password
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

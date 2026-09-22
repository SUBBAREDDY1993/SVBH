import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
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
import KeyIcon from '@mui/icons-material/Key';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { authService } from '../services/authService';

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

            <Tooltip title="Notifications">
              <IconButton onClick={() => navigate('/notifications')} sx={{ color: '#64748b' }}>
                <NotificationsNoneIcon />
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

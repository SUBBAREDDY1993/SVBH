import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PaymentIcon from '@mui/icons-material/Payment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  drawerWidth: number;
}

const navItems = [
  { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { text: 'Students', path: '/students', icon: <PeopleIcon /> },
  { text: 'Rooms & Beds', path: '/rooms', icon: <MeetingRoomIcon /> },
  { text: 'Allocations', path: '/allocations', icon: <SwapHorizIcon /> },
  { text: 'Payments', path: '/payments', icon: <PaymentIcon /> },
  { text: 'Payment Due', path: '/payments/due', icon: <ScheduleIcon /> },
  { text: 'Expenses & Profit', path: '/expenses', icon: <TrendingUpIcon /> },
  { text: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  { text: 'Notifications', path: '/notifications', icon: <NotificationsIcon /> },
  { text: 'Handbook', path: '/handbook', icon: <MenuBookIcon /> },
  { text: 'Settings', path: '/settings', icon: <SettingsIcon />, adminOnly: true },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose, drawerWidth }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0f172a', // Deep slate navy
        color: '#e2e8f0',
      }}
    >
      {/* Brand Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <img src="/logo.svg" alt="SVBH Logo" style={{ width: 36, height: 36 }} />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', lineHeight: 1.2, letterSpacing: -0.2 }}>
            Sri Venkateswara
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5 }}>
            BOYS HOSTEL
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Navigation Links */}
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const isSelected =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                selected={isSelected}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  backgroundColor: isSelected ? '#2563eb !important' : 'transparent',
                  '&:hover': {
                    backgroundColor: isSelected ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 38,
                    color: isSelected ? '#ffffff' : '#94a3b8',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isSelected ? 700 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* User Info & Logout Footer */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 600 }}>
              {isAdmin ? 'ADMINISTRATOR' : 'STAFF MEMBER'}
            </Typography>
          </Box>
          <ListItemButton
            onClick={logout}
            title="Logout"
            sx={{
              borderRadius: 1.5,
              p: 1,
              minWidth: 'auto',
              color: '#ef4444',
              '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
            }}
          >
            <LogoutIcon fontSize="small" />
          </ListItemButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} className="no-print">
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

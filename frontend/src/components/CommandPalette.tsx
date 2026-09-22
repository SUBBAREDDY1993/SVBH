import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Dialog,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PaymentIcon from '@mui/icons-material/Payment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { studentService } from '../services/studentService';
import { Student } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: 'Actions' | 'Navigation' | 'Students';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced student search
  useEffect(() => {
    if (!query.trim()) {
      setStudentResults([]);
      setIsSearchingStudents(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingStudents(true);
        const data = await studentService.getAllStudents(undefined, query.trim());
        setStudentResults(data.slice(0, 5));
      } catch (err) {
        console.error('Failed to search students in command palette:', err);
      } finally {
        setIsSearchingStudents(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset state when opening/closing
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Static Action & Navigation Items
  const staticItems: CommandItem[] = [
    // Quick Actions
    {
      id: 'action-new-student',
      category: 'Actions',
      title: 'Admit New Student',
      subtitle: 'Complete student admission form & bed allocation',
      icon: <PersonAddIcon sx={{ color: '#2563eb' }} />,
      badge: 'Action',
      action: () => {
        navigate('/students/new');
        onClose();
      },
    },
    {
      id: 'action-record-payment',
      category: 'Actions',
      title: 'Record Fee Payment',
      subtitle: 'Collect rent, deposit, advance with instant receipt',
      icon: <PaymentIcon sx={{ color: '#10b981' }} />,
      badge: 'Action',
      action: () => {
        navigate('/payments');
        onClose();
      },
    },
    {
      id: 'action-due-tracker',
      category: 'Actions',
      title: 'Track Overdue Payments',
      subtitle: 'View residents with pending dues or upcoming rent',
      icon: <ScheduleIcon sx={{ color: '#ef4444' }} />,
      badge: 'Action',
      action: () => {
        navigate('/payments/due');
        onClose();
      },
    },
    // Navigation
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Dashboard Overview',
      subtitle: 'Live KPIs, bed availability, occupancy breakdown',
      icon: <DashboardIcon sx={{ color: '#6366f1' }} />,
      action: () => {
        navigate('/dashboard');
        onClose();
      },
    },
    {
      id: 'nav-rooms',
      category: 'Navigation',
      title: 'Rooms & Bed Matrix',
      subtitle: 'Visual interactive grid of all 70 beds across 3 floors',
      icon: <MeetingRoomIcon sx={{ color: '#0d9488' }} />,
      action: () => {
        navigate('/rooms');
        onClose();
      },
    },
    {
      id: 'nav-students',
      category: 'Navigation',
      title: 'Student Directory',
      subtitle: 'Manage resident profiles, emergency contacts, notice periods',
      icon: <PeopleIcon sx={{ color: '#3b82f6' }} />,
      action: () => {
        navigate('/students');
        onClose();
      },
    },
    {
      id: 'nav-allocations',
      category: 'Navigation',
      title: 'Bed Allocations & Transfers',
      subtitle: 'Allocate beds or transfer students between rooms',
      icon: <SwapHorizIcon sx={{ color: '#f59e0b' }} />,
      action: () => {
        navigate('/allocations');
        onClose();
      },
    },
    {
      id: 'nav-reports',
      category: 'Navigation',
      title: 'Reports & Revenue Analytics',
      subtitle: 'Monthly collection trends, occupancy rates, CSV exports',
      icon: <AssessmentIcon sx={{ color: '#8b5cf6' }} />,
      action: () => {
        navigate('/reports');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'System Settings',
      subtitle: 'Hostel configurations, room rates, staff accounts',
      icon: <SettingsIcon sx={{ color: '#64748b' }} />,
      action: () => {
        navigate('/settings');
        onClose();
      },
    },
  ];

  // Dynamic Student Items from search
  const studentItems: CommandItem[] = studentResults.map((st) => ({
    id: `student-${st.id}`,
    category: 'Students',
    title: st.fullName,
    subtitle: `Room ${st.roomNumber || 'N/A'} (Bed ${st.bedNumber || 'N/A'}) • ${st.mobileNumber} • ₹${st.monthlyRent}/mo`,
    icon: <PersonIcon sx={{ color: '#2563eb' }} />,
    badge: st.status,
    action: () => {
      navigate(`/students/${st.id}`);
      onClose();
    },
  }));

  // Filter items matching query
  const filteredStaticItems = staticItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  const allItems: CommandItem[] = [...studentItems, ...filteredStaticItems];

  // Keyboard navigation within list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Group items by category
  const categories: ('Students' | 'Actions' | 'Navigation')[] = ['Students', 'Actions', 'Navigation'];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          top: '-10%',
          border: '1px solid rgba(226, 232, 240, 0.9)',
        },
      }}
    >
      {/* Search Input Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2.5,
          py: 1.75,
          borderBottom: '1px solid #e2e8f0',
          gap: 1.5,
          bgcolor: '#ffffff',
        }}
      >
        <SearchIcon sx={{ color: '#64748b', fontSize: 24 }} />
        <InputBase
          inputRef={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a command or search student by name, phone, room..."
          fullWidth
          sx={{
            fontSize: '1rem',
            color: '#0f172a',
            fontWeight: 500,
            '& input::placeholder': { color: '#94a3b8', opacity: 1 },
          }}
        />
        {isSearchingStudents && <CircularProgress size={18} sx={{ color: '#2563eb' }} />}
        <Chip
          label="ESC"
          size="small"
          onClick={onClose}
          sx={{
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#64748b',
            bgcolor: '#f1f5f9',
            border: '1px solid #cbd5e1',
          }}
        />
      </Box>

      {/* Results List */}
      <Box sx={{ maxHeight: 420, overflowY: 'auto', p: 1, bgcolor: '#ffffff' }}>
        {allItems.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: '#94a3b8' }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              No matching commands or students
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: '#64748b' }}>
              Try searching with another keyword or name
            </Typography>
          </Box>
        ) : (
          categories.map((cat) => {
            const itemsInCat = allItems.filter((i) => i.category === cat);
            if (itemsInCat.length === 0) return null;

            return (
              <Box key={cat} sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    py: 0.5,
                    display: 'block',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontSize: '0.7rem',
                  }}
                >
                  {cat}
                </Typography>
                <List disablePadding>
                  {itemsInCat.map((item) => {
                    const itemGlobalIndex = allItems.findIndex((i) => i.id === item.id);
                    const isSelected = itemGlobalIndex === selectedIndex;

                    return (
                      <ListItemButton
                        key={item.id}
                        selected={isSelected}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                        sx={{
                          borderRadius: 2.5,
                          px: 2,
                          py: 1.1,
                          mb: 0.25,
                          transition: 'all 0.1s ease',
                          bgcolor: isSelected ? 'rgba(37, 99, 235, 0.08) !important' : 'transparent',
                          '&:hover': {
                            bgcolor: 'rgba(37, 99, 235, 0.06)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                                {item.title}
                              </Typography>
                              {item.badge && (
                                <Chip
                                  label={item.badge}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor:
                                      item.badge === 'ACTIVE'
                                        ? '#dcfce7'
                                        : item.badge === 'Action'
                                        ? '#dbeafe'
                                        : '#f1f5f9',
                                    color:
                                      item.badge === 'ACTIVE'
                                        ? '#166534'
                                        : item.badge === 'Action'
                                        ? '#1d4ed8'
                                        : '#475569',
                                  }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            item.subtitle && (
                              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                {item.subtitle}
                              </Typography>
                            )
                          }
                        />
                        {isSelected && (
                          <KeyboardReturnIcon sx={{ color: '#2563eb', fontSize: 18, opacity: 0.8 }} />
                        )}
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            );
          })
        )}
      </Box>

      {/* Footer Navigation Hints */}
      <Divider />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2.5,
          py: 1.25,
          bgcolor: '#f8fafc',
          color: '#64748b',
          fontSize: '0.75rem',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span className="shortcut-kbd">↑</span>
            <span className="shortcut-kbd">↓</span>
            <span>Navigate</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span className="shortcut-kbd">↵</span>
            <span>Open</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span className="shortcut-kbd">Esc</span>
            <span>Close</span>
          </Box>
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8' }}>
          Sri Venkateswara Boys Hostel OS
        </Typography>
      </Box>
    </Dialog>
  );
};

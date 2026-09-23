import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

const routeNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  students: 'Students Directory',
  new: 'New Admission',
  rooms: 'Rooms & Bed Matrix',
  allocations: 'Allocations & Transfers',
  payments: 'Payments & Revenue',
  due: 'Due Tracker',
  expenses: 'Expenses & Profit',
  receipt: 'Receipt',
  reports: 'Reports & Analytics',
  notifications: 'Notifications',
  settings: 'System Settings',
  handbook: 'Operations Handbook',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If we are on dashboard root, don't show redundant single item
  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return null;
  }

  return (
    <Box sx={{ mb: 2.5 }} className="no-print">
      <MuiBreadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: 16, color: '#94a3b8' }} />}
        aria-label="breadcrumb"
      >
        <Link
          component={RouterLink}
          to="/dashboard"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
            '&:hover': { color: '#2563eb' },
          }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
          Hostel
        </Link>

        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isId = value.length > 15; // mongo ID or uuid
          const displayName = isId ? 'Details' : routeNameMap[value] || value;

          return last ? (
            <Typography
              key={to}
              sx={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              {displayName}
            </Typography>
          ) : (
            <Link
              key={to}
              component={RouterLink}
              to={to}
              sx={{
                color: '#64748b',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
                '&:hover': { color: '#2563eb' },
              }}
            >
              {displayName}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

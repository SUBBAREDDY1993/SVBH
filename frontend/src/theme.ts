import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Royal Blue
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0d9488', // Teal
      light: '#14b8a6',
      dark: '#0f766e',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981', // Emerald for AVAILABLE / ACTIVE / PAID
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b', // Amber for RESERVED / DUE SOON
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444', // Rose/Red for OCCUPIED / OVERDUE
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    info: {
      main: '#6366f1', // Indigo for NOTICE_PERIOD / SYSTEM
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Clean slate-50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Slate 900
      secondary: '#475569', // Slate 600
    },
    divider: 'rgba(226, 232, 240, 0.8)', // Slate 200
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 800, letterSpacing: '-0.025em' },
    h3: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 700, letterSpacing: '-0.015em' },
    h6: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body1: { fontSize: '0.925rem', lineHeight: 1.6 },
    body2: { fontSize: '0.85rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          padding: '8px 16px',
          fontWeight: 600,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.18)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          borderColor: '#e2e8f0',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(241, 245, 249, 0.7)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          backgroundImage: 'none',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        },
        elevation3: {
          boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.07), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(226, 232, 240, 0.7)',
          padding: '14px 16px',
        },
        head: {
          fontWeight: 700,
          backgroundColor: '#f8fafc',
          color: '#334155',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(248, 250, 252, 0.8) !important',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
        },
      },
    },
  },
});

export default theme;

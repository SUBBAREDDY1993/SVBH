import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showError('Please enter both username and password');
      return;
    }

    try {
      setIsLoading(true);
      const auth = await authService.login(username.trim(), password.trim());
      login(auth.token, {
        id: auth.userId,
        username: auth.username,
        fullName: auth.fullName,
        email: auth.email,
        role: auth.role,
      });
      showSuccess(`Welcome back, ${auth.fullName}!`);
      navigate('/dashboard');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  const fillDemoStaff = () => {
    setUsername('staff');
    setPassword('staff123');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        backgroundImage:
          'radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.15) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(13, 148, 136, 0.15) 0, transparent 50%)',
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 440,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          bgcolor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <Box
          sx={{
            bgcolor: '#1e3a8a',
            color: '#ffffff',
            py: 4,
            px: 3,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <img src="/logo.svg" alt="SVBH Logo" style={{ width: 64, height: 64 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Sri Venkateswara Boys Hostel
          </Typography>
          <Typography variant="caption" sx={{ color: '#93c5fd', fontWeight: 500, letterSpacing: 0.5 }}>
            MANAGEMENT SYSTEM PORTAL
          </Typography>
        </Box>

        <CardContent sx={{ p: 3.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: '#1e293b' }}>
            Sign In to Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Enter your credentials to manage hostel operations
          </Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Username"
              fullWidth
              size="small"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{
                bgcolor: '#2563eb',
                py: 1.2,
                fontWeight: 700,
                fontSize: '0.95rem',
                mt: 1,
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', px: 1 }}>
              DEMO CREDENTIALS
            </Typography>
          </Divider>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={fillDemoAdmin}
              sx={{ borderColor: '#e2e8f0', color: '#334155', textTransform: 'none' }}
            >
              Fill Admin (admin/admin123)
            </Button>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={fillDemoStaff}
              sx={{ borderColor: '#e2e8f0', color: '#334155', textTransform: 'none' }}
            >
              Fill Staff (staff/staff123)
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

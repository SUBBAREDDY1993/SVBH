import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Card, CardContent, Typography, Collapse, IconButton } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            bgcolor: '#f8fafc',
          }}
        >
          <Card sx={{ maxWidth: 560, width: '100%', p: 2, textAlign: 'center' }}>
            <CardContent>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <WarningAmberIcon sx={{ fontSize: 36, color: '#ef4444' }} />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                Something went wrong
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                An unexpected error occurred in this view. Don't worry, your data is safe and the backend is running.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                  sx={{ bgcolor: '#2563eb' }}
                >
                  Reload Page
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                  sx={{ borderColor: '#cbd5e1', color: '#334155' }}
                >
                  Return to Dashboard
                </Button>
              </Box>

              {this.state.error && (
                <Box sx={{ textAlign: 'left', mt: 2 }}>
                  <Button
                    size="small"
                    onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                    endIcon={
                      <ExpandMoreIcon
                        sx={{
                          transform: this.state.showDetails ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      />
                    }
                    sx={{ color: '#64748b', textTransform: 'none', px: 0 }}
                  >
                    {this.state.showDetails ? 'Hide technical details' : 'Show technical details'}
                  </Button>
                  <Collapse in={this.state.showDetails}>
                    <Box
                      sx={{
                        p: 2,
                        mt: 1,
                        bgcolor: '#0f172a',
                        color: '#f8fafc',
                        borderRadius: 2,
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        overflowX: 'auto',
                        maxHeight: 200,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#f87171', display: 'block', mb: 1 }}>
                        {this.state.error.toString()}
                      </Typography>
                      {this.state.errorInfo?.componentStack}
                    </Box>
                  </Collapse>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

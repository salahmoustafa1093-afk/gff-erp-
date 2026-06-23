import { Component, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import BugReportIcon from '@mui/icons-material/BugReport';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo: errorInfo.componentStack,
    });

    // Log to error tracking service in production
    if (import.meta.env.PROD) {
      // eslint-disable-next-line no-console
      console.error('Production error - should be sent to error tracking:', {
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = import.meta.env.DEV;

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          <Paper
            elevation={2}
            sx={{
              maxWidth: 600,
              width: '100%',
              p: 4,
              textAlign: 'center',
              borderRadius: 3,
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: 'error.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 36, color: 'error.main' }} />
            </Box>

            <Typography variant="h5" fontWeight={600} gutterBottom>
              Something went wrong
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We apologize for the inconvenience. An unexpected error has occurred.
              Our team has been notified and is working to fix the issue.
            </Typography>

            {isDev && this.state.error && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  textAlign: 'left',
                  backgroundColor: '#FFEBEE',
                  borderColor: '#EF9A9A',
                  borderRadius: 2,
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BugReportIcon fontSize="small" color="error" />
                  <Typography variant="subtitle2" color="error" fontWeight={600}>
                    Development Error Details
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    color: '#C62828',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      color: '#D32F2F',
                      mt: 1,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      opacity: 0.8,
                    }}
                  >
                    {this.state.errorInfo}
                  </Typography>
                )}
              </Paper>
            )}

            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={this.handleReset}
              >
                Try Again
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card, CardContent, Typography, Box, Alert } from '@mui/material';
import { Refresh, BugReport } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('user_id'),
        sessionId: this.getSessionId(),
      };

      // Send to your error monitoring service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  };

  private getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    } else {
      // After max retries, reload the page
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReportBug = () => {
    const errorData = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Create a mailto link or open a bug report form
    const subject = encodeURIComponent(`Bug Report: ${this.state.error?.message}`);
    const body = encodeURIComponent(`
Error Details:
${JSON.stringify(errorData, null, 2)}

Please describe what you were doing when this error occurred:
[Your description here]
    `);

    window.open(`mailto:support@yourcompany.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: 2,
            backgroundColor: '#f5f5f5',
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <BugReport sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              
              <Typography variant="h4" component="h1" gutterBottom color="error">
                Something went wrong
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph>
                We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.
              </Typography>

              {process.env.NODE_ENV === 'development' && (
                <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Development Error Details:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                    {this.state.error?.message}
                  </Typography>
                  {this.state.error?.stack && (
                    <details style={{ marginTop: '8px' }}>
                      <summary>Stack Trace</summary>
                      <pre style={{ fontSize: '0.7rem', marginTop: '8px' }}>
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleRetry}
                  disabled={this.retryCount >= this.maxRetries}
                >
                  {this.retryCount >= this.maxRetries ? 'Max Retries Reached' : `Try Again (${this.maxRetries - this.retryCount} left)`}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                
                <Button
                  variant="text"
                  startIcon={<BugReport />}
                  onClick={this.handleReportBug}
                >
                  Report Bug
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                If this problem persists, please contact support.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

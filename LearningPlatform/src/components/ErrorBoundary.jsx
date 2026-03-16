import React from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

/**
 * Error Boundary Component
 * Catches errors in child components and displays fallback UI
 * Prevents entire app from crashing due to single component failure
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('❌ Error caught by boundary:', error, errorInfo);

    // Update state with error details
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log to external error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // TODO: Integrate with error tracking service
    // For now, log to console
    console.error('Error logged to service:', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.resetError);
      }

      // Default error UI
      return (
        <div className="container-fluid bg-danger-subtle py-5 px-4" style={{ minHeight: '60vh' }}>
          <div className="container">
            <div className="alert alert-danger border-2 border-danger" role="alert">
              <div className="d-flex align-items-start gap-3">
                <FaExclamationCircle className="mt-1 flex-shrink-0" size={24} style={{ marginTop: '4px' }} />
                <div className="flex-grow-1">
                  <h4 className="alert-heading mb-2">⚠️ Something Went Wrong</h4>

                  <p className="mb-2">
                    We encountered an unexpected error while loading this section.
                    Your data is safe - please try refreshing the page.
                  </p>

                  {/* Show error details in development */}
                  {process.env.NODE_ENV === 'development' && error && (
                    <details className="mt-3 mb-3" style={{ fontSize: '0.9rem' }}>
                      <summary className="cursor-pointer mb-2 text-muted">
                        <strong>Error Details (Development Only)</strong>
                      </summary>
                      <div className="bg-light p-2 rounded border mt-2" style={{ maxHeight: '200px', overflow: 'auto' }}>
                        <p className="mb-1">
                          <strong>Message:</strong> {error.toString()}
                        </p>
                        {errorInfo?.componentStack && (
                          <p className="mb-0">
                            <strong>Component Stack:</strong>
                            <pre className="mb-0 mt-1" style={{ fontSize: '0.85rem' }}>
                              {errorInfo.componentStack}
                            </pre>
                          </p>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Action buttons */}
                  <div className="mt-3 d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => window.location.reload()}
                    >
                      🔄 Refresh Page
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={this.resetError}
                    >
                      ↩️ Try Again
                    </button>
                    <a href="/" className="btn btn-outline-secondary">
                      🏠 Go to Dashboard
                    </a>
                  </div>

                  {/* Error counter for debugging */}
                  {errorCount > 2 && (
                    <p className="mt-3 mb-0 text-muted text-sm">
                      <small>
                        ℹ️ Multiple errors detected ({errorCount}).
                        If problems persist, please contact support.
                      </small>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;

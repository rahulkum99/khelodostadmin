import React, { Component } from 'react';

/**
 * Error logger function that works outside of React components
 */
export const logErrorToService = (error, errorInfo, componentName = 'ErrorBoundary') => {
  const errorData = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    componentName,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
  
  console.error('Error caught and logged:', errorData);
  
  // Optional: Send to external service
  // This would be implemented based on your logging service
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    logErrorToService(error, errorInfo, this.props.componentName || 'App');
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          minHeight: '100vh',
          backgroundColor: '#f9fafb'
        }}>
          <img 
            src="/images/error.svg" 
            alt="Error" 
            style={{ 
              width: '180px', 
              marginBottom: '24px'
            }} 
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          
          <h2 style={{ 
            color: '#1f2937', 
            marginBottom: '16px',
            fontSize: '24px'
          }}>
            Something went wrong
          </h2>
          
          <p style={{ 
            color: '#4b5563', 
            marginBottom: '24px',
            maxWidth: '500px'
          }}>
            We're sorry, but there was an error loading this page. 
            You can try refreshing the page or contact support if the problem persists.
          </p>
          
          <button 
            onClick={() => window.location.reload()} 
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            Refresh Page
          </button>
          
          {this.props.showDetails && this.state.error && (
            <div style={{ 
              marginTop: '30px', 
              textAlign: 'left',
              backgroundColor: '#f3f4f6',
              padding: '16px',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '100%',
              overflow: 'auto'
            }}>
              <h4 style={{ 
                color: '#1f2937',
                fontSize: '16px',
                marginBottom: '8px'
              }}>
                Error Details (for developers):
              </h4>
              <p style={{ 
                color: '#ef4444',
                fontFamily: 'ClashGrotesk, monospace',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                {this.state.error.toString()}
              </p>
              <pre style={{ 
                whiteSpace: 'pre-wrap',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ErrorBoundaryWithLogger is a higher-order component that can use hooks
const ErrorBoundaryWithLogger = (props) => {
  // This component doesn't actually use the hook directly since hooks can't be used
  // in class components, but it's here for demonstration and future functional component use
  return <ErrorBoundary {...props} />;
};

export default ErrorBoundaryWithLogger; 
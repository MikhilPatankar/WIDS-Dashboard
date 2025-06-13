import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldExclamationIcon } from '../constants'; // Assuming this is your icon constant

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-primary-dark text-text-primary p-4">
          <ShieldExclamationIcon className="w-16 h-16 text-danger mb-4" />
          <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h1>
          <p className="text-text-secondary mb-4 text-center">
            We're sorry for the inconvenience. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-secondary-dark rounded-md text-left w-full max-w-2xl">
              <summary className="cursor-pointer font-semibold text-danger">Error Details (Development Only)</summary>
              <pre className="mt-2 text-xs whitespace-pre-wrap">
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
           <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-accent-blue hover:bg-accent-blue/80 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
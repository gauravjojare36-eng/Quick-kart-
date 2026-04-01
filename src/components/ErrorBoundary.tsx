import React, { ErrorInfo, ReactNode, Component } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    (this as any).setState({
      hasError: true,
      error: event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    });
  };

  public componentDidMount() {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  public render() {
    const state = (this as any).state;
    if (state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let details = '';

      if (state.error) {
        try {
          const parsedError = JSON.parse(state.error.message);
          if (parsedError.error && parsedError.operationType) {
            errorMessage = `Firestore Error: ${parsedError.error}`;
            details = `Operation: ${parsedError.operationType} | Path: ${parsedError.path}`;
          } else {
            errorMessage = state.error.message;
          }
        } catch (e) {
          errorMessage = state.error.message;
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong.</h1>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            {details && (
              <div className="bg-gray-100 p-4 rounded-lg text-left text-sm text-gray-700 font-mono mb-6 overflow-x-auto">
                {details}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

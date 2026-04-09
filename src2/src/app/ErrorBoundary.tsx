import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: null | Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error caught by ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fee2e2',
          flexDirection: 'column',
          padding: '20px'
        }}>
          <h1 style={{ color: '#991b1b', marginBottom: '10px' }}>Error en la aplicación</h1>
          <p style={{ color: '#7f1d1d', marginBottom: '20px' }}>
            {this.state.error?.message || 'Error desconocido'}
          </p>
          <pre style={{
            backgroundColor: '#fecaca',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
            maxWidth: '100%'
          }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

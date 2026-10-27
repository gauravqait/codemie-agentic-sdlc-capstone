import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="error-boundary">
        <h1>Something went wrong</h1>
        <p>The app hit an unexpected error. Your saved tasks have not been deleted.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload the app
        </button>
      </div>
    );
  }
}

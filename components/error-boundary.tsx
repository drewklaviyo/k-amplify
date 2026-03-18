"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-xl border border-red/20 bg-red/5 p-8 text-center my-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red/10 mb-4">
            <svg className="w-6 h-6 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-red text-sm font-medium mb-1">Something went wrong</p>
          <p className="text-text-secondary/60 text-xs">Try refreshing the page.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 text-xs text-accent-light hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

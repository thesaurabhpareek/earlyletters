import { Component, type ReactNode } from 'react';

/**
 * The last resort on the one screen that must always draw: if the drawing itself throws (react-native-svg missing or
 * failing), the screen goes on without it. The words and the buttons never depend on it. Its own file, with React and
 * nothing else, so a test can run it without React Native (BL-467 point 2).
 */
export class DrawingBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

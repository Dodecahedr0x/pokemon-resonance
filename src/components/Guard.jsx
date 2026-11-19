import { Component } from 'react';
import { reportError } from '../engine/core/errors.js';
import { useShell } from './shellStore.js';

// A render error must break only its block, not the whole app (like the old
// innerHTML, which only damaged its container). The error is shown in the engine's box;
// the block retries on the next page change.
class Limit extends Component {
  state = { err: null, resetKey: this.props.resetKey };
  static getDerivedStateFromError(err) {
    return { err };
  }
  static getDerivedStateFromProps(p, s) {
    return p.resetKey !== s.resetKey ? { err: null, resetKey: p.resetKey } : null;
  }
  componentDidCatch(err) {
    try {
      reportError(err, 'rendu');
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
  }
  render() {
    return this.state.err ? null : this.props.children;
  }
}

export default function Guard({ children }) {
  const { page } = useShell();
  return <Limit resetKey={page}>{children}</Limit>;
}

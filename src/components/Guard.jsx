import { Component } from 'react';
import { reportError } from '../engine/002-errors.js';
import { useShell } from './shellStore.js';

// A render error must break only its block, not the whole app (like the old
// innerHTML, which only damaged its container). The error is shown in the engine's box;
// the block retries on the next page change.
class Limit extends Component {
  state = { err: null, cle: this.props.cle };
  static getDerivedStateFromError(err) {
    return { err };
  }
  static getDerivedStateFromProps(p, s) {
    return p.cle !== s.cle ? { err: null, cle: p.cle } : null;
  }
  componentDidCatch(err) {
    try {
      reportError(err, 'rendu');
    } catch {}
  }
  render() {
    return this.state.err ? null : this.props.children;
  }
}

export default function Guard({ children }) {
  const { page } = useShell();
  return <Limit cle={page}>{children}</Limit>;
}

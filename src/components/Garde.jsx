import { Component } from 'react';
import { reportError } from '../engine/002-00-erreurs.js';
import { useShell } from './shellStore.js';

// Une erreur de rendu ne doit casser que son bloc, pas toute l'application (comme l'ancien
// innerHTML, qui n'abîmait que son conteneur). L'erreur s'affiche dans la boîte du moteur ;
// le bloc réessaie au prochain changement de page.
class Limite extends Component {
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

export default function Garde({ children }) {
  const { page } = useShell();
  return <Limite cle={page}>{children}</Limite>;
}

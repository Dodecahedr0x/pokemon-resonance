import { useToast } from './shellOverlays.js';

// Message bref (#toast), affiché par toast() du moteur (014) pendant 2,8 s.
export default function Toast() {
  const { msg, on } = useToast();
  return <div className={on ? 'toast on' : 'toast'} id="toast" role="status" aria-live="polite">{msg}</div>;
}

import { useToast } from './shellOverlays.js';

// Brief message (#toast), shown by the engine's toast() (014) for 2.8 s.
export default function Toast() {
  const { msg, on } = useToast();
  return (
    <div className={on ? 'toast is-shown' : 'toast'} id="toast" role="status" aria-live="polite">
      {msg}
    </div>
  );
}

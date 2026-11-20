// Shared button (src/styles/components/button.css).
//   size:    'small' | 'large' (default: regular)
//   variant: 'primary' (gold, the main action) | 'ghost'
// Other props (data-*, disabled, onClick…) go to the <button>; className adds classes.
export function buttonClass({ size, variant, className } = {}) {
  return ['button', size && `button-${size}`, variant && `button-${variant}`, className].filter(Boolean).join(' ');
}

export default function Button({ size, variant, className, type = 'button', ...props }) {
  return <button type={type} className={buttonClass({ size, variant, className })} {...props} />;
}

// Card header (src/styles/components/card.css): an icon from the sprite sheet (#i-<icon>), the title, then an
// optional count or status on the right and any extra content (a button) passed as children.
export default function CardHeader({ icon, title, count, children }) {
  return (
    <header className="card-header">
      <svg>
        <use href={`#i-${icon}`} />
      </svg>
      <b>{title}</b>
      {count === undefined ? null : <span className="card-count">{count}</span>}
      {children}
    </header>
  );
}

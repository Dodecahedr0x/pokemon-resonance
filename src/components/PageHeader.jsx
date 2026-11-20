// Page header (src/styles/components/page-header.css): the kicker above, the page title (h1, its id is the target
// of the page's aria-labelledby), a lead paragraph, then any extra row passed as children. `wide` lets the header
// run wider on the screens that style it so (map, battle choice).
export default function PageHeader({ kicker, title, titleId, lead, wide = false, children }) {
  return (
    <div className={wide ? 'page-header page-header-wide' : 'page-header'}>
      <p className="kicker">{kicker}</p>
      <h1 className="title" id={titleId}>
        {title}
      </h1>
      {lead ? <p className="lead">{lead}</p> : null}
      {children}
    </div>
  );
}

import Link from "next/link";

const footerLinks = [
  { href: "/finance-bill-2026", label: "Finance Bills" },
  { href: "/finance-bill-2026/summary", label: "Plain Summary" },
  { href: "/ask", label: "Ask AI" },
  { href: "/public-participation", label: "Public Participation" },
  { href: "/news", label: "News" },
  { href: "/forum", label: "Forum" },
  { href: "/explainers", label: "Explainers" },
  { href: "/public-participation/deadlines", label: "Deadlines" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link href="/" aria-label="Kenyan Bill home">
            Kenyan Bill
          </Link>
          <p>
            An anonymous public knowledge platform for understanding Finance
            Bills and Kenya&apos;s civic issues.
          </p>
        </div>
        <nav className="site-footer__links" aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

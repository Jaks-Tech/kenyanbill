import Image from "next/image";
import Link from "next/link";

const primaryLinks = [
  { href: "/finance-bill-2026", label: "Finance Bills" },
  { href: "/ask", label: "Ask AI" },
  { href: "/news", label: "News" },
  { href: "/forum", label: "Forum" },
  { href: "/public-participation", label: "Public Participation" },
  { href: "/explainers", label: "Explainers" },
];

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/" aria-label="Kenyan Bill home">
          <Image
            className="site-brand__logo"
            src="/kb-logo.png"
            alt="Kenyan Bill Logo" /* Added alt description for screen readers */
            width={48}
            height={48}
            priority
            style={{ borderRadius: "50%", objectFit: "cover" }} /* Inline elegant clip */
          />
          <span>Kenyan Bill</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
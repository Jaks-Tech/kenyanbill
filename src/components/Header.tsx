import Image from "next/image";
import Link from "next/link";

const primaryLinks = [
  { href: "/ask", label: "Finance ChatGPT" },
  { href: "/finance-bill-2026", label: "Finance Bill 2026" },
  { href: "/public-participation", label: "Opinion Vote" },
  { href: "/public-participation/analysis", label: "Daily Analysis" },
  { href: "/forum", label: "Public Forum" },
  { href: "/news", label: "News Updates" },
  { href: "/explainers", label: "Learn Bill" },
];

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/" aria-label="Kenyan Bill home">
          <Image
            className="site-brand__logo"
            src="/kb-logo.png"
            alt="Kenyan Bill Logo"
            width={48}
            height={48}
            priority
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
          <span>Kenyan Bill</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href} title={link.label}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

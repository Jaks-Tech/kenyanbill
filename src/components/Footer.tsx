import Link from "next/link";
import Image from "next/image";

const footerSections = [
  {
    title: "Understand",
    links: [
      { href: "/finance-bill-2026", label: "Finance Bills Hub" },
      { href: "/finance-bill-2026/summary", label: "Plain Summary" },
      { href: "/ask", label: "Chat Finance Bill" },
      { href: "/explainers", label: "Explainers" },
    ],
  },
  {
    title: "Participate",
    links: [
      { href: "/public-participation", label: "Opinion Vote" },
      { href: "/public-participation/analysis", label: "Daily Analysis" },
      { href: "/public-participation/how-to-submit-views", label: "How to Submit" },
      { href: "/public-participation/memoranda", label: "Memoranda Templates" },
      { href: "/public-participation/deadlines", label: "Deadlines" },
    ],
  },
  {
    title: "Follow",
    links: [
      { href: "/news", label: "News Updates" },
      { href: "/forum", label: "Community Forum" },
      { href: "/forum/new", label: "Start a Thread" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link href="/" className="site-footer__brand-link" aria-label="Kenyan Bill home">
            <Image
              src="/kb-logo.png"
              alt="Kenyan Bill logo"
              width={56}
              height={56}
              className="site-footer__logo"
            />
            <span>Kenyan Bill</span>
          </Link>
          <p>
            An anonymous public knowledge platform for understanding Kenya&apos;s
            Finance Bills and civic issues. Read, learn, discuss, and participate.
          </p>
        </div>
        
        <div className="site-footer__sections">
          {footerSections.map((section) => (
            <nav
              key={section.title}
              className="site-footer__section"
              aria-label={`${section.title} navigation`}
            >
              <h3 className="site-footer__section-title">{section.title}</h3>
              <ul className="site-footer__links">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      
      <div className="site-footer__bottom">
        <p className="site-footer__copyright">
          © {new Date().getFullYear()} Kenyan Bill. An anonymous civic platform.
        </p>
      </div>
    </footer>
  );
}

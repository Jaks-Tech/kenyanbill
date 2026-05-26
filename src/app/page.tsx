import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <Image
            className={styles.logo}
            src="/kb-logo.png"
            alt="Kenyan Bill"
            width={48}
            height={48}
            priority
          />
          <span>Kenyan Bill</span>
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/finance-bill-2026">Finance Bill 2026</Link>
          <Link href="/ask">Ask AI</Link>
          <Link href="/news">News</Link>
          <Link href="/forum">Forum</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Open civic knowledge for Kenya</p>
          <h1>Know the Finance Bill. Speak freely. Stay informed.</h1>
          <p>
            Kenyan Bill will help citizens understand the Finance Bill 2026,
            follow related news, ask AI-powered questions, and join anonymous
            public discussions without signup.
          </p>
          <div className={styles.ctas}>
            <Link className={styles.primary} href="/finance-bill-2026">
              Explore the Bill
            </Link>
            <Link className={styles.secondary} href="/forum">
              Join the Forum
            </Link>
          </div>
        </section>

        <section className={styles.sections} aria-label="Platform areas">
          <Link href="/ask">
            <span>Ask AI</span>
            <strong>
              Get sourced answers from bill documents and trusted updates.
            </strong>
          </Link>
          <Link href="/news">
            <span>News</span>
            <strong>
              Track current Finance Bill 2026 and Kenya public affairs coverage.
            </strong>
          </Link>
          <Link href="/forum">
            <span>Anonymous Forum</span>
            <strong>Share views as names like True Patriot 001.</strong>
          </Link>
        </section>
      </main>
    </div>
  );
}

import Link from "next/link";
import styles from "./page.module.css";

const primaryRoutes = [
  {
    href: "/finance-bill-2026",
    label: "Finance Bills hub",
    text: "Start with uploaded source documents, the active bill, and links into the rest of the platform.",
  },
  {
    href: "/finance-bill-2026/summary",
    label: "Finance Bill 2026 summary",
    text: "Read the proposal summary prepared from processed database chunks.",
  },
  {
    href: "/ask",
    label: "Chat Finance Bill",
    text: "Ask questions answered from Finance Bill source chunks and cited context.",
  },
];

const actionRoutes = [
  {
    href: "/public-participation",
    label: "Public participation",
    text: "Prepare views, see guidance, and understand how official submissions work.",
  },
  {
    href: "/public-participation/how-to-submit-views",
    label: "How to submit views",
    text: "Use a step-by-step guide for turning concerns into a clear submission.",
  },
  {
    href: "/public-participation/memoranda",
    label: "Memoranda",
    text: "Use simple memorandum structures for citizens, groups, and businesses.",
  },
  {
    href: "/public-participation/deadlines",
    label: "Deadlines",
    text: "Track confirmed public participation dates and official notices.",
  },
];

const communityRoutes = [
  {
    href: "/news",
    label: "News",
    text: "Follow linked updates and summaries from external sources.",
  },
  {
    href: "/forum",
    label: "Forum",
    text: "Read and join anonymous public discussion.",
  },
  {
    href: "/forum/new",
    label: "Start a thread",
    text: "Raise a question, claim, or view for public discussion.",
  },
  {
    href: "/explainers",
    label: "Explainers",
    text: "Shareable civic explainers for understanding the Finance Bill.",
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Open civic knowledge for Kenya</p>
          <h1>Understand the Finance Bill, then take part.</h1>
          <p>
            Kenyan Bill connects source documents, plain-language summaries,
            public participation guides, news, sourced answers, and anonymous
            discussion so citizens can move from reading to action.
          </p>
          <div className={styles.ctas}>
            <Link className={styles.primary} href="/finance-bill-2026">
              Explore Finance Bills
            </Link>
            <Link className={styles.secondary} href="/finance-bill-2026/summary">
              Read the Summary
            </Link>
          </div>
        </section>

        <section className={styles.quickLinks} aria-label="Core pages">
          {primaryRoutes.map((route) => (
            <Link href={route.href} key={route.href}>
              <span>{route.label}</span>
              <strong>{route.text}</strong>
            </Link>
          ))}
        </section>

        <section className={styles.linkBand} aria-labelledby="participate-title">
          <div className={styles.sectionIntro}>
            <p className={styles.kicker}>Participate</p>
            <h2 id="participate-title">Prepare and submit public views.</h2>
            <p>
              Move from understanding the bill to writing a clear, evidence-led
              submission before the relevant deadline.
            </p>
          </div>

          <div className={styles.routeGrid}>
            {actionRoutes.map((route) => (
              <Link href={route.href} key={route.href}>
                <span>{route.label}</span>
                <p>{route.text}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.linkBand} aria-labelledby="updates-title">
          <div className={styles.sectionIntro}>
            <p className={styles.kicker}>Follow the conversation</p>
            <h2 id="updates-title">News, explainers, and public discussion.</h2>
            <p>
              Keep moving between reported updates, citizen discussion, and
              source-grounded explanations without needing an account.
            </p>
          </div>

          <div className={styles.routeGrid}>
            {communityRoutes.map((route) => (
              <Link href={route.href} key={route.href}>
                <span>{route.label}</span>
                <p>{route.text}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

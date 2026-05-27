import Link from "next/link";
import { trackerTopics } from "./content";
import styles from "./topic-page.module.css";

type Topic = (typeof trackerTopics)[number];

export function TopicPage({ topic }: { topic: Topic }) {
  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/finance-bill-2026">
        Back to Finance Bills
      </Link>

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>{topic.eyebrow}</p>
          <h1>{topic.title}</h1>
          <p>{topic.description}</p>
        </div>

        <aside className={styles.status}>
          <p className={styles.kicker}>Verification status</p>
          <strong>Built for sourced updates</strong>
          <p>
            Specific claims will be filled from official bill text, committee
            notices, cited news, and public discussion once source documents are
            processed.
          </p>
        </aside>
      </section>

      <section className={styles.section}>
        <h2>What this page tracks</h2>
        <ul className={styles.list}>
          {topic.watchItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.sourceNote}>
        <h2>Public meaning</h2>
        <p>{topic.meaning}</p>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import styles from "../guide.module.css";

export const metadata: Metadata = {
  title: "Memoranda Templates",
  description:
    "Simple memorandum structures for citizens, businesses, youth groups, and communities responding to the Finance Bill 2026.",
};

const templates = [
  {
    title: "Individual citizen",
    lines: [
      "The issue I am responding to is...",
      "My position is...",
      "This affects me or my household because...",
      "I recommend...",
    ],
  },
  {
    title: "Small business",
    lines: [
      "Our business operates in...",
      "The proposal affects our costs, pricing, workers, or customers by...",
      "Our evidence or example is...",
      "We recommend...",
    ],
  },
  {
    title: "Youth or community group",
    lines: [
      "Our group represents...",
      "The issue affecting young people or our community is...",
      "The likely impact is...",
      "Our proposed solution is...",
    ],
  },
  {
    title: "County or sector view",
    lines: [
      "The affected county, sector, or value chain is...",
      "The proposal may change local costs, revenue, jobs, or services by...",
      "The evidence we want considered is...",
      "We request Parliament to...",
    ],
  },
];

export default function MemorandaPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/public-participation">
        Back to public participation
      </Link>

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Memoranda</p>
          <h1>Use a simple structure for written views.</h1>
          <p>
            These templates help citizens, businesses, groups, and counties turn
            their position into a readable memorandum.
          </p>
        </div>

        <aside className={styles.statusPanel}>
          <p className={styles.kicker}>Format note</p>
          <strong>Confirm official requirements</strong>
          <p>
            These are drafting aids. If Parliament publishes a required format,
            follow the official notice first.
          </p>
        </aside>
      </section>

      <section className={styles.section}>
        <p className={styles.sectionLabel}>Basic structure</p>
        <h2>Every memorandum should answer five questions.</h2>
        <div className={styles.cardGrid}>
          {[
            "What proposal are you responding to?",
            "Do you support, oppose, or want amendments?",
            "Who is affected and how?",
            "What evidence or example supports your view?",
            "What exact change do you recommend?",
          ].map((question, index) => (
            <article className={styles.card} key={question}>
              <span>Point {index + 1}</span>
              <strong>{question}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <p className={styles.sectionLabel}>Template starters</p>
        <h2>Choose the closest starting point.</h2>
        <div className={styles.templateGrid}>
          {templates.map((template) => (
            <article className={styles.template} key={template.title}>
              <span>Template</span>
              <strong>{template.title}</strong>
              <ul>
                {template.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.notice}>
        <h2>Need the process?</h2>
        <p>
          Use the{" "}
          <Link href="/public-participation/how-to-submit-views">
            submission guide
          </Link>{" "}
          to organize the steps, then check{" "}
          <Link href="/public-participation/deadlines">official deadlines</Link>{" "}
          before sending.
        </p>
      </section>
    </main>
  );
}

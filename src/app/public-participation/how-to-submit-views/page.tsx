import type { Metadata } from "next";
import Link from "next/link";
import styles from "../guide.module.css";

export const metadata: Metadata = {
  title: "How to Submit Views",
  description:
    "Step-by-step guide for preparing public participation views on the Finance Bill 2026.",
};

const steps = [
  {
    label: "Read the source",
    text: "Start with the bill, plain summary, or the specific proposal you care about.",
  },
  {
    label: "Choose a position",
    text: "Say whether you support it, oppose it, or want Parliament to amend it.",
  },
  {
    label: "Explain impact",
    text: "Describe how it affects your household, work, business, county, or community.",
  },
  {
    label: "Offer a fix",
    text: "Give a practical recommendation, alternative wording, or implementation concern.",
  },
  {
    label: "Use official channels",
    text: "Submit through the confirmed email, portal, address, or committee notice only.",
  },
  {
    label: "Keep evidence close",
    text: "Attach examples, figures, lived experience, or references where they help your point.",
  },
];

export default function HowToSubmitViewsPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/public-participation">
        Back to public participation
      </Link>

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>How to submit views</p>
          <h1>Turn a concern into a clear submission.</h1>
          <p>
            Use this guide to organize your point before sending views through
            the official public participation channel once it is confirmed.
          </p>
        </div>

        <aside className={styles.statusPanel}>
          <p className={styles.kicker}>Next step</p>
          <strong>Check the deadline page first</strong>
          <p>
            Submission channels and dates should come from official notices, not
            forwarded messages or screenshots.
          </p>
        </aside>
      </section>

      <section className={styles.section}>
        <p className={styles.sectionLabel}>Step-by-step</p>
        <h2>Build your submission in order.</h2>
        <div className={styles.cardGrid}>
          {steps.map((step, index) => (
            <article className={styles.card} key={step.label}>
              <span>Step {index + 1}</span>
              <strong>{step.label}</strong>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.notice}>
        <h2>Before sending</h2>
        <p>
          Confirm the deadline and submission channel on{" "}
          <Link href="/public-participation/deadlines">the deadlines page</Link>,
          then use the{" "}
          <Link href="/public-participation/memoranda">memoranda templates</Link>{" "}
          if you need a written structure.
        </p>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Explainers",
  description:
    "Plain-English explainers, sharing templates, and civic links for understanding Kenya's Finance Bill 2026.",
  alternates: {
    canonical: "/explainers",
  },
};

const explainerCards = [
  {
    title: "Why the Finance Bill matters",
    text: "Finance Bills can change taxes, fees, exemptions, public revenue, and the cost of everyday goods and services.",
  },
  {
    title: "Why public participation matters",
    text: "Public participation gives citizens, workers, businesses, and communities a formal way to question, support, reject, or improve proposals before they become law.",
  },
  {
    title: "How to read the Bill",
    text: "Start with the affected law, identify what is being inserted or deleted, then ask who pays, who benefits, and when the change begins.",
  },
];

const billSteps = [
  {
    title: "1. Publication",
    text: "The Bill is published so the public, Members of Parliament, civil society, businesses, and affected groups can read the proposals before debate.",
  },
  {
    title: "2. First Reading",
    text: "The Bill is introduced in the House. This is usually not the main debate stage; after First Reading, the Bill is referred to the relevant committee.",
  },
  {
    title: "3. Committee review and public participation",
    text: "The committee studies the Bill, receives memoranda, may hold hearings, and prepares a report. This is where public views can shape the record before later debate.",
  },
  {
    title: "4. Second Reading",
    text: "Members debate the principle and purpose of the Bill. If the House agrees, the Bill moves forward for detailed consideration.",
  },
  {
    title: "5. Committee Stage",
    text: "Members consider the Bill clause by clause. This is a key amendment stage because specific clauses can be changed, deleted, or added.",
  },
  {
    title: "6. Report Stage",
    text: "The House receives the Bill as considered in Committee Stage. Further changes may be reported before the Bill moves toward final approval.",
  },
  {
    title: "7. Third Reading",
    text: "This is the final approval stage in the House. Debate is usually narrower because most detailed changes should already have been handled.",
  },
  {
    title: "8. Presidential assent or referral",
    text: "If passed, the Bill is presented to the President. The President may assent, or refer it back to Parliament with reservations for reconsideration.",
  },
  {
    title: "9. Commencement",
    text: "After assent and publication, the law takes effect on the date stated in the Act. Some tax changes can have specific effective dates, so the commencement clause matters.",
  },
];

const amendmentPoints = [
  "A committee can recommend amendments after reviewing the Bill and public submissions.",
  "Members can propose changes during the clause-by-clause Committee Stage.",
  "The House can agree to, reject, or adjust amendments before final passage.",
  "If the President refers a Bill back, Parliament reconsiders the reservations and may pass it again under the constitutional process.",
];

const readingStatus = [
  {
    label: "Publication",
    value: "Use the uploaded PDF as the current source document.",
  },
  {
    label: "First Reading",
    value: "Track official Parliament notices; do not guess the date.",
  },
  {
    label: "Committee and public views",
    value: "Watch for committee calls for memoranda and hearing notices.",
  },
  {
    label: "Second and Third Reading",
    value: "Confirm from the Order Paper, Hansard, or Parliament updates.",
  },
];

const sharingTemplates = [
  {
    actionLabel: "Share on WhatsApp",
    href: `https://wa.me/?text=${encodeURIComponent(
      "The Finance Bill 2026 can affect taxes, prices, jobs, businesses, and public services. Read the Bill, ask questions, and take part in public participation before decisions are finalized. https://kenyanbill.co.ke/",
    )}`,
    title: "WhatsApp awareness post",
    body: "The Finance Bill 2026 can affect taxes, prices, jobs, businesses, and public services. Read the Bill, ask questions, and take part in public participation before decisions are finalized.",
  },
  {
    actionLabel: "Start forum thread",
    href: `/forum/new?title=${encodeURIComponent(
      "Which part of the Finance Bill 2026 needs the most attention?",
    )}&body=${encodeURIComponent(
      "Which part of the Finance Bill 2026 do you think needs the most public attention, and why? Mention the clause or sector if you can.",
    )}`,
    title: "Forum discussion prompt",
    body: "Which part of the Finance Bill 2026 do you think needs the most public attention, and why? Mention the clause or sector if you can.",
  },
  {
    actionLabel: "Open participation tools",
    href: "/public-participation",
    title: "Public participation reminder",
    body: "Public participation is not a formality. It is where citizens can submit views, propose changes, and demand clearer explanations on laws that affect them.",
  },
];

const civicLinks = [
  {
    href: "/finance-bill-2026/finance-bill-2026",
    label: "Finance Bill document page",
    text: "Read the hosted document and jump into source-backed sections.",
  },
  {
    href: "/ask",
    label: "Chat Finance Bill",
    text: "Ask plain-English questions answered from processed Bill chunks.",
  },
  {
    href: "/public-participation",
    label: "Public participation tools",
    text: "Create polls, vote, and track civic interest around issues.",
  },
  {
    href: "/news",
    label: "Kenya civic news links",
    text: "Follow external news summaries and open original publisher links.",
  },
  {
    href: "https://www.parliament.go.ke/",
    label: "Parliament of Kenya",
    text: "Official parliamentary information, committee notices, and public resources.",
  },
  {
    href: "https://www.parliament.go.ke/frequently-asked-questions",
    label: "Parliament legislative FAQs",
    text: "Official Parliament guidance on Bills, readings, committees, and the law-making process.",
  },
  {
    href: "https://www.parliament.go.ke/sites/default/files/2018-04/2_How_Law_is_Made.pdf",
    label: "How law is made fact sheet",
    text: "Parliament fact sheet explaining the law-making process in Kenya.",
  },
  {
    href: "https://www.klrc.go.ke/index.php/constitution-of-kenya/121-chapter-eight-the-legislature/125-part-4-procedures-for-enacting-legislation/283-115-presidential-assent-and-referral",
    label: "Presidential assent and referral",
    text: "Constitutional reference on what happens after a Bill is presented to the President.",
  },
  {
    href: "https://www.kra.go.ke/",
    label: "Kenya Revenue Authority",
    text: "Official tax guidance and public notices from KRA.",
  },
];

export default function ExplainersPage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>Explainers</p>
        <h1>Understand the Finance Bill before you react to it.</h1>
        <p>
          Plain-English guides, civic sharing templates, and reliable links for
          Kenyans who want to understand the Bill, explain it to others, and
          take part in public participation.
        </p>
        <div className={styles.actions}>
          <Link href="/finance-bill-2026/finance-bill-2026">
            Open Finance Bill page
          </Link>
          <Link href="/ask">Chat about the Bill</Link>
        </div>
      </header>

      <section className={styles.sourceBand}>
        <div>
          <p className={styles.sectionLabel}>Source-first</p>
          <h2>Built around the hosted Finance Bill document page.</h2>
        </div>
        <p>
          Explainers should stay tied to the source document. When a claim needs
          detail, users should be pushed back to the database-backed document
          page or the chat for source-backed answers.
          <Link href="/finance-bill-2026/finance-bill-2026">
            Read the Finance Bill source page
          </Link>
        </p>
      </section>

      <section className={styles.cardGrid}>
        {explainerCards.map((card) => (
          <article className={styles.card} key={card.title}>
            <span>{card.title}</span>
            <p>{card.text}</p>
          </article>
        ))}
      </section>

      <section className={styles.processSection}>
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>How the Bill becomes law</p>
          <h2>The readings, committee work, amendments, and assent.</h2>
          <p>
            The exact dates for each Finance Bill 2026 stage should be confirmed
            from official Parliament records. This explainer shows the normal
            journey so readers know what to watch for.
          </p>
        </div>
        <div className={styles.timeline}>
          {billSteps.map((step) => (
            <article className={styles.timelineItem} key={step.title}>
              <span>{step.title}</span>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.amendmentGrid}>
        <article className={styles.amendmentPanel}>
          <p className={styles.sectionLabel}>How amendments happen</p>
          <h2>Most serious changes happen after scrutiny.</h2>
          <ul>
            {amendmentPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
        <article className={styles.statusPanel}>
          <p className={styles.sectionLabel}>What to track</p>
          <h2>Dates should come from official notices.</h2>
          <dl>
            {readingStatus.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </article>
      </section>

      <section className={styles.templates}>
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>Sharing templates</p>
          <h2>Simple messages people can reuse.</h2>
          <p>
            These are designed for awareness, not propaganda. They should
            encourage reading, questioning, and participation.
          </p>
        </div>
        <div className={styles.templateList}>
          {sharingTemplates.map((template) => (
            <article className={styles.templateCard} key={template.title}>
              <h3>{template.title}</h3>
              <p>{template.body}</p>
              {template.href.startsWith("http") ? (
                <a href={template.href} rel="noreferrer" target="_blank">
                  {template.actionLabel}
                </a>
              ) : (
                <Link href={template.href}>{template.actionLabel}</Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.linksSection}>
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>Relevant links</p>
          <h2>Where to go next.</h2>
        </div>
        <div className={styles.linkList}>
          {civicLinks.map((link) => {
            const isExternal = link.href.startsWith("http");

            return isExternal ? (
              <a
                className={styles.linkCard}
                href={link.href}
                key={link.href}
                rel="noreferrer"
                target="_blank"
              >
                <span>{link.label}</span>
                <p>{link.text}</p>
              </a>
            ) : (
              <Link className={styles.linkCard} href={link.href} key={link.href}>
                <span>{link.label}</span>
                <p>{link.text}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

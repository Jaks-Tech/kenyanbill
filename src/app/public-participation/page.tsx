import type { Metadata } from "next";
import Link from "next/link";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import {
  listOpenPublicPolls,
  listRecentPublicPollVotes,
} from "@/lib/public-participation/queries";
import { PollActivityChart } from "./PollActivityChart";
import { PublicPolls } from "./PublicPolls";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Public Participation",
  description:
    "A practical guide for Kenyans preparing public participation views on the Finance Bill 2026.",
  alternates: {
    canonical: "/public-participation",
  },
};

export const dynamic = "force-dynamic";

const guideLinks = [
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

export default async function PublicParticipationPage() {
  const [{ polls }, { votes }] = await Promise.all([
    listOpenPublicPolls(),
    listRecentPublicPollVotes(),
  ]);

  return (
    <div className={styles.page}>
      <RealtimeRefresh table="public_polls" />
      <RealtimeRefresh table="public_poll_options" />
      <RealtimeRefresh table="public_poll_votes" />
      <header className={styles.hero}>
        <p className={styles.kicker}>Public participation</p>
        <h1>Prepare your official views on the Finance Bill 2026.</h1>
        <p>
          Start a 24-hour public poll, vote anonymously, and turn public
          opinion into clearer participation points.
        </p>
      </header>

      <section className={styles.grid} aria-label="Public participation guides">
        {guideLinks.map((link) => (
          <Link className={styles.card} href={link.href} key={link.href}>
            <span>{link.label}</span>
            <p>{link.text}</p>
          </Link>
        ))}
      </section>

      <section className={styles.toolSection}>
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>Live polls</p>
          <h2>Create a poll and let others vote.</h2>
          <p>
            Each poll opens immediately, runs for 24 hours, and shows results as
            a live graph while people vote.
          </p>
        </div>
        <PublicPolls polls={polls} />
      </section>

      <PollActivityChart polls={polls} votes={votes} />
    </div>
  );
}

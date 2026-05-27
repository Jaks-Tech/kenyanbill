import type { Metadata } from "next";
import { trackerTopics } from "../content";
import { TopicPage } from "../TopicPage";

const topic = trackerTopics.find((item) => item.slug === "tax-proposals")!;

export const metadata: Metadata = {
  title: "Finance Bill Tax Proposals",
  description: topic.description,
  alternates: {
    canonical: "/finance-bill-2026/tax-proposals",
  },
};

export default function TaxProposalsPage() {
  return <TopicPage topic={topic} />;
}

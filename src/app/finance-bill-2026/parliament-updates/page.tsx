import type { Metadata } from "next";
import { trackerTopics } from "../content";
import { TopicPage } from "../TopicPage";

const topic = trackerTopics.find((item) => item.slug === "parliament-updates")!;

export const metadata: Metadata = {
  title: "Finance Bill Parliament Updates",
  description: topic.description,
  alternates: {
    canonical: "/finance-bill-2026/parliament-updates",
  },
};

export default function ParliamentUpdatesPage() {
  return <TopicPage topic={topic} />;
}

import type { Metadata } from "next";
import { trackerTopics } from "../content";
import { TopicPage } from "../TopicPage";

const topic = trackerTopics.find((item) => item.slug === "public-participation")!;

export const metadata: Metadata = {
  title: "Finance Bill Public Participation",
  description: topic.description,
  alternates: {
    canonical: "/finance-bill-2026/public-participation",
  },
};

export default function PublicParticipationTopicPage() {
  return <TopicPage topic={topic} />;
}

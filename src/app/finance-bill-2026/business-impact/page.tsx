import type { Metadata } from "next";
import { trackerTopics } from "../content";
import { TopicPage } from "../TopicPage";

const topic = trackerTopics.find((item) => item.slug === "business-impact")!;

export const metadata: Metadata = {
  title: "Finance Bill Business Impact",
  description: topic.description,
  alternates: {
    canonical: "/finance-bill-2026/business-impact",
  },
};

export default function BusinessImpactPage() {
  return <TopicPage topic={topic} />;
}

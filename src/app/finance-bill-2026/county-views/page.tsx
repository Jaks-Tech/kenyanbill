import type { Metadata } from "next";
import { trackerTopics } from "../content";
import { TopicPage } from "../TopicPage";

const topic = trackerTopics.find((item) => item.slug === "county-views")!;

export const metadata: Metadata = {
  title: "Finance Bill County Views",
  description: topic.description,
  alternates: {
    canonical: "/finance-bill-2026/county-views",
  },
};

export default function CountyViewsPage() {
  return <TopicPage topic={topic} />;
}

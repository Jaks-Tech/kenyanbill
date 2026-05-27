import type { Metadata } from "next";
import { trackerTopics } from "../content";
import { TopicPage } from "../TopicPage";

const topic = trackerTopics.find((item) => item.slug === "household-impact")!;

export const metadata: Metadata = {
  title: "Finance Bill Household Impact",
  description: topic.description,
  alternates: {
    canonical: "/finance-bill-2026/household-impact",
  },
};

export default function HouseholdImpactPage() {
  return <TopicPage topic={topic} />;
}

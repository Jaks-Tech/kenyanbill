import type { MetadataRoute } from "next";
import { listPublishedFinanceBillDocuments } from "@/lib/supabase/server";
import { listPublishedNews } from "@/lib/news/aggregator";
import { listForumThreads } from "@/lib/forum/queries";
import { listPollAnalyses } from "@/lib/public-participation/analysis";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://kenyanbill.co.ke";

  // Main pages
  const mainPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/finance-bill-2026`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/ask`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/public-participation`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/public-participation/analysis`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/forum/new`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/public-participation/how-to-submit-views`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/public-participation/memoranda`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/public-participation/deadlines`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/explainers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ];

  // Finance Bill documents
  let documentPages: MetadataRoute.Sitemap = [];
  try {
    const { documents } = await listPublishedFinanceBillDocuments();
    documentPages = documents.map((doc) => ({
      url: `${baseUrl}/finance-bill-2026/${doc.slug}`,
      lastModified: new Date(doc.published_at || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch (error) {
    console.error("Failed to fetch documents for sitemap:", error);
  }

  // News articles
  let newsPages: MetadataRoute.Sitemap = [];
  try {
    const { articles } = await listPublishedNews();
    newsPages = articles.map((article) => ({
      url: `${baseUrl}/news/${article.slug}`,
      lastModified: new Date(article.published_at || new Date()),
      changeFrequency: "monthly" as const,
      priority: article.tags?.includes("breaking") ? 0.85 : 0.75,
    }));
  } catch (error) {
    console.error("Failed to fetch news for sitemap:", error);
  }

  // Forum threads
  let forumPages: MetadataRoute.Sitemap = [];
  try {
    const { threads } = await listForumThreads();
    forumPages = threads.map((thread) => ({
      url: `${baseUrl}/forum/thread/${thread.slug}`,
      lastModified: new Date(thread.created_at || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
  } catch (error) {
    console.error("Failed to fetch forum threads for sitemap:", error);
  }

  // Analysis reports
  let analysisPages: MetadataRoute.Sitemap = [];
  try {
    const { analyses } = await listPollAnalyses(100);
    analysisPages = analyses.map((analysis) => ({
      url: `${baseUrl}/public-participation/analysis/${analysis.slug}`,
      lastModified: new Date(analysis.analyzed_at || new Date()),
      changeFrequency: "monthly" as const,
      priority: 0.85,
    }));
  } catch (error) {
    console.error("Failed to fetch analyses for sitemap:", error);
  }

  return [
    ...mainPages,
    ...documentPages,
    ...newsPages,
    ...forumPages,
    ...analysisPages,
  ];
}

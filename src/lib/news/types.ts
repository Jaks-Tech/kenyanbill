export type NewsArticle = {
  id: string;
  slug: string;
  title: string;
  source_name: string | null;
  source_url: string | null;
  original_url: string | null;
  external_id: string | null;
  summary: string | null;
  excerpt: string | null;
  tags: string[];
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NewsSource = {
  id: string;
  name: string;
  feed_url: string;
  source_url: string | null;
  source_type: string;
  active: boolean;
};

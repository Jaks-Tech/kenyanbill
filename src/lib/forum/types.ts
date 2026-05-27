export type ForumThread = {
  id: string;
  slug: string;
  thread_type: string;
  title: string;
  body: string;
  category: string;
  anonymous_name: string;
  anonymous_session_id: string | null;
  ai_generated: boolean;
  status: string;
  like_count: number;
  comment_count: number;
  score: number;
  created_at: string;
  updated_at: string;
};

export type ForumComment = {
  id: string;
  thread_id: string;
  parent_comment_id: string | null;
  body: string;
  anonymous_name: string;
  anonymous_session_id: string | null;
  is_ai_response: boolean;
  ai_sources: unknown[];
  status: string;
  like_count: number;
  reply_count: number;
  created_at: string;
};

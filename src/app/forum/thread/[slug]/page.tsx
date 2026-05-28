import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { getForumThreadBySlug } from "@/lib/forum/queries";
import {
  CollapsibleReplyForm,
  CommentForm,
  LikeButton,
  ReportButton,
  VerifyButton,
} from "../../ForumForms";
import styles from "../../forum.module.css";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { thread } = await getForumThreadBySlug(slug);

  return {
    title: thread ? thread.title : "Forum Thread",
    description:
      thread?.body.slice(0, 150) ??
      "Anonymous Kenyan Bill forum discussion.",
  };
}

export default async function ForumThreadPage({ params }: PageProps) {
  const { slug } = await params;
  const { thread, comments, error } = await getForumThreadBySlug(slug);

  if (!thread || error) {
    notFound();
  }

  const topLevel = comments.filter((comment) => !comment.parent_comment_id);
  const replies = comments.filter((comment) => comment.parent_comment_id);

  return (
    <div className={styles.page}>
      <RealtimeRefresh
        filter={`thread_id=eq.${thread.id}`}
        table="forum_comments"
      />
      <RealtimeRefresh filter={`id=eq.${thread.id}`} table="forum_threads" />
      <article className={styles.threadHero}>
        <p className={styles.kicker}>{thread.category}</p>
        <h1>{thread.title}</h1>
        <div className={styles.meta}>
          <span>{thread.anonymous_name}</span>
          <span>{thread.like_count} likes</span>
          <span>{thread.comment_count} comments</span>
        </div>
        <div className={styles.threadBody}>
          <MarkdownContent content={thread.body} />
        </div>
        <div className={styles.threadFooter}>
          <Link href="/forum">Back to forum</Link>
          <LikeButton
            targetId={thread.id}
            targetType="thread"
            threadSlug={thread.slug}
          />
          <ReportButton
            targetId={thread.id}
            targetType="thread"
            threadSlug={thread.slug}
          />
          <VerifyButton
            body={`${thread.title}\n\n${thread.body}`}
            targetId={thread.id}
            targetType="thread"
            threadId={thread.id}
            threadSlug={thread.slug}
          />
        </div>
      </article>

      <section className={styles.mainCommentBox}>
        <CommentForm
          buttonLabel="Post comment"
          label="Comment on the main topic"
          placeholder="Share your view on this discussion topic."
          threadId={thread.id}
          threadSlug={thread.slug}
        />
      </section>

      <section className={styles.comments}>
        {topLevel.map((comment) => (
          <article
            className={styles.comment}
            data-ai={comment.is_ai_response}
            key={comment.id}
          >
            <div className={styles.commentHeader}>
              <strong>{comment.anonymous_name}</strong>
              {comment.is_ai_response ? <span>Source-grounded reply</span> : null}
            </div>
            {comment.is_ai_response ? (
              <MarkdownContent
                content={linkForumSources(comment.body, comment.ai_sources)}
              />
            ) : (
              <MarkdownContent content={comment.body} />
            )}
            <div className={styles.commentFooter}>
              <span>{comment.like_count} likes</span>
              <LikeButton
                targetId={comment.id}
                targetType="comment"
                threadSlug={thread.slug}
              />
              <ReportButton
                targetId={comment.id}
                targetType="comment"
                threadSlug={thread.slug}
              />
              {!comment.is_ai_response ? (
                <VerifyButton
                  body={comment.body}
                  targetId={comment.id}
                  targetType="comment"
                  threadId={thread.id}
                  threadSlug={thread.slug}
                />
              ) : null}
            </div>
            <CollapsibleReplyForm
              parentCommentId={comment.id}
              threadId={thread.id}
              threadSlug={thread.slug}
            />
            {replies
              .filter((reply) => reply.parent_comment_id === comment.id)
              .map((reply) => (
                <article
                  className={`${styles.comment} ${styles.reply}`}
                  data-ai={reply.is_ai_response}
                  key={reply.id}
                >
                  <div className={styles.commentHeader}>
                    <strong>{reply.anonymous_name}</strong>
                    {reply.is_ai_response ? (
                      <span>Source-grounded reply</span>
                    ) : null}
                  </div>
                  {reply.is_ai_response ? (
                    <MarkdownContent
                      content={linkForumSources(reply.body, reply.ai_sources)}
                    />
                  ) : (
                    <MarkdownContent content={reply.body} />
                  )}
                  <div className={styles.commentFooter}>
                    <span>{reply.like_count} likes</span>
                    <LikeButton
                      targetId={reply.id}
                      targetType="comment"
                      threadSlug={thread.slug}
                    />
                    <ReportButton
                      targetId={reply.id}
                      targetType="comment"
                      threadSlug={thread.slug}
                    />
                    {!reply.is_ai_response ? (
                      <VerifyButton
                        body={reply.body}
                        targetId={reply.id}
                        targetType="comment"
                        threadId={thread.id}
                        threadSlug={thread.slug}
                      />
                    ) : null}
                  </div>
                </article>
              ))}
          </article>
        ))}
      </section>
    </div>
  );
}

function linkForumSources(content: string, sources: unknown[]) {
  return content.replace(/\[Source\s+(\d+)\]/gi, (match, sourceNumber) => {
    const source = sources[Number(sourceNumber) - 1] as
      | Record<string, unknown>
      | undefined;
    const chunkId = typeof source?.chunk_id === "string" ? source.chunk_id : null;
    const documentSlug =
      typeof source?.document_slug === "string" ? source.document_slug : null;

    if (!chunkId || !documentSlug) {
      return match;
    }

    return `[${match}](/finance-bill-2026/${documentSlug}?source=${chunkId}#source-highlight)`;
  });
}

"use client";

import { AnonymousFields } from "@/components/AnonymousFields";
import {
  createForumComment,
  createForumThread,
  likeForumTarget,
  reportForumTarget,
  verifyForumTarget,
} from "./actions";
import styles from "./forum.module.css";

export function NewThreadForm({
  initialBody = "",
  initialTitle = "",
}: {
  initialBody?: string;
  initialTitle?: string;
}) {
  return (
    <form action={createForumThread} className={styles.form}>
      <AnonymousFields />
      <label>
        Title
        <input
          defaultValue={initialTitle}
          name="title"
          placeholder="What should Kenyans discuss?"
          required
        />
      </label>
      <label>
        Category
        <select name="category" defaultValue="general">
          <option value="general">General</option>
          <option value="taxation">Taxation</option>
          <option value="transport">Transport and fuel</option>
          <option value="business">Business</option>
          <option value="cost-of-living">Cost of living</option>
          <option value="public-participation">Public participation</option>
        </select>
      </label>
      <label>
        Your view or question
        <textarea
          defaultValue={initialBody}
          name="body"
          placeholder="Share your view. You can ask @kenyanbill is this true?"
          required
          rows={7}
        />
      </label>
      <button type="submit">Post anonymously</button>
    </form>
  );
}

export function CommentForm({
  buttonLabel = "Post comment",
  compact = false,
  label = "Comment on this topic",
  parentCommentId,
  placeholder = "Share your view on the main topic.",
  threadId,
  threadSlug,
}: {
  buttonLabel?: string;
  compact?: boolean;
  label?: string;
  parentCommentId?: string;
  placeholder?: string;
  threadId: string;
  threadSlug: string;
}) {
  return (
    <form
      action={createForumComment}
      className={compact ? styles.compactCommentForm : styles.commentForm}
    >
      <AnonymousFields />
      <input name="thread_id" type="hidden" value={threadId} />
      <input name="thread_slug" type="hidden" value={threadSlug} />
      <input name="parent_comment_id" type="hidden" value={parentCommentId ?? ""} />
      {!compact ? <label>{label}</label> : null}
      <textarea
        name="body"
        placeholder={placeholder}
        required
        rows={compact ? 2 : 4}
      />
      <button type="submit">{buttonLabel}</button>
    </form>
  );
}

export function CollapsibleReplyForm({
  parentCommentId,
  threadId,
  threadSlug,
}: {
  parentCommentId: string;
  threadId: string;
  threadSlug: string;
}) {
  return (
    <details className={styles.replyDetails}>
      <summary aria-label="Reply to this comment">↩ Reply</summary>
      <CommentForm
        buttonLabel="Post reply"
        compact
        label="Reply to this comment"
        parentCommentId={parentCommentId}
        placeholder="Reply to this person anonymously."
        threadId={threadId}
        threadSlug={threadSlug}
      />
    </details>
  );
}

export function LikeButton({
  targetId,
  targetType,
  threadSlug,
}: {
  targetId: string;
  targetType: "thread" | "comment";
  threadSlug?: string;
}) {
  return (
    <form action={likeForumTarget}>
      <AnonymousFields />
      <input name="target_type" type="hidden" value={targetType} />
      <input name="target_id" type="hidden" value={targetId} />
      <input name="thread_slug" type="hidden" value={threadSlug ?? ""} />
      <button className={styles.inlineButton} type="submit">
        Like
      </button>
    </form>
  );
}

export function ReportButton({
  targetId,
  targetType,
  threadSlug,
}: {
  targetId: string;
  targetType: "thread" | "comment";
  threadSlug?: string;
}) {
  return (
    <form action={reportForumTarget}>
      <AnonymousFields />
      <input name="target_type" type="hidden" value={targetType} />
      <input name="target_id" type="hidden" value={targetId} />
      <input name="thread_slug" type="hidden" value={threadSlug ?? ""} />
      <input name="reason" type="hidden" value="Community report" />
      <button className={styles.inlineButton} type="submit">
        Report
      </button>
    </form>
  );
}

export function VerifyButton({
  body,
  targetId,
  targetType,
  threadId,
  threadSlug,
}: {
  body: string;
  targetId: string;
  targetType: "thread" | "comment";
  threadId: string;
  threadSlug: string;
}) {
  return (
    <form action={verifyForumTarget}>
      <input name="thread_id" type="hidden" value={threadId} />
      <input name="thread_slug" type="hidden" value={threadSlug} />
      <input name="target_type" type="hidden" value={targetType} />
      <input name="target_id" type="hidden" value={targetId} />
      <input name="body" type="hidden" value={body} />
      <button className={styles.inlineButton} type="submit">
        Verify from sources
      </button>
    </form>
  );
}

import type { Metadata } from "next";
import { NewThreadForm } from "../ForumForms";
import styles from "../forum.module.css";

export const metadata: Metadata = {
  title: "Start a Forum Thread",
  description: "Start an anonymous Kenyan Bill forum discussion.",
};

type NewForumThreadPageProps = {
  searchParams: Promise<{
    body?: string;
    title?: string;
  }>;
};

export default async function NewForumThreadPage({
  searchParams,
}: NewForumThreadPageProps) {
  const params = await searchParams;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Start a thread</p>
        <h1>Post a question or view anonymously.</h1>
        <p>
          Your public name will be anonymous. Mention @kenyanbill if you want
          a source-grounded reply.
        </p>
      </header>
      <NewThreadForm initialBody={params.body} initialTitle={params.title} />
    </div>
  );
}

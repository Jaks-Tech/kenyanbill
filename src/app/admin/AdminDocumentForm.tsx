"use client";

import { useState } from "react";
import { uploadFinanceBillDocument } from "./actions";
import styles from "./page.module.css";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminDocumentForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [sourceName, setSourceName] = useState("");

  function generateFields() {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return;
    }

    const generatedSlug = slugify(cleanTitle);

    setSlug((current) => current || generatedSlug);
    setDescription(
      (current) =>
        current ||
        `Read ${cleanTitle}, view the source PDF, and follow related public discussion on Kenyan Bill.`,
    );
    setSummary(
      (current) =>
        current ||
        `A verified plain-language summary for ${cleanTitle} will appear here after the document is reviewed and processed for RAG.`,
    );
    setSourceName((current) => current || "Official source");
  }

  return (
    <form action={uploadFinanceBillDocument} className={styles.form}>
      <div className={styles.formHeader}>
        <div>
          <p className={styles.sectionLabel}>Load document</p>
          <h2>Upload a PDF source</h2>
        </div>
        <button
          className={styles.generateButton}
          disabled={!title.trim()}
          onClick={generateFields}
          type="button"
        >
          Generate fields
        </button>
      </div>

      <label>
        Title
        <input
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Finance Bill 2026"
          required
          type="text"
          value={title}
        />
      </label>

      <label>
        Slug
        <input
          name="slug"
          onChange={(event) => setSlug(event.target.value)}
          placeholder="finance-bill-2026"
          type="text"
          value={slug}
        />
      </label>

      <label>
        Description
        <textarea
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short public description for this document page."
          rows={3}
          value={description}
        />
      </label>

      <label>
        Summary
        <textarea
          name="summary"
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Optional plain-language summary. AI-generated summaries can be added later."
          rows={5}
          value={summary}
        />
      </label>

      <div className={styles.twoColumn}>
        <label>
          Source name
          <input
            name="source_name"
            onChange={(event) => setSourceName(event.target.value)}
            placeholder="National Treasury"
            value={sourceName}
          />
        </label>
        <label>
          Published date
          <input name="published_at" type="date" />
        </label>
      </div>

      <label>
        Source URL
        <input name="source_url" placeholder="https://..." type="url" />
      </label>

      <div className={styles.twoColumn}>
        <label>
          Status
          <select name="status" defaultValue="published">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>
        <label>
          PDF file
          <input accept="application/pdf" name="pdf" type="file" />
        </label>
      </div>

      <button type="submit">Save document</button>
    </form>
  );
}

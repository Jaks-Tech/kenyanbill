"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./MobilePdfViewer.module.css";

type MobilePdfViewerProps = {
  title: string;
  url: string;
};

export function MobilePdfViewer({ title, url }: MobilePdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void; promise: Promise<void> } | null>(
    null,
  );
  const [document, setDocument] = useState<any>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState("Loading PDF...");
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => void; promise: Promise<any> } | null = null;

    setStatus("Loading PDF...");

    async function loadDocument() {
      const pdfjsLib = await import("pdfjs-dist");

      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url,
      ).toString();

      loadingTask = pdfjsLib.getDocument(url);
      const loadedDocument = await loadingTask.promise;

      if (cancelled) {
        loadedDocument.destroy();
        return;
      }

      setDocument(loadedDocument);
      setPageCount(loadedDocument.numPages);
      setStatus("");
    }

    loadDocument()
      .catch(() => {
        if (cancelled) {
          return;
        }
        setStatus("The PDF could not be loaded in the mobile viewer.");
      });

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [url]);

  useEffect(() => {
    if (!document || !canvasRef.current) {
      return;
    }

    let cancelled = false;

    async function renderPage() {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      renderTaskRef.current?.cancel();

      const page = await document!.getPage(pageNumber);
      const containerWidth = Math.min(window.innerWidth - 32, 760);
      const baseViewport = page.getViewport({ scale: 1 });
      const nextScale = Math.max(containerWidth / baseViewport.width, 0.7);
      const viewport = page.getViewport({ scale: nextScale * scale });
      const context = canvas.getContext("2d");

      if (!context || cancelled) {
        return;
      }

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
      });

      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch (error) {
        if (!cancelled && (error as Error).name !== "RenderingCancelledException") {
          setStatus("This page could not be rendered.");
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [document, pageNumber, scale]);

  return (
    <div className={styles.viewer} aria-label={`${title} mobile PDF viewer`}>
      <div className={styles.toolbar}>
        <button
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber((current) => Math.max(current - 1, 1))}
          type="button"
        >
          Prev
        </button>
        <span>
          Page {pageNumber} {pageCount ? `of ${pageCount}` : ""}
        </span>
        <button
          disabled={!pageCount || pageNumber >= pageCount}
          onClick={() =>
            setPageNumber((current) => Math.min(current + 1, pageCount))
          }
          type="button"
        >
          Next
        </button>
      </div>

      <div className={styles.zoom}>
        <button
          disabled={scale <= 0.8}
          onClick={() => setScale((current) => Math.max(current - 0.2, 0.8))}
          type="button"
        >
          -
        </button>
        <span>{Math.round(scale * 100)}%</span>
        <button
          disabled={scale >= 1.8}
          onClick={() => setScale((current) => Math.min(current + 0.2, 1.8))}
          type="button"
        >
          +
        </button>
      </div>

      {status ? <p className={styles.status}>{status}</p> : null}
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

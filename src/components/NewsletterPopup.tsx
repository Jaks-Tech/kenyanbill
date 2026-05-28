"use client";

import { useState, useEffect, useTransition } from "react";
import { subscribeNewsletter } from "@/lib/newsletter/actions";
import styles from "./NewsletterPopup.module.css";

export function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Default to true to prevent hydration mismatch, set false in effect
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem("newsletterDismissed");
    if (!dismissed) {
      setIsDismissed(false);
      // Show popup after 5 seconds to not overwhelm the user immediately
      const timer = setTimeout(() => setIsVisible(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem("newsletterDismissed", "true");
  };

  const handleSubscribe = (formData: FormData) => {
    startTransition(async () => {
      const result = await subscribeNewsletter(formData);
      setStatus({
        type: result.success ? "success" : "error",
        message: result.message,
      });

      if (result.success) {
        localStorage.setItem("newsletterDismissed", "true");
        setTimeout(() => setIsVisible(false), 3000);
      }
    });
  };

  if (isDismissed && !isVisible) return null;

  return (
    <div className={styles.popupWrapper} data-visible={isVisible}>
      <button onClick={dismiss} className={styles.closeButton} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <h3 className={styles.title}>Stay Updated</h3>
      <p className={styles.description}>
        Get notified about new public polls, daily sentiment analysis, and the latest Finance Bill news directly to your inbox.
      </p>

      <form action={handleSubscribe} className={styles.form}>
        <input 
          type="email" 
          name="email" 
          placeholder="your.email@example.com" 
          required 
          className={styles.input}
          disabled={isPending || status?.type === "success"}
        />
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isPending || status?.type === "success"}
        >
          {isPending ? "Subscribing..." : "Subscribe"}
        </button>
      </form>

      {status && (
        <p className={`${styles.message} ${styles[status.type]}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}
